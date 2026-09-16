/**
 * f-track — แกะใบรายการสั่งสินค้า Freshket ทุกใบ → รายการวัตถุดิบจริงรายชิ้น
 *
 * ที่มาไฟล์: `scripts/finance/fetch_freshket_pdfs.mjs` (เบราว์เซอร์ที่ล็อกอินดึง PDF → Supabase → เครื่องนี้)
 *
 * ⚠️ ตรงข้ามกับ GO: ไฟล์ Freshket ต้องใช้ `-layout` **ไม่ใช่ `-raw`**
 *    (raw ทำให้แถวสินค้าหายหมด เพราะเป็นตารางที่ raw ยุบทิ้ง)
 *
 * รูปแบบบรรทัดสินค้า:
 *   ลำดับ. รหัส ชื่อสินค้า+ขนาดบรรจุ  จำนวน หน่วยแพ็ค ราคา/แพ็ค  น้ำหนัก หน่วยชั่ง ราคา/หน่วย ภาษี ยอดรวม
 *   ตัวอย่าง: `4. 31112 อกไก่ติดหนัง 1 กก./แพ็ค  10.00 แพ็ค  72.00 10.00 กิโลกรัม  72.00 NO  720.00`
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PDFTOTEXT = 'C:/Program Files/Git/mingw64/bin/pdftotext.exe';
const DIR = 'finance/raw/freshket_orders';
const TXN = /^\s*(\d+)\.\s+(\d{3,6})\s+(.+?)\s{2,}([\d,]+\.\d{2})\s+(\S+)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+(\S+)\s+([\d,]+\.\d{2})\s+(NO|VAT)\s+([\d,]+\.\d{2})\s*$/;
const num = (s) => +String(s).replace(/,/g, '');

export function parseFile(file) {
  let raw = '';
  try {
    raw = execFileSync(PDFTOTEXT, ['-layout', '-enc', 'UTF-8', file, '-'], { encoding: 'utf8', maxBuffer: 32e6, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { raw = e.stdout || ''; }

  const po = (/เลขที่\s+(CO-\S+)/.exec(raw) || [])[1] || path.basename(file, '.pdf');
  // วันที่: ใบส่วนใหญ่มี "วันรับสินค้า" แต่บางใบมีแค่ "วันที่" (วันที่ออกบิล)
  const dm = /วันรับสินค้า[^\d]{0,6}(\d{2})-(\d{2})-(\d{4})/.exec(raw)
        || /วันที่\s+(\d{2})-(\d{2})-(\d{4})/.exec(raw);
  const date = dm ? `${dm[3]}-${dm[2]}-${dm[1]}` : '';
  const grand = num((/จำนวนเงินรวม\S*\s+([\d,]+\.\d{2})/.exec(raw) || [])[1] || 0);

  const items = [];
  const L = raw.split('\n');
  for (let i = 0; i < L.length; i++) {
    // ⚠️ บางใบแถวสินค้าตัดขึ้นบรรทัดใหม่ (คอลัมน์ท้ายไปอยู่บรรทัดถัดไป) → ต่อบรรทัดก่อนแมตช์
    let line = L[i], m = TXN.exec(line);
    // บางใบคอลัมน์ท้ายตัดขึ้นบรรทัดใหม่ → ต่อบรรทัดถัดไป "หนึ่งบรรทัดเท่านั้น" แล้วลองใหม่
    if (!m && /^\s*\d+\.\s+\d{3,6}\s/.test(line) && i + 1 < L.length && /^\s*[\d,.]+\s/.test(L[i + 1])) {
      const j = line.replace(/\s+$/, '') + '  ' + L[i + 1].trim();
      m = TXN.exec(j);
      if (m) i += 1;
    }
    if (!m) continue;
    // ชื่อสินค้ามักมีขนาดบรรจุต่อท้าย เช่น "อกไก่ติดหนัง 1 กก./แพ็ค" → แยกออก
    const full = m[3].trim();
    const cut = /^(.*?)\s+([\d.,]+\s*(?:กก\.|กรัม|ก\.|ลิตร|มล\.|ฟอง|ชิ้น)\S*\/\S+)$/.exec(full);
    items.push({
      po, date, sku: m[2],
      name: cut ? cut[1].trim() : full,
      pack: cut ? cut[2] : '',
      qty: num(m[4]), packUnit: m[5], packPrice: num(m[6]),
      weight: num(m[7]), weightUnit: m[8], unitPrice: num(m[9]),
      vat: m[10], total: num(m[11]),
    });
  }
  return { file: path.basename(file), po, date, items, grand };
}

function main() {
  const files = fs.readdirSync(DIR).filter((f) => /\.pdf$/i.test(f)).sort();
  const all = files.map((f) => parseFile(path.join(DIR, f)));
  const rows = all.flatMap((r) => r.items);
  const b = (n) => Math.round(n).toLocaleString('en-US');
  const bad = all.filter((r) => !r.items.length);

  console.log(`\n🥬 ใบสั่งซื้อ Freshket ${all.length} ใบ · รายการสินค้า ${rows.length} บรรทัด`);
  if (bad.length) console.log(`   ⚠️ แกะไม่ได้ ${bad.length} ใบ: ${bad.slice(0, 5).map((x) => x.po).join(', ')}`);
  let ok = 0;
  for (const r of all) {
    const s = r.items.reduce((a, x) => a + x.total, 0);
    if (r.grand && Math.abs(s - r.grand) / r.grand < 0.15) ok++;
  }
  console.log(`   ✅ ยอดรวมรายชิ้นตรงกับยอดในใบ ${ok}/${all.length} ใบ`);

  const months = [...new Set(rows.map((r) => r.date.slice(0, 7)))].filter(Boolean).sort();
  console.log('\nเดือน   | ใบ | รายการ |     ยอดรวม');
  for (const m of months) {
    const g = rows.filter((r) => r.date.startsWith(m));
    console.log(`${m} | ${String(new Set(g.map((x) => x.po)).size).padStart(2)} | ${String(g.length).padStart(6)} | ${b(g.reduce((a, x) => a + x.total, 0)).padStart(10)}`);
  }

  const byItem = new Map();
  for (const r of rows) {
    const e = byItem.get(r.sku) || { name: r.name, pack: r.pack, unit: r.weightUnit, n: 0, qty: 0, baht: 0, price: r.unitPrice };
    e.n++; e.qty += r.weight || r.qty; e.baht += r.total; e.price = r.unitPrice;
    byItem.set(r.sku, e);
  }
  const list = [...byItem].sort((a, c) => c[1].baht - a[1].baht);
  console.log(`\n🛒 ของที่สั่งจาก Freshket จริง ${list.length} ชนิด — 20 อันดับที่ใช้เงินสูงสุด`);
  for (const [sku, v] of list.slice(0, 20))
    console.log(`   ${b(v.baht).padStart(8)}  ${String(v.n).padStart(3)} ครั้ง  ${String(v.price).padStart(7)}/${v.unit.slice(0, 6).padEnd(7)} ${v.name.slice(0, 40)}`);

  fs.mkdirSync('finance/out', { recursive: true });
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  fs.writeFileSync('finance/out/freshket_order_items.csv',
    '\ufeff' + ['วันที่,เลขที่บิล,รหัสสินค้า,สินค้า,ขนาดบรรจุ,จำนวนแพ็ค,น้ำหนัก,หน่วย,ราคาต่อหน่วย,ราคารวม']
      .concat(rows.map((r) => [r.date, r.po, r.sku, esc(r.name), esc(r.pack), r.qty, r.weight, r.weightUnit, r.unitPrice, r.total].join(','))).join('\n'), 'utf8');
  fs.writeFileSync('finance/out/freshket_items_summary.csv',
    '\ufeff' + ['รหัสสินค้า,สินค้า,ขนาดบรรจุ,หน่วย,สั่งกี่ครั้ง,ปริมาณรวม,ราคาต่อหน่วยล่าสุด,ยอดรวม']
      .concat(list.map(([sku, v]) => [sku, esc(v.name), esc(v.pack), v.unit, v.n, v.qty, v.price, Math.round(v.baht)].join(','))).join('\n'), 'utf8');
  console.log(`\n📄 finance/out/freshket_order_items.csv (${rows.length} บรรทัด)`);
  console.log(`📄 finance/out/freshket_items_summary.csv (${list.length} ชนิด)\n`);
}

if (process.argv[1] && process.argv[1].endsWith('parse_freshket_orders.mjs')) main();

/**
 * f-track — แกะใบยืนยันคำสั่งซื้อ GO Wholesale ทุกใบ → รายการวัตถุดิบจริงรายชิ้น
 *
 * ที่มาไฟล์: นัทขอจากเซลล์ GO แล้วฟอร์เวิร์ดเข้า flidty.c (71 ใบ) → แตกไว้ที่ finance/raw/go_orders/
 *
 * ⚠️ กับดัก: ต้องใช้ `-raw` ไม่ใช่ `-layout`
 *    layout ทำราคาเหลื่อมข้ามแถว (แครอท 1 ลัง ได้ราคา 14 ทั้งที่จริง 140)
 *
 * รูปแบบบรรทัดสินค้า (หลัง -raw):
 *   ลำดับ จำนวน รหัสสินค้า(บาร์โค้ด) ชื่อสินค้า หน่วย ราคา/หน่วย รหัสภาษี มูลค่ารวม ราคารวม
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PDFTOTEXT = 'C:/Program Files/Git/mingw64/bin/pdftotext.exe';
const DIR = 'finance/raw/go_orders';
const UNITS = '[A-Za-z]+';
const TXN = new RegExp(`^(\\d+)\\s+([\\d.]+)\\s+(\\d{9,14})\\s+(.+?)\\s+(${UNITS})\\s+([\\d,]+\\.\\d{2})\\s+([NY])\\s+([\\d,]+\\.\\d{2})\\s+([\\d,]+\\.\\d{2})\\s*$`);
const num = (s) => +String(s).replace(/,/g, '');

export function parseFile(file) {
  let raw = '';
  try {
    raw = execFileSync(PDFTOTEXT, ['-raw', '-enc', 'UTF-8', file, '-'], { encoding: 'utf8', maxBuffer: 32e6, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { raw = e.stdout || ''; }

  const orderNo = (/Order No\.:\s*(\S+)/.exec(raw) || [])[1] || path.basename(file);
  const od = (/Order Date:\s*(\d{2}\/\d{2}\/\d{4})/.exec(raw) || [])[1] || '';
  const dd = (/Delivery Date:\s*(\d{2}\/\d{2}\/\d{4})/.exec(raw) || [])[1] || '';
  const iso = (d) => d ? d.slice(6, 10) + '-' + d.slice(3, 5) + '-' + d.slice(0, 2) : '';

  const items = [];
  for (const line of raw.split('\n')) {
    const m = TXN.exec(line.trim());
    if (!m) continue;
    items.push({
      order: orderNo, date: iso(od) || iso(dd),
      barcode: m[3], name: m[4].trim(), unit: m[5],
      qty: +m[2], unitPrice: num(m[6]), total: num(m[9]),
    });
  }
  const grand = num((/ราคารวมสุทธิ\s+([\d,]+\.\d{2})/.exec(raw) || [])[1] || 0);
  return { file: path.basename(file), order: orderNo, date: iso(od) || iso(dd), items, grand };
}

function main() {
  const files = fs.readdirSync(DIR).filter((f) => /\.pdf$/i.test(f)).sort();
  const all = [], bad = [];
  for (const f of files) {
    const r = parseFile(path.join(DIR, f));
    if (!r.items.length) bad.push(r.file);
    all.push(r);
  }
  const rows = all.flatMap((r) => r.items);
  const b = (n) => Math.round(n).toLocaleString('en-US');

  console.log(`\n📦 ใบสั่งซื้อ GO ${all.length} ใบ · รายการสินค้า ${rows.length} บรรทัด`);
  if (bad.length) console.log(`   ⚠️ แกะรายการไม่ได้ ${bad.length} ใบ: ${bad.slice(0, 5).join(', ')}`);

  // ตรวจความถูกต้อง: ยอดรวมรายชิ้น ควรใกล้ยอดสุทธิในใบ
  let okBill = 0;
  for (const r of all) {
    const s = r.items.reduce((a, x) => a + x.total, 0);
    if (r.grand && Math.abs(s - r.grand) / r.grand < 0.15) okBill++;
  }
  console.log(`   ✅ ยอดรวมรายชิ้นตรงกับยอดในใบ ${okBill}/${all.length} ใบ`);

  const months = [...new Set(rows.map((r) => r.date.slice(0, 7)))].filter(Boolean).sort();
  console.log('\nเดือน   | ใบ | รายการ |        ยอดรวม');
  for (const m of months) {
    const g = rows.filter((r) => r.date.startsWith(m));
    const nb = new Set(g.map((r) => r.order)).size;
    console.log(`${m} | ${String(nb).padStart(2)} | ${String(g.length).padStart(6)} | ${b(g.reduce((a, x) => a + x.total, 0)).padStart(13)}`);
  }

  // รวมรายสินค้า
  const byItem = new Map();
  for (const r of rows) {
    const e = byItem.get(r.barcode) || { name: r.name, unit: r.unit, n: 0, qty: 0, baht: 0, price: r.unitPrice };
    e.n++; e.qty += r.qty; e.baht += r.total; e.price = r.unitPrice;
    byItem.set(r.barcode, e);
  }
  const list = [...byItem].sort((a, c) => c[1].baht - a[1].baht);
  console.log(`\n🛒 ของที่สั่งจริงทั้งหมด ${list.length} ชนิด — 25 อันดับที่ใช้เงินสูงสุด`);
  console.log('        ยอดรวม  ครั้ง  ราคา/หน่วย  หน่วย   สินค้า');
  for (const [bc, v] of list.slice(0, 25))
    console.log(`${b(v.baht).padStart(13)}  ${String(v.n).padStart(4)}  ${String(v.price).padStart(9)}  ${v.unit.padEnd(6)} ${v.name.slice(0, 44)}`);

  fs.mkdirSync('finance/out', { recursive: true });
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  fs.writeFileSync('finance/out/go_order_items.csv',
    '\ufeff' + ['วันที่,เลขที่ใบสั่ง,บาร์โค้ด,สินค้า,หน่วย,จำนวน,ราคาต่อหน่วย,ราคารวม']
      .concat(rows.map((r) => [r.date, r.order, r.barcode, esc(r.name), r.unit, r.qty, r.unitPrice, r.total].join(','))).join('\n'), 'utf8');
  fs.writeFileSync('finance/out/go_items_summary.csv',
    '\ufeff' + ['บาร์โค้ด,สินค้า,หน่วย,สั่งกี่ครั้ง,จำนวนรวม,ราคาต่อหน่วยล่าสุด,ยอดรวม']
      .concat(list.map(([bc, v]) => [bc, esc(v.name), v.unit, v.n, v.qty, v.price, Math.round(v.baht)].join(','))).join('\n'), 'utf8');
  console.log(`\n📄 finance/out/go_order_items.csv (${rows.length} บรรทัด)`);
  console.log(`📄 finance/out/go_items_summary.csv (${list.length} ชนิด)\n`);
}

if (process.argv[1] && process.argv[1].endsWith('parse_go_orders.mjs')) main();

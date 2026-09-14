/**
 * f-track — ตัวแกะ statement บัตรเครดิตกสิกร (K-Credit `KBGC_*` + OneSiam `SPW_*`)
 *
 * 🔑 รหัสเปิดไฟล์ = วันเกิดนัท DDMMYYYY (ปี ค.ศ.) — ส่งผ่าน env `KPW` เท่านั้น ห้าม hardcode
 *    ใช้:  KPW=xxxxxxxx node scripts/finance/parse_kbank.mjs
 *
 * ⚠️ กับดักใหญ่ที่เสียเวลาไปแล้วครั้งหนึ่ง — **ห้ามใช้ `pdftotext -layout` กับไฟล์กสิกร**
 *    -layout จะดึงคอลัมน์ "ชื่อร้าน" กับ "จำนวนเงิน" มาจากคนละบรรทัด แล้วเอามาต่อกัน
 *    ได้ผลลัพธ์ที่ดูสมเหตุสมผลแต่ผิด เช่น "GO WHOLESALE ... OTTAWA USD 12.28"
 *    (โกวโฮลเซลที่ออตตาวาจ่ายดอลลาร์ = เป็นไปไม่ได้ แต่ไม่มี error อะไรเตือน)
 *    → **ใช้ `-raw` เท่านั้น** ได้บรรทัดละรายการตรงๆ
 *
 * รูปแบบ:  `26/05/26 27/05/26 GO WHOLESALE APPLICATION15 BANGKOK 1,761.00`
 *          วันที่ทำรายการ · วันที่ลงบัญชี · ชื่อร้าน+เลขลำดับ · สถานที่ · ยอด (ติดลบ = จ่ายบิล)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PDFTOTEXT = 'C:/Program Files/Git/mingw64/bin/pdftotext.exe';
const PW = process.env.KPW || '';
const DIRS = { 'K-Credit': 'finance/raw/kbank_credit', OneSiam: 'finance/raw/kbank_onesiam' };
const baht = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

// ชื่อร้านลงท้ายด้วยเลขลำดับแถว ต้องตัดทิ้ง · ยอดอยู่ท้ายสุด
const TXN = /^(\d{2}\/\d{2}\/\d{2})\s+(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+(-?[\d,]+\.\d{2})\s*$/;

/** จัดกลุ่มชื่อร้านให้อยู่หมวดเดียวกัน — ใช้ตัดสินว่าเป็นต้นทุนอาหารหรือค่าขนส่ง */
export const CATEGORY = [
  [/lalamove/i,                 '🚚 ค่าขนส่ง — Lalamove'],
  [/nim ?ex|kerry|flash|dhl|scg/i, '🚚 ค่าขนส่ง — อื่นๆ'],
  [/freshket/i,                 '🍱 วัตถุดิบ — Freshket'],
  [/wholesale/i,                '🍱 วัตถุดิบ — GoWholesale'],
  [/makro|แม็คโคร/i,            '🍱 วัตถุดิบ — Makro'],
];
export const categorize = (desc) => (CATEGORY.find(([re]) => re.test(desc)) || [null, null])[1];

export function parseFile(file, card) {
  let raw;
  try {
    raw = execFileSync(PDFTOTEXT, ['-raw', '-upw', PW, file, '-'], { encoding: 'utf8', maxBuffer: 64e6 });
  } catch {
    return { file: path.basename(file), error: 'เปิดไม่ได้ (รหัสผิด?)', rows: [] };
  }
  const cycle = path.basename(file).match(/_(\d{6})\.pdf$/)?.[1] ?? '?';
  const rows = [];
  for (const line of raw.split('\n')) {
    const m = TXN.exec(line.trim());
    if (!m) continue;
    const [, tdate, , mid, amtRaw] = m;
    // ตัด "สถานที่" (คำท้าย) และ "เลขลำดับแถว" ที่ติดมากับชื่อร้านออก
    const desc = mid.replace(/\s+\S+$/, '').replace(/\d+$/, '').trim();
    if (!desc) continue;
    const [dd, mm, yy] = tdate.split('/');
    rows.push({
      date: `20${yy}-${mm}-${dd}`,
      desc,
      amount: +amtRaw.replace(/,/g, ''),
      card,
      cycle,
      category: categorize(desc),
    });
  }
  return { file: path.basename(file), cycle, card, rows };
}

function main() {
  if (!PW) { console.error('❌ ต้องใส่รหัสก่อน:  KPW=<วันเกิด DDMMYYYY> node scripts/finance/parse_kbank.mjs'); process.exit(1); }
  const all = [];
  for (const [card, dir] of Object.entries(DIRS)) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.pdf')).sort()) {
      const r = parseFile(path.join(dir, f), card);
      if (r.error) { console.error(`⚠️ ${r.file}: ${r.error}`); continue; }
      all.push(...r.rows);
    }
  }
  const spend = all.filter((r) => r.amount > 0);   // ติดลบ = จ่ายบิล ไม่ใช่รายจ่าย
  console.log(`\nอ่านได้ ${all.length} รายการ · เป็นรายจ่าย ${spend.length} รายการ\n`);

  // ── สิ่งที่นัทสั่งให้โฟกัส: ต้นทุนอาหาร + ค่าขนส่ง ──────────────
  const tagged = spend.filter((r) => r.category);
  const months = [...new Set(tagged.map((r) => r.date.slice(0, 7)))].sort();
  const cats = [...new Set(tagged.map((r) => r.category))].sort();

  console.log('เดือน   | ' + cats.map((c) => c.replace(/^.. /, '').padStart(22)).join(' | '));
  console.log('--------|-' + cats.map(() => '-'.repeat(22)).join('-|-'));
  const totals = {};
  for (const m of months) {
    const cells = cats.map((c) => {
      const v = tagged.filter((r) => r.date.startsWith(m) && r.category === c).reduce((a, b) => a + b.amount, 0);
      totals[c] = (totals[c] || 0) + v;
      return (v ? baht(v) : '-').padStart(22);
    });
    console.log(`${m} | ${cells.join(' | ')}`);
  }
  console.log('--------|-' + cats.map(() => '-'.repeat(22)).join('-|-'));
  console.log('รวม     | ' + cats.map((c) => baht(totals[c] || 0).padStart(22)).join(' | '));

  const food = cats.filter((c) => c.startsWith('🍱')).reduce((a, c) => a + (totals[c] || 0), 0);
  const ship = cats.filter((c) => c.startsWith('🚚')).reduce((a, c) => a + (totals[c] || 0), 0);
  console.log(`\n🍱 ต้นทุนอาหาร (บัตรกสิกร): ${baht(food)}`);
  console.log(`🚚 ค่าขนส่ง   (บัตรกสิกร): ${baht(ship)}`);

  fs.mkdirSync('finance/out', { recursive: true });
  const csv = ['date,desc,amount,card,cycle,category']
    .concat(all.map((r) => `${r.date},"${r.desc.replace(/"/g, '""')}",${r.amount},${r.card},${r.cycle},${r.category || ''}`))
    .join('\n');
  fs.writeFileSync('finance/out/kbank_transactions.csv', '\ufeff' + csv, 'utf8');
  console.log(`\n📄 เขียน finance/out/kbank_transactions.csv (${all.length} แถว)`);
  console.log('⚠️ ยังไม่แยก "ของร้าน/ส่วนตัว" ในรายการที่ไม่ได้ติดหมวด — ต้องให้นัทดูก่อน\n');
}

main();

/**
 * f-track — ตัวแกะ statement บัตรเครดิต UOB (5271...0366)
 *
 * ทำไมเป็นตัวแรก: UOB = บัตรที่จ่าย Freshket (วัตถุดิบ = ก้อนต้นทุนใหญ่สุด)
 * และเป็นธนาคารเดียวที่ **ไม่มีรหัสเปิดไฟล์** → เริ่มได้ทันทีโดยไม่ต้องรอนัท
 *
 * รูปแบบบรรทัดรายการ:  POST DATE | TRANS DATE | DESCRIPTION | AMOUNT [CR]
 *   `   11 MAY      07 MAY  OMISE*Freshket Bangkok            58,886.89`
 *   `   02 JUN      30 MAY  PAYMENT THANK YOU - UOBT TMRW APP  14,000.00 CR`
 * `CR` ต่อท้าย = เงินเข้า (จ่ายบิล/คืนเงิน) ไม่ใช่รายจ่าย
 *
 * ⚠️ วันที่ในบรรทัดไม่มีปี → เอาปีจาก STATEMENT DATE แล้วถอยปีให้ถ้าเดือนข้ามปี
 *
 * ใช้:  node scripts/finance/parse_uob.mjs            (สรุปทุกไฟล์)
 *       node scripts/finance/parse_uob.mjs --csv      (ออกเป็น CSV ไป finance/out/)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PDFTOTEXT = 'C:/Program Files/Git/mingw64/bin/pdftotext.exe';
const RAW = 'finance/raw/uob';
const OUT = 'finance/out';
const MONTHS = { JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11 };

const TXN = /^\s*(\d{2})\s+([A-Z]{3})\s+(\d{2})\s+([A-Z]{3})\s+(.+?)\s{2,}([\d,]+\.\d{2})\s*(CR)?\s*$/;
const baht = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2 });

function textOf(file) {
  return execFileSync(PDFTOTEXT, ['-layout', file, '-'], { encoding: 'utf8', maxBuffer: 64e6 });
}

export function parseFile(file) {
  const t = textOf(file);
  const sd = t.match(/STATEMENT DATE\s+(\d{2}) ([A-Z]{3}) (\d{4})/);
  if (!sd) throw new Error('อ่าน STATEMENT DATE ไม่ออก: ' + file);
  const stmtMonth = MONTHS[sd[2]], stmtYear = +sd[3];

  // ยอดที่ธนาคารสรุปเอง — ใช้ตรวจว่าเราแกะครบไหม
  const tot = t.match(/TOTAL\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/);
  const statedBalance = tot ? +tot[1].replace(/,/g, '') : null;

  const rows = [];
  for (const line of t.split('\n')) {
    const m = TXN.exec(line);
    if (!m) continue;
    const [, , postMon, dd, mon, descRaw, amtRaw, cr] = m;
    if (!(mon in MONTHS)) continue;
    // ปี: ถ้าเดือนรายการ > เดือน statement แปลว่าเป็นของปีก่อน
    const year = MONTHS[mon] > stmtMonth ? stmtYear - 1 : stmtYear;
    const date = `${year}-${String(MONTHS[mon] + 1).padStart(2, '0')}-${dd}`;
    const amount = +amtRaw.replace(/,/g, '');
    // ⛔ บรรทัด "ยอดยกมา" (PREVIOUS BALANCE) หน้าตาเหมือนรายการซื้อเป๊ะ แต่ไม่ใช่รายจ่าย
    //    UOB พิมพ์ชื่อเจ้าของบัตรตรงช่อง DESCRIPTION แล้วตามด้วยยอดยกมา
    //    ถ้าไม่ตัด = นับยอดคงค้างเดือนก่อนเป็นค่าใช้จ่ายใหม่ทุกเดือน (เคยได้ 2.25 ล้าน ทั้งที่จริง ~3.8 แสน)
    const d = descRaw.toUpperCase();
    if (/CHUTICHAWANNAN/.test(d) || /^UOB ROP/.test(d)) continue;
    rows.push({
      date,
      desc: descRaw.replace(/\s+/g, ' ').trim(),
      amount,
      direction: cr ? 'in' : 'out', // in = จ่ายบิล/คืนเงิน · out = รายจ่ายจริง
      stmt: `${sd[2]}-${sd[3]}`,
    });
  }
  return { file: path.basename(file), stmt: `${sd[2]}-${sd[3]}`, statedBalance, rows };
}

function main() {
  if (!fs.existsSync(RAW)) { console.error('ไม่มีโฟลเดอร์', RAW); process.exit(1); }
  const files = fs.readdirSync(RAW).filter((f) => f.toLowerCase().endsWith('.pdf')).sort();
  if (!files.length) { console.error('ยังไม่มีไฟล์ใน', RAW); process.exit(1); }

  const all = [];
  console.log('\nรอบบิล   | รายการ | รายจ่ายรวม      | จ่ายบิล/คืนเงิน  | ยอดคงค้างที่ธนาคารสรุป');
  console.log('---------|-------:|----------------:|----------------:|------------------:');
  for (const f of files) {
    const r = parseFile(path.join(RAW, f));
    const out = r.rows.filter((x) => x.direction === 'out').reduce((a, b) => a + b.amount, 0);
    const inn = r.rows.filter((x) => x.direction === 'in').reduce((a, b) => a + b.amount, 0);
    console.log(
      `${r.stmt.padEnd(8)} | ${String(r.rows.length).padStart(6)} | ${baht(out).padStart(15)} | ` +
        `${baht(inn).padStart(15)} | ${r.statedBalance != null ? baht(r.statedBalance).padStart(17) : '?'}`
    );
    all.push(...r.rows);
  }

  // ── ร้านที่จ่ายเยอะสุด (ฝั่งรายจ่ายจริงเท่านั้น) ──────────────────
  const spend = all.filter((x) => x.direction === 'out');
  const byMerchant = new Map();
  for (const x of spend) {
    // ยุบชื่อร้านให้อยู่กลุ่มเดียวกัน (ตัดเลขอ้างอิง/สาขาท้ายชื่อ)
    const key = x.desc.replace(/\s+\d[\d\s\-*]*$/, '').slice(0, 34).trim();
    byMerchant.set(key, (byMerchant.get(key) || 0) + x.amount);
  }
  console.log(`\nรวมทุกรอบ: ${spend.length} รายการ · รายจ่าย ${baht(spend.reduce((a, b) => a + b.amount, 0))} บาท`);
  console.log('\nจ่ายให้ใครมากที่สุด (top 15)');
  console.log('---------------------------------------------------------------');
  for (const [m, v] of [...byMerchant].sort((a, b) => b[1] - a[1]).slice(0, 15))
    console.log(`  ${m.padEnd(36)} ${baht(v).padStart(14)}`);

  if (process.argv.includes('--csv')) {
    fs.mkdirSync(OUT, { recursive: true });
    const csv = ['date,desc,amount,direction,stmt']
      .concat(all.map((r) => `${r.date},"${r.desc.replace(/"/g, '""')}",${r.amount},${r.direction},${r.stmt}`))
      .join('\n');
    fs.writeFileSync(path.join(OUT, 'uob_transactions.csv'), '\ufeff' + csv, 'utf8');
    console.log(`\n📄 เขียน ${OUT}/uob_transactions.csv แล้ว (${all.length} แถว)`);
  }
  console.log('\n⚠️ "ยอดคงค้างที่ธนาคารสรุป" = ยอดสะสมทั้งบัตร ไม่ใช่ยอดใช้จ่ายเฉพาะรอบ — ห้ามเอาไปบวกกัน');
  console.log('⚠️ ยังไม่ได้แยก "ของร้าน / ส่วนตัว" — บัตรใบนี้ปนกัน ต้องให้นัทดูก่อน (กฎเหล็กข้อ 3)\n');
}

main();

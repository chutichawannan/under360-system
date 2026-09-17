/**
 * f-track — ตัวแกะ statement บัตรเครดิต TTB (เลขบัตรลงท้าย 7517)
 *
 * นัทส่งมาเอง 17 ก.ย. 2026: *"หลายรายการจะเป็นส่วนตัวแต่มีของ under ปนอยู่ไม่น้อย"*
 *
 * ✅ ไฟล์ TTB **ไม่มีรหัสผ่าน** และใช้ `-raw` อ่านได้ตรงๆ (ต่างจากกสิกร/ออมสินที่ต้องใส่รหัส)
 * รูปแบบ: `วันที่ใช้ วันที่บันทึก ชื่อร้าน ประเทศ ยอด`
 *   ตัวอย่าง: `01/08/2026 02/08/2026 LINEPAY *LP_LINEOFFICIALABANGKOK TH 1,904.60`
 *
 * ⚠️ ยอดที่ขึ้นต้นด้วย `-` หรือมี CR = คืนเงิน/ชำระเงิน ไม่ใช่รายจ่าย
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PDFTOTEXT = 'C:/Program Files/Git/mingw64/bin/pdftotext.exe';
const DIR = 'finance/raw/ttb';
const TXN = /^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(-?[\d,]+\.\d{2})(\s*CR)?\s*$/;
const num = (s) => +String(s).replace(/,/g, '');
const iso = (d) => `${d.slice(6, 10)}-${d.slice(3, 5)}-${d.slice(0, 2)}`;

/** ✅ ของร้าน — ยืนยันแล้วจากที่นัทตอบไว้ก่อนหน้า */
const SHOP = [
  [/lineofficial|line ?oa/i, '📣 LINE OA'],
  [/freshket|wholesale|^cfw|makro/i, '🍱 วัตถุดิบ'],
  [/lalamove/i, '🛵 ค่าขนส่ง'],
  [/anthropic|claude|vercel|canva|openai|google workspace/i, '💻 เครื่องมือ/AI'],
  [/facebook|meta\b|google ads/i, '📢 ค่าโฆษณา'],
  [/counter service/i, '💧 ค่าน้ำ/บิล'],
  [/mermaid|เมอร์เมด/i, '🐟 ปลา'],
];
/** 🚫 ส่วนตัว — นัทระบุเองแล้วบางตัว (Grab บนบัตร = ค่าอาหาร · TMN 7-11 · Netflix) */
const PERSONAL = [
  [/grab|grabtaxi/i, '🚕 Grab'],
  [/tmn|7-?eleven/i, '🏪 7-11/TrueMoney'],
  [/netflix|iqiyi|spotify|youtube/i, '📺 ความบันเทิง'],
  [/riverside|restaurant|cafe|coffee|starbucks|pizza|sushi|bonchon/i, '🍽️ ร้านอาหาร'],
  [/lazada|shopee|uniqlo|ikea|decathlon/i, '🛍️ ช้อปปิ้ง'],
  [/hospital|clinic|pharmac|chiiwii/i, '🏥 สุขภาพ'],
  [/trueiservice|true ?money|true/i, '📱 True (นัทยืนยันว่าส่วนตัว)'],
  [/immigration|klook|booking|airasia|agoda/i, '✈️ เดินทาง'],
  [/school|academy|sikh/i, '🎓 ค่าเทอม'],
];
const FIN = [/interest|ดอกเบี้ย|fee|ธรรมเนียม/i];

export function parseFile(file) {
  let raw = '';
  try { raw = execFileSync(PDFTOTEXT, ['-raw', '-enc', 'UTF-8', file, '-'], { encoding: 'utf8', maxBuffer: 32e6, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { raw = e.stdout || ''; }

  const stmt = (/(\d{2}\/\d{2}\/\d{4})\s+\d{2}\/\d{2}\/\d{4}\s*$/m.exec(raw) || [])[1] || '';
  const bal = num((/ยอดรวมเงินที่เรียกเก็บ[\s\S]{0,40}?(-?[\d,]+\.\d{2})/.exec(raw) || [])[1] || 0);
  const minPay = num((/(\d[\d,]*\.\d{2})\s+0\.00\s+(\d[\d,]*\.\d{2})/.exec(raw) || [])[1] || 0);

  const rows = [];
  for (const line of raw.split('\n')) {
    const m = TXN.exec(line.trim());
    if (!m) continue;
    let desc = m[3].replace(/\s+(TH|SG|US|GB|JP|CAD|USD|MXN)\s*$/i, '').trim();
    rows.push({ date: iso(m[1]), desc, amount: num(m[4]), cr: !!m[5] });
  }
  return { file: path.basename(file), stmt, bal, minPay, rows };
}

const catOf = (d) => {
  if (FIN.some((re) => re.test(d))) return ['🔴 ดอกเบี้ย/ค่าธรรมเนียม', 'fin'];
  for (const [re, name] of SHOP) if (re.test(d)) return [name, 'shop'];
  for (const [re, name] of PERSONAL) if (re.test(d)) return [name, 'personal'];
  return ['❓ ยังไม่จัดหมวด', 'unknown'];
};

function main() {
  const files = fs.readdirSync(DIR).filter((f) => /\.pdf$/i.test(f)).sort();
  const all = files.map((f) => parseFile(path.join(DIR, f)));
  const rows = all.flatMap((r) => r.rows).filter((r) => !r.cr && r.amount > 0);
  const b = (n) => Math.round(n).toLocaleString('en-US');

  console.log('\n💳 บัตรเครดิต TTB (ลงท้าย 7517)');
  console.log('รอบบิล      |      ยอดเรียกเก็บ |     ขั้นต่ำ | รายการ');
  for (const r of all) console.log(`${r.stmt || r.file.slice(9, 20)} | ${b(r.bal).padStart(16)} | ${b(r.minPay).padStart(11)} | ${String(r.rows.length).padStart(6)}`);

  const byM = {};
  for (const r of rows) {
    const m = r.date.slice(0, 7), [, k] = catOf(r.desc);
    byM[m] = byM[m] || { shop: 0, personal: 0, fin: 0, unknown: 0 };
    byM[m][k] += r.amount;
  }
  console.log('\nเดือน   |    ของร้าน |   ส่วนตัว | ดอกเบี้ย/ค่าธรรมเนียม | ยังไม่จัดหมวด');
  for (const m of Object.keys(byM).sort()) {
    const x = byM[m];
    console.log(`${m} | ${b(x.shop).padStart(10)} | ${b(x.personal).padStart(9)} | ${b(x.fin).padStart(21)} | ${b(x.unknown).padStart(13)}`);
  }

  const show = (kind, title) => {
    const g = new Map();
    for (const r of rows) { const [name, k] = catOf(r.desc); if (k !== kind) continue;
      const e = g.get(r.desc) || { n: 0, v: 0, name }; e.n++; e.v += r.amount; g.set(r.desc, e); }
    const tot = [...g.values()].reduce((a, x) => a + x.v, 0);
    console.log(`\n${title} — รวม ฿${b(tot)}`);
    for (const [d, v] of [...g].sort((a, c) => c[1].v - a[1].v).slice(0, 18))
      console.log(`   ${b(v.v).padStart(9)}  ${String(v.n).padStart(3)}x  ${v.name.padEnd(22)} ${d.slice(0, 40)}`);
  };
  show('shop', '✅ ของร้าน (ยืนยันจากที่นัทเคยตอบ)');
  show('unknown', '❓ ยังไม่รู้ว่าร้านหรือส่วนตัว — ต้องถามนัท');
  show('fin', '🔴 ดอกเบี้ย/ค่าธรรมเนียม');
  console.log(`\n🚫 ส่วนตัว รวม ฿${b(rows.filter((r) => catOf(r.desc)[1] === 'personal').reduce((a, r) => a + r.amount, 0))} (ไม่แจกแจง)`);

  fs.mkdirSync('finance/out', { recursive: true });
  fs.writeFileSync('finance/out/ttb_transactions.csv',
    '\ufeff' + ['date,desc,amount,category,kind']
      .concat(rows.map((r) => { const [name, k] = catOf(r.desc); return `${r.date},"${r.desc}",${r.amount},"${name}",${k}` })).join('\n'), 'utf8');
  console.log(`\n📄 finance/out/ttb_transactions.csv (${rows.length} แถว)\n`);
}

if (process.argv[1] && process.argv[1].endsWith('parse_ttb.mjs')) main();

// ยามสำรองห้องฟ้า — รันทุกชั่วโมง 06:00–22:00 ทุกวัน
// ดูว่า "วันผลิตถัดไป" มีใบงานแล้วหรือยัง ถ้ายัง = รันไปป์ไลน์ทำให้ทันที · มีแล้ว = เงียบ
//   · วัน จ/พ/ศ ก่อนบ่าย 2 → เช็คใบของวันนี้
//   · หลังจากนั้น → เช็คใบของวันผลิตถัดไป (เริ่มเช็คตั้งแต่บ่าย 3 ของวันก่อนหน้า)
// 22 ก.ย. 2026: fah_auto.cmd ไม่ได้เรียก fah_auto.mjs เลยตั้งแต่ 16 ก.ย. ตัวตั้งเวลารายงาน "สำเร็จ" ทุกรอบ
//   แต่ไม่มีใบออกมาสักใบ นัทต้องทวงทุกรอบ → ยามตัวนี้ดูที่ "ไฟล์ใบงาน" ไม่ดูว่าตัวตั้งเวลาบอกว่าสำเร็จ
import fs from 'fs';
import { execFileSync } from 'child_process';

const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const PROD = [1, 3, 5];

let target = new Date(now);
if (!(PROD.includes(now.getDay()) && now.getHours() < 14)) {
  do { target.setDate(target.getDate() + 1); } while (!PROD.includes(target.getDay()));
}
const daysAhead = Math.round((new Date(iso(target)) - new Date(iso(now))) / 864e5);
// ใบของวันพรุ่งนี้: เริ่มเช็คตั้งแต่บ่าย 3 · ไกลกว่าพรุ่งนี้ (เช่น ศุกร์→จันทร์) ยังไม่ต้อง
if (daysAhead >= 2 || (daysAhead === 1 && now.getHours() < 15)) {
  console.log(`${iso(now)} ${pad(now.getHours())}:00 · ยังไม่ถึงเวลาเช็คใบ ${iso(target)}`);
  process.exit(0);
}

const sheet = `kitchen/${iso(target)}.html`;
if (fs.existsSync(sheet)) { console.log(`${iso(now)} ${pad(now.getHours())}:00 · มีใบแล้ว: ${sheet}`); process.exit(0); }

console.log(`${iso(now)} ${pad(now.getHours())}:00 · ❌ ไม่มีใบ ${sheet} — รันไปป์ไลน์ทันที`);
try { execFileSync(process.execPath, ['scripts/restore_fah_files.mjs'], { stdio: 'inherit' }); }
catch { console.log('restore ล้ม — ไปต่อ'); }
execFileSync(process.execPath, ['scripts/fah_auto.mjs'], { stdio: 'inherit' });
console.log(fs.existsSync(sheet) ? `✅ ทำใบแล้ว: ${sheet}` : `❌ รันแล้วยังไม่มีใบ ${sheet}`);

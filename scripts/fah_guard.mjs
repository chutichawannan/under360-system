// ยามสำรอง: ถ้าถึงวันผลิต (จ/พ/ศ) แล้วยังไม่มีใบงานของวันนี้ ให้รันไปป์ไลน์ทันที
// รันทุกชั่วโมงช่วงเช้า — มีใบแล้ว = ไม่ทำอะไร (เงียบ)
import fs from 'fs';
import { execFileSync } from 'child_process';

const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
const dow = now.getDay(); // 1=จ 3=พ 5=ศ
if (![1, 3, 5].includes(dow)) { console.log('ไม่ใช่วันผลิต — ไม่ทำอะไร'); process.exit(0); }

const pad = n => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const sheet = `kitchen/${today}.html`;

if (fs.existsSync(sheet)) { console.log(`มีใบแล้ว: ${sheet}`); process.exit(0); }

console.log(`ไม่มีใบของวันนี้ (${sheet}) — รันไปป์ไลน์ซ่อมทันที`);
try {
  execFileSync(process.execPath, ['scripts/restore_fah_files.mjs'], { stdio: 'inherit' });
} catch (e) { console.log('restore ล้ม — ไปต่อ'); }
execFileSync(process.execPath, ['scripts/fah_auto.mjs', '--write'], { stdio: 'inherit' });

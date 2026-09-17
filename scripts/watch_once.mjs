// รัน room_watch แล้ว "จบตัวเองเมื่อมีจดหมายเข้า" — ใช้แทน Monitor ที่หมดอายุเองทุก 30 นาที (17 ก.ย. 2569)
// ห้องรันเป็น background แล้วถูกปลุกตอนจบ → อ่านจดหมาย → เปิดรอบใหม่
// วิธีใช้: node scripts/watch_once.mjs pm --me=pm,พี่ปืน
import { spawn } from 'child_process';
import readline from 'readline';
const child = spawn(process.execPath, ['scripts/room_watch.mjs', ...process.argv.slice(2)], { stdio: ['ignore', 'pipe', 'inherit'] });
const rl = readline.createInterface({ input: child.stdout });
rl.on('line', line => {
  console.log(line);
  if (line.includes('📬')) { child.kill(); process.exit(0); }
});
child.on('exit', code => process.exit(code ?? 1));

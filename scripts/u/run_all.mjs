/* ═══════════════════════════════════════════════════════════════════
   รันเทสห้อง u ทั้งชุดรวดเดียว

   ทำไมมี (9 ก.ย. 2569):
     ไล่รันทีละไฟล์ด้วยมือแล้วเจอว่า **8 จาก 31 ไฟล์ไม่เคยรันผ่านเลย**
     บางตัว error มาตั้งแต่หลายอาทิตย์ก่อน บางตัวแค่ลืมส่งชื่อไฟล์เข้าไป
     ทั้งชุดดูเหมือนมีเทสเยอะ แต่จริง ๆ คือ **มีเทสที่ไม่ได้ปกป้องอะไรปนอยู่ 1 ใน 4**

     ที่อันตรายกว่าคือ `test_coupon_no_leak` ที่ฟ้องแดงทุกวันเพราะเทสเก่า
     ไม่ใช่เพราะระบบพัง → พอแดงจนคนชิน วันที่มันแดงเพราะของพังจริงจะไม่มีใครดู

   รัน:  node scripts/u/run_all.mjs
   ออกด้วยรหัสล้มเหลวถ้ามีตัวไหนตก — เอาไปต่อ hook ก่อน push ได้

   ⚠️ เทสหลายตัวยิงไปอ่านไฟล์จาก production จริง → ต้องต่อเน็ต
      ถ้าเน็ตล่มจะเห็นเป็น "ตก" ซึ่งคนละเรื่องกับโค้ดพัง
   ═══════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NL = String.fromCharCode(10);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');

/* เทสรุ่นเก่าอ่านไฟล์จาก process.argv[2] · รุ่นใหม่หาไฟล์เอง
   ตรวจจากตัวไฟล์เทสเลย ไม่ต้องมานั่งจำว่าตัวไหนเป็นแบบไหน
   (การจำเองคือสาเหตุที่ 6 ตัวถูกนับเป็น "พัง" ทั้งที่แค่ไม่ได้ส่งชื่อไฟล์) */
const needsArg = (file) => fs.readFileSync(file, 'utf8').includes('process.argv[2]');

const files = fs.readdirSync(here)
  .filter((f) => f.startsWith('test_') && f.endsWith('.mjs'))
  .sort();

let pass = 0, fail = 0;
const failed = [];

for (const f of files) {
  const full = path.join(here, f);
  const args = needsArg(full) ? [full, 'liff_customer.html'] : [full];
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  const out = ((r.stdout || '') + (r.stderr || '')).trim().split(NL);
  /* บรรทัดสรุปคือบรรทัดสุดท้ายที่มีคำว่า "ผ่าน" — บางตัวมีเสียงรบกวนของ Windows ต่อท้าย */
  const summary = [...out].reverse().find((l) => l.includes('ผ่าน')) || out[out.length - 1] || '(ไม่มีผลลัพธ์)';
  const good = r.status === 0 && /ผ่าน/.test(summary) && !/🔴|❌/.test(summary);
  if (good) { pass++; console.log('  ✅ ' + f.padEnd(32) + summary.trim().slice(0, 60)); }
  else { fail++; failed.push(f); console.log('  🔴 ' + f.padEnd(32) + summary.trim().slice(0, 60)); }
}

console.log(NL + 'ไฟล์เทสทั้งหมด ' + files.length + ' · ผ่าน ' + pass + ' · ตก ' + fail);
if (fail) {
  console.log(NL + 'ตัวที่ต้องดู:');
  failed.forEach((f) => console.log('  node scripts/u/' + f + (needsArg(path.join(here, f)) ? ' liff_customer.html' : '')));
}
process.exitCode = fail ? 1 : 0;

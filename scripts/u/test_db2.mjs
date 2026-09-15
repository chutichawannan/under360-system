/* เทสหน้า DB โฉมใหม่ (/db2) — นัทให้ดีไซเนอร์รื้อมา ส่งกลับ 15 ก.ย. 2569
   นัทสั่ง: "อย่าเพิ่งเอาแทนของเก่า แยกออกมาก่อน ให้มันใช้งานได้ 100%"

   เทสนี้กันเรื่องเดียว: หน้าใหม่ต้องต่อของจริงชุดเดียวกับหน้าเก่า
   ถ้าใครเผลอแก้ให้ไปต่อที่อื่น/สร้าง client เอง/เปลี่ยนชื่อคอลัมน์ = ข้อมูล 2 หน้าจะไม่ตรงกันทันที */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const rd = (p) => fs.readFileSync(new URL('../../' + p, import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
const A = rd('main_database_v2.html');   // ของเดิม
const B = rd('db2.html');                // โฉมใหม่
let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL+'     ได้  '+g+NL+'     ควร  '+w); } };
const tables = (s) => [...new Set([...s.matchAll(/from\('([a-z_]+)'\)/g)].map(m => m[1]))].sort();

console.log(NL + '① ต่อฐานข้อมูลชุดเดียวกับหน้าเก่าเป๊ะ');
t('แตะตารางชุดเดียวกัน', tables(B), tables(A));
t('ใช้ getSB() ไม่สร้าง client เอง (กติกาบ้านนี้)', (B.match(/createClient/g) || []).length, 1);
/* 🔴 คอลัมน์สต็อกตัวจริงคือ stock_total — ไม่มี stock_quantity อยู่ในระบบ เคยพังทั้งเส้นทางมาแล้ว */
t('ไม่มี stock_quantity', B.indexOf('stock_quantity') < 0, true);
t('ใช้ stock_total', B.indexOf('stock_total') >= 0, true);

console.log(NL + '② ของที่ห้ามหาย');
t('ไฟล์เดียวจบ ไม่แยก js/css ออกไป', B.indexOf('<script src="./') < 0 && B.indexOf('rel="stylesheet" href="./') < 0, true);
t('มีด่านรหัสเหมือนหน้าอื่น', B.indexOf('gate.js') >= 0, true);
{
  /* ฟังก์ชันเดิมต้องอยู่ครบ — หายแม้ตัวเดียวแปลว่ามีงานที่ทำไม่ได้แล้ว */
  const fn = (s) => new Set([...s.matchAll(/function ([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)].map(m => m[1]));
  const gone = [...fn(A)].filter(x => !fn(B).has(x));
  t('ฟังก์ชันเดิมอยู่ครบ ไม่หายสักตัว', gone, []);
}

console.log(NL + '③ 🐞 บั๊กที่เจอตอนต่อหน้าใหม่ (มีมาก่อนรีดีไซน์ แก้ทั้ง 2 หน้าแล้ว)');
/* ตัวจับเวลาดึงเลขสต็อกสดทุก 30 วิ อ้างตัวแปรที่ไม่เคยประกาศ → โยน error ทุกครั้ง = ไม่เคยทำงานเลย
   ผลคือเปิดหน้าค้างไว้แล้วกด +/- ทับเลขเก่าได้ (อาการที่คอมเมนต์ในโค้ดบอกว่าเขียนมาเพื่อกัน) */
t('หน้าเก่า: ประกาศ _stockSyncTimers แล้ว', A.indexOf('let _stockSyncTimers = {};') >= 0, true);
t('หน้าใหม่: ประกาศ _stockSyncTimers แล้ว', B.indexOf('let _stockSyncTimers = {};') >= 0, true);

console.log(NL + '④ ทางเข้าแยกจากของเดิม (นัทสั่ง "อย่าเพิ่งเอาแทนของเก่า")');
{
  const v = JSON.parse(rd('vercel.json'));
  const db = v.rewrites.find(r => r.source === '/db');
  const db2 = v.rewrites.find(r => r.source === '/db2');
  t('/db ยังชี้หน้าเดิม', db && db.destination, '/main_database_v2.html');
  t('/db2 ชี้หน้าใหม่', db2 && db2.destination, '/db2.html');
}

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + ok) : ('✅ ผ่านทั้งหมด ' + ok + ' ข้อ'));
process.exitCode = fail ? 1 : 0;

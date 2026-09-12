/* 🧪 ย้ายครัวมา k2 (นัทเคาะ 12 ก.ย. 2569) — กันการย้ายครึ่ง ๆ กลาง ๆ
 *
 * เช็ค 3 เรื่อง:
 *   ① k2 เป็นหน้าจริงแล้ว (ไม่มีแถบ "หน้าทดลอง")
 *   ② หน้าเก่าไม่ทำงานและไม่เขียนอะไร — แต่ปลดกลับได้ด้วยค่าเดียว
 *   ③ ลิงก์ทุกทางที่เราคุมได้ ชี้มา k2
 *
 * รัน: node scripts/u/test_kitchen_move.mjs
 */
import fs from 'node:fs';

const CR = String.fromCharCode(13), NL = String.fromCharCode(10);
const read = (f) => fs.readFileSync(f, 'utf8').split(CR).join('');
const K2 = read('pwa/k2.html');
const KQ = read('kitchen_queue.html');
const KLINKS = read('k.html');
const OH = read('operation_hub.html');
const VJ = read('vercel.json');
const CC = read('command_center.html');

let pass = 0, fail = 0;
const ok = (n, c, extra) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  🔴 ' + n + (extra ? NL + '     ' + extra : '')); } };

console.log(NL + '1) k2 = หน้าครัวตัวจริง');
ok('ไม่มีแถบ "หน้าทดลอง" แล้ว', K2.indexOf('หน้าทดลอง') < 0);
/* 12 ก.ย. 2569: ชื่อแท็บก็ห้ามบอกว่าทดลอง — ครัวเปิดจากหน้าโฮมมือถือ เห็นชื่อนี้ทุกวัน */
ok('ชื่อหน้า (title) ไม่มีคำว่าทดลอง', K2.indexOf('ทดลอง') < 0);
ok('ยังเป็นหน้าเดิมที่ครัวใช้ได้ครบ (จัดของ · นับของ · วางแผน · แอดมิน)',
   ['viewPack', 'viewCount', 'viewPlan', 'viewAdmin'].every((v) => K2.indexOf('function ' + v + '(') >= 0));

console.log(NL + '2) หน้าเก่าไม่ทำงาน แต่ปลดกลับได้');
ok('มีสวิตช์ K2_MOVED = true', /var K2_MOVED = true;/.test(KQ));
ok('ไม่โหลดข้อมูลเองแล้ว (loadAll อยู่หลังสวิตช์)', /if\(K2_MOVED\)\{ kqShowMoved\(\); \}/.test(KQ) && /else \{[\s\S]{0,80}loadAll\(\);/.test(KQ));
ok('มีหน้าพาไป k2 พร้อมปุ่มลิงก์', KQ.indexOf('id="kqMoved"') >= 0 && KQ.indexOf('href="/pwa/k2.html"') >= 0);
['stkCommit', 'stkSetUnlimited', 'stkRolloverDay', 'stkWrite'].forEach((fn) => {
  const i = KQ.indexOf('function ' + fn + '(');
  ok('ปิดทางเขียน ' + fn, i > 0 && KQ.slice(i, i + 220).indexOf('if(K2_MOVED) return;') > 0);
});
ok('ไม่ได้ลบโค้ดเดิมทิ้ง (ยังมี stkCommit ตัวจริงให้กลับมาใช้)', KQ.indexOf("update({actual_stock:real, stock_total:total})") >= 0);

console.log(NL + '3) ลิงก์ชี้มา k2');
ok('หน้ารวมลิงก์ครัว (k.html)', KLINKS.indexOf('/pwa/k2.html') >= 0 && KLINKS.indexOf('/kitchen_queue.html') < 0);
ok('เมนูข้างใน OH', OH.indexOf("openApp('pwa/k2.html'") >= 0 && OH.indexOf("openApp('kitchen_queue.html'") < 0);
ok('เส้นทางลัด /kq', /"source":\s*"\/kq",\s*"destination":\s*"\/pwa\/k2\.html"/.test(VJ.replace(/\n\s*/g, ' ')));
ok('การ์ดในหน้ารวมของ CC', CC.indexOf("u:BASE+'/pwa/k2.html'") >= 0);

console.log(NL + '────────────────────────────');
console.log(fail ? '🔴 ตก ' + fail + ' ข้อ · ผ่าน ' + pass : '✅ ผ่านทั้งหมด ' + pass + ' ข้อ');
process.exitCode = fail ? 1 : 0;

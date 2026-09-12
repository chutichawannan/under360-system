/* 🧪 สต็อกต้องมีที่กรอกที่เดียว = k2 (นัทเคาะ 12 ก.ย. 2569)
 *   "งั้นเราไม่ลงสต้อคที่หน้า db แล้ว กรอกหน้า k2 ไปเลย ไม่ให้แอดมินดูหน้า oh ด้วย ให้ใช้หน้าเดียวกับครัวไป"
 *
 * เทสนี้กันการถอยกลับ: ถ้าวันหลังมีใครเปิดทางเขียนสต็อกในหน้า DB อีก เทสจะแดงทันที
 * ⛔ kitchen_queue ไม่อยู่ในเทสนี้ — ครัวยังนับที่นั่นทุกวันจนกว่านัทจะย้ายครัวมา k2
 *
 * รัน: node scripts/u/test_stock_one_place.mjs
 */
import fs from 'node:fs';

const CR = String.fromCharCode(13), NL = String.fromCharCode(10);
const read = (f) => fs.readFileSync(f, 'utf8').split(CR).join('');
const DB = read('main_database_v2.html');
const OH = read('operation_hub.html');
const K2 = read('pwa/k2.html');

let pass = 0, fail = 0;
const ok = (n, c, extra) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  🔴 ' + n + (extra ? NL + '     ' + extra : '')); } };
const count = (hay, needle) => hay.split(needle).length - 1;

console.log(NL + '1) หน้า DB — ปิดทางเขียนสต็อกจริง ไม่ใช่แค่ซ่อนปุ่ม');
ok('ไม่เหลือคำสั่งเขียน stock_total จากหน้า DB', DB.indexOf('update({ stock_total') < 0);
ok('ไม่เหลือคำสั่งเขียน actual_stock จากหน้า DB (ปุ่มวางเลขเป็นก้อน)', DB.indexOf('actual_stock:x.qty') < 0);
ok('มีตัวกันกลางตัวเดียว', count(DB, 'function stockEditClosed()') === 1);
ok('ตัวกันบอกทางไป k2', DB.indexOf('K2_URL') >= 0 && DB.indexOf('/pwa/k2.html') >= 0);
['chgStockFast', 'saveStockInline'].forEach((fn) => {
  const i = DB.indexOf('function ' + fn + '(');
  ok('ปุ่ม/ช่อง ' + fn + ' กันที่บรรทัดแรก', i > 0 && DB.slice(i, i + 260).indexOf('stockEditClosed()') > 0);
});
{
  const i = DB.indexOf('const commitStock = (newVal)=>{');
  ok('ปุ่มสต็อกในการ์ดสูตรกันที่บรรทัดแรก', i > 0 && DB.slice(i, i + 200).indexOf('stockEditClosed()') > 0);
  const j = DB.indexOf('async function applyPasteStock(){');
  ok('ปุ่มวางเลขเป็นก้อนกันก่อนลูป', j > 0 && DB.slice(j, j + 320).indexOf('stockEditClosed()') > 0);
}
ok('ช่องสต็อกแถวปักหมุดเป็นอ่านอย่างเดียว', DB.indexOf('class="ptt-stock-num" data-stock-id="${r.id}" readonly') >= 0);

console.log(NL + '2) หน้า OH — เลิกโชว์สต็อกจากคอลัมน์ที่ตายแล้ว');
ok('ไม่อ่าน m.stock_reserved แล้ว', OH.indexOf('m.stock_reserved') < 0);
ok('ใช้ ohStockLabel ที่คิดจาก actual_stock กับ stock_total', OH.indexOf('function ohStockLabel(') >= 0);
ok('หน้า OH ไม่มีคำสั่งเขียนสต็อก', OH.indexOf('update({ stock_total') < 0 && OH.indexOf('actual_stock:') < 0);

console.log(NL + '3) k2 — ยังเป็นที่เดียวที่เขียนสต็อกได้');
ok('k2 เขียน actual_stock + stock_total ตอนครัวนับ', /update\(\{actual_stock:n,stock_total:sellable\}\)/.test(K2));
ok('k2 คิดที่ลูกค้าซื้อได้ = นับได้ − จอง (ไม่ติดลบ)', /Math\.max\(0,\s*n\s*-\s*booked\)/.test(K2));

console.log(NL + '────────────────────────────');
console.log(fail ? '🔴 ตก ' + fail + ' ข้อ · ผ่าน ' + pass : '✅ ผ่านทั้งหมด ' + pass + ' ข้อ');
process.exitCode = fail ? 1 : 0;

/* ป้าย "เคยซื้อเจ" ในหน้าลูกค้า OH — 05 ขอ · นัทสั่งเอง 18 ก.ย. 2569
   ใช้ตัดสินว่าใครได้ซาลาเปาแถม → นับผิด = แจกฟรีให้คนไม่มีสิทธิ์ หรือปฏิเสธคนที่มีสิทธิ์ */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const H = fs.readFileSync(new URL('../../operation_hub.html', import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
const a = H.indexOf('function isJayCode(code, cat){'), b = H.indexOf(NL + 'async function jayCodeSet(', a);
const isJayCode = new Function(H.slice(a, b) + '; return isJayCode;')();
let ok = 0, fail = 0;
const t = (n, got, want) => { if (got === want) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '· ได้', JSON.stringify(got)); } };

console.log(NL + '① เมนูเจ 3 ยุค ต้องนับครบ');
t('หมวดคอร์สเจปีนี้', isJayCode('X99', 'jay2026'), true);
t('รหัสยุค Hato J0…', isJayCode('J012', 'อะไรก็ได้'), true);
t('ซาลาเปาเจ MC1', isJayCode('MC1', ''), true);
t('ซาลาเปาเจ MC2', isJayCode('mc2', ''), true);
console.log(NL + '② เมนูปกติต้องไม่ถูกนับเป็นเจ');
t('ข้าวกล่องปกติ', isJayCode('S188', 'rice_box'), false);
t('แพคกับข้าว', isJayCode('No12', 'pack_regular'), false);
t('MC10 (ไม่ใช่ซาลาเปาเจ)', isJayCode('MC10', ''), false);
t('J1 ไม่ใช่ J0', isJayCode('J1', ''), false);
t('ว่าง', isJayCode('', ''), false);
console.log(NL + '③ กติกาการนับ');
t('ใบยกเลิกไม่นับ', H.indexOf('o.status !== "cancelled"') >= 0, true);
t('ไม่เจอ = ไม่ขึ้นป้าย (ไม่เขียนว่า "ไม่เคย")', H.indexOf('if(!hits.length) return;') >= 0, true);
t('นับเป็นจำนวนใบ ไม่ใช่จำนวนรายการอาหาร', H.indexOf('hitIds[it.order_id]=1') >= 0, true);
t('ยิงทีละ 60 ใบ กัน 1000-cap', H.indexOf('ids.slice(i,i+60)') >= 0, true);
t('ดึงใบเองทั้งหมด ไม่ใช้แค่ 50 ใบล่าสุดที่หน้าโหลดไว้', H.indexOf('.eq("customer_id", c.id).limit(500)') >= 0, true);
console.log(NL + 'ผ่าน ' + ok + ' · ตก ' + fail);
if (fail) process.exit(1);

/* ลิงก์แจ้งเตือน Meal Plan + ประตู LIFF — กิ๊ฟรายงานลูกค้าเจอจริง 23 ก.ย. 2569
   ลูกค้ากดลิงก์ในข้อความ → "ยังไม่มี Meal Plan ที่ใช้งานอยู่" ทั้งที่แผนอยู่ครบใน DB
   เพราะลิงก์พาไปประตูเก่า ซึ่ง LINE ออกรหัสลูกค้าคนละชุด = ระบบมองเป็นคนละคน */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const rd = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
const API = rd('../../api/notify-mp-requests.js'), L = rd('../../liff_customer.html'), OH = rd('../../operation_hub.html');
const OLD = '2010442513-NI3JGTkb', NEW = '2011148232-oul66cEs';
let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL + '     ได้  ' + g + NL + '     ควร  ' + w); } };

console.log(NL + '① ข้อความหาลูกค้าต้องพาไปประตูที่ถูก');
t('ลิงก์ในข้อความแจ้งเตือน = ประตูใหม่', API.indexOf(NEW) >= 0, true);
t('ไม่เหลือประตูเก่าในไฟล์แจ้งเตือนเลย', API.indexOf(OLD) < 0, true);
t('ยังพาเข้าหน้าจัดการ Meal Plan เหมือนเดิม', API.indexOf('screen=mp-manage') >= 0, true);

console.log(NL + '② การเตือน "เปิดรอบเลือกเมนู" ปิดไว้ชั่วคราว (นัทเคาะ)');
t('มีสวิตช์เดียวที่เปิดคืนได้', API.indexOf('const SEND_OPEN_WINDOW = false;') >= 0, true);
t('ปิดแล้วต้องไม่แตะแถวไหน (ไม่ mark ว่าแจ้งแล้ว)', /if \(!SEND_OPEN_WINDOW\) return \{ \.\.\.out, paused: true/.test(API), true);
t('เตือนก่อนส่ง 1 วัน ยังอยู่ ไม่ถูกปิดตามไปด้วย', API.indexOf('runDayBeforeReminder') >= 0 && API.indexOf('function dayBeforeMsg') >= 0, true);

console.log(NL + '③ คนที่เข้าประตูเก่ามาต้องไม่คิดว่าแผนตัวเองหาย');
t('มีข้อความ+ปุ่มพาไปประตูใหม่', L.indexOf('function oldDoorNotice(){') >= 0 && L.indexOf('แผนของคุณยังอยู่ครบ') >= 0, true);
t('โผล่เฉพาะคนที่เข้าประตูเก่า', L.indexOf("if(!openedLid || openedLid === LIFF_DOOR_NEW) return \"\";") >= 0, true);
t('คนปกติเห็นข้อความเดิมทุกตัวอักษร', L.indexOf('ยังไม่มี Meal Plan ที่ใช้งานอยู่') >= 0, true);

console.log(NL + '④ การ์ดพรีวิวในแชทต้องไม่โชว์ของภายใน');
t('มีข้อความพรีวิวของหน้าเอง (og)', L.indexOf('property="og:title"') >= 0 && L.indexOf('property="og:description"') >= 0, true);
t('ไม่มีคำว่าทดสอบในข้อความพรีวิว', /<meta property="og:description" content="([^"]*)"/.exec(L)[1].indexOf('ทดสอบ') < 0, true);

console.log(NL + '⑤ เปิดรอบใหม่ต้องมีรหัส LINE ติดไปด้วยเสมอ');
t('ใบไม่มีรหัส → ไปหยิบจากลูกค้าที่ผูกไว้', OH.indexOf('if(!_uid && o.customer_id){') >= 0, true);
t('สั่งแทนลูกค้า ก็หยิบจากใบเป็นตัวสำรอง', OH.indexOf("line_uid:(obCust&&obCust.line_uid)||ord.data.line_uid||null,") >= 0, true);

console.log(NL + '⑥ หน้าลูกค้าใน OH ไม่ปนคนที่แค่เปิดแอปดู');
t('มีตัวแยก', OH.indexOf('function isLurker(c){') >= 0, true);
t('ซ่อนไว้ก่อน แต่ติ๊กดูได้', OH.indexOf('var CUST_SHOW_LURKERS=false;') >= 0 && OH.indexOf('function toggleLurkers(') >= 0, true);
t('บอกจำนวนที่ซ่อน ไม่ซ่อนเงียบ ๆ', OH.indexOf('รวมคนที่เปิดแอปดูเฉย ๆ อีก ') >= 0, true);
t('ตัวเลขสรุปนับเฉพาะลูกค้าจริง', OH.indexOf('var real=allCustomers.filter(function(c){return !isLurker(c);});') >= 0, true);

console.log(NL + 'ผ่าน ' + ok + ' · ตก ' + fail);
if (fail) process.exit(1);

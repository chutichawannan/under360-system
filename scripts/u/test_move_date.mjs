/* เทส "ย้ายวัน = เมนูเดิมเป็นโมฆะ" — กฎนัท 13 ก.ย. 2569
   "ลูกค้าย้ายวัน ห้ามย้ายเมนูมาด้วย — ที่เลือกไว้เป็นโมฆะ"

   เคสจริงที่ฟ้ารายงาน: 13 ก.ย. 15:00 กิ๊ฟเลื่อน Panpilai 14→16 ก.ย.
   → เมนูวันจันทร์ (20·36·39·54·67) ตามไปวันพุธ ทำให้วันพุธบานเป็น 14 เมนู

   เดิม OH ล้างเมนูเฉพาะตอนเลย 08:30 ของวันส่งเดิม (ถือว่าครัวทำแล้ว)
   ถ้ายังไม่ถึงเวลานั้น มันตั้งใจยกเมนูเดิมไปวันใหม่ → กฎใหม่ยกเลิกข้อยกเว้นนี้

   ⚠️ สิ่งที่ต้องไม่พังไปด้วย: "เก็บตู้" (จัดวันหนึ่ง เก็บไว้ ส่งอีกวัน)
      ของถูกทำไปแล้วจริงและตั้งใจเก็บ → เมนูต้องติดไปกับใบ ไม่งั้นแมส/ครัวไม่รู้ว่าส่งอะไร

   🐞 บทเรียนจากการเขียนเทสรอบแรก: เคยใส่ตัว "ตัดคอมเมนต์" มาก่อนตรวจ
      ปรากฏว่ามันกินไฟล์ไป 76% (มี /* อยู่ในสตริง/regex ทำให้นับไม่สมดุล) แล้วรายงานว่าโค้ดพัง
      ทั้งที่โค้ดถูก → ตรวจบนไฟล์จริงตรง ๆ และเลือกสตริงที่เกิดได้เฉพาะในโค้ดเท่านั้น */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const url = (p) => new URL(p, import.meta.url);
const OH = fs.readFileSync(url('../../operation_hub.html'), 'utf8').split(String.fromCharCode(13)).join('');
const LIFF = fs.readFileSync(url('../../liff_customer.html'), 'utf8').split(String.fromCharCode(13)).join('');

let pass = 0, fail = 0;
const ok = (name, got) => {
  if (got === true) { pass++; console.log('  ✅', name); }
  else { fail++; console.log('  ❌', name); }
};
const has = (s) => OH.indexOf(s) >= 0;
const count = (s) => OH.split(s).length - 1;

console.log(NL + '1) ทุกจุดที่ "ย้ายวัน" ต้องล้างเมนู');
ok('เลื่อนวันรอบนี้ — ล้างเมนูใน patch เสมอ ไม่ผูกกับเงื่อนไข cooked',
  has('menu_items:[], customer_request:[], status:"scheduled"'));
ok('ไม่เหลือทางเดิมที่ล้างเมนูเฉพาะตอน cooked',
  !has('if(cooked){' + NL + '      patch.menu_items=[];'));
ok('รอบถัดไปของคอร์ส (หน้าแพลนเมนู) ล้างเมนูด้วย',
  has('update({delivery_date:to,menu_items:[],customer_request:[],'));
ok('รอบถัดไปของคอร์ส (หน้าออเดอร์) ล้างเมนูด้วย',
  has('update({delivery_date:lto,menu_items:[],customer_request:[],'));
ok('ล้างแล้วกลับเข้าคิวให้จ่ายเมนูใหม่ทุกจุด (status scheduled อย่างน้อย 3 จุดใหม่)',
  count('status:"scheduled"') >= 4);

console.log(NL + '2) ข้อความที่แอดมินอ่าน + เอกสารในโค้ด ต้องตรงกับสิ่งที่ระบบทำจริง');
ok('เลิกบอกว่า "ยกเมนูเดิมไปวันใหม่" ทุกที่ในไฟล์', !has('ยกเมนูเดิมไปวันใหม่'));
ok('บอกตรง ๆ ว่าเมนูเดิมเป็นโมฆะ', has('เมนูเดิมเป็นโมฆะเหมือนกัน'));

console.log(NL + '3) ⚠️ "เก็บตู้" ต้องไม่โดนลูกหลง — ของทำไว้แล้ว เมนูต้องติดไปกับใบ');
/* เก็บตู้ = จัดวัน prep เก็บตู้ ส่งวัน ship · ไม่ใช่ "ย้ายวัน" ตามกฎนัท
   ถ้าเผลอล้างเมนูตรงนี้ แมสกับครัวจะไม่รู้ว่าใบนั้นส่งอะไร */
ok('ย้ายรอบไปวันส่ง (เก็บตู้) ยังไม่ล้างเมนู',
  has('update({delivery_date:ship,updated_at') && !has('delivery_date:ship,menu_items'));
ok('ดึงกลับตอนยกเลิกเก็บตู้ ก็ยังไม่ล้างเมนู',
  has('update({delivery_date:fr.prep,updated_at') && !has('delivery_date:fr.prep,menu_items'));

console.log(NL + '4) ฝั่งลูกค้าเลื่อนเอง — ต้องยังถูกเหมือนเดิม (ฟ้ายืนยันว่าฝั่งนี้ถูกอยู่แล้ว)');
ok('LIFF ล้างเมนูตอนลูกค้าเลื่อนวันเอง',
  LIFF.indexOf('mpManageConfirmMoveDate') >= 0 && LIFF.indexOf('menu_items: [],') >= 0);
ok('LIFF ตั้งสถานะกลับเป็น scheduled', LIFF.indexOf("status: 'scheduled',") >= 0);

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + pass) : ('✅ ผ่านทั้งหมด ' + pass + ' ข้อ'));
process.exit(fail ? 1 : 0);

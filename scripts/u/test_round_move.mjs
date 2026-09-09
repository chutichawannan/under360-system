/* เทส "ลูกค้าเลื่อนรอบแล้วใบต้องย้ายตาม" — เคส 03 (9 ก.ย. 2569)
   บั๊กเดิม: ระบบดูชื่อเมนูว่าขึ้นต้น MP- ไหม เพื่อเดาว่าใบนี้มีของลูกค้าปน
   แต่เมนูรายกล่องที่ระบบเขียนเอง (LC01 · HP28) ไม่ขึ้นต้น MP-
   → ระบบเห็นของตัวเอง นึกว่าลูกค้าซื้อของอื่นปน → ไม่ยอมย้ายใบ
   → ครัวทำตามวันเดิม ลูกค้าจ่ายเงินแล้วไม่ได้อาหาร (โดนจริง 5 ราย)

   ข้อมูลในเทสนี้ก๊อปมาจากใบจริงทั้งหมด ไม่ได้แต่งขึ้น */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');

/* ยกบรรทัดตัดสินจริงออกมาจากไฟล์ ไม่เขียนเลียนแบบ */
const line = (src.match(/mixed = rows\.some\([^;]+\);/) || [])[0];
if (!line) { console.log('🔴 หาบรรทัดตัดสินในไฟล์ไม่เจอ — รูปแบบโค้ดเปลี่ยน ต้องอัปเทส'); process.exit(1); }
const decide = new Function('rows', 'let mixed;' + line + ' return mixed;');

let ok = 0, fail = 0;
const t = (n, got, want) => {
  if (got === want) { ok++; console.log('  ✅', n); }
  else { fail++; console.log('  ❌', n, NL + '     ได้  ' + got + '  ควร  ' + want); }
};
/* true = "มีของลูกค้าปน" = ห้ามย้ายใบ · false = ย้ายได้ */
const canMove = (rows) => decide(rows) === false;

console.log(NL + '① ใบ 5 ใบที่ค้างอยู่จริง (ก๊อปรายการมาจากของจริง) — ต้องย้ายได้');
t('U-0904-005 ลักษณ์ · เมนูรายกล่องล้วน', canMove([
  { menu_code: 'LC20', notes: 'meal_plan:box:r3/3' },
  { menu_code: 'LC21', notes: 'meal_plan:box:r3/3' }]), true);
t('U-0909-008 Cherry · หัวข้อรอบ + เมนูรายกล่อง', canMove([
  { menu_code: 'MP-HP-T', notes: 'meal_plan:hp:trial:req=เลือกเอง 7/7 มื้อ' },
  { menu_code: 'HP10', notes: 'meal_plan:box:r1/1' }]), true);
t('ใบรอบที่ยังไม่ assign เมนู (มีแต่หัวข้อรอบ)', canMove([
  { menu_code: 'MP-LC-R2', notes: 'meal_plan:lc:monthly:round:2/12' }]), true);

console.log(NL + '② ใบที่มีของลูกค้าปนจริง — ต้องไม่ย้าย');
t('มีแพคเกจที่ลูกค้าซื้อปน (U-0811-012)', canMove([
  { menu_code: 'HP39', notes: 'meal_plan:box:r1/1' },
  { menu_code: 'HX30', notes: 'pkg:081b75c9-1b42-4c3b-b89c-1b66efaf0c69' }]), false);
t('มีเซ็ตปน (HT-1933398303)', canMove([
  { menu_code: 'MP-HP-R1', notes: 'meal_plan:hp:weekly:round:1/3' },
  { menu_code: '1', notes: 'set:1' }]), false);
t('มีเมนูเดี่ยวที่ไม่มีหมายเหตุปน (HT-1786241575)', canMove([
  { menu_code: 'MP-LC-R1', notes: 'meal_plan:lc:weekly:round:1/3' },
  { menu_code: 'BJ3', notes: null }]), false);

console.log(NL + '③ ของแถมที่ระบบใส่ให้ ไม่ใช่ของที่ลูกค้าเลือกซื้อ — ต้องยังย้ายได้');
t('รอบ + ของแถม', canMove([
  { menu_code: 'LC20', notes: 'meal_plan:box:r3/3' },
  { menu_code: 'MC1', notes: 'gift:order:jayold' }]), true);

console.log(NL + '④ ของแปลก ต้องไม่พาไปย้ายมั่ว (ปลอดภัยไว้ก่อน)');
t('ไม่มีหมายเหตุเลยสักบรรทัด', canMove([{ menu_code: 'X1', notes: '' }]), false);
t('หมายเหตุเป็น null', canMove([{ menu_code: 'X1', notes: null }]), false);
t('ใบว่าง (ไม่มีรายการ) — ย้ายได้ ไม่มีอะไรให้เสีย', canMove([]), true);
t('พิมพ์ใหญ่ MEAL_PLAN: ก็ยังรู้จัก', canMove([{ menu_code: 'A', notes: 'MEAL_PLAN:box:r1/1' }]), true);

console.log(NL + '⑤ 🔴 กฎเดิมต้องพังกับเคสนี้จริง (ยืนยันว่าแก้ถูกจุด)');
{
  const oldRule = (rows) => !rows.some((x) => String(x.menu_code || '') && !/^MP-/i.test(String(x.menu_code || '')));
  t('กฎเดิมปฏิเสธใบของลักษณ์ (นี่คือต้นเหตุ)', oldRule([
    { menu_code: 'LC20', notes: 'meal_plan:box:r3/3' }]), false);
  t('กฎใหม่ยอมย้ายใบเดียวกัน', canMove([
    { menu_code: 'LC20', notes: 'meal_plan:box:r3/3' }]), true);
}

console.log(NL + (fail ? '❌' : '✅') + ' ผ่าน ' + ok + ' · ตก ' + fail);
process.exitCode = fail ? 1 : 0;

/* เก็บ HX / Hyrox ออกจากเว็บให้หมด (นัทอนุมัติผ่าน CC 21 ส.ค. 2026)

   ⚠️ ทำไมต้องเก็บให้ครบทุกจุด ไม่ใช่แค่ที่ตาเห็น:
   นัทเข้าใจว่า "เก็บไปแล้ว" เพราะเห็นว่าปุ่มบนหน้าแรกหายไป
   แต่ที่ยังอยู่คือ `meta description` / `og:description` / schema
   → **Google กับ Facebook ดึงไปโชว์ แต่เปิดหน้าเว็บดูด้วยตาไม่เห็น**
   = เหตุผลที่คนเข้าใจผิดกันทั้งบ้านว่าเสร็จแล้ว

   ปิดงานต้องนับให้เหลือ 0 แล้วรายงานตัวเลข (กติกาใหม่ที่นัทตั้ง)
   รันซ้ำได้ */
import fs from 'fs';

const count = h => ({
  HX: (h.match(/HX/g) || []).length,
  hyrox: (h.match(/hyrox/gi) || []).length,
  prep: (h.match(/เตรียมแข่ง|ซ้อมหนัก/g) || []).length,
});
const show = (tag, c) => console.log(`  ${tag.padEnd(22)} HX:${c.HX} hyrox:${c.hyrox} ซ้อม/แข่ง:${c.prep}`);

/* ══ index.html ══ */
let f = 'web/index.html';
let crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
let h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
show('index (ก่อน)', count(h));

/* meta description + og:description — ตัวที่ Google/FB ดึงไปโชว์ */
h = h.replace('Meal Plan 3 สาย โปรตีนสูง (HP) · Low Carb (LC) · Hyrox/นักกีฬา (HX) จัดเมนูตามเป้าหมาย',
              'Meal Plan 2 สาย โปรตีนสูง (HP) · Low Carb (LC) จัดเมนูตามเป้าหมาย');
h = h.replace('Meal Plan 3 สาย HP · LC · HX จัดเมนูตามเป้าหมายของคุณ',
              'Meal Plan 2 สาย HP · LC จัดเมนูตามเป้าหมายของคุณ');
/* การ์ดบนหน้าแรก */
h = h.replace('<h3>Meal Plan — 3 สาย: HP · LC · HX</h3>', '<h3>Meal Plan — 2 สาย: HP · LC</h3>');
h = h.replace('<b>HP</b> โปรตีนสูง 170 g · <b>LC</b> โลว์คาร์บ 120 g · <b>HX</b> สายซ้อมหนัก/เตรียมแข่ง — ทำสดส่งบ่าย',
              '<b>HP</b> โปรตีนสูง 170 g · <b>LC</b> โลว์คาร์บ 120 g — ทำสดส่งบ่าย');
/* ข้อความในปุ่มเป้าหมาย "เพิ่มกล้าม" ที่พูดถึงคนเตรียมแข่ง */
h = h.replace('รองรับสายเวท สายวิ่ง และคนเตรียมแข่ง', 'รองรับสายเวทและสายวิ่ง');
/* คอมเมนต์ในโค้ด (ไม่กระทบลูกค้า แต่ทำให้คนอ่านโค้ดเข้าใจผิด) */
h = h.replace('เว็บสาธารณะไม่โชว์ HP/LC/HX เพราะ', 'เว็บสาธารณะไม่โชว์ HP/LC เพราะ');
show('index (หลัง)', count(h));
fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);

/* ══ mealplan.html ══ */
f = 'web/mealplan.html';
crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
show('mealplan (ก่อน)', count(h));

/* การ์ดสาย HX ทั้งก้อน */
const HXCARD = h.match(/      <div class="plan hx">[\s\S]*?<\/div>\n(?=    <\/div>)/);
if (HXCARD) h = h.replace(HXCARD[0], '');
/* การ์ดราคา Hyrox Set ทั้งก้อน */
const HXPRICE = h.match(/      <div class="price">\n        <h3>Hyrox Set<\/h3>[\s\S]*?<\/div>\n(?=    <\/div>)/);
if (HXPRICE) h = h.replace(HXPRICE[0], '');
/* meta / og */
h = h.replace('โปรตีนสูง (HP 170g) · Low Carb (LC 120g) · HX สำหรับสายซ้อมหนัก/Hyrox ตัดของแพ้อัตโนมัติ',
              'โปรตีนสูง (HP 170g) · Low Carb (LC 120g) ตัดของแพ้อัตโนมัติ');
/* ย่อหน้าเนื้อหา */
h = h.replace(/ และ HX สำหรับคนซ้อมหนัก[^<]*?เตรียมลงแข่ง เช่น Hyrox ไตรกีฬา วิ่งระยะไกล/g, '');
h = h.replace(/ และ Hyrox Set 21 กล่อง 4,500 บาท สำห[^<]*?(?=<|$)/g, '');
h = h.replace('สร้างกล้ามเนื้อ / เตรียมแข่ง', 'สร้างกล้ามเนื้อ');
show('mealplan (หลัง)', count(h));
fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);

/* ══ สรุป ══ */
let total = 0;
console.log('\n═══ เหลือทั้งหมด ═══');
for (const file of ['web/index.html', 'web/mealplan.html', 'web/blog.html', 'web/v03.html']) {
  const c = count(fs.readFileSync(file, 'utf8'));
  const s = c.HX + c.hyrox + c.prep;
  total += s;
  console.log(`  ${file.padEnd(22)} รวม ${s} จุด` + (s ? `  ← HX:${c.HX} hyrox:${c.hyrox} ซ้อม/แข่ง:${c.prep}` : ' ✅'));
}
console.log(`\n${total === 0 ? '✅' : '⚠️'} เหลือรวม ${total} จุด`);

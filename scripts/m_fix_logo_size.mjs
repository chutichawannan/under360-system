/* โลโก้เล็กเกินไป — นัทชี้เอง 2 ก.ย. 2026 (ทั้งโลโก้ร้านและโลโก้เทศกาลเจ)

   🔴 ที่เจอตอนไปวัดของจริง หนักกว่าคำว่า "เล็ก":
   ไฟล์ `u360_logo.svg` คือ **โลโก้เต็มที่มีคำว่า UNDER360 อยู่ในภาพแล้ว** (viewBox 587x247 ≈ 2.4:1)
   แต่ทุกหน้าบังคับให้เป็น **กล่องสี่เหลี่ยมจัตุรัส 36x36 + ครอบวงกลม**
   → ภาพถูกบีบผิดสัดส่วนจนอ่านไม่ออก **แล้วยังมีคำว่า "Under360" พิมพ์ซ้ำอยู่ข้างๆ อีก**
   = ในแถบบนมีชื่อร้าน 2 ชุดซ้อนกัน โดยชุดที่เป็นโลโก้จริงอ่านไม่ออก

   แก้: โชว์โลโก้ตามสัดส่วนจริง สูงขึ้น เอาวงกลมออก และ **ตัดข้อความที่ซ้ำทิ้ง**
   (ไม่ใช่แค่ขยาย — ถ้าขยายอย่างเดียวจะได้ชื่อร้านซ้อนกัน 2 ชุดตัวใหญ่ขึ้น)
   รันซ้ำได้ */
import fs from 'fs';

const PAGES = ['web/index.html', 'web/mealplan.html', 'web/blog.html', 'web/pack.html', 'web/jay.html'];

for (const F of PAGES) {
  if (!fs.existsSync(F)) continue;
  const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
  let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes('u360-logo-fix')) { console.log('⏭️  ทำแล้ว: ' + F); continue; }

  /* ── ① เอาข้อความ "Under360" ที่ซ้ำกับในโลโก้ออก ── */
  const before = h;
  h = h.replace(/(<a class="logo"[^>]*>\s*<img[^>]*u360_logo\.svg[^>]*>)\s*Under360\s*(<\/a>)/, '$1$2');
  if (h === before) console.log('   ⚠️  ' + F + ': ไม่เจอข้อความซ้ำ (อาจแก้ไปแล้ว)');

  /* ── ② ขนาดโลโก้ตามสัดส่วนจริง ── */
  const CSS = `/* ── u360-logo-fix (2 ก.ย. 2026) — โลโก้เป็นภาพแนวนอน 2.4:1 ที่มีชื่อร้านอยู่ในตัว
   ห้ามบังคับเป็นจัตุรัส/วงกลมอีก จะบีบจนอ่านไม่ออก ── */
header .logo img,.nav .logo img{
  width:auto!important;height:38px!important;border-radius:0!important;flex:none;display:block;
}
@media(max-width:520px){
  header .logo img,.nav .logo img{height:30px!important}
}
`;
  const i = h.lastIndexOf('</style>');
  if (i < 0) { console.error('❌ ไม่เจอ </style> ใน ' + F); process.exit(1); }
  h = h.slice(0, i) + CSS + h.slice(i);

  fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log('✅ ' + F);
}

/* ── ③ โลโก้เทศกาลเจบนแบนเนอร์ — ขยายให้เห็นชัด ── */
{
  const F = 'web/index.html';
  const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
  let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
  const OLD = '<img class="seal" src="/img/jay/jay-logo.svg" alt="ธงเจ" width="30" height="47">';
  if (h.includes(OLD)) {
    h = h.replace(OLD, '<img class="seal" src="/img/jay/jay-logo.svg" alt="ธงเจ" width="46" height="72">');
    h = h.replace(/\.jaybar \.seal\{width:30px;[^}]*\}/,
      '.jaybar .seal{width:46px;height:auto;flex:none;display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,.2))}');
    h = h.replace('.jaybar .seal{width:26px}', '.jaybar .seal{width:36px}');
    fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
    console.log('✅ โลโก้เจบนแบนเนอร์ 30px → 46px (มือถือ 26 → 36px)');
  } else console.log('⏭️  โลโก้เจขยายแล้ว');
}

/* ── ④ โลโก้เจบนหัวหน้า /jay ── */
{
  const F = 'web/jay.html';
  const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
  let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes('.jaylogo{width:52px')) {
    h = h.replace('.jaylogo{width:52px;', '.jaylogo{width:76px;');
    h = h.replace('@media(max-width:600px){.jaylogo{width:42px}}', '@media(max-width:600px){.jaylogo{width:58px}}');
    h = h.replace('class="jaylogo" width="52" height="81"', 'class="jaylogo" width="76" height="119"');
    fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
    console.log('✅ โลโก้เจบนหัวหน้า /jay 52px → 76px (มือถือ 42 → 58px)');
  } else console.log('⏭️  หัวหน้า /jay ขยายแล้ว');
}

console.log('\n✅ เสร็จ');

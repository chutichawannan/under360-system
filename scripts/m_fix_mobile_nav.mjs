/* 🔴 แก้ด่วน: แถบบนพังบนมือถือ (นัทเปิดจากมือถืออีกเครื่องแล้วเจอ 27 ส.ค. 2026)

   อาการที่นัทเห็น: โลโก้โดนทับ · "Meal Plan" ตกบรรทัด · ปุ่ม "สั่งใน LINE" กลายเป็นวงกลมใหญ่
   วัดของจริงที่ 412px: แถบสูง 64px แต่ของข้างในสูง 88px · ปุ่ม 102×87px · ลิงก์ Meal Plan 42×69px

   ต้นเหตุ = ผมเอง ตอนทำหน้าตามินิมอล 20 ส.ค.:
     .btn{padding:15px 30px!important; border-radius:999px!important}
   ใส่ให้ปุ่มทุกตัวรวมปุ่มเล็กบนแถบบน → จอแคบตัวหนังสือตกบรรทัด → กล่องสูงขึ้น
   → มุมโค้ง 999px บนกล่องเกือบสี่เหลี่ยมจัตุรัส = วงกลม

   แก้: ห้ามตัวหนังสือตกบรรทัดในแถบบน + ปุ่มบนแถบบนใช้ขนาดของตัวเอง ไม่กินกฎปุ่มใหญ่
   รันซ้ำได้ */
import fs from 'fs';

const FILES = ['web/index.html', 'web/mealplan.html', 'web/blog.html', 'web/v03.html', 'web/pack.html'];

const CSS = `/* ── u360-nav-fix (27 ส.ค.) — แถบบนพังบนมือถือ: ตัวหนังสือตกบรรทัดจนปุ่มบวมเป็นวงกลม ── */
header .nav,header nav{flex-wrap:nowrap}
header .nav a,header nav a,header .logo{white-space:nowrap}
header .logo img{flex:none}
/* ปุ่มบนแถบบนต้องเล็กกว่าปุ่มในเนื้อหา — ไม่กินกฎ .btn ที่ตั้งไว้สำหรับปุ่มใหญ่ */
header .btn,header .btn-line,header a.btn-line{
  padding:9px 16px!important;min-height:38px!important;height:38px;
  font-size:.9rem!important;line-height:1;white-space:nowrap;flex:none;
}
@media(max-width:520px){
  header .nav{gap:10px}
  header .logo{font-size:.98rem!important}
  header .logo img{width:28px;height:28px}
  /* จอแคบมาก: ซ่อนลิงก์เมนู เหลือโลโก้ + ปุ่มสั่ง (ลิงก์ครบอยู่ท้ายหน้าแล้ว) */
  header nav a:not(.btn):not(.btn-line){display:none}
  header .btn,header .btn-line,header a.btn-line{padding:9px 14px!important;font-size:.86rem!important}
}
`;

let n = 0;
for (const f of FILES) {
  if (!fs.existsSync(f)) continue;
  const crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
  let h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes('u360-nav-fix')) { console.log('⏭️  แก้แล้ว:', f); continue; }
  const i = h.lastIndexOf('</style>');
  if (i < 0) { console.error('❌ ไม่เจอ </style> ใน', f); process.exit(1); }
  h = h.slice(0, i) + CSS + h.slice(i);
  fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log('✅', f);
  n++;
}
console.log(`\n✅ แก้ ${n} ไฟล์`);

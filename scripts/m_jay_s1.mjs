/* แก้ทีละ section ตามที่นัทสั่ง (2 ก.ย. 2026) — รอบนี้เอาแค่ header + section แรก

   นัทบอก: "ดีไซน์มันน่ากลัว คนเห็นทุกอย่างเยอะๆ แล้วจะกลัว"
   → หลักคิดรอบนี้ = ลดของที่ตะโกน ไม่ใช่เพิ่มของ

   header
     · โลโก้ใหญ่เกิน (หลังครอบขอบว่างออก ตัวโลโก้โตขึ้น 1.6 เท่า ค่าเดิมเลยกลายเป็นใหญ่ไป) → ลดลง
     · ปุ่ม "จองคอร์สเจ" มี dropshadow ไม่สวย → เอาออก
   section แรก
     · จับ ①โลโก้ ②วันที่ ③หัวเรื่อง เป็นกลุ่มเดียวกัน
       วันที่ = บรรทัดเดียวจบ · หัวเรื่อง = บรรทัดถัดมา
     · โลโก้เจ ไม่ dropshadow · ปุ่มจองคอร์สเจ ไม่ dropshadow
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-jay-s1')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

/* ── วันที่: 3 บรรทัด → บรรทัดเดียว ── */
const OLD = `      <div class="jaydate">
        <span class="k">เทศกาลกินเจ</span>
        <strong>10 – 18 ตุลาคม</strong>
        <span class="y">2569</span>
      </div>`;
must(h.includes(OLD), 'ไม่เจอบล็อกวันที่');
h = h.replace(OLD, `      <p class="jaydate">เทศกาลกินเจ <strong>10 – 18 ตุลาคม 2569</strong></p>`);
console.log('  ✅ วันที่เหลือบรรทัดเดียว');

/* ── โลโก้ + วันที่ + หัวเรื่อง = กลุ่มเดียวกัน ── */
must(h.includes('    <h1>คอร์สอาหารเจ 30 เมนู ไม่ซ้ำสักมื้อ</h1>'), 'ไม่เจอ h1');
h = h.replace(`    </div>
    <h1>คอร์สอาหารเจ 30 เมนู ไม่ซ้ำสักมื้อ</h1>`,
`      <h1>คอร์สอาหารเจ 30 เมนู ไม่ซ้ำสักมื้อ</h1>
    </div>`);
/* ย้าย h1 เข้าไปอยู่ใน .jayhead → โลโก้ซ้าย · วันที่+หัวเรื่องขวา ชิดกันเป็นก้อนเดียว */
console.log('  ✅ จับโลโก้ + วันที่ + หัวเรื่อง เป็นกลุ่มเดียว');

/* ── CSS ── */
must(h.includes('</style>'), 'ไม่เจอ </style>');
h = h.replace('</style>', `/* ── u360-jay-s1 (2 ก.ย.) — header + section แรก ── */

/* header: โลโก้พอดีตา ไม่ตะโกน · ปุ่มไม่มีเงา */
header .nav{height:64px}
header .logo img,header .nav .logo img{height:34px!important}
header .btn-jay,header .btn-line{box-shadow:none!important}
@media(max-width:520px){
  header .nav{height:60px}
  header .logo img,header .nav .logo img{height:30px!important}
}

/* section แรก: โลโก้ · วันที่ · หัวเรื่อง = ก้อนเดียว ไม่กระจัดกระจาย */
.jayhead{display:flex;align-items:flex-start;gap:16px;margin-bottom:0}
.jaylogo{width:64px;height:auto;flex:none;filter:none;margin-top:2px}   /* ③ ไม่มีเงา */
.jayhead h1{margin-top:2px}
.jaydate{font-family:'Prompt',sans-serif;font-weight:500;font-size:.98rem;color:var(--muted);
  letter-spacing:.01em;line-height:1.3}
.jaydate strong{font-weight:700;color:var(--deep)}
.hero h1{font-size:2.3rem;max-width:none;text-wrap:balance}
.hero p.sub{margin-top:12px}

/* ปุ่มจองคอร์สเจ — ไม่เอาเงา */
.btn-jay{box-shadow:none!important}

@media(max-width:600px){
  .jayhead{gap:12px}
  .jaylogo{width:50px}
  .jaydate{font-size:.92rem}
  .hero h1{font-size:1.9rem}
}
</style>`);
console.log('  ✅ เอา dropshadow ออก: โลโก้เจ · ปุ่มจองคอร์สเจ · ปุ่มบนแถบบน');
console.log('  ✅ โลโก้แถบบน 52 → 34px (มือถือ 44 → 30) · แถบบนกลับเป็น 64px');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F);

/* หน้า /jay โล่งเกินไป — นัทบอกเอง "ช่องไฟห่างเกินไป ดูโล่ง จนไม่อยากเข้าต่อ" (2 ก.ย. 2026)

   วิเคราะห์จากภาพที่นัทส่ง — ไม่ใช่แค่ระยะห่างเยอะ มี 3 เรื่องซ้อนกัน:
   ① **ครึ่งขวาว่างทั้งแถบ** หัวเรื่องกองซ้ายเป็นคอลัมน์แคบ ที่เหลือขาวโล่ง
   ② **หน้าขายอาหาร แต่ไม่มีรูปอาหารสักรูป** — นี่คือเหตุผลหลักที่ "ไม่อยากเข้าต่อ"
      (กฎรูปแอดที่นัทเคาะเอง 26 ส.ค.: รูป = ปัจจัยระดับต้นๆ ไม่ใช่ของแถม)
   ③ ระยะห่างแนวตั้งเยอะจริง — section 58px · หัวเรื่องตัดบรรทัดเร็วเพราะกว้างแค่ 16 ตัวอักษร

   แก้: เอารูปคอลลาจอาหารจริงมาใส่ครึ่งขวา + บีบระยะห่างลงทั้งหน้า + bullet 2 คอลัมน์บนจอกว้าง
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-jay-tight')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

/* ── ① หัวเรื่อง 2 คอลัมน์ — ข้อความซ้าย รูปอาหารขวา ── */
const S = h.indexOf('<div class="hero">');
const E = h.indexOf('</div>\n</div>', S) + '</div>\n</div>'.length;
must(S > 0, 'ไม่เจอ hero');
const heroInner = h.slice(h.indexOf('<div class="wrap">', S) + '<div class="wrap">'.length, h.lastIndexOf('</div>', E));

h = h.slice(0, S) + `<div class="hero">
  <div class="wrap hero-grid">
    <div class="hero-txt">${heroInner}</div>
    <div class="hero-pic">
      <img src="/img/jay/cover.png" alt="ตัวอย่างเมนูในคอร์สอาหารเจ 2569" width="1080" height="1080" loading="eager">
    </div>
  </div>
</div>` + h.slice(E);
console.log('  ✅ หัวเรื่อง 2 คอลัมน์ + รูปอาหารจริงครึ่งขวา');

/* ── ②③ บีบระยะห่าง ── */
must(h.includes('</style>'), 'ไม่เจอ </style>');
h = h.replace('</style>', `/* ── u360-jay-tight — แก้ "โล่งจนไม่อยากเข้าต่อ" ── */
.hero-grid{display:grid;grid-template-columns:1fr;gap:26px;align-items:center}
.hero-pic{display:none}
.hero-pic img{width:100%;height:auto;border-radius:18px;box-shadow:0 14px 40px rgba(20,56,35,.16);display:block}
@media(min-width:900px){
  .hero-grid{grid-template-columns:1.05fr .95fr;gap:44px}
  .hero-pic{display:block}
  .hero h1{max-width:none}
}

/* ระยะห่างแนวตั้ง — เดิม 58px ทุก section ทำให้ต้องเลื่อนนานกว่าจะเจอของถัดไป */
section{padding:42px 0}
.hero{padding:26px 0 40px!important}
.hero h1{font-size:2.5rem;letter-spacing:-.02em}
.hero p.sub{margin-top:10px}
.facts{margin-top:18px;gap:7px}
.hero .cta{margin-top:22px}
h2.sec+p,.lead{margin-top:6px}
.callout{margin-top:18px}
.mpnote,.mini{margin-top:18px}

/* bullet 2 คอลัมน์บนจอกว้าง — 5 ข้อเรียงลงมาเดี่ยวๆ ทำให้หน้ายืดโดยไม่จำเป็น */
@media(min-width:900px){
  .facts{grid-template-columns:1fr 1fr;column-gap:22px;max-width:none}
}
@media(max-width:600px){
  section{padding:34px 0}
  .hero{padding:18px 0 30px!important}
  .hero h1{font-size:2rem}
}
</style>`);
console.log('  ✅ บีบระยะห่าง: section 58 → 42px (มือถือ 34) · hero 30 → 26px');
console.log('  ✅ bullet 2 คอลัมน์บนจอกว้าง');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F);

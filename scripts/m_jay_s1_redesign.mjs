/* section แรก /jay — ทำตามแบบที่นัทเอามาจาก ChatGPT (นัทเป็นดีไซเนอร์ ตัดสินแล้วว่าแบบนั้นดีกว่า)

   สิ่งที่แบบนั้นทำได้ดีกว่าของผม — จดไว้ใช้กับ section อื่นด้วย:
   ① โลโก้+วันที่เป็นแถวของตัวเอง แล้วหัวเรื่องลงมาเต็มความกว้างข้างล่าง
      (ของผมยัดหัวเรื่องไปอยู่ในกลุ่มเดียวกับโลโก้ → หัวเรื่องถูกบีบให้แคบ ตัดบรรทัดมั่ว)
   ② คำโปรยตัดบรรทัดเอง ไม่ปล่อยให้ประโยคยาวพันกันด้วย —
   ③ รายการคุณสมบัติมี "ไอคอนในวงกลม + เส้นคั่นแต่ละแถว" → กวาดตาอ่านทีละบรรทัดได้
      (bullet จุดเขียวเฉยๆ ของผม อ่านเป็นก้อนเดียว แยกไม่ออก)
   ④ ปุ่มเต็มความกว้าง ข้อความอยู่กลาง + หมายเหตุอยู่ใต้ปุ่มตรงกลาง (ไม่ใช่ห้อยข้างปุ่ม)
   ⑤ เนื้อหาเป็นคอลัมน์เดียว จัดกลาง — ไม่ต้องดิ้นหาของมาถมครึ่งขวา

   ⚠️ 2 จุดที่ไม่ลอกตาม เพราะขัดกฎแบรนด์ที่ห้องเจล็อกไว้:
     · โปรตีน — แบบนั้นเขียน "25g+" (แปลว่าอย่างน้อย 25g = เคลมแรงกว่าเดิม)
       ใบงานห้องเจสั่งไว้ว่า "ห้ามเคลมตัวเลขโปรตีนโดยไม่มี * และหมายเหตุกำกับ" → คงไว้ที่ 25g*
     · ปุ่มเปลี่ยนเป็น "จองคอร์สเลย" ตามแบบ (อันนี้ลอกตาม ไม่มีปัญหา)
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-jay-s1b')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

/* ── ไอคอนเส้น เขียนเอง ไม่ดึงจากข้างนอก (หน้าเว็บห้ามพึ่ง CDN) ── */
const ic = {
  box:  '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
  cal:  '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  truck:'<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
  leaf: '<path d="M20 4c0 8-5 13-13 13H4c0-8 5-13 13-13h3Z"/><path d="M4 20c3-5 7-8 12-9"/>',
  pin:  '<path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>'
};
const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ic[k]}</svg>`;

const FEATS = [
  ['box',   '30 กล่อง',        'ครบทั้งเทศกาล'],
  ['cal',   '3 มื้อต่อวัน',     'เช้า กลางวัน เย็น'],
  ['truck', 'ส่งถึงบ้าน 3 รอบ', 'ไม่ต้องรอรับทุกวัน'],
  ['leaf',  'โปรตีน 25g*',     'ต่อกล่อง'],
  ['pin',   'ส่งทั่วไทย',       'ต่างจังหวัดราคาเดียวกัน'],
];

/* ── แทนที่ hero ทั้งก้อน ── */
const S = h.indexOf('<div class="hero">');
const E = h.indexOf('<!-- ═══ โปรตีน ═══ -->');
must(S > 0 && E > S, 'ไม่เจอขอบเขต hero');

h = h.slice(0, S) + `<div class="hero">
  <div class="wrap hero-in">

    <div class="jayhead">
      <img src="/img/jay/jay-logo.svg" alt="ธงเจ" class="jaylogo" width="64" height="100">
      <div class="jaydate">
        <span>เทศกาลกินเจ</span>
        <strong>10 – 18 ตุลาคม 2569</strong>
      </div>
    </div>

    <h1>คอร์สอาหารเจ 30 เมนู ไม่ซ้ำสักมื้อ</h1>
    <p class="sub">กินเจครบ 10 วัน โดยไม่ต้องคิดเองสักมื้อ<br>ครัวทำสด แล้วส่งถึงบ้านให้ 3 รอบ</p>

    <ul class="feat">
${FEATS.map(([k, b, s]) => `      <li><span class="ic">${svg(k)}</span><span class="tx"><b>${b}</b> ${s}</span></li>`).join('\n')}
    </ul>

    <a href="#" class="btn-line btn-jay wide" onclick="return jayOrder(this,'hero')">จองคอร์สเลย — Early Bird 4,190.-</a>
    <p class="note">จำกัด 50 คอร์สแรกเท่านั้น</p>

    <div class="hero-pic">
      <img src="/img/jay/collage.png" alt="ตัวอย่างเมนูในคอร์สอาหารเจ 2569" width="900" height="600" loading="eager">
    </div>

  </div>
</div>

` + h.slice(E);
console.log('  ✅ วางโครง hero ใหม่ตามแบบ');

/* ── ปุ่มอื่นๆ ให้เรียกเหมือนกันทั้งหน้า ── */
h = h.replace('>จองคอร์สเจ</a>', '>จองคอร์สเลย</a>');
h = h.replace('>จองคอร์สเจ 2569 →</a>', '>จองคอร์สเลย →</a>');
h = h.replace(/<a href="#" class="btn-line btn-jay" onclick="return jayOrder\(this,'sticky'\)">จองคอร์สเจ<\/a>/,
              `<a href="#" class="btn-line btn-jay" onclick="return jayOrder(this,'sticky')">จองคอร์สเลย</a>`);
console.log('  ✅ ปุ่มทั้งหน้าใช้คำว่า "จองคอร์สเลย"');

/* ── CSS ── */
must(h.includes('</style>'), 'ไม่เจอ </style>');
h = h.replace('</style>', `/* ═══ u360-jay-s1b — section แรก ทำตามแบบที่นัทเลือก ═══ */
.hero{padding:22px 0 34px!important}
.hero-in{max-width:760px}

/* โลโก้ + วันที่ = แถวของตัวเอง หัวเรื่องลงมาเต็มความกว้างข้างล่าง */
.jayhead{display:flex;align-items:center;gap:16px;margin:0 0 20px}
.jaylogo{width:64px;height:auto;flex:none;filter:none;margin:0}
.jaydate{display:flex;flex-direction:column;gap:2px;line-height:1.25}
.jaydate span{font-family:'Prompt',sans-serif;font-weight:500;font-size:1rem;color:var(--muted)}
.jaydate strong{font-family:'Prompt',sans-serif;font-weight:700;font-size:1.6rem;
  color:var(--deep);letter-spacing:-.01em}

.hero h1{font-size:2.4rem;max-width:none;text-wrap:balance;margin:0}
.hero p.sub{margin-top:16px!important;font-size:1.08rem;color:var(--muted);max-width:none}

/* รายการคุณสมบัติ — ไอคอนในวงกลม + เส้นคั่น กวาดตาอ่านทีละบรรทัดได้ */
.feat{list-style:none;margin:24px 0 0;padding:0}
.feat li{display:flex;align-items:center;gap:14px;padding:13px 2px;
  border-top:1px solid rgba(31,122,77,.14)}
.feat li:first-child{border-top:0}
.feat .ic{flex:none;width:42px;height:42px;border-radius:50%;
  border:1px solid rgba(31,122,77,.22);background:rgba(64,181,73,.07);
  display:flex;align-items:center;justify-content:center;color:var(--deep)}
.feat .ic svg{width:21px;height:21px;display:block}
.feat .tx{font-size:1rem;color:var(--muted);line-height:1.45}
.feat .tx b{font-family:'Prompt',sans-serif;font-weight:600;color:var(--ink)}

/* ปุ่มเต็มความกว้าง + หมายเหตุอยู่ใต้ปุ่มตรงกลาง */
.btn-jay.wide{display:flex;width:100%;margin-top:24px;padding:17px 24px;font-size:1.06rem;text-align:center}
.hero .note{margin-top:10px;text-align:center;font-size:.92rem;color:var(--muted)}

.hero-pic{margin-top:26px;max-width:none}
.hero-pic img{border-radius:14px;box-shadow:none;border:1px solid var(--hair)}

@media(max-width:600px){
  .hero{padding:18px 0 28px!important}
  .jaylogo{width:54px}
  .jaydate span{font-size:.92rem}
  .jaydate strong{font-size:1.32rem}
  .hero h1{font-size:1.95rem}
  .hero p.sub{font-size:1rem}
  .feat .ic{width:38px;height:38px}
  .feat .ic svg{width:19px;height:19px}
  .feat .tx{font-size:.97rem}
}
</style>`);
console.log('  ✅ CSS: ไอคอนวงกลม + เส้นคั่น · ปุ่มเต็มความกว้าง · คอลัมน์เดียวจัดกลาง');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F);

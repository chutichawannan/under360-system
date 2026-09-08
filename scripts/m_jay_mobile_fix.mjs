/* หน้า /jay บนมือถือ — นัทสั่งเอง 8 ก.ย. 2026 (ดูจากเครื่องจริง)
   ① รูปตัวชูต้องอยู่ "ข้าง" ข้อความหลัก ไม่ใช่กองใหญ่อยู่ใต้
   ② รูปเมนูในส่วน "อร่อยหลากหลาย ทุกวัน" ต้องเรียง 3 คอลัมน์
   ③ (ค้างจากงานแคตตาล็อก) รูปการ์ดเมนูให้เป็นสัดส่วนจริงของแต่ละรูป
      แนวตั้ง 0.67 กับแนวนอน 1.50 ต่างกันเกินกว่ากรอบเดียวจะรับไหว
      ครอบตัด = จานหาย · ยัดในกรอบ = รูปหดเหลือนิดเดียว
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html', D = '.scratch/jay/final30/';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');

/* ═══ ③ การ์ดเมนู: สัดส่วนจริง + ใส่ขนาดจริงกันหน้ากระตุก ═══ */
if (h.includes('aspect-ratio:4/3; object-fit:contain')) {
  h = h.replace(
    '.dish img { width:100%; height:auto; aspect-ratio:4/3; object-fit:contain;\n                border-radius:14px; border:1px solid var(--line); display:block; background:#fff; }',
    '.dish img { width:100%; height:auto; border-radius:14px; border:1px solid var(--line);\n                display:block; background:#fff; }');
  h = h.replace('.dish-grid { list-style:none; display:grid;', '.dish-grid { list-style:none; display:grid; align-items:start;');
  /* อ่านขนาดจริงจากหัวไฟล์ PNG (IHDR) แล้วกวาดทีเดียวด้วยตัวจับตัวเดียว
     เทียบรหัสจาก capture group — เลี่ยงการประกอบ regex จากข้อความทีละรหัส
     (ประกอบเองแล้วพลาดเรื่อง backslash มาแล้ว เงียบด้วย ไม่ error) */
  const dim = {};
  for (const f of fs.readdirSync(D).filter(x => x.endsWith('.png'))) {
    const b = fs.readFileSync(D + f).subarray(16, 24);
    dim[f.slice(0, 3)] = [b.readUInt32BE(0), b.readUInt32BE(4)];
  }
  let n = 0;
  h = h.replace(/(menu\/(J\d\d)\.png\?width=560[^>]*?)width="560" height="560"/g, (all, pre, code) => {
    must(dim[code], 'ไม่มีไฟล์รูปของ ' + code);
    n++;
    return pre + 'width="' + dim[code][0] + '" height="' + dim[code][1] + '"';
  });
  must(n === 19, 'ใส่ขนาดได้ ' + n + ' ใบ (ต้องเป็น 19)');
  console.log('  ✅ การ์ดเมนู ' + n + ' ใบ — สัดส่วนจริง + จองที่ตามขนาดจริง');
} else console.log('  ⏭️  การ์ดเมนูแก้แล้ว');

/* ═══ ①② มือถือ ═══ */
if (h.includes('u360-mobile-fix')) { console.log('  ⏭️  มือถือแก้แล้ว'); }
else {
  must(h.includes('</style>'), 'ไม่เจอ </style>');
  h = h.replace('</style>', `    /* ── u360-mobile-fix (นัทสั่ง 8 ก.ย. จากเครื่องจริง) ── */
    @media (max-width:700px) {
      /* ① รูปตัวชูอยู่ข้างหัวเรื่อง — เดิมกองเต็มความกว้างอยู่ใต้ กินพื้นที่ทั้งจอ */
      /* .hero > div ถูกยุบ (display:contents) เพื่อให้ลูกทุกชิ้นวางบนกริดของ .hero เอง
         ไม่งั้นรูปจะเป็นก้อนเดียวอยู่ "ใต้" ข้อความทั้งหมด ไม่ใช่ "ข้าง" หัวเรื่อง
         ต้องระบุแถว/คอลัมน์ให้ครบทุกชิ้น — ปล่อยให้จัดเองแล้วรูปไปแทรกแถวแรกคอลัมน์ซ้าย */
      .hero { grid-template-columns:1.04fr .96fr; gap:0 15px; padding:20px 0 32px;
              grid-template-rows:auto auto auto auto auto; }
      .hero > div { display:contents; }
      .hero > div > .eyebrow { grid-column:1; grid-row:1; }
      .hero > div > h1       { grid-column:1; grid-row:2; }
      .hero > div > .intro   { grid-column:1; grid-row:3; }
      .hero > div > .dates   { grid-column:1; grid-row:4; }
      /* ราคา+ปุ่ม เต็มความกว้างใต้ 2 คอลัมน์ — อยู่ในคอลัมน์แคบแล้วปุ่มถูกบีบจนตกบรรทัด */
      .hero > div > .offer   { grid-column:1 / -1; grid-row:5; margin-top:20px; }
      .hero-photo { grid-column:2; grid-row:1 / 5; align-self:center; }
      .hero-photo .food { aspect-ratio:3/4; object-fit:cover; }
      h1 { font-size:33px; line-height:1.3; letter-spacing:-.8px; margin:0 0 12px; }
      .eyebrow { margin-bottom:12px; font-size:12px; }
      .eyebrow::before { width:8px; height:8px; }
      .intro { font-size:16px; line-height:1.55; margin:0 0 8px; }
      .dates { font-size:11px; }
      .price strong { font-size:26px; }
      .actions { gap:18px; }

      /* ② รูปเมนู 3 คอลัมน์ */
      .gallery { grid-template-columns:repeat(3,minmax(0,1fr)); gap:9px; margin-top:20px; }
      .gallery figure:last-child { width:100%; justify-self:auto; }
      .gallery .food { aspect-ratio:1/1; object-fit:cover; border-radius:10px; }
      .gallery figcaption { display:none; }       /* 3 คอลัมน์บนจอมือถือ ตัวอักษรใต้รูปแคบจนอ่านไม่ออก */
    }
</style>`);
  h = h.replace('<title>', '<!-- u360-mobile-fix (8 ก.ย.) — รูปตัวชูอยู่ข้างหัวเรื่อง + รูปเมนู 3 คอลัมน์ -->\n  <title>');
  console.log('  ✅ มือถือ: รูปตัวชูอยู่ข้างหัวเรื่อง · รูปเมนู 3 คอลัมน์');
}

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F + '  (' + (fs.statSync(F).size / 1024 | 0) + 'KB)');

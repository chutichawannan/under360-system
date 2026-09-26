/* แคตตาล็อกเมนู 30 รายการพร้อมรูปจริง บนหน้า /jay
   (ห้องเจสั่ง 8 ก.ย. 2026 · นัทสั่งผ่านห้องเจ · 06 เคาะให้ทำเลยระหว่างแอดวิ่ง)

   ทำในโครงเดิม ไม่สร้างส่วนใหม่ซ้ำ — หน้านี้มีรายชื่อครบ 30 อยู่แล้วแยกตามรอบส่ง
   แค่เปลี่ยนจาก "รายการข้อความ" เป็น "การ์ดรูป" สำหรับเมนูที่มีรูป

   🔴 กติกาจาก 06 (คนถือเงินแอด): **ห้ามมีกรอบเปล่า**
      กรอบว่าง 11 ช่องบนหน้าที่คนจ่าย ฿4,190 อ่านว่า "ร้านทำไม่เสร็จ" แย่กว่าไม่มีแคตตาล็อก
      → 19 เมนูที่มีรูป = การ์ดรูป · อีก 11 เมนู = รายการข้อความต่อท้าย ให้เห็นว่าครบ 30

   ชื่อเมนูดึงจาก <li> เดิมในหน้า ไม่ได้ดึงจาก CSV
   เพราะข้อความในหน้าผ่านการตรวจแล้ว ส่วน CSV มีสะกดต่าง (ซีฟู๊ด/ซีฟู้ด)
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const T = 'https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/render/image/public/menu-images/jay-v5/menu/';
const HAVE = ['J01','J04','J05','J07','J08','J11','J12','J13','J15','J16','J17','J18','J21','J22','J23','J24','J25','J26','J29'];
const ROUNDS = [[1,1],[2,10],[3,22]];   /* [เลขรอบ, รหัสเริ่มของรอบ] */

const must = (c,m)=>{ if(!c){ console.error('❌ '+m); process.exit(1);} };
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const crlf = fs.readFileSync(F,'utf8').includes('\r\n');
let h = fs.readFileSync(F,'utf8').replace(/\r\n/g,'\n');
if (h.includes('u360-jay-catalog')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }

let photos = 0, texts = 0;

for (const [p, start] of ROUNDS) {
  const key = 'class="round-panel panel-' + p + '"';
  must(h.includes(key), 'ไม่เจอแผงรอบ ' + p);
  const head = h.split(key)[1];
  const olStart = head.indexOf('<ol class="minimal-dishes">');
  const olEnd = head.indexOf('</ol>');
  must(olStart >= 0 && olEnd > olStart, 'ไม่เจอรายการเมนูของรอบ ' + p);
  const oldOl = head.slice(olStart, olEnd + 5);

  const items = [...oldOl.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m, i) => {
    const raw = m[1].trim();
    return {
      code: 'J' + String(start + i).padStart(2, '0'),
      name: raw.replace(/<span[\s\S]*?<\/span>/g, '').trim(),
      star: /signature/.test(raw),
    };
  });
  must(items.length > 0, 'รอบ ' + p + ' ไม่มีเมนูเลย');

  const withPic = items.filter(x => HAVE.includes(x.code));
  const noPic   = items.filter(x => !HAVE.includes(x.code));
  photos += withPic.length; texts += noPic.length;

  const cards = withPic.map(x =>
    '\n                <li class="dish">'
    + '<img src="' + T + x.code + '.png?width=560&quality=72"'
    + ' srcset="' + T + x.code + '.png?width=340&quality=72 340w, ' + T + x.code + '.png?width=560&quality=72 560w"'
    + ' sizes="(max-width:700px) 44vw, 260px" width="560" height="560"'
    + ' loading="lazy" decoding="async" alt="' + esc(x.name) + '">'
    + '<p>' + esc(x.name) + (x.star ? ' <span class="signature" aria-label="เมนูเด่น">★</span>' : '') + '</p>'
    + '</li>').join('');

  /* เมนูที่รูปยังไม่มา — เขียนเป็นรายการปกติ ไม่ใส่กรอบเปล่า และไม่เขียนแก้ตัวว่ารูปยังไม่มี */
  const rest = noPic.length ? '\n              <div class="dish-rest"><h4>อีก ' + noPic.length + ' เมนูในรอบนี้</h4><ul>'
    + noPic.map(x => '<li>' + esc(x.name) + (x.star ? ' <span class="signature" aria-label="เมนูเด่น">★</span>' : '') + '</li>').join('')
    + '</ul></div>' : '';

  h = h.replace(oldOl, '<ol class="dish-grid">' + cards + '\n              </ol>' + rest);
  console.log('  ✅ รอบ ' + p + ': การ์ดรูป ' + withPic.length + ' · รายการข้อความ ' + noPic.length + ' = ' + items.length + ' เมนู');
}

must(photos === 19 && texts === 11, 'จำนวนไม่ตรง: รูป ' + photos + ' ข้อความ ' + texts + ' (ต้องเป็น 19/11)');

/* ═══ CSS — ใช้ชุดสี/ขนาดตัวอักษรของหน้าเดิม ไม่ตั้งค่าใหม่ ═══ */
must(h.includes('</style>'), 'ไม่เจอ </style>');
h = h.replace('</style>', `    /* ── u360-jay-catalog ── */
    .dish-grid { list-style:none; display:grid; grid-template-columns:repeat(4,minmax(0,1fr));
                 gap:26px 22px; padding:0; margin:0; }
    .dish img { width:100%; height:auto; aspect-ratio:1/1; object-fit:cover;
                border-radius:14px; border:1px solid var(--line); display:block; background:var(--soft); }
    .dish p { margin:11px 0 0; font-size:14px; line-height:1.6; }
    .dish-rest { margin-top:30px; padding-top:22px; border-top:1px solid var(--line); }
    .dish-rest h4 { margin:0 0 12px; font-size:15px; font-weight:600; color:var(--muted); }
    .dish-rest ul { list-style:none; padding:0; margin:0; columns:2; column-gap:40px; }
    .dish-rest li { break-inside:avoid; padding:0 0 9px; font-size:14px; line-height:1.7; }
    @media (max-width:1000px) { .dish-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:22px 18px; } }
    @media (max-width:700px)  { .dish-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px 14px; }
                                .dish p { font-size:13px; }
                                .dish-rest ul { columns:1; } }
</style>`);
console.log('  ✅ CSS (4 คอลัมน์ → 3 → 2 บนมือถือ)');

h = h.replace('<title>', '<!-- u360-jay-catalog (8 ก.ย.) — แคตตาล็อกเมนู 30 รายการ · รูปจริง 19 -->\n  <title>');
fs.writeFileSync(F, crlf ? h.replace(/\n/g,'\r\n') : h);
console.log('\n✅ ' + F + '  (' + (fs.statSync(F).size/1024|0) + 'KB)  รูป ' + photos + ' · ข้อความ ' + texts + ' = 30 เมนู');

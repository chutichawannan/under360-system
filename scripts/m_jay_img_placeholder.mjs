/* แก้อาการ "เลื่อนมาแล้วเจอจอขาว" (ห้องครีเอทีฟเจอบนมือถือจริง 9 ก.ย. 2026)

   ⚖️ สิ่งที่ครีเอทีฟวัดมาคลาดเคลื่อน แต่อาการที่เขาเห็น "จริง"
      เขาวัดว่ารูปหนัก 270–550KB → นั่นคือขนาดตอนดึงด้วยเครื่องมือที่ไม่ได้บอกว่ารับ WebP
      เบราว์เซอร์จริงได้ WebP **12–23KB** (ผมวัดเทียบให้ดูแล้ว)
      → ไฟล์ไม่ได้หนัก แต่ **อาการจอขาวมีจริง** คนละสาเหตุกัน

   สาเหตุจริง: การ์ดแคตตาล็อกจองที่ไว้ (aspect-ratio 1/1) แล้วตั้งให้โหลดตอนเลื่อนถึง
   → ระหว่างที่รูปยังไม่มา เห็นเป็นกล่องขาวล้วนเรียงกันเต็มจอ
   บนหน้าที่พื้นหลังขาว กล่องขาวบนพื้นขาว = อ่านว่า "หน้าเว็บพัง" ไม่ใช่ "รูปกำลังมา"

   แก้ 2 ชั้น
   ① ใส่พื้นสีอ่อนในกล่องรูป — เห็นเป็น "ช่องที่กำลังโหลด" ไม่ใช่ความว่างเปล่า
   ② แถวแรกของรอบแรกโหลดทันที ไม่ต้องรอเลื่อนถึง — คนเลื่อนมาถึงแล้วมีรูปรออยู่เลย
      (เหลือ 16 ใบยังโหลดตอนเลื่อนถึงเหมือนเดิม หน้าเปิดจึงไม่หนักขึ้น)
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-img-hold')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }

/* ── ① พื้นสีอ่อนแทนช่องขาว ── */
const OLD = '.dish img { width:100%; height:auto; aspect-ratio:1/1; object-fit:cover; object-position:center;\n                border-radius:14px; border:1px solid var(--line); display:block; background:#fff; }';
must(h.includes(OLD), 'ไม่เจอ CSS การ์ด');
h = h.replace(OLD, `/* u360-img-hold — พื้นสีอ่อนระหว่างรอรูป
       กล่องขาวบนพื้นขาว = ดูเหมือนหน้าเว็บพัง · สีอ่อนๆ = ดูเหมือนกำลังโหลด */
    .dish img { width:100%; height:auto; aspect-ratio:1/1; object-fit:cover; object-position:center;
                border-radius:14px; border:1px solid var(--line); display:block;
                background:var(--soft); }`);
console.log('  ✅ ① พื้นสีอ่อนในกล่องรูป แทนช่องขาวล้วน');

/* ── ② แถวแรกของรอบแรกโหลดทันที ── */
{
  const first = ['J01', 'J04', 'J05'];   /* 3 ใบแรกของรอบ 1 = แถวบนสุดที่คนเห็นก่อน */
  let n = 0;
  for (const code of first) {
    const i = h.indexOf('menu/' + code + '.png?width=560');
    must(i > 0, 'ไม่เจอรูป ' + code);
    const tagStart = h.lastIndexOf('<img', i);
    const tagEnd = h.indexOf('>', i);
    must(tagStart > 0 && tagEnd > tagStart, 'ตัดแท็กรูป ' + code + ' ไม่ได้');
    const tag = h.slice(tagStart, tagEnd);
    if (!tag.includes('loading="lazy"')) continue;
    h = h.slice(0, tagStart) + tag.replace(' loading="lazy"', '') + h.slice(tagEnd);
    n++;
  }
  must(n === 3, 'ปลด lazy ได้ ' + n + ' ใบ (ต้องเป็น 3)');
  console.log('  ✅ ② 3 ใบแรกโหลดทันที ไม่ต้องรอเลื่อนถึง (อีก 16 ใบยังโหลดตอนเลื่อนถึง)');
}

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F);

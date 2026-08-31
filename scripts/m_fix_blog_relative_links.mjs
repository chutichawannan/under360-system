/* 🔴 แก้บั๊กด่วน: ลิงก์และรูปในหน้าบทความพัง (นัทเจอเอง 22 ส.ค. 2026)

   ต้นเหตุ = ผมเอง — พอเพิ่ม URL สะอาด `/blog/<ชื่อบทความ>` แล้ว
   ลิงก์แบบ relative ในไฟล์จะถูกคำนวณจากโฟลเดอร์ `/blog/` แทนที่จะเป็นราก:
     href="index.html"      → /blog/index.html      → เข้า rewrite → "ไม่พบบทความนี้"  ← นัทกดโลโก้แล้วเจอ
     src="img/img15.jpg"    → /blog/img/img15.jpg   → 404 → โลโก้แตก                  ← นัทเห็น
     href="mealplan.html"   → /blog/mealplan.html   → 404
     href="blog.html?post=" → /blog/blog.html?post= → 404 (ลิงก์บทความในหน้ารวมก็พัง)

   แก้: เปลี่ยนเป็น path จากรากทั้งหมด (`/index.html` · `/img/…`) → ใช้ได้ทุก URL
   บทเรียน: เทส canonical/เนื้อหาผ่าน **ไม่ได้แปลว่าหน้าใช้งานได้** ต้องกดลิงก์จริงด้วย
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/blog.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
const before = h;

const MAP = [
  ['href="index.html"', 'href="/index.html"'],
  ['href="mealplan.html"', 'href="/mealplan.html"'],
  ['href="blog.html"', 'href="/blog.html"'],
  ['src="img/img15.jpg"', 'src="/img/img15.jpg"'],
  ['href="blog.html?post=${encodeURIComponent(p.slug)}"', 'href="/blog/${encodeURIComponent(p.slug)}"'],
];
let n = 0;
for (const [a, b] of MAP) {
  const c = h.split(a).length - 1;
  if (c) { h = h.split(a).join(b); n += c; console.log(`  ✅ ${a}  →  ${b}   (${c} จุด)`); }
}

/* ยามกันตกหล่น: ต้องไม่เหลือ href/src แบบ relative อีกเลย */
const left = (h.match(/(href|src)="(?!https?:|\/|#|data:|mailto:|\$\{)[^"]+"/g) || []);
if (left.length) { console.error('❌ ยังเหลือ relative:', left.join(' · ')); process.exit(1); }

if (h !== before) {
  fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log(`\n✅ แก้ลิงก์ ${n} จุด — ไม่เหลือลิงก์/รูปแบบ relative แล้ว`);
} else console.log('⏭️  ลิงก์แก้ไปแล้วรอบก่อน');

/* ── โลโก้: เปลี่ยนจาก img15.jpg (2.8KB เบลอ) → u360_logo.svg ตัวจริงที่นัทส่งมา ──
   นัทท้วงเอง 22 ส.ค.: "โลโก้ซ้ายบนไม่ใช่โลโก้ svg ที่ฉันเคยส่งให้"
   BRAND_BIBLE ระบุไว้แล้วว่า: โลโก้เวกเตอร์ web/img/u360_logo.svg — ห้ามใช้เวอร์ชัน PNG/JPG เก่า (เบลอ)
   ทำทุกหน้าพร้อมกัน + ใช้ path จากรากเพื่อไม่ให้พังซ้ำรอยเดิม */
for (const file of ['web/index.html', 'web/mealplan.html', 'web/blog.html']) {
  const cr = fs.readFileSync(file, 'utf8').includes('\r\n');
  let x = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const b4 = x;
  x = x.split('src="img/img15.jpg"').join('src="/img/u360_logo.svg"')
       .split('src="/img/img15.jpg"').join('src="/img/u360_logo.svg"');
  if (x !== b4) { fs.writeFileSync(file, cr ? x.replace(/\n/g, '\r\n') : x); console.log('  ✅ โลโก้ SVG:', file); }
}

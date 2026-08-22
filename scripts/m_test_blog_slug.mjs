/* เทสว่า blog.html หา "ชื่อบทความ" เจอทั้ง 2 ทาง (m-track 22 ส.ค. 2026)
   ดึงโค้ดจริงจากไฟล์มารัน — ถ้าใครแก้แล้วพัง เทสนี้จับได้

   ทำไมต้องมี: rewrite ของ Vercel **ไม่เปลี่ยน URL ในเบราว์เซอร์**
   → เปิด /blog/riceberry-pros-cons แล้ว location.search ว่าง
   → ถ้าอ่านแต่ ?post= จะเด้งไปหน้ารวมบทความ (เจอจริงตอนเทส riceberry บน preview) */
import fs from 'fs';

/* ไฟล์อาจปนทั้ง CRLF และ LF (เครื่องมือคนละตัวเขียนคนละแบบ) → normalize ก่อนเสมอ */
const h = fs.readFileSync('web/blog.html', 'utf8').replace(/\r\n/g, '\n');
const m = h.match(/const _mPath = location\.pathname\.match\((.+?)\);\n\s*const slug = (.+?);\n/);
if (!m) { console.error('❌ ดึงโค้ดหา slug จากไฟล์ไม่ได้'); process.exit(1); }

const resolve = new Function('pathname', 'search',
  `const location = { pathname, search };
   const _mPath = location.pathname.match(${m[1]});
   return ${m[2]};`);

const T = [
  ['/blog/riceberry-pros-cons', '', 'riceberry-pros-cons', 'URL สะอาด (rewrite)'],
  ['/blog/snack-plate-fat-loss/', '', 'snack-plate-fat-loss', 'มี / ปิดท้าย'],
  ['/blog.html', '?post=riceberry-pros-cons', 'riceberry-pros-cons', 'รูปแบบเดิม ต้องยังใช้ได้'],
  ['/blog', '', null, 'หน้ารวมบทความ ต้องไม่เปิดบทความ'],
  ['/blog.html', '', null, 'หน้ารวมบทความ (.html)'],
  ['/blog/', '', null, 'มีแต่ทับ ไม่มีชื่อบทความ'],
];

let bad = 0;
for (const [p, s, exp, why] of T) {
  let got; try { got = resolve(p, s); } catch (e) { got = 'ERROR: ' + e.message; }
  const ok = got === exp;
  if (!ok) bad++;
  console.log(`${ok ? '✅' : '❌'} ${(p + s).padEnd(34)} → ${String(got).padEnd(22)} ${why}`);
}
console.log(bad ? `\n❌ ตก ${bad} เคส` : '\n✅ ผ่านหมด — เปิดบทความได้ทั้ง /blog/<ชื่อ> และ ?post=<ชื่อ>');
process.exit(bad ? 1 : 0);

/* แก้ตัวนับถอยหลังล้นกรอบบนมือถือ (ห้องครีเอทีฟเจอ 9 ก.ย. 2026)

   อาการ: บนจอ 375px ตัวนับกว้างแค่ 142px สูง 164px = ตัวหนังสือไหลเป็นแถบผอม อ่านไม่ได้

   ต้นเหตุ (ผมเอง): บนมือถือ .hero ยุบกล่องกลางด้วย display:contents
   แล้วลูกทุกชิ้นต้องระบุ grid-column เอง — ผมแทรกตัวนับเข้าไปโดย **ไม่ได้ระบุ**
   มันเลยถูกจัดไปคอลัมน์ขวา (คอลัมน์รูป) ซึ่งแคบ

   ทางแก้: ย้ายตัวนับเข้าไปอยู่ในกล่องราคา (.offer) ซึ่งกินเต็มความกว้างอยู่แล้ว
   ได้ผลพลอยได้: ตัวนับไปอยู่ติดกับราคาและปุ่มจอง = ตรงจุดที่คนกำลังตัดสินใจพอดี
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-countdown-moved')) { console.log('⏭️  ย้ายแล้ว'); process.exit(0); }

/* ── ถอดออกจากใต้บรรทัดวันที่ ── */
const OLD = '\n          <p class="countdown" id="countdown" hidden><!-- u360-countdown --></p>';
must(h.includes(OLD), 'ไม่เจอตัวนับในที่เดิม');
h = h.replace(OLD, '');

/* ── ใส่กลับเป็นชิ้นแรกในกล่องราคา ── */
const A = '          <div class="offer">\n            <p class="offer-hook">';
must(h.includes(A), 'ไม่เจอกล่องราคา');
h = h.replace(A, '          <div class="offer">\n'
  + '            <p class="countdown" id="countdown" hidden><!-- u360-countdown-moved --></p>\n'
  + '            <p class="offer-hook">');
console.log('  ✅ ย้ายตัวนับเข้ากล่องราคา (เต็มความกว้าง · ติดกับราคาและปุ่มจอง)');

/* ── กันไม่ให้ไหลเป็นแถบผอมอีก ไม่ว่าจะไปอยู่ตรงไหน ── */
must(h.includes('    /* ── u360-countdown-live ── */'), 'ไม่เจอ CSS ตัวนับ');
h = h.replace('    /* ── u360-countdown-live ── */',
  `    /* ── u360-countdown-live ── */
    /* กันข้อความไหลเป็นคอลัมน์ผอมถ้าวันหลังมีใครย้ายตัวนับไปอยู่ในช่องแคบ */
    .countdown { max-width:100%; flex-wrap:wrap; row-gap:2px; }`);
console.log('  ✅ กันไหลเป็นแถบผอมซ้ำ (เผื่อวันหลังมีคนย้ายที่)');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F);

/* ย้ายลิงก์ปุ่มสั่งซื้อไปประตู LIFF ใหม่ (CC แจ้ง 21 ส.ค. 2026)
   เก่า: 2010442513-NI3JGTkb  (ยังใช้ได้ ยังไม่ปิด — ไม่ใช่เหตุฉุกเฉิน)
   ใหม่: 2011148232-oul66cEs  (provider UNDER360FOOD = บ้านเดียวกับช่องส่งข้อความ · ริชเมนูชี้มาแล้ว)

   ⚠️ `?lid=` ต้องติดไปเสมอ (CC กำชับ — ถ้าหาย โค้ดมีตัวสำรองแต่ช้าลง 1 จังหวะ)
   ✅ u360Tracked() ต่อ utm ด้วย & ได้เอง เพราะ base มี ? อยู่แล้ว (เทสไว้ตั้งแต่แรก)
   รันซ้ำได้ */
import fs from 'fs';

const OLD = '2010442513-NI3JGTkb';
const NEW = '2011148232-oul66cEs';
const NEW_URL = `https://liff.line.me/${NEW}?lid=${NEW}`;
/* ไฟล์ของห้อง M เท่านั้น — liff_*.html / command_center.html เป็นของห้องอื่น ห้ามแตะ */
const FILES = ['web/index.html', 'web/mealplan.html', 'web/blog.html', 'web/v03.html'];

let n = 0;
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.error('❌ ไม่เจอ', f); process.exit(1); }
  const crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
  let h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes(NEW)) { console.log('⏭️  ย้ายแล้ว:', f); continue; }

  const m = h.match(/const ORDER_URL = 'https:\/\/liff\.line\.me\/[^']*';/);
  if (!m) { console.error('❌ ไม่เจอ ORDER_URL ใน', f); process.exit(1); }
  h = h.replace(m[0], `const ORDER_URL = '${NEW_URL}';`);

  if (h.includes(OLD)) { console.error('❌ ยังเหลือลิงก์เก่าใน', f); process.exit(1); }
  fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log('✅', f);
  n++;
}
console.log(`\nย้าย ${n} ไฟล์ → ${NEW_URL}`);

/* ปุ่มสั่งซื้อ → ชี้ LIFF ตรง (เลขาเคาะ 20 ส.ค. 2026)
   เหตุผล: liff.line.me ส่งพารามิเตอร์ต่อเข้าหน้าสั่งของได้ · ลิงก์ OA (line.me/R/ti/p/) ส่งไม่ได้
           ถ้าคงลิงก์ OA ไว้ = เส้นทางวัดผลขาดกลางทาง งานทั้งชุดไม่มีผล

   ⚠️ กันไม่ให้เสีย "เพื่อนใน OA" ซึ่งเป็นทรัพย์สินตัวจริงของร้าน (~20,000 คน ใช้ทำ broadcast):
      เพิ่มลิงก์รอง "ติดตามข่าวสาร/โปรฯ ทาง LINE" ชี้ OA ไว้ที่ฟุตเตอร์ทุกหน้า
      (เผื่อกรณีตัวชวนแอดเพื่อนในแอป LIFF ยังไม่ได้เปิดในคอนโซล — จะได้ไม่ขาดเพื่อนใหม่ไปเลยสักทาง)
   รันซ้ำได้ */
import fs from 'fs';

const LIFF_ID  = '2010442513-NI3JGTkb';
const LIFF_URL = `https://liff.line.me/${LIFF_ID}`;
const OA_URL   = 'https://line.me/R/ti/p/@under360';
const FILES    = ['web/index.html', 'web/mealplan.html', 'web/blog.html', 'web/v03.html'];

/* ลิงก์รองในฟุตเตอร์ — ไม่เด่นเท่าปุ่มสั่งซื้อ ตามที่เลขากำหนด */
const FOLLOW = `      <a href="${OA_URL}" rel="noopener">ติดตามข่าวสารและโปรโมชั่นทาง LINE</a>\n`;

let n = 0;
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.error('❌ ไม่เจอ', f); process.exit(1); }
  const crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
  let h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  const changes = [];

  /* ① ปุ่มสั่งซื้อ → LIFF */
  const om = h.match(/const ORDER_URL = '[^']*';[^\n]*/);
  if (!om) { console.error('❌ ไม่เจอ ORDER_URL ใน', f); process.exit(1); }
  if (om[0].includes('liff.line.me')) {
    changes.push('ปุ่มชี้ LIFF อยู่แล้ว');
  } else {
    h = h.replace(om[0],
      `const ORDER_URL = '${LIFF_URL}'; // หน้าสั่งของ (LIFF) — ต้องเป็นลิงก์นี้เท่านั้น\n` +
      `                                 // ลิงก์ OA (line.me/R/ti/p/) ส่ง utm/fbclid ต่อไม่ได้ = วัดผลแอดขาด\n` +
      `const OA_FOLLOW_URL = '${OA_URL}'; // แอดเพื่อน OA — ใช้กับลิงก์รองในฟุตเตอร์`);
    changes.push('ปุ่มสั่งซื้อ → LIFF');
  }

  /* ② ลิงก์รอง แอดเพื่อน OA ในฟุตเตอร์ */
  if (h.includes('ติดตามข่าวสารและโปรโมชั่นทาง LINE')) {
    changes.push('ลิงก์แอดเพื่อนมีแล้ว');
  } else {
    const fm = h.match(/(\n\s*<a href="https:\/\/www\.instagram\.com\/under360"[^>]*>Instagram<\/a>\n)/);
    if (fm) { h = h.replace(fm[0], fm[0] + FOLLOW); changes.push('เพิ่มลิงก์แอดเพื่อน OA (ฟุตเตอร์)'); }
    else {
      const fb = h.match(/(\n\s*<a href="https:\/\/www\.facebook\.com\/under360food"[^>]*>Facebook<\/a>\n)/);
      if (fb) { h = h.replace(fb[0], fb[0] + FOLLOW); changes.push('เพิ่มลิงก์แอดเพื่อน OA (ฟุตเตอร์)'); }
      else changes.push('⚠️ ไม่เจอฟุตเตอร์ — ข้ามลิงก์แอดเพื่อน');
    }
  }

  fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log('✅', f.padEnd(20), '—', changes.join(' · '));
  n++;
}
console.log(`\nเสร็จ ${n} ไฟล์`);
console.log(`\n🔗 ลิงก์ให้นัทกดเทสในแอป LINE:\n${LIFF_URL}?utm_source=fbtest&utm_medium=paid&utm_campaign=probe20aug&fbclid=IwARtest123`);

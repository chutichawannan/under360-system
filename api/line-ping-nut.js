/* Under360 — ปุ่มทดสอบ "ส่งข้อความเข้าแชทได้จริงไหม" (21 ส.ค. 2026)
 *
 * ทำไมต้องมี: หลังย้ายบ้าน LIFF มาอยู่บ้านเดียวกับช่องส่งข้อความ
 *   เราต้องพิสูจน์ด้วยของจริงว่า "ลูกค้าที่เข้าทางประตูใหม่ = ส่งหาได้"
 *   ไม่ใช่แค่เช็คโปรไฟล์ผ่าน (ผ่านโปรไฟล์ ≠ ส่งข้อความได้จริง)
 *
 * 🔒 ตั้งใจให้ยิงหาปลายทางเดียวเท่านั้น = ของนัท (ฝังไว้ในไฟล์ ไม่รับค่าจากภายนอกเลย)
 *    → ต่อให้ URL หลุด ก็ทำได้อย่างเดียวคือกวนนัท ส่งหาลูกค้าไม่ได้
 *    เหตุผลที่เข้มขนาดนี้: 20 ส.ค. เคยส่งข้อความไปหาลูกค้าผิดคนมาแล้ว
 *
 * เปิด: /api/line-ping-nut
 */
const getLineToken = require('./_line_token.js');

const NUT_UID = 'U1e6056034671878fcb8d536c7ef7333e';   // ณัฏฐพัชร ชุติชวาลน (ยืนยันกับ LINE แล้ว = "Nut")

module.exports = async (req, res) => {
  const token = await getLineToken();
  if (!token) return res.status(200).json({ ok: false, เหตุผล: 'ออก token ไม่ได้ — เช็คที่ /api/line-check' });

  const text =
    '🎉 ทดสอบระบบ — ข้อความนี้ส่งจากระบบ Under360 เอง\n\n' +
    'ถ้านัทเห็นข้อความนี้ แปลว่าย้ายบ้าน LIFF สำเร็จ\n' +
    'ต่อไปลูกค้าสั่งเสร็จ ใบยืนยันจะเด้งเข้าแชทแบบนี้ได้แล้ว';

  try {
    const r = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ to: NUT_UID, messages: [{ type: 'text', text }] }),
    });
    const body = await r.text();
    return res.status(200).json({
      ok: r.ok,
      ผลลัพธ์: r.ok ? '✅ ส่งแล้ว — ไปเปิดแชท LINE ร้านดู' : ('❌ ไม่สำเร็จ HTTP ' + r.status),
      คำตอบจากLINE: body.slice(0, 300),
    });
  } catch (e) {
    return res.status(200).json({ ok: false, ผลลัพธ์: 'พัง: ' + String(e && e.message) });
  }
};

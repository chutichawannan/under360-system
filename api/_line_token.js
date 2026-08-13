// ── ตัวออก token ของ LINE ที่ทุกไฟล์ใช้ร่วมกัน (13 ส.ค. 2026) ──────────────
//
// ทำไมต้องมีไฟล์นี้:
//   เดิม 4 ไฟล์อ่าน process.env.LINE_CHANNEL_ACCESS_TOKEN ตรงๆ อย่างเดียว
//   → token หมดอายุ/ใส่ผิด = ทุกอย่างเงียบหมดโดยไม่มีอะไรฟ้อง
//
//   ช่อง Messaging API ของ OA เราอยู่ใน provider ของ Hato → เปิดหน้า LINE Developers
//   ของแชนแนลนั้นไม่ได้ = ออก "token ถาวร" จากคอนโซลไม่ได้
//   แต่หน้า LINE OA Manager (นัทเป็นแอดมิน) มี "ความลับแชนแนล" ให้คัดลอก
//   → เอาความลับแลก token เองผ่าน grant_type=client_credentials ได้ตลอด ไม่ต้องพึ่ง Hato
//
// กติกา: มี token ใส่มาตรงๆ → ใช้อันนั้นก่อน (เผื่อวันหลังได้ token ถาวร)
//        ไม่มี → แลกจากความลับแชนแนลเอง แล้วเก็บใช้ซ้ำ 6 ชม.
//
// ⚠️ เขียนเป็น CommonJS ตั้งใจ — ไฟล์ใน api/ มีทั้ง CJS (`module.exports`)
//    และ ESM (`export default` / `import`) ปนกัน · CJS เรียกได้ทั้งสองฝั่ง
//      CJS:  const { getLineToken } = require('./_line_token.js');
//      ESM:  import lineToken from './_line_token.js';   // = ตัวฟังก์ชันเลย
//
// env (อย่างน้อยอย่างใดอย่างหนึ่ง):
//   LINE_CHANNEL_SECRET        ← ทางหลัก · ต่ออายุเองอัตโนมัติ ไม่หมดอายุเงียบ
//   LINE_CHANNEL_ACCESS_TOKEN  ← ทางสำรอง · ถ้าใส่ไว้จะถูกใช้ก่อนเสมอ
//   LINE_CHANNEL_ID            ← ไม่ใส่ก็ได้ · ค่าเริ่มต้น = แชนแนลของ OA ร้าน

const CHANNEL_ID_DEFAULT = '2005639534'; // Messaging API ของ OA @under360 (= @rwc2010a)

let cachedToken = null;
let cachedUntil = 0;

async function getLineToken() {
  const direct = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (direct) return direct;

  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return null;

  if (cachedToken && Date.now() < cachedUntil) return cachedToken;

  try {
    const r = await fetch('https://api.line.me/v2/oauth/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.LINE_CHANNEL_ID || CHANNEL_ID_DEFAULT,
        client_secret: secret,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!j.access_token) {
      console.error('LINE: แลก token ไม่สำเร็จ', r.status, JSON.stringify(j).slice(0, 200));
      return null;
    }
    cachedToken = j.access_token;
    cachedUntil = Date.now() + 6 * 3600 * 1000;
    return cachedToken;
  } catch (e) {
    console.error('LINE: แลก token พัง', e && e.message);
    return null;
  }
}

module.exports = getLineToken;
module.exports.getLineToken = getLineToken;
module.exports.default = getLineToken;

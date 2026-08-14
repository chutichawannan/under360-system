// ── กุญแจของ "น้องกะปัน" — คนละบัญชีกับ OA ร้าน (14 ส.ค. 2026) ─────────────
//
// 🔴 ทำไมต้องแยกไฟล์นี้ออกมา (บทเรียนราคาแพง 13-14 ส.ค.):
//    เดิมกะปันกับ OA ร้าน "ใช้ชื่อตัวแปรเดียวกัน" คือ LINE_CHANNEL_SECRET
//    → พอเอาความลับของร้านไปใส่ทับ **กะปันตายทันที ทั้งรับและส่ง** โดยไม่มีอะไรฟ้อง
//    → ต่อจากนี้ 2 บัญชีนี้ห้ามใช้ชื่อตัวแปรร่วมกันเด็ดขาด
//
//    🏪 OA ร้าน  Under360 Cleanfood (@rwc2010a) · แชนแนล 2005639534 · 23,000+ เพื่อน
//               → ใช้ LINE_CHANNEL_SECRET  (ดู api/_line_token.js)
//               → หน้าที่: ใบยืนยันออเดอร์ · แจ้งเตือนมีลแพลน · คุยกับลูกค้า
//
//    🤖 กะปัน    Kapan (@293lwrvn) · แชนแนล 2010975837 · เพื่อน 1 คน (นัท)
//               → ใช้ KAPAN_CHANNEL_SECRET (ไฟล์นี้)
//               → หน้าที่: ผู้ช่วยส่วนตัวนัท + เก็บบทสนทนาในกลุ่ม
//
// env: KAPAN_CHANNEL_SECRET (จำเป็น) · KAPAN_CHANNEL_ACCESS_TOKEN (ไม่ใส่ก็ได้)
// คัดลอกความลับได้ที่: LINE OA Manager → Kapan → ตั้งค่า → Messaging API

const KAPAN_CHANNEL_ID = '2010975837';

let cached = null, until = 0;

async function getKapanToken() {
  const direct = process.env.KAPAN_CHANNEL_ACCESS_TOKEN;
  if (direct) return direct;

  const secret = process.env.KAPAN_CHANNEL_SECRET;
  if (!secret) return null;
  if (cached && Date.now() < until) return cached;

  try {
    const r = await fetch('https://api.line.me/v2/oauth/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.KAPAN_CHANNEL_ID || KAPAN_CHANNEL_ID,
        client_secret: secret,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!j.access_token) { console.error('กะปัน: แลก token ไม่สำเร็จ', r.status); return null; }
    cached = j.access_token; until = Date.now() + 6 * 3600 * 1000;
    return cached;
  } catch (e) { console.error('กะปัน: แลก token พัง', e && e.message); return null; }
}

module.exports = getKapanToken;
module.exports.getKapanToken = getKapanToken;
module.exports.default = getKapanToken;

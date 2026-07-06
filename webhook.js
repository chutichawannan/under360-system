// ============================================================
//  Under360 — Facebook/Instagram Messenger Webhook
//  วางไฟล์ที่: api/webhook.js  →  endpoint: /api/webhook
//  ------------------------------------------------------------
//  เฟส 1 (ไฟล์นี้): เคาะ verify กับ Meta + รับข้อความ + echo กลับ
//  เฟสถัดไปจะเสียบ: เมนู/ตะกร้า/checkout/จ่ายเงิน/เขียน order
// ============================================================

import crypto from 'crypto';

// ---- ปิด body parser ของ Vercel: เราต้องอ่าน raw body เองเพื่อเช็คลายเซ็น ----
export const config = { api: { bodyParser: false } };

// ---- เวอร์ชัน Graph API (ถ้า Meta ขึ้นเตือนว่าเก่า เปลี่ยนเลขตรงนี้ที่เดียว) ----
const GRAPH_VER = 'v21.0';

// ---- ค่าลับ ตั้งใน Vercel → Settings → Environment Variables ----
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN; // เราตั้งเอง (ใช้ตอนเคาะประตูเฟส verify)
const PAGE_TOKEN   = process.env.META_PAGE_TOKEN;   // Meta ออกให้ (ใช้ตอนส่งข้อความกลับ)
const APP_SECRET   = process.env.META_APP_SECRET;   // Meta ออกให้ (ใช้เช็คว่า request มาจาก Meta จริง)

// ============================================================
//  MAIN HANDLER — Vercel เรียกฟังก์ชันนี้ทุกครั้งที่มี request
// ============================================================
export default async function handler(req, res) {
  if (req.method === 'GET')  return handleVerify(req, res);  // Meta มาเคาะ verify
  if (req.method === 'POST') return handleEvent(req, res);   // มีข้อความ/เหตุการณ์เข้ามา
  return res.status(405).send('Method Not Allowed');
}

// ============================================================
//  GET — จับมือ verify กับ Meta (ทำครั้งเดียวตอนตั้ง webhook)
//  Meta ส่ง hub.mode + hub.verify_token + hub.challenge มา
//  ถ้า token ตรง → ตอบ challenge กลับ = ผ่าน
// ============================================================
function handleVerify(req, res) {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    return res.status(200).send(challenge); // ต้องตอบ challenge ดิบๆ กลับ
  }
  console.warn('❌ Verify failed', { mode, tokenMatch: token === VERIFY_TOKEN });
  return res.status(403).send('Forbidden');
}

// ============================================================
//  POST — รับเหตุการณ์จาก Meta (ข้อความ/ปุ่ม/ไฟล์แนบ)
// ============================================================
async function handleEvent(req, res) {
  const rawBody = await getRawBody(req);

  // เช็คลายเซ็น (ถ้ายังไม่ตั้ง APP_SECRET จะข้ามให้ตอนเดฟ)
  if (!verifySignature(rawBody, req.headers['x-hub-signature-256'], APP_SECRET)) {
    console.warn('❌ Invalid signature — ทิ้ง request');
    return res.status(403).send('Invalid signature');
  }

  let body;
  try { body = JSON.parse(rawBody); }
  catch { return res.status(400).send('Bad JSON'); }

  // ตอนนี้รับเฉพาะ Messenger (object = 'page') — Instagram ไว้เฟส 7
  if (body.object !== 'page') {
    return res.status(200).send('EVENT_RECEIVED');
  }

  // Meta อาจส่งหลายเหตุการณ์มาก้อนเดียว → วนทีละอัน
  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      try { await routeEvent(event); }
      catch (e) { console.error('routeEvent error:', e); } // พังตัวเดียวไม่ล้มทั้งก้อน
    }
  }

  // สำคัญ: ต้องตอบ 200 เร็วๆ ไม่งั้น Meta ยิงซ้ำ
  return res.status(200).send('EVENT_RECEIVED');
}

// ============================================================
//  ROUTER — สมองของบอท
//  เฟส 1: echo อย่างเดียว
//  เฟสถัดไป: เช็ค session.step → พาไป browse/cart/checkout/pay
// ============================================================
async function routeEvent(event) {
  const psid = event.sender?.id; // Facebook user ID (กุญแจของ bot_sessions ในอนาคต)
  if (!psid) return;

  // กันลูป: ข้ามข้อความที่ตัวเราเองส่ง
  if (event.message?.is_echo) return;

  if (event.message?.text) {
    // --- ผู้ใช้พิมพ์ข้อความ ---
    await sendText(psid, `📩 ได้รับข้อความ: "${event.message.text}"`);

  } else if (event.message?.attachments) {
    // --- ผู้ใช้ส่งไฟล์/รูป (เฟสจ่ายเงินจะเอามาทำสลิป) ---
    await sendText(psid, '📎 ได้รับไฟล์แนบแล้ว (เฟสถัดไปจะจัดการสลิปตรงนี้)');

  } else if (event.postback) {
    // --- ผู้ใช้กดปุ่ม → ส่ง payload ซ่อนมา ---
    await sendText(psid, `🔘 กดปุ่ม: ${event.postback.payload}`);
  }
}

// ============================================================
//  SEND API — ส่งข้อความกลับไปหาลูกค้าผ่าน Meta
// ============================================================
async function sendText(recipientId, text) {
  if (!PAGE_TOKEN) {
    console.warn('⚠️ ยังไม่ได้ตั้ง META_PAGE_TOKEN — ส่งข้อความไม่ได้ (ตั้งใน Vercel ก่อน)');
    return;
  }
  const url = `https://graph.facebook.com/${GRAPH_VER}/me/messages?access_token=${PAGE_TOKEN}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: { text }
    })
  });
  if (!resp.ok) console.error('Send API error:', resp.status, await resp.text());
}

// ============================================================
//  HELPERS
// ============================================================

// อ่าน raw body จาก stream (เพราะปิด bodyParser ไว้)
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// เช็คว่า request มาจาก Meta จริง (เทียบ HMAC-SHA256 กับ App Secret)
function verifySignature(rawBody, sig, secret) {
  if (!secret) {
    console.warn('⚠️ ยังไม่ได้ตั้ง META_APP_SECRET — ข้ามการเช็คลายเซ็น (เฉพาะตอนเดฟ)');
    return true;
  }
  if (!sig) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

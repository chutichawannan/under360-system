// ============================================================
//  Under360 — บอทผู้ช่วยครัว (LINE group bot)   · สร้าง 5 ส.ค. 2026
//  endpoint: /api/line-webhook   → ตั้งเป็น Webhook URL ในคอนโซล LINE
//  ------------------------------------------------------------
//  ทำ 2 อย่างตามที่นัทสั่ง:
//   1) 📝 เก็บบทสนทนาในกลุ่ม "ทั้งหมด" ลง line_group_messages
//   2) 💬 ตอบ "เฉพาะตอนถูกถาม" (พิมพ์คำว่า ยอด / กี่กล่อง / ออเดอร์) — ไม่พูดแทรกเอง
//
//  🔒 ความเป็นส่วนตัว: ตารางเปิดให้ anon เขียนอย่างเดียว อ่านไม่ได้
//     (แชทพนักงานต้องไม่หลุดผ่าน anon key ที่ฝังในหน้าเว็บ)
//     ⚠️ ต้องแจ้งทีมครัวก่อนเชิญบอทเข้ากลุ่ม
//
//  env ที่ต้องมี: LINE_CHANNEL_SECRET · LINE_CHANNEL_ACCESS_TOKEN
// ============================================================

import crypto from 'crypto';

export const config = { api: { bodyParser: false } };   // ต้องอ่าน raw body เพื่อเช็คลายเซ็น

const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const SBH = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

// ⏰ เวลาไทยเสมอ — ครัวอยู่ไทย เจ้าของอาจเปิดจากที่อื่น
const bkkDate = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(d || new Date());
const addDays = (ymd, n) => { const t = new Date(ymd + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };

function readRaw(req) {
  return new Promise((resolve, reject) => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d)); req.on('error', reject);
  });
}

// เช็คว่า request มาจาก LINE จริง — ไม่มี secret = ปฏิเสธ (fail-closed)
function verifyLine(rawBody, sig, secret) {
  if (!secret || !sig) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function lineReply(replyToken, text, token) {
  if (!token || !replyToken) return;
  try {
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ replyToken, messages: [{ type: 'text', text: String(text).slice(0, 4900) }] }),
    });
  } catch (e) { console.error('lineReply failed:', e); }
}

async function getDisplayName(groupId, userId, token) {
  if (!token || !groupId || !userId) return null;
  try {
    const r = await fetch(`https://api.line.me/v2/bot/group/${groupId}/member/${userId}`, {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (!r.ok) return null;
    return (await r.json()).displayName || null;
  } catch { return null; }
}

async function logMessage(row) {
  try {
    await fetch(SB + '/line_group_messages', {
      method: 'POST',
      headers: { ...SBH, Prefer: 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify(row),
    });
  } catch (e) { console.error('logMessage failed:', e); }
}

// ── สรุปยอดสั่งของวันหนึ่ง (ดึงจากระบบตรง ไม่ใช่คนพิมพ์ต่อ) ──────────
async function orderSummary(dateIso) {
  const q = `${SB}/orders?select=id,order_number,customer_name,total,status,source&delivery_date=eq.${dateIso}&limit=500`;
  const orders = await (await fetch(q, { headers: SBH })).json();
  if (!Array.isArray(orders)) throw new Error('อ่านออเดอร์ไม่ได้');
  const real = orders.filter(o => o.status !== 'cancelled' && o.source !== 'parallel_test');
  if (!real.length) return `📅 ${dateIso}\nยังไม่มีออเดอร์`;

  const ids = real.map(o => o.id);
  let items = [];
  for (let i = 0; i < ids.length; i += 100) {
    const part = ids.slice(i, i + 100).join(',');
    const r = await (await fetch(`${SB}/order_items?select=order_id,menu_code,menu_name,quantity&order_id=in.(${part})&limit=3000`, { headers: SBH })).json();
    if (Array.isArray(r)) items = items.concat(r);
  }
  const boxes = items.reduce((s, it) => s + (it.quantity || 0), 0);

  // รวมยอดต่อเมนู เรียงจากมากไปน้อย
  const byMenu = {};
  items.forEach(it => {
    const k = (it.menu_code || '') + ' ' + (it.menu_name || '');
    byMenu[k] = (byMenu[k] || 0) + (it.quantity || 0);
  });
  const lines = Object.entries(byMenu).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `• ${k.trim()} × ${v}`);

  return `📅 ${dateIso}\n📦 ${real.length} ออเดอร์ · ${boxes} กล่อง\n\n${lines.join('\n')}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('ok');   // LINE verify ใช้ GET/HEAD ได้

  const raw = await readRaw(req);
  const secret = process.env.LINE_CHANNEL_SECRET;
  const token  = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!verifyLine(raw, req.headers['x-line-signature'], secret)) {
    console.error('🔒 ลายเซ็น LINE ไม่ผ่าน (หรือยังไม่ได้ตั้ง LINE_CHANNEL_SECRET)');
    return res.status(401).json({ ok: false });
  }

  let body; try { body = JSON.parse(raw || '{}'); } catch { return res.status(400).json({ ok: false }); }
  const events = body.events || [];

  for (const ev of events) {
    const groupId = ev.source?.groupId || ev.source?.roomId || null;
    const userId  = ev.source?.userId || null;

    // บอทเพิ่งถูกเชิญเข้ากลุ่ม → ทักทาย + บอก groupId (นัทเอาไปใช้อ้างอิงได้)
    if (ev.type === 'join' && groupId) {
      await lineReply(ev.replyToken,
        'สวัสดีครับ ผมคือผู้ช่วยครัว Under360 🍳\n\n' +
        'พิมพ์ "ยอด" หรือ "ยอดพรุ่งนี้" แล้วผมจะดึงยอดสั่งจากระบบมาให้ทันที\n' +
        '(ผมจะตอบเฉพาะตอนถูกเรียกเท่านั้น ไม่พูดแทรก)\n\n' +
        'groupId: ' + groupId, token);
      continue;
    }
    if (ev.type !== 'message' || !groupId) continue;

    const m = ev.message || {};
    const text = m.type === 'text' ? (m.text || '') : '';

    // 1) 📝 เก็บทุกข้อความ (นัทสั่ง "เก็บประวัติการคุยทั้งหมด")
    const displayName = await getDisplayName(groupId, userId, token);
    await logMessage({
      message_id: m.id || null, group_id: groupId, user_id: userId,
      display_name: displayName, msg_type: m.type || 'unknown',
      text: text || null,
      line_ts: ev.timestamp ? new Date(ev.timestamp).toISOString() : null,
    });

    // 2) 💬 ตอบเฉพาะตอนถูกถาม
    if (!text) continue;
    const t = text.trim();
    if (!/ยอด|กี่กล่อง|ออเดอร์|order/i.test(t)) continue;

    const today = bkkDate();
    let target = today, label = 'วันนี้';
    if (/พรุ่งนี้|พรุ้งนี้|ทูมอร์|tomorrow/i.test(t)) { target = addDays(today, 1); label = 'พรุ่งนี้'; }
    else if (/มะรืน/i.test(t)) { target = addDays(today, 2); label = 'มะรืนนี้'; }
    else { const d = t.match(/(\d{4}-\d{2}-\d{2})/); if (d) { target = d[1]; label = d[1]; } }

    let reply;
    try { reply = `ยอดสั่ง${label}\n${await orderSummary(target)}`; }
    catch (e) { console.error(e); reply = '⚠️ ดึงยอดจากระบบไม่ได้ตอนนี้ ลองใหม่อีกครั้งครับ'; }

    await lineReply(ev.replyToken, reply, token);
    await logMessage({
      message_id: 'bot_' + (m.id || Date.now()), group_id: groupId, user_id: 'bot',
      display_name: 'ผู้ช่วยครัว', msg_type: 'text', text: reply, is_bot_reply: true,
      line_ts: new Date().toISOString(),
    });
  }

  return res.status(200).json({ ok: true });
}

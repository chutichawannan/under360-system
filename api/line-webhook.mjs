// ============================================================
//  Under360 — น้องกะปัน (Kapan) · ผู้ช่วยในกลุ่ม LINE   · สร้าง 5 ส.ค. 2026 · ตั้งชื่อ+บุคลิก 12 ส.ค.
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

// เจ้าของกะปัน — ตอบข้อมูลให้คนนี้คนเดียว (นัทเคาะ 12 ส.ค.)
const OWNER = process.env.OWNER_LINE_USER_ID || 'Ucc982b971a6676e02ecac6d668723003';   // นัท

// ส่งข้อความหาใครก็ได้ ไม่ต้องรอ reply token (ใช้รายงานเข้าแชทนัท)
async function linePush(to, text, token) {
  if (!token || !to) return;
  try {
    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ to, messages: [{ type: 'text', text: String(text).slice(0, 4900) }] }),
    });
  } catch (e) { console.error('linePush failed:', e); }
}

// ส่งคำสั่งจากไลน์นัท เข้าบอร์ดห้อง PM (ตาราง session_messages ที่ทุกห้องใช้อยู่แล้ว)
const ROOMS = ['pm','cc','u','k','f','m','bug','keng','niw','eath','tiang','rnd01','ploy','fah'];
const ROOM_ALIAS = { เลขา:'pm', pm:'pm', cc:'cc', ยู:'u', u:'u', ครัว:'k', k:'k', ฟ้า:'fah', fah:'fah',
  เงิน:'f', f:'f', เว็บ:'m', m:'m', บั๊ก:'bug', bug:'bug', เก่ง:'keng', keng:'keng',
  นิว:'niw', niw:'niw', เอิธ:'eath', eath:'eath', เตียง:'tiang', tiang:'tiang', พลอย:'ploy', ploy:'ploy', rnd:'rnd01', rnd01:'rnd01' };

// แยกว่านัทสั่งถึงห้องไหน — พิมพ์ชื่อห้องนำหน้าแล้วตามด้วย : หรือเว้นวรรค
// ⚠️ 12 ส.ค.: regex ตัวนี้เคยตกแบ็กสแลช (\s กลายเป็น s) = ไม่เคยแมตช์เลย ทุกคำสั่งตกไปห้อง pm หมด
//    ห้ามแพตช์บรรทัดนี้ด้วยสคริปต์ที่มี \n/\s — แก้ด้วยมือแล้ว node --check เสมอ
function routeRoom(text) {
  const m = String(text).match(/^\s*@?([A-Za-z0-9]+|[ก-๙]+)(?:\s*[:：]\s*|\s+)([\s\S]+)$/);
  if (!m) return { room: 'pm', body: text };
  const key = m[1].toLowerCase();
  const room = ROOM_ALIAS[key] || (ROOMS.includes(key) ? key : null);
  return room ? { room, body: m[2].trim() } : { room: 'pm', body: text };
}

// ── 🎭 บุคลิก 3 แบบ (นัทสั่ง 12 ส.ค.: "อยากได้บุคลิกที่รวดเร็วและดุเดือด ลดความมุ้งมิ้ง") ──
//  โหมดเดียวคุมพร้อมกัน 3 อย่าง: น้ำเสียง · ความถี่ที่ตัวเฝ้าไปดูกล่องจดหมาย · โมเดลที่กะปันใช้ตอบเอง
//  สลับจากไลน์: พิมพ์ "โหมดเร่ง" / "โหมดปกติ" / "โหมดเงียบ"  ·  ถามโหมดปัจจุบัน: "โหมด?"
const PERSONAS = {
  normal: {
    label: 'ปกติ',
    poll: 10000,
    model: 'claude-sonnet-5',
    maxWords: 150,
    pushLevel: 'all',
    hello: 'สวัสดีค่ะ กะปันเองค่ะ ผู้ช่วยของ Under360 มีอะไรเรียกได้เลยน้า',
    okData: (label) => 'ยอดสั่ง' + label + 'มาแล้วค่า',
    fail: 'ขอโทษค่ะ ตอนนี้ดึงยอดจากระบบไม่ได้ เดี๋ยวลองใหม่อีกครั้งนะคะ',
    style: 'สุภาพแบบผู้หญิงทำงาน มีชีวิต โรยคำน่ารัก (น้า/ค่า) ได้ไม่เกิน 1 คำต่อข้อความ',
  },
  fast: {
    label: 'เร่ง',
    poll: 5000,
    model: 'claude-haiku-4-5-20251001',
    maxWords: 60,
    pushLevel: 'all',
    hello: 'กะปันค่ะ โหมดเร่ง พิมพ์สั่งได้เลย',
    okData: (label) => 'ยอด' + label,
    fail: 'ดึงยอดไม่ได้ ลองใหม่อีกที',
    style: 'สั้น ห้วน ตรงประเด็น ไม่มีคำน่ารัก ไม่มีคำเกริ่น ตอบเป็นข้อๆ ให้กวาดตาจบใน 3 วินาที',
  },
  quiet: {
    label: 'เงียบ',
    poll: 60000,
    model: 'claude-haiku-4-5-20251001',
    maxWords: 60,
    pushLevel: 'urgent',   // ในกลุ่ม: เตือนเฉพาะเรื่องเงิน + แท็กนัทตรงๆ (ยังเก็บลง DB ครบเหมือนเดิม)
    hello: 'กะปันค่ะ (โหมดเงียบ — จะตอบเฉพาะตอนถูกเรียก)',
    okData: (label) => 'ยอด' + label,
    fail: 'ดึงยอดไม่ได้',
    style: 'สั้นที่สุดเท่าที่จะสื่อสารได้ ไม่มีคำน่ารัก ไม่ทักทาย ไม่สรุปซ้ำ',
  },
};
const MODE_WORD = { 'เร่ง': 'fast', 'ปกติ': 'normal', 'เงียบ': 'quiet' };

// เก็บโหมดกะปันไว้ในบอร์ด (room=kapan) — ตัวเฝ้าฝั่งเลขาอ่านค่านี้ไปปรับความถี่
async function setMode(mode) {
  try {
    await fetch(SB + '/session_messages', {
      method: 'POST', headers: { ...SBH, Prefer: 'return=minimal' },
      body: JSON.stringify({ room: 'kapan', sender: 'mode', role: 'system', text: mode }),
    });
  } catch (e) { console.error('setMode failed:', e); }
}

// อ่านโหมดล่าสุด — อ่านไม่ได้/ยังไม่เคยตั้ง = ปกติ (fail-safe ไม่ล้มทั้ง webhook)
async function getPersona() {
  try {
    const r = await fetch(SB + '/session_messages?room=eq.kapan&sender=eq.mode&select=text&order=created_at.desc&limit=1', { headers: SBH });
    const j = await r.json();
    const key = Array.isArray(j) && j[0] ? j[0].text : 'normal';
    return PERSONAS[key] ? { key, ...PERSONAS[key] } : { key: 'normal', ...PERSONAS.normal };
  } catch { return { key: 'normal', ...PERSONAS.normal }; }
}

// forcedRoom = ห้องที่สมองเร็วอ่านออกเอง (ใช้เมื่อนัทไม่ได้พิมพ์ชื่อห้องนำหน้า)
async function toPmBoard(text, forcedRoom) {
  const explicit = routeRoom(text);
  const room = (explicit.room !== 'pm' || !forcedRoom) ? explicit.room : forcedRoom;  // พิมพ์ชื่อห้องเองมา = ชนะเสมอ
  const body = explicit.body;
  const rows = [{ room, sender: 'นัท (สั่งผ่านไลน์)', role: 'user', text: body }];
  // ถ้าสั่งห้องอื่น ให้เลขารู้ด้วยว่านัทสั่งอะไรไปที่ไหน
  if (room !== 'pm') rows.push({ room: 'pm', sender: 'นัท (สั่งผ่านไลน์)', role: 'user',
    text: '[ส่งต่อให้ห้อง ' + room + '] ' + body });
  try {
    await fetch(SB + '/session_messages', {
      method: 'POST',
      headers: { ...SBH, Prefer: 'return=minimal' },
      body: JSON.stringify(rows),
    });
  } catch (e) { console.error('toPmBoard failed:', e); }
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

// ── 🌏 ชั้นแปลภาษา (k-track 5 ส.ค.) ────────────────────────────
//  ครัว 6 คนเป็นไทใหญ่ · อ่านไทยได้ 2/6 · อ่านพม่าได้ ~4-5/6
//  หลายคนเขียนไทใหญ่แบบ "ทับศัพท์" ด้วยอักษรไทย/พม่า → ต้องบอกโมเดลไว้ด้วย
//  แปลครั้งเดียวตอนเก็บ ไม่ใช่ตอนเปิดอ่าน → ไม่ยิง API ซ้ำทุกครั้งที่นัทเปิดหน้า
const TRANSLATE_MODEL = 'claude-haiku-4-5-20251001';

async function translate(text) {
  const key = process.env.ANTHROPIC_API_KEY;
  const t = (text || '').trim();
  // ไม่มีคีย์ / ข้อความสั้นเกินจะแปล (สติกเกอร์ เลขล้วน "ok") = ข้าม ไม่เผาเงิน
  if (!key || t.length < 2 || /^[\d\s.,:/-]+$/.test(t)) return {};
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: TRANSLATE_MODEL,
        max_tokens: 700,
        system:
          'คุณคือล่ามของครัวอาหาร ทีมครัวเป็นคนไทใหญ่ (Shan) หลายคนพิมพ์ภาษาไทใหญ่แบบทับศัพท์ด้วยอักษรไทยหรือพม่า ' +
          'เจ้าของร้านอ่านไทย ทีมครัวอ่านพม่าได้บางส่วน\n' +
          'ตอบเป็น JSON เท่านั้น: {"src_lang":"th|my|shan|other","text_th":"...","text_my":"..."}\n' +
          'กฎ: ห้ามแปลงตัวเลข ชื่อเมนู รหัสเมนู (เช่น S136, HP, LC) และหน่วย (กล่อง/กก./กรัม) — คงไว้ตามต้นฉบับเป๊ะ ' +
          'แปลตรงตัว ไม่ต้องเติมความ ถ้าอ่านไม่ออกให้คืนข้อความเดิม',
        messages: [{ role: 'user', content: t.slice(0, 2000) }],
      }),
    });
    if (!r.ok) { console.error('translate HTTP', r.status); return {}; }
    const raw = (await r.json())?.content?.[0]?.text || '';
    const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    return { src_lang: j.src_lang || null, text_th: j.text_th || null, text_my: j.text_my || null };
  } catch (e) { console.error('translate failed:', e); return {}; }   // แปลพัง = ยังเก็บต้นฉบับได้ ไม่ล้มทั้ง webhook
}

// ── ⚡ สมองเร็วของกะปัน (นัทบ่นว่าช้า 12 ส.ค.) ──────────────────
//  เดิม: นัทพิมพ์ -> ลงบอร์ด -> ห้องเลขา poll เจอ -> Opus คิด -> ตอบกลับ  = ช้าหลายสิบวินาที
//  ใหม่: เรื่องที่ไม่ต้องคิดหนัก กะปันตอบเองตรงนี้เลย (~2-3 วิ) · เรื่องหนักค่อยส่งเข้าห้อง
//  โมเดลที่ใช้ = ตามโหมด (เร่ง/เงียบ = Haiku · ปกติ = Sonnet)
//  ⚠️ ไม่มี ANTHROPIC_API_KEY = คืน null -> ระบบถอยไปใช้ทางเดิม (regex + ส่งเข้าบอร์ด) ไม่พัง
const ROOM_GUIDE =
  'pm=เลขา/ประสานงานรวม · cc=ศูนย์กลาง ตรวจ/ไล่โค้ด/ตามงานห้องอื่น · u=แก้โค้ดหน้าเว็บ-LIFF-ครัว · ' +
  'k=งานครัว · fah=ใบงานครัว/วัตถุดิบ · keng=จัดส่ง · f=เงิน/บัญชี/ยอดขาย · m=เว็บ/SEO/บล็อก · ' +
  'bug=บั๊กที่เจอจากการเทส · niw=วางแผนผลิต · eath=มาเก็ตติ้ง/broadcast · tiang=โพสต์โซเชียล · ' +
  'rnd01=พัฒนาเมนูใหม่ · ploy=งานที่พลอยดูแล';

async function kapanBrain(text, persona) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: persona.model,
        max_tokens: 500,
        system:
          'คุณคือ "กะปัน" ผู้ช่วยส่วนตัวของคุณนัท เจ้าของร้านอาหารสุขภาพ Under360\n' +
          'น้ำเสียง: ' + persona.style + ' · ยาวไม่เกิน ' + persona.maxWords + ' คำ\n' +
          'ตัวเลขต้องอยู่บรรทัดของตัวเอง ให้กวาดตาเจอทันที\n\n' +
          'แยกให้ออกว่าข้อความของนัทเป็นแบบไหน แล้วตอบเป็น JSON เท่านั้น:\n' +
          '{"kind":"task|chat","room":"ชื่อห้อง","reply":"ข้อความตอบ"}\n\n' +
          'task = สั่งให้ลงมือทำ (แก้โค้ด · ขุดข้อมูล · ตามงาน · ทวงห้องอื่น · ให้ไปเช็คอะไรสักอย่าง) ' +
          '-> ใส่ room ที่ตรงที่สุด · reply เว้นว่าง (ระบบจะเงียบไว้ตามที่นัทสั่ง)\n' +
          'chat = ถาม/คุย/ขอความเห็นที่ตอบได้ทันทีโดยไม่ต้องเปิดระบบ -> ใส่ reply · room เว้นว่าง\n\n' +
          'ห้องที่มี: ' + ROOM_GUIDE + '\n' +
          'ไม่แน่ใจว่าห้องไหน = pm\n\n' +
          'กฎเหล็ก: ห้ามเดาตัวเลขยอดขาย/ต้นทุน/สต็อก/จำนวนออเดอร์เด็ดขาด — ถ้านัทถามตัวเลขพวกนี้ ' +
          'ให้ถือเป็น task ส่งห้องที่เกี่ยวข้อง ห้ามแต่งตัวเลขขึ้นมาเอง',
        messages: [{ role: 'user', content: String(text).slice(0, 2000) }],
      }),
    });
    if (!r.ok) { console.error('kapanBrain HTTP', r.status); return null; }
    const raw = (await r.json())?.content?.[0]?.text || '';
    const j = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
    const kind = j.kind === 'chat' ? 'chat' : 'task';
    const room = ROOMS.includes(j.room) ? j.room : 'pm';
    return { kind, room, reply: (j.reply || '').trim() };
  } catch (e) { console.error('kapanBrain failed:', e); return null; }
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

  const persona = await getPersona();   // บุคลิกที่นัทตั้งไว้ล่าสุด (น้ำเสียง + โมเดล + ระดับการเตือน)

  for (const ev of events) {
    const groupId = ev.source?.groupId || ev.source?.roomId || null;
    const userId  = ev.source?.userId || null;

    // บอทเพิ่งถูกเชิญเข้ากลุ่ม → ทักทาย + บอก groupId (นัทเอาไปใช้อ้างอิงได้)
    if (ev.type === 'join' && groupId) {
      await lineReply(ev.replyToken,
        persona.hello + '\n\n' +
        'พิมพ์ "ยอด" หรือ "ยอดพรุ่งนี้" เดี๋ยวดึงยอดสั่งจากระบบมาให้\n' +
        '(ตอบเฉพาะตอนถูกเรียก ไม่พูดแทรก)\n\n' +
        'groupId: ' + groupId, token);
      continue;
    }
    if (ev.type !== 'message') continue;

    const m = ev.message || {};
    const text = m.type === 'text' ? (m.text || '') : '';
    const t = text.trim();
    const isOwner = OWNER && userId === OWNER;
    const wantsData = /ยอด|กี่กล่อง|ออเดอร์|order/i.test(t);

    const buildAnswer = async () => {
      const today = bkkDate();
      let target = today, label = 'วันนี้';
      if (/พรุ่งนี้|พรุ้งนี้|tomorrow/i.test(t)) { target = addDays(today, 1); label = 'พรุ่งนี้'; }
      else if (/มะรืน/i.test(t)) { target = addDays(today, 2); label = 'มะรืนนี้'; }
      else { const d = t.match(/(\d{4}-\d{2}-\d{2})/); if (d) { target = d[1]; label = d[1]; } }
      try { return persona.okData(label) + '\n' + (await orderSummary(target)); }
      catch (e) { console.error(e); return persona.fail; }
    };

    // ===== แชทส่วนตัว (ไม่มี groupId) =====
    if (!groupId) {
      console.log('DM userId=' + userId + ' text=' + t.slice(0, 60));
      if (!OWNER) {
        await lineReply(ev.replyToken,
          'สวัสดีค่ะ กะปันเองค่ะ\n\nยังไม่ได้ตั้งค่าว่าใครเป็นเจ้าของนะคะ\nuserId ของคุณคือ:\n' + userId, token);
        continue;
      }
      if (!isOwner) {
        await lineReply(ev.replyToken, 'รับเรื่องแล้วค่ะ เดี๋ยวแจ้งคุณนัทให้นะคะ', token);
        await linePush(OWNER, 'มีคนทักกะปันส่วนตัวค่ะ\nuserId: ' + userId + '\n\n"' + t + '"', token);
        continue;
      }
      // ถามว่าตอนนี้โหมดอะไร: พิมพ์ "โหมด" หรือ "โหมด?"
      if (/^โหมด\s*[?？]?$/.test(t)) {
        await lineReply(ev.replyToken,
          'ตอนนี้โหมด' + persona.label + '\n' +
          'เช็คกล่องจดหมายทุก ' + (persona.poll / 1000) + ' วิ\n' +
          'ตอบเองด้วย ' + (persona.model.startsWith('claude-haiku') ? 'Haiku (เร็ว)' : 'Sonnet (ละเอียดกว่า)') + '\n\n' +
          'สลับได้: โหมดเร่ง · โหมดปกติ · โหมดเงียบ', token);
        continue;
      }
      // สลับโหมด: พิมพ์ โหมดเร่ง / โหมดปกติ / โหมดเงียบ
      const mm = t.match(/^โหมด\s*(เร่ง|ปกติ|เงียบ)/);
      if (mm) {
        const nextKey = MODE_WORD[mm[1]];
        const next = PERSONAS[nextKey];
        await setMode(nextKey);
        await lineReply(ev.replyToken,
          'โหมด' + mm[1] + ' ✓\n' +
          'เช็คทุก ' + (next.poll / 1000) + ' วิ · ' +
          (next.model.startsWith('claude-haiku') ? 'Haiku' : 'Sonnet'), token);
        continue;
      }
      if (wantsData) { await lineReply(ev.replyToken, await buildAnswer(), token); continue; }

      // ⚡ ให้สมองเร็วตัดสินก่อน: คุย/ถาม = ตอบเองตรงนี้เลย · สั่งงาน = ส่งเข้าห้อง แล้วเงียบ (นัทสั่งเอง)
      const brain = await kapanBrain(t, persona);
      if (brain && brain.kind === 'chat' && brain.reply) {
        await lineReply(ev.replyToken, brain.reply, token);
        continue;
      }
      // ไม่มีคีย์ / สมองตอบไม่ได้ = ถอยไปทางเดิม (ส่งเข้าบอร์ดให้ห้องคนทำ)
      await toPmBoard(t, brain ? brain.room : null);
      continue;
    }

    // ===== ในกลุ่ม =====
    const [displayName, tr] = await Promise.all([
      getDisplayName(groupId, userId, token),
      translate(text),
    ]);
    await logMessage({
      message_id: m.id || null, group_id: groupId, user_id: userId,
      display_name: displayName, msg_type: m.type || 'unknown',
      text: text || null,
      src_lang: tr.src_lang || null, text_th: tr.text_th || null, text_my: tr.text_my || null,
      line_ts: ev.timestamp ? new Date(ev.timestamp).toISOString() : null,
    });

    if (!text) continue;

    // มีคนแท็กนัท / เรียกกะปัน / เรื่องเงิน -> ส่งเข้าแชทนัท
    const mentionedOwner = ((m.mention && m.mention.mentionees) || []).some(x => x.userId && x.userId === OWNER);
    const calledKapan = /กะปัน|kapan/i.test(t);
    const aboutMoney  = /โอน|จ่าย|ค้าง|เงิน|ค่าแรง|บิล|ใบเสร็จ|มัดจำ|ค่าของ/.test(t);
    const tagNut      = /@\s?nut|@\s?นัท/i.test(t);

    // โหมดเงียบ = เตือนเฉพาะเรื่องด่วนจริง (เงิน + แท็กนัทตรงๆ) · เรียกกะปันลอยๆ ไม่ต้องเด้ง
    //  ⚠️ ทุกข้อความยังถูกเก็บลง DB ครบเหมือนเดิม — เงียบแค่ "ไม่เด้งเตือน" ไม่ใช่ "ไม่รับรู้"
    const urgent = aboutMoney || mentionedOwner || tagNut;
    const shouldPush = persona.pushLevel === 'all'
      ? (mentionedOwner || calledKapan || aboutMoney || tagNut)
      : urgent;

    if (OWNER && !isOwner && shouldPush) {
      const head = aboutMoney ? 'เรื่องเงิน — มีคนฝากถึงคุณนัทค่ะ' : 'มีคนเรียกหาคุณนัทค่ะ';
      await linePush(OWNER, head + '\nจาก: ' + (displayName || userId || 'ไม่ทราบชื่อ') + '\ngroupId: ' + groupId + '\n\n"' + t + '"', token);
    }

    if (!wantsData) continue;
    if (!isOwner) continue;   // ของนัทคนเดียว

    const reply = await buildAnswer();
    await lineReply(ev.replyToken, reply, token);
    await logMessage({
      message_id: 'bot_' + (m.id || Date.now()), group_id: groupId, user_id: 'bot',
      display_name: 'กะปัน', msg_type: 'text', text: reply, is_bot_reply: true,
      line_ts: new Date().toISOString(),
    });
  }

  return res.status(200).json({ ok: true });
}

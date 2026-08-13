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
//    explicit = นัทพิมพ์ชื่อห้องนำหน้ามาจริง (ต่างจาก "ไม่ได้ระบุ" ที่ต้องตกไปห้องกะปัน)
//    ⚠️ ห้ามเช็คด้วย \b กับคำไทย — ก-๙ ไม่ใช่ word char ใน JS regex ("เลขา " จะไม่แมตช์)
function routeRoom(text) {
  const m = String(text).match(/^\s*@?([A-Za-z0-9]+|[ก-๙]+)(?:\s*[:：]\s*|\s+)([\s\S]+)$/);
  if (!m) return { room: 'pm', body: text, explicit: false };
  const key = m[1].toLowerCase();
  const room = ROOM_ALIAS[key] || (ROOMS.includes(key) ? key : null);
  return room ? { room, body: m[2].trim(), explicit: true } : { room: 'pm', body: text, explicit: false };
}

// ── 🎭 บุคลิก 3 แบบ (นัทสั่ง 12 ส.ค.: "อยากได้บุคลิกที่รวดเร็วและดุเดือด ลดความมุ้งมิ้ง") ──
//  โหมดเดียวคุมพร้อมกัน 3 อย่าง: น้ำเสียง · ความถี่ที่ตัวเฝ้าไปดูกล่องจดหมาย · ระดับการเตือนจากในกลุ่ม
//  (โมเดลไม่ได้อยู่ตรงนี้ — โมเดลคือของ "ห้องกะปัน" ที่นัทเปิดค้างไว้ ตั้งตอนเปิดห้อง)
//  สลับจากไลน์: พิมพ์ "โหมดเร่ง" / "โหมดปกติ" / "โหมดเงียบ"  ·  ถามโหมดปัจจุบัน: "โหมด?"
const PERSONAS = {
  normal: {
    label: 'ปกติ',
    poll: 10000,
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

// 🏠 บ้านของกะปัน = ห้อง kapan (โมเดลเล็ก เปิดค้างไว้ ตอบไว) — ไม่ใช่ห้องเลขา
//  นัทเคาะเอง 12 ส.ค.: "ก็เราตั้งห้อง haiku ให้กะปันโยนหาห้องอื่นอยู่แล้วไม่ใช่หรอ"
//  ⚠️ เดิม default เป็น 'pm' (ห้องเลขา โมเดลใหญ่) = ทุกข้อความวิ่งไปหาห้องที่คิดช้าที่สุด
//     ส่วนห้อง kapan ที่ตั้งไว้ให้ตอบไวกลับไม่มีอะไรวิ่งเข้าเลย — นี่คือต้นเหตุที่ช้าจริงๆ
const HOME_ROOM = 'kapan';

async function toBoard(text) {
  const { room, body, explicit } = routeRoom(text);
  const target = explicit ? room : HOME_ROOM;      // ระบุห้องมาเอง = ส่งตรงห้องนั้น · ไม่ระบุ = เข้าห้องกะปัน
  const rows = [{ room: target, sender: 'นัท (สั่งผ่านไลน์)', role: 'user', text: body }];
  // สั่งห้องอื่นตรงๆ — ให้กะปันรู้ด้วยว่านัทสั่งอะไรไปไหน จะได้ตามงานให้ถูก
  if (target !== HOME_ROOM) rows.push({ room: HOME_ROOM, sender: 'นัท (สั่งผ่านไลน์)', role: 'user',
    text: '[นัทสั่งตรงไปห้อง ' + target + '] ' + body });
  try {
    await fetch(SB + '/session_messages', {
      method: 'POST',
      headers: { ...SBH, Prefer: 'return=minimal' },
      body: JSON.stringify(rows),
    });
  } catch (e) { console.error('toBoard failed:', e); }
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

// ── ⛔ ชั้นที่ยิง Anthropic API ถูกถอดออกแล้ว (นัทเคาะ 12 ส.ค.) ────────
//  เดิมมี 2 ตัว: แปลไทย↔พม่าให้ครัว + สมองเร็วตอบเอง/เดาห้องปลายทาง
//  ถอดเพราะ: (1) นัทไม่เอาชั้นแปลแล้ว (2) หน้าที่ "ตอบเอง + โยนต่อ" เป็นของ
//  ห้อง kapan (โมเดลเล็ก เปิดค้าง) อยู่แล้ว ไม่ต้องจ่ายซ้ำในนี้
//  → webhook ตัวนี้ไม่เสียเงินค่า API เลย เหลือแค่ค่า Supabase/Vercel ที่จ่ายอยู่แล้ว
//  ⚠️ ถ้าจะเอากลับ ให้ดู commit b378dfc — อย่าเปิดใหม่โดยไม่บอกนัทเรื่องค่าใช้จ่าย


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
  // 'ของที่ต้องส่งวันนั้น' ไม่ใช่ยอดขาย — นัทบอกอ่านแล้วไม่รู้ว่ายอดอะไร (12 ส.ค.)
  const HEADC = /^(MP-|HX30|PKG)/i, SPLITN = /แยกวันส่ง/;
  const real2 = items.filter(it => !HEADC.test(it.menu_code || '') && !SPLITN.test(it.menu_name || ''));
  const boxes = real2.reduce((s, it) => s + (it.quantity || 0), 0);
  let fresh = 0;
  real2.forEach(it => { if (/^(LC|HP|HX)\d/i.test(it.menu_code || '')) fresh += (it.quantity || 0); });
  const stock = boxes - fresh;
  const byMenu = {};
  real2.forEach(it => {
    const k = (it.menu_code || '') + ' ' + (it.menu_name || '');
    byMenu[k] = (byMenu[k] || 0) + (it.quantity || 0);
  });
  const all = Object.entries(byMenu).sort((a, b) => b[1] - a[1]);
  const TOP = 10;
  const lines = all.slice(0, TOP).map(([k, v]) => v + ' x ' + k.trim());
  const DW = ['อา','จ','อ','พ','พฤ','ศ','ส'];
  const dd = new Date(dateIso + 'T00:00:00+07:00');
  const when = DW[dd.getDay()] + ' ' + dd.getDate() + '/' + (dd.getMonth() + 1);
  const out = [
    'ของที่ต้องส่ง ' + when,
    real.length + ' ใบ · ' + boxes + ' กล่อง',
    '(ทำสด ' + fresh + ' · สต็อค ' + stock + ')',
    '',
    'เมนูที่ต้องทำมากสุด',
    ...lines,
  ];
  if (all.length > TOP) out.push('+ อีก ' + (all.length - TOP) + ' เมนู — ดูครบที่หน้าครัว');
  out.push('', 'นับจากออเดอร์ในระบบ ตัดใบยกเลิก/ใบเทสแล้ว');
  return out.join('\n');
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
    // 🔒 ถือว่าเป็น "คำถามยอด" ต่อเมื่อพิมพ์สั้นๆ ตรงเป๊ะเท่านั้น
    //    เดิมจับคำว่า 'ยอด' กลางประโยค -> คำสั่งงานยาวๆ ของนัทถูกตีเป็นคำถาม แล้วหายไปไม่ถึงใคร (เกิด 3 ครั้ง 12 ส.ค.)
    const tq = t.replace(/[?？!。.\s]+$/, '').replace(/^กะปัน[\s,:：]*/i, '').trim();
    const EXACT = /^(ยอด|ยอดวันนี้|ยอดพรุ่งนี้|ยอดมะรืน|ยอดมะรืนนี้|กี่กล่อง|ออเดอร์วันนี้|ออเดอร์พรุ่งนี้|order|orders)$/i;
    const isDateQ = /^ยอด\s*\d{4}-\d{2}-\d{2}$/.test(tq);
    const wantsData = t.length <= 40 && (EXACT.test(tq) || isDateQ);

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
          'เตือนจากกลุ่ม: ' + (persona.pushLevel === 'all' ? 'ทุกเรื่องที่เกี่ยวกับนัท' : 'เฉพาะเรื่องเงิน + แท็กตรง') + '\n\n' +
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
          'เช็คทุก ' + (next.poll / 1000) + ' วิ', token);
        continue;
      }
      if (wantsData) { await toBoard(t); await lineReply(ev.replyToken, await buildAnswer(), token); continue; }

      // ไม่ใช่คำถามยอด = ส่งเข้าห้องกะปัน (โมเดลเล็ก เปิดค้าง) แล้วเงียบ
      // ห้องกะปันเป็นคนตอบเอง หรือโยนต่อให้ห้องที่ใช่ — webhook ไม่คิดแทน ไม่เสียค่า API
      await toBoard(t);
      continue;
    }

    // ===== ในกลุ่ม =====
    const displayName = await getDisplayName(groupId, userId, token);
    const tr = {};   // ชั้นแปลถอดออกแล้ว — เก็บต้นฉบับอย่างเดียว
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
    // เรียกกะปันยังไงก็ติด — ครัวอ่านไทยได้ 2/6 คน พิมพ์เพี้ยนได้ (นัทสั่ง 12 ส.ค.)
    const calledKapan = /กะปัน|กระปัน|กปน|กะปั้น|กะบัน|kapan|kapun|kapann|kpn|ကပန်/i.test(t);
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

    // 🔴 นัทสั่งกะปันจากในกลุ่ม (แก้ 13 ส.ค. — เดิมตกหายเงียบทั้งหมด)
    //    เหตุ: push ทำเฉพาะ !isOwner + ข้างล่างต้องเป็นคำถามยอดเท่านั้น → คำสั่งนัทในกลุ่มไม่เคยถึงบอร์ดเลย
    //    เคสจริง: ห้องแอดมิน 20:20 "กะปัน ส่งเรื่องหา cc ให้หน่อย ออเดอร์ลูกค้าไม่ขึ้นหน้าแพลนเมนู" → หายทั้งข้อความ
    if (isOwner && calledKapan && !wantsData) {
      const body = t.replace(/(กะปัน|กระปัน|กะปั้น|กะบัน|kapan)/i, "").replace(/^[\s,:：]+/, "").trim();
      if (body) {
        await toBoard(body);
        await lineReply(ev.replyToken, "รับเรื่องแล้วค่ะ ส่งเข้าห้องให้เลยนะคะ", token);
      }
      continue;
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

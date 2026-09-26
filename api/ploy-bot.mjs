// ============================================================
//  บอทพลอย — ช่อง LINE แยกสำหรับพลอยคุยกับกะปันแชทเดี่ยว  · สร้าง 25 ก.ย. 2569 (นัทสั่ง)
//  ------------------------------------------------------------
//  ทำไมต้องแยก: บัญชีกะปัน (@293lwrvn) เป็นแพ็กฟรี 300 ข้อความ/เดือน หมดเกลี้ยง 24 ก.ย.
//  เพราะส่งเข้ากลุ่มนับตามจำนวนคน → นัทเอาบัญชีเก่า "Expense Bot" ที่ไม่ได้ใช้แล้วมาเป็นช่องของพลอย
//  แชทเดี่ยวนับ 1 ข้อความ/ครั้ง · สมอง = ห้องการุน แยกจากกะปัน (ข้อความเข้าบอร์ด room=karoon · 26 ก.ย.)
//
//  endpoint เดียว 2 หน้าที่:
//   ① LINE ยิงเข้ามา (มี x-line-signature) → ข้อความพลอยเข้าห้องกะปัน · คนอื่นจดรหัสไว้ ไม่ตอบ
//   ② ห้องการุนส่งกลับ  POST { "key": "...", "text": "..." } → push หาพลอยคนเดียวเท่านั้น
//
//  env (ห้ามใช้ชื่อซ้ำกับ LINE_* หรือ KAPAN_* — เคยทับกันจนบอทตายเงียบ 14 ส.ค.):
//   PLOY_BOT_CHANNEL_SECRET (จำเป็นตัวเดียว) · PLOY_BOT_CHANNEL_ID ไม่ใส่ก็ได้ (ค่าเริ่ม 2007309561 = Expense Bot · provider Nut Expense) · (PLOY_BOT_CHANNEL_ACCESS_TOKEN ไม่ใส่ก็ได้)
//  รหัส LINE ของพลอย (คนละเลขกับในบัญชีกะปัน เพราะอยู่คนละ provider) → kitchen_data key `ploy_bot_uid`
// ============================================================

import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

const SB   = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const WKEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ANON;
const SBH  = { apikey: WKEY, Authorization: 'Bearer ' + WKEY, 'Content-Type': 'application/json' };
const SAY_KEY = process.env.KAROON_SAY_KEY || 'karoon-ploy-2026';
const HOME_ROOM = 'karoon';   // ห้องการุน แยกจากกะปัน (นัทสั่ง 26 ก.ย.) · ต้องตรงกับ scripts/karoon_watch.mjs

function readRaw(req) {
  return new Promise((resolve, reject) => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => resolve(d)); req.on('error', reject);
  });
}

function verifyLine(rawBody, sig, secret) {
  if (!secret || !sig) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

let cached = null, until = 0;
async function getToken() {
  if (process.env.PLOY_BOT_CHANNEL_ACCESS_TOKEN) return process.env.PLOY_BOT_CHANNEL_ACCESS_TOKEN;
  const id = process.env.PLOY_BOT_CHANNEL_ID || '2007309561', secret = process.env.PLOY_BOT_CHANNEL_SECRET;
  if (!id || !secret) return null;
  if (cached && Date.now() < until) return cached;
  try {
    const r = await fetch('https://api.line.me/v2/oauth/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret }),
    });
    const j = await r.json().catch(() => ({}));
    if (!j.access_token) { console.error('บอทพลอย: แลก token ไม่สำเร็จ', r.status); return null; }
    cached = j.access_token; until = Date.now() + 6 * 3600 * 1000;
    return cached;
  } catch (e) { console.error('บอทพลอย: แลก token พัง', e && e.message); return null; }
}

async function getPloyUid() {
  try {
    const r = await fetch(SB + '/kitchen_data?select=data&key=eq.ploy_bot_uid', { headers: SBH });
    const j = await r.json();
    return (Array.isArray(j) && j[0] && j[0].data && j[0].data.uid) || null;
  } catch { return null; }
}

// sender = "พลอย (สั่งผ่านไลน์)" · ตัวเฝ้า scripts/karoon_watch.mjs ปลุกห้องการุน
async function toBoard(text) {
  try {
    await fetch(SB + '/session_messages', {
      method: 'POST', headers: { ...SBH, Prefer: 'return=minimal' },
      body: JSON.stringify({ room: HOME_ROOM, sender: 'พลอย (สั่งผ่านไลน์)', role: 'user', text }),
    });
  } catch (e) { console.error('บอทพลอย: เขียนบอร์ดไม่ได้', e); }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('ok');
  const raw = await readRaw(req);
  const sig = req.headers['x-line-signature'];

  // ② ห้องการุนตอบกลับพลอย
  if (!sig) {
    let j; try { j = JSON.parse(raw || '{}'); } catch { return res.status(400).json({ ok: false }); }
    if (j.key !== SAY_KEY) return res.status(401).json({ ok: false });
    const text = String(j.text || '').trim();
    if (!text) return res.status(400).json({ ok: false, why: 'ไม่มีข้อความ' });
    const uid = await getPloyUid();
    if (!uid) return res.status(400).json({ ok: false, why: 'ยังไม่ได้ตั้งรหัสพลอย (kitchen_data.ploy_bot_uid)' });
    const token = await getToken();
    if (!token) return res.status(500).json({ ok: false, why: 'ยังไม่ได้ตั้งกุญแจบอทพลอยใน Vercel' });
    const r = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ to: uid, messages: [{ type: 'text', text: text.slice(0, 4900) }] }),
    });
    return res.status(200).json({ ok: r.ok, status: r.status, ปลายทาง: 'พลอย (บอทพลอย)' });
  }

  // ① LINE ยิงเข้ามา
  if (!verifyLine(raw, sig, process.env.PLOY_BOT_CHANNEL_SECRET)) return res.status(401).send('bad signature');
  let body; try { body = JSON.parse(raw || '{}'); } catch { return res.status(200).send('ok'); }
  const ployUid = await getPloyUid();

  for (const ev of body.events || []) {
    const src = ev.source || {};
    const userId = src.userId || '';
    if (src.type !== 'user') continue;   // บอทนี้คุยแชทเดี่ยวเท่านั้น

    if (ev.type === 'follow' && userId !== ployUid) {
      await toBoard('[คนแอดบอทพลอย] userId: ' + userId + '\n(ถ้าเป็นพลอย ให้ตั้ง kitchen_data key ploy_bot_uid = {"uid":"' + userId + '"})');
      continue;
    }
    if (ev.type !== 'message') continue;
    const m = ev.message || {};
    const t = m.type === 'text' ? String(m.text || '').trim() : '[' + m.type + ']';

    if (ployUid && userId === ployUid) {
      await toBoard('[พลอย · บอทพลอย · 🎫 บัตรผ่าน] ' + t +
        '\n\n↩ ตอบกลับพลอยทางนี้เท่านั้น — POST /api/ploy-bot { "key": "...", "text": "..." } · ไม่เกิน 350 ตัว');
    } else {
      await toBoard('[คนนอกทักบอทพลอย] userId: ' + userId + '\n"' + t + '"' +
        (ployUid ? '' : '\n(ยังไม่ได้ตั้งรหัสพลอย — ถ้าคนนี้คือพลอย ให้ตั้ง kitchen_data key ploy_bot_uid)'));
    }
  }
  return res.status(200).send('ok');
}

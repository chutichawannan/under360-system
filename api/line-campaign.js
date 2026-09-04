// ── เครื่องมือยิงแคมเปญ LINE ผ่าน API (18 ส.ค. 2026 · ห้อง 05) ───────────────
//
// ทำไมต้องมี:
//   หน้า LINE OA Manager สร้างกลุ่มเป้าหมายได้ทางเดียวคือ "อัปไฟล์ .txt"
//   → ต้องกดหน้าต่างเลือกไฟล์ของ Windows ซึ่ง agent ทำไม่ได้ = นัทต้องมากดเองทุกครั้ง
//   นัทสั่ง 18 ส.ค.: "ฉันอยากได้ความออโตเมชั่น แบบฉันไม่ยุ่งด้วยแล้ว"
//   → Messaging API สร้าง audience จาก uid ตรงๆ ได้ ไม่ต้องมีไฟล์ → ปิดช่องที่ต้องใช้มือคน
//
// ความปลอดภัย:
//   ต้องมี header `x-u360-key` ตรงกับค่าใน Supabase `kitchen_data.line_campaign_key`
//   (คนละชั้นกับ anon key — anon อ่านตารางนี้ได้ แต่ endpoint นี้ยิงหาลูกค้าจริง จึงล็อกอีกชั้น)
//
// action ที่รองรับ:
//   audience_create  { name, uids[] }              → { audienceGroupId }
//   audience_status  { audienceGroupId }           → สถานะพร้อมยิงหรือยัง
//   narrowcast       { audienceGroupId, messages } → ยิงจริง
//   push_test        { messages }                  → ยิงทดสอบหาเจ้าของคนเดียว (ปลายทางฝังในไฟล์)
//   quota            {}                            → เช็คโควตาข้อความคงเหลือ
//
// ⚠️ ยิงจริง = ลูกค้าได้รับทันที ย้อนไม่ได้ — เรียกเมื่อเจ้าของสั่งเท่านั้น

const { getLineToken } = require('./_line_token.js');

/* 🔒 ปลายทางของ push_test — ฝังตายไว้ในโค้ด ห้ามรับจากคำขอ
      กุญแจหลุดก็กวนได้แค่คนในลิสต์นี้ ส่งหาลูกค้าไม่ได้ */
const TEST_UIDS = {
  nut: 'U1e6056034671878fcb8d536c7ef7333e',   // นัท (เจ้าของ)
};

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

async function expectedSecret() {
  const r = await fetch(`${SB}/rest/v1/kitchen_data?key=eq.line_campaign_key&select=data`, {
    headers: { apikey: ANON, Authorization: 'Bearer ' + ANON },
  });
  const j = await r.json().catch(() => []);
  return (j && j[0] && j[0].data && j[0].data.secret) || null;
}

async function line(token, path, body, method = 'POST') {
  const r = await fetch('https://api.line.me' + path, {
    method,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 400) }; }
  return { status: r.status, ok: r.ok, json };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).end(JSON.stringify({ ok: false, error: 'POST เท่านั้น' }));

  const want = await expectedSecret();
  const got = req.headers['x-u360-key'];
  if (!want || got !== want) return res.status(401).end(JSON.stringify({ ok: false, error: 'กุญแจไม่ถูกต้อง' }));

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const token = await getLineToken();
  if (!token) return res.status(500).end(JSON.stringify({ ok: false, error: 'ออก token กับ LINE ไม่ได้' }));

  try {
    const a = body.action;

    if (a === 'quota') {
      const q = await line(token, '/v2/bot/message/quota', null, 'GET');
      const c = await line(token, '/v2/bot/message/quota/consumption', null, 'GET');
      return res.status(200).end(JSON.stringify({ ok: true, quota: q.json, used: c.json }));
    }

    if (a === 'audience_create') {
      const uids = Array.from(new Set((body.uids || []).filter(Boolean)));
      if (!uids.length) return res.status(400).end(JSON.stringify({ ok: false, error: 'ไม่มี uid' }));
      // LINE รับสูงสุด 10,000 ต่อครั้ง — ก้อนแรกสร้างกลุ่ม ที่เหลือค่อยเติม
      const first = uids.slice(0, 10000);
      const r1 = await line(token, '/v2/bot/audienceGroup/upload', {
        description: String(body.name || 'u360').slice(0, 120),
        isIfaAudience: false,
        audiences: first.map((id) => ({ id })),
      });
      if (!r1.ok) return res.status(200).end(JSON.stringify({ ok: false, step: 'create', ...r1 }));
      const gid = r1.json.audienceGroupId;
      for (let i = 10000; i < uids.length; i += 10000) {
        await line(token, '/v2/bot/audienceGroup/upload', {
          audienceGroupId: gid,
          audiences: uids.slice(i, i + 10000).map((id) => ({ id })),
        }, 'PUT');
      }
      return res.status(200).end(JSON.stringify({ ok: true, audienceGroupId: gid, sent: uids.length }));
    }

    if (a === 'audience_status') {
      const r = await line(token, `/v2/bot/audienceGroup/${body.audienceGroupId}`, null, 'GET');
      return res.status(200).end(JSON.stringify({ ok: r.ok, ...r.json }));
    }

    if (a === 'audience_list') {
      const r = await line(token, '/v2/bot/audienceGroup/list?page=1&size=40', null, 'GET');
      return res.status(200).end(JSON.stringify({ ok: r.ok, ...r.json }));
    }

    if (a === 'audience_delete') {
      const r = await line(token, `/v2/bot/audienceGroup/${body.audienceGroupId}`, null, 'DELETE');
      return res.status(200).end(JSON.stringify({ ok: r.ok, status: r.status }));
    }

    if (a === 'audience_rename') {
      const r = await line(token, `/v2/bot/audienceGroup/${body.audienceGroupId}/updateDescription`,
        { description: String(body.name || '').slice(0, 120) }, 'PUT');
      return res.status(200).end(JSON.stringify({ ok: r.ok, status: r.status }));
    }

    if (a === 'narrowcast') {
      if (!body.audienceGroupId) return res.status(400).end(JSON.stringify({ ok: false, error: 'ต้องมี audienceGroupId' }));
      if (!Array.isArray(body.messages) || !body.messages.length)
        return res.status(400).end(JSON.stringify({ ok: false, error: 'ต้องมี messages' }));
      const r = await line(token, '/v2/bot/message/narrowcast', {
        messages: body.messages,
        recipient: { type: 'audience', audienceGroupId: Number(body.audienceGroupId) },
        filter: { demographic: null },
        limit: { upToRemainingQuota: true },
        notificationDisabled: false,
      });
      return res.status(200).end(JSON.stringify({
        ok: r.ok, status: r.status,
        requestId: r.json && r.json.requestId,
        acceptedRequestId: (r.json && r.json['x-line-accepted-request-id']) || null,
        detail: r.json,
      }));
    }

    /* ยิงทดสอบหาเจ้าของ — ใช้ก่อนยิงจริงทุกครั้งที่มีรูป/ปุ่ม/ลิงก์ในข้อความ
       ตัวข้อความรับมาเต็มรูปแบบเหมือน narrowcast จะได้เทสของชิ้นเดียวกับที่จะยิงจริง */
    if (a === 'push_test') {
      if (!Array.isArray(body.messages) || !body.messages.length)
        return res.status(400).end(JSON.stringify({ ok: false, error: 'ต้องมี messages' }));
      if (body.messages.length > 5)
        return res.status(400).end(JSON.stringify({ ok: false, error: 'LINE รับได้สูงสุด 5 ข้อความต่อครั้ง' }));
      /* รับได้แค่ชื่อในลิสต์ · ส่ง uid มาเองไม่มีผล (ค่า default = เจ้าของ) */
      const who = String(body.to || 'nut');
      const uid = TEST_UIDS[who];
      if (!uid) return res.status(400).end(JSON.stringify({
        ok: false, error: 'ปลายทางนี้ไม่ได้อยู่ในลิสต์ทดสอบ', allowed: Object.keys(TEST_UIDS) }));
      const r = await line(token, '/v2/bot/message/push', {
        to: uid, messages: body.messages, notificationDisabled: false,
      });
      return res.status(200).end(JSON.stringify({
        ok: r.ok, status: r.status, to: who,
        sentAt: new Date().toISOString(), detail: r.json,
      }));
    }

    if (a === 'narrowcast_status') {
      const r = await line(token, `/v2/bot/message/progress/narrowcast?requestId=${body.requestId}`, null, 'GET');
      return res.status(200).end(JSON.stringify({ ok: r.ok, ...r.json }));
    }

    return res.status(400).end(JSON.stringify({ ok: false, error: 'action ไม่รู้จัก' }));
  } catch (e) {
    return res.status(500).end(JSON.stringify({ ok: false, error: String((e && e.message) || e) }));
  }
};

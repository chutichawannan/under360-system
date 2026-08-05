// ============================================================
//  Under360 — API หลังบ้านของ "หน้าคุยงานครัว" (k-track · 5 ส.ค. 2026)
//  endpoint: /api/kitchen-console
//  ------------------------------------------------------------
//  หน้าที่ 2 อย่าง (นัทออกแบบเอง: "ฉันใช้หน้านี้คนเดียวเพื่อสื่อสารและรับสาร"):
//   GET  → อ่านบทสนทนากลุ่มครัว พร้อมคำแปลไทย   (รับสาร)
//   POST → นัทพิมพ์ไทย → แปลเป็นพม่า → ส่งเข้ากลุ่ม LINE ครัว 2 ภาษา (สื่อสาร)
//
//  🔒 ทำไมต้องผ่าน server ไม่ยิง Supabase ตรงจากหน้าเว็บ:
//     ตาราง line_group_messages ตั้งใจให้ anon "เขียนได้ อ่านไม่ได้"
//     (anon key ฝังในหน้าเว็บ ใครก็หยิบไปอ่านแชทพนักงานได้)
//     → อ่านต้องใช้ service role ที่อยู่ฝั่ง server เท่านั้น + กั้นด้วย KITCHEN_CONSOLE_KEY
//
//  env: SUPABASE_SERVICE_ROLE_KEY · KITCHEN_CONSOLE_KEY · LINE_CHANNEL_ACCESS_TOKEN
//       ANTHROPIC_API_KEY (ไม่มี = ส่งได้แต่ไม่แปล) · LINE_KITCHEN_GROUP_ID (ไม่ใส่ = เดาจากกลุ่มล่าสุด)
// ============================================================

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const TRANSLATE_MODEL = 'claude-haiku-4-5-20251001';

const svcHeaders = () => {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { apikey: k, Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' };
};

// แปลไทย → พม่า สำหรับข้อความที่นัทส่งเข้าครัว
async function toBurmese(text) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: TRANSLATE_MODEL,
        max_tokens: 700,
        system:
          'แปลข้อความจากเจ้าของร้านอาหารเป็นภาษาพม่า สำหรับทีมครัวชาวไทใหญ่ที่อ่านพม่าได้บางส่วน\n' +
          'กฎ: ใช้คำง่ายๆ ประโยคสั้น · ห้ามแปลงตัวเลข ชื่อเมนู รหัสเมนู (S136/HP/LC) และหน่วย (กล่อง/กก./กรัม) คงไว้ตามต้นฉบับเป๊ะ\n' +
          'ตอบกลับเป็นคำแปลอย่างเดียว ห้ามมีคำอธิบายอื่น',
        messages: [{ role: 'user', content: String(text).slice(0, 2000) }],
      }),
    });
    if (!r.ok) return null;
    return (await r.json())?.content?.[0]?.text?.trim() || null;
  } catch (e) { console.error('toBurmese failed:', e); return null; }
}

// หากลุ่มครัวจากข้อความล่าสุด (ไม่ต้องให้นัทไปหา groupId มากรอกเอง)
// ⚠️ ต้องกรอง 2 ชั้น ไม่งั้นเลือกกลุ่มผิดแล้วข้อความนัทหลุดไปผิดที่:
//   1) id ของกลุ่ม/ห้องจริงจาก LINE ขึ้นต้นด้วย C หรือ R เท่านั้น — กันแถวเทส/แถวขยะ
//   2) เรียงด้วย created_at (มี default now() เสมอ) ไม่ใช่ line_ts ที่เป็น null ได้
//      — ใน Postgres `order by line_ts desc` เอา NULL ขึ้นก่อน = แถวไม่มีเวลาจะชนะแถวจริง
async function latestGroupId() {
  if (process.env.LINE_KITCHEN_GROUP_ID) return process.env.LINE_KITCHEN_GROUP_ID;
  const r = await fetch(
    `${SB}/line_group_messages?select=group_id&or=(group_id.like.C*,group_id.like.R*)&order=created_at.desc&limit=1`,
    { headers: svcHeaders() });
  const j = await r.json();
  return Array.isArray(j) && j[0] ? j[0].group_id : null;
}

async function linePush(groupId, text) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || !groupId) throw new Error('ยังไม่ได้ตั้ง LINE_CHANNEL_ACCESS_TOKEN หรือหากลุ่มครัวไม่เจอ');
  const r = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ to: groupId, messages: [{ type: 'text', text: String(text).slice(0, 4900) }] }),
  });
  if (!r.ok) throw new Error('LINE push ไม่ผ่าน: ' + r.status + ' ' + (await r.text()).slice(0, 200));
}

export default async function handler(req, res) {
  // 🔒 กั้นฝั่ง server — fail-closed: ยังไม่ตั้งคีย์ = ไม่ให้เข้าเลย (ดีกว่าเปิดโล่ง)
  const want = process.env.KITCHEN_CONSOLE_KEY;
  if (!want) return res.status(503).json({ ok: false, error: 'ยังไม่ได้ตั้ง KITCHEN_CONSOLE_KEY ใน Vercel' });
  if ((req.headers['x-console-key'] || '') !== want) return res.status(401).json({ ok: false, error: 'รหัสไม่ถูก' });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ ok: false, error: 'ยังไม่ได้ตั้ง SUPABASE_SERVICE_ROLE_KEY' });

  try {
    // ── รับสาร: อ่านบทสนทนา + คำแปลไทย ──────────────────────
    if (req.method === 'GET') {
      const limit = Math.min(parseInt(req.query?.limit || '80', 10) || 80, 300);
      const r = await fetch(
        `${SB}/line_group_messages?select=id,display_name,msg_type,text,text_th,src_lang,from_owner,is_bot_reply,line_ts&order=line_ts.desc&limit=${limit}`,
        { headers: svcHeaders() });
      const rows = await r.json();
      if (!Array.isArray(rows)) return res.status(500).json({ ok: false, error: 'อ่านตารางไม่ได้ (รัน sql_kitchen_translate.sql แล้วยัง?)' });
      return res.status(200).json({ ok: true, messages: rows.reverse() });   // เก่า→ใหม่ อ่านเหมือนแชท
    }

    // ── สื่อสาร: นัทพิมพ์ไทย → ส่งเข้ากลุ่มครัว 2 ภาษา ──────────
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const text = (body?.text || '').trim();
      if (!text) return res.status(400).json({ ok: false, error: 'ไม่มีข้อความ' });

      const groupId = await latestGroupId();
      const my = await toBurmese(text);
      // ส่งไทยไว้บนเสมอ (อู/โม๋ข่องอ่านไทย) แล้วพม่าต่อท้ายให้ที่เหลือ
      const out = my ? `${text}\n— — —\n${my}` : text;
      await linePush(groupId, out);

      await fetch(`${SB}/line_group_messages`, {
        method: 'POST',
        headers: { ...svcHeaders(), Prefer: 'return=minimal' },
        body: JSON.stringify({
          message_id: 'owner_' + Date.now(), group_id: groupId, user_id: 'owner',
          display_name: 'นัท (เจ้าของร้าน)', msg_type: 'text',
          text: out, text_th: text, text_my: my, src_lang: 'th',
          from_owner: true, line_ts: new Date().toISOString(),
        }),
      });

      return res.status(200).json({ ok: true, translated: !!my });
    }

    return res.status(405).json({ ok: false, error: 'method ไม่รองรับ' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}

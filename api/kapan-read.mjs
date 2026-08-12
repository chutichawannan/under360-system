// ============================================================
//  กะปันอ่านแชทกลุ่ม — ให้ห้องเลขาอ่านได้ผ่านเซิร์ฟเวอร์เท่านั้น
//  GET /api/kapan-read?key=...&group=...&limit=30&since=ISO
//  🔒 ตาราง line_group_messages ปิดไม่ให้ anon อ่าน (กันแชทรั่วผ่านหน้าเว็บ)
//     ที่นี่อ่านด้วย service role ฝั่งเซิร์ฟเวอร์ + ต้องมี key ถึงเรียกได้
// ============================================================
const SB   = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY  = process.env.KAPAN_SAY_KEY || 'kapan-pm-2026';
const SRV  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req, res) {
  const u = new URL(req.url, 'http://x');
  if (u.searchParams.get('key') !== KEY) return res.status(401).json({ ok: false });
  if (!SRV) return res.status(503).json({ ok: false, why: 'ยังไม่ได้ตั้ง SUPABASE_SERVICE_ROLE_KEY ใน Vercel' });

  const limit = Math.min(parseInt(u.searchParams.get('limit') || '30', 10), 200);
  const group = u.searchParams.get('group');
  const since = u.searchParams.get('since');

  let q = `${SB}/line_group_messages?select=created_at,line_ts,group_id,display_name,text,text_th,src_lang,is_bot_reply&order=created_at.desc&limit=${limit}`;
  if (group) q += `&group_id=eq.${encodeURIComponent(group)}`;
  if (since) q += `&created_at=gt.${encodeURIComponent(since)}`;

  try {
    const r = await fetch(q, { headers: { apikey: SRV, Authorization: 'Bearer ' + SRV } });
    const rows = await r.json();
    if (!Array.isArray(rows)) return res.status(500).json({ ok: false, rows });
    // เรียงเก่า -> ใหม่ ให้อ่านง่าย
    return res.status(200).json({ ok: true, count: rows.length, rows: rows.reverse() });
  } catch (e) {
    return res.status(500).json({ ok: false, why: String(e) });
  }
}

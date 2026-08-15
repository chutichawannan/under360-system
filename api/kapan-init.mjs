// ============================================================
//  ตั้งที่เก็บไฟล์ของกะปันครั้งเดียว — สร้าง bucket "line-files" (ปิด ไม่เปิดสาธารณะ)
//  GET /api/kapan-init?key=...
//  🔒 ใช้ service role ฝั่งเซิร์ฟเวอร์เท่านั้น · ไม่มีใครเห็นคีย์
//     (สร้าง bucket ผ่านหน้าเว็บ Supabase ไม่ได้เพราะเบราว์เซอร์ค้าง เลยทำทางนี้แทน)
//  รันซ้ำได้ ปลอดภัย — ถ้ามีอยู่แล้วจะบอกว่ามีแล้ว
// ============================================================
const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1';
const KEY = process.env.KAPAN_SAY_KEY || 'kapan-pm-2026';
const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req, res) {
  const u = new URL(req.url, 'http://x');
  if (u.searchParams.get('key') !== KEY) return res.status(401).json({ ok: false });
  if (!SRV) return res.status(503).json({ ok: false, why: 'ยังไม่ได้ตั้ง SUPABASE_SERVICE_ROLE_KEY' });
  const H = { Authorization: 'Bearer ' + SRV, apikey: SRV, 'Content-Type': 'application/json' };
  try {
    const list = await (await fetch(SB + '/bucket', { headers: H })).json();
    const names = Array.isArray(list) ? list.map(b => b.name) : [];
    if (names.includes('line-files')) return res.status(200).json({ ok: true, มีอยู่แล้ว: true, buckets: names });
    const r = await fetch(SB + '/bucket', {
      method: 'POST', headers: H,
      body: JSON.stringify({ id: 'line-files', name: 'line-files', public: false }),
    });
    const body = await r.text();
    return res.status(r.ok ? 200 : 500).json({ ok: r.ok, สร้างใหม่: r.ok, ผล: body.slice(0, 300), buckets: names });
  } catch (e) {
    return res.status(500).json({ ok: false, why: String(e).slice(0, 200) });
  }
}

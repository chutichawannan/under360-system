// ============================================================
//  กะปันพูด — ให้ห้อง PM/เลขา ส่งข้อความกลับเข้าไลน์นัทได้
//  POST /api/kapan-say  { "key": "...", "text": "..." }
//  ใช้ตอนนัทสั่งงานผ่านไลน์แล้วเลขาทำเสร็จ ต้องรายงานกลับ
//  🔒 ส่งได้เฉพาะหา OWNER (นัท) เท่านั้น — ส่งหาคนอื่นไม่ได้เลย
// ============================================================
const OWNER = process.env.OWNER_LINE_USER_ID || 'Ucc982b971a6676e02ecac6d668723003';
const KEY   = process.env.KAPAN_SAY_KEY || 'kapan-pm-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('ok');

  let body = '';
  await new Promise(r => { req.on('data', c => body += c); req.on('end', r); });

  let j; try { j = JSON.parse(body || '{}'); } catch { return res.status(400).json({ ok: false }); }
  if (j.key !== KEY) return res.status(401).json({ ok: false });

  // เพดานความยาว: ไลน์ไว้คุยสั้นๆ ยาวกว่านี้ไปคุยต่อในแชท Claude (นัทสั่ง 12 ส.ค.)
  const MAX = 700;   // ~150 คำไทย
  let text = String(j.text || '').trim();
  if (text.length > MAX) text = text.slice(0, MAX).trimEnd() + '…\n\n(ยาวเกินค่ะ ที่เหลือไปดูต่อในแชทนะคะ)';
  if (!text) return res.status(400).json({ ok: false, why: 'ไม่มีข้อความ' });

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ ok: false, why: 'ยังไม่ได้ตั้ง token' });

  try {
    const r = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ to: OWNER, messages: [{ type: 'text', text }] }),
    });
    return res.status(200).json({ ok: r.ok, status: r.status });
  } catch (e) {
    return res.status(500).json({ ok: false, why: String(e) });
  }
}

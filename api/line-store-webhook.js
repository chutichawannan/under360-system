/* Under360 — ปลายทาง webhook ของ "OA ร้าน" (@rwc2010a · แชนแนล 2005639534)
 *
 * 🔴 ทำไมมีไฟล์นี้ (เกิดจากความผิดพลาดจริง 13-14 ส.ค. 2026):
 *    CC ตั้ง webhook ของ OA ร้านให้ชี้ไปที่ /api/line-webhook ซึ่งเป็น "น้องกะปัน"
 *    (ผู้ช่วยส่วนตัวของนัท คนละบัญชี เพื่อน 1 คน)
 *    → ถ้าเปิดใช้งาน: ข้อความจากลูกค้า 23,000+ คนจะวิ่งเข้ากะปัน
 *      และกะปันจะ "ตอบลูกค้าแทนแอดมิน" เวลาลูกค้าพิมพ์คำว่า ยอด/ออเดอร์
 *    → นัทจับได้เอง: "webhook ของ OA under360 ชี้มาที่กะปัน อันนี้ไม่ควรเกิดขึ้น"
 *
 * 📥 24 ก.ย. 2026 — นัทสั่งเปิดเก็บข้อความขาเข้า ("เปิด webhook ไปเลย")
 *    เป้าหมาย: หน้า /staff/care.html เห็นว่าลูกค้า VIP พิมพ์อะไรมาบ้าง
 *
 * 🔒 กฎของไฟล์นี้ — ห้ามละเมิด (เขียนไว้เพราะเคยพลาดมาแล้ว):
 *    · **ไม่ตอบลูกค้าเด็ดขาด** ไม่มี reply ไม่มี push — แอดมินตอบเองใน chat.line.biz เหมือนเดิม
 *    · เก็บอย่างเดียว (ขาเข้า) · ตอบ 200 ทุกกรณี ไม่ให้ LINE retry
 *    · ไม่แตะแชทกลุ่มครัว/กะปัน (คนละแชนแนล คนละไฟล์)
 *
 * ⚠️ ที่ยังทำไม่ได้: ข้อความที่ "แอดมินพิมพ์ตอบ" ใน chat.line.biz จะไม่เข้า webhook
 *    (LINE ส่งเฉพาะขาเข้า) → หน้า care จึงเห็นฝั่งลูกค้าก่อน
 */
const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const SRV = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

async function save(row) {
  if (!SRV) { console.log('[line-store-webhook] ยังไม่ได้ตั้ง SUPABASE_SERVICE_ROLE_KEY — ข้อความไม่ถูกเก็บ'); return; }
  try {
    const r = await fetch(SB + '/line_customer_messages', {
      method: 'POST',
      headers: { apikey: SRV, Authorization: 'Bearer ' + SRV, 'Content-Type': 'application/json',
                 Prefer: 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify(row),
    });
    if (!r.ok) console.log('[line-store-webhook] เก็บไม่สำเร็จ', r.status, (await r.text()).slice(0, 160));
  } catch (e) { console.log('[line-store-webhook] เก็บพัง', String(e).slice(0, 160)); }
}

/** ชื่อที่ลูกค้าตั้งใน LINE — ขอจาก LINE ถ้ามี token, ไม่มีก็ปล่อยว่าง (ไม่ใช่เรื่องคอขาดบาดตาย) */
async function nameOf(uid) {
  if (!TOKEN || !uid) return null;
  try {
    const r = await fetch('https://api.line.me/v2/bot/profile/' + uid, { headers: { Authorization: 'Bearer ' + TOKEN } });
    if (!r.ok) return null;
    return (await r.json()).displayName || null;
  } catch { return null; }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).send('ok');   // LINE ยิง GET/HEAD ตอน verify
  try {
    let body = req.body;
    if (!body || typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch { body = {}; } }
    const events = Array.isArray(body.events) ? body.events : [];
    for (const ev of events) {
      if (ev.type !== 'message') continue;                       // สนใจเฉพาะข้อความ
      if (!ev.source || ev.source.type !== 'user') continue;      // เฉพาะแชท 1:1 ของลูกค้า
      const m = ev.message || {};
      const uid = ev.source.userId || null;
      await save({
        line_uid: uid,
        display_name: await nameOf(uid),
        msg_type: m.type || 'unknown',
        text: m.type === 'text' ? (m.text || '') : `[${m.type}]`,
        message_id: m.id || null,
        direction: 'in',                                          // เผื่ออนาคตเก็บขาออกด้วย
        line_ts: ev.timestamp ? new Date(ev.timestamp).toISOString() : null,
      });
    }
  } catch (e) {
    console.log('[line-store-webhook] พังระหว่างอ่าน event:', String(e).slice(0, 200));
  }
  return res.status(200).send('ok');   // ตอบ 200 เสมอ ไม่ให้ LINE retry ถล่ม
};

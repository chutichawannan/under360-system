/* Under360 — ตัวตรวจว่า "เราคุยกับ LINE ได้จริงไหม" (13 ส.ค. 2026)
 *
 * ทำไมต้องมี:
 *   /api/notify-daily-orders?dry=1 บอกได้แค่ว่า "ประกอบข้อความได้" — มันไม่แตะ LINE เลย
 *   → ต่อให้ความลับแชนแนลผิด หน้านั้นก็ยังขึ้นสวยเหมือนเดิม = อ่านผลแล้วเข้าใจผิดได้
 *   หน้านี้ยิงถาม LINE จริง แล้วบอกตรงๆ ว่าผ่านหรือไม่ผ่าน เพราะอะไร
 *
 * เปิดดูได้เลย: /api/line-check
 * ⚠️ ไม่คืนค่าความลับหรือ token ออกมาเด็ดขาด — คืนแค่ชื่อบอท / โควตา / สถานะ
 */
const getLineToken = require('./_line_token.js');

module.exports = async (req, res) => {
  const out = { ok: false, ขั้นตอน: [] };
  const step = (ชื่อ, ผ่าน, รายละเอียด) => out.ขั้นตอน.push({ ชื่อ, ผ่าน, รายละเอียด });

  const hasSecret = !!process.env.LINE_CHANNEL_SECRET;
  const hasDirect = !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
  step('มีความลับแชนแนลใน env', hasSecret, hasSecret ? 'มี' : 'ไม่มี — ใส่ LINE_CHANNEL_SECRET ที่ Vercel');
  step('มี token ใส่ตรงๆ', hasDirect,
    hasDirect ? '⚠️ มีอยู่ — ระบบจะใช้ตัวนี้ก่อนความลับแชนแนล ถ้าหมดอายุจะพังเงียบ แนะนำให้ลบทิ้ง'
              : 'ไม่มี (ดีแล้ว — ระบบจะแลก token จากความลับแชนแนลเอง ต่ออายุอัตโนมัติ)');

  const token = await getLineToken();
  step('ออก token กับ LINE', !!token, token ? 'สำเร็จ' : 'ไม่สำเร็จ — ความลับแชนแนลน่าจะผิด หรือยังไม่ได้ redeploy');
  if (!token) return res.status(200).json(out);

  try {
    const r = await fetch('https://api.line.me/v2/bot/info', { headers: { Authorization: 'Bearer ' + token } });
    const j = await r.json().catch(() => ({}));
    step('อ่านข้อมูลบัญชี OA', r.ok, r.ok ? `${j.displayName || '-'} (${j.basicId || '-'})` : `HTTP ${r.status} ${j.message || ''}`);
    if (!r.ok) return res.status(200).json(out);
    out.บัญชี = { ชื่อ: j.displayName, ไอดี: j.basicId, สถานะแชท: j.chatMode, ตอบอัตโนมัติ: j.markAsReadMode };
  } catch (e) { step('อ่านข้อมูลบัญชี OA', false, e.message); return res.status(200).json(out); }

  try {
    const q = await fetch('https://api.line.me/v2/bot/message/quota', { headers: { Authorization: 'Bearer ' + token } });
    const qj = await q.json().catch(() => ({}));
    const c = await fetch('https://api.line.me/v2/bot/message/quota/consumption', { headers: { Authorization: 'Bearer ' + token } });
    const cj = await c.json().catch(() => ({}));
    out.โควตาข้อความ = { ประเภท: qj.type, จำนวน: qj.value ?? null, ใช้ไปแล้ว: cj.totalUsage ?? null };
  } catch (e) { /* ไม่สำคัญพอจะทำให้ตก */ }

  try {
    const w = await fetch('https://api.line.me/v2/bot/channel/webhook/endpoint', { headers: { Authorization: 'Bearer ' + token } });
    const wj = await w.json().catch(() => ({}));
    out.webhook = w.ok ? { ปลายทาง: wj.endpoint || '(ยังไม่ตั้ง)', เปิดใช้: wj.active } : '(ยังไม่ตั้ง)';
  } catch (e) { /* เช่นกัน */ }


  // ── ตั้ง webhook ให้ชี้มาที่บอทของเราเอง — เปิดด้วย /api/line-check?setup=webhook ──
  //    ปลอดภัยเพราะ "ปลายทางถูกฮาร์ดโค้ดเป็นโดเมนเราเท่านั้น" — สั่งให้ชี้ที่อื่นไม่ได้
  //    รันซ้ำได้ไม่มีผลข้างเคียง · ไม่แตะอะไรถ้าตั้งถูกอยู่แล้ว
  if (req.query && req.query.setup === "webhook") {
    const ENDPOINT = "https://under360-system.vercel.app/api/line-webhook";
    try {
      const cur = out.webhook && out.webhook.ปลายทาง;
      if (cur === ENDPOINT) { out.ตั้งwebhook = "ตั้งไว้ถูกอยู่แล้ว ไม่ต้องทำอะไร"; }
      else {
        const p1 = await fetch("https://api.line.me/v2/bot/channel/webhook/endpoint", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ endpoint: ENDPOINT }),
        });
        const pj = await p1.json().catch(() => ({}));
        out.ตั้งwebhook = p1.ok ? ("ตั้งเป็น " + ENDPOINT + " แล้ว") : ("ไม่สำเร็จ HTTP " + p1.status + " " + (pj.message || ""));
      }
      const t = await fetch("https://api.line.me/v2/bot/channel/webhook/test", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ endpoint: ENDPOINT }),
      });
      const tj = await t.json().catch(() => ({}));
      out.ทดสอบwebhook = t.ok ? ("LINE ยิงทดสอบแล้วได้ HTTP " + tj.statusCode + " · " + (tj.detail || "")) : ("ทดสอบไม่ผ่าน HTTP " + t.status + " " + (tj.message || ""));
    } catch (e) { out.ตั้งwebhook = "พัง: " + e.message; }
  }

  out.ok = true;
  out.สรุป = '✅ คุยกับ LINE ได้จริง — ส่งข้อความหาลูกค้า/กลุ่มครัวได้แล้ว';
  return res.status(200).json(out);
};

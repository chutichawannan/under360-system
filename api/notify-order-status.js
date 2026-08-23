/* Under360 — แจ้งลูกค้าเมื่อ "สถานะออร์เดอร์เปลี่ยน" (นัทสั่ง 16 ส.ค. 2026)
 *
 * นัทอธิบายเอง:
 *   "ใบ confirm order มีหลายสถานะย่อย เช่น สถานะที่ 1 คือให้แนบสลิปโอนเงิน
 *    สถานะอื่นๆ เช่น พอครัวกดส่งของแล้ว order ตรงนั้นจะถูกส่ง message อีกรอบนึง
 *    ว่า Lalamove กำลังนำสินค้าไปส่ง"
 *
 * ต่างจาก notify-order-confirm.js ยังไง:
 *   · notify-order-confirm = ส่ง "ตอนเปิดออร์เดอร์" ครั้งเดียว (ใบเสร็จ + ใบยืนยัน)
 *   · ไฟล์นี้           = ส่ง "ตอนสถานะขยับ" หลังจากนั้น — ส่งได้หลายครั้งต่อ 1 ใบ
 *
 * 🔴 กฎเหล็กที่นัทเน้น: **ห้ามส่งข้อความซ้ำเรื่องเดิม**
 *   "ถ้าลูกค้ากดอัพสลิปแล้ว อย่าส่งไปเชียว มันเป็นการทำงานซ้ำซ้อน
 *    ลูกค้าจะเห็นว่าฉันอัพสลิปไปแล้วจะมีปัญหา"
 *   → ทุกข้อความจำไว้ว่าส่งไปแล้ว (kitchen_data key 'order_status_notified')
 *     คีย์ = "<เลขใบ>:<ชนิดข้อความ>" → ส่งซ้ำไม่ได้แม้สถานะจะเด้งกลับไปกลับมา
 *
 * เส้นทางสถานะจริงของครัว (จาก kitchen_queue.html):
 *   confirmed → ready (จัดกล่องเสร็จ) → delivered (ส่งแล้ว)
 *
 * ข้อความที่ส่ง:
 *   slip_ok   เมื่อ payment_status → paid / pending_review   "ได้รับสลิปแล้ว"
 *   packed    เมื่อ status → ready                            "อาหารพร้อมแล้ว"
 *   shipping  ⛔ ปิดไว้ 21 ส.ค. — delivered = ส่งถึงแล้ว ไม่ใช่กำลังไป (รอมีสถานะ "ออกจากร้าน" ก่อน)
 *
 * เรียกใช้:
 *   /api/notify-order-status?dry=1              ดูว่าจะส่งอะไร ไม่ส่งจริง
 *   /api/notify-order-status?seed=1             🔴 กดก่อนเปิดใช้ครั้งแรกเสมอ — ดูรายละเอียดด้านล่าง
 *   /api/notify-order-status                    ส่งจริง
 *   /api/notify-order-status?order=U-0817-002   เจาะจงใบเดียว (ใช้ตอนเทส)
 *   /api/notify-order-status?max=5              จำกัดจำนวนข้อความต่อรอบ (default 20)
 *
 * 🔴 กับดักตอนเปิดใช้ครั้งแรก (U เจอ 23 ส.ค. 2026 ตอนรับงานจาก CC — ยังไม่เคยเปิดจริงสักครั้ง)
 *   สมุด "ส่งไปแล้ว" เริ่มต้นว่างเปล่า + มองย้อนหลัง 48 ชม.
 *   → รันจริงครั้งแรก = ยิงย้อนหลังใส่ทุกใบใน 2 วันรวดเดียว
 *     รวมใบที่ลูกค้าได้รับอาหารไปแล้ว (จะได้ข้อความ "อาหารพร้อมแล้ว" ทีหลัง = ระบบดูโง่ และกวนลูกค้าจริง)
 *   ทางที่ถูก: เรียก ?seed=1 หนึ่งครั้ง (จดว่า "ของเก่าถือว่าส่งแล้ว" โดยไม่ส่งอะไรเลย)
 *     แล้วค่อยเปิด cron → ตั้งแต่นั้นจะได้เฉพาะใบที่สถานะขยับ "หลังจาก" เปิดระบบ
 *   และมีเพดานต่อรอบ (max) กันกรณีสมุดหายแล้วยิงซ้ำทั้งกอง
 *
 * ⚠️ ยังส่งไม่ได้จนกว่า LIFF กับแชนแนลข้อความจะอยู่ provider เดียวกัน
 *    (userId คนละ provider = LINE ไม่รู้จักลูกค้า — ดู docs/LINE_PROVIDER.md)
 */
const getLineToken = require('./_line_token.js');
// 21 ส.ค. — เลิกใช้ _reach_uid.js (สะพานเดา uid ที่ปิดถาวรหลังเหตุ 20 ส.ค. ส่งไปหาลูกค้าคนอื่น)
//   ส่งเฉพาะ uid ที่อยู่ในใบออเดอร์นั้นเท่านั้น ⛔ ห้ามเดาว่าไอดีไหนเป็นของใคร
async function pushToOrderUid(token, order, messages) {
  try {
    const r = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ to: order.line_uid, messages }),
    });
    if (r.ok) return { ok: true, via: 'uid ในใบออเดอร์' };
    return { ok: false, error: 'HTTP ' + r.status + ' ' + (await r.text()).slice(0, 120), via: 'uid ในใบออเดอร์' };
  } catch (e) { return { ok: false, error: String(e && e.message), via: 'uid ในใบออเดอร์' }; }
}

const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H   = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const NOTIFY_KEY = 'order_status_notified';
// 21 ส.ค. — ไฟล์นี้ตกสำรวจตอนย้ายบ้าน LIFF (พี่เก่งจับได้ · PM verify กับ origin/main แล้ว)
const LIFF_ID    = '2011148232-oul66cEs';
const LIFF_URL   = `https://liff.line.me/${LIFF_ID}?lid=${LIFF_ID}`;
const SHOP_TEL   = '0641736519';
const LOOKBACK_H = 48;   // มองย้อนหลังกี่ชั่วโมง (กันใบตกหล่นตอนระบบล่ม)

const sb = async (path, opt) => (await fetch(SB + '/' + path, { headers: H, ...opt })).json();
const baht = (n) => '฿' + Number(n || 0).toLocaleString('th-TH');

// ── ข้อความแต่ละชนิด — เขียนแบบ "คนบอกข่าว" ไม่ใช่ระบบแจ้งเตือน ──
function bubble(o, kind) {
  const T = {
    slip_ok: {
      head: 'ได้รับสลิปแล้ว',
      body: 'ทางร้านได้รับหลักฐานการโอนของคุณแล้ว กำลังตรวจสอบและเตรียมอาหารให้ค่ะ',
      color: '#3C7A5C',
    },
    packed: {
      head: 'อาหารพร้อมแล้ว',
      body: 'ครัวจัดกล่องของคุณเสร็จเรียบร้อย กำลังรอคนส่งมารับค่ะ',
      color: '#3C7A5C',
    },
    shipping: {
      head: 'กำลังนำไปส่ง',
      body: 'อาหารออกจากร้านแล้ว คนส่งกำลังเดินทางไปหาคุณค่ะ',
      color: '#B45309',
    },
  }[kind];

  return {
    type: 'flex',
    altText: `${T.head} · ออร์เดอร์ #${o.order_number}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '16px',
        contents: [
          { type: 'text', text: 'อัปเดตออร์เดอร์', size: 'xs', color: T.color, weight: 'bold' },
          { type: 'text', text: T.head, size: 'xl', weight: 'bold', color: '#1A1A1A', wrap: true },
          { type: 'text', text: T.body, size: 'sm', color: '#6B7280', wrap: true },
          { type: 'separator', margin: 'lg' },
          { type: 'box', layout: 'vertical', spacing: 'xs', margin: 'lg', contents: [
            { type: 'box', layout: 'baseline', contents: [
              { type: 'text', text: 'เลขออร์เดอร์', size: 'sm', color: '#6B7280', flex: 4 },
              { type: 'text', text: String(o.order_number), size: 'sm', color: '#1A1A1A', weight: 'bold', flex: 6, align: 'end' },
            ] },
            { type: 'box', layout: 'baseline', contents: [
              { type: 'text', text: 'วันที่ส่ง', size: 'sm', color: '#6B7280', flex: 4 },
              { type: 'text', text: String(o.delivery_date || '-'), size: 'sm', color: '#1A1A1A', flex: 6, align: 'end' },
            ] },
            { type: 'box', layout: 'baseline', contents: [
              { type: 'text', text: 'ยอดชำระ', size: 'sm', color: '#6B7280', flex: 4 },
              { type: 'text', text: baht(o.total), size: 'sm', color: '#1A1A1A', weight: 'bold', flex: 6, align: 'end' },
            ] },
          ] },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px',
        contents: [
          { type: 'button', style: 'primary', color: '#3C7A5C', height: 'sm',
            action: { type: 'uri', label: 'ดูออร์เดอร์ของฉัน', uri: LIFF_URL } },
          { type: 'button', style: 'link', height: 'sm',
            action: { type: 'uri', label: 'โทรหาร้าน', uri: 'tel:' + SHOP_TEL } },
        ],
      },
    },
  };
}

// ชนิดข้อความที่ "ควรส่ง" สำหรับใบนี้ ณ ตอนนี้
function kindsFor(o) {
  const out = [];
  if (o.payment_status === 'paid' || o.payment_status === 'pending_review') out.push('slip_ok');
  if (o.status === 'ready') out.push('packed');
  // 🛑 ปิดไว้ 21 ส.ค. — `delivered` ในระบบเรา = **ส่งถึงแล้ว** ไม่ใช่ "กำลังไป"
  //    ถ้าเปิด ลูกค้าจะได้ข้อความ "คนส่งกำลังเดินทางไปหาคุณ" หลังจากรับของไปแล้ว = ระบบดูโง่
  //    รากปัญหา: ไม่มีสถานะ "ออกจากร้านแล้ว" เลย มีแค่ confirmed → ready → delivered
  //    เปิดคืนได้เมื่อมีสถานะนั้นจริง (พี่เก่งเป็นคนชี้ · PM ยืนยัน)
  // if (o.status === 'delivered') out.push('shipping');
  return out;
}

module.exports = async (req, res) => {
  const q    = (req && req.query) || {};
  const dry  = q.dry === '1' || q.dry === 'true';
  const seed = q.seed === '1' || q.seed === 'true';   // จดว่าส่งแล้ว โดยไม่ส่งจริง (ใช้ครั้งเดียวก่อนเปิด cron)
  const one  = q.order;
  const MAX  = Math.max(1, Math.min(200, parseInt(q.max, 10) || 20));   // เพดานข้อความต่อรอบ

  try {
    // ── ใบที่ต้องดู ──
    const since = new Date(Date.now() - LOOKBACK_H * 3600 * 1000).toISOString();
    const filter = one
      ? `order_number=eq.${encodeURIComponent(one)}`
      : `updated_at=gte.${since}&status=neq.cancelled&status=neq.pending`;
    const orders = await sb(`orders?select=order_number,line_uid,customer_name,delivery_date,total,status,payment_status,updated_at&${filter}&order=updated_at.desc&limit=200`);
    if (!Array.isArray(orders)) return res.status(500).json({ ok: false, orders });

    // ── รายชื่อที่ส่งไปแล้ว ──
    const row  = await sb(`kitchen_data?select=data&key=eq.${NOTIFY_KEY}`);
    const sent = new Set((Array.isArray(row) && row[0] && Array.isArray(row[0].data)) ? row[0].data : []);
    const before = sent.size;

    const token = (dry || seed) ? null : await getLineToken();
    if (!dry && !seed && !token) {
      return res.status(200).json({ ok: false, why: 'ยังออก token ไม่ได้ — ดู /api/line-check' });
    }

    const report = [];
    let pushed = 0, capped = 0;
    for (const o of orders) {
      if (!o.line_uid) { report.push({ order: o.order_number, skip: 'ไม่มี LINE uid' }); continue; }
      for (const kind of kindsFor(o)) {
        const mark = `${o.order_number}:${kind}`;
        if (sent.has(mark)) continue;                 // ← กันส่งซ้ำ กฎเหล็กของนัท

        if (dry) { report.push({ order: o.order_number, kind, to: String(o.line_uid).slice(0, 10) + '…' }); sent.add(mark); continue; }
        // ✏️ seed = จดว่า "ถือว่าส่งแล้ว" โดยไม่ส่ง — ใช้ครั้งเดียวก่อนเปิด cron กันยิงย้อนหลังใส่ลูกค้า
        if (seed) { report.push({ order: o.order_number, kind, "จดว่าส่งแล้ว(ไม่ส่งจริง)": true }); sent.add(mark); continue; }
        // 🚧 เพดานต่อรอบ — ของที่เกินไม่ถูกจดว่าส่งแล้ว รอบหน้าได้ต่อ (ไม่หาย แค่ทยอย)
        if (pushed >= MAX) { capped++; continue; }
        pushed++;

        const rr = await pushToOrderUid(token, o, [bubble(o, kind)]);
        if (rr.ok) { sent.add(mark); report.push({ order: o.order_number, kind, ok: true, "ส่งผ่าน": rr.via }); }
        else { report.push({ order: o.order_number, kind, error: rr.error, "ลองแล้ว": rr.via }); }
      }
    }

    // ── จำว่าส่งอะไรไปแล้ว (เก็บ 3000 รายการล่าสุดพอ) ──
    if (!dry && sent.size !== before) {
      const keep = [...sent].slice(-3000);
      await fetch(SB + '/kitchen_data', {
        method: 'POST',
        headers: { ...H, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ key: NOTIFY_KEY, data: keep }),
      });
    }

    return res.status(200).json({
      mode: dry ? 'ทดสอบ (ไม่ส่งจริง)' : (seed ? 'จดว่าส่งแล้ว (ไม่ส่งจริง)' : 'ส่งจริง'),
      ใบที่ดู: orders.length,
      ส่งได้: report.filter(r => r.ok).length,
      เกินเพดานรอบนี้: capped,
      เพดานต่อรอบ: MAX,
      รายละเอียด: report,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message) });
  }
};

// 🛵 Lalamove v3 — จองรถจริง / ดูสถานะ / ยกเลิก
// ─────────────────────────────────────────────────────────────────────────
// ⚠️⚠️ endpoint นี้ "ใช้เงินจริง" ต่างจาก api/lalamove-quote.js ที่ขอราคาอย่างเดียว
//
// 🔒 สวิตช์ความปลอดภัย 2 ชั้น — ต้องผ่านทั้งคู่ถึงจะจองจริง (นัทสั่ง 16 ส.ค. 2569:
//    "ทำไว้เลย แต่ยังไม่ทำจริงจนกว่าจะเทสสำเร็จนะ")
//    ชั้น 1  env  LALAMOVE_BOOKING_ENABLED = "1"   ← ยังไม่ตั้ง = ซ้อมอย่างเดียวเสมอ (ค่าเริ่มต้น)
//    ชั้น 2  body confirm = "BOOK"                  ← กันยิงพลาด/กดพลาด
//    ไม่ครบทั้งคู่ → คืน dryRun:true พร้อมสรุปว่า "ถ้าจองจริงจะเกิดอะไร" แต่ไม่ยิงไปหา Lalamove
//
// 🚦 ด่านตรวจก่อนจอง (ทำไว้เพราะ PM ชี้ว่าเรื่องนี้คือเงื่อนไขเดียวกับบั๊ก "ปลายทางไม่มีที่อยู่"):
//    · ทุกจุดต้องมีชื่อ + เบอร์โทรผู้รับ  → ไม่มี = คนขับโทรหาไม่ได้
//    · หมุดต้องเชื่อถือได้ (ลูกค้าปักเอง หรือเสิร์ชแล้วตรงถึงบ้านเลขที่)
//      หมุดที่ "เดาให้ได้แค่ระดับซอย" ห้ามจอง เว้นแต่คนกดยืนยันว่าตรวจแล้ว (pinOverride)
//      → เดาหมุดผิดแล้วจองรถจริง = เสียเงินจริง + ของไปผิดที่
//    · quotation หมดอายุใน 5 นาที → ต้องขอราคาแล้วจองต่อทันที
//
// ref: https://developers.lalamove.com/  (HMAC-SHA256 · POST /v3/orders · GET|DELETE /v3/orders/{id})
const crypto = require('crypto');

const HOST = (process.env.LALAMOVE_ENV === 'sandbox')
  ? 'https://rest.sandbox.lalamove.com'
  : 'https://rest.lalamove.com';

// ผู้ส่ง = ครัว (คนขับโทรหาเบอร์นี้ตอนมารับของ)
const SENDER = {
  name:  process.env.LALAMOVE_SENDER_NAME  || 'Under360 ครัว',
  phone: process.env.LALAMOVE_SENDER_PHONE || '0641736519'   // เบอร์ร้านใน GBP
};

// หมุดที่ยอมให้จองได้โดยไม่ต้องยืนยันเพิ่ม
const PIN_OK = ['customer', 'ROOFTOP'];

function requireAuth(req, res) {
  const need = process.env.CRON_SECRET;
  if (!need) return true;
  const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (got === need) return true;
  res.status(401).json({ ok: false, error: 'unauthorized' });
  return false;
}

// เบอร์ไทย → E.164 (+66…) ตามที่ Lalamove ต้องการ
function e164(p) {
  const d = String(p || '').replace(/[^\d+]/g, '');
  if (!d) return null;
  if (d.startsWith('+')) return d;
  if (d.startsWith('66')) return '+' + d;
  if (d.startsWith('0')) return '+66' + d.slice(1);
  return '+66' + d;
}

function sign(secret, time, method, path, body) {
  const raw = `${time}\r\n${method}\r\n${path}\r\n\r\n${body || ''}`;
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

async function call(method, path, bodyObj) {
  const KEY = process.env.LALAMOVE_API_KEY, SECRET = process.env.LALAMOVE_API_SECRET;
  const MARKET = process.env.LALAMOVE_MARKET || 'TH';
  const body = bodyObj ? JSON.stringify(bodyObj) : '';
  const time = Date.now().toString();
  const r = await fetch(HOST + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `hmac ${KEY}:${time}:${sign(SECRET, time, method, path, body)}`,
      'Market': MARKET
    },
    body: body || undefined
  });
  const json = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, json };
}

module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  if (!process.env.LALAMOVE_API_KEY || !process.env.LALAMOVE_API_SECRET) {
    return res.status(500).json({ ok: false, error: 'ยังไม่ได้ตั้ง LALAMOVE_API_KEY / LALAMOVE_API_SECRET ใน Vercel env' });
  }

  const q = req.query || {}, b = req.body || {};
  const action = String(q.action || b.action || 'book').toLowerCase();

  // ── ดูสถานะงาน / ยกเลิกงาน — ไม่ใช่การใช้เงินเพิ่ม เลยไม่ติดสวิตช์ ──
  if (action === 'status' || action === 'cancel') {
    const id = q.orderId || b.orderId;
    if (!id) return res.status(400).json({ ok: false, error: 'ต้องมี orderId' });
    const path = '/v3/orders/' + encodeURIComponent(id);
    const r = await call(action === 'cancel' ? 'DELETE' : 'GET', path, null);
    if (!r.ok) return res.status(r.status).json({ ok: false, error: 'lalamove_error', detail: r.json });
    return res.status(200).json({ ok: true, action, orderId: id, data: r.json && r.json.data ? r.json.data : r.json });
  }

  // ── ถามว่าตอนนี้เป็นโหมดซ้อมหรือจองจริง ───────────────────────────────
  // 🔴 ต้องมี endpoint ตรงๆ ห้ามให้หน้าจอเดาเอง — เทส 16 ส.ค. เจอของจริง:
  //    หน้า dispatch เดาโหมดด้วยการยิง body เปล่าแล้วดูข้อความที่ตอบกลับ
  //    แต่ API ตอบ "ต้องมี quotationId" ตั้งแต่ด่านแรก ยังไม่ทันถึงชั้นสวิตช์
  //    → หน้าจอขึ้นป้าย "⚠️ โหมดจองจริง — ใช้เงินจริง" ทั้งที่สวิตช์ปิดสนิท
  //    ป้ายบอกโหมดผิด = อันตรายกว่าไม่มีป้าย (คนอ่านแล้วตัดสินใจผิดทั้งสองทาง)
  if (action === 'mode') {
    return res.status(200).json({
      ok: true,
      bookingEnabled: process.env.LALAMOVE_BOOKING_ENABLED === '1',
      env: process.env.LALAMOVE_ENV === 'sandbox' ? 'sandbox' : 'production'
    });
  }

  // ── จองรถ ────────────────────────────────────────────────────────────
  const quotationId = b.quotationId;
  const stops = Array.isArray(b.stops) ? b.stops : [];   // [{stopId, name, phone, pinSource, remarks, orderNo}]
  const pinOverride = b.pinOverride === true;

  if (!quotationId) return res.status(400).json({ ok: false, error: 'ต้องมี quotationId จากการขอราคา (อายุ 5 นาที ขอแล้วจองต่อทันที)' });
  if (stops.length < 2) return res.status(400).json({ ok: false, error: 'stops ต้องมีอย่างน้อย 2 จุด (ครัว + ปลายทาง) ตาม stopId ที่ได้จาก quotation' });

  // ── 🚦 ด่านตรวจ — ไม่ผ่าน = ไม่จอง และบอกว่าต้องแก้อะไร ──
  const blockers = [];
  stops.slice(1).forEach(function (s, i) {
    const who = s.orderNo || s.name || ('จุดที่ ' + (i + 1));
    if (!String(s.name || '').trim())  blockers.push(`${who}: ไม่มีชื่อผู้รับ`);
    if (!e164(s.phone))                blockers.push(`${who}: ไม่มีเบอร์โทรผู้รับ — คนขับโทรหาไม่ได้`);
    if (!pinOverride && s.pinSource && PIN_OK.indexOf(s.pinSource) < 0) {
      blockers.push(`${who}: หมุดเชื่อไม่ได้ (${s.pinSource}) — ระบบเดาให้ได้แค่ระดับซอย/ถนน ต้องตรวจกับลูกค้าก่อน`);
    }
  });
  if (blockers.length) {
    return res.status(400).json({ ok: false, error: 'ยังจองไม่ได้', blockers,
      hint: 'แก้ตามรายการข้างบน หรือถ้าตรวจกับลูกค้าแล้วจริงๆ ส่ง pinOverride:true มาด้วย' });
  }

  const payload = {
    data: {
      quotationId,
      sender:     { stopId: stops[0].stopId, name: SENDER.name, phone: e164(SENDER.phone) },
      recipients: stops.slice(1).map(function (s) {
        const r = { stopId: s.stopId, name: String(s.name).trim(), phone: e164(s.phone) };
        if (s.remarks) r.remarks = String(s.remarks).slice(0, 200);
        return r;
      }),
      isPODEnabled: true,          // ให้คนขับกดยืนยันตอนส่งถึง = มีหลักฐานส่งของ
      metadata: { source: 'under360-keng', orders: stops.slice(1).map(function (s) { return s.orderNo || ''; }).join(',') }
    }
  };

  // ── 🔒 สวิตช์ 2 ชั้น ──
  const enabled = process.env.LALAMOVE_BOOKING_ENABLED === '1';
  const confirmed = b.confirm === 'BOOK';
  if (!enabled || !confirmed) {
    return res.status(200).json({
      ok: true, dryRun: true, wouldBook: true,
      reason: !enabled ? 'ยังไม่ได้เปิดสวิตช์ LALAMOVE_BOOKING_ENABLED=1 ใน Vercel (ตั้งใจให้ปิดไว้)'
                       : 'ไม่ได้ส่ง confirm:"BOOK" มาด้วย',
      ตรวจแล้วผ่านหมด: true,
      สรุปที่จะจอง: {
        จุดส่ง: payload.data.recipients.length,
        ผู้รับ: payload.data.recipients.map(function (r) { return r.name + ' ' + r.phone; }),
        quotationId
      },
      note: 'ยังไม่มีการยิงไปหา Lalamove และไม่มีการใช้เงิน'
    });
  }

  const r = await call('POST', '/v3/orders', payload);
  if (!r.ok) {
    // จองไม่สำเร็จต้องบอกให้ชัดว่าเพราะอะไร ไม่ใช่เงียบ — quotation หมดอายุคือเคสที่เจอบ่อยสุด
    const detail = r.json || {};
    const msg = (detail.errors && detail.errors[0] && detail.errors[0].id) || detail.message || ('HTTP ' + r.status);
    return res.status(r.status).json({
      ok: false, error: 'จองไม่สำเร็จ', code: msg, detail,
      hint: /QUOTATION|EXPIRED/i.test(String(msg)) ? 'ใบเสนอราคาหมดอายุ (5 นาที) — ขอราคาใหม่แล้วจองต่อทันที' : undefined
    });
  }
  const d = (r.json && r.json.data) || {};
  return res.status(200).json({
    ok: true, dryRun: false,
    orderId: d.orderId || null,
    shareLink: d.shareLink || null,      // ลิงก์ติดตามคนขับ — ส่งให้ลูกค้าได้
    status: d.status || null,
    price: d.priceBreakdown ? Number(d.priceBreakdown.total) : null,
    raw: r.json
  });
};

// ════════════════════════════════════════════════════════════════════
//  ตัดบัตรเครดิต/เดบิต ผ่าน Omise (นัทเคาะ 7 ก.ย. 2569)
//
//  นัทเคาะไว้ 2 ข้อ:
//    · ค่าธรรมเนียม ~2.57% "ร้านออกให้" → ลูกค้าจ่ายเท่าราคาที่เห็น ไม่บวกเพิ่ม
//    · เปิดให้รูดเฉพาะออเดอร์ก้อนใหญ่ (มีลแพลนที่ไม่ใช่ชุดทดลอง · คอร์สเจ · เซ็ต)
//      → เงื่อนไขว่าใบไหนรูดได้ อยู่ที่ cardEligible() ในหน้าลูกค้า
//
//  🔒 เลขบัตรไม่เคยผ่านเซิร์ฟเวอร์เรา — หน้าเว็บส่งเลขบัตรตรงไปที่ Omise
//     แล้วได้ "โทเคน" มา ที่นี่รับแค่โทเคน ไม่มีทางเห็นเลขบัตรเลย
//
//  🔴 ยอดเงินอ่านจากฐานข้อมูลเสมอ ไม่เชื่อตัวเลขที่หน้าเว็บส่งมา
//     ไม่งั้นคนแก้ค่าในเบราว์เซอร์จ่าย 1 บาทซื้อคอร์ส 4,190 ได้
//
//  ถอยยังไงถ้าพัง: ทางโอนสลิปเดิมไม่ถูกแตะเลย ปิดปุ่มบัตรก็กลับไปโอนได้ทันที
// ════════════════════════════════════════════════════════════════════

const SB   = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

const sbKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || ANON;
const sbH   = () => ({ apikey: sbKey(), Authorization: 'Bearer ' + sbKey(), 'Content-Type': 'application/json' });

/* อ่าน body ให้ได้ทั้งกรณีที่ Vercel แกะ JSON ให้แล้วและกรณีที่ยังเป็นสตรีมดิบ */
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch (e) { return {}; }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const done = (code, obj) => { res.statusCode = code; return res.end(JSON.stringify(obj)); };

  const pub = process.env.OMISE_PUBLIC_KEY || '';
  const sec = process.env.OMISE_SECRET_KEY || '';

  /* โหมดส่อง — ให้หน้าลูกค้าถามได้ว่า "เปิดจ่ายบัตรได้หรือยัง" โดยไม่ต้องเห็นกุญแจ
     คืนแค่ public key (ตัวนี้ฝังในหน้าเว็บได้อยู่แล้ว ไม่ใช่ความลับ) + บอกว่าเป็นชุดทดสอบหรือของจริง */
  if (req.method === 'GET') {
    return done(200, {
      ok: !!(pub && sec),
      public_key: pub || null,
      mode: pub.startsWith('pkey_test') ? 'ทดสอบ' : pub.startsWith('pkey_') ? 'ของจริง' : 'ยังไม่ได้ใส่กุญแจ',
      /* บอกให้รู้ว่าขาดตัวไหน จะได้ไม่ต้องเดาว่าทำไมปุ่มบัตรไม่ขึ้น */
      missing: [!pub && 'OMISE_PUBLIC_KEY', !sec && 'OMISE_SECRET_KEY'].filter(Boolean),
    });
  }
  if (req.method !== 'POST') return done(405, { ok: false, error: 'ต้องเป็น POST' });
  if (!sec) return done(503, { ok: false, error: 'ยังไม่ได้ตั้งกุญแจ Omise' });

  const body = await readBody(req);
  const orderNumber = String(body.order_number || '').trim();
  const token = String(body.token || '').trim();
  if (!/^U-[0-9]{4}-[0-9]{3}$/.test(orderNumber)) return done(400, { ok: false, error: 'เลขออเดอร์ไม่ถูกต้อง' });
  if (!/^tokn_/.test(token)) return done(400, { ok: false, error: 'โทเคนบัตรไม่ถูกต้อง' });

  // ── 1. อ่านใบจริงจากฐานข้อมูล — ยอดเงินต้องมาจากที่นี่เท่านั้น
  let order;
  try {
    const r = await fetch(SB + '/orders?select=id,order_number,total,payment_status,notes,customer_name'
      + '&order_number=eq.' + encodeURIComponent(orderNumber) + '&limit=1', { headers: sbH() });
    const j = await r.json();
    order = Array.isArray(j) ? j[0] : null;
  } catch (e) { return done(502, { ok: false, error: 'อ่านออเดอร์ไม่ได้' }); }
  if (!order) return done(404, { ok: false, error: 'ไม่พบออเดอร์นี้' });

  /* กันตัดซ้ำ — ลูกค้ากดสองที หรือเน็ตช้าแล้วยิงมาสองรอบ ต้องไม่เสียเงินสองต่อ
     ตอบว่าสำเร็จ เพราะสำหรับลูกค้า "จ่ายไปแล้ว" คือผลลัพธ์เดียวกัน */
  if (order.payment_status === 'paid') return done(200, { ok: true, already: true });

  const amount = Math.round(Number(order.total || 0) * 100);   // Omise คิดเป็นสตางค์
  if (!(amount >= 2000)) return done(400, { ok: false, error: 'ยอดน้อยเกินกว่าจะตัดบัตรได้' });

  // ── 2. ตัดบัตร
  let charge;
  try {
    const form = new URLSearchParams({
      amount: String(amount), currency: 'thb', card: token,
      description: 'Under360 ' + orderNumber,
      /* กันตัดซ้ำอีกชั้นที่ฝั่ง Omise เอง — ยิงซ้ำด้วยคีย์เดิมได้รายการเดิม ไม่เกิดรายการใหม่ */
      'metadata[order_number]': orderNumber,
    });
    const r = await fetch('https://api.omise.co/charges', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(sec + ':').toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': 'u360-' + orderNumber,
      },
      body: form.toString(),
    });
    charge = await r.json();
  } catch (e) {
    return done(502, { ok: false, error: 'ติดต่อผู้ให้บริการชำระเงินไม่ได้' });
  }

  const paid = charge && (charge.paid === true || charge.status === 'successful');
  if (!paid) {
    /* บอกเหตุผลเท่าที่ Omise บอกมา แต่ไม่โยนโครงสร้างดิบให้ลูกค้าเห็น */
    return done(402, {
      ok: false,
      error: (charge && (charge.failure_message || charge.message)) || 'ธนาคารปฏิเสธรายการนี้',
      code: (charge && (charge.failure_code || charge.code)) || null,
    });
  }

  // ── 3. บันทึกว่าจ่ายแล้ว
  /* charge id เก็บต่อท้าย notes เพราะยังไม่มีคอลัมน์สำหรับมัน — ไม่ต้องรอรัน SQL
     แอดมินเปิดใบดูแล้วเอาเลขนี้ไปหาใน dashboard Omise ได้ตรง ๆ ตอนต้องคืนเงิน */
  const note = (order.notes ? order.notes + ' · ' : '') + 'บัตร ' + charge.id;
  try {
    await fetch(SB + '/orders?id=eq.' + order.id, {
      method: 'PATCH', headers: Object.assign(sbH(), { Prefer: 'return=minimal' }),
      body: JSON.stringify({ payment_status: 'paid', payment_account: 'omise_card', notes: note }),
    });
  } catch (e) {
    /* 🔴 เงินตัดไปแล้วแต่จดไม่ลง — ห้ามบอกลูกค้าว่าล้มเหลว (เขาจะจ่ายซ้ำ)
       บอกว่าสำเร็จ แล้วติดธงไว้ให้คนตามเก็บ */
    console.error('ตัดบัตรสำเร็จแต่บันทึกไม่ลง', orderNumber, charge.id, e);
    return done(200, { ok: true, charge_id: charge.id, warn: 'ตัดเงินแล้วแต่บันทึกสถานะไม่สำเร็จ' });
  }

  return done(200, { ok: true, charge_id: charge.id });
};

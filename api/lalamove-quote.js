// Lalamove v3 quotation proxy — คำนวณค่าส่งจริงจาก Lalamove (เก็บ secret ฝั่ง server ห้ามอยู่ browser)
// ─────────────────────────────────────────────────────────────────────────
// ✅ สถานะ: ใช้งานจริงแล้ว (คีย์อยู่ใน Vercel env · เทสได้ราคาจริง 5 ส.ค. 2026)
//   - จุดเดียว: ?lat=&lng=&addr=
//   - หลายจุดต่อคัน (multi-stop): body { drops:[{lat,lng,addr}] } — ใช้เทียบว่าจัดรอบแบบไหนถูกสุด
//   ⚠️ endpoint นี้ "ขอราคา" อย่างเดียว ยังไม่จองรถ = ไม่มีการใช้เงิน
// ref: https://developers.lalamove.com/  (HMAC-SHA256 · POST /v3/quotations · header Market=TH)
// ─────────────────────────────────────────────────────────────────────────
const crypto = require('crypto');

// default = production (เราใช้คีย์ pk_prod/sk_prod) · ตั้ง LALAMOVE_ENV=sandbox ถ้าจะเทส sandbox
const HOST = (process.env.LALAMOVE_ENV === 'sandbox')
  ? 'https://rest.sandbox.lalamove.com'
  : 'https://rest.lalamove.com';
const KITCHEN = { lat: '13.7179969', lng: '100.5010971', address: 'Under360 ครัว' };


// 🔒 กันคนนอกยิง endpoint นี้ (เดิมใครรู้ URL ก็เรียกได้ = สั่ง push LINE / เผาโควตาได้ไม่จำกัด) — เพิ่ม 3 ส.ค. 2026
// Vercel Cron ส่ง Authorization: Bearer <CRON_SECRET> มาให้อัตโนมัติเมื่อตั้ง env CRON_SECRET ไว้
function requireAuth(req, res) {
  const need = process.env.CRON_SECRET;
  if (!need) return true;                     // ยังไม่ได้ตั้ง env = ทำงานเหมือนเดิม (ไม่ล็อกตัวเองออก)
  const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (got === need) return true;
  res.status(401).json({ ok: false, error: 'unauthorized' });
  return false;
}
module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  const KEY = process.env.LALAMOVE_API_KEY;
  const SECRET = process.env.LALAMOVE_API_SECRET;
  const MARKET = process.env.LALAMOVE_MARKET || 'TH';
  if (!KEY || !SECRET) {
    return res.status(500).json({ error: 'ยังไม่ได้ตั้ง LALAMOVE_API_KEY / LALAMOVE_API_SECRET ใน Vercel env' });
  }

  // 🔎 ?info=cities → ถามสเปคจริงจาก Lalamove ว่าเมืองนี้มีรถ/บริการอะไรบ้าง (ห้ามเดาชื่อ serviceType เอง)
  if ((req.query && req.query.info) === 'cities') {
    const p = '/v3/cities';
    const t = Date.now().toString();
    const sig = crypto.createHmac('sha256', SECRET).update(`${t}\r\nGET\r\n${p}\r\n\r\n`).digest('hex');
    try {
      const r = await fetch(HOST + p, { headers: { 'Authorization': `hmac ${KEY}:${t}:${sig}`, 'Market': MARKET } });
      return res.status(r.status).json(await r.json().catch(() => ({})));
    } catch (e) { return res.status(500).json({ error: String(e && e.message || e) }); }
  }

  // ปลายทาง — รับได้ 2 แบบ
  //   1) จุดเดียว (เดิม): ?lat=&lng=&addr=
  //   2) หลายจุด (multi-stop): body { drops:[{lat,lng,addr},...] } หรือ ?drops=<json>
  //      ใช้เทียบว่า "คันเดียววิ่งหลายจุด" ถูกกว่า "แยกคันต่อจุด" เท่าไหร่ (นัทสั่ง 5 ส.ค.)
  const q = req.query || {};
  const b = req.body || {};
  const serviceType = q.service || b.service || 'MOTORCYCLE'; // MOTORCYCLE / SEDAN / VAN ...

  let drops = b.drops || null;
  if (!drops && q.drops) { try { drops = JSON.parse(q.drops); } catch (e) { return res.status(400).json({ error: 'drops ไม่ใช่ JSON ที่อ่านได้' }); } }
  if (!Array.isArray(drops) || !drops.length) {
    const lat = q.lat || b.lat, lng = q.lng || b.lng;
    if (!lat || !lng) return res.status(400).json({ error: 'ต้องมี lat, lng ปลายทาง หรือ drops[]' });
    drops = [{ lat, lng, addr: q.addr || b.addr || 'ปลายทาง' }];
  }
  // ⚠️ เพดานจำนวนจุดต่อคัน Lalamove ไม่เท่ากันทุกตลาด/ทุกประเภทรถ — ยังไม่ได้ verify เลขจริงของ TH
  //    ตั้ง MAX ไว้กันยิงเกินแล้วเสียเที่ยว · ถ้า API ตอบ error เรื่องจำนวนจุด ให้ลดเลขนี้ลง
  const MAX_DROPS = Number(process.env.LALAMOVE_MAX_DROPS || 10);
  if (drops.length > MAX_DROPS) {
    return res.status(400).json({ error: 'จุดส่งเกิน ' + MAX_DROPS + ' จุดต่อคัน (ตั้งค่าที่ LALAMOVE_MAX_DROPS)' });
  }
  for (const d of drops) {
    if (d == null || d.lat == null || d.lng == null) return res.status(400).json({ error: 'ทุกจุดใน drops ต้องมี lat/lng' });
  }

  const path = '/v3/quotations';
  const body = JSON.stringify({
    data: {
      serviceType,
      language: 'th_TH',
      stops: [
        { coordinates: { lat: String(KITCHEN.lat), lng: String(KITCHEN.lng) }, address: KITCHEN.address }
      ].concat(drops.map(function (d) {
        return { coordinates: { lat: String(d.lat), lng: String(d.lng) }, address: String(d.addr || 'ปลายทาง') };
      }))
    }
  });

  // HMAC signature ตามสเปค Lalamove v3: {time}\r\n{METHOD}\r\n{path}\r\n\r\n{body}
  const time = Date.now().toString();
  const rawSig = `${time}\r\nPOST\r\n${path}\r\n\r\n${body}`;
  const signature = crypto.createHmac('sha256', SECRET).update(rawSig).digest('hex');

  try {
    const r = await fetch(HOST + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `hmac ${KEY}:${time}:${signature}`,
        'Market': MARKET
      },
      body
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: 'lalamove_error', detail: json });
    // ⚠️ verify path นี้กับ response จริงตอนเทส sandbox
    const pb = json && json.data && json.data.priceBreakdown;
    return res.status(200).json({
      ok: true,
      price: pb ? Number(pb.total) : null,
      currency: pb ? pb.currency : null,
      stops: drops.length,
      quotationId: json && json.data ? json.data.quotationId : null,
      raw: json
    });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
};

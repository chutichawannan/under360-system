// Lalamove v3 quotation proxy — คำนวณค่าส่งจริงจาก Lalamove (เก็บ secret ฝั่ง server ห้ามอยู่ browser)
// ─────────────────────────────────────────────────────────────────────────
// ⚠️ สถานะ: โครงพร้อม แต่ "ยังไม่ผ่านการทดสอบจริง" — รอ 2 อย่างจากนัท:
//   1) LALAMOVE_API_KEY + LALAMOVE_API_SECRET (จาก Partner Portal → Developers) ตั้งใน Vercel env
//   2) เทส sandbox 1 ครั้ง เพื่อ verify รูปแบบ signature + ที่อยู่ราคาใน response (อาจต้องปรับเล็กน้อย)
// ref: https://developers.lalamove.com/  (HMAC-SHA256 · POST /v3/quotations · header Market=TH)
// ─────────────────────────────────────────────────────────────────────────
const crypto = require('crypto');

const HOST = (process.env.LALAMOVE_ENV === 'production')
  ? 'https://rest.lalamove.com'
  : 'https://rest.sandbox.lalamove.com';
const KITCHEN = { lat: '13.7179969', lng: '100.5010971', address: 'Under360 ครัว' };

module.exports = async (req, res) => {
  const KEY = process.env.LALAMOVE_API_KEY;
  const SECRET = process.env.LALAMOVE_API_SECRET;
  const MARKET = process.env.LALAMOVE_MARKET || 'TH';
  if (!KEY || !SECRET) {
    return res.status(500).json({ error: 'ยังไม่ได้ตั้ง LALAMOVE_API_KEY / LALAMOVE_API_SECRET ใน Vercel env' });
  }

  // พิกัดปลายทาง (รับจาก query ?lat=&lng=&addr= หรือ body)
  const q = req.query || {};
  const b = req.body || {};
  const lat = q.lat || b.lat;
  const lng = q.lng || b.lng;
  const addr = q.addr || b.addr || 'ปลายทาง';
  const serviceType = q.service || b.service || 'MOTORCYCLE'; // MOTORCYCLE / SEDAN / VAN ...
  if (!lat || !lng) return res.status(400).json({ error: 'ต้องมี lat, lng ปลายทาง' });

  const path = '/v3/quotations';
  const body = JSON.stringify({
    data: {
      serviceType,
      language: 'th_TH',
      stops: [
        { coordinates: { lat: String(KITCHEN.lat), lng: String(KITCHEN.lng) }, address: KITCHEN.address },
        { coordinates: { lat: String(lat), lng: String(lng) }, address: String(addr) }
      ]
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
      quotationId: json && json.data ? json.data.quotationId : null,
      raw: json
    });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message || e) });
  }
};

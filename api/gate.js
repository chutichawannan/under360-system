// ════════════════════════════════════════════════════════════════════
//  ด่านรหัสหน้าหลังบ้าน — ตรวจฝั่งเซิร์ฟเวอร์ (นัทสั่ง 8 ก.ย. 2569 ผ่าน PM)
//
//  ทำไมต้องตรวจฝั่งนี้: ของเดิมเก็บรหัสไว้ในหน้าเว็บ เปิด view-source ก็เห็น
//  ที่นี่หน้าเว็บไม่เคยรู้ค่าจริง — ส่งรหัสมาถาม แล้วได้แค่ "ใช่/ไม่ใช่" กลับไป
//
//  ⚠️ กันอะไรได้จริง: Google เก็บหน้า · ลิงก์หลุดจากคนใน · คนหลงเข้ามา
//  ⚠️ กันไม่ได้: คนจงใจอ้อมไปยิง Supabase ตรงด้วย anon key ที่ฝังในหน้า
//     (นั่นคือเฟส 2 — RLS/กุญแจ ซึ่งยังไม่เคาะ) อย่าเคลมเกินกว่านี้
//
//  🔒 รับรหัสทาง header เท่านั้น ไม่รับทาง URL
//     เหตุผล: 06 เจอรูนี้กับหน้า /ads วันนี้ (?pin= เปิดได้) · รหัสใน URL
//     ติดไปกับ history เบราว์เซอร์ ล็อกเซิร์ฟเวอร์ และลิงก์ที่แชร์ต่อ
// ════════════════════════════════════════════════════════════════════

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  // รหัสประจำบ้านเดียวกับหน้า pwa และ /ads ของ M — ตั้งทับได้ด้วย env
  // (ตั้งใจใช้ตัวเดียวกันทั้งบ้าน ไม่สร้างมาตรฐานที่ 3 ตามที่ PM สั่ง)
  const PIN = process.env.BACKOFFICE_PIN || process.env.ADS_PIN || '0360';

  const given =
    (req.headers && (req.headers['x-u360-gate'] || req.headers['X-U360-Gate'])) || '';

  if (String(given) !== String(PIN)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ ok: false, error: 'locked' }));
  }
  return res.end(JSON.stringify({ ok: true }));
};

/* Under360 — ตัวเฝ้า "เส้นเลือดใหญ่" ของร้าน (18 ส.ค. 2026)
 *
 * 🩸 ทำไมต้องมี — เกิดขึ้นจริงเมื่อคืน:
 *    CC เปลี่ยนเลข LIFF ในโค้ดแล้วส่งขึ้นของจริง ทั้งที่แชนแนลใหม่ยัง Developing
 *    → ลูกค้ากดริชเมนูแล้วเจอ 400 Bad Request → **สั่งอาหารไม่ได้ทั้งร้านข้ามคืน**
 *    → คนที่มาบอกคือ **แอดมิน** ไม่ใช่ระบบเรา
 *
 * 🎯 หน้าที่เดียว: **รู้ก่อนลูกค้า และรู้ก่อนแอดมิน**
 *    ไม่ต้องฉลาด ไม่ต้องวิเคราะห์ แค่ถามซ้ำๆ ว่า "ตอนนี้ยังขายของได้อยู่ไหม"
 *
 * ตรวจอะไร (ทั้งหมดคือของที่ "พังแล้วเงินหยุดไหล"):
 *   1. หน้าสั่งอาหารเปิดได้จริง + มีโค้ดครบ
 *   2. เลข LIFF ในโค้ด = เลขที่อนุมัติไว้   ← ตัวที่จับเคสเมื่อคืนได้
 *   3. ฐานข้อมูลตอบ + มีเมนูเปิดขายอยู่จริง
 *   4. หน้าครัวเปิดได้
 *   5. ใบจัดของเปิดได้
 *   6. มีออเดอร์เข้ามาใน 24 ชม.ที่ผ่านมา (สัญญาณธุรกิจ ไม่ใช่สัญญาณเทคนิค)
 *
 * 🔕 ไม่สแปม: โพสต์ขึ้นบอร์ดเฉพาะตอน "สถานะเปลี่ยน" (ดี→พัง หรือ พัง→ดี)
 *
 * เรียกเอง: /api/health-critical        · ดูสถานะตอนนี้
 *           /api/health-critical?post=1 · บังคับให้โพสต์บอร์ดแม้สถานะไม่เปลี่ยน
 */
const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H   = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const SITE       = 'https://under360-system.vercel.app';
const STATE_KEY  = 'health_critical_state';
// เลข LIFF ที่ "อนุมัติให้ใช้กับลูกค้า" — เปลี่ยนตรงนี้เมื่อย้าย LIFF จริงเท่านั้น
const LIFF_OK    = '2010442513-NI3JGTkb';

const bkk = () => new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' }).format(new Date());

async function page(path) {
  try {
    const r = await fetch(SITE + path, { cache: 'no-store' });
    const t = await r.text();
    return { ok: r.ok, status: r.status, text: t };
  } catch (e) { return { ok: false, status: 0, text: '', err: String(e && e.message) }; }
}

module.exports = async (req, res) => {
  const checks = [];
  const add = (ชื่อ, ผ่าน, รายละเอียด, ระดับ) => checks.push({ ชื่อ, ผ่าน, รายละเอียด, ระดับ: ระดับ || 'แดง' });

  // ── 1-2. หน้าสั่งอาหาร ──
  const liff = await page('/liff_customer.html');
  add('หน้าสั่งอาหารเปิดได้', liff.ok, liff.ok ? 'HTTP 200' : ('HTTP ' + liff.status + ' ' + (liff.err || '')));
  if (liff.ok) {
    const hasInit = /liff\.init/.test(liff.text);
    add('โค้ดหน้าสั่งอาหารครบ', hasInit, hasInit ? 'มี liff.init' : 'ไม่เจอ liff.init — ไฟล์อาจเสีย');
    const m = liff.text.match(/LIFF_ID:\s*['"]([\w-]+)['"]/);
    const cur = m ? m[1] : null;
    add('เลข LIFF ตรงกับที่อนุมัติ', cur === LIFF_OK,
        cur ? (cur === LIFF_OK ? cur : ('⚠️ ในโค้ดเป็น ' + cur + ' แต่ที่อนุมัติคือ ' + LIFF_OK + ' — ลูกค้าอาจเข้าไม่ได้')) : 'อ่านเลข LIFF ไม่เจอ');
  }

  // ── 3. ฐานข้อมูล + เมนู ──
  try {
    const r = await fetch(`${SB}/menu_items?select=id&is_available=eq.true&limit=1`, { headers: { ...H, Prefer: 'count=exact' } });
    const n = +((r.headers.get('content-range') || '/0').split('/')[1] || 0);
    add('ฐานข้อมูลตอบ + มีเมนูเปิดขาย', r.ok && n > 0, r.ok ? (n + ' เมนู') : ('HTTP ' + r.status));
  } catch (e) { add('ฐานข้อมูลตอบ + มีเมนูเปิดขาย', false, String(e && e.message)); }

  // ── 4-5. หน้าที่ครัวใช้ ──
  const kq = await page('/kitchen_queue.html');
  add('หน้าครัวเปิดได้', kq.ok, 'HTTP ' + kq.status);
  const ps = await page('/print_pickslip.html');
  add('ใบจัดของเปิดได้', ps.ok, 'HTTP ' + ps.status);

  // ── 6. ปฏิทินเมนู Meal Plan ยังมีวันให้ลูกค้าเลือกไหม ──
  //    (เพิ่ม 1 ก.ย. 2569 หลังเจอว่าเหลือ 2 วันโดยไม่มีอะไรฟ้อง)
  try {
    const r = await fetch(`${SB}/kitchen_data?key=eq.mp_menu_plan&select=data`, { headers: H });
    const j = await r.json();
    const plan = (Array.isArray(j) && j[0] && j[0].data) || {};
    const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);   // วันไทย
    const left = Object.keys(plan).filter(d => d > today).sort();
    const last = left[left.length - 1];
    const เหลือวัน = last ? Math.round((new Date(last) - new Date(today)) / 86400000) : 0;
    if (!left.length)
      add('ปฏิทินเมนู Meal Plan', false, 'ไม่มีวันให้ลูกค้าเลือกเลย — สั่ง Meal Plan ไม่ได้ ต้องให้ห้องฟ้าเติมแพลนด่วน');
    else if (left.length <= 3)
      add('ปฏิทินเมนู Meal Plan', false, 'เหลือแค่ ' + left.length + ' วัน (ถึง ' + last + ') — อีกไม่กี่วันลูกค้าจะสั่งไม่ได้');
    else
      add('ปฏิทินเมนู Meal Plan', เหลือวัน > 14,
          left.length + ' วัน ถึง ' + last + (เหลือวัน <= 14 ? ' — อีก ' + เหลือวัน + ' วันหมด เริ่มทวงห้องฟ้าได้แล้ว' : ''),
          เหลือวัน > 14 ? 'เหลือง' : 'เหลือง');
  } catch (e) { add('ปฏิทินเมนู Meal Plan', false, String(e && e.message), 'เหลือง'); }

  // ── 7. สัญญาณธุรกิจ (เตือนเบา ไม่ใช่แดง) ──
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const r = await fetch(`${SB}/orders?select=id&created_at=gte.${since}&limit=1`, { headers: { ...H, Prefer: 'count=exact' } });
    const n = +((r.headers.get('content-range') || '/0').split('/')[1] || 0);
    add('มีออเดอร์เข้าใน 24 ชม.', n > 0, n + ' ใบ', 'เหลือง');
  } catch (e) { add('มีออเดอร์เข้าใน 24 ชม.', false, String(e && e.message), 'เหลือง'); }

  const แดงที่พัง = checks.filter(c => !c.ผ่าน && c.ระดับ === 'แดง');
  const เหลืองที่พัง = checks.filter(c => !c.ผ่าน && c.ระดับ === 'เหลือง');
  const ok = แดงที่พัง.length === 0;

  // ── โพสต์บอร์ดเฉพาะตอนสถานะเปลี่ยน ──
  let โพสต์ = 'ไม่ได้โพสต์ (สถานะไม่เปลี่ยน)';
  try {
    const prev = await (await fetch(`${SB}/kitchen_data?select=data&key=eq.${STATE_KEY}`, { headers: H })).json();
    const was = (Array.isArray(prev) && prev[0] && prev[0].data) ? prev[0].data.ok : null;
    const เปลี่ยน = was === null || was !== ok;
    const บังคับ = req && req.query && req.query.post === '1';

    if (เปลี่ยน || บังคับ) {
      const หัว = ok ? '✅ [ตัวเฝ้าร้าน] กลับมาปกติแล้ว' : '🚨 [ตัวเฝ้าร้าน] ร้านมีปัญหา — ลูกค้าอาจสั่งไม่ได้';
      const text = หัว + ' · ' + bkk() + '\n\n'
        + checks.map(c => (c.ผ่าน ? '✅ ' : (c.ระดับ === 'แดง' ? '🔴 ' : '🟡 ')) + c.ชื่อ + ' — ' + c.รายละเอียด).join('\n')
        + (ok ? '' : '\n\n**สิ่งที่ต้องทำทันที:** เปิด ' + SITE + '/liff_customer.html ด้วยตาก่อน แล้วดูข้อที่ 🔴')
        + '\n\n_ตัวเฝ้านี้เกิดจากเคส 18 ส.ค. ที่ลูกค้าสั่งไม่ได้ข้ามคืนแล้วแอดมินเป็นคนมาบอก — มีไว้ให้ระบบรู้ก่อนคน_';
      for (const room of ['cc', 'pm', 'u', 'bug']) {
        await fetch(`${SB}/session_messages`, { method: 'POST', headers: H, body: JSON.stringify({ room, sender: 'ตัวเฝ้าร้าน', role: 'claude', text }) });
      }
      โพสต์ = 'โพสต์บอร์ดแล้ว (' + (เปลี่ยน ? 'สถานะเปลี่ยน' : 'บังคับ') + ')';
    }
    await fetch(`${SB}/kitchen_data`, { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: STATE_KEY, data: { ok, at: new Date().toISOString(), fails: แดงที่พัง.map(c => c.ชื่อ) } }) });
  } catch (e) { โพสต์ = 'บันทึกสถานะไม่ได้: ' + String(e && e.message); }

  return res.status(200).json({
    สรุป: ok ? '✅ ร้านขายของได้ปกติ' : ('🚨 พัง ' + แดงที่พัง.length + ' จุด — ' + แดงที่พัง.map(c => c.ชื่อ).join(' · ')),
    เตือนเบา: เหลืองที่พัง.map(c => c.ชื่อ + ': ' + c.รายละเอียด),
    เวลา: bkk(), การแจ้ง: โพสต์, รายการตรวจ: checks,
  });
};

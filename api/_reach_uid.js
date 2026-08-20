/* Under360 — "สะพานไลน์" หาไอดีไลน์ที่ส่งข้อความถึงได้จริง (20 ส.ค. 2026)
 *
 * 🧩 ปัญหาที่แก้:
 *   ช่องส่งข้อความของร้านคุยได้เฉพาะไอดีที่เกิดจาก "ประตูเก่า" (ยุค Hato)
 *   แต่ลูกค้าที่สั่งผ่านหน้าสั่งอาหารของเราตอนนี้ จะได้ไอดีชุดใหม่ที่ช่องนั้นไม่รู้จัก
 *   → พิสูจน์แล้ว 20 ส.ค.: ใบของนัทเอง ยิงด้วยไอดียุค Hato สำเร็จ · ยิงด้วยไอดีใหม่ ล้มเหลว
 *
 * 💡 วิธีแก้แบบไม่ต้องแตะหน้าสั่งอาหารเลย:
 *   ลูกค้าเก่าคนเดียวกัน เคยมีใบยุค Hato อยู่แล้ว → ไปหยิบไอดีเก่าของเขามาใช้ส่ง
 *   จับคู่ด้วย customer_id ก่อน แล้วค่อยเบอร์โทร
 *   วัดแล้ว: ครอบคลุม 60/91 ใบ (66%) ของออเดอร์ตั้งแต่ 1 ส.ค.
 *
 * ⚠️ ตั้งใจให้ทำงานฝั่งเซิร์ฟเวอร์อย่างเดียว — ไม่แตะ liff_customer.html แม้แต่บรรทัดเดียว
 *    (17 ส.ค. เคยแตะเส้นทางลูกค้าเพื่อให้ของใหม่ทำงาน แล้วร้านล้มข้ามคืน — ห้ามซ้ำ)
 */
const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H   = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const q = async (path) => {
  try { const r = await fetch(SB + '/' + path, { headers: H }); const j = await r.json(); return Array.isArray(j) ? j : []; }
  catch (e) { return []; }
};

/* คืนไอดีสำรอง (ยุค Hato) ของลูกค้าคนเดียวกัน — ไม่มีก็คืน null */
/* ตารางผูกไลน์ 2 ชุดของคนเดียวกันด้วยมือ — เก็บใน kitchen_data key 'line_uid_alias'
   รูปแบบ { "ไอดีชุดใหม่": "ไอดีชุดเก่าที่ส่งถึงได้" }
   ใช้กับเคสที่จับคู่อัตโนมัติไม่ได้ (เช่น ใบเทสที่กรอกเบอร์สมมติ) */
let _aliasCache = null, _aliasAt = 0;
async function aliasMap() {
  if (_aliasCache && Date.now() - _aliasAt < 300000) return _aliasCache;
  const r = await q("kitchen_data?select=data&key=eq.line_uid_alias");
  _aliasCache = (r[0] && r[0].data) || {};
  _aliasAt = Date.now();
  return _aliasCache;
}

async function legacyUid(order) {
  const map = await aliasMap();
  if (order.line_uid && map[order.line_uid]) return map[order.line_uid];
  if (!order) return null;
  if (order.customer_id) {
    const r = await q(`orders?select=line_uid&order_number=like.HT-*&line_uid=not.is.null&customer_id=eq.${order.customer_id}&order=created_at.desc&limit=1`);
    if (r[0] && r[0].line_uid) return r[0].line_uid;
  }
  if (order.customer_phone) {
    const p = encodeURIComponent(order.customer_phone);
    const r = await q(`orders?select=line_uid&order_number=like.HT-*&line_uid=not.is.null&customer_phone=eq.${p}&order=created_at.desc&limit=1`);
    if (r[0] && r[0].line_uid) return r[0].line_uid;
  }
  return null;
}

/* ส่งข้อความ: ลองไอดีในใบก่อน ถ้าไม่ผ่านค่อยลองไอดีเก่า
   คืน { ok, via, error } — via บอกว่าส่งผ่านไอดีชุดไหน (ไว้ debug ตอนนัทนั่งดูด้วยกัน) */
async function pushWithFallback(token, order, messages) {
  const tryPush = async (to) => {
    const r = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ to, messages }),
    });
    return r.ok ? { ok: true } : { ok: false, error: (await r.text()).slice(0, 160) };
  };

  if (order.line_uid) {
    const a = await tryPush(order.line_uid);
    if (a.ok) return { ok: true, via: 'ไอดีในใบ' };
    const alt = await legacyUid(order);
    if (alt && alt !== order.line_uid) {
      const b = await tryPush(alt);
      if (b.ok) return { ok: true, via: 'ไอดีเก่าของลูกค้าคนเดียวกัน' };
      return { ok: false, via: 'ลองแล้วทั้ง 2 ไอดี', error: b.error };
    }
    return { ok: false, via: 'ไม่มีไอดีสำรองให้ลอง', error: a.error };
  }

  const alt = await legacyUid(order);
  if (!alt) return { ok: false, via: 'ใบนี้ไม่มีไอดีไลน์เลย', error: 'no uid' };
  const b = await tryPush(alt);
  return b.ok ? { ok: true, via: 'ไอดีเก่าของลูกค้าคนเดียวกัน' } : { ok: false, via: 'ไอดีเก่าก็ส่งไม่ได้', error: b.error };
}

module.exports = { legacyUid, pushWithFallback };

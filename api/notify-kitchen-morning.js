// ============================================================
//  🔔 ตัวเตือนครัวตอน 9 โมงเช้า (เวลาไทย) — ฝั่งเซิร์ฟเวอร์
//
//  ทำไมต้องย้ายมาที่นี่ (นัทสั่งผ่านเลขา 25 ส.ค. 2569):
//    ของเดิมตัวเตือนอยู่ในห้องแชท = ต้องมีคนเปิดห้องค้างไว้ตลอด
//    ห้องปิดเมื่อไหร่ตัวเตือนตายทันที และ **พลาดจริงมาแล้ว 23 ส.ค.**
//    (นัทถามเองว่า "เกิดอะไรขึ้นกับกะปัน ทำไมไม่ตอบฉัน")
//    ผิดกฎที่นัทตั้งเอง: อะไรที่ต้องพึ่งให้มีคนเปิดค้างไว้ = ใช้ไม่ได้
//    → cron ของ Vercel ยิงเองทุกวัน ไม่สนว่าห้องไหนเปิดอยู่
//
//  🔒 ขอบเขตที่ตั้งใจไม่ข้าม:
//    · ไม่แตะ api/line-webhook.mjs และไฟล์อื่นของห้องกะปัน (เขาจองไว้ใน work_claims)
//    · ไม่สร้างช่องส่งข้อความใหม่ ไม่แตะกุญแจแชนแนล — ส่งผ่าน /api/kapan-say ของเดิม
//    · ตัวเตือนนี้ "อ่านข้อมูลแล้วเล่าให้ฟัง" ไม่แก้อะไรใน DB สักตัว
//
//  ตั้งเวลา: vercel.json → "0 2 * * *"  (02:00 UTC = 09:00 เวลาไทย)
//  พรีวิวก่อนส่งจริง: /api/notify-kitchen-morning?dry=1   ← ไม่ส่งเข้าไลน์
//
//  ⚙️ ต้องมี env 2 ตัวถึงจะส่งจริงได้:
//    KITCHEN_GROUP_ID = groupId ของกลุ่มครัว (ขอจากห้องกะปัน)
//    KAPAN_SAY_KEY    = กุญแจของ /api/kapan-say (ถ้าไม่ตั้ง จะใช้ค่า default เดิม)
//  ถ้ายังไม่มี KITCHEN_GROUP_ID → ตัวนี้จะไม่ส่ง แต่ยังคืนข้อความให้ดูได้ (จะได้รู้ว่าติดตรงไหน ไม่เงียบหาย)
// ============================================================

const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: ANON, Authorization: 'Bearer ' + ANON };

/* ⏰ ยึดเวลาไทยเสมอ — เซิร์ฟเวอร์ Vercel รันด้วย UTC ถ้าใช้วันของเครื่องจะเพี้ยนไป 1 วัน */
function bkkDate(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 86400000);
  const s = now.toLocaleString('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' });
  return s.replace(/\//g, '-');
}
const TH_DAY = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function thDate(ymd) {
  const d = new Date(ymd + 'T00:00:00');
  return TH_DAY[d.getDay()] + ' ' + d.getDate() + ' ' + TH_MON[d.getMonth()];
}

/* ⚠️ PostgREST คืนแค่ 1000 แถวถ้าไม่ขอเพิ่ม — และไม่มี error ให้เห็น
   หน้าครัวเคยพังเงียบเพราะข้อนี้มาแล้ว ต้องไล่ทีละหน้าเสมอ */
async function all(path) {
  const out = []; const step = 1000;
  for (let from = 0; ; from += step) {
    const r = await fetch(SB + '/' + path, { headers: { ...H, Range: `${from}-${from + step - 1}` } });
    const rows = await r.json();
    if (!Array.isArray(rows)) throw new Error(rows && rows.message ? rows.message : 'อ่านข้อมูลไม่สำเร็จ');
    out.push(...rows);
    if (rows.length < step) break;
  }
  return out;
}

export default async function handler(req, res) {
  const dry = String(req.query?.dry || '') === '1';
  try {
    const today = bkkDate(0), tmr = bkkDate(1);

    // ── ออเดอร์ของวันนี้ + พรุ่งนี้ (ตัดใบยกเลิก/ใบเทสออก) ──
    const ords = (await all(`orders?delivery_date=in.(${today},${tmr})&select=id,order_number,delivery_date,status,source,time_slot`))
      .filter(o => o.status !== 'cancelled' && o.source !== 'parallel_test');

    const items = [];
    for (let i = 0; i < ords.length; i += 60) {
      const ids = ords.slice(i, i + 60).map(o => o.id).join(',');
      if (!ids) break;
      items.push(...await all(`order_items?order_id=in.(${ids})&select=order_id,menu_item_id,menu_code,menu_name,quantity`));
    }
    const byOrder = Object.fromEntries(ords.map(o => [o.id, o]));
    const boxesOf = (ymd) => items
      .filter(i => (byOrder[i.order_id] || {}).delivery_date === ymd)
      .reduce((s, i) => s + (i.quantity || 0), 0);

    const nToday = ords.filter(o => o.delivery_date === today).length;
    const nTmr   = ords.filter(o => o.delivery_date === tmr).length;

    // ── ของที่ครัวรับปากว่าจะทำ แต่ในตู้ยังไม่มี ──
    //    นี่คือต้นเหตุของอาการ "ของหมดทุกที" ที่นัทถามในกลุ่มครัว 23 ส.ค.
    //    ลูกค้าซื้อของพวกนี้ได้แล้วตั้งแต่ครัวกรอก ถ้าไม่ได้ทำจริง ถึงวันส่งของจะไม่พอ
    const menus = await all('menu_items?select=id,code,name,stock_total,actual_stock,is_available');
    const byMenu = Object.fromEntries(menus.map(m => [m.id, m]));
    let incoming = {};
    try {
      const kd = await (await fetch(SB + '/kitchen_data?key=eq.stock_incoming&select=data&limit=1', { headers: H })).json();
      incoming = (kd && kd[0] && kd[0].data) || {};
    } catch { incoming = {}; }

    const promised = Object.entries(incoming)
      .map(([id, v]) => ({ m: byMenu[id], n: Number(v && v.n) || 0 }))
      .filter(x => x.m && x.n > 0 && (x.m.actual_stock || 0) < x.n)
      .sort((a, b) => b.n - a.n);

    // ── เมนูที่หน้าร้านยังเปิดขาย ทั้งที่ในตู้นับได้ 0 ──
    const ghost = menus
      .filter(m => m.is_available && m.stock_total != null && m.stock_total > 0 && (m.actual_stock || 0) === 0
                   && !(incoming[m.id] && incoming[m.id].n))
      .sort((a, b) => (b.stock_total || 0) - (a.stock_total || 0));

    // ── ประกอบข้อความ — ครัวอ่านไทยได้ 2 จาก 6 คน ใช้ตัวเลข+ไอคอนนำเสมอ ──
    const L = [];
    L.push('☀️ สรุปเช้านี้ · ' + thDate(today));
    L.push('');
    L.push('📦 ส่งวันนี้ ' + nToday + ' ใบ · ' + boxesOf(today) + ' กล่อง');
    L.push('📦 ส่งพรุ่งนี้ ' + nTmr + ' ใบ · ' + boxesOf(tmr) + ' กล่อง');

    if (promised.length) {
      L.push('');
      L.push('🍳 รับปากว่าจะทำ แต่ในตู้ยังไม่ครบ');
      promised.slice(0, 8).forEach(x =>
        L.push('· ' + x.m.code + ' ' + String(x.m.name || '').slice(0, 22) + ' — ต้องทำ ' + x.n + ' มีแล้ว ' + (x.m.actual_stock || 0)));
      if (promised.length > 8) L.push('· (และอีก ' + (promised.length - 8) + ' เมนู)');
      L.push('⚠️ ลูกค้าซื้อของพวกนี้ได้แล้ว ถ้าไม่ได้ทำ ของจะไม่พอ');
    }

    if (ghost.length) {
      L.push('');
      L.push('🚨 ในตู้ 0 แต่หน้าร้านยังขายอยู่ ' + ghost.length + ' เมนู');
      ghost.slice(0, 5).forEach(m =>
        L.push('· ' + m.code + ' ' + String(m.name || '').slice(0, 22) + ' — ยังสั่งได้อีก ' + m.stock_total));
      L.push('👉 ถ้าไม่ได้ทำแล้ว ให้กดปิดขายในแท็บตั้งสต็อค');
    }

    if (!promised.length && !ghost.length) {
      L.push('');
      L.push('✅ ของในตู้กับหน้าร้านตรงกัน ไม่มีอะไรค้าง');
    }

    L.push('');
    L.push('📊 ดูย้อนหลังรายวัน: under360-system.vercel.app/pwa/stock_history.html');

    const text = L.join('\n');
    const group = process.env.KITCHEN_GROUP_ID || '';

    if (dry) return res.status(200).json({ ok: true, ส่งจริงไหม: 'ไม่ (dry=1)', มีกลุ่มปลายทางไหม: !!group, ข้อความ: text });
    if (!group) return res.status(200).json({ ok: false, why: 'ยังไม่ได้ตั้ง KITCHEN_GROUP_ID — ยังส่งไม่ได้', ข้อความ: text });

    /* ส่งผ่านช่องเดิมของกะปัน — ตัวนั้นเช็คให้แล้วว่าบอทอยู่ในกลุ่มนี้จริงไหม
       (กันเคสใส่ groupId ผิดแล้วข้อความไปโผล่ผิดกลุ่ม) */
    const base = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host);
    const r = await fetch(base + '/api/kapan-say', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: process.env.KAPAN_SAY_KEY || 'kapan-pm-2026', group, text }),
    });
    const out = await r.json().catch(() => ({}));
    return res.status(200).json({ ok: !!out.ok, ผลส่ง: out, ข้อความ: text });
  } catch (e) {
    // ⚠️ พังต้องดังพอให้เห็นใน log ของ Vercel — ตัวเตือนที่ตายเงียบคือสิ่งที่เรากำลังหนีมา
    console.error('notify-kitchen-morning ล้มเหลว:', e);
    return res.status(500).json({ ok: false, why: String(e && e.message || e) });
  }
}

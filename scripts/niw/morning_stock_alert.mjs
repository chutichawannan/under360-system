// ============================================================
//  ⏰ ตัวเตือนเช้า 10:00 — "ของหมดเกลี้ยงตั้งแต่เช้า จะทำยังไงดี"
//  นัทสั่งเอง 1 ก.ย. 2026
//  ------------------------------------------------------------
//  🔴 ตัวนี้ "ไม่เติมอะไรทั้งนั้น" — เตือนอย่างเดียว
//     การเติมมีรอบเดียวคือ 19:00 จ/อ/พ (ดู refill_weekly_set.mjs)
//     เพราะนัทสั่งว่าห้ามเติมตอนครัวทำงานอยู่/กำลังจะเลิกงาน
//
//  ทำไมต้อง 10 โมง: ครัวเข้า 8:00 · ผักมาเกือบ 9:00 · ปิดรับออเดอร์ 18:00
//     -> เจอตอน 10 โมง = ยังเหลือเวลาขายอีก 8 ชม. ให้ตัดสินใจได้ทัน
//        ถ้าปล่อยไปเจอตอน 19:00 = เสียทั้งวันไปแล้ว แก้อะไรไม่ได้
//
//  ดูเฉยๆ ไม่ส่ง:  node scripts/niw/morning_stock_alert.mjs --dry
// ============================================================
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H  = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const DRY = process.argv.includes('--dry');
const BASE = 'https://under360-system.vercel.app';
const SAYKEY = process.env.KAPAN_SAY_KEY || 'kapan-pm-2026';

const thai = new Date(Date.now() + 7 * 3600 * 1000);
const dow  = thai.getUTCDay();
const DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];
/* เหลือวันขายอีกกี่วันก่อนจบสัปดาห์ (สัปดาห์เริ่มจันทร์ จบอาทิตย์) */
const leftInWeek = (dow === 0) ? 0 : (7 - dow);

function slot(sc) {
  const s = String(sc || '').trim().toUpperCase();
  const head = s.charAt(0);
  if (head !== 'S' && head !== 'D') return null;
  const rest = s.slice(1);
  const n = parseInt(rest, 10);
  if (!(n > 0) || String(n) !== rest) return null;
  if (head === 'S' && n > 8) return null;
  if (head === 'D' && n > 5) return null;
  return { label: s, rank: (head === 'S' ? 0 : 100) + n };
}

async function main() {
  /* ใครเป็นคนกดซ่อน — หน้าครัวจดไว้ใน kitchen_data.stock_hidden
     ต้องบอกชื่อ+วันที่ ไม่งั้นแอดมินเห็นแค่ "ปิดอยู่" แล้วไม่รู้จะไปถามใคร (S2 หายไป 2 วันเพราะแบบนี้) */
  let hid = {};
  try {
    const hd = await (await fetch(SB + '/rest/v1/kitchen_data?key=eq.stock_hidden&select=data', { headers: H })).json();
    hid = (hd && hd[0] && hd[0].data) || {};
  } catch (e) { /* อ่านไม่ได้ = แค่ไม่รู้ชื่อคนซ่อน ไม่ใช่เหตุให้เงียบทั้งใบ */ }

  const rows = await (await fetch(
    SB + '/rest/v1/menu_items?select=id,code,subcode,name,is_available,stock_total,actual_stock&subcode=not.is.null',
    { headers: H })).json();

  const out = [], closed = [], unlimited = [];
  for (const m of rows) {
    const s = slot(m.subcode); if (!s) continue;
    if (m.is_available !== true) { closed.push({ s, m }); continue; }
    if (m.stock_total === null) { unlimited.push({ s, m }); continue; }   // ไม่จำกัด = ผิดกฎ ต้องรู้
    if (Number(m.stock_total) <= 0) out.push({ s, m });
  }
  const by = a => a.sort((x, y) => x.s.rank - y.s.rank);
  by(out); by(closed); by(unlimited);

  if (!out.length && !closed.length && !unlimited.length) {
    console.log('เช้านี้ปกติ ทั้ง 13 ช่องมีของ — ไม่ส่ง'); return;
  }

  const L = ['☀️ เช็คเมนูสัปดาห์ตอน 10 โมง (' + DAYS[dow] + ')', ''];
  if (out.length) {
    L.push('🔴 หมดเกลี้ยงตั้งแต่เช้า ' + out.length + ' ตัว — ลูกค้าสั่งไม่ได้แล้ว');
    for (const x of out) L.push('   · ' + x.s.label + ' ' + x.m.name + (Number(x.m.actual_stock) > 0 ? '  (ครัวลงว่าทำได้ ' + x.m.actual_stock + ')' : ''));
    L.push('');
  }
  if (closed.length) {
    L.push('⚫ ถูกปิดขายอยู่ ' + closed.length + ' ตัว');
    for (const x of closed) {
      const v = hid[x.m.id];
      const who = v ? '  ← ' + v.by + ' ซ่อนไว้ ' + String(v.at).slice(5, 10).split('-').reverse().join('/') : '';
      L.push('   · ' + x.s.label + ' ' + x.m.name + who);
    }
    L.push('');
  }
  if (unlimited.length) {
    L.push('⚠️ ยังตั้งเป็น "ขายไม่จำกัด" ' + unlimited.length + ' ตัว (ผิดกฎ ควรมีเลขเสมอ)');
    for (const x of unlimited) L.push('   · ' + x.s.label + ' ' + x.m.name);
    L.push('');
  }
  L.push('เหลือวันขายอีก ' + leftInWeek + ' วันก่อนจบสัปดาห์');
  L.push(out.length
    ? (dow >= 1 && dow <= 3
        ? 'ตัวเติมอัตโนมัติจะเติมให้เอง 19:00 คืนนี้ — ถ้าอยากได้เร็วกว่านั้น/มากกว่า 5 บอกได้'
        : 'วันนี้ไม่ใช่ จ-อ-พ ตัวเติมอัตโนมัติไม่ทำงาน — ต้องสั่งครัวเอง')
    : 'ไม่มีตัวไหนหมด');
  const text = L.join('\n');
  console.log(text);
  if (DRY) { console.log('\n[dry] ไม่ได้ส่ง'); return; }
  const r = await fetch(BASE + '/api/kapan-say', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: SAYKEY, text }),
  });
  console.log('ส่งเข้าไลน์:', r.status);
}
await main();

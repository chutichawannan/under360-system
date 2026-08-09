// ═══════════════════════════════════════════════════════════════
// ครัวต้องสต็อคอะไร เท่าไหร่ — เมนูสัปดาห์ s1-s8 / D1-D5
// ═══════════════════════════════════════════════════════════════
// ให้ 2 ตัวเลขต่อเมนู:
//   ① สั่งแล้วจริง  = ลูกค้ากดสั่งมาแล้ว ต้องผลิตอย่างน้อยเท่านี้ (ตัวเลขนี้ไม่ใช่การเดา)
//   ② เคยขายได้     = ประวัติขายของเมนูตัวเดียวกันในรอบก่อนๆ ใช้ค่ากลาง (median) กัน outlier
// รัน: node scripts/cc_weekly_stock_plan.mjs [วันเริ่ม YYYY-MM-DD]
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const get = async (q) => (await fetch(B + q, { headers: H })).json();

const START = process.argv[2] || '2026-08-10';
const END = (() => { const d = new Date(START + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 6); return d.toISOString().slice(0, 10); })();

// ── 1) เมนูที่มีชื่อเล่น (subcode) = เมนูสัปดาห์นี้
const menus = (await get('menu_items?select=code,subcode,name,category,is_available,is_weekly_special&subcode=not.is.null&limit=200'))
  .filter(m => (m.subcode || '').trim());
const order = s => { const m = String(s).match(/^([a-z]*)([sd])(\d+)$/i); return m ? (m[2].toLowerCase() === 's' ? 0 : 1) * 100 + (+m[3]) + (m[1] ? 1000 : 0) : 9999; };
menus.sort((a, b) => order(a.subcode) - order(b.subcode));
const codes = new Set(menus.map(m => m.code));

// ── 2) ออเดอร์ที่ต้องส่งในสัปดาห์นี้ (ตัดใบยกเลิก) — paginate กัน cap 1000
async function page(path) {
  const out = [];
  for (let off = 0; off < 20000; off += 1000) {
    const b = await get(`${path}&limit=1000&offset=${off}`);
    if (!Array.isArray(b) || !b.length) break;
    out.push(...b); if (b.length < 1000) break;
  }
  return out;
}
const upcoming = await page(`orders?select=order_number,customer_name,delivery_date,status,order_items(menu_code,menu_name,quantity)&delivery_date=gte.${START}&delivery_date=lte.${END}&status=neq.cancelled&order=delivery_date.asc`);

// ── 3) ประวัติขาย: ไล่ order_items ทั้งหมดของเมนูชุดนี้ ย้อนหลัง
const hist = await page(`order_items?select=menu_code,quantity,orders(delivery_date,status)&menu_code=in.(${[...codes].join(',')})&order=id.asc`);

const med = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const i = s.length >> 1; return s.length % 2 ? s[i] : Math.round((s[i - 1] + s[i]) / 2); };
const isoWeek = ymd => { const d = new Date(ymd + 'T00:00:00Z'); const t = new Date(d); t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); return t.getUTCFullYear() + '-W' + String(Math.ceil((((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7)).padStart(2, '0'); };

// สั่งแล้วจริง แยกตามวัน
const sold = {}, byDay = {};
for (const o of upcoming) for (const it of (o.order_items || [])) {
  if (!codes.has(it.menu_code)) continue;
  sold[it.menu_code] = (sold[it.menu_code] || 0) + Number(it.quantity || 0);
  (byDay[it.menu_code] ||= {})[o.delivery_date] = (byDay[it.menu_code]?.[o.delivery_date] || 0) + Number(it.quantity || 0);
}
// ประวัติ: รวมต่อสัปดาห์ แล้วเอาค่ากลาง
const weeks = {};
for (const it of hist) {
  const od = it.orders; if (!od || od.status === 'cancelled' || !od.delivery_date) continue;
  const w = isoWeek(od.delivery_date);
  ((weeks[it.menu_code] ||= {})[w] ||= 0);
  weeks[it.menu_code][w] += Number(it.quantity || 0);
}

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log(`║  ครัวต้องสต็อคเท่าไหร่ — สัปดาห์ ${START} ถึง ${END}                 ║`);
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('ชื่อเล่น  โค้ด   เมนู                              สั่งแล้ว  เคยขาย/สัปดาห์   แนะนำผลิต');
console.log('───────────────────────────────────────────────────────────────────────────────────');

let totSold = 0, totSuggest = 0;
const lines = [];
for (const m of menus) {
  const s = sold[m.code] || 0;
  const hw = Object.values(weeks[m.code] || {});
  const h = med(hw);
  // แนะนำ = มากกว่าระหว่าง (สั่งแล้ว) กับ (ค่ากลางประวัติ) — ไม่บวกเผื่อเอง ให้ครัว/นัทบวกเอง
  const suggest = Math.max(s, h);
  totSold += s; totSuggest += suggest;
  const histTxt = hw.length ? `${h} (จาก ${hw.length} สัปดาห์)` : 'ไม่เคยขาย';
  lines.push({ sub: m.subcode, code: m.code, name: m.name, s, h, suggest, hw: hw.length });
  console.log(
    String(m.subcode).padEnd(8) + String(m.code).padEnd(7) +
    String(m.name || '').slice(0, 32).padEnd(34) +
    String(s).padStart(6) + '   ' + histTxt.padEnd(18) + String(suggest).padStart(6) +
    (m.is_available ? '' : '  ⚠️ ปิดขายอยู่')
  );
}
console.log('───────────────────────────────────────────────────────────────────────────────────');
console.log('รวม'.padEnd(49) + String(totSold).padStart(6) + '                     ' + String(totSuggest).padStart(6) + ' กล่อง');

console.log('\n── สั่งแล้ว แยกตามวันส่ง (เอาไว้ดูว่าต้องเสร็จวันไหน) ──');
const days = [...new Set(upcoming.map(o => o.delivery_date))].sort();
if (!days.length) console.log('  (ยังไม่มีออเดอร์ในช่วงนี้)');
for (const d of days) {
  const per = {};
  for (const o of upcoming.filter(x => x.delivery_date === d))
    for (const it of (o.order_items || [])) if (codes.has(it.menu_code)) per[it.menu_code] = (per[it.menu_code] || 0) + Number(it.quantity || 0);
  const tot = Object.values(per).reduce((a, b) => a + b, 0);
  if (!tot) continue;
  const sub = c => menus.find(m => m.code === c)?.subcode || c;
  console.log(`  ${d}  รวม ${String(tot).padStart(3)} กล่อง : ` + Object.entries(per).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${sub(c)}×${n}`).join('  '));
}

const never = lines.filter(l => !l.hw);
if (never.length) {
  console.log('\n⚠️ เมนูที่ไม่เคยขายมาก่อนเลย ' + never.length + ' ตัว — ตัวเลขแนะนำมาจาก "สั่งแล้ว" อย่างเดียว ยังเดาไม่ได้จริง');
  console.log('   ' + never.map(l => l.sub + '(' + l.code + ')').join('  '));
}
console.log('\n📌 "แนะนำผลิต" = ค่ามากกว่าระหว่าง สั่งแล้ว กับ ค่ากลางที่เคยขาย — **ยังไม่บวกเผื่อ** ครัว/นัทบวกเผื่อเองตามหน้างาน');

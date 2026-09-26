#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// audit_mealplan_days.mjs — ตรวจว่า Meal Plan ทุกใบส่งตรง จ/พ/ศ
//
// 📌 ที่มา: แยกออกมาจาก `hato_sync.mjs` ตอนปิดสคริปต์ Hato (8 ส.ค. 2026)
//    ตัวนี้ **ไม่พึ่ง Hato เลย** — อ่าน DB เรา + ชีทแอดมิน → ใช้ต่อได้ถาวร
//
// ทำไมต้องมี (เคสจริง 6 ส.ค. 2026 · นัทเจอเองในจอครัว):
//   Meal Plan ปรุงสด ส่งได้แค่ จันทร์/พุธ/ศุกร์ — เป็นข้อจำกัดการผลิตจริง ไม่ใช่กฎที่ผ่อนได้
//   แต่ลูกค้ากดสั่งมาวันไหนก็ได้ (คุณวิไลลักษณ์กดรับ พฤหัส 6 ส.ค.)
//   แอดมินรู้เองแล้วไปแจ้งลูกค้าทีหลัง — แต่ระบบไม่รู้ → ใบหลุดมาผิดวันในจอครัว
//
// ⚖️ ตัวนี้ **รายงานอย่างเดียว ไม่แก้เอง** — วันส่งจริงต้องยึดที่แอดมินตกลงกับลูกค้า
//    เดาแทนแล้วผิด = ลูกค้าไม่ได้ของ เสียหายกว่าปล่อยให้คนตัดสิน
//
// ใช้:  node scripts/audit_mealplan_days.mjs
// ควรรัน: ทุกเช้า หรือทุกครั้งที่แก้ตารางส่ง Meal Plan
// ═══════════════════════════════════════════════════════════════

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const SHEET_ID = '1djy4mWETbHnytwCX0tTOHxUxmLdeFhYHST9DD0nXP7k';
const SHEET_TAB = 'Meal Plan UNDER360';
const MWF = [1, 3, 5];                       // จ/พ/ศ
const TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const bkkToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());

console.log('🔍 ตรวจวันส่ง Meal Plan (ต้องเป็น จ/พ/ศ เท่านั้น)\n');
const today = bkkToday();
const orders = await (await fetch(`${SB}/orders?select=id,order_number,customer_name,delivery_date,total&delivery_date=gte.${today}&status=neq.cancelled&limit=500`, { headers: H })).json();
if (!Array.isArray(orders) || !orders.length) { console.log('   ไม่มีออเดอร์ในอนาคต'); process.exit(0); }

const itemsByOrder = {};
for (let i = 0; i < orders.length; i += 50) {
  const ids = orders.slice(i, i + 50).map((o) => o.id).join(',');
  const rows = await (await fetch(`${SB}/order_items?select=order_id,menu_code,menu_name&order_id=in.(${ids})`, { headers: H })).json();
  (rows || []).forEach((r) => { (itemsByOrder[r.order_id] = itemsByOrder[r.order_id] || []).push(r); });
}

const isMP = (its) => (its || []).some((r) => /Weekly|Monthly|^LC\d|^HP\d/i.test(r.menu_code || '') || /Meal Plan|Lean Meal/i.test(r.menu_name || ''));
const dow = (d) => new Date(d + 'T12:00:00Z').getUTCDay();
const mpOrders = orders.filter((o) => isMP(itemsByOrder[o.id]));
const offDay = mpOrders.filter((o) => !MWF.includes(dow(o.delivery_date)));

console.log(`   ตรวจ ${orders.length} ใบ (ส่ง >= ${today}) · เป็น Meal Plan ${mpOrders.length} ใบ\n`);
if (!offDay.length) { console.log('   ✅ Meal Plan ทุกใบส่ง จ/พ/ศ ครบ — ไม่มีใบหลุดวัน'); process.exit(0); }

console.log(`   🔴 พบ ${offDay.length} ใบที่ส่งนอก จ/พ/ศ:\n`);
let sheet = null;
try {
  const t = await (await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_TAB)}`)).text();
  const m = t.match(/setResponse\(([\s\S]*)\);?$/);
  if (m) sheet = JSON.parse(m[1]).table.rows.map((r) => (r.c || []).map((c) => (c ? (c.f || c.v) : '')));
} catch (e) { console.log('   ⚠️ อ่านชีทแอดมินไม่ได้: ' + e.message.slice(0, 60)); }

const parseD = (s) => {
  const m = String(s || '').match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/); if (!m) return null;
  const M = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  return new Date(Date.UTC(+m[3], M[m[2]], +m[1])).toISOString().slice(0, 10);
};

for (const o of offDay) {
  console.log(`   · ${o.order_number} | ${o.customer_name} | ส่ง ${o.delivery_date} (${TH[dow(o.delivery_date)]}) ฿${o.total}`);
  if (!sheet) continue;
  // จับด้วย "เลขออเดอร์" ไม่ใช่ชื่อ — ชื่อซ้ำ/สะกดต่างกันได้
  const rounds = sheet.filter((r) => String(r[2] || '').trim() === o.order_number)
    .map((r) => ({ d: parseD(r[0]), round: r[6] })).filter((x) => x.d).sort((a, b) => a.d.localeCompare(b.d));
  if (rounds.length) {
    console.log(`       ✅ แอดมินลงในชีทแล้ว → ${rounds.map((r) => `${r.d}(รอบ ${r.round || '?'})`).join(' · ')}`);
    console.log(`       → ควรแก้เป็น ${rounds[0].d} + สร้างรอบที่เหลืออีก ${rounds.length - 1} ใบ`);
  } else {
    console.log('       ⚠️ ยังไม่มีในชีทแอดมิน — ต้องถามแอดมินว่าลูกค้ารายนี้เริ่มส่งวันไหน');
  }
}
console.log('\n   (รายงานอย่างเดียว ไม่แก้เอง — วันส่งจริงต้องยึดที่แอดมินตกลงกับลูกค้า)');

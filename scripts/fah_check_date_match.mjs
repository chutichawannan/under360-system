#!/usr/bin/env node
/**
 * 🕵️ ยามเทียบ "วันในใบออเดอร์" กับ "วันของรอบครัว" — ต้องตรงกันเสมอ
 *
 *   node scripts/fah_check_date_match.mjs           ตรวจย้อน 7 วัน + อนาคตทั้งหมด
 *   node scripts/fah_check_date_match.mjs --all      ตรวจทุกวันเท่าที่มีข้อมูล
 *
 * ที่มา: 9 ก.ย. 2026 นัทเห็นเองในหน้าออเดอร์ว่าลูกค้า 2 คนไม่อยู่ในใบงานครัว
 *   สืบแล้วเจอ 4 ใบที่วันไม่ตรงกัน (`docs/CASE_03_order_vs_round_date.md`)
 *   ตัวที่ค้างนานสุด (PIMM) ไม่มีใครเห็นเลย 8 วัน
 *
 * 🧭 ทำไมต้องมีทั้งที่จะแก้บั๊กอยู่แล้ว:
 *   แก้โค้ดกันได้เฉพาะสาเหตุที่เรานึกออกวันนี้ · ยามตัวนี้จับได้ทุกสาเหตุ
 *   รวมถึงบั๊กใหม่ที่ยังไม่เกิด และคนกดผิด
 *
 * ⚠️ ตั้งใจให้ "ส่งเสียง ไม่ปิดประตูครัว"
 *   ไม่ทำให้ใบงานหยุดออก เพราะใบงานสร้างจากรอบซึ่งยังถูกอยู่
 *   ถ้าบล็อกใบงาน = ครัวไม่มีใบ ซึ่งเจ็บกว่าตัวปัญหาเอง
 *   → คืน exit code 0 เสมอ · หน้าที่มันคือ "ทำให้มีคนเห็นภายในวันเดียว"
 */
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const q = async p => {
  const r = await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: 'Bearer ' + K } });
  const j = await r.json();
  if (!Array.isArray(j)) { console.error('🔴 อ่าน DB ไม่ได้:', JSON.stringify(j).slice(0, 200)); return []; }
  return j;
};

const ALL = process.argv.includes('--all');
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const from = ALL ? '2026-01-01' : new Date(Date.now() + 7 * 3600e3 - 7 * 86400e3).toISOString().slice(0, 10);

// รอบครัวทั้งหมดในช่วง (ตัดรอบที่ยกเลิก/ขอข้ามออก — พวกนั้นไม่ต้องมีใบ)
const rounds = (await q(`mp_deliveries?select=order_id,customer_name,delivery_date,round_no,total_rounds,status,box_count&delivery_date=gte.${from}&limit=1000`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested' && r.order_id);

const ids = [...new Set(rounds.map(r => r.order_id))];
const orders = [];
for (let i = 0; i < ids.length; i += 50)
  orders.push(...await q(`orders?select=id,order_number,delivery_date,status,customer_name,total&id=in.(${ids.slice(i, i + 50).join(',')})&limit=200`));
const oby = Object.fromEntries(orders.map(o => [o.id, o]));

const bad = [];
for (const r of rounds) {
  const o = oby[r.order_id];
  if (!o || o.status === 'cancelled') continue;
  if (o.delivery_date !== r.delivery_date) bad.push({ r, o });
}

console.log(`\n🕵️ เทียบวันในใบ vs วันของรอบครัว — ตรวจ ${rounds.length} รอบ (ตั้งแต่ ${from})\n`);
if (!bad.length) { console.log('✅ ตรงกันทุกรอบ\n'); process.exit(0); }

console.log(`🔴 ไม่ตรงกัน ${bad.length} รอบ — ลูกค้าพวกนี้จะโผล่หน้าหนึ่ง หายอีกหน้าหนึ่ง:\n`);
for (const { r, o } of bad.sort((a, b) => a.r.delivery_date.localeCompare(b.r.delivery_date))) {
  // ใครเจ็บก่อน: ถ้าวันของรอบผ่านไปแล้ว = ครัวทำไปแล้วแต่ใบยังค้าง · ถ้าใบมาก่อน = ครัวจะไม่ได้ทำ
  const madeAlready = r.delivery_date < today;
  const tag = madeAlready
    ? '⚠️ ครัวทำไปแล้ว แต่ใบยังค้างว่าต้องส่ง ' + o.delivery_date
    : (o.delivery_date < r.delivery_date ? '⚠️ ใบบอกส่งก่อน ครัวจะยังไม่ได้ทำ' : '⚠️ ครัวทำก่อนวันที่ใบบอก');
  console.log(`   ${o.order_number.padEnd(13)} ${String(r.customer_name || '').trim().padEnd(24)} r${r.round_no}/${r.total_rounds} · ${r.box_count} กล่อง`);
  console.log(`      ใบว่า ${o.delivery_date}  ·  รอบว่า ${r.delivery_date}   ${tag}`);
}
console.log(`\n📄 สาเหตุและวิธีแก้: docs/CASE_03_order_vs_round_date.md`);
console.log(`   (ยามตัวนี้ไม่หยุดใบงานครัว — ใบงานสร้างจากรอบซึ่งยังถูกอยู่)\n`);

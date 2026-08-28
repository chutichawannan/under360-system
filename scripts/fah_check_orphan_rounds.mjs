#!/usr/bin/env node
/**
 * หา "รอบที่เลยวันส่งไปแล้ว แต่ไม่เคยถูกจ่ายเมนูเลย" = รอบที่หลุดมือ ลูกค้าอาจไม่ได้ของ
 *
 *   node scripts/fah_check_orphan_rounds.mjs [จำนวนวันย้อนหลัง=45]
 *
 * ที่มา (28 ส.ค. 2026): กวาง (อินฟลู · จ่ายแล้ว) มีใบ Hyrox 6 กล่อง วันส่ง 11 ส.ค.
 * ค้าง 17 วันโดยไม่มีใครเห็น เพราะไม่มีอะไรเฝ้ารอบที่หลุด
 *
 * ⚠️ ทำไม "ไม่ใช้ status != delivered" เป็นตัวชี้ (u-maintainer ตรวจให้ 28 ส.ค.):
 *   ทีมเราไม่ได้กดปิดสถานะกันอยู่แล้ว — ส.ค. มี 300 ใบ กด "ส่งแล้ว" แค่ 1 ใบ
 *   ใช้ delivered เป็นเกณฑ์ = ขึ้นแดง 113 รอบทุกวัน = สัญญาณที่ไม่มีใครเชื่อภายในสัปดาห์เดียว
 *   → ใช้ "เมนูว่าง" แทน เพราะเมนูถูกจ่ายจริงทุกวัน = ร่องรอยที่เกิดจากการทำงานจริง (เหลือ ~9 เคส คนไล่ไหว)
 */
const BACK_DAYS = Number(process.argv[2] || 45);
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

const q = async p => {
  const r = await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: 'Bearer ' + K } });
  if (!r.ok) { console.error('❌ query ล้มเหลว', r.status, await r.text()); process.exit(1); }
  return r.json();
};
const todayTH = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const from = new Date(Date.now() + 7 * 3600 * 1000 - BACK_DAYS * 86400000).toISOString().slice(0, 10);

const rows = await q(`mp_deliveries?select=id,order_id,customer_name,mp_type,mp_set,round_no,total_rounds,delivery_date,box_count,status,menu_items&delivery_date=gte.${from}&delivery_date=lt.${todayTH}&order=delivery_date.asc&limit=500`);

const orphan = rows.filter(r =>
  r.status !== 'cancelled' &&
  r.status !== 'skip_requested' &&
  !(Array.isArray(r.menu_items) && r.menu_items.length)
);

console.log(`\n🔎 รอบที่เลยวันส่งแล้ว (${from} → เมื่อวาน) ทั้งหมด ${rows.length} รอบ`);
console.log(`   เกณฑ์: ไม่ถูกยกเลิก · ไม่ถูกข้าม · **ไม่มีเมนูสักตัว**\n`);

if (!orphan.length) { console.log('✅ ไม่มีรอบที่หลุดมือ\n'); process.exit(0); }

const ids = [...new Set(orphan.map(r => r.order_id).filter(Boolean))];
const ords = ids.length ? await q(`orders?select=id,order_number,delivery_date,total,payment_status,status,customer_phone&id=in.(${ids.join(',')})&limit=200`) : [];
const om = Object.fromEntries(ords.map(o => [o.id, o]));

let boxes = 0, paid = 0;
console.log(`🔴 พบ ${orphan.length} รอบที่หลุดมือ:\n`);
for (const r of orphan) {
  const o = om[r.order_id];
  const days = Math.round((new Date(todayTH) - new Date(r.delivery_date)) / 86400000);
  boxes += r.box_count || 0;
  if (o && o.payment_status === 'paid') paid++;
  console.log(`   · ${r.delivery_date} (ค้าง ${days} วัน) — ${r.customer_name}`);
  console.log(`     ${String(r.mp_type).toUpperCase()} r${r.round_no}/${r.total_rounds} · ${r.box_count || '?'} กล่อง · สถานะ ${r.status}`);
  console.log(`     ${o ? `${o.order_number} · ฿${o.total} · ${o.payment_status}${o.customer_phone ? ' · ' + o.customer_phone : ''}` : '⚠️ ไม่มีใบออเดอร์ผูกอยู่'}`);
}
console.log(`\n   รวม ${orphan.length} รอบ · ${boxes} กล่อง · จ่ายเงินแล้ว ${paid} ใบ`);
console.log(`\n⛑️  ทุกเคสต้องมีคนไล่ถามลูกค้าว่า "ได้ของหรือยัง" — ห้ามปิดเงียบเอง\n`);
process.exitCode = 1;

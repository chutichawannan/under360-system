#!/usr/bin/env node
/**
 * หา "รอบที่กำลังจะถึง แต่ยังไม่มีเมนู" = รอบที่ฟ้ายังไม่ได้จ่าย ต้องจ่ายก่อนวันผลิต
 *
 *   node scripts/fah_check_orphan_rounds.mjs [มองไปข้างหน้ากี่วัน=10]
 *
 * ⚠️ เวอร์ชันแรก (28 ส.ค. 2026) มองย้อนหลัง แล้ว **แจ้งเตือนผิด** — นัทตีกลับเอง:
 *   *"มันไปค้างกับนายได้ยังไง ในเมื่อวันรับของมันเลยมาชาตินึงแล้ว แปลว่ากิ๊ฟจัดการไปหมดแล้ว"*
 *   บทเรียน: **"ไม่มีเมนูบันทึกไว้" ≠ "ลูกค้าไม่ได้ของ"**
 *   ของเก่าหลายรอบแอดมินจัดมือไปแล้ว ระบบไม่ได้บันทึก — ย้อนหลังจึงตรวจไม่ได้ด้วยข้อมูลที่มี
 *   → ตัวเฝ้าต้อง **มองไปข้างหน้าเท่านั้น** เพราะของข้างหน้าคือของที่ยังแก้ทัน
 *   (คู่กับบทเรียนของ u-maintainer: สัญญาณที่เตือนของที่แก้ไม่ได้ = ไม่มีใครเชื่อภายในสัปดาห์เดียว)
 */
const AHEAD = Number(process.argv[2] || 10);
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

const q = async p => {
  const r = await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: 'Bearer ' + K } });
  if (!r.ok) { console.error('❌ query ล้มเหลว', r.status, await r.text()); process.exit(1); }
  return r.json();
};
const nowTH = new Date(Date.now() + 7 * 3600 * 1000);
const today = nowTH.toISOString().slice(0, 10);
const until = new Date(nowTH.getTime() + AHEAD * 86400000).toISOString().slice(0, 10);

const rows = await q(`mp_deliveries?select=id,order_id,customer_name,mp_type,round_no,total_rounds,delivery_date,box_count,status,menu_items&delivery_date=gte.${today}&delivery_date=lte.${until}&order=delivery_date.asc&limit=300`);
const live = rows.filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested');
const empty = live.filter(r => !(Array.isArray(r.menu_items) && r.menu_items.length));

console.log(`\n🔎 รอบที่จะถึงใน ${AHEAD} วัน (${today} → ${until})`);
console.log(`   ทั้งหมด ${live.length} รอบ · ยังไม่มีเมนู ${empty.length} รอบ\n`);

if (!empty.length) { console.log('✅ ทุกรอบที่จะถึงมีเมนูครบแล้ว\n'); process.exit(0); }

const ids = [...new Set(empty.map(r => r.order_id).filter(Boolean))];
const ords = ids.length ? await q(`orders?select=id,order_number,payment_status,customer_phone&id=in.(${ids.join(',')})&limit=200`) : [];
const om = Object.fromEntries(ords.map(o => [o.id, o]));

let boxes = 0;
for (const r of empty) {
  const o = om[r.order_id];
  const left = Math.round((new Date(r.delivery_date) - new Date(today)) / 86400000);
  boxes += r.box_count || 0;
  console.log(`   · ${r.delivery_date} (อีก ${left} วัน) — ${r.customer_name}`);
  console.log(`     ${String(r.mp_type).toUpperCase()} r${r.round_no}/${r.total_rounds} · ${r.box_count || '?'} กล่อง · ${r.status}` +
    (o ? ` · ${o.order_number}${o.payment_status === 'paid' ? ' · จ่ายแล้ว' : ' · ' + o.payment_status}` : ' · ⚠️ ไม่มีใบ'));
}
console.log(`\n   รวม ${empty.length} รอบ · ${boxes} กล่อง`);
console.log(`\n⛑️  ต้องจ่ายเมนูให้ครบก่อนถึงวันผลิต — รอบที่เหลือ 0-1 วันคือด่วนที่สุด\n`);
process.exitCode = 1;

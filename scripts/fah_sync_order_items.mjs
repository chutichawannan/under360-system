#!/usr/bin/env node
/**
 * ทำให้ order_items ตรงกับ mp_deliveries.menu_items ทุกรอบ
 *
 *   node scripts/fah_sync_order_items.mjs            ดูอย่างเดียว
 *   node scripts/fah_sync_order_items.mjs --write    เขียนจริง
 *
 * ทำไมต้องมี (บทเรียน 27-30 ส.ค. 2026):
 *   เมนูถูกเก็บ 2 ที่ — `mp_deliveries.menu_items` (หน้าแพลนอ่าน) กับ `order_items` (หน้าครัว KQ อ่าน)
 *   **KQ อ่าน order_items เป็นหลัก** ทางสำรองไป mp_deliveries ยิงเฉพาะตอน order_items ว่างเปล่า
 *   → เขียนที่เดียว = ครัวมองไม่เห็นเมนู (เกิดจริงกับเคสกวาง และเคส Milk 14 ส.ค.)
 *
 * กฎ:
 *  · เขียนลงใบของรอบนั้นเท่านั้น (order ที่ delivery_date ตรงกับรอบ)
 *  · ไม่แตะบรรทัดคุม MP-* (ไม่ใช่อาหาร)
 *  · insert ให้สำเร็จก่อน แล้วค่อยลบของเก่าที่ค้างผิดใบ
 */
const WRITE = process.argv.includes('--write');
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: H })).json();

const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const rows = (await q(`mp_deliveries?select=id,order_id,customer_name,mp_type,round_no,total_rounds,delivery_date,box_count,status,menu_items&delivery_date=gte.${today}&order=delivery_date.asc&limit=300`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested' && Array.isArray(r.menu_items) && r.menu_items.length);

const ids = [...new Set(rows.map(r => r.order_id).filter(Boolean))];
const oi = [];
for (let i = 0; i < ids.length; i += 50) oi.push(...await q(`order_items?select=id,order_id,menu_code,notes&order_id=in.(${ids.slice(i, i + 50).join(',')})&limit=1000`));
const byOrder = {};
oi.forEach(x => { (byOrder[x.order_id] = byOrder[x.order_id] || []).push(x); });

const isFood = x => !/^MP-/.test(String(x.menu_code || ''));
let add = 0, del = 0;
for (const r of rows) {
  if (!r.order_id) { console.log(`⚠️ ${r.delivery_date} ${r.customer_name} — ไม่มีใบผูกอยู่ ข้าม`); continue; }
  const tag = `r${r.round_no}/${r.total_rounds}`;
  // ⚠️ 1 ใบอาจมี 2 คอร์ส (HP+LC) ส่งวันเดียวกัน — เจอจริงเคส Peachyz 31 ส.ค.
  // ถ้าไม่แยกด้วยหัวโค้ด LC/HP จะไปลบเมนูของอีกคอร์สทิ้ง → ลูกค้าได้ของไม่ครบ
  const pre = r.mp_type === 'lc' ? 'LC' : 'HP';
  const all = (byOrder[r.order_id] || []).filter(isFood).filter(x => String(x.menu_code || '').startsWith(pre));
  const mine = all.filter(x => String(x.notes || '').includes(tag));
  const wantCodes = r.menu_items.map(i => String(i.code));
  const haveCodes = mine.map(x => String(x.menu_code));
  const same = wantCodes.length === haveCodes.length && wantCodes.every(c => haveCodes.includes(c));
  const strays = all.filter(x => !String(x.notes || '').includes(tag));   // ของรอบอื่นที่ค้างอยู่ในใบนี้
  if (same && !strays.length) continue;

  console.log(`${r.delivery_date}  ${r.customer_name.slice(0, 24).padEnd(26)} ${r.mp_type.toUpperCase()} ${tag}` +
    (same ? '' : `  ➕ ต้องเขียน ${wantCodes.length} แถว (มีอยู่ ${mine.length})`) +
    (strays.length ? `  🧹 ของรอบอื่นค้างในใบนี้ ${strays.length} แถว` : ''));
  if (!WRITE) continue;

  if (!same) {
    if (mine.length) {
      const r1 = await fetch(`${U}/rest/v1/order_items?id=in.(${mine.map(x => x.id).join(',')})`, { method: 'DELETE', headers: H });
      if (r1.status >= 300) { console.log('   ❌ ลบของเดิมไม่สำเร็จ', r1.status); continue; }
    }
    const body = r.menu_items.map(i => ({
      order_id: r.order_id, menu_item_id: null, menu_code: String(i.code), menu_name: i.name || String(i.code),
      quantity: Number(i.qty) || 1, unit_price: 0, subtotal: 0, notes: `meal_plan:box:${tag}`,
    }));
    const r2 = await fetch(`${U}/rest/v1/order_items`, { method: 'POST', headers: H, body: JSON.stringify(body) });
    if (r2.status >= 300) { console.log('   ❌ เขียนไม่สำเร็จ', r2.status, (await r2.text()).slice(0, 140)); continue; }
    add += body.length;
  }
  if (strays.length) {
    const r3 = await fetch(`${U}/rest/v1/order_items?id=in.(${strays.map(x => x.id).join(',')})`, { method: 'DELETE', headers: H });
    if (r3.status >= 300) console.log('   ⚠️ ลบของค้างไม่สำเร็จ', r3.status);
    else del += strays.length;
  }
}
console.log('\n' + (WRITE ? `✅ เขียนเพิ่ม ${add} แถว · ลบของค้างผิดใบ ${del} แถว` : 'ยังไม่เขียนอะไร') + '\n');

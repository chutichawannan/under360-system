#!/usr/bin/env node
/**
 * ปิดใบทดสอบที่ค้างอยู่ในวันส่งจริง — P-track 6 ส.ค. 2026
 *
 * ที่มา: นัทกดเทสสั่งผ่าน LIFF/OH หลายใบ แล้วใบเหล่านั้นค้างในวันที่ 6-7 ส.ค.
 *        → ครัวจะเห็นในหน้า KQ แล้วทำอาหารทิ้งจริง
 *
 * ⚠️ ข้อจำกัดที่ต้องรู้: anon **ลบ orders ไม่ได้** (ไม่มี RLS policy สำหรับ DELETE
 *    — ยิง DELETE จะได้ 200/204 แต่แถวไม่หาย) → ใช้ status='cancelled' แทน
 *    ทุกหน้า (KQ/แมส/รายงาน) กรอง cancelled ออกอยู่แล้ว
 *
 * 🔒 กันพลาด: ไม่ปิดใบไหนก็ตามที่ "ไม่เข้าเกณฑ์ใบเทส" อย่างน้อย 1 ข้อ
 *    แม้จะถูกระบุชื่อมาในลิสต์ก็ตาม — ชื่อลูกค้าจริงเคยโผล่ในใบเทสมาแล้ว
 *
 * ใช้:  node scripts/cancel_test_orders.mjs            (ดูอย่างเดียว ไม่แตะข้อมูล)
 *       node scripts/cancel_test_orders.mjs --apply    (ปิดจริง)
 */

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const HW = { ...H, 'Content-Type': 'application/json', Prefer: 'return=representation' };

const APPLY = process.argv.includes('--apply');
const SHOP_PHONE = '0846556601';          // เบอร์พร้อมเพย์ของร้าน — ใช้ตอนเทสเท่านั้น
const FAKE_PHONE = /^0(1{9}|9{9}|0{9})$/; // 0111111111 ฯลฯ

// ใบที่สงสัย (CC ส่งมา + ที่ผมสแกนเจอเพิ่ม)
const SUSPECT = [
  'U-ODTEST-1',
  'U-0806-001',
  'U-0807-001', 'U-0807-002', 'U-0807-003',
  'U-0807-004', 'U-0807-005', 'U-0807-006', 'U-0807-007',
  // ↓ P สแกนกว้างเจอเพิ่ม (CC ไม่ได้ระบุมา — นัทเทสต่อหลังส่งลิสต์)
  'U-0808-001', 'U-0808-002', 'U-0810-001',
  // ↓ รอบ 8 ส.ค. — นัทเทสเพิ่มอีก · U-0808-003 ส่งวันนี้ 18 กล่อง ครัวจะทำจริง
  'U-0808-003',
];

// เกณฑ์ใบเทส — เข้าอย่างน้อย 1 ข้อถึงจะแตะ
function testReasons(o) {
  const why = [];
  const phone = String(o.customer_phone || '');
  const blob = `${o.customer_name || ''} ${o.created_by || ''} ${o.notes || ''}`;
  if (FAKE_PHONE.test(phone)) why.push('เบอร์ปลอม');
  if (phone === SHOP_PHONE) why.push('เบอร์ร้านเอง');
  if (/เทส|ทดสอบ|test/i.test(blob)) why.push('มีคำว่าเทส');
  if (/^(parallel_test)$/.test(String(o.source || ''))) why.push('source=parallel_test');
  if (/^[ก-ฮ]{2,8}$/.test(String(o.delivery_address || '').trim())) why.push('ที่อยู่มั่ว');
  return why;
}

const rows = await (await fetch(
  `${SB}/orders?select=id,order_number,customer_name,customer_phone,delivery_date,total,status,source,created_by,notes,delivery_address&order_number=in.(${SUSPECT.join(',')})`,
  { headers: H })).json();

console.log(`โหมด: ${APPLY ? '🔴 ปิดจริง' : '👀 ดูอย่างเดียว (ใส่ --apply เพื่อปิดจริง)'}`);
console.log(`ใบที่สงสัย ${SUSPECT.length} · เจอใน DB ${rows.length}\n`);

let done = 0, skipped = 0;
for (const o of rows) {
  const why = testReasons(o);
  const head = `${o.order_number.padEnd(14)} ${String(o.customer_name || '').slice(0, 22).padEnd(24)} ฿${String(o.total).padStart(6)} ส่ง ${o.delivery_date}`;

  if (!why.length) { console.log(`⏭️  ข้าม (ไม่เข้าเกณฑ์ใบเทส) ${head}`); skipped++; continue; }
  if (o.status === 'cancelled') { console.log(`✔️  ปิดอยู่แล้ว          ${head} · ${why.join('+')}`); continue; }
  if (!APPLY) { console.log(`🔎 จะปิด                ${head} · ${why.join('+')}`); done++; continue; }

  const res = await fetch(`${SB}/orders?id=eq.${o.id}`, {
    method: 'PATCH', headers: HW,
    body: JSON.stringify({
      status: 'cancelled',
      source: 'parallel_test',
      notes: `[ใบเทส · P ปิด 6 ส.ค. ก่อน cutover — ${why.join('+')}] ${String(o.notes || '').slice(0, 120)}`,
      updated_at: new Date().toISOString(),
    }),
  });
  console.log(`${res.ok ? '✅ ปิดแล้ว' : '❌ ล้มเหลว'}              ${head} · ${why.join('+')}`);
  if (res.ok) done++;
}

console.log(`\nสรุป: ${APPLY ? 'ปิดไป' : 'จะปิด'} ${done} ใบ · ข้าม ${skipped} ใบ`);

// ตรวจซ้ำ: ยังมีใบเทสค้างในวันส่งจริงอีกไหม (สแกนกว้าง ไม่จำกัดแค่ลิสต์)
const future = await (await fetch(
  `${SB}/orders?select=order_number,customer_name,customer_phone,delivery_date,status,created_by,notes,delivery_address,source&delivery_date=gte.2026-08-06&status=neq.cancelled&limit=500`,
  { headers: H })).json();
const left = future.filter((o) => testReasons(o).length);
console.log(`\n🔍 สแกนซ้ำทุกใบตั้งแต่ 6 ส.ค. (${future.length} ใบ) → ใบเทสที่ยังไม่ถูกปิด: ${left.length}`);
left.forEach((o) => console.log(`   🔴 ${o.delivery_date} ${o.order_number} ${o.customer_name} · ${testReasons(o).join('+')}`));

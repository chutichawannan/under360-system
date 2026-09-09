/* ═══════════════════════════════════════════════════════════════════
   ตรวจ "วันในใบ ≠ วันของรอบ" ของ Meal Plan

   ทำไมมี (9 ก.ย. 2569 · เคส 03):
     วันส่งเก็บไว้ 2 ที่ ไม่ผูกกัน
       orders.delivery_date          ← หน้าออเดอร์ · แมส · หน้าครัว อ่านอันนี้
       mp_deliveries.delivery_date   ← ใบงานครัวรายรอบ อ่านอันนี้
     ต่างกันเมื่อไหร่ = ลูกค้าโผล่หน้าหนึ่ง หายอีกหน้าหนึ่ง **เงียบสนิท ไม่มี error**
     นัทจับได้เองจากหน้าออเดอร์ · โดนจริง 4 ราย รายหนึ่งค้าง 8 วัน

   พี่ปืนถามว่า "มีอะไรกันไม่ให้เพี้ยนอีกโดยไม่มีใครรู้ไหม" — นี่คือตัวนั้น
   🔒 อ่านอย่างเดียว ไม่แก้อะไรเลย (นัทสั่ง "หาสาเหตุอย่างเดียว ห้ามแก้")

   รัน:  node scripts/u/check_mp_date_mismatch.mjs
        node scripts/u/check_mp_date_mismatch.mjs --all   (รวมของที่ผ่านไปแล้ว)

   คืนรหัสล้มเหลวเมื่อเจอของที่ยังแก้ทัน — เอาไปต่อ watchdog ได้
   ═══════════════════════════════════════════════════════════════════ */

const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: K, Authorization: 'Bearer ' + K };
const NL = String.fromCharCode(10);
const showAll = process.argv.includes('--all');
const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

/* 🔴 ต้องไล่ทีละหน้า — ขอเปล่า ๆ ได้แค่ 1,000 แถว แล้วสรุปผิดแบบเงียบ */
async function all(pathBase) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(U + pathBase, { headers: Object.assign({ Range: from + '-' + (from + 999) }, H) });
    if (!r.ok) throw new Error(pathBase + ' → ' + r.status + ' ' + await r.text());
    const j = await r.json();
    if (!Array.isArray(j) || !j.length) break;
    rows.push(...j);
    if (j.length < 1000) break;
  }
  return rows;
}

const mp = await all('/mp_deliveries?select=id,customer_name,mp_type,round_no,total_rounds,delivery_date,status,order_id&order=delivery_date.asc');
const linked = mp.filter((r) => r.order_id && r.status !== 'cancelled' && r.delivery_date);

/* ดึงใบเฉพาะที่ถูกอ้างถึงจริง — ทีละก้อน กัน URL ยาวเกิน */
const ids = [...new Set(linked.map((r) => r.order_id))];
const orders = {};
for (let i = 0; i < ids.length; i += 60) {
  const chunk = ids.slice(i, i + 60);
  const r = await fetch(U + '/orders?select=id,order_number,customer_name,delivery_date,status&id=in.(' + chunk.join(',') + ')', { headers: H });
  const j = await r.json();
  (Array.isArray(j) ? j : []).forEach((o) => { orders[o.id] = o; });
}

const bad = [], orphan = [];
for (const r of linked) {
  const o = orders[r.order_id];
  if (!o) { orphan.push(r); continue; }          // รอบชี้ไปที่ใบที่ไม่มีอยู่แล้ว
  if (o.status === 'cancelled') continue;
  if (o.delivery_date !== r.delivery_date) bad.push({ r, o });
}

/* ⚠️ แยกยุค Hato ออกก่อนเสมอ
   ใบ HT- คือของที่ย้ายเข้ามาจากระบบเก่า เพี้ยนวันละ 1 วันเป็นระบบทั้งก้อน (1,549 รอบ)
   ไม่ใช่บั๊กของระบบเรา และแก้ย้อนหลังไม่ได้ — ถ้านับรวมจะได้เลขหลักพันที่ทำให้ตกใจเปล่า ๆ
   แล้วคนจะเลิกเชื่อตัวตรวจนี้ ซึ่งอันตรายกว่าไม่มีตัวตรวจ */
const isOurs = (x) => /^U-/i.test(String(x.o.order_number || ''));
const hato = bad.filter((x) => !isOurs(x));
const ours = bad.filter(isOurs);
const future = ours.filter((x) => x.r.delivery_date >= today || x.o.delivery_date >= today);
const past = ours.filter((x) => !(x.r.delivery_date >= today || x.o.delivery_date >= today));

console.log(NL + 'ตรวจรอบทั้งหมด ' + mp.length + ' · ที่ผูกกับใบและยังไม่ยกเลิก ' + linked.length + ' · วันนี้ ' + today);
console.log('วันไม่ตรงกันทั้งหมด ' + bad.length + ' รอบ');
console.log('  · ระบบเรา (ใบ U-) ' + ours.length + ' รอบ — 🔴 ยังแก้ทัน ' + future.length + ' · ⚪ ผ่านแล้ว ' + past.length);
console.log('  · ยุค Hato (ใบ HT-) ' + hato.length + ' รอบ — ของที่ย้ายเข้ามา เพี้ยนเป็นระบบ ไม่ใช่บั๊กเรา แก้ย้อนหลังไม่ได้');
if (orphan.length) console.log('  · ⚠️ รอบที่ชี้ไปใบที่หาไม่เจอ ' + orphan.length);

const show = (list) => list.forEach(({ r, o }) => {
  console.log('  ' + (r.delivery_date >= today || o.delivery_date >= today ? '🔴' : '⚪')
    + ' ' + String(r.customer_name || '-').slice(0, 24).padEnd(24)
    + ' ' + String(r.mp_type || '').toUpperCase().padEnd(3)
    + ' รอบ ' + r.round_no + '/' + r.total_rounds
    + '  ครัวเห็นวัน ' + r.delivery_date
    + '  แต่ใบ ' + o.order_number + ' ลงวัน ' + o.delivery_date
    + '  (' + o.status + ')');
});

if (future.length) { console.log(NL + '🔴 ยังแก้ทัน — ลูกค้ากลุ่มนี้เสี่ยงไม่ได้ของ หรือได้ผิดวัน'); show(future); }
else console.log(NL + '✅ ไม่มีรอบข้างหน้าที่วันเพี้ยน');

if (past.length) {
  if (showAll) { console.log(NL + '⚪ ผ่านไปแล้ว (แก้ไม่ได้ ดูเป็นสถิติ)'); show(past); }
  else console.log(NL + '(ของที่ผ่านไปแล้ว ' + past.length + ' รอบ — ใส่ --all เพื่อดู)');
}
if (orphan.length) {
  console.log(NL + '⚠️ รอบที่ผูกกับใบที่หาไม่เจอแล้ว ' + orphan.length + ' รอบ (ใบถูกลบ?)');
  orphan.slice(0, 10).forEach((r) => console.log('  · ' + r.delivery_date + ' ' + r.customer_name + ' รอบ ' + r.round_no + '/' + r.total_rounds));
}

process.exitCode = future.length ? 1 : 0;

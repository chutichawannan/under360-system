/* ═══════════════════════════════════════════════════════════════════
   ตรวจ "ลูกค้าคนเดียว วันเดียว ได้ของ 2 รอบ" ใน Meal Plan

   ทำไมมี (9 ก.ย. 2569):
     เจอว่าคุณโอ๋มีใบส่ง 2 ใบวันเดียวกัน (รอบ 6/12 + รอบ 8/12 · รวม 16 กล่อง
     ทั้งที่รอบละ 7) — เกิดจาก **ห้อง u เปิดใบเก็บรอบที่ขาดเอง** แล้วไม่มี
     อะไรกันใบซ้ำ · กว่าจะเจอต้องไล่ดูทั้งตาราง 1,939 แถวด้วยมือ

     พี่ปืนสั่งว่า "อย่าให้ต้องมาไล่ตรวจ 1,939 แถวอีก" → เลยทำเป็นตัวรันซ้ำได้
     แทนที่จะจดเป็นตัวหนังสือในเอกสารที่ไม่มีใครเปิด

   🔒 อ่านอย่างเดียว ไม่แก้อะไรทั้งสิ้น — ตั้งใจให้เป็นแบบนี้
      ข้อมูลบอกได้แค่ "มี 2 ใบ" บอกไม่ได้ว่าลูกค้าตั้งใจรวบ 2 รอบมารับวันเดียวไหม
      ยุบเองแล้วเขาตั้งใจจริง = ลูกค้าได้ของขาด 7 กล่อง → ต้องถามคนก่อนเสมอ

   รัน:  node scripts/u/check_mp_double_booking.mjs
        node scripts/u/check_mp_double_booking.mjs --all    (รวมของที่ผ่านไปแล้ว)

   อ่านผลยังไง:
     🔴 ยังไม่ถึง = แก้ทัน · ถามลูกค้าก่อน แล้วค่อยย้ายวัน/ปิดใบ
     ⚪ ผ่านแล้ว  = ส่งไปแล้ว แก้ไม่ได้ ดูไว้เป็นสถิติเฉย ๆ
     ⚠️ แถวยุค Hato มักเก็บเป็น รอบ N/N (1/1, 5/5) — ลูกค้าสั่ง 2 ใบจริงในวันเดียว
        ก็ขึ้นตรงนี้ได้ **ไม่ใช่ทุกกรณีคือความผิดพลาด**
   ═══════════════════════════════════════════════════════════════════ */

const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: K, Authorization: 'Bearer ' + K };
const NL = String.fromCharCode(10);
const showAll = process.argv.includes('--all');

/* วันนี้ตามเวลาไทยเสมอ — เครื่องที่รันอาจอยู่คนละโซน (นัทอยู่ PST) */
const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

/* 🔴 ต้องไล่ทีละหน้า — ขอเปล่า ๆ ได้แค่ 1,000 แถว แล้วสรุปผิดแบบเงียบ
   (กับดักประจำบ้าน: ตารางนี้มี 1,939 แถว ถ้าไม่ไล่จะมองไม่เห็นครึ่งหลัง) */
async function fetchAll() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(
      U + '/mp_deliveries?select=customer_name,mp_type,mp_set,round_no,total_rounds,' +
          'delivery_date,status,box_count,order_id&order=delivery_date.asc',
      { headers: Object.assign({ Range: from + '-' + (from + 999) }, H) });
    if (!r.ok) throw new Error('อ่าน mp_deliveries ไม่ได้: ' + r.status + ' ' + await r.text());
    const j = await r.json();
    if (!Array.isArray(j) || !j.length) break;
    rows.push(...j);
    if (j.length < 1000) break;
  }
  return rows;
}

const all = await fetchAll();
const live = all.filter((r) => r.status !== 'cancelled' && r.delivery_date);

const groups = {};
for (const r of live) {
  const key = r.customer_name + '|' + r.delivery_date + '|' + (r.mp_type || '');
  (groups[key] = groups[key] || []).push(r);
}
const dups = Object.entries(groups).filter(([, v]) => v.length > 1);
const future = dups.filter(([k]) => k.split('|')[1] >= today);
const past = dups.filter(([k]) => k.split('|')[1] < today);

console.log(NL + 'ตรวจ ' + all.length + ' แถว (ไม่นับที่ยกเลิกแล้ว ' + live.length + ')  · วันนี้ ' + today);
console.log('ซ้อนกันทั้งหมด ' + dups.length + ' กรณี — 🔴 ยังไม่ถึง ' + future.length + ' · ⚪ ผ่านแล้ว ' + past.length);

const show = (list) => {
  for (const [key, v] of list) {
    const [name, date, type] = key.split('|');
    const boxes = v.reduce((s, x) => s + Number(x.box_count || 0), 0);
    console.log('  ' + (date >= today ? '🔴' : '⚪') + ' ' + date + ' · ' + name
      + ' · ' + String(type).toUpperCase()
      + ' · รอบ ' + v.map((x) => x.round_no + '/' + x.total_rounds).join(' + ')
      + ' · รวม ' + boxes + ' กล่อง');
  }
};

if (future.length) {
  console.log(NL + '🔴 ยังแก้ทัน — ถามลูกค้าก่อนว่าตั้งใจรับรวบวันเดียวไหม');
  show(future);
} else {
  console.log(NL + '✅ ไม่มีรอบข้างหน้าที่ซ้อนกัน');
}

if (showAll && past.length) {
  console.log(NL + '⚪ ผ่านไปแล้ว (ดูเป็นสถิติ แก้ไม่ได้)');
  show(past);
} else if (past.length) {
  console.log(NL + '(ของที่ผ่านไปแล้ว ' + past.length + ' กรณี — ใส่ --all เพื่อดู)');
}

/* ปิดท้ายด้วยของที่เอาไปทำต่อได้จริง ไม่ใช่แค่จำนวน */
process.exit(future.length ? 1 : 0);

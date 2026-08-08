// เช็คว่า line_uid ที่ได้จาก LIFF ของเรา = คนละชุดกับ uid ยุค Hato หรือไม่
// (LINE ออก user id แยกตาม "provider" — ถ้าคนเดียวกันมี 2 uid = คนละ provider จริง)
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const get = async (q) => (await fetch(B + q, { headers: H })).json();
const norm = (p) => String(p || '').replace(/\D/g, '').slice(-9);

// 1) ออเดอร์ระบบเราเอง (U-) ที่มี line_uid = uid จาก LIFF ของเรา
const mine = await get('orders?select=order_number,line_uid,customer_phone,created_at&order_number=like.U-*&line_uid=not.is.null&order=created_at.desc&limit=300');
console.log('ออเดอร์ระบบเรา (U-) ที่มี line_uid : ' + mine.length);

// 2) ออเดอร์ยุค Hato (HT-) ที่มี line_uid = uid จาก provider ของ Hato
const hato = [];
for (let off = 0; off < 12000; off += 1000) {
  const b = await get(`orders?select=line_uid,customer_phone&order_number=like.HT-*&line_uid=not.is.null&order=created_at.desc&limit=1000&offset=${off}`);
  if (!Array.isArray(b) || !b.length) break;
  hato.push(...b);
  if (b.length < 1000) break;
}
console.log('ออเดอร์ยุค Hato (HT-) ที่มี line_uid : ' + hato.length);

// 3) จับคู่ด้วยเบอร์ 9 หลักท้าย
const hatoByPhone = new Map();
for (const o of hato) { const p = norm(o.customer_phone); if (p.length === 9) (hatoByPhone.get(p) || hatoByPhone.set(p, new Set()).get(p)).add(o.line_uid); }

let same = 0, diff = 0, nomatch = 0;
const examples = [];
for (const o of mine) {
  const p = norm(o.customer_phone);
  const set = hatoByPhone.get(p);
  if (!p || !set) { nomatch++; continue; }
  if (set.has(o.line_uid)) same++;
  else { diff++; if (examples.length < 5) examples.push(`${o.order_number}  เบอร์…${p.slice(-4)}  LIFF=${o.line_uid.slice(0, 8)}…  Hato=${[...set][0].slice(0, 8)}…`); }
}

console.log('');
console.log('เบอร์เดียวกัน uid ตรงกัน   : ' + same);
console.log('เบอร์เดียวกัน uid ไม่ตรง   : ' + diff);
console.log('ไม่เคยสั่งยุค Hato         : ' + nomatch);
if (examples.length) { console.log('\nตัวอย่าง:'); examples.forEach((e) => console.log('  ' + e)); }
console.log('');
console.log(diff > 0 && same === 0
  ? '🔴 สรุป: uid คนละชุดจริง → push ด้วย uid จาก LIFF เราไปที่ OA ของ Hato "ไม่ผ่าน"'
  : same > 0 && diff === 0
    ? '🟢 สรุป: uid ชุดเดียวกัน → push ได้ปกติ'
    : '🟡 สรุป: ข้อมูลไม่พอฟันธง (ยังไม่มีลูกค้าที่สั่งทั้ง 2 ยุคด้วยเบอร์เดียวกัน) → ต้องเทสยิงจริง 1 ใบ');

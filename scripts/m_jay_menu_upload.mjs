/* อัปรูปเมนูเจ 19 ใบขึ้น Supabase Storage (8 ก.ย. 2026)

   ห้องเจส่งรูปฉากขาวมาที่ .scratch/jay/final30/ — ใบละ ~2MB เอาขึ้นเว็บดิบไม่ได้
   อัปขึ้น Storage แล้วให้ตัวย่อของ Supabase ทำ WebP ตามขนาดที่ใช้จริง (ทางเดียวกับรูปของแถม)

   ⚠️ ตรวจไบต์แรกทุกไฟล์ก่อนอัป — เคยเจอไฟล์ .jpg ที่จริงเป็นหน้า error HTML
   รันซ้ำได้ (upsert) */
import fs from 'fs';

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const BASE = 'https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/object/menu-images/jay-v5/menu/';
const D = '.scratch/jay/final30/';

/* เฉพาะรูปฉากขาวที่แต่งแล้ว — 3 ไฟล์ .jpg (J03/J27/J28) เป็นรูปดิบ ยังไม่แต่ง ไม่เอาขึ้น
   เอาขึ้นแล้วจะดูคนละชุดกับที่เหลือ แย่กว่าไม่มีรูป */
const files = fs.readdirSync(D).filter(f => f.endsWith('.png'));
console.log('รูปฉากขาวที่แต่งแล้ว ' + files.length + ' ใบ\n');

let n = 0;
for (const f of files.sort()) {
  const code = f.slice(0, 3);
  if (!/^J\d\d$/.test(code)) { console.error('🔴 ชื่อไฟล์ไม่ขึ้นต้นด้วยรหัส: ' + f); process.exit(1); }
  const buf = fs.readFileSync(D + f);
  if (!(buf[0] === 0x89 && buf[1] === 0x50)) { console.error('🔴 ไม่ใช่ PNG จริง: ' + f); process.exit(1); }

  const r = await fetch(BASE + code + '.png?upsert=true', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEY, apikey: KEY, 'Content-Type': 'image/png' },
    body: buf,
  });
  if (!r.ok) { console.error('🔴 อัปไม่ขึ้น ' + code + ' → ' + r.status + ' ' + (await r.text()).slice(0,120)); process.exit(1); }
  n++;
  console.log('  ✅ ' + code + '  ' + String(Math.round(buf.length/1024)).padStart(5) + 'KB → ' + code + '.png');
}
console.log('\nอัปแล้ว ' + n + ' ใบ');

/* พิสูจน์ว่าตัวย่อทำงานจริง ไม่ใช่แค่อัปขึ้นได้ */
const T = 'https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/render/image/public/menu-images/jay-v5/menu/';
console.log('\nขนาดหลังผ่านตัวย่อ (ที่ลูกค้าโหลดจริง):');
for (const w of [340, 560]) {
  const r = await fetch(T + 'J01.png?width=' + w + '&quality=72', { headers: { Accept: 'image/webp,*/*' } });
  console.log('  width=' + w + ' → ' + Math.round((+r.headers.get('content-length')||0)/1024) + 'KB ' + r.headers.get('content-type'));
}

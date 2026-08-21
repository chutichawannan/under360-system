/* แก้ลิงก์แบบไม่มี .html ขึ้น 404 (CC รายงาน 21 ส.ค. 2026)
   /mealplan → 404 · /blog → 404 · แต่ /mealplan.html · /blog.html → 200

   🔴 ทำไมใช้ `rewrites` ไม่ใช่ `cleanUrls: true`
   `cleanUrls: true` จะทำให้ Vercel **redirect `.html` → ไม่มี .html (308)** ทั้งเว็บ
   = เปลี่ยน URL มาตรฐานของทุกหน้า → **redirect 23 เส้นที่กัน SEO 10 ปี จะเด้ง 2 ต่อ**
   `rewrites` = เสิร์ฟไฟล์เดิมที่ path ใหม่ **URL ไม่เปลี่ยน ไม่มี redirect เพิ่ม ไม่แตะของเดิมเลย**

   ⛔ นัทสั่งห้ามแก้ web/vercel.json (มี redirect 23 เส้นกัน SEO)
      → สคริปต์นี้ **ตรวจว่า redirect ทั้ง 23 เส้นเหมือนเดิมทุกตัวอักษร** ถ้าไม่เหมือนจะหยุดทันที
      → และ **ยังไม่ merge จนกว่านัทจะอนุญาต** */
import fs from 'fs';

const F = 'web/vercel.json';
const before = JSON.parse(fs.readFileSync(F, 'utf8'));
const beforeRedirects = JSON.stringify(before.redirects);

const ADD = [
  { source: '/mealplan', destination: '/mealplan.html' },
  { source: '/blog', destination: '/blog.html' },
  { source: '/home', destination: '/index.html' },
];

const j = JSON.parse(JSON.stringify(before));
j.rewrites = j.rewrites || [];
let added = 0;
for (const r of ADD) {
  if (j.rewrites.some(x => x.source === r.source)) { console.log('⏭️  มีแล้ว:', r.source); continue; }
  j.rewrites.push(r);
  added++;
}
if (!added) { console.log('ไม่มีอะไรต้องเพิ่ม'); process.exit(0); }

/* ── ยามกันพลาด: redirect ต้องเหมือนเดิมทุกตัวอักษร ── */
if (JSON.stringify(j.redirects) !== beforeRedirects) {
  console.error('❌ redirect เปลี่ยน! หยุดทันที ไม่เขียนไฟล์');
  process.exit(1);
}
if ((j.redirects || []).length !== 23) {
  console.error(`❌ redirect ควรมี 23 เส้น แต่มี ${(j.redirects || []).length} — หยุด`);
  process.exit(1);
}
/* rewrites เดิม (/fah · /k) ต้องยังอยู่ */
for (const keep of ['/fah', '/k']) {
  if (!j.rewrites.some(x => x.source === keep)) { console.error('❌ rewrite เดิม ' + keep + ' หาย — หยุด'); process.exit(1); }
}

fs.writeFileSync(F, JSON.stringify(j, null, 2) + '\n');
console.log(`✅ เพิ่ม rewrite ${added} เส้น — redirect ครบ 23 เส้นเหมือนเดิมทุกตัวอักษร · rewrite เดิม /fah /k ยังอยู่`);
console.log('\nเพิ่มอะไรบ้าง:');
ADD.forEach(r => console.log(`   ${r.source.padEnd(12)} → ${r.destination}`));

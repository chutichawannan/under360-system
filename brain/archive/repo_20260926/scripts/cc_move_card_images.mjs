// ย้ายรูปการ์ดหน้าแรกที่ฝัง base64 ในฐานข้อมูล → Supabase Storage (bucket menu-images)
// นัทเคาะ 7 ส.ค. 2026 — หน้า LIFF หนัก 598 KB/เปิด โดย 88% มาจากการ์ด 3 ใบนี้
// ปลอดภัย: สำรอง base64 เดิมลงไฟล์ก่อน · รูปที่ลูกค้าเห็นเหมือนเดิมทุกพิกเซล (ไฟล์เดียวกัน แค่ย้ายที่เก็บ)
// รัน dry-run: node scripts/cc_move_card_images.mjs   |   รันจริง: --apply
import fs from 'node:fs';

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const HOST = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const B = HOST + '/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const APPLY = process.argv.includes('--apply');
const BUCKET = 'menu-images';

const cards = await (await fetch(B + 'home_layout?select=section_key,title,bg_image', { headers: H })).json();
const embedded = cards.filter(c => (c.bg_image || '').startsWith('data:'));

console.log('การ์ดทั้งหมด ' + cards.length + ' ใบ · ฝัง base64 อยู่ ' + embedded.length + ' ใบ\n');
if (!embedded.length) { console.log('ไม่มีอะไรต้องย้าย'); process.exit(0); }

for (const c of embedded) {
  const m = (c.bg_image || '').match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!m) { console.log('⚠️ ' + c.title + ' — รูปแบบไม่ตรง ข้าม'); continue; }
  const [, mime, b64] = m;
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const bytes = Buffer.from(b64, 'base64');
  const path = 'card_' + c.section_key + '.' + ext;
  console.log(c.title.padEnd(22) + ' ' + Math.round(bytes.length / 1024) + ' KB → ' + BUCKET + '/' + path);

  if (!APPLY) continue;

  // สำรอง base64 เดิมไว้ก่อน (กู้คืนได้ถ้าอะไรผิดพลาด)
  fs.mkdirSync('download/card_backup', { recursive: true });
  fs.writeFileSync('download/card_backup/' + c.section_key + '.txt', c.bg_image, 'utf8');

  const up = await fetch(HOST + '/storage/v1/object/' + BUCKET + '/' + path, {
    method: 'POST',
    headers: { ...H, 'Content-Type': mime, 'x-upsert': 'true' },
    body: bytes,
  });
  if (!up.ok) { console.log('   ❌ อัพไม่ผ่าน ' + up.status + ' ' + (await up.text()).slice(0, 120)); continue; }

  const url = HOST + '/storage/v1/object/public/' + BUCKET + '/' + path;
  // เช็คว่าเปิดรูปจาก URL ใหม่ได้จริง ก่อนแตะฐานข้อมูล
  const check = await fetch(url, { method: 'HEAD' });
  if (!check.ok) { console.log('   ❌ เปิด URL ใหม่ไม่ได้ (' + check.status + ') — ไม่แตะฐานข้อมูล'); continue; }

  const pat = await fetch(B + 'home_layout?section_key=eq.' + encodeURIComponent(c.section_key), {
    method: 'PATCH',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ bg_image: url }),
  });
  console.log('   ' + (pat.ok ? '✅ ย้ายแล้ว + ชี้ลิงก์ใหม่' : '❌ อัปเดตฐานข้อมูลไม่ผ่าน ' + pat.status));
}

if (!APPLY) { console.log('\n[DRY RUN] ใส่ --apply เพื่อย้ายจริง'); process.exit(0); }

// วัดผลหลังย้าย
const after = await (await fetch(B + 'home_layout?select=*', { headers: H })).text();
console.log('\nขนาด home_layout หลังย้าย: ' + Math.round(after.length / 1024) + ' KB (เดิม 527 KB)');
console.log('สำรอง base64 เดิมไว้ที่ download/card_backup/');

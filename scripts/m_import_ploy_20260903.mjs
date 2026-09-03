/* นำบทความของพลอยขึ้นบล็อก (ห้องกะปันส่งมา 3 ก.ย. 2026)
   เรื่อง: น้ำหนักขึ้นหลังเริ่มออกกำลังกาย

   🔴 เรื่อง canonical ภาษาไทยที่กะปันเตือน — แก้ถาวรแล้ว ไม่ต้องแก้รายใบอีก
   frontmatter ของพลอยเขียน canonical เป็น URL ภาษาไทยทุกใบ
   แต่ตั้งแต่ 31 ส.ค. หน้าบทความเสิร์ฟผ่าน web/api/post.js ซึ่ง
   **ถอด canonical เดิมทิ้งแล้วใส่ของจริงจาก slug ให้เอง** ทุกครั้ง
   → ตราบใดที่เราไม่เอา frontmatter ยัดลง content_md ก็จบ
   สคริปต์นี้เลยตัด frontmatter ออก แล้วแจกลง title / excerpt / slug แทน

   รันซ้ำได้ (upsert by slug) */
import fs from 'fs';

const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const SLUG = 'weight-gain-after-starting-exercise';   /* slug อังกฤษ — ห้ามใช้ไทย */
const COVER = 'img/covers/cover-weight-gain-exercise.jpg';  /* พาธสัมพัทธ์ ตามแบบบทความอื่น */

const raw = fs.readFileSync('.scratch/ploy_article.md', 'utf8').replace(/\r\n/g, '\n');

/* ── แยก frontmatter ออกจากเนื้อบทความ ── */
const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!m) { console.error('❌ ไม่เจอ frontmatter'); process.exit(1); }
const fm = {};
for (const line of m[1].split('\n')) {
  const i = line.indexOf(':');
  if (i > 0) fm[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
let body = m[2].trim();

/* หัวเรื่อง H1 ซ้ำกับ title ที่หน้าเว็บแสดงอยู่แล้ว — ตัดออกกันโชว์ 2 ชั้น */
body = body.replace(/^#\s+.+\n+/, '');

const title = (fm.title || '').replace(/\s*\|\s*Under360\s*$/, '').trim();
const excerpt = (fm['meta-description'] || '').trim();
if (!title)   { console.error('❌ ไม่มี title'); process.exit(1); }
if (!excerpt) { console.error('❌ ไม่มี meta-description'); process.exit(1); }

/* ── กันพลาดก่อนขึ้นจริง ── */
const banned = [
  [/เลือกเวลาส่ง|เลือกวันส่งได้|ระบุเวลาจัดส่ง/, 'คำต้องห้ามเรื่องเวลาส่ง'],
  [/ดีที่สุด|ถูกที่สุด|ถูกกว่าทุกเจ้า/, 'คำเคลมเกินจริง'],
  [/<cite|\[cite/i, 'แท็ก cite ค้าง'],
];
for (const [re, why] of banned) {
  if (re.test(body)) { console.error('🔴 หยุด — เจอ ' + why); process.exit(1); }
}
if (/170/.test(body) && !/170 กรัม|170g/.test(body)) console.log('  ⚠️ เช็คตัวเลข 170 ด้วยตา');

console.log('title   :', title);
console.log('slug    :', SLUG);
console.log('excerpt :', excerpt.slice(0, 70) + '…');
console.log('เนื้อหา  :', body.length, 'ตัวอักษร');
console.log('canonical ไทยใน frontmatter :', fm.canonical);
console.log('  → ไม่ถูกเก็บลง DB · หน้าเว็บสร้าง canonical จาก slug ให้เอง');

/* ── upsert ── */
const row = {
  slug: SLUG, title, excerpt, content_md: body,
  cover_url: COVER, published: true, updated_at: new Date().toISOString()
};

const exist = await (await fetch(SB + 'blog_posts?slug=eq.' + SLUG + '&select=id', { headers: H })).json();
let r;
if (exist.length) {
  r = await fetch(SB + 'blog_posts?slug=eq.' + SLUG, { method: 'PATCH', headers: H, body: JSON.stringify(row) });
  console.log('\n' + (r.ok ? '✅ อัปเดตบทความเดิม' : '🔴 อัปเดตไม่สำเร็จ ' + r.status));
} else {
  r = await fetch(SB + 'blog_posts', { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(row) });
  console.log('\n' + (r.ok ? '✅ เพิ่มบทความใหม่' : '🔴 เพิ่มไม่สำเร็จ ' + r.status + ' ' + await r.text()));
}
if (!r.ok) process.exit(1);

const check = await (await fetch(SB + 'blog_posts?slug=eq.' + SLUG + '&select=slug,title,published,cover_url', { headers: H })).json();
console.log('ตรวจซ้ำใน DB :', JSON.stringify(check[0]));

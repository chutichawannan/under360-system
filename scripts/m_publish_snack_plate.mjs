/* ลงบทความ "Snack Plate" ของพลอย + แก้บั๊ก canonical ที่กระทบทั้งบล็อก (m-track 22 ส.ค. 2026)

   🔴 บั๊กที่เจอระหว่างทำ (ใหญ่กว่าที่ CC แจ้ง):
   `web/blog.html` ตั้ง `<link rel="canonical" href=".../blog">` **ตายตัว**
   → **บทความทั้ง 61 บทความบอก Google ว่า "ตัวจริงของฉันคือหน้ารวมบล็อก"**
   → Google ควรเก็บบทความแยกกัน แต่เราสั่งให้มันยุบรวมเป็นหน้าเดียว
   → แถม `/blog` เพิ่ง 404 มาตลอดจนผมแก้เมื่อวาน = canonical ชี้หน้าที่ไม่มีอยู่

   วิธีแก้: ให้ JS ตั้ง canonical ตามบทความที่กำลังเปิด + เพิ่ม rewrite /blog/:slug
   → ได้ URL สะอาด `/blog/riceberry-pros-cons` ที่เปิดได้จริง และ canonical ตรงกับตัวเอง

   ⛔ ไม่แตะ redirect 23 เส้น (มียามตรวจ) · ไม่แตะ Pixel/Lead/web_events/UTM/GTM */
import fs from 'fs';
import path from 'path';

const ART = path.join(process.env.USERPROFILE || process.env.HOME, 'AppData/Local/Temp/claude/snack/article.md');
const SLUG = 'snack-plate-fat-loss';   /* ASCII ตามแบบแผนเดิม — URL ไทยพังง่ายเวลาแชร์/ก๊อป */
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

/* ══ 1) แก้ canonical ให้เป็นของบทความจริง ══ */
let f = 'web/blog.html';
let crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
let h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
if (!h.includes('u360-canonical-fix')) {
  const OLD = '<link rel="canonical" href="https://www.360foodbox.com/blog">';
  if (!h.includes(OLD)) { console.error('❌ ไม่เจอ canonical เดิม'); process.exit(1); }
  h = h.replace(OLD, '<link rel="canonical" href="https://www.360foodbox.com/blog" id="canon">');
  const ANCHOR = "    document.title = data.title + ' | Under360';";
  if (!h.includes(ANCHOR)) { console.error('❌ ไม่เจอจุดตั้ง title'); process.exit(1); }
  h = h.replace(ANCHOR, ANCHOR + `
    /* u360-canonical-fix: เดิมทุกบทความประกาศ canonical เป็นหน้ารวมบล็อกหน้าเดียวกันหมด
       = สั่ง Google ให้ยุบ 61 บทความรวมเป็นหน้าเดียว → ต้องชี้กลับมาที่ตัวเอง */
    try{
      var canon = document.getElementById('canon');
      if(canon && data.slug) canon.href = 'https://www.360foodbox.com/blog/' + data.slug;
    }catch(e){}`);
  fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log('✅ canonical ของบทความชี้กลับมาที่ตัวเองแล้ว (กระทบทั้ง 61 บทความ)');
} else console.log('⏭️  canonical แก้แล้ว');

/* ══ 2) rewrite /blog/:slug → เปิดได้จริง ══ */
f = 'web/vercel.json';
const before = JSON.parse(fs.readFileSync(f, 'utf8'));
const beforeRedirects = JSON.stringify(before.redirects);
const j = JSON.parse(JSON.stringify(before));
if (!j.rewrites.some(r => r.source === '/blog/:slug')) {
  j.rewrites.push({ source: '/blog/:slug', destination: '/blog.html?post=:slug' });
  if (JSON.stringify(j.redirects) !== beforeRedirects) { console.error('❌ redirect เปลี่ยน! หยุด'); process.exit(1); }
  if (j.redirects.length !== 23) { console.error('❌ redirect ไม่ครบ 23 เส้น! หยุด'); process.exit(1); }
  fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n');
  console.log('✅ เพิ่ม rewrite /blog/:slug — redirect 23 เส้นเหมือนเดิมทุกตัวอักษร');
} else console.log('⏭️  rewrite /blog/:slug มีแล้ว');

/* ══ 3) เตรียมบทความ ══ */
let md = fs.readFileSync(ART, 'utf8').replace(/\r\n/g, '\n');
const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
if (!fm) { console.error('❌ ไม่เจอส่วนหัวบทความ'); process.exit(1); }
const head = fm[1];
const get = k => (head.match(new RegExp('^' + k + ':\\s*(.+)$', 'm')) || [])[1]?.trim() || '';
const title = get('title').replace(/\s*\|\s*Under360\s*$/, '');
const excerpt = get('meta-description');
md = md.slice(fm[0].length);

/* ถอดแท็ก <cite index="..."> ที่ AI ฝั่งพลอยทิ้งไว้ — คงข้อความไว้ครบ */
const citeBefore = (md.match(/<cite/g) || []).length;
md = md.replace(/<cite[^>]*>/g, '').replace(/<\/cite>/g, '');
const citeAfter = (md.match(/<cite/g) || []).length;
console.log(`✅ ถอดแท็ก cite ${citeBefore} จุด → เหลือ ${citeAfter}`);
if (citeAfter) { console.error('❌ ยังเหลือ cite'); process.exit(1); }
if (/<[a-z]+ [a-z-]+=/i.test(md)) console.log('⚠️  ยังมีแท็ก HTML อื่นในเนื้อหา — ตรวจด้วยตาอีกรอบ');

console.log(`\n  slug    : ${SLUG}`);
console.log(`  title   : ${title}`);
console.log(`  excerpt : ${excerpt.slice(0, 70)}…`);
console.log(`  ความยาว : ${md.length} ตัวอักษร`);

/* ══ 4) ลงฐานข้อมูล — published=false ก่อน ให้ตรวจแล้วค่อยเปิด ══ */
const res = await fetch(`${SB}/rest/v1/blog_posts?on_conflict=slug`, {
  method: 'POST',
  headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify([{ slug: SLUG, title, excerpt, content_md: md, published: false }]),
});
const out = await res.json();
if (!res.ok) { console.error('❌ ลงฐานข้อมูลไม่สำเร็จ:', JSON.stringify(out).slice(0, 300)); process.exit(1); }
console.log(`\n✅ ลงฐานข้อมูลแล้ว (published=false — ตรวจก่อนค่อยเปิด)`);
console.log(`   ดูตัวจริง: https://www.360foodbox.com/blog/${SLUG}`);

/* ═══ ใส่ป้ายพรีวิวลิงก์ให้บทความ (og: tags) — m-track 31 ส.ค. 2026 ═══

   ปัญหาที่แก้: บทความทั้ง 62 ตัวเรนเดอร์ด้วย JavaScript ฝั่งเบราว์เซอร์
   แต่ตัวอ่านลิงก์ของ LINE / Facebook / Twitter **ไม่รันจาวาสคริปต์**
   → แชร์ลิงก์บทความลงไลน์ = ขึ้นกล่องเปล่า ไม่มีรูป ไม่มีชื่อเรื่อง ทุกตัว
   ตัวนี้เสิร์ฟ HTML เดิมเป๊ะ แต่ยัดชื่อเรื่อง/คำโปรย/รูปปกของบทความนั้นลงใน <head> ก่อนส่งออก

   🔒 ออกแบบให้ "พังแล้วไม่ทำให้บทความเปิดไม่ได้" — พลาดตรงไหนก็ตกไปหน้าบล็อกปกติเสมอ
      (บทความคือทรัพย์สิน SEO 10 ปี ห้ามหายเพราะฟังก์ชันตัวเดียว)

   ผูกกับ web/vercel.json:  /blog/:slug  →  /api/post?slug=:slug
   ⛔ ห้ามแตะ redirects 23 เส้นในไฟล์นั้นเด็ดขาด */

const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const SITE = 'https://www.360foodbox.com';
const FALLBACK_IMG = SITE + '/img/img01.jpg';

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/\s+/g, ' ').trim();

const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; };

module.exports = async function handler(req, res) {
  const slug = String((req.query && req.query.slug) || '').trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.360foodbox.com';
  const bail = () => {
    res.writeHead(302, { Location: '/blog' + (slug ? '?post=' + encodeURIComponent(slug) : '') });
    res.end();
  };
  if (!slug) return bail();

  /* ① หน้าบล็อกตัวจริง — ถ้าดึงไม่ได้ ให้ตกไปหน้าบล็อกปกติ ดีกว่าเสิร์ฟหน้าเปล่า */
  let html;
  try {
    const r = await fetch('https://' + host + '/blog.html');
    if (!r.ok) return bail();
    html = await r.text();
  } catch (e) { return bail(); }

  /* ② ข้อมูลบทความ — ดึงไม่ได้ก็ยังส่งหน้าเดิมออกไป (บทความยังเปิดอ่านได้ แค่ไม่มีป้ายพรีวิว) */
  let p = null;
  try {
    const q = SB + '/rest/v1/blog_posts?select=title,excerpt,cover_url,created_at,updated_at'
            + '&published=eq.true&slug=eq.' + encodeURIComponent(slug) + '&limit=1';
    const r = await fetch(q, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    if (r.ok) p = (await r.json())[0] || null;
  } catch (e) { /* เงียบไว้ ตั้งใจ */ }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  /* ยังไม่มีบทความชื่อนี้ (เพิ่งลบ / ยังไม่เผยแพร่) — ส่งหน้าเดิม ให้หน้าเว็บบอกเองว่าไม่พบ
     ⚠️ ห้ามตอบ 404 ตรงนี้ ตัวอ่านลิงก์จะจำว่าลิงก์เสีย */
  if (!p) { res.end(html); return; }

  const url   = SITE + '/blog/' + encodeURIComponent(slug);
  const title = clip(p.title, 95);
  const desc  = clip(p.excerpt || p.title, 180);
  /* 🔴 รูปปกในฐานข้อมูลเก็บเป็นพาธสัมพัทธ์ทั้ง 61 ตัว (เช็คแล้ว 31 ส.ค. — absolute 0 ตัว)
     ตัวอ่านลิงก์ของ LINE/Facebook ดึงรูปจากพาธสัมพัทธ์ไม่ได้ ต้องเติมชื่อเว็บให้เต็มเสมอ */
  const abs = u => !u ? FALLBACK_IMG
    : /^https?:\/\//i.test(u) ? u
    : SITE + '/' + String(u).replace(/^\/+/, '');
  const img   = abs(p.cover_url);

  const head = `<title>${esc(title)} | Under360</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" id="canon" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Under360">
<meta property="og:locale" content="th_TH">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="article:published_time" content="${esc(p.created_at)}">
<meta property="article:modified_time" content="${esc(p.updated_at || p.created_at)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'BlogPosting',
  headline: title, description: desc, image: [img], url,
  datePublished: p.created_at, dateModified: p.updated_at || p.created_at,
  author:    { '@type': 'Organization', name: 'Under360' },
  publisher: { '@type': 'Organization', name: 'Under360',
               logo: { '@type': 'ImageObject', url: SITE + '/img/u360_logo.svg' } },
  mainEntityOfPage: { '@type': 'WebPage', '@id': url }
})}</script>`;

  /* ③ ถอดป้ายเดิมของหน้ารวมบทความออก แล้วใส่ของบทความนี้แทน
        (ไม่งั้นจะมี <title> 2 อัน · canonical ชี้ /blog ทุกบทความเหมือนเดิม) */
  html = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/i, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/i, '')
    .replace(/<head(\s[^>]*)?>/i, m => m + '\n' + head + '\n');

  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.end(html);
};

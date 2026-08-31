/* ═══ ตัวเฝ้าเว็บ — เช็คว่าของสำคัญยังอยู่ครบไหม (m-track 31 ส.ค. 2026) ═══

   ทำไมต้องมี: ของบนเว็บหลุดได้แบบ "ไม่มีอะไรแดง"
     · เคยเจอจริง — Google Ads ID ถูกคอมเมนต์ทิ้งไว้ทั้งก้อน **6 วัน** โดยไม่มีใครรู้
       (ระหว่างนั้นเลขที่นัทเอาไปแปะจะไม่ทำงานเลยสักครั้ง)
     · เคยเจอจริง — `.limit(50)` ทำบทความหายจากหน้ารายการ 11 ตัว
     · เคยเจอจริง — ปฏิทินเมนู LIFF ตกไปใช้ไฟล์สำรองเก่า โดยหน้าตายังปกติทุกอย่าง
   = แพทเทิร์นประจำบ้าน "เครื่องมือคืนผลลวงโดยไม่มีอะไรแดง"

   ใช้:  node scripts/m_watch_web.mjs
   ออก 0 = ปกติ · 1 = มีของหาย (เอาไปต่อกับงานกวาดรายวันได้) */

const SITE = process.env.WATCH_SITE || 'https://www.360foodbox.com';
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const SB   = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';

const fails = [], warns = [];
const bad  = (page, what, why) => fails.push({ page, what, why });
const warn = (page, what, why) => warns.push({ page, what, why });

async function get(path) {
  try {
    const r = await fetch(SITE + path, { redirect: 'follow' });
    return { ok: r.ok, status: r.status, html: await r.text() };
  } catch (e) { return { ok: false, status: 0, html: '', err: e.message }; }
}

/* สิ่งที่ต้องมีในแต่ละหน้า — เขียนเป็น "ทำไมถึงสำคัญ" ไม่ใช่แค่ชื่อ tag
   เพื่อให้คนที่มาอ่านผลรู้ว่าถ้าหายแล้วเจ็บตรงไหน */
const CHECKS = [
  ['/', 'หน้าแรก', [
    ['Meta Pixel',      /949287485825587/,        'แอด Facebook จะวัดผลไม่ได้เลย'],
    ['Google Tag Mgr',  /GTM-ND58BLVQ/,           'แท็กที่ตั้งผ่าน GTM จะไม่ทำงาน'],
    ['Google Ads',      /AW-872118373/,           'แอด Google จะนับ conversion ไม่ได้'],
    ['ปุ่มสั่ง → LIFF', /liff\.line\.me\/2011148232/, 'ลูกค้ากดสั่งแล้วไปผิดที่ / ไปประตูเก่าที่ push ไม่ได้'],
    ['เก็บที่มา UTM',   /u360_utm|u360Tracked/,   'รู้ไม่ได้ว่าออเดอร์มาจากแอดตัวไหน'],
  ]],
  ['/mealplan', 'หน้า Meal Plan', [
    ['Meta Pixel',      /949287485825587/,        'แอด Facebook จะวัดผลไม่ได้เลย'],
    ['Google Ads',      /AW-872118373/,           'แอด Google จะนับ conversion ไม่ได้'],
    ['ปฏิทินเมนู',      /u360-menu-calendar/,     'ลูกค้าดูเมนูตามวันส่งไม่ได้'],
    ['ปุ่มสั่ง → LIFF', /liff\.line\.me\/2011148232/, 'ลูกค้ากดสั่งแล้วไปผิดที่'],
  ]],
  ['/pack', 'หน้าแพ็คกับข้าว (แลนดิ้งแอด FB)', [
    ['Meta Pixel',      /949287485825587/,        'แอดที่ยิงเข้าหน้านี้จะวัดผลไม่ได้'],
    ['โค้ดส่วนลด',      /FBPACK/,                 'แอดโฆษณาโค้ดไว้ แต่หน้าเว็บไม่บอกโค้ด'],
    ['ปุ่มสั่ง → LIFF', /liff\.line\.me\/2011148232/, 'ลูกค้ากดสั่งแล้วไปผิดที่'],
  ]],
  ['/blog', 'หน้ารวมบทความ', [
    ['Meta Pixel',      /949287485825587/,        'ทราฟฟิกจากบทความจะไม่เข้ากลุ่ม retarget'],
  ]],
];

console.log('🔎 เช็คเว็บ ' + SITE + '\n');

for (const [path, name, items] of CHECKS) {
  const r = await get(path);
  if (!r.ok) { bad(name, 'เปิดหน้าไม่ได้', 'HTTP ' + r.status + (r.err ? ' · ' + r.err : ''));
               console.log('🔴 ' + name.padEnd(32) + ' เปิดไม่ได้ (HTTP ' + r.status + ')'); continue; }
  const miss = items.filter(([, re]) => !re.test(r.html));
  miss.forEach(([w, , why]) => bad(name, w, why));
  console.log((miss.length ? '🔴 ' : '✅ ') + name.padEnd(32)
    + (miss.length ? 'หาย: ' + miss.map(m => m[0]).join(', ') : 'ครบ ' + items.length + ' อย่าง'));
}

/* ── ป้ายพรีวิวลิงก์บทความ (สุ่ม 1 ตัวที่รู้ว่ามีจริง) ── */
{
  const r = await get('/blog/riceberry-pros-cons');
  const ogImg = (r.html.match(/og:image" content="([^"]*)"/) || [])[1] || '';
  const nTitle = (r.html.match(/<title>/g) || []).length;
  if (!/og:title/.test(r.html))        bad('บทความ', 'ป้ายพรีวิวลิงก์ (og:)', 'แชร์ลงไลน์/เฟซจะขึ้นกล่องเปล่า');
  else if (!/^https?:\/\//.test(ogImg)) bad('บทความ', 'og:image ไม่ใช่ URL เต็ม', 'ตัวอ่านลิงก์ดึงรูปไม่ได้ = พรีวิวไม่มีรูป');
  else if (nTitle !== 1)                warn('บทความ', '<title> มี ' + nTitle + ' อัน', 'ควรมีอันเดียว');
  else console.log('✅ ' + 'ป้ายพรีวิวลิงก์บทความ'.padEnd(32) + 'ครบ (og: + รูปเป็น URL เต็ม)');
}

/* ── redirect เก่าจาก Wix = SEO 10 ปี หายไม่ได้ ── */
{
  const fs = await import('fs');
  try {
    const n = JSON.parse(fs.readFileSync('web/vercel.json', 'utf8')).redirects.length;
    if (n !== 23) bad('ตั้งค่าเว็บ', 'redirect เหลือ ' + n + ' เส้น (ควรมี 23)', 'ลิงก์เก่าจาก Wix จะตาย = เสีย SEO 10 ปี');
    else console.log('✅ ' + 'redirect เก่าจาก Wix'.padEnd(32) + 'ครบ 23 เส้น');
  } catch (e) { warn('ตั้งค่าเว็บ', 'อ่าน web/vercel.json ไม่ได้', e.message); }
}

/* ── บทความที่เผยแพร่ ต้องโผล่ในหน้ารายการครบ (เคยหายไป 11 ตัวเพราะ .limit(50)) ── */
{
  try {
    const r = await fetch(SB + 'blog_posts?select=slug&published=eq.true&limit=500',
                          { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    const n = (await r.json()).length;
    console.log('✅ ' + 'บทความที่เผยแพร่'.padEnd(32) + n + ' บทความ');
    if (n < 60) warn('บทความ', 'เหลือ ' + n + ' บทความ', 'เคยมี 62 — หายไปหรือเปล่า');
  } catch (e) { warn('บทความ', 'นับไม่ได้', e.message); }
}

/* ── แพลนเมนู: ยังครอบคลุมถึงอนาคตไหม ── */
{
  const r = await get('/mp_plan.json');
  try {
    const days = Object.keys(JSON.parse(r.html).plan).sort();
    const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
    const ahead = days.filter(d => d >= today).length;
    if (!ahead) bad('แพลนเมนู', 'ไม่เหลือวันข้างหน้าเลย', 'หน้า /mealplan จะโชว์แต่ของที่ผ่านมาแล้ว — ขอตารางรอบใหม่จากห้องฟ้า');
    else if (ahead <= 3) warn('แพลนเมนู', 'เหลืออีก ' + ahead + ' วันส่ง (ถึง ' + days[days.length-1] + ')', 'ใกล้หมด — ขอตารางรอบใหม่จากห้องฟ้าได้แล้ว');
    else console.log('✅ ' + 'แพลนเมนูล่วงหน้า'.padEnd(32) + 'เหลือ ' + ahead + ' วันส่ง (ถึง ' + days[days.length-1] + ')');
  } catch (e) { bad('แพลนเมนู', 'อ่าน /mp_plan.json ไม่ได้', 'หน้า /mealplan จะซ่อนส่วนเมนูทิ้ง'); }
}

/* ── สรุป ── */
console.log('');
if (warns.length) {
  console.log('🟡 ควรดู ' + warns.length + ' เรื่อง');
  warns.forEach(w => console.log('   · [' + w.page + '] ' + w.what + ' — ' + w.why));
}
if (fails.length) {
  console.log('\n🔴 ของหาย ' + fails.length + ' จุด — แก้ก่อนยิงแอดต่อ');
  fails.forEach(f => console.log('   · [' + f.page + '] ' + f.what + '\n     → ' + f.why));
  process.exit(1);
}
console.log('✅ เว็บครบทุกจุดที่เฝ้าอยู่');

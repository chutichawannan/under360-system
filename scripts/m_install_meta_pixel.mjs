/* ติด Meta Pixel ให้เว็บสาธารณะทุกหน้าที่มีปุ่มสั่งซื้อ
   Pixel ID 949287485825587 = "Pixel ของบัญชีโฆษณา Under360" (ดึงจาก Events Manager 20 ส.ค. 2026)
   ⚠️ เพิ่มคู่กับของเดิม ไม่ทับ: web_events (Supabase) + UTM + gtag ยังอยู่ครบ
   รันซ้ำได้ — ถ้าติดแล้วจะข้าม */
import fs from 'fs';

const PIXEL_ID = '949287485825587';
const FILES = [
  { f: 'web/index.html',    page: 'index'    },
  { f: 'web/mealplan.html', page: 'mealplan' },
  { f: 'web/blog.html',     page: 'blog'     },
  { f: 'web/v03.html',      page: 'v03'      },
];

/* base pixel — วางท้าย <head> ทุกหน้า */
const BASE = `<!-- Meta Pixel (m-track 20 ส.ค. 2026) -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');
fbq('track','PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1" alt=""></noscript>
<!-- End Meta Pixel -->
`;

/* ยิง Lead ตอนกดปุ่มไป LINE = conversion จริงของเรา (เงินไปเกิดใน LINE) */
const lead = page => `  try{ if(typeof fbq==='function') fbq('track','Lead',{content_name:'${page}'}); }catch(e){}\n`;

let changed = 0, skipped = 0;
for (const { f, page } of FILES) {
  if (!fs.existsSync(f)) { console.error('❌ ไม่เจอไฟล์:', f); process.exit(1); }
  const crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
  let h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

  if (h.includes(PIXEL_ID)) { console.log('⏭️  ติดอยู่แล้ว:', f); skipped++; continue; }

  /* 1) base pixel ท้าย head */
  if (!h.includes('</head>')) { console.error('❌ ไม่เจอ </head> ใน', f); process.exit(1); }
  h = h.replace('</head>', BASE + '</head>');

  /* 2) Lead event บรรทัดแรกใน orderNow() */
  const m = h.match(/function orderNow\(el\)\{\n/);
  if (!m) { console.error('❌ ไม่เจอ function orderNow ใน', f); process.exit(1); }
  h = h.replace(m[0], m[0] + lead(page));

  fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log('✅ ติดแล้ว:', f);
  changed++;
}
console.log(`\nสรุป: ติดใหม่ ${changed} ไฟล์ · ข้าม ${skipped} ไฟล์`);

/* ติด Google Tag Manager บนเว็บสาธารณะ (m-track 21 ส.ค. 2026)

   ทำไมถึงติด — เหตุผลจริงไม่ใช่ตัว GTM:
   ฝั่งพลอยส่งโค้ดมาทางไลน์ให้ **นัทไปแปะเอง** · นัทพูดเอง:
   *"ต้องมาทำงานเป็นลูกน้องเจ้า Claude พลอย ... นี่ไม่ใช่หน้าที่ฉันเลย"*
   → ติด GTM ไว้เป็น **"ท่อเปล่า"** = ต่อจากนี้ฝั่งพลอยเพิ่มเครื่องมือเองได้ในหน้า GTM
     **ไม่ต้องมาขอให้นัทแก้โค้ดอีกเลย** — นั่นคือสิ่งที่งานนี้แก้จริงๆ

   🔴 กับดักที่ต้องกัน: **ห้ามใส่ Meta Pixel ซ้ำเข้าไปใน GTM**
      เราติด Pixel 949287485825587 ตรงในหน้าเว็บไปแล้ว (base + PageView + Lead)
      ถ้าใส่ตัวเดียวกันใน GTM อีก = ยิงซ้ำ 2 ครั้งต่อการกระทำจริง 1 ครั้ง
      **ตัวเลขใน Meta จะโป่งเป็นเท่าตัวแบบเงียบๆ ไม่มี error** แล้วมีคนเอาไปตัดสินใจเรื่องงบ

   รันซ้ำได้ */
import fs from 'fs';

const GTM = 'GTM-ND58BLVQ';
/* หน้าสาธารณะที่ลูกค้าเห็นเท่านั้น — หน้าหลังบ้าน (blog_admin/web_dashboard/menu_vault ฯลฯ) ไม่ติด
   เพราะจะทำให้ยอดคนเข้าเว็บโป่งด้วยการทำงานของเราเอง */
const FILES = ['web/index.html', 'web/mealplan.html', 'web/blog.html', 'web/v03.html'];

const HEAD = `<!-- Google Tag Manager (m-track 21 ส.ค. 2026)
     ⛔ ห้ามใส่ Meta Pixel เข้าไปใน GTM — หน้านี้ติด Pixel ตรงอยู่แล้ว ใส่ซ้ำ = ยิง 2 เท่า -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM}');</script>
<!-- End Google Tag Manager -->
`;

const NOSCRIPT = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
`;

let n = 0;
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.error('❌ ไม่เจอ', f); process.exit(1); }
  const crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
  let h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes(GTM)) { console.log('⏭️  ติดแล้ว:', f); continue; }

  /* ① บนสุดของ head — ให้ GTM โหลดก่อนของอื่น */
  if (!h.includes('<head>')) { console.error('❌ ไม่เจอ <head> ใน', f); process.exit(1); }
  h = h.replace('<head>', '<head>\n' + HEAD);

  /* ② บรรทัดแรกหลัง <body> เปิด */
  const bm = h.match(/<body[^>]*>/);
  if (!bm) { console.error('❌ ไม่เจอ <body> ใน', f); process.exit(1); }
  h = h.replace(bm[0], bm[0] + '\n' + NOSCRIPT);

  fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log('✅', f);
  n++;
}
console.log(`\nติด GTM ${GTM} แล้ว ${n} ไฟล์ (หน้าสาธารณะเท่านั้น — หน้าหลังบ้านไม่ติด กันยอดโป่ง)`);

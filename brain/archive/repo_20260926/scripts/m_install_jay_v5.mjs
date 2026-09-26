/* ติดตั้งดีไซน์ /jay ที่ ChatGPT ทำมา (นัทอัปไฟล์ให้ 8 ก.ย. 2026)
   ต้นทาง: download/under360-handoff-v5.zip → .scratch/handoff5/

   ✅ ตรวจก่อนแล้ว ผ่านหมด: เมนูตรงกับ docs/J2026_MENU_DATA.csv ครบ 30 ตัว ·
      ราคา 4,190 / 4,490 / 1,440 / 1,920 ถูกทุกจุด · ไม่มีคำต้องห้ามสักคำ

   สิ่งที่สคริปต์นี้ทำ (ส่วนที่ ChatGPT ทำไม่ได้ และตั้งใจปล่อยให้เราต่อ):
     ① ถอดฟอนต์ฝัง base64 ออก → ใช้ Google Fonts แทน (475KB → 22KB)
     ② เสียบลิงก์ทั้ง 9 จุดที่ปล่อย href="#" ไว้
     ③ ปุ่มจอง 3 จุด → LINE ประตูใหม่ + พก utm ไปด้วย
     ④ Pixel · GTM · Google Ads · og: · canonical · favicon
     ⑤ ย่อรูป 4 ใบจากใบละ ~1.9MB

   ⚠️ ออกที่ web/jay_v5.html (URL ทดสอบ) — **ไม่ทับ /jay ตัวจริง**
      ให้นัทดูก่อน ค่อยสลับ
   รันซ้ำได้ */
import fs from 'fs';
import { execFileSync } from 'child_process';

const SRC = '.scratch/handoff5/';
const OUT = 'web/jay_v5.html';
const IMGDIR = 'web/img/jay/v5/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SP = 'C:/Users/PP/AppData/Local/Temp/claude/C--Users-PP-Desktop-under360-system/e0ce4fa5-b4d0-43db-9182-f632f69d694a/scratchpad';

const ABS = process.cwd().split('\\').join('/') + '/';   /* พาธเต็มแบบ / สำหรับส่งให้ Chrome */

const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
must(fs.existsSync(SRC + 'index.html'), 'ไม่เจอไฟล์ต้นทาง — แตก zip ก่อน');

let h = fs.readFileSync(SRC + 'index.html', 'utf8').replace(/\r\n/g, '\n');
const before = h.length;

/* ═══ ① ฟอนต์: ถอด base64 ออก ใช้ Google Fonts ═══
   ไฟล์ 475KB ในนั้นเป็นฟอนต์ 453KB — มือถือโหลดช้าโดยไม่จำเป็น
   Kanit อยู่บน Google Fonts มี subset ไทยครบ (เช็คแล้ว) */
const faces = (h.match(/@font-face\s*\{[\s\S]*?\}/g) || []);
must(faces.length, 'ไม่เจอ @font-face');
faces.forEach(f => { h = h.replace(f, ''); });
h = h.replace('</title>', `</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700&display=swap" rel="stylesheet">`);
console.log('  ✅ ถอดฟอนต์ฝัง ' + faces.length + ' ก้อน → Google Fonts (' + (before/1024|0) + 'KB → ' + (h.length/1024|0) + 'KB)');

/* ═══ ② หัวเอกสาร — ของที่หน้าขายต้องมีแต่ ChatGPT ไม่ได้ใส่ ═══ */
must(h.includes('<title>'), 'ไม่เจอ title');
h = h.replace('<title>', `<!-- ⚠️ หน้าทดสอบดีไซน์ใหม่ ยังไม่ใช่ /jay ตัวจริง — ห้ามให้ Google เก็บ -->
  <meta name="robots" content="noindex,nofollow">
  <link rel="canonical" href="https://www.360foodbox.com/jay">
  <link rel="icon" href="/img/jay/jay-logo.svg" type="image/svg+xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Under360">
  <meta property="og:locale" content="th_TH">
  <meta property="og:url" content="https://www.360foodbox.com/jay">
  <meta property="og:title" content="คอร์สอาหารเจ 2569 — 30 เมนู ไม่ซ้ำสักวัน">
  <meta property="og:description" content="กินเจ 10 วัน โดยไม่ต้องคิดเองสักมื้อ ส่งถึงบ้าน 3 รอบ Early Bird 4,190.-">
  <meta property="og:image" content="https://www.360foodbox.com/img/jay/collage.png">
  <meta property="og:image:width" content="900">
  <meta property="og:image:height" content="600">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://www.360foodbox.com/img/jay/collage.png">

  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-ND58BLVQ');</script>

  <!-- Google Ads -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=AW-872118373"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
  gtag('js',new Date());gtag('config','AW-872118373');</script>

  <!-- Meta Pixel -->
  <script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init','949287485825587');fbq('track','PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=949287485825587&ev=PageView&noscript=1" alt=""></noscript>

  <title>`);
console.log('  ✅ ใส่ Pixel · GTM · Google Ads · og: · canonical · favicon · noindex');

/* ═══ ③ เสียบลิงก์ทั้ง 9 จุด ═══
   ChatGPT ปล่อย href="#" ไว้ตามที่บรีฟบอก — ตรงนี้คือส่วนที่พลาดแล้วเจ็บ
   ลิงก์ LINE ผิดประตู = ลูกค้าสั่งไม่ได้ · utm หาย = วัดผลแอดไม่ได้ */
const wire = [
  [/(<a[^>]*class="brand"[^>]*)href="#"/g,     '$1href="/"'],
  [/(<a[^>]*class="nav-link"[^>]*)href="#"([^>]*>\s*เมนูอาหาร)/g,  '$1href="#menu-title"$2'],
  [/(<a[^>]*class="nav-link"[^>]*)href="#"([^>]*>\s*การจัดส่ง)/g,  '$1href="#plan-title"$2'],
  [/(<a[^>]*class="text-link"[^>]*)href="#"/g, '$1href="#menu-title"'],
  /* ปุ่มจอง — ใส่ id ให้ JS ผูกทีหลัง ไม่ฝัง URL ตรงๆ เพราะต้องพก utm ที่รู้ตอนรันเท่านั้น */
  [/(<a[^>]*class="button"[^>]*)href="#"/g,    '$1href="#" data-order="1"'],
];
let n = 0;
for (const [re, to] of wire) { const c = (h.match(re) || []).length; h = h.replace(re, to); n += c; }
const left = (h.match(/href="#"(?![^>]*data-order)/g) || []).length;
console.log('  ✅ เสียบลิงก์ ' + n + ' จุด · เหลือ href="#" ที่ยังไม่ผูก ' + left + ' จุด');
must((h.match(/data-order="1"/g) || []).length === 3, 'ปุ่มจองต้องมี 3 จุด');

/* ═══ ④ รูป — ย่อ + ชี้พาธใหม่ ═══ */
fs.mkdirSync(IMGDIR, { recursive: true });
fs.mkdirSync(SP, { recursive: true });
for (const f of ['food-1', 'food-2', 'food-3', 'food-4']) {
  const b = fs.readFileSync(SRC + f + '.png');
  const w = b.readUInt32BE(16), ht = b.readUInt32BE(20);
  const nw = 1100, nh = Math.round(ht * nw / w);
  fs.writeFileSync(SP + '/img.html',
    '<!doctype html><meta charset="utf-8"><style>*{margin:0;padding:0}'
    + 'body{width:' + nw + 'px;height:' + nh + 'px}img{width:100%;height:100%;display:block}</style>'
    + '<img src="data:image/png;base64,' + b.toString('base64') + '">');
  execFileSync(CHROME, ['--headless=old', '--disable-gpu', '--hide-scrollbars',
    /* Chrome ต้องการพาธเต็มสำหรับ --screenshot พาธสัมพัทธ์ทำให้ออก status 2 เงียบๆ */
    '--window-size=' + nw + ',' + nh,
    '--screenshot=' + ABS + IMGDIR + f + '.png',
    'file:///' + SP + '/img.html'], { stdio: 'ignore' });
  console.log('  ✅ ' + f + '  ' + w + 'x' + ht + ' ' + (b.length/1024|0) + 'KB → '
    + nw + 'x' + nh + ' ' + (fs.statSync(IMGDIR + f + '.png').size/1024|0) + 'KB');
  h = h.replace(new RegExp('src="' + f + '\\.png"', 'g'), 'src="/img/jay/v5/' + f + '.png" loading="lazy"');
}

/* ═══ ⑤ โค้ดพาไป LINE + เก็บที่มา ═══ */
must(h.includes('</body>'), 'ไม่เจอ </body>');
h = h.replace('</body>', `
<script>
/* ═══ ต่อปุ่มจองเข้า LINE + พกที่มาของลูกค้าไปด้วย (ชุดเดียวกับหน้าอื่นทั้งเว็บ)
   ⚠️ ต้องพก utm ไปถึง LINE ไม่งั้นวัดไม่ได้ว่าแอดตัวไหนทำเงิน
      (เคยเผา ฿41,840 แล้ววัดไม่ได้มาแล้ว) ═══ */
var ORDER_URL='https://liff.line.me/2011148232-oul66cEs?lid=2011148232-oul66cEs';
(function(){
  try{
    var p=new URLSearchParams(location.search),old={};
    try{ old=JSON.parse(localStorage.getItem('u360_utm')||'{}')||{}; }catch(e){}
    var fb=p.get('fbclid')||'', src=p.get('utm_source')||(fb?'fb':'');
    if(src) localStorage.setItem('u360_utm',JSON.stringify({
      source:src, medium:p.get('utm_medium')||(fb?'paid':'')||old.medium||'',
      campaign:p.get('utm_campaign')||old.campaign||'jay2026',
      content:p.get('utm_content')||old.content||'', fbclid:fb||old.fbclid||'', ts:Date.now()}));
  }catch(e){}
})();
function jayTracked(base){
  try{
    var q=new URLSearchParams(location.search),st={};
    try{ st=JSON.parse(localStorage.getItem('u360_utm')||'{}')||{}; }catch(e){}
    var out=new URLSearchParams();
    [['utm_source','source'],['utm_medium','medium'],['utm_campaign','campaign'],
     ['utm_content','content'],['fbclid','fbclid']].forEach(function(k){
      var v=(q.get(k[0])||st[k[1]]||'').toString().trim();
      if(v) out.set(k[0],v.slice(0,80));
    });
    if(!out.get('utm_campaign')) out.set('utm_campaign','jay2026');
    var s=out.toString();
    return s ? base+(base.indexOf('?')>=0?'&':'?')+s : base;
  }catch(e){ return base; }
}
[].slice.call(document.querySelectorAll('[data-order]')).forEach(function(el,i){
  el.addEventListener('click',function(e){
    e.preventDefault();
    try{ if(window.fbq) fbq('track','Lead',{content_name:'jay2026'}); }catch(e){}
    try{ if(window.gtag) gtag('event','conversion',{send_to:'AW-872118373/Qp5GCO_i_uQcEOXw7Z8D'}); }catch(e){}
    location.href=jayTracked(ORDER_URL);
  });
});
</script>
</body>`);
console.log('  ✅ ต่อปุ่มจอง 3 จุดเข้า LINE + เก็บ/ส่งต่อ utm + ยิง Lead/conversion');

fs.writeFileSync(OUT, h);
console.log('\n✅ ' + OUT + '  (' + (fs.statSync(OUT).size/1024|0) + 'KB)');

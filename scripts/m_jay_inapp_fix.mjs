/* 🔴 ปุ่มจองตายในเบราว์เซอร์ของ FB/IG (พลอยเจอเอง · 06 แจ้ง 9 ก.ย. 2026)

   อาการ: กดแอด → เปิดในเบราว์เซอร์ของ FB → กดจอง → liff.line.me
          เบราว์เซอร์ในแอปเปิดแอป LINE ไม่ได้ → LINE เด้งหน้าล็อกอินอีเมล/รหัสผ่าน
          คนไทยส่วนใหญ่ล็อกอิน LINE ด้วยเบอร์ ไม่เคยตั้งอีเมล → จบตรงนั้น

   ตัวเลขยืนยัน (จาก web_events ของจริง):
     เข้าจากเบราว์เซอร์มือถือ 16 คน → กดจอง 6  = 37.5%
     เข้าจากในแอป IG        36 คน → กดจอง 5  = 13.9%
     เข้าจากในแอป Facebook  30 คน → กดจอง 1  = 3.3%   ← ต่างกัน 11 เท่า
   และ 72% ของคนเข้าหน้านี้มาจากในแอป = จุดที่พังคือจุดที่คนส่วนใหญ่อยู่

   วิธีแก้: ในแอป FB/IG ให้ปุ่มเรียก **แอป LINE ตรงๆ** (line://app/{liffId})
            แทนที่จะไปทาง liff.line.me ซึ่งต้องผ่านหน้าเว็บของ LINE ก่อน
            เรียกไม่ติดใน 1.6 วิ → โชว์ทางออกสำรองให้เปิดในเบราว์เซอร์

   ⚠️ ห้ามแตะสายวัดผล — ต่อ utm ชุดเดียวกันเป๊ะ (06 กำชับ)
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-inapp')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }

/* ═══ ① กล่องบอกทางออกสำรอง — ซ่อนไว้ก่อน โผล่เมื่อเรียกแอปไม่ติด ═══ */
{
  const A = '<div id="stickybar" hidden>';
  must(h.includes(A), 'ไม่เจอแถบจองล่าง');
  h = h.replace(A, `<!-- u360-inapp — ทางออกสำรองตอนเบราว์เซอร์ในแอปเปิด LINE ไม่ได้ -->
<div id="inapptip" hidden>
  <b>เปิด LINE ไม่ขึ้นใช่ไหม</b>
  <span>แตะปุ่ม <b>⋯</b> มุมขวาบน แล้วเลือก <b>“เปิดในเบราว์เซอร์”</b> แล้วกดจองอีกครั้ง</span>
  <button type="button" id="inapptipx" aria-label="ปิด">✕</button>
</div>
${A}`);
  console.log('  ✅ กล่องบอกทางออกสำรอง');
}

/* ═══ ② CSS ═══ */
{
  must(h.includes('</style>'), 'ไม่เจอ </style>');
  h = h.replace('</style>', `    /* ── u360-inapp ── */
    #inapptip { position:fixed; left:12px; right:12px; bottom:84px; z-index:60;
      background:#24392e; color:#fff; border-radius:14px; padding:14px 40px 14px 16px;
      box-shadow:0 6px 24px rgba(0,0,0,.28); font-size:14px; line-height:1.6; }
    #inapptip b { font-weight:600; }
    #inapptip span { display:block; margin-top:3px; color:#CFE0D6; }
    #inapptipx { position:absolute; top:8px; right:8px; width:30px; height:30px;
      background:none; border:0; color:#9DB3A8; font-size:16px; cursor:pointer; }
    @media (min-width:701px) { #inapptip { left:auto; right:20px; bottom:20px; max-width:340px; } }
</style>`);
  console.log('  ✅ CSS');
}

/* ═══ ③ ตรรกะ — แทนที่ตัวผูกปุ่มเดิม ═══ */
{
  const A = `[].slice.call(document.querySelectorAll('[data-order]')).forEach(function(el,i){
  try{ el.href=jayTracked(ORDER_URL); }catch(e){}
  el.addEventListener('click',function(e){
    e.preventDefault();`;
  must(h.includes(A), 'ไม่เจอบล็อกผูกปุ่มจอง');

  h = h.replace(A, `/* u360-inapp — เบราว์เซอร์ในแอป FB/IG ส่งต่อไป liff.line.me แล้วเปิดแอป LINE ไม่ได้
   ลูกค้าเลยไปเจอหน้าล็อกอินอีเมล/รหัสผ่านของ LINE ซึ่งคนไทยส่วนใหญ่ไม่เคยตั้ง
   → ในแอปพวกนี้ให้เรียกแอป LINE ตรงๆ ด้วย line://app/{liffId} ข้ามหน้าเว็บของ LINE ไปเลย */
var IN_APP = /FBAN|FBAV|FB_IAB|FBIOS|Instagram/i.test(navigator.userAgent||'');
var LIFF_ID = (ORDER_URL.split('liff.line.me/')[1]||'').split('?')[0];
function orderTarget(){
  var web = jayTracked(ORDER_URL);
  if (!IN_APP || !LIFF_ID) return web;
  /* ต่อ utm ชุดเดียวกันเป๊ะ — สายวัดผลต้องไม่เปลี่ยน */
  var qs = web.split('?')[1] || '';
  return 'line://app/' + LIFF_ID + (qs ? '?' + qs : '');
}
function showInAppTip(){
  var t=document.getElementById('inapptip'); if(!t) return;
  t.removeAttribute('hidden');
  var x=document.getElementById('inapptipx');
  if(x) x.onclick=function(){ t.setAttribute('hidden',''); };
}
[].slice.call(document.querySelectorAll('[data-order]')).forEach(function(el,i){
  /* ในแอปยังใส่ลิงก์เว็บไว้ในปุ่มเหมือนเดิม เพื่อให้ "เปิดในเบราว์เซอร์/ก๊อปลิงก์" ยังใช้ได้ */
  try{ el.href=jayTracked(ORDER_URL); }catch(e){}
  el.addEventListener('click',function(e){
    e.preventDefault();`);

  const B = `    location.href=jayTracked(ORDER_URL);
  });
});`;
  must(h.includes(B), 'ไม่เจอบรรทัดพาไป LINE');
  h = h.replace(B, `    var tgt = orderTarget();
    if (IN_APP) {
      /* เรียกแอป LINE · ถ้าไม่ติดใน 1.6 วิ แปลว่าเปิดแอปไม่ได้ → บอกทางออกสำรอง
         ไม่เด้งไปหน้าเว็บ LINE ให้เอง เพราะปลายทางคือหน้าล็อกอินที่ลูกค้าไปต่อไม่ได้อยู่ดี */
      var t0 = Date.now();
      location.href = tgt;
      setTimeout(function(){
        if (document.hidden || Date.now() - t0 > 2600) return;   /* สลับไปแอป LINE แล้ว */
        showInAppTip();
      }, 1600);
      return;
    }
    location.href = tgt;
  });
});`);
  console.log('  ✅ ในแอป FB/IG เรียกแอป LINE ตรง · ไม่ติดใน 1.6 วิ = โชว์ทางออกสำรอง');
}

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F + '  (' + (fs.statSync(F).size / 1024 | 0) + 'KB)');

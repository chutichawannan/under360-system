/* 🔴 เอาตัวนับสถิติ web_events กลับเข้าหน้า /jay (8 ก.ย. 2026)

   สิ่งที่เกิดขึ้น: ตอนติดตั้งดีไซน์ใหม่ที่ ChatGPT ทำมา ไฟล์ถูกเขียนทับทั้งใบ
   ผมใส่ Meta Pixel / Google Ads / ตัวส่งต่อ utm กลับเข้าไปครบ
   **แต่ลืมตัวนับ web_events ของเราเอง** → หน้าเจไม่บันทึกสถิติเลยตั้งแต่ 10:14 น.
   ผลคือ ยามเฝ้าแอดของ 06 นับ "คนเข้า /jay" ได้ 0 ตลอด ทั้งที่แอดวิ่งอยู่ ฿300/วัน
   = จ่ายเงินแล้วมองไม่เห็นอะไรเลย

   ทำไมไม่ใช้ไลบรารี Supabase เหมือนหน้าอื่น: หน้านี้ไม่ได้โหลดไลบรารีนั้น
   เรียก REST ตรงๆ ด้วย fetch เบากว่า และไม่ต้องเพิ่มไฟล์ให้หน้าแลนดิ้งแอด
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-track')) { console.log('⏭️  มีตัวนับแล้ว'); process.exit(0); }

/* วางไว้ก่อนบล็อกผูกปุ่ม เพื่อให้ track() ถูกประกาศก่อนถูกเรียก */
const A = '[].slice.call(document.querySelectorAll(\'[data-order]\')).forEach(function(el,i){';
must(h.includes(A), 'ไม่เจอบล็อกผูกปุ่มจอง');

h = h.replace(A, `/* u360-track — บันทึกสถิติของเราเอง (คนละตัวกับพิกเซล Meta/Google)
   ยิงแบบไม่รอผล ไม่บล็อกหน้า และกลืน error ทุกกรณี — สถิติต้องไม่ทำให้ลูกค้าสั่งของไม่ได้ */
function u360track(event){
  try{
    var u={}; try{ u=JSON.parse(localStorage.getItem('u360_utm')||'{}')||{}; }catch(e){}
    fetch('https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/web_events',{
      method:'POST', keepalive:true,
      headers:{'Content-Type':'application/json',
        apikey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8'},
      body:JSON.stringify({event:event, page:'jay',
        utm_source:u.source||null, utm_medium:u.medium||null, utm_campaign:u.campaign||null,
        referrer:document.referrer||null, ua:(navigator.userAgent||'').slice(0,200)})
    }).then(function(){},function(){});
  }catch(e){}
}
u360track('pageview');

${A}`);
console.log('  ✅ ใส่ตัวนับ + ยิง pageview ตอนเปิดหน้า');

/* ยิงตอนกดปุ่มจอง — วางแถวเดียวกับที่ยิงพิกเซล จะได้ไม่หลุดจุดใดจุดหนึ่ง */
const B = "    try{ if(window.fbq) fbq('track','Lead',{content_name:'jay2026'}); }catch(e){}";
must(h.includes(B), 'ไม่เจอจุดยิงพิกเซลตอนกดจอง');
h = h.replace(B, "    try{ u360track('cta_click'); }catch(e){}\n" + B);
console.log('  ✅ ยิง cta_click ตอนกดปุ่มจอง (จุดเดียวกับพิกเซล)');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F + '  (' + (fs.statSync(F).size / 1024 | 0) + 'KB)');

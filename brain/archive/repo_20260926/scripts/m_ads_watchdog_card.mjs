/* งานนัท 9 ก.ย. 2026 (ผ่าน 06) — เอารายงานยามเฝ้าแอดมาแสดงในหน้า /ads
   นัทพูดเอง: "ยามเฝ้าแอด อยากเห็นหน้า interface ด้วยนะ ฉันจะได้ช่วยนายดู
              จริงๆ มันรวมในหน้า ads ก็ได้"

   ดึงรายงานล่าสุดจาก session_messages (sender = ยามเฝ้าแอด) มาโชว์เป็นกล่อง
   ตารางนี้ anon อ่านได้อยู่แล้ว ไม่ต้องรัน SQL อะไรเพิ่ม
   06 โพสต์ให้วันละ 2 รอบ (8 โมง / 2 ทุ่ม)

   ⚠️ ข้อความในรายงานเป็นข้อความที่ห้องอื่นเขียน — ใส่เป็น textContent ไม่ใช่ HTML
      กันไว้ไม่ให้ข้อความจากบอร์ดกลายเป็นโค้ดในหน้าเรา
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/ads.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-watchdog-card')) { console.log('⏭️  มีแล้ว'); process.exit(0); }

/* ── กล่อง ── */
const A = '<section><div class="wrap">\n  <div class="cards" id="cards"></div>';
must(h.includes(A), 'ไม่เจอจุดแทรก');
h = h.replace(A, `<!-- u360-watchdog-card — รายงานล่าสุดของยามเฝ้าแอด (นัทขอ 9 ก.ย.) -->
<section><div class="wrap">
  <div class="wd" id="wd" hidden>
    <div class="wdhead"><b>🐕 ยามเฝ้าแอด</b><span id="wdtime"></span></div>
    <pre id="wdtext"></pre>
  </div>
  <div class="cards" id="cards"></div>`);

/* ── CSS ── */
must(h.includes('</style>'), 'ไม่เจอ </style>');
h = h.replace('</style>', `  /* ── u360-watchdog-card ── */
  .wd { border:1px solid var(--line,#e5eae6); border-radius:14px; padding:14px 16px;
        margin-bottom:18px; background:var(--soft,#f7f9f7); }
  .wdhead { display:flex; align-items:baseline; justify-content:space-between;
            gap:12px; margin-bottom:8px; font-size:15px; }
  .wdhead span { font-size:12px; opacity:.65; }
  .wd pre { margin:0; white-space:pre-wrap; word-break:break-word;
            font-family:inherit; font-size:13px; line-height:1.75; }
</style>`);

/* ── ดึงข้อมูล ── */
const B = '\n</script>\n</body>';
must(h.includes(B), 'ไม่เจอท้ายสคริปต์');
h = h.replace(B, `
/* u360-watchdog-card — โชว์รายงานล่าสุดของยามเฝ้าแอด
   โหลดหลังปลดล็อกเท่านั้น เหมือนตัวเลขแอด */
function loadWatchdog(){
  var SBU='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/session_messages'
        + '?select=created_at,text&sender=eq.' + encodeURIComponent('ยามเฝ้าแอด')
        + '&order=created_at.desc&limit=1';
  var k='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
  fetch(SBU,{headers:{apikey:k,Authorization:'Bearer '+k}})
    .then(function(r){ return r.ok ? r.json() : []; })
    .then(function(rows){
      if(!rows || !rows.length) return;
      var m=rows[0], box=document.getElementById('wd');
      /* textContent ไม่ใช่ innerHTML — ข้อความมาจากห้องอื่น ห้ามให้กลายเป็นโค้ดในหน้าเรา */
      document.getElementById('wdtext').textContent =
        String(m.text||'').replace(/\*\*/g,'').replace(/^✅\s*/,'');
      var d=new Date(m.created_at);
      document.getElementById('wdtime').textContent =
        'อัปเดต ' + d.toLocaleString('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
      box.removeAttribute('hidden');
    })
    .catch(function(){});
}
if (document.getElementById('adsgate')) document.addEventListener('u360-unlocked', loadWatchdog);
else loadWatchdog();
` + B);

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('✅ เพิ่มกล่องยามเฝ้าแอดในหน้า /ads');

/* แถบจองติดขอบล่างบนมือถือ — หน้า /jay (8 ก.ย. 2026 · ก่อนยิงแอด)

   🔴 ปัญหาที่วัดได้จริงบนหน้าจริง (iPhone 375x812):
      หน้าสูง 4,106px · ปุ่มจองอยู่ที่ y=521 กับ y=3,614 เท่านั้น
      → ระหว่างนั้น **3.7 จอ ไม่มีปุ่มจองให้เห็นเลยสักปุ่ม** (นับแล้ว = 0)
      และหัวเว็บเป็น static เลื่อนแล้วหายไปด้วย
      คนมาจากแอดคือคนที่ยังไม่รู้จักเรา อ่านไปเรื่อยๆ พออยากซื้อต้องเลื่อนหาปุ่ม = หลุด

   วิธี: แถบล่างบางๆ โผล่หลังเลื่อนพ้นปุ่มแรก · เฉพาะจอ ≤700px
   · ใส่ data-order → สคริปต์เดิมผูกลิงก์ LIFF + utm + ยิงพิกเซลให้เอง ไม่ต้องเขียนซ้ำ
   · เว้นที่ท้ายหน้าไม่ให้แถบบังเนื้อหา
   · เคารพคนที่ตั้งค่าลดการเคลื่อนไหว
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-sticky-cta')) { console.log('⏭️  มีแถบจองแล้ว'); process.exit(0); }

/* ═══ ① แถบ — วางก่อน </body> แต่ต้องอยู่ "ก่อน" สคริปต์ผูกปุ่ม ═══ */
{
  const A = '<script>';
  const i = h.lastIndexOf('\n' + A);   /* สคริปต์ก้อนสุดท้าย = ตัวผูก data-order */
  must(i > 0, 'ไม่เจอสคริปต์ผูกปุ่มท้ายหน้า');
  h = h.slice(0, i) + `
<!-- ═══ u360-sticky-cta — แถบจองติดขอบล่าง เฉพาะมือถือ ═══ -->
<div id="stickybar" hidden>
  <div>
    <b>฿4,190</b>
    <span>Early Bird · 50 คอร์สแรก</span>
  </div>
  <a class="button" href="#" data-order="1">จองคอร์สเจ</a>
</div>
` + h.slice(i);
  console.log('  ✅ แทรกแถบจอง (ก่อนสคริปต์ผูกปุ่ม → ได้ลิงก์ + พิกเซลอัตโนมัติ)');
}

/* ═══ ② CSS ═══ */
{
  must(h.includes('</style>'), 'ไม่เจอ </style>');
  h = h.replace('</style>', `    /* ── u360-sticky-cta ── */
    #stickybar { display:none; }
    @media (max-width:700px) {
      #stickybar { position:fixed; left:0; right:0; bottom:0; z-index:50;
        display:flex; align-items:center; justify-content:space-between; gap:14px;
        padding:10px 16px calc(10px + env(safe-area-inset-bottom));
        background:rgba(255,255,255,.97); border-top:1px solid var(--line);
        box-shadow:0 -2px 14px rgba(0,0,0,.06);
        transform:translateY(102%); transition:transform .22s ease; }
      #stickybar[hidden] { display:flex; }          /* คุมด้วย .on ไม่ใช่ hidden จะได้มีอนิเมชัน */
      #stickybar.on { transform:translateY(0); }
      #stickybar b { display:block; font-size:19px; color:var(--green); font-weight:600; line-height:1.3; }
      #stickybar span { display:block; font-size:11px; color:var(--muted); line-height:1.4; }
      #stickybar .button { min-height:46px; padding:10px 22px; flex-shrink:0; }
      body { padding-bottom:74px; }                  /* กันแถบบังบรรทัดสุดท้าย */
    }
    @media (prefers-reduced-motion:reduce) { #stickybar { transition:none; } }
</style>`);
  console.log('  ✅ CSS (มือถือเท่านั้น · เว้นที่ท้ายหน้ากันบัง · รองรับขอบจอ iPhone)');
}

/* ═══ ③ ให้โผล่หลังเลื่อนพ้นปุ่มจองใบแรก ═══ */
{
  const A = '\n</script>\n</body>';
  must(h.includes(A), 'ไม่เจอท้ายสคริปต์');
  h = h.replace(A, `
/* แถบล่าง: โผล่เมื่อปุ่มจองใบแรกเลื่อนพ้นจอ · ซ่อนตอนถึงปุ่มจองใบท้าย (ไม่ให้ซ้อนกัน) */
(function(){
  var bar=document.getElementById('stickybar'); if(!bar) return;
  var first=document.querySelector('.hero [data-order]');
  var last=document.querySelector('.booking [data-order]');
  if(!first) return;
  bar.removeAttribute('hidden');
  function upd(){
    var pastFirst=first.getBoundingClientRect().bottom<0;
    var atLast=last ? last.getBoundingClientRect().top<window.innerHeight : false;
    bar.classList.toggle('on', pastFirst && !atLast);
  }
  addEventListener('scroll',upd,{passive:true}); addEventListener('resize',upd); upd();
})();
` + A);
  console.log('  ✅ ตรรกะแสดง/ซ่อน (ไม่ซ้อนกับปุ่มใบท้าย)');
}

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F + '  (' + (fs.statSync(F).size / 1024 | 0) + 'KB)');

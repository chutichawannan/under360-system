/* นำหน้า Kidneycare ที่นัทส่งมา 21 ส.ค. เข้ามาเก็บใน repo (m-track 31 ส.ค. 2026)

   ที่มา: นัทแนบไฟล์มาในแชท — เขียนโดย Claude อีกตัว ไม่ใช่ผม
   ก่อนหน้านี้ไฟล์อยู่แต่ในโฟลเดอร์ชั่วคราวของแอป = **หายได้ตลอดเวลา** จึงต้องเก็บเข้า repo ก่อน

   🔴 ทำไมยัง "ไม่เปิดให้คนทั่วไปเข้า" (ไม่ใช่ผมขี้เกียจ — เป็นเรื่องความปลอดภัยผู้ป่วย):
     ตรวจโค้ดแล้วพบว่า **ฟอร์มไม่ส่งข้อมูลไปไหนเลย** — ไม่มี fetch ไม่มีปลายทางสักจุดเดียว
     หน้านี้ขอ: ชื่อ · เบอร์ · อายุ · น้ำหนัก/ส่วนสูง · **ค่าเลือด** · ยาที่ใช้ · ที่อยู่
     · **อัปโหลดรูปผลเลือด** · มีช่องยินยอม PDPA
     → ถ้าเปิดตอนนี้: ผู้ป่วยกรอกค่าเลือดครบ กดส่ง **แล้วไม่มีอะไรเกิดขึ้น ไม่มีใครได้รับ**
       = คนป่วยรอคำตอบที่ไม่มีวันมา · แย่กว่าไม่มีหน้านี้เลย

   ที่สคริปต์นี้ทำ = **ทำให้ปลอดภัยระหว่างรอนัทเคาะ** ไม่ได้แก้เนื้อหาของหน้า
     ① noindex — ไม่ให้ Google เก็บเข้าดัชนี
     ② ปิดปุ่มส่ง แล้วขึ้นกล่องบอกให้ทักไลน์แทน (ทางที่มีคนรับจริง)
     ③ ไม่ผูก /kidneycare ใน vercel.json — ยังไม่มีทางเข้าจากหน้าไหน
   ถอดออกได้หมดด้วยการลบก้อน u360-kidney-hold เมื่อมีปลายทางข้อมูลจริงแล้ว
   รันซ้ำได้ */
import fs from 'fs';

const SRC = 'C:/Users/PP/.claude/uploads/e0ce4fa5-b4d0-43db-9182-f632f69d694a/d3498fe4-kidneycare.html';
const OUT = 'web/kidneycare.html';
const BRIEF_SRC = 'C:/Users/PP/.claude/uploads/e0ce4fa5-b4d0-43db-9182-f632f69d694a/dd5f5c57-kidneycarebrief.md';
const BRIEF_OUT = 'docs/KIDNEYCARE_BRIEF.md';
const LINE = 'https://lin.ee/QcE7SSa';

if (!fs.existsSync(SRC)) { console.error('❌ ไม่เจอไฟล์ต้นทาง — นัทต้องส่งใหม่'); process.exit(1); }
let h = fs.readFileSync(SRC, 'utf8');

if (h.includes('u360-kidney-hold')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }

/* ── ① noindex ── */
if (!/name="robots"/.test(h)) {
  h = h.replace(/<meta name="viewport"[^>]*>/,
    m => m + '\n<!-- u360-kidney-hold: ยังไม่เปิดจริง — ฟอร์มยังไม่มีปลายทาง ห้ามให้ Google เก็บ -->\n'
           + '<meta name="robots" content="noindex,nofollow">');
  console.log('  ✅ กัน Google เก็บเข้าดัชนี');
}

/* ── ② ปิดปุ่มส่ง + บอกทางที่มีคนรับจริง ── */
const GUARD = `
<!-- ═══ u360-kidney-hold (m-track 31 ส.ค. 2026) — ลบทั้งก้อนนี้เมื่อฟอร์มมีปลายทางจริงแล้ว ═══
     เหตุผล: ฟอร์มนี้ไม่ส่งข้อมูลไปไหน (ตรวจแล้ว ไม่มี fetch สักจุด)
     ปล่อยไว้เฉยๆ = ผู้ป่วยกรอกค่าเลือดแล้วกดส่ง โดยไม่มีใครได้รับ -->
<style>
#u360hold{position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;
  background:#fff;border:1px solid #E3E7E0;border-radius:16px;padding:16px 18px;
  box-shadow:0 10px 30px rgba(0,0,0,.16);max-width:520px;margin:0 auto;
  font-family:'Noto Sans Thai',sans-serif;line-height:1.6}
#u360hold b{display:block;font-size:1.02rem;margin-bottom:4px}
#u360hold p{font-size:.92rem;color:#5C665A;margin:0 0 12px}
#u360hold a{display:block;text-align:center;background:#06C755;color:#fff;
  text-decoration:none;font-weight:600;padding:13px;border-radius:999px}
</style>
<script>
(function(){
  /* ปิดทุกปุ่มที่ทำหน้าที่ "ส่ง" — ตอนนี้กดไปก็ไม่มีอะไรเกิดขึ้นอยู่แล้ว
     แต่ต้องบอกให้ชัด ไม่ใช่ปล่อยให้เงียบ */
  var kill = function(){
    ['btnSend','btnSend2','btnPhotoSend','btnSendPhoto'].forEach(function(id){
      var b = document.getElementById(id);
      if(b){ b.disabled = true; b.textContent = 'ยังไม่เปิดรับผ่านหน้าเว็บ'; }
    });
  };
  var box = document.createElement('div');
  box.id = 'u360hold';
  box.innerHTML = '<b>ตอนนี้รับเคสผ่านไลน์เท่านั้น</b>'
    + '<p>หน้านี้ยังไม่เปิดรับข้อมูลผ่านเว็บ — ทักไลน์มาได้เลย '
    + 'มีคนอ่านและตอบจริง ส่งรูปผลเลือดในไลน์ได้เหมือนกัน</p>'
    + '<a href="${LINE}">ทักไลน์ Under360</a>';
  var go = function(){ kill(); document.body.appendChild(box);
                       setInterval(kill, 1200); /* หน้านี้สลับจอด้วย JS ปุ่มโผล่ใหม่ได้ */ };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
</script>
`;
h = h.replace(/<\/body>/i, GUARD + '</body>');
console.log('  ✅ ปิดปุ่มส่ง + ขึ้นกล่องพาไปไลน์');

fs.writeFileSync(OUT, h);
console.log('✅ ' + OUT + ' (' + (h.length / 1024 | 0) + 'KB · ฟอนต์ฝังในไฟล์ ~58KB)');

if (fs.existsSync(BRIEF_SRC) && !fs.existsSync(BRIEF_OUT)) {
  fs.copyFileSync(BRIEF_SRC, BRIEF_OUT);
  console.log('✅ ' + BRIEF_OUT);
}

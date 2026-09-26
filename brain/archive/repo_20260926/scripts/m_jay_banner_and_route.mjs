/* คอร์สเจ 2569 — เปิดทาง /jay + แบนเนอร์หน้าโฮม (บรีฟห้องเจ · นัทสั่งเอง 2 ก.ย. 2026)

   ⛔ แตะ web/vercel.json เฉพาะ rewrites — redirects 23 เส้นห้ามขยับ (มีตัวกันไว้ในสคริปต์)

   แบนเนอร์: ห้องเจสั่งว่า "ถอดออกทันทีเมื่อครบ 50 หรือหลัง 18 ต.ค."
   → ใส่ตัวหมดอายุอัตโนมัติไว้ด้วย (19 ต.ค. หายเอง) เพราะของแบบนี้คนลืมถอดเสมอ
     ครบ 50 ก่อนกำหนด = ลบก้อน u360-jay-banner ทิ้งได้เลย หรือตั้ง JAY_BANNER=false
   ⚠️ ห้ามใส่ตัวนับจำนวนที่ขายได้ — ห้องเจสั่งไว้ว่าถ้าเลขขยับช้า = โฆษณาว่าไม่มีใครซื้อ
   รันซ้ำได้ */
import fs from 'fs';

/* ── ① เส้นทาง /jay ── */
{
  const F = 'web/vercel.json';
  const v = JSON.parse(fs.readFileSync(F, 'utf8'));
  const before = JSON.stringify(v.redirects);
  if (v.rewrites.some(r => r.source === '/jay')) console.log('⏭️  มี /jay แล้ว');
  else {
    v.rewrites.push({ source: '/jay', destination: '/jay.html' });
    if (JSON.stringify(v.redirects) !== before || v.redirects.length !== 23) {
      console.error('🔴 redirects เปลี่ยน — หยุดทันที'); process.exit(1);
    }
    fs.writeFileSync(F, JSON.stringify(v, null, 2) + '\n');
    console.log('  ✅ /jay → /jay.html  (redirects ยังครบ ' + v.redirects.length + ' เส้น)');
  }
}

/* ── ② แบนเนอร์หน้าโฮม ── */
{
  const F = 'web/index.html';
  const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
  let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes('u360-jay-banner')) { console.log('⏭️  มีแบนเนอร์แล้ว'); }
  else {
    const ANCHOR = '</header>';
    if (!h.includes(ANCHOR)) { console.error('❌ ไม่เจอ </header>'); process.exit(1); }

    const BANNER = `</header>

<!-- ═══ u360-jay-banner (m · 2 ก.ย. 2026) — ลบทั้งก้อนนี้เมื่อครบ 50 คอร์ส ═══
     หายเองอัตโนมัติหลัง 18 ต.ค. 2026 (กันลืมถอด) -->
<a class="jaybar" id="jayBar" href="/jay?utm_source=web&utm_medium=banner&utm_campaign=jay2026" hidden>
  <span class="l">🌱 เปิดจองคอร์สอาหารเจ 2569 แล้ว</span>
  <span class="c">Early Bird ฿4,190 — จำกัด 50 คอร์สแรก</span>
  <span class="g">ดูรายละเอียด →</span>
</a>
<style>
.jaybar{display:flex;align-items:center;justify-content:center;gap:8px 18px;flex-wrap:wrap;
  background:linear-gradient(90deg,#1F7A4D,#2E9E5B);color:#fff;text-decoration:none;
  padding:13px 20px;text-align:center;line-height:1.45}
.jaybar .l{font-family:'Prompt',sans-serif;font-weight:600;font-size:1rem}
.jaybar .c{font-size:.94rem;opacity:.94}
.jaybar .g{font-family:'Prompt',sans-serif;font-weight:600;font-size:.94rem;
  background:rgba(255,255,255,.16);border-radius:999px;padding:5px 14px}
.jaybar:hover{filter:brightness(1.06)}
@media(max-width:640px){.jaybar{gap:4px 12px;padding:11px 16px}.jaybar .l{font-size:.95rem}.jaybar .c{font-size:.87rem}}
</style>
<script>
/* โชว์เฉพาะช่วงที่ยังขายอยู่ — ผ่าน 18 ต.ค. 2026 แล้วหายเอง ไม่ต้องรอใครมาถอด */
(function(){
  var JAY_BANNER = true;                 /* ครบ 50 คอร์สก่อนกำหนด → ตั้ง false */
  var END = new Date('2026-10-19T00:00:00+07:00').getTime();
  if(JAY_BANNER && Date.now() < END){
    var b = document.getElementById('jayBar'); if(b) b.hidden = false;
  }
})();
</script>
`;
    h = h.replace(ANCHOR, BANNER);
    fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
    console.log('  ✅ แบนเนอร์หน้าโฮม (มี utm + หมดอายุเอง 19 ต.ค.)');
  }
}

console.log('\n✅ เสร็จ');

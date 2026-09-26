/* ตัวนับถอยหลังแบบเดินจริง — นัทสั่งแก้ 9 ก.ย. 2026 (ผ่าน 06)

   นัท: "ทำตัวนับเรียลไทม์เลยได้ไหม เป็น วัน ชั่วโมง นาที
         แล้วก็ทำให้ลึกกว่านี้ ว่า เหลืออีก 28 วัน ก่อนสั่งเพื่อให้ทันกินเจ"

   🔑 จุดที่เปลี่ยนความหมาย: เดิมนับถึงวันที่เขาจะ "กิน" (10 ต.ค.)
      ของใหม่นับถึงวันที่เขาต้อง "ลงมือ" (7 ต.ค. 23:59 = ปิดรับจองรอบส่งแรก)
      เส้นตายของลูกค้าคือวันสุดท้ายที่สั่งแล้วยังทัน ไม่ใช่วันเริ่มเทศกาล

   ✅ ตรวจแล้วว่า 7 ต.ค. ตรงกับที่หน้าเว็บประกาศไว้เองในคำถามที่พบบ่อย
      ("คอร์สเต็ม 30 กล่อง ปิดรับจองวันที่ 7 ตุลาคม 2569") — ไม่ได้ตั้งเลขขึ้นมาเอง

   ⏰ เวลาไทย: ใช้ค่าเวลาสากล (UTC) ตายตัวเป็นเส้นตาย แทนการคำนวณโซนเวลาบนเครื่องผู้ใช้
      7 ต.ค. 23:59 ตามเวลาไทย = 16:59 UTC — วิธีนี้ได้ผลตรงกันทุกเครื่องทั่วโลก
      (นัทอยู่ PST · ลูกค้าอยู่ไทย · ถ้าคำนวณจากนาฬิกาเครื่องจะเพี้ยนคนละแบบ)

   🔴 กฎที่ 06 กำชับ: หมดเวลาแล้วห้ามโชว์ติดลบ · ห้ามแตะพิกเซล/utm/ปุ่ม LINE
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-countdown-live')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }

/* ── ถอดตัวนับเดิม (นับวันอย่างเดียว ถึง 10 ต.ค.) ── */
const s = h.indexOf('\n/* u360-countdown — นับวันถึงวันเริ่มเทศกาล');
must(s > 0, 'ไม่เจอตัวนับเดิม');
const e = h.indexOf('})();', s);
must(e > s, 'ไม่เจอท้ายตัวนับเดิม');

const NEW = `
/* u360-countdown-live — นับถอยหลังถึง "เส้นตายที่ลูกค้าต้องลงมือ" ไม่ใช่วันเริ่มเทศกาล
   ปิดรับจองรอบส่งแรก 7 ต.ค. 2569 23:59 เวลาไทย = 2026-10-07T16:59:00Z
   ใช้เวลาสากลตายตัว ไม่คำนวณโซนเวลาจากนาฬิกาเครื่องผู้ใช้ (เพี้ยนคนละแบบทุกเครื่อง) */
(function(){
  var el = document.getElementById('countdown'); if (!el) return;
  var DEADLINE = Date.UTC(2026, 9, 7, 16, 59, 0);   /* เดือนนับจาก 0 → 9 = ตุลาคม */

  function tick(){
    var left = DEADLINE - Date.now();
    if (left <= 0) {
      /* 🔴 หมดเวลาแล้วห้ามโชว์ติดลบ */
      el.textContent = 'ปิดรับจองรอบส่งแรกแล้ว';
      el.classList.remove('urgent');
      el.removeAttribute('hidden');
      return false;
    }
    var mins  = Math.floor(left / 60000);
    var days  = Math.floor(mins / 1440);
    var hours = Math.floor((mins % 1440) / 60);
    var m     = mins % 60;
    el.innerHTML = '⏳ เหลืออีก <b>' + days + '</b> วัน <b>' + hours + '</b> ชม. <b>'
                 + m + '</b> นาที ก่อนปิดรับจองรอบส่งแรก';
    /* เหลือน้อยกว่า 7 วัน = เปลี่ยนสีเอง เพิ่มแรงกดดันโดยไม่ต้องเขียนอะไรเกินจริง */
    el.classList.toggle('urgent', days < 7);
    el.removeAttribute('hidden');
    return true;
  }

  if (tick()) {
    /* เดินทุก 1 นาทีพอ — วินาทีวิ่งรัวๆ ดูเป็นของปลอม และกินแบตมือถือฟรีๆ */
    var t = setInterval(function(){ if (!tick()) clearInterval(t); }, 60000);
    /* กลับมาเปิดแท็บอีกครั้งให้อัปเดตทันที ไม่ต้องรอครบนาที */
    document.addEventListener('visibilitychange', function(){ if (!document.hidden) tick(); });
  }
})();`;

h = h.slice(0, s) + NEW + h.slice(e + 5);
console.log('  ✅ เปลี่ยนเป็นนับ วัน/ชม./นาที ถึง 7 ต.ค. 23:59 (เส้นปิดรับจอง)');

/* ── สีตอนใกล้หมดเวลา ── */
must(h.includes('</style>'), 'ไม่เจอ </style>');
h = h.replace('</style>', `    /* ── u360-countdown-live ── */
    .countdown.urgent { background:#FFF4E5; border-color:#F3D3A0; color:#9A5B00; }
</style>`);
console.log('  ✅ เหลือน้อยกว่า 7 วัน เปลี่ยนเป็นสีส้มอัตโนมัติ');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F);

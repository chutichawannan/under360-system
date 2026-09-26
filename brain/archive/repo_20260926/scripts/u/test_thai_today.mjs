/* เทส "วันนี้" ต้องเป็นวันไทย ไม่ใช่วัน UTC (นัทสั่ง 14 ก.ย. 2569 · กะปันไล่เจอ)

   ที่มา: กะปันรายงานวันจองของลูกค้าผิด — บอกว่า "จองเมื่อวาน" ทั้งที่จองวันนี้
          เพราะอ่านเวลาดิบโดยไม่ +7 → นัทสั่งไล่เช็คทั้ง repo ว่าใครมั่วทามโซนอีก

   ทำไมจับยาก: ไทย 00:00-06:59 วัน UTC ยังเป็นเมื่อวาน
   → คำนวณ "วันนี้" ผิดไป 1 วัน **โดยไม่มี error ให้เห็น** เงียบสนิท
   เทสนี้จึงต้องมี ไม่งั้นใครเผลอเขียนแบบเดิมอีกก็ไม่มีอะไรเตือน */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const read = (p) => fs.readFileSync(new URL('../../' + p, import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');

let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL+'     ได้  '+g+NL+'     ควร  '+w); } };

/* ไฟล์ที่คำนวณ "วันนี้" แล้วเอาไปใช้จริง (กรองข้อมูล / stamp ลงฐานข้อมูล / ตัดสินใจส่งแจ้งเตือน) */
const FILES = [
  ['report.html',               'ช่วงวันที่ของรายงาน'],
  ['liff_profile.html',         'วันที่ตอนลูกค้าผูกบัญชีเก่า'],
  ['liff_register.html',        'วันที่ตอนลูกค้าสมัคร'],
  ['api/notify-mp-requests.js', 'cron เปิด/ปิดหน้าต่างขอเปลี่ยนเมนู + เตือนก่อนส่ง'],
];

console.log(NL + '① ห้ามเอาวัน UTC มาเป็น "วันนี้"');
FILES.forEach(([f, what]) => {
  const s = read(f);
  /* ประกอบสตริงเอง ไม่พิมพ์ตรง ๆ — ไม่งั้นเทสจับตัวเองในบรรทัดนี้ */
  const bad = 'new Date().toISOString().' ;
  t(f + ' — ' + what, s.indexOf(bad + 'slice(0, 10)') < 0 && s.indexOf(bad + 'slice(0,10)') < 0 &&
    s.indexOf(bad + 'split("T")[0]') < 0, true);
});

console.log(NL + '② ใช้สูตรวันไทยที่บ้านนี้ใช้กันอยู่');
FILES.forEach(([f]) => {
  const s = read(f);
  t(f + ' บวก 7 ชั่วโมงก่อนตัดวันที่', s.indexOf('Date.now() + 7 * 3600e3') >= 0 || s.indexOf('Date.now()+7*3600e3') >= 0, true);
});

console.log(NL + '③ สูตรนี้ให้วันไทยจริง ไม่ใช่แค่ดูเหมือนถูก');
{
  /* ไทย 01:00 ของวันที่ 15 = UTC 18:00 ของวันที่ 14 — ช่วงที่ของเดิมพลาด */
  const utc = Date.UTC(2026, 8, 14, 18, 0, 0);
  t('ตี 1 วันที่ 15 (ไทย) ต้องได้ 15 ไม่ใช่ 14',
    new Date(utc + 7 * 3600e3).toISOString().slice(0, 10), '2026-09-15');
  t('เทียบกับของเดิมที่ให้ 14 — พิสูจน์ว่าบั๊กมีจริง',
    new Date(utc).toISOString().slice(0, 10), '2026-09-14');
  /* กลางวันไทยไม่เคยพลาดอยู่แล้ว — เทสไว้กันแก้เกินจนวันกลางวันเพี้ยน */
  const noon = Date.UTC(2026, 8, 14, 5, 0, 0);   // เที่ยงไทย
  t('เที่ยงวันไทยยังได้วันเดิม', new Date(noon + 7 * 3600e3).toISOString().slice(0, 10), '2026-09-14');
}

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + ok) : ('✅ ผ่านทั้งหมด ' + ok + ' ข้อ'));
process.exitCode = fail ? 1 : 0;

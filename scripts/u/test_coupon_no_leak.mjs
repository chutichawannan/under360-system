/* 🔒 เทสสำคัญ: โค้ดที่ยังทดสอบอยู่ ต้องไม่โผล่หน้าลูกค้าจริงเด็ดขาด
   ดึงไฟล์จาก production จริงมาตรวจ ไม่ใช่ไฟล์ในเครื่อง

   ── ปรับ 9 ก.ย. 2569 ────────────────────────────────────────────────
   เทสฉบับก่อนฟ้อง 🔴 4 จุดทุกครั้งที่รัน มาตั้งแต่ 1 ก.ย.
   ไม่ใช่เพราะระบบพัง แต่เพราะ **นัทสั่งเปิดกระเป๋าคูปองให้ลูกค้าทุกคน**
   (`cwEnabled()` คืน true ถาวร) แล้วเทสยังยืนยันของเก่าที่ว่าต้องคุมด้วยโหมดทดสอบ
   + ชื่อคีย์เปลี่ยนจาก `CW_KEY='coupon_wallet_beta'` เป็น `CW_PREFIX='cw:'` (แยกแถวรายคน)

   🔴 เทสที่ฟ้องแดงทุกวันจนคนชิน = เทสที่ตายแล้ว วันที่มันแดงเพราะของพังจริงจะไม่มีใครดู
      → อัปให้ตรงกับพฤติกรรมที่ "ตั้งใจให้เป็น" ตอนนี้ และเก็บข้อที่ยังมีความหมายไว้
   ──────────────────────────────────────────────────────────────────── */
const NL = String.fromCharCode(10);
const src = await (await fetch('https://under360-system.vercel.app/liff_customer.html')).text();

let ok = 0, bad = 0;
const t = (why, pass) => { if (pass) { ok++; console.log('  ✅', why); } else { bad++; console.log('  🔴', why); } };

console.log(NL + '① สิ่งที่ตั้งใจให้เป็นตอนนี้');
t('กระเป๋าคูปองเปิดให้ลูกค้าทุกคน (นัทสั่ง 1 ก.ย.)', /function cwEnabled\(\)\{ return true; \}/.test(src));
t('เก็บแยกแถวรายคน ไม่ใช่ก้อนรวม (สองคนกดพร้อมกันไม่ทับกัน)', /const CW_PREFIX = 'cw:'/.test(src));

console.log(NL + '② 🔒 โค้ดทดสอบต้องไม่หลุดถึงลูกค้า — ยังต้องจริงเสมอ');
/* ตัวกรองมี 2 ที่: ชิปแนะนำหน้าจ่ายเงิน กับ รายการในกระเป๋า — ต้องมีทั้งคู่
   (หลุดที่ใดที่หนึ่งก็คือหลุด) */
const guards = src.match(/\/\^BETA\/i\.test\(p\.code\|\|''\) && !betaOn\('coupon_wallet'\)/g) || [];
t('มีตัวกรอง BETA ครบทั้ง 2 จุด (ชิปแนะนำ + กระเป๋า) — เจอ ' + guards.length, guards.length >= 2);

/* รันตัวกรองจริงที่ยกมาจากไฟล์ ไม่ใช่เขียนเลียนแบบ */
const line = (src.match(/if\(\/\^BETA\/i\.test\(p\.code\|\|''\) && !betaOn\('coupon_wallet'\)\) return false;/) || [])[0];
if (!line) { bad++; console.log('  🔴 ยกตัวกรองจริงมารันไม่ได้ — รูปแบบโค้ดเปลี่ยนไป ต้องอัปเทส'); }
else {
  const run = new Function('betaOn', 'p', line + ' return true;');
  const promos = ['FREESHIP', 'JAYOLD', 'BETA200', 'beta10', 'BETASHIP'].map((c) => ({ code: c }));
  const seenByCustomer = promos.filter((p) => run(() => false, p));   // ลูกค้าทั่วไป
  const seenByTester   = promos.filter((p) => run(() => true, p));    // คนทดสอบ
  console.log('     ลูกค้าทั่วไปเห็น: ' + seenByCustomer.map((p) => p.code).join(', '));
  t('ลูกค้าทั่วไปไม่เห็นโค้ด BETA สักตัว', !seenByCustomer.some((p) => /^BETA/i.test(p.code)));
  t('โค้ดขายจริงยังเห็นปกติ', seenByCustomer.length === 2);
  t('พิมพ์ตัวเล็ก beta10 ก็ยังถูกกรอง', !seenByCustomer.some((p) => p.code === 'beta10'));
  t('คนทดสอบเห็นครบทุกใบ', seenByTester.length === promos.length);
}

console.log(NL + (bad ? ('🔴 มีปัญหา ' + bad + ' จุด') : ('✅ ผ่านทุกข้อ ' + ok)));
/* ใช้ exitCode ไม่ใช่ process.exit() — บน Windows การสั่งออกทันทีหลัง fetch
   ทำให้ Node พ่น "Assertion failed ... async.c" ต่อท้าย ซึ่งดูเหมือนเทสพัง
   ทั้งที่ผ่านหมด (ตัวเดียวกับที่ทำให้ test_beta_mode ดูเหมือนเสีย) */
process.exitCode = bad ? 1 : 0;

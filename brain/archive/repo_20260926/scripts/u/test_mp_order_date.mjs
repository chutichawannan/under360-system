/* เทส "วันในใบ = วันของรอบ" — เคส 03 สาเหตุ A (9 ก.ย. 2569)
   บั๊กเดิม: 2 ค่านี้คำนวณกันคนละที่ ไม่มีอะไรบังคับให้ตรง
     orders.delivery_date = selDate (ตัวเลือกวันหลัก · ปิดรับ 18:00 วันก่อน)
     รอบผลิตของครัว       = วันที่เลือกในป้อบ MP / จ-พ-ศ ถัดไป (ปิดรับ 08:30 วันส่ง)
   → Cherry สั่งเช้าวันจันทร์ รอบลงจันทร์ ใบลงพุธ → ครัวทำแล้วแต่ใบค้าง

   ดึงฟังก์ชันจริงจากไฟล์มารัน ไม่เขียนเลียนแบบ */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');

const grab = (n) => {
  const i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; st = true; }
    else if (src[j] === '}') { d--; if (st && d === 0) return src.slice(i, j + 1); }
  }
};

let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); }
  else { fail++; console.log('  ❌', n, NL + '     ได้  ' + g + NL + '     ควร  ' + w); }
};

const body = [grab('mpRoundDates'), grab('orderDateForCart')].join(NL);
const MP_SETS = [
  { id: 'trial', boxes: 7 }, { id: 'weekly', boxes: 21 }, { id: 'monthly', boxes: 84 },
];
const mk = (cart, selDate) => new Function('cart', 'selDate', 'MP_SETS', 'localYMD',
  body + '; return { mpRoundDates, orderDateForCart };')(
    cart, selDate, MP_SETS,
    (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10));

const mp = (set, days) => ({ type: 'meal_plan', mp_set: set, mp_days: days });
const box = { type: 'individual', code: 'S1' };

/* 2026-09-07 จันทร์ · 09-09 พุธ · 09-11 ศุกร์ · 09-14 จันทร์ */
console.log(NL + '① เคส Cherry — สั่งเช้าวันจันทร์ รอบลงจันทร์ ใบต้องลงจันทร์ด้วย');
{
  const e = mk([mp('trial', ['2026-09-07'])], '2026-09-09');
  t('รอบแรก = 7 ก.ย.', e.mpRoundDates({ mp_days: ['2026-09-07'] }, 1), ['2026-09-07']);
  t('🔴 ใบต้องลง 7 ก.ย. ไม่ใช่ 9 ก.ย. (นี่คือบั๊กเดิม)', e.orderDateForCart(), '2026-09-07');
}

console.log(NL + '② ไม่มี Meal Plan ในตะกร้า — ต้องไม่กระทบอะไรเลย');
{
  t('เมนูเดี่ยว → คืน null = ใบใช้ selDate เหมือนเดิม', mk([box], '2026-09-09').orderDateForCart(), null);
  t('แพคเกจ → คืน null', mk([{ type: 'package' }], '2026-09-09').orderDateForCart(), null);
  t('ตะกร้าว่าง → คืน null', mk([], '2026-09-09').orderDateForCart(), null);
}

console.log(NL + '③ ลูกค้าไม่ได้เลือกวันเอง — ต้องเลื่อนไป จ/พ/ศ ที่ใกล้สุด');
{
  t('เลือกอังคาร 8 ก.ย. → รอบไปพุธ 9 ก.ย.', mk([mp('trial', null)], '2026-09-08').orderDateForCart(), '2026-09-09');
  t('เลือกจันทร์ 7 ก.ย. → อยู่จันทร์ ไม่เลื่อน', mk([mp('trial', null)], '2026-09-07').orderDateForCart(), '2026-09-07');
  t('เลือกเสาร์ 12 ก.ย. → ไปจันทร์ 14 ก.ย.', mk([mp('trial', null)], '2026-09-12').orderDateForCart(), '2026-09-14');
}

console.log(NL + '④ วันของทุกรอบ — เลือกมาไม่ครบต้องเติมต่อด้วย จ/พ/ศ');
{
  const e = mk([], '2026-09-07');
  t('เลือกครบ 3 วัน = ใช้ตามนั้น',
    e.mpRoundDates({ mp_days: ['2026-09-07', '2026-09-11', '2026-09-16'] }, 3),
    ['2026-09-07', '2026-09-11', '2026-09-16']);
  t('เลือกมาวันเดียว จาก 3 รอบ = เติมต่อ จ/พ/ศ',
    e.mpRoundDates({ mp_days: ['2026-09-07'] }, 3), ['2026-09-07', '2026-09-09', '2026-09-11']);
  t('ไม่เลือกเลย = นับจาก selDate', e.mpRoundDates({}, 3), ['2026-09-07', '2026-09-09', '2026-09-11']);
  t('รอบเดียว', e.mpRoundDates({}, 1), ['2026-09-07']);
}

console.log(NL + '⑤ หลายชุดในตะกร้าเดียว — ใบต้องลงวันที่เร็วที่สุด');
{
  const e = mk([mp('trial', ['2026-09-11']), mp('weekly', ['2026-09-07'])], '2026-09-16');
  t('เอาวันแรกสุด ครัวเริ่มทำวันนั้น', e.orderDateForCart(), '2026-09-07');
}

console.log(NL + '⑥ Meal Plan ปนกับของอื่น — ยังยึดวันของรอบ');
{
  t('MP + เมนูเดี่ยว', mk([mp('trial', ['2026-09-07']), box], '2026-09-09').orderDateForCart(), '2026-09-07');
}

console.log(NL + '⑦ ของเสียรูป ต้องไม่ทำออเดอร์ล่ม');
{
  t('mp_set ที่ไม่รู้จัก → ยังคำนวณได้ ไม่ throw',
    mk([{ type: 'meal_plan', mp_set: 'ไม่มีจริง', mp_days: ['2026-09-07'] }], '2026-09-09').orderDateForCart(), '2026-09-07');
  t('mp_days เป็นค่าขยะ → ถอยไปนับจาก selDate',
    mk([{ type: 'meal_plan', mp_set: 'trial', mp_days: 'ไม่ใช่ลิสต์' }], '2026-09-07').orderDateForCart(), '2026-09-07');
  t('cart เป็น null → คืน null ไม่ throw', mk(null, '2026-09-07').orderDateForCart(), null);
}

console.log(NL + '⑧ ทุกที่ที่หมายถึง "วันในใบ" ต้องอ้างตัวเดียวกัน');
{
  t('ใบใช้ orderDate', src.includes('delivery_date:   orderDate,'), true);
  t('🔴 ตัวตัดสินเปิดใบรอบถัดไป เทียบ orderDate ไม่ใช่ selDate (กันบั๊ก N-27 กลับมา)',
    src.includes("r.delivery_date === orderDate) return;"), true);
  t('หน้าสั่งสำเร็จโชว์วันเดียวกับในใบ', src.includes('${fmtDate(orderDate)}<br>'), true);
  t('รอบผลิตเรียกฟังก์ชันกลางตัวเดียวกัน', src.includes('const dates = mpRoundDates(cartItem, totalRounds);'), true);
}

console.log(NL + (fail ? '❌' : '✅') + ' ผ่าน ' + ok + ' · ตก ' + fail);
process.exitCode = fail ? 1 : 0;

/* ค่าส่งแพค — นัทเปลี่ยนวิธีคิดเอง 21 ก.ย. 2569 (ผ่าน 06)
   กติกา: แพคที่มี "เพดานค่าส่ง" → ค่าส่งจริง ≤ เพดาน = ลูกค้าจ่าย ฿0 · เกินเพดาน = จ่ายแค่เพดาน (ร้านออกส่วนเกิน)
   Pack S เพดาน ฿100 · Pack M/L + Meal Plan = ฟรีทั้งประเทศ (ไม่มีเพดาน)
   เคสจริงที่พังก่อนแก้: U-0922-003 Pack S ส่งนครสวรรค์ 243 กม. คิด ฿0

   ⚠️ ไม่แยกเขตแล้ว (สเปคเดิมเมื่อเช้าแยก กทม./ตจว.) — ลูกค้าปริมณฑลที่ค่าส่งจริงไม่ถึงร้อยต้องไม่โดนเก็บเหมา */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const L = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL + '     ได้  ' + g + NL + '     ควร  ' + w); } };

const a = L.indexOf('function packShipTarget(feeNow){'), b = L.indexOf(NL + '// ส่งฟรีสำหรับ "การแสดงผล"', a);
const src = L.slice(a, b);
const S = 'pack-s-id', M = 'pack-m-id';
const pay = (cart, fee, caps) => {
  const target = new Function('cart', 'packUpFee', 'deliveryFeeKnown', 'calcDeliveryFee', 'distKm', 'selSlot',
    src + '; return packShipTarget;')(cart, caps || { [S]: 100 }, () => true, () => fee, 1, 'afternoon')(fee);
  return target == null ? fee : Math.max(0, fee - Math.max(0, fee - target));  // เท่ากับที่ computeOrder คิด
};
const pack = (id) => ({ type: 'package', package_id: id, free_shipping: true });

console.log(NL + '① Pack S — เพดาน ฿100');
t('ตจว. ค่าส่งจริงชนเพดานระบบ 200 → จ่าย 100', pay([pack(S)], 200), 100);
t('กทม. ค่าส่งจริง 69 (ไม่ถึงเพดาน) → ฟรี', pay([pack(S)], 69), 0);
t('ปริมณฑล ค่าส่งจริง 100 พอดี → ฟรี (ไม่ใช่เก็บ 100)', pay([pack(S)], 100), 0);
t('ค่าส่งจริง 101 → จ่ายแค่ 100', pay([pack(S)], 101), 100);
t('ค่าส่งจริง 10 (ใกล้มาก) → ฟรี', pay([pack(S)], 10), 0);

console.log(NL + '② ไม่มีเพดาน = ฟรีทั้งประเทศ');
t('Pack M ตจว.', pay([pack(M)], 200), 0);
t('Meal Plan ตจว.', pay([{ type: 'meal_plan' }], 200), 0);
t('S + M อยู่ด้วยกัน = ใช้เพดานใบที่มีเพดาน ไม่บวกกัน', pay([pack(S), pack(M)], 200), 100);

console.log(NL + '③ ตะกร้าที่ไม่มีของส่งฟรี = คิดตามระยะเหมือนเดิม');
t('ข้าวกล่องเดี่ยว ตจว.', pay([{ code: 'S1', price: 125 }], 200), 200);
t('แพคที่ไม่ได้ติ๊กส่งฟรี', pay([{ type: 'package', package_id: 'x', free_shipping: false }], 200), 200);

console.log(NL + '④ กันพังเวลาอ่าน config ไม่ได้');
t('ไม่มีคีย์เลย = ฟรี (ห้ามเผลอคิดเงินลูกค้า)', pay([pack(S)], 200, {}), 0);

console.log(NL + '⑤ เก็บนโยบายที่เดียว ไม่ฮาร์ดโค้ดกระจาย');
t('อ่านจาก kitchen_data คีย์ pack_upcountry_fee', L.indexOf("const PACKSHIP_KEY = 'pack_upcountry_fee';") >= 0, true);
t('อยู่ใน batch โหลด config เดิม ไม่ยิง query ใหม่', L.split('CFG_KEYS')[1].split(']')[0].indexOf('PACKSHIP_KEY') >= 0, true);
t('ไม่มีรหัสแพค/ตัวเลขเพดานฝังในโค้ด', L.indexOf('c092c6d7') < 0 && L.indexOf('cap = 100') < 0, true);
t('เลิกแยกเขตแล้ว (ไม่เหลือ isOutOfProvince ในตัวคิดค่าส่งแพค)', src.indexOf('isOutOfProvince') < 0, true);
t('ตัวเลขค่าส่งทุกจุดเรียกตัวเดียวกัน', L.split('packShipTarget(').length - 1 >= 5, true);

console.log(NL + 'ผ่าน ' + ok + ' · ตก ' + fail);
if (fail) process.exit(1);

/* ค่าส่งแพคต่างจังหวัด — นัทสั่งเอง 20 ก.ย. 2569 (ผ่าน 06)
   "ให้แพค S ค่าส่ง 100 แล้วเช็คด้วยว่าตรงไหนขึ้นไม่ตรงอีก สั่งแก้ให้เป็นทิศทางเดียวกันทั้งหมด"
   เคสจริงที่พัง: U-0922-003 Pack S ส่งนครสวรรค์ 243 กม. คิด ฿0 (ธง free_shipping แยกเขตไม่ได้)

   นโยบาย: กทม.–ปริมณฑล ฟรีทุกไซส์ · ตจว. Pack S ฿100 · M/L ฟรี */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const L = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL + '     ได้  ' + g + NL + '     ควร  ' + w); } };

const a = L.indexOf('function packShipTarget(){'), b = L.indexOf(NL + '// ส่งฟรีสำหรับ "การแสดงผล"', a);
const src = L.slice(a, b > a ? b : undefined).split(NL).slice(0, 12).join(NL);
const S = 'pack-s-id', M = 'pack-m-id';
const target = (cart, out, fees) => new Function('cart', 'isOutOfProvince', 'packUpFee', src + '; return packShipTarget();')(cart, out, fees || { [S]: 100 });
const pack = (id) => ({ type: 'package', package_id: id, free_shipping: true });

console.log(NL + '① ต่างจังหวัด');
t('Pack S = เก็บ ฿100', target([pack(S)], true), 100);
t('Pack M = ฟรี', target([pack(M)], true), 0);
t('Meal Plan = ฟรี (นโยบายส่งฟรีทุกแพ็ค)', target([{ type: 'meal_plan' }], true), 0);
t('S + M อยู่ด้วยกัน = เก็บครั้งเดียว ฿100 ไม่บวกกัน', target([pack(S), pack(M)], true), 100);

console.log(NL + '② กรุงเทพฯ–ปริมณฑล ต้องไม่เปลี่ยนจากเดิม');
t('Pack S = ฟรี', target([pack(S)], false), 0);
t('Pack M = ฟรี', target([pack(M)], false), 0);

console.log(NL + '③ ตะกร้าที่ไม่มีของส่งฟรี = คิดตามระยะเหมือนเดิม');
t('ข้าวกล่องเดี่ยว ตจว.', target([{ code: 'S1', price: 125 }], true), null);
t('แพคที่ไม่ได้ติ๊กส่งฟรี', target([{ type: 'package', package_id: 'x', free_shipping: false }], true), null);

console.log(NL + '④ กันพังเวลาอ่าน config ไม่ได้');
t('ไม่มีคีย์เลย = ฟรีเหมือนเดิม (ห้ามเผลอคิดเงินลูกค้า)', target([pack(S)], true, {}), 0);

console.log(NL + '⑤ เก็บนโยบายที่เดียว ไม่ฮาร์ดโค้ดกระจาย');
t('อ่านจาก kitchen_data คีย์ pack_upcountry_fee', L.indexOf("const PACKSHIP_KEY = 'pack_upcountry_fee';") >= 0, true);
t('อยู่ใน batch โหลด config เดิม ไม่ยิง query ใหม่', L.indexOf('CARDMIN_KEY, OFFER_KEY, PACKSHIP_KEY]') >= 0, true);
t('ไม่มีรหัสแพค/ราคาฝังตายในโค้ด', L.indexOf('c092c6d7') < 0 && !/upcountry[^]{0,40}=\s*100/.test(L), true);
t('ตัวเลขค่าส่ง 2 จุด (ใต้แผนที่ · ตอนปักหมุด) ใช้ตัวเดียวกับที่คิดเงิน', L.split('packShipTarget()===0').length - 1 === 2, true);
t('คำว่า "ฟรี" ในสรุปยอดก็ใช้ตัวเดียวกัน', L.indexOf('  const t = packShipTarget();') >= 0, true);
t('ไม่เหลือทางเก่าที่ยกเว้นค่าส่งทุกเขต', L.indexOf('if(pkgFreeShip || vipFreeShip) shipDisc = fee;') < 0, true);

console.log(NL + 'ผ่าน ' + ok + ' · ตก ' + fail);
if (fail) process.exit(1);

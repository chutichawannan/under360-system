/* เทสข้อเสนอท้ายตะกร้า — นัทสั่งเอง 15 ก.ย. 2569
   "ทำหน้า checkout ด้วย เป็นเหมือนข้อเสนอ รับสิทธิพิเศษ ซื้อซาลาเปา 1 แพค ลดเหลือ 199
    จะได้ระบายๆ ออกไปซะ"

   เจตนาคือระบายของ ไม่ใช่โปรถาวร → 3 อย่างที่พลาดไม่ได้:
     ① ราคาที่ลงออเดอร์ต้องเป็นราคาข้อเสนอจริง ไม่ใช่ราคาเต็มแล้วไปลดทีหลัง (บัญชีเพี้ยน)
     ② กดซ้ำไม่ได้ ไม่งั้นราคาพิเศษกลายเป็นราคาจริง
     ③ ของหมด/ปิดขาย = ไม่โชว์ ไม่ใช่โชว์แล้วกดไม่ได้ */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const L = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL+'     ได้  '+g+NL+'     ควร  '+w); } };
const has = (x) => L.indexOf(x) >= 0;

console.log(NL + '① ราคาต้องลงออเดอร์เป็นราคาข้อเสนอจริง');
/* order_items อ่าน unit_price จากราคาในตะกร้าตรง ๆ → ต้องใส่ราคาข้อเสนอตั้งแต่ตอน push */
t('ใส่ราคาข้อเสนอลงตะกร้าเลย', has('price: Number(o.price || 0)'), true);
t('ออเดอร์ยังอ่านราคาจากตะกร้าเหมือนเดิม', has('unit_price: c.price'), true);
t('ไม่ได้ทำเป็นโค้ดโปรโมชั่น (บทเรียน SALMON: ต้องพิมพ์เอง = ไม่มีคนใช้)',
  !has("applyPromo('MC2') ") && !has('OFFER_PROMO_CODE'), true);

console.log(NL + '② กดซ้ำไม่ได้');
t('มีในตะกร้าแล้ว = ไม่เพิ่มอีก', has('if(offerInCart(mi)){'), true);
t('เปลี่ยนเป็นป้ายบอกว่าได้ราคาพิเศษแล้ว', has('offer-got') && has('ได้ราคาพิเศษแล้ว'), true);

console.log(NL + '③ เงื่อนไขการโชว์ — ไม่ผ่านข้อไหนคือไม่โชว์');
t('ปิดข้อเสนอได้จากฐานข้อมูล', has('o.active === false'), true);
t('เมนูถูกปิดขาย = ไม่โชว์', has('mi.is_available === false'), true);
t('ของหมด = ไม่โชว์', has('if(st != null && Number(st) <= 0) return null;'), true);
t('ตะกร้าว่าง = ไม่โชว์', has('if(!hit || !cart.length) return;'), true);

console.log(NL + '④ แก้ได้จากฐานข้อมูล ไม่ต้องแตะโค้ด');
t('อ่านจาก kitchen_data คีย์ checkout_offer', has("const OFFER_KEY = 'checkout_offer';"), true);
t('อยู่ใน batch โหลด config เดิม ไม่ยิง query ใหม่', L.split('CFG_KEYS')[1].split(']')[0].indexOf('OFFER_KEY') >= 0, true);
t('ไม่มีรหัสสินค้า/ราคาฝังตายในโค้ด', !has("code: 'MC2'") && !has('price: 199'), true);
t('ไม่มีคีย์ = ไม่มีข้อเสนอ หน้าเดิมทุกอย่าง', has('checkoutOffer = (cfgMap[OFFER_KEY]'), true);

console.log(NL + '⑤ ที่วาง — ต้องเห็นตอนกำลังจะจ่ายเงิน');
t('อยู่เหนือปุ่มยืนยันส่งออเดอร์',
  L.indexOf('<div id="conf-offer"></div>') < L.indexOf('id="sub-btn-confirm"'), true);
t('วาดใหม่ทุกครั้งที่เข้าหน้ายืนยัน', has('renderOffer();   // ข้อเสนอท้ายตะกร้า'), true);

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + ok) : ('✅ ผ่านทั้งหมด ' + ok + ' ข้อ'));
process.exitCode = fail ? 1 : 0;

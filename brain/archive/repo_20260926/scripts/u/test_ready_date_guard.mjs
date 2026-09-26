/* เทสด่าน "ห้ามสั่งส่งก่อนวันที่เมนูเริ่มขาย" 2 ประตู — ดึงฟังก์ชันจริงจากไฟล์มารัน
   ที่มา: นัทเคาะวงจรเมนูใหม่ 11 ก.ย. 2569 — เปิดขายเมนูสัปดาห์หน้าทุกศุกร์ 18:00
          ศุกร์เย็น–อาทิตย์ เมนูใหม่เปิดอยู่แต่ครัวยังไม่ได้ทำ
   เคสจริงที่ห้ามเกิดซ้ำ: U-0823-013 เมนูเริ่ม 24 ส.ค. แต่สั่งส่ง 23 ส.ค.
   ประตู 1 = LIFF (ด่านตอนกดสั่ง) · ประตู 2 = หน้าสั่งแทนลูกค้าใน operation_hub */
import fs from 'node:fs';

const CR = String.fromCharCode(13), NL = String.fromCharCode(10);
const read = (p) => fs.readFileSync(new URL('../../' + p, import.meta.url), 'utf8').split(CR).join('');
const LIFF = read('liff_customer.html');
const OH = read('operation_hub.html');

/* ตัดฟังก์ชันตามวงเล็บปีกกา — ใช้กับฟังก์ชันสั้นที่ไม่มีปีกกาในข้อความ */
const grab = (src, name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('ไม่เจอฟังก์ชัน ' + name);
  let d = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
};
/* ตัวฟังก์ชันยาว — ตัดถึงฟังก์ชันระดับบนสุดตัวถัดไป (ไม่ต้องนับปีกกาในข้อความ) */
const bodyOf = (src, head) => {
  const i = src.indexOf(head);
  if (i < 0) throw new Error('ไม่เจอ ' + head);
  const cands = [NL + 'function ', NL + 'async function '].map((t) => src.indexOf(t, i + head.length)).filter((x) => x > 0);
  return src.slice(i, Math.min(...cands));
};

let ok = 0, bad = 0;
const t = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅ ' + name); }
  else { bad++; console.log('  🔴 ' + name + NL + '     ได้  ' + g + NL + '     ควร ' + w); }
};

console.log('── ประตู 1: LIFF ──');
const liffFn = (cart, menuItems) => new Function('cart', 'menuItems',
  grab(LIFF, 'cartEarliestReadyDate') + NL + grab(LIFF, 'cartDateBeforeReady') + '; return cartDateBeforeReady;')(cart, menuItems);
{
  const menus = [{ id: 'new', available_from: '2026-09-21' }, { id: 'old', available_from: '2026-09-07' }, { id: 'reg' }];
  const f = liffFn([{ id: 'new' }], menus);
  t('เมนูเริ่ม 21 · เลือกส่งเสาร์ 19 → บล็อก บอกวันที่ 21', f('2026-09-19'), '2026-09-21');
  t('เมนูเริ่ม 21 · เลือกส่งอาทิตย์ 20 → บล็อก', f('2026-09-20'), '2026-09-21');
  t('เมนูเริ่ม 21 · เลือกส่งจันทร์ 21 → ผ่าน', f('2026-09-21'), null);
  t('เมนูเริ่ม 21 · เลือกส่ง 22 → ผ่าน', f('2026-09-22'), null);
  const mix = liffFn([{ id: 'old' }, { id: 'new' }, { id: 'reg' }], menus);
  t('ตะกร้าปนชุดเก่า+ชุดใหม่+เมนูประจำ → ใช้วันช้าสุด', mix('2026-09-20'), '2026-09-21');
  t('ชุดเก่าอย่างเดียว (เริ่มขายไปแล้ว) → ผ่าน', liffFn([{ id: 'old' }], menus)('2026-09-12'), null);
  t('เมนูประจำไม่มีวันเริ่ม → ผ่าน', liffFn([{ id: 'reg' }], menus)('2026-09-12'), null);
  t('ของในตะกร้าที่ไม่ใช่เมนูเดี่ยว (เซ็ต/MP) → ไม่นับ', liffFn([{ id: 'pkg-uuid', type: 'package' }], menus)('2026-09-12'), null);
  t('ยังไม่เลือกวัน → ไม่ตัดสิน (ด่านเลือกวันจับอยู่แล้ว)', f(null), null);
}
{
  const sub = bodyOf(LIFF, 'async function submitOrder(');
  const iGuard = sub.indexOf('cartDateBeforeReady(selDate)');
  const iSlot = sub.indexOf("if (!selSlot)");
  const iInsert = sub.indexOf("from('orders').insert(");
  t('submitOrder เรียกด่านวันพร้อมขาย', iGuard > 0, true);
  t('ด่านอยู่หลังเช็คช่วงเวลา และก่อนสร้างใบ', iSlot > 0 && iGuard > iSlot && iInsert > iGuard, true);
  const blk = sub.slice(iGuard, iGuard + 400);
  t('ตกด่าน = ล้างวัน + วาดตัวเลือกวันใหม่ + ออกทันที', /selDate = null/.test(blk) && blk.includes('renderDatePick()') && blk.includes('return;'), true);
}

console.log(NL + '── ประตู 2: หน้าสั่งแทนลูกค้า (OH) ──');
const ohFn = (obCart, obMenus) => new Function('obCart', 'obMenus', grab(OH, 'obCartReadyDate') + '; return obCartReadyDate();')(obCart, obMenus);
{
  const menus = [{ code: 'S158', available_from: '2026-09-21' }, { code: 'S017', available_from: '2026-09-07' }, { code: 'No7' }];
  t('เมนูเดี่ยวชุดใหม่ → วันเริ่ม 21', ohFn([{ kind: 'menu', code: 'S158' }], menus), '2026-09-21');
  t('เมนูที่เลือกในเซ็ตเป็นชุดใหม่ → นับด้วย', ohFn([{ kind: 'pkg', code: 'No7', picked: [{ sku: 'No7' }, { sku: 'S158' }] }], menus), '2026-09-21');
  t('เซ็ตที่ยังไม่ได้เลือกเมนู → ไม่นับรหัสตัวแทนของเซ็ต', ohFn([{ kind: 'pkg', code: 'S158', picked: null }], menus), null);
  t('Meal Plan → ไม่เกี่ยว', ohFn([{ kind: 'mp', setKey: 'weekly' }], menus), null);
  t('ปนชุดเก่า+ใหม่ → วันช้าสุด', ohFn([{ kind: 'menu', code: 'S017' }, { kind: 'menu', code: 'S158' }], menus), '2026-09-21');
  t('เมนูประจำ → null', ohFn([{ kind: 'menu', code: 'No7' }], menus), null);
}
{
  const init = bodyOf(OH, 'async function initOnbehalf(');
  t('โหลดเมนูหน้าสั่งแทน ดึง available_from มาด้วย', /from\('menu_items'\)\.select\('[^']*available_from[^']*'\)\.eq\('is_available',true\)/.test(init), true);
  const sub = bodyOf(OH, 'async function obSubmit(');
  const iDate = sub.indexOf("if(!date)return err('เลือกวันส่ง');");
  const iGuard = sub.indexOf('obCartReadyDate()');
  const iInsert = sub.indexOf("sb_.from('orders').insert(payload)");
  t('obSubmit เรียกด่าน หลังเช็คว่ามีวัน และก่อนสร้างใบ', iDate > 0 && iGuard > iDate && iInsert > iGuard, true);
  t('ตกด่าน = return err (ไม่บันทึก)', /if\(obReadyAt&&date<obReadyAt\)return err\(/.test(sub), true);
  const cart = bodyOf(OH, 'function obRenderCart(');
  t('ตะกร้าเตือนก่อนกดบันทึก', cart.includes('obCartReadyDate()') && cart.includes('บันทึกไม่ได้'), true);
}

console.log(NL + (bad ? '🔴 ตก ' + bad + ' ข้อ จาก ' + (ok + bad) : '✅ ผ่านทั้ง ' + ok + ' ข้อ'));
process.exitCode = bad ? 1 : 0;

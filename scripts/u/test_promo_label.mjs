/* ป้ายบนชิปโค้ด — โค้ดที่ให้ของแถมอย่างเดียวต้องไม่ขึ้นว่า "ลด ฿0"
   (ลูกค้าอ่านแล้วนึกว่าโค้ดเสีย ทั้งที่ของแถมเข้าตะกร้าไปแล้ว) */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');
const grab = (n) => {
  let i = src.indexOf('function ' + n + '(');
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
const body = ['giftSlotKey','giftResolve','giftLineText','orderGiftRules','promoGiftText','promoLabel']
  .map(grab).join(NL);
const mk = (gifts) => new Function('orderGifts','giftPick','localYMD',
  body + '; return { promoLabel, promoGiftText };')(gifts, {}, () => '2026-09-09');

const GIFTS = { jayold: { label:'ซาลาเปา', code:'JAYOLD', min_order:4000,
  items:[{ code:'MC1', name:'ซาลาเปาหมูแดงเจ', qty:2 }] } };

console.log(NL + '① ป้ายเดิมต้องไม่เปลี่ยน');
{
  const e = mk({});
  t('ลดเป็นบาท', e.promoLabel({ code:'A', discount_type:'fixed', discount_value:50 }), 'ลด ฿50');
  t('ลดเป็นเปอร์เซ็นต์', e.promoLabel({ code:'A', discount_type:'percent', discount_value:10 }), 'ลด 10%');
  t('ส่งฟรี', e.promoLabel({ code:'A', discount_type:'free_shipping' }), 'ส่งฟรี');
  t('ค่าส่งเหมา', e.promoLabel({ code:'A', discount_type:'flat_shipping', discount_value:20 }), 'ค่าส่ง ฿20');
}

console.log(NL + '② โค้ดของแถมล้วน (ลด 0)');
{
  const e = mk(GIFTS);
  t('🔴 ต้องไม่ขึ้นว่า "ลด ฿0"',
    e.promoLabel({ code:'JAYOLD', discount_type:'fixed', discount_value:0 }), 'รับฟรี ซาลาเปาหมูแดงเจ ×2');
  t('ตัวเล็กก็ยังเจอ', e.promoLabel({ code:'jayold', discount_type:'fixed', discount_value:0 }), 'รับฟรี ซาลาเปาหมูแดงเจ ×2');
  t('ไม่ระบุชนิดส่วนลดเลย ก็ยังบอกของแถม', e.promoLabel({ code:'JAYOLD' }), 'รับฟรี ซาลาเปาหมูแดงเจ ×2');
}

console.log(NL + '③ ไม่มีของแถมผูกไว้ = เงียบ ไม่แต่งเรื่อง');
{
  const e = mk(GIFTS);
  t('โค้ดอื่นที่ลด 0 → ป้ายว่าง', e.promoLabel({ code:'OTHER', discount_type:'fixed', discount_value:0 }), '');
  t('ไม่มีโค้ดเลย → ป้ายว่าง', e.promoLabel({ discount_type:'fixed', discount_value:0 }), '');
  t('ไม่ได้ตั้งของแถมไว้เลย → ป้ายว่าง', mk({}).promoLabel({ code:'JAYOLD', discount_value:0 }), '');
}

console.log(NL + '④ ส่วนลดจริงต้องชนะของแถมเสมอ (บอกเงินก่อน)');
{
  const e = mk(GIFTS);
  t('มีทั้งลดเงินและของแถม → บอกส่วนลด', e.promoLabel({ code:'JAYOLD', discount_type:'fixed', discount_value:100 }), 'ลด ฿100');
}

console.log(NL + (fail ? '❌' : '✅') + ' ผ่าน ' + ok + ' · ตก ' + fail);
process.exitCode = fail ? 1 : 0;

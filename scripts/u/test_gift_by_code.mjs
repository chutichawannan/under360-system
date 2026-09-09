/* เทส "ของแถมผูกกับโค้ด" — นัทถามเอง 9 ก.ย. (ซาลาเปาสำหรับลูกค้าเก่า)
   ดึงฟังก์ชันจริงจากไฟล์มารัน ไม่เขียนเลียนแบบ
   หัวใจ: กติกาเดิมต้องไม่เปลี่ยนพฤติกรรมแม้แต่นิดเดียว */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');

const grab = (n) => {
  let i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  if (src.slice(i - 6, i) === 'async ') i -= 6;
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

const body = [
  grab('giftSlotKey'), grab('orderGiftRules'), grab('giftResolve'),
  grab('giftCodeOn'), grab('giftRuleMet'), grab('orderGiftsEarned'), grab('orderGiftNext'),
  grab('orderGiftHtml'), grab('giftLineText'),
].join(NL);

/* ประกอบสภาพแวดล้อมให้เหมือนของจริง: ของในตะกร้า · โค้ดที่กรอกอยู่ · กติกาของแถม */
const mk = (gifts, subtotal, codes) => new Function(
  'orderGifts', 'cartTotal', 'appliedPromos', 'giftPick', 'localYMD', 'h',
  body + '; return { orderGiftRules, orderGiftsEarned, orderGiftNext, giftCodeOn, orderGiftHtml };')(
    gifts, () => subtotal,
    (codes || []).map((c) => ({ code: c })), {},
    () => '2026-09-09', (x) => String(x == null ? '' : x));

const SALAPAO = { items: [{ code: 'MC1', name: 'ซาลาเปา', qty: 1 }] };

console.log(NL + '① กติกาแบบเดิม (แถมตามยอด) ต้องไม่เปลี่ยนเลย');
{
  const g = { big: Object.assign({ label: 'ครบ 1500', min_order: 1500 }, SALAPAO) };
  t('ยอดไม่ถึง — ไม่ได้ของ', mk(g, 1200).orderGiftsEarned().length, 0);
  t('ยอดถึง — ได้ของ', mk(g, 1500).orderGiftsEarned().map((x) => x.code), ['MC1']);
  t('ยอดเกิน — ได้ของ', mk(g, 2000).orderGiftsEarned().length, 1);
  t('บอกว่าอีกเท่าไหร่ถึงได้', mk(g, 1200).orderGiftNext().need, 300);
}

console.log(NL + '② แถมเมื่อใช้โค้ด (ของใหม่)');
{
  const g = { jay: Object.assign({ label: 'ซาลาเปาลูกค้าเก่า', code: 'JAYOLD' }, SALAPAO) };
  t('ไม่กรอกโค้ด — ไม่ได้ของ ต่อให้ยอดสูง', mk(g, 9999).orderGiftsEarned().length, 0);
  t('กรอกโค้ดแล้ว — ได้ของ', mk(g, 500, ['JAYOLD']).orderGiftsEarned().map((x) => x.code), ['MC1']);
  t('กรอกโค้ดแล้ว ยอดน้อยก็ได้ (ไม่ตั้งขั้นต่ำ)', mk(g, 1, ['JAYOLD']).orderGiftsEarned().length, 1);
  t('กรอกโค้ดอื่น — ไม่ได้ของ', mk(g, 500, ['FREESHIP']).orderGiftsEarned().length, 0);
  t('พิมพ์ตัวเล็ก ก็ยังได้ของ', mk(g, 500, ['jayold']).orderGiftsEarned().length, 1);
  t('ไม่ไปบอกว่า "อีกเท่าไหร่ได้ของฟรี"', mk(g, 500).orderGiftNext(), null);
}

console.log(NL + '③ โค้ด + ยอดขั้นต่ำ พร้อมกัน');
{
  const g = { mix: Object.assign({ label: 'โค้ด+ยอด', code: 'JAYOLD', min_order: 1000 }, SALAPAO) };
  t('มีโค้ด ยอดไม่ถึง — ยังไม่ได้', mk(g, 800, ['JAYOLD']).orderGiftsEarned().length, 0);
  t('มีโค้ด ยอดถึง — ได้', mk(g, 1000, ['JAYOLD']).orderGiftsEarned().length, 1);
  t('ยอดถึง แต่ไม่มีโค้ด — ไม่ได้', mk(g, 5000).orderGiftsEarned().length, 0);
  t('🔴 ไม่มีโค้ด = ห้ามชวนให้เติมของ (เติมถึงก็ไม่ได้อยู่ดี)', mk(g, 800).orderGiftNext(), null);
  t('มีโค้ดแล้ว ค่อยบอกว่าอีกเท่าไหร่', mk(g, 800, ['JAYOLD']).orderGiftNext().need, 200);
}

console.log(NL + '④ ผูกได้หลายโค้ด');
{
  const g = { multi: Object.assign({ label: 'หลายโค้ด', codes: ['JAYOLD', 'JAYVIP'] }, SALAPAO) };
  t('โค้ดที่ 1 ใช้ได้', mk(g, 500, ['JAYOLD']).orderGiftsEarned().length, 1);
  t('โค้ดที่ 2 ใช้ได้', mk(g, 500, ['JAYVIP']).orderGiftsEarned().length, 1);
  t('โค้ดนอกรายการ ไม่ได้', mk(g, 500, ['SALMON']).orderGiftsEarned().length, 0);
}

console.log(NL + '⑤ กติกาเสียรูป ต้องไม่ทำหน้าจอพัง');
{
  t('ไม่มีทั้งยอดและโค้ด = ทิ้งกติกานั้น', mk({ x: SALAPAO }, 5000).orderGiftRules().length, 0);
  t('codes เป็นค่าว่าง = ทิ้ง', mk({ x: Object.assign({ codes: [] }, SALAPAO) }, 5000).orderGiftRules().length, 0);
  t('code เป็นช่องว่างล้วน = ทิ้ง', mk({ x: Object.assign({ code: '   ' }, SALAPAO) }, 5000).orderGiftRules().length, 0);
  t('ไม่มีของแถม = ทิ้ง', mk({ x: { code: 'A', items: [] } }, 5000).orderGiftRules().length, 0);
  t('ไม่ตั้งอะไรเลย = ไม่มีของแถม ไม่ throw', mk({}, 5000).orderGiftsEarned().length, 0);
  t('หมดอายุแล้ว = ทิ้ง', mk({ x: Object.assign({ code: 'A', expires_at: '2026-09-01' }, SALAPAO) }, 500, ['A']).orderGiftsEarned().length, 0);
  t('ยังไม่หมดอายุ = ได้', mk({ x: Object.assign({ code: 'A', expires_at: '2026-12-31' }, SALAPAO) }, 500, ['A']).orderGiftsEarned().length, 1);
}

console.log(NL + '⑥ ให้ลูกค้าเลือกรสได้ (ของเดิม ต้องยังทำงานคู่กับโค้ด)');
{
  const g = { pick: { label: 'เลือกไส้', code: 'JAYOLD',
    items: [{ name: 'ซาลาเปา', qty: 1, default: 'MC2',
      choices: [{ code: 'MC1', name: 'ไส้หมูแดง' }, { code: 'MC2', name: 'ไส้ครีม' }] }] } };
  const e = mk(g, 500, ['JAYOLD']).orderGiftsEarned();
  t('ไม่เลือก = ได้ตัวตั้งต้น ไม่ตกหล่น', e.map((x) => x.code), ['MC2']);
  t('ชื่อของแถมมาด้วย', e[0].name, 'ไส้ครีม');
}

console.log(NL + '⑦ 🔴 กล่องในตะกร้า ต้องพูดตรงกับของที่ได้จริงตอนกดสั่ง');
{
  /* บั๊กจริงที่เจอหลัง deploy: ตะกร้าดูแค่ยอด ไม่ดูโค้ด
     → ขึ้น 'ได้ฟรีซาลาเปา' ให้ทุกคน ทั้งที่ตอนสั่งจริงไม่ได้ = ระบบโกหก */
  const g = { jay: { label:'ซาลาเปา', code:'JAYOLD',
    items:[{ code:'MC1', name:'ซาลาเปา', qty:2 }] } };
  const noCode = mk(g, 4190);
  const withCode = mk(g, 4190, ['JAYOLD']);
  t('ไม่กรอกโค้ด — ตะกร้าต้องไม่โฆษณาของแถม', /ได้ฟรี/.test(noCode.orderGiftHtml()), false);
  t('ไม่กรอกโค้ด — ไม่ได้ของจริงด้วย', noCode.orderGiftsEarned().length, 0);
  t('กรอกโค้ด — ตะกร้าโชว์ของแถม', /ได้ฟรี/.test(withCode.orderGiftHtml()), true);
  t('กรอกโค้ด — ได้ของจริง', withCode.orderGiftsEarned().length, 1);
  t('โชว์จำนวนถูก (2 ลูก)', /×2/.test(withCode.orderGiftHtml()), true);
  /* กฎที่ห้ามหลุดอีก: 2 ที่นี้ต้องตอบตรงกันเสมอ */
  [[0,[]],[4190,[]],[100,['JAYOLD']],[4190,['JAYOLD']],[4190,['อื่น']]].forEach(function(c){
    const e = mk(g, c[0], c[1]);
    t('ยอด '+c[0]+' โค้ด '+(c[1].join(',')||'-')+' — ตะกร้ากับใบจริงตรงกัน',
      /ได้ฟรี/.test(e.orderGiftHtml()), e.orderGiftsEarned().length > 0);
  });
}

console.log(NL + (fail ? '❌' : '✅') + ' ผ่าน ' + ok + ' · ตก ' + fail);
process.exit(fail ? 1 : 0);

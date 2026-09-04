/* เทสของแถมตามยอดรวม — ดึงฟังก์ชันจริงจากไฟล์มารัน
   โปรจริง: ซื้อครบ ฿1,999 รับฟรี BoneBroth 1 กระปุก (แคมเปญ 9.9) */
import fs from 'node:fs';
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
const body = ['orderGiftRules','orderGiftsEarned','orderGiftNext'].map(grab).join('\n');
let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};
const env = (total, gifts) => new Function('cartTotal','orderGifts','localYMD',
  body + '\n; return {orderGiftRules,orderGiftsEarned,orderGiftNext};')(
  () => total, gifts, () => '2026-09-04');

const BB = { bb99: { label:'ซื้อครบ ฿1,999 รับฟรี BoneBroth', min_order:1999, expires_at:'2026-09-09',
                     items:[{ code:'BB01', name:'โบนบรอธไก่', qty:1 }] } };

console.log('\n① โปร 9.9 — ครบ 1,999 แถม BoneBroth');
t('ยอด 1,500 = ยังไม่ได้', env(1500, BB).orderGiftsEarned().length, 0);
t('ยอด 1,500 บอกว่าขาดอีก 499', env(1500, BB).orderGiftNext().need, 499);
t('ยอด 1,999 พอดี = ได้', env(1999, BB).orderGiftsEarned().map(g => g.code), ['BB01']);
t('ยอด 5,000 = ได้', env(5000, BB).orderGiftsEarned().map(g => g.code), ['BB01']);
t('ได้แล้วไม่ต้องบอกว่าขาดอีก', env(1999, BB).orderGiftNext(), null);
t('ติดรหัสโปรไว้กับของแถม', env(1999, BB).orderGiftsEarned()[0].rule, 'bb99');
t('ตะกร้าว่าง = ไม่ชวนอะไร', env(0, BB).orderGiftNext(), null);

console.log('\n② หมดอายุ');
{
  const old = { x: Object.assign({}, BB.bb99, { expires_at:'2026-09-03' }) };
  t('โปรหมดเมื่อวาน = ไม่แถม', env(5000, old).orderGiftsEarned().length, 0);
  const today = { x: Object.assign({}, BB.bb99, { expires_at:'2026-09-04' }) };
  t('วันสุดท้ายยังได้', env(5000, today).orderGiftsEarned().length, 1);
  const forever = { x: Object.assign({}, BB.bb99, { expires_at:'' }) };
  t('ไม่ใส่วันหมดอายุ = ใช้ตลอด', env(5000, forever).orderGiftsEarned().length, 1);
}

console.log('\n③ หลายโปรพร้อมกัน');
{
  const two = {
    a: { label:'ครบ 1,000', min_order:1000, items:[{ code:'X1', name:'ของ A', qty:1 }] },
    b: { label:'ครบ 3,000', min_order:3000, items:[{ code:'X2', name:'ของ B', qty:2 }] },
  };
  t('ยอด 1,500 ได้เฉพาะ A', env(1500, two).orderGiftsEarned().map(g => g.code), ['X1']);
  t('ยอด 1,500 ชวนต่อไป B', env(1500, two).orderGiftNext().need, 1500);
  t('ยอด 3,000 ได้ทั้ง 2', env(3000, two).orderGiftsEarned().map(g => g.code), ['X1','X2']);
  t('จำนวนตามที่ตั้ง', env(3000, two).orderGiftsEarned()[1].qty, 2);
}

console.log('\n④ ตั้งค่าพัง — ต้องไม่ล้มหน้าร้าน');
t('ไม่ได้ตั้งเลย', env(5000, {}).orderGiftsEarned(), []);
t('ไม่มีรายการของแถม', env(5000, { x:{ min_order:100, items:[] } }).orderGiftsEarned(), []);
t('ไม่มี min_order', env(5000, { x:{ items:[{code:'X',name:'X',qty:1}] } }).orderGiftsEarned(), []);
t('code ว่าง = ตัดทิ้ง', env(5000, { x:{ min_order:100, items:[{code:'',name:'ไม่มีรหัส',qty:1}] } }).orderGiftsEarned(), []);
t('qty เพี้ยน = อย่างน้อย 1', env(5000, { x:{ min_order:100, items:[{code:'X',name:'X',qty:0}] } }).orderGiftsEarned()[0].qty, 1);

console.log('\n⑤ ต้องวิ่งเข้า order_items จริง (ไม่ใช่แค่โชว์)');
t('มีโค้ดเขียนของแถมลงใบ', src.includes("notes: 'gift:order:' + g.rule"), true);
t('ราคา 0', /orderGiftsEarned\(\)\.forEach[\s\S]{0,400}unit_price: 0, subtotal: 0/.test(src), true);
t('คิดตอนกดสั่ง ไม่ใช่ตอนเปิดหน้า', src.indexOf("orderGiftsEarned().forEach") < src.indexOf("from('order_items').insert(items)"), true);
t('ตะกร้าโชว์กล่องของแถม', src.includes('rows + orderGiftHtml()'), true);

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

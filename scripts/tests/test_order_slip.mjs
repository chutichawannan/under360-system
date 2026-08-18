/* เทสป้ายสถานะจ่ายเงิน + ปุ่มแนบสลิป ในหน้า "ประวัติออเดอร์" (liff_customer.html)
   ดึงเฉพาะฟังก์ชัน orderPayHtml มารัน ไม่ต้องเปิดเบราว์เซอร์/ไม่ต้องมี LINE
   รันซ้ำได้: node scripts/tests/test_order_slip.mjs                                   */
import fs from 'fs';
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8');

function grab(name){
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('หาไม่เจอ: ' + name);
  let d = 0, started = false;
  for (let j = i; j < src.length; j++){
    if (src[j] === '{'){ d++; started = true; }
    else if (src[j] === '}'){ d--; if (started && d === 0) return src.slice(i, j+1); }
  }
  throw new Error('อ่านฟังก์ชันไม่จบ: ' + name);
}

const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let hasPaymentStatusColumn = true;
const orderPayHtml = eval('(' + grab('orderPayHtml') + ')');

let pass = 0, fail = 0;
const t = (name, cond) => { if (cond){ pass++; console.log('  ✅', name); }
                            else { fail++; console.log('  ❌', name); } };

const O = (x) => Object.assign({ id:'id1', order_number:'U-0818-001', total:500, status:'pending', payment_status:'unpaid' }, x);

console.log('\n🧾 ป้ายจ่ายเงิน + ปุ่มแนบสลิป');
let html = orderPayHtml(O({}));
t('unpaid → มีปุ่มแนบสลิป',            /แนบสลิปโอนเงิน/.test(html));
t('unpaid → บอกเลขบัญชีให้โอน',        /0846556601/.test(html) && /020272500180/.test(html));
t('unpaid → ผูกกับ id ออเดอร์ถูกใบ',   /pickOrderSlip\('id1'/.test(html));

html = orderPayHtml(O({ payment_status:'pending_review' }));
t('ส่งสลิปแล้ว → ขึ้นรอตรวจ',          /รอแอดมินตรวจ/.test(html));
t('ส่งสลิปแล้ว → ยังแนบใหม่ได้',       /แนบสลิปใหม่/.test(html));
t('ส่งสลิปแล้ว → ไม่ชวนโอนซ้ำ',        !/แนบสลิปโอนเงิน/.test(html));

html = orderPayHtml(O({ payment_status:'paid' }));
t('จ่ายแล้ว → ไม่มีปุ่มให้กดอีก',       !/pickOrderSlip/.test(html) && /ได้รับเงินแล้ว/.test(html));

console.log('\n🪣 ใบที่ต้องไม่โชว์อะไรเลย (กันป้ายโกหก)');
t('ใบแบ่งรอบยอด ฿0 → ว่าง',            orderPayHtml(O({ total:0 })) === '');
t('ใบ ฿0 ที่สถานะค้าง pending_review → ยังว่าง',
                                        orderPayHtml(O({ total:0, payment_status:'pending_review' })) === '');
t('ใบยกเลิก → ว่าง',                    orderPayHtml(O({ status:'cancelled' })) === '');

hasPaymentStatusColumn = false;
t('ยังไม่รัน SQL payment_status → ซ่อนทั้งบล็อก', orderPayHtml(O({})) === '');
hasPaymentStatusColumn = true;

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${pass} · ไม่ผ่าน ${fail}\n`);
process.exit(fail ? 1 : 0);

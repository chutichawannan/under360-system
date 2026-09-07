/* เทส Meta Pixel ในหน้า LIFF — ห้อง 06 ขอ · นัทสั่ง 7 ก.ย. 2569
   หัวใจ 3 ข้อ: ยิงครั้งเดียวต่อออเดอร์ · ไม่ส่งข้อมูลลูกค้าออกไป · ล้มแล้วออเดอร์ต้องไม่กระทบ */
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
/* FBQ_KEY อยู่ระดับไฟล์ ไม่ได้อยู่ในฟังก์ชัน — ต้องดึงมาด้วย ไม่งั้นฟังก์ชันที่ยกมารันแล้วพังเงียบ */
const KEYLINE = (src.match(/const FBQ_KEY = .*/) || [''])[0];
const memBody = [KEYLINE].concat(['fbqSeen', 'fbqSent', 'fbqMark'].map(grab)).join(NL);
const mkMem = (ls) => new Function('localStorage', memBody + NL + '; return {fbqSent,fbqMark,fbqSeen};')(ls);

let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL + '     ได้  ' + g + NL + '     ควร  ' + w); }
};

console.log(NL + '① ตัวกันยิงซ้ำ (รันโค้ดจริง)');
{
  const store = {};
  const e = mkMem({ getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } });
  t('ใบใหม่ = ยังไม่เคยยิง', e.fbqSent('U-0907-001'), false);
  e.fbqMark('U-0907-001');
  t('ยิงแล้ว จำได้', e.fbqSent('U-0907-001'), true);
  t('ใบอื่นยังยิงได้', e.fbqSent('U-0907-002'), false);
  e.fbqMark('U-0907-002');
  t('เก็บครบ 2 ใบ', e.fbqSeen().length, 2);
  for (let i = 0; i < 60; i++) e.fbqMark('U-0907-x' + i);
  t('ไม่บวมเกิน 50 ใบ', e.fbqSeen().length, 50);
  t('ใบเก่าสุดถูกทิ้ง', e.fbqSent('U-0907-001'), false);
  t('ใบล่าสุดยังอยู่', e.fbqSent('U-0907-x59'), true);
}
{
  /* เครื่องลูกค้าที่ปิด localStorage (เปิดโหมดส่วนตัว/ตั้งค่าบล็อก) ต้องไม่ทำให้อะไรล้ม */
  const e = mkMem({ getItem: () => { throw new Error('ปิดอยู่'); }, setItem: () => { throw new Error('ปิดอยู่'); } });
  t('อ่านไม่ได้ = ถือว่ายังไม่เคยยิง', e.fbqSent('U-1'), false);
  let threw = false;
  try { e.fbqMark('U-1'); } catch (x) { threw = true; }
  t('เขียนไม่ได้ก็ไม่ throw', threw, false);
}

console.log(NL + '② พิกเซลในหน้า');
t('ใช้พิกเซลตัวเดียวกับเว็บ', src.includes("fbq('init','949287485825587')"), true);
t('ยิง PageView', src.includes("fbq('track','PageView')"), true);
t('ยิง Purchase', src.includes("fbq('track','Purchase'"), true);
t('ส่งยอดเงินจริงของออเดอร์', src.includes("{ value: grandTotal, currency: 'THB' }"), true);
t('ส่ง eventID ให้ Meta ตัดซ้ำอีกชั้น', src.includes('{ eventID: orderNum }'), true);
t('เช็คก่อนยิงว่าเคยยิงใบนี้ยัง', src.includes('!fbqSent(orderNum)'), true);

console.log(NL + '③ 🔒 ต้องไม่มีข้อมูลลูกค้าหลุดไป Meta');
{
  const i = src.indexOf("fbq('track','Purchase'");
  const block = src.slice(i - 300, i + 300);
  ['customer_name', 'customer_phone', 'line_uid', 'delivery_address', 'lineProfile',
   'recipientName', 'recipientPhone', 'email', 'content_ids'].forEach(k => t('ไม่ส่ง ' + k, block.includes(k), false));
}

console.log(NL + '④ ล้มแล้วต้องไม่กระทบออเดอร์');
{
  const i = src.indexOf("fbq('track','Purchase'");
  const before = src.slice(0, i);
  t('อยู่ในบล็อก try', before.lastIndexOf('try{') > before.lastIndexOf('}catch'), true);
  t('ยิงหลังบันทึกออเดอร์ลง DB แล้ว', src.indexOf("from('orders').insert") < i, true);
  t('ยิงก่อนโชว์หน้าสำเร็จ', i < src.indexOf("showScr('s-ok')"), true);
}

console.log(NL + (fail ? '❌' : '✅') + ' ผ่าน ' + ok + ' · ตก ' + fail);
process.exit(fail ? 1 : 0);

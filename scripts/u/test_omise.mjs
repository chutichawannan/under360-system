/* เทสจ่ายบัตร — ดึงฟังก์ชันจริงจากไฟล์ที่จะ deploy มารัน ไม่เขียนเลียนแบบ
   หัวใจ 3 ข้อ: ใบไหนรูดได้ · ตัดไม่ผ่านต้องไม่ทำออเดอร์หาย · ยอดเงินห้ามเชื่อฝั่งหน้าเว็บ */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const read = p => fs.readFileSync(new URL('../../' + p, import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
const src = read('liff_customer.html');
const api = read('api/omise-charge.js');

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
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL + '     ได้  ' + g + NL + '     ควร  ' + w); }
};

console.log(NL + '① ใบไหนรูดบัตรได้ (รันฟังก์ชันจริง)');
const mkElig = (cart) => new Function('cart', grab('cardEligible') + '; return cardEligible();')(cart);
const box   = { type:'individual', name:'ข้าวกล่อง', price:165 };
const trial = (k) => ({ type:'meal_plan', mp_set:'trial',   mp_type:k });
const week  = (k) => ({ type:'meal_plan', mp_set:'weekly',  mp_type:k });
const month = (k) => ({ type:'meal_plan', mp_set:'monthly', mp_type:k });
const pkg   = (n) => ({ type:'package', name:n });

t('ตะกร้าว่าง — ไม่โชว์บัตร', mkElig([]), false);
t('กล่องเดี่ยว ฿165 — ไม่โชว์', mkElig([box]), false);
t('กล่องเดี่ยว 20 กล่อง — ยังไม่โชว์ (ตัดที่ชนิดของ ไม่ใช่ยอดเงิน)', mkElig(Array(20).fill(box)), false);
t('🔴 ชุดทดลอง HP ฿1,699 — ไม่โชว์ (นัทสั่งไม่รวมชุดทดลอง)', mkElig([trial('hp')]), false);
t('🔴 ชุดทดลอง LC ฿1,399 — ไม่โชว์', mkElig([trial('lc')]), false);
t('มีลแพลนรายสัปดาห์ — โชว์', mkElig([week('hp')]), true);
t('มีลแพลนรายเดือน — โชว์', mkElig([month('lc')]), true);
t('คอร์สเจ (เป็น package) — โชว์', mkElig([pkg('คอร์สเจ 2569')]), true);
t('Diet Set A ฿1,350 — โชว์ (เซ็ตจริง นัทอยากให้รูดได้)', mkElig([pkg('Diet Set A')]), true);
t('ชุดทดลอง + กล่องเดี่ยว — ยังไม่โชว์', mkElig([trial('hp'), box]), false);
t('ชุดทดลอง + เซ็ต — โชว์ (มีของที่เข้าเกณฑ์อยู่)', mkElig([trial('hp'), pkg('Pack M')]), true);
t('ของแปลกที่ไม่มี type — ไม่พัง', mkElig([{ name:'?' }]), false);
t('ตะกร้าเป็น null — ไม่พัง', mkElig(null), false);

console.log(NL + '② ตะกร้าเปลี่ยนแล้วต้องไม่ค้างโหมดบัตร');
{
  const body = grab('refreshPayMethods');
  t('รูดไม่ได้แล้ว ดีดกลับทางโอน', body.includes("payMethod === 'card') setPayMethod('transfer')"), true);
  t('ยังไม่มีกุญแจ = ไม่โชว์ปุ่มบัตร', body.includes('okCart && okKey'), true);
}

console.log(NL + '③ 🔴 ตัดบัตรไม่ผ่าน ต้องไม่ทำออเดอร์หาย');
{
  const iIns = src.indexOf("from('orders').insert");
  const iChg = src.indexOf("payMethod === 'card'", src.indexOf('async function submitOrder'));
  t('บันทึกออเดอร์ลง DB ก่อน แล้วค่อยตัดบัตร', iIns > 0 && iIns < iChg, true);
  const blk = src.slice(iChg, iChg + 1800);
  t('ตัดบัตรห่อ try ไว้', blk.includes('try { pay = await chargeCard'), true);
  t('ล้มแล้วบอกชัดว่ายังไม่ตัดเงิน', blk.includes('ยังไม่มีการตัดเงิน'), true);
  t('ล้มแล้วบอกว่าโอนแทนได้', blk.includes('โอนผ่านพร้อมเพย์แทนได้'), true);
  t('ตัดบัตรอยู่ก่อนล้างตะกร้า', iChg < src.indexOf('cart = []; saveCart(); updateCartUI();', iChg), true);
}

console.log(NL + '④ 🔒 ความปลอดภัยฝั่งเซิร์ฟเวอร์');
t('ยอดเงินอ่านจากฐานข้อมูล ไม่เชื่อหน้าเว็บ', api.includes('Number(order.total || 0)'), true);
t('ไม่รับยอดเงินจาก body เลย', /body\.(amount|total|price)/.test(api), false);
t('กุญแจลับอ่านจาก env ไม่ฝังในไฟล์', api.includes('process.env.OMISE_SECRET_KEY'), true);
t('ไม่มีกุญแจจริงหลุดอยู่ในโค้ด', /(skey|pkey)_(test|live)_[A-Za-z0-9]/.test(api + src), false);
t('กุญแจลับไม่เคยถูกส่งกลับหน้าเว็บ', /public_key: *sec|secret/.test(api.slice(api.indexOf("req.method === 'GET'"), api.indexOf("req.method !== 'POST'"))), false);
t('จ่ายแล้วไม่ตัดซ้ำ', api.includes("order.payment_status === 'paid'") && api.includes('already: true'), true);
t('กันตัดซ้ำที่ฝั่ง Omise ด้วย', api.includes("'Idempotency-Key'"), true);
t('ตรวจรูปแบบเลขออเดอร์ก่อนใช้', api.includes('U-[0-9]{4}-[0-9]{3}'), true);
t('ตรวจว่าเป็นโทเคนบัตรจริง', api.includes('/^tokn_/'), true);
t('🔴 ตัดเงินแล้วแต่จดไม่ลง = ยังบอกว่าสำเร็จ (ห้ามให้ลูกค้าจ่ายซ้ำ)', api.includes("warn: 'ตัดเงินแล้วแต่บันทึกสถานะไม่สำเร็จ'"), true);
t('เก็บเลข charge ไว้ตามหาตอนคืนเงิน', api.includes("'บัตร ' + charge.id"), true);

console.log(NL + '⑤ ทางโอนเดิมต้องไม่ถูกแตะ');
t('QR พร้อมเพย์ยังอยู่', src.includes('id="pp-qr"'), true);
t('ช่องแนบสลิปยังอยู่', src.includes('id="slip-file-input"'), true);
t('ค่าตั้งต้นยังเป็นทางโอน', src.includes("if (!payMethod) payMethod = 'transfer';"), true);
t('ปุ่มเลือกวิธีจ่ายซ่อนไว้ก่อน (ออเดอร์เล็กไม่เห็นอะไรเปลี่ยน)', src.includes('id="paymethod-wrap" style="display:none'), true);

console.log(NL + '⑥ กดปุ่มเลือกวิธีจ่ายจริง (DOM ปลอม) — จับบั๊กแบบ el() ที่ไม่มีอยู่จริง');
{
  const mkEl = () => ({ style:{}, _c:new Set(),
    classList:{ toggle(n,v){ v ? this._o._c.add(n) : this._o._c.delete(n); }, contains(n){ return this._o._c.has(n); } } });
  const nodes = {};
  for (const id of ['pm-transfer','pm-card','pp-qr','pp-transfer','pp-card','paymethod-wrap']) {
    const e = mkEl(); e.classList._o = e; nodes[id] = e;
  }
  const document = { getElementById: id => nodes[id] || null };
  let payMethod = null;
  const run = new Function('document','getPay','setPay',
    grab('setPayMethod').replace(/payMethod = m;/, 'setPay(m);') + '; return setPayMethod;');
  const setPayMethod = run(document, () => payMethod, v => { payMethod = v; });

  setPayMethod('card');
  t('เลือกบัตร — ปุ่มบัตรติดไฟ', nodes['pm-card'].classList.contains('on'), true);
  t('เลือกบัตร — ซ่อน QR', nodes['pp-qr'].style.display, 'none');
  t('เลือกบัตร — ซ่อนช่องแนบสลิป', nodes['pp-transfer'].style.display, 'none');
  t('เลือกบัตร — โชว์กล่องบัตร', nodes['pp-card'].style.display, '');
  t('เลือกบัตร — payMethod เป็น card', payMethod, 'card');

  setPayMethod('transfer');
  t('กลับมาโอน — QR โผล่คืน', nodes['pp-qr'].style.display, '');
  t('กลับมาโอน — ช่องแนบสลิปโผล่คืน', nodes['pp-transfer'].style.display, '');
  t('กลับมาโอน — ซ่อนกล่องบัตร', nodes['pp-card'].style.display, 'none');
  t('กลับมาโอน — ปุ่มบัตรดับ', nodes['pm-card'].classList.contains('on'), false);
  t('กลับมาโอน — payMethod เป็น transfer', payMethod, 'transfer');
}

console.log(NL + (fail ? '❌' : '✅') + ' ผ่าน ' + ok + ' · ตก ' + fail);
process.exit(fail ? 1 : 0);

/* เปิด branch นี้เพื่อสร้าง Preview deployment ที่มี test key ของ Omise ติดมาด้วย
   (test key อยู่ scope=Preview เท่านั้น ตั้งใจ — ไม่ให้โผล่ production) */

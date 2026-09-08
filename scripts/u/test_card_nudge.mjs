/* เทส "เขย่งยอด" — เกณฑ์ยอดที่รูดบัตรได้ + แถบชวนเติมของ (พี่ปืนส่งมา 8 ก.ย. 2569)
   ดึงฟังก์ชันจริงจากไฟล์ที่จะ deploy มารัน ไม่เขียนเลียนแบบ */
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
/* ตัวช่วยระดับไฟล์ที่ฟังก์ชันพวกนี้พึ่งอยู่ — ต้องยกมาด้วย ไม่งั้นรันแล้วพังเงียบ */
/* ตัดเอาตั้งแต่ "const ชื่อ" ไปจนปิดปีกกา — ไม่ใช้ regex เพราะ backslash
   หายไป 1 ชั้นทุกครั้งที่ส่งผ่าน shell แล้ว pattern เพี้ยนแบบเงียบ ๆ (โดนมา 3 รอบแล้ว) */
const helpers = ['cardMinTotal', 'cardHintWithin'].map((n) => {
  const i = src.indexOf('const ' + n);
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; st = true; }
    else if (src[j] === '}') { d--; if (st && d === 0) return src.slice(i, j + 2); }
  }
  throw new Error('ตัด ' + n + ' ไม่จบ');
}).join(NL);

let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); }
  else { fail++; console.log('  ❌', n, NL + '     ได้  ' + g + NL + '     ควร  ' + w); }
};

const body = helpers + NL + grab('cardEligible') + NL + grab('cardGap') + NL + grab('cardNudgePicks');
const mkFull = (cfg, cart, menu, stock) => new Function(
  'cardMinCfg', 'cart', 'menuItems', 'cartTotal', 'isMealPlanMenu', 'stockInfo',
  body + '; return { cardEligible, cardGap, cardNudgePicks };')(
    cfg, cart, menu || [],
    () => (cart || []).reduce((s, c) => s + Number(c.price || 0) * Number(c.qty || 1), 0),
    (m) => /^(HP|LC)/i.test(m.code || '') || m.category === 'meal_hp' || m.category === 'meal_lc',
    stock || (() => ({ unlimited: true, remaining: 999 })));
const mk = (cfg, cart, menu) => mkFull(cfg, cart, menu);

const box = (p, q) => ({ id: 'b' + p, type: 'individual', price: p, qty: q || 1, category: 'rice' });
const pkgSet = { type: 'package', price: 1350, qty: 1 };

console.log(NL + '① ไม่ได้ตั้งเกณฑ์ยอด = ต้องเหมือนเดิมทุกบรรทัด');
t('กล่องเดี่ยว ฿825 — ยังรูดไม่ได้', mk(null, [box(165, 5)]).cardEligible(), false);
t('ไม่มีแถบชวนเติม', mk(null, [box(165, 5)]).cardGap(), 0);
t('เซ็ตยังรูดได้เหมือนเดิม', mk(null, [pkgSet]).cardEligible(), true);

console.log(NL + '② ตั้งเกณฑ์ ฿1,500 (ตัวเลขตัวอย่าง — นัทยังไม่เคาะ)');
t('฿825 — ยังไม่ถึง', mk(1500, [box(165, 5)]).cardEligible(), false);
t('฿1,485 — ขาดอีก ฿15', mk(1500, [box(165, 9)]).cardGap(), 15);
t('฿1,650 — ถึงแล้ว รูดได้', mk(1500, [box(165, 10)]).cardEligible(), true);
t('฿1,500 พอดี — ถึงแล้ว', mk(1500, [box(750, 2)]).cardEligible(), true);
t('ถึงแล้ว = ไม่มีแถบชวนเติม', mk(1500, [box(750, 2)]).cardGap(), 0);

console.log(NL + '③ ตั้งแบบละเอียด { min, hint_within }');
t('฿1,300 ขาด ฿200', mk({ min: 1500, hint_within: 300 }, [box(650, 2)]).cardGap(), 200);
t('เกณฑ์ยังคำนวณถูก', mk({ min: 1500, hint_within: 300 }, [box(1500, 1)]).cardEligible(), true);

console.log(NL + '④ 🔴 ห้ามแนะของผิดกลุ่ม (เมนูถูกสุดในร้าน ฿65 คือ "อาหารเด็ก")');
{
  const menu = [
    { id: 'kid1', code: '1A', name: 'ข้าวตุ๋นผักโขมเด็ก', price: 65, category: 'cat_baby', is_available: true },
    { id: 'kid2', code: '1B', name: 'ซุปแครอทเบบี๋', price: 65, category: 'cat_baby', is_available: true },
    { id: 'bb', code: 'BB1', name: 'โบนบรอธ', price: 139, category: 'snack', is_available: true },
    { id: 'rice', code: 'S1', name: 'ข้าวกล่องผัดกะเพรา', price: 165, category: 'rice', is_available: true },
  ];
  const picks = mk({ min: 1500 }, [box(165, 8)], menu).cardNudgePicks(180);
  t('ไม่แนะอาหารเด็กให้คนซื้อข้าวกล่อง', picks.some((p) => p.category === 'cat_baby'), false);
  t('แนะของในหมวดเดียวกับที่ซื้ออยู่', picks.map((p) => p.code), ['S1']);
}

console.log(NL + '⑤ แอดมินเลือกของแนะเองได้ (suggest)');
{
  const menu = [
    { id: 'bb', code: 'BB1', name: 'โบนบรอธ', price: 139, category: 'snack', is_available: true },
    { id: 'bj', code: 'BJ1', name: 'บ๊ะจ่าง', price: 125, category: 'snack', is_available: true },
    { id: 'sal', code: 'MC1', name: 'ซาลาเปา', price: 38, category: 'snack', is_available: true },
    { id: 'kid', code: '1A', name: 'อาหารเด็ก', price: 65, category: 'cat_baby', is_available: true },
  ];
  const picks = mk({ min: 1500, suggest: ['BB1', 'BJ1', 'MC1'] }, [box(165, 8)], menu).cardNudgePicks(180);
  t('แนะเฉพาะที่แอดมินระบุ', picks.map((p) => p.code).sort(), ['BB1', 'BJ1', 'MC1']);
  t('ของที่ไม่ได้ระบุไม่โผล่', picks.some((p) => p.code === '1A'), false);
  t('เรียงของที่พาข้ามเส้นก่อน (ขาด ฿180)', picks[0].code, 'BB1');
}

console.log(NL + '⑥ ของหมด / ของที่กดเติมไม่ได้ ต้องไม่ถูกแนะ');
{
  const menu = [
    { id: 'out', code: 'X1', name: 'ของหมด', price: 150, category: 'rice', is_available: true },
    { id: 'ok', code: 'X2', name: 'ยังมีของ', price: 150, category: 'rice', is_available: true },
    { id: 'mp', code: 'HP01', name: 'มีลแพลน', price: 150, category: 'meal_hp', is_available: true },
    { id: 'off', code: 'X3', name: 'ปิดขาย', price: 150, category: 'rice', is_available: false },
  ];
  const codes = mkFull({ min: 1500 }, [box(165, 8)], menu,
    (id) => (id === 'out' ? { unlimited: false, remaining: 0 } : { unlimited: true, remaining: 999 })
  ).cardNudgePicks(180).map((p) => p.code);
  t('ของหมดไม่ถูกแนะ', codes.includes('X1'), false);
  t('มีลแพลนไม่ถูกแนะ', codes.includes('HP01'), false);
  t('ของปิดขายไม่ถูกแนะ', codes.includes('X3'), false);
  t('เหลือแต่ของที่กดเติมได้จริง', codes, ['X2']);
}

console.log(NL + '⑦ แถบชวนเติมโผล่ตอนไหน');
{
  const r = grab('renderCardNudge');
  t('ยังไม่มีกุญแจ Omise = ไม่โผล่ (ไม่โฆษณาของที่ยังใช้ไม่ได้)', r.includes('!omisePublicKey'), true);
  t('ห่างเกินระยะเตือน = ไม่โผล่', r.includes('gap > cardHintWithin()'), true);
  t('บอกจำนวนเงินที่ขาดชัด ๆ', r.includes('อีก ฿'), true);
  t('กดชิปแล้ววาดแถบใหม่ทันที', r.includes('renderCardNudge();'), true);
}

console.log(NL + '⑧ ตั้งค่าได้โดยไม่ต้องแก้โค้ด (พี่ปืนขอ)');
t('อ่านจาก kitchen_data', src.includes("const CARDMIN_KEY = 'card_min_total';"), true);
t('อยู่ใน batch โหลด config เดิม', src.includes('ORDERGIFT_KEY, CARDMIN_KEY]'), true);
t('ไม่มีตัวเลขเพดานฝังตายในโค้ด', /cardMinTotal\(\) *[><=]+ *[0-9]{3,}/.test(src), false);
t('ยอดเปลี่ยน = คิดใหม่ทุกครั้ง', src.includes('renderCardNudge(); refreshPayMethods();'), true);

console.log(NL + (fail ? '❌' : '✅') + ' ผ่าน ' + ok + ' · ตก ' + fail);
process.exit(fail ? 1 : 0);

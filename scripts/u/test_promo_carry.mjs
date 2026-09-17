/* เทสคูปองจากหน้าแอดติดตัวไปถึงหน้าสั่ง — นัทสั่งผ่าน 06 (17 ก.ย. 2569) "ทำเลย ขอให้มันใช้งานได้ก็พอ"
   เคสจริง: เก็บคูปอง FBPACK บน /pack 7 คน ใช้จริง 0 · ใบ U-0918-008 ได้ WELCOME50 (-50) แทน FBPACK (-120)

   ที่พลาดไม่ได้:
     ① ทุกปุ่มสั่งบน /pack พกโค้ดไปด้วย และ utm เดิมยังอยู่ครบ
     ② LIFF ใส่ให้เองเฉพาะตอนเข้าเงื่อนไข — ไม่เข้า = เงียบ ไม่ใส่
     ③ ใส่แล้วแทนโค้ดอื่นตามกติกาเดิม (FBPACK ไม่ซ้อน)
     ④ ลูกค้ากดลบเอง = ไม่ใส่คืน */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const rd = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
const L = rd('../../liff_customer.html'), P = rd('../../web/pack.html');
let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL + '     ได้  ' + g + NL + '     ควร  ' + w); } };
const grab = (src, start, end) => { const a = src.indexOf(start), b = src.indexOf(end, a + start.length);
  if (a < 0 || b < 0) throw new Error('หาโค้ดไม่เจอ: ' + start); return src.slice(a, b); };

console.log(NL + '① /pack พกโค้ดไปกับลิงก์สั่ง (ฝั่ง m ทำ 2afc0dd)');
{
  const tr = grab(P, 'function u360Tracked(base){', NL + 'function track(');
  const wp = grab(P, 'function withPromo(url){', NL + '}') + NL + '}';
  const run = (search) => new Function('location', 'localStorage', 'LINE_PROMO_CODE',
    tr + NL + wp + '; return withPromo(u360Tracked("https://liff.line.me/X?lid=X"));')(
    { search }, { getItem: () => '{}' }, 'FBPACK');
  const u = new URL(run('?utm_source=fb&utm_campaign=pack2026&utm_content=test'));
  t('มี promo=FBPACK', u.searchParams.get('promo'), 'FBPACK');
  t('utm_content ยังอยู่', u.searchParams.get('utm_content'), 'test');
  t('lid เดิมยังอยู่', u.searchParams.get('lid'), 'X');
  t('ทั้ง 3 ทางสั่งผ่าน withPromo', P.split('withPromo(').length - 1 >= 4, true);
}

console.log(NL + '② LIFF ใส่ให้เองเฉพาะตอนเข้าเงื่อนไข');
const FB = { id: 'fb', code: 'FBPACK', discount_type: 'fixed', discount_value: 120, min_order: 1000, usage_limit: 0,
  used_count: 0, is_active: true, expires_at: null, stackable: false, scope_type: 'package', scope_mode: 'include',
  scope_value: ['S', 'M', 'L'] };
const body = grab(L, "const PENDING_PROMO_KEY = 'u360_pending_promo';", NL + 'async function applyPromo(') +
  grab(L, 'function cartMatchesPromoScope(p){', NL + '// โค้ดที่ตั้ง show_suggested');
async function sim({ pending = 'FBPACK', cart, applied = [], row = FB, limit = '' }) {
  const store = { u360_pending_promo: pending };
  const ctx = { cart, appliedPromos: applied, refreshed: 0, totals: 0 };
  const f = new Function('ctx', 'sessionStorage', 'sb', 'cwLimitMsg', `
    let cart = ctx.cart, appliedPromos = ctx.appliedPromos;
    const localYMD = () => '2026-09-17';
    const cartTotal = () => cart.reduce((s, c) => s + c.price * (c.qty || 1), 0);
    const refreshCouponUI = () => { ctx.refreshed++; };
    const updateCartTotals = () => { ctx.totals++; };
    const mpScopeHit = () => false;
    ${body}
    return tryPendingPromo().then(() => { ctx.appliedPromos = appliedPromos; ctx.removePromo = removePromoStub; });
    function removePromoStub(){}`);
  const sb = { from: () => ({ select: () => ({ eq: () => ({ limit: async () => ({ data: row ? [row] : [] }) }) }) }) };
  await f(ctx, { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
    sb, () => limit);
  return { codes: ctx.appliedPromos.map(p => p.code), store, ctx };
}
const packM = [{ type: 'package', package_id: 'M', price: 2650, qty: 1 }];
{
  t('ตะกร้ามี Pack M = ใส่ FBPACK ให้เอง', (await sim({ cart: packM })).codes, ['FBPACK']);
  t('ใส่แล้ววาดยอดใหม่', (await sim({ cart: packM })).ctx.totals, 1);
  t('ตะกร้าว่าง = ไม่ใส่', (await sim({ cart: [] })).codes, []);
  t('ไม่มีแพค (ข้าวกล่องเดี่ยว) = ไม่ใส่', (await sim({ cart: [{ code: 'S1', price: 1500, qty: 1 }] })).codes, []);
  t('ยังไม่ถึง ฿1,000 = ไม่ใส่', (await sim({ cart: [{ type: 'package', package_id: 'S', price: 900, qty: 1 }] })).codes, []);
  t('ไม่ได้มาจากลิงก์แอด = ไม่ใส่', (await sim({ pending: '', cart: packM })).codes, []);
  t('โค้ดถูกปิด = ไม่ใส่', (await sim({ cart: packM, row: { ...FB, is_active: false } })).codes, []);
  t('หมดอายุ = ไม่ใส่', (await sim({ cart: packM, row: { ...FB, expires_at: '2026-09-01' } })).codes, []);
  t('ครบจำนวนครั้ง = ไม่ใส่', (await sim({ cart: packM, row: { ...FB, usage_limit: 5, used_count: 5 } })).codes, []);
  t('เกินสิทธิ์ต่อคน = ไม่ใส่', (await sim({ cart: packM, limit: 'ใช้ครบแล้ว' })).codes, []);
  const gone = await sim({ pending: 'NOPE', cart: packM, row: null });
  t('โค้ดไม่มีในระบบ = ทิ้งไปเลย ไม่ลองซ้ำ', [gone.codes, gone.store.u360_pending_promo || null], [[], null]);
}

console.log(NL + '③ แทนโค้ดอื่นตามกติกาเดิม');
{
  t('แทนโค้ดที่ซ้อนได้ (FBPACK ไม่ซ้อน)', (await sim({ cart: packM, applied: [{ id: 'x', code: 'X', stackable: true }] })).codes, ['FBPACK']);
  t('ใส่อยู่แล้ว = ไม่ใส่ซ้ำ', (await sim({ cart: packM, applied: [FB] })).codes, ['FBPACK']);
  t('WELCOME50 พักอัตโนมัติเมื่อมีโค้ดไม่ซ้อน (ด่าน 05 ยังอยู่)', L.indexOf('const autoList = exclusive ? [] : autoPromos(sub);') >= 0, true);
  t('เรียกทุกครั้งที่ยอดเปลี่ยน', /function updateCartTotals\(\)\{\n\s*tryPendingPromo\(\);/.test(L), true);
  t('อ่าน ?promo= ผ่าน u360qs (รอดตอนเด้งล็อกอิน)', L.indexOf("u360qs().get('promo')") >= 0, true);
}

console.log(NL + '④ ลูกค้าลบเอง = ไม่ใส่คืน');
{
  const fn = grab(L, 'function removePromo(id){', NL + '// โชว์รายการโค้ด');
  const store = { u360_pending_promo: 'FBPACK' };
  new Function('sessionStorage', 'PENDING_PROMO_KEY', 'document', `
    let appliedPromos = [{ id: 'fb', code: 'FBPACK' }];
    const refreshCouponUI = () => {}, updateCartTotals = () => {};
    ${fn}; removePromo('fb');`)(
    { getItem: k => store[k] || null, removeItem: k => { delete store[k]; } }, 'u360_pending_promo',
    { getElementById: () => null });
  t('ลบ FBPACK แล้วล้างโค้ดที่รอใส่', store.u360_pending_promo || null, null);
}

console.log(NL + 'ผ่าน ' + ok + ' · ตก ' + fail);
if (fail) process.exit(1);

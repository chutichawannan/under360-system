/* เทส "จะทำเพิ่ม" — ระบบที่นัทออกแบบเอง 12 ก.ย. 2569

   ที่มา (คำนัท): ระบบมีช่องเดียวคือสต็อก แต่ต้องตอบ 2 คำถามพร้อมกัน
     · ลูกค้า: "สั่งลงวันพุธได้ไหม"        · ครัว: "วันนี้ต้องทำอะไรกี่กล่อง"
   → ใครอยากให้ลูกค้าสั่งได้ ต้องกรอกสต็อกล่วงหน้า แล้วครัวก็อ่านไม่ออกว่าของมีจริงหรือยัง

   เคสจริงที่ต้องผ่านให้ได้ (นัทยกมาเอง):
     1) เมนูสัปดาห์ใหม่ กรอกศุกร์เย็น ส่งได้จันทร์ → ลูกค้าติ๊กซื้อได้ตั้งแต่ศุกร์ แต่เลือกวันอาทิตย์ไม่ได้
     2) เมนูปกติ X เหลือ 2 ครัวเติม 10 ส่งได้พุธ → เลือกอังคารเห็น 2 · เลือกพุธเห็น 12

   🔴 กฎที่ห้ามหลุดเด็ดขาด (ISSUE 02 เกิดซ้ำเมื่อ 12 ก.ย. ตี 3:45):
      "จะทำเพิ่ม" ต้องไม่มีทางกลายเป็น actual_stock เอง — ของในตู้มาจากการนับเท่านั้น */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const url = (p) => new URL(p, import.meta.url);
const K2 = fs.readFileSync(url('../../pwa/k2.html'), 'utf8').split(String.fromCharCode(13)).join('');
const LIFF = fs.readFileSync(url('../../liff_customer.html'), 'utf8').split(String.fromCharCode(13)).join('');

let pass = 0, fail = 0;
const ok = (name, got) => {
  if (got === true) { pass++; console.log('  ✅', name); }
  else { fail++; console.log('  ❌', name); }
};
function grab(src, head) {
  let i = src.indexOf(head);
  if (i < 0) return null;
  if (src.slice(i - 6, i) === 'async ') i -= 6;
  let d = 0, started = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; started = true; }
    else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
  }
  return null;
}

console.log(NL + '1) หน้าครัว — ช่อง "จะทำเพิ่ม" แยกขาดจากช่องนับของ');
ok('มีที่เก็บแยก (k2_make) ไม่ปนกับสต็อก', K2.indexOf("'k2_make'") >= 0 && K2.indexOf('let MAKE={}') >= 0);
ok('กรอก 2 อย่าง: จำนวน + ส่งได้ตั้งแต่', K2.indexOf('class="mk-n"') >= 0 && K2.indexOf('class="mk-d"') >= 0);
/* 13 ก.ย.: ชื่อคนใส่ไม่ขึ้นบนจอแล้ว (นัทติว่ารก) แต่ยังต้องถูกเก็บลงฐานข้อมูลเสมอ
   เลขที่ไม่รู้ว่าใครใส่ = เลขที่ไม่มีใครกล้าแตะทีหลัง (บทเรียนเดิมของโปรเจคนี้) */
ok('ยังเก็บชื่อคนใส่ลงฐานข้อมูล (แม้ไม่โชว์บนจอแล้ว)', K2.indexOf('by:USER') >= 0);
ok('เมนูที่ยังไม่มีแผน เป็นปุ่มเล็ก ไม่กางช่องทั้ง 139 เมนู', K2.indexOf('class="mk-add"') >= 0);
ok('งานที่ต้องทำถูกเรียงขึ้นบนสุด', K2.indexOf('rows.sort((a,b)=>{') >= 0 && K2.indexOf('makeOf(a.m.id)?2:0') >= 0);
ok('หัวจอนับ "จะทำเพิ่ม" เข้าไปด้วย (เดิมขึ้น 0 ทั้งที่ต้องผลิต 75)',
  K2.indexOf('(mk && !makeExpired(mk)) ? mk.n : 0') >= 0);
ok('เลขในตู้ที่ไม่ได้มาจากการนับ ยังติดป้ายในหน้าวางแผน (ย่อเป็นป้ายสั้น)',
  K2.indexOf('🕳️ ยังไม่ได้นับ') >= 0 && K2.indexOf('const notCounted =') >= 0);
/* นัทติ 13 ก.ย.: "ก่อนหน้ามันไม่รกขนาดนี้ พอบรรทัดเยอะ ช่องห่าง user ใช้งานไม่สะดวก"
   → เฝ้าไว้ว่าแถวต้องไม่กลับไปยาวเหมือนเดิม */
ok('แถวเมนูเป็น 2 คอลัมน์ ไม่ใช่กองบรรทัดยาว',
  K2.indexOf('class="pmain"') >= 0 && K2.indexOf('class="pside') >= 0);
ok('ตัดบรรทัดที่ซ้ำซ้อนออกแล้ว (นิววางขายสัปดาห์นี้ · ใครเป็นคนใส่)',
  K2.indexOf('นิววางขายสัปดาห์นี้') < 0 && K2.indexOf('เป็นคนใส่</div>') < 0);
ok('ชื่อเมนูมาจากที่เดียว ไม่ถูกเติมซ้ำหลัง render',
  K2.indexOf('แถวมีชื่อเมนูอยู่แล้วตั้งแต่ตอนวาด') >= 0);

/* นัทสั่ง 13 ก.ย.: "จัดให้ประหยัดพื้นที่อีกนิดนึง แล้วก็เพิ่มหมวดของหน่อย" */
ok('หน้าวางแผนมีปุ่มแยกหมวด', K2.indexOf('เลือกหมวดเมนู') >= 0 && K2.indexOf('const pg = countGroups(rows.map') >= 0);
ok('กรองตามหมวดที่เลือกจริง', K2.indexOf("rows = rows.filter(r=>catKey(r.m)===COUNT_CAT)") >= 0);
ok('ใช้ตัวเลือกหมวดร่วมกับหน้านับของ/แอดมิน (เลือกครั้งเดียวใช้ได้ทุกแท็บ)',
  K2.split('pickCountCat(').length - 1 >= 3);

console.log(NL + '2) 🔴 กฎเหล็ก — แผนต้องไม่กลายเป็นของในตู้เอง');
{
  const fn = grab(K2, 'async function saveMake(');
  ok('ดึง saveMake ออกมาได้', !!fn);
  /* ตัดคอมเมนต์ออกก่อนตรวจ — ไม่งั้นไปจับคำใน "คำเตือนที่เราเขียนเอง" แทนโค้ดจริง
     (กับดักประจำโปรเจคนี้ เจอมาแล้วหลายรอบ) */
  /* ตัดคอมเมนต์แบบบล็อกออกทั้งก้อน — บรรทัดกลางบล็อกไม่ได้ขึ้นต้นด้วย * เสมอไป
     (รอบแรกผมกรองแค่บรรทัดที่ขึ้นต้นด้วย * เลยยังไปจับคำเตือนของตัวเอง) */
  const codeOnly = (function(src){
    let out = '', depth = 0;
    for (let k = 0; k < src.length; k++) {
      if (src[k] === '/' && src[k+1] === '*') { depth++; k++; continue; }
      if (src[k] === '*' && src[k+1] === '/') { if (depth) depth--; k++; continue; }
      if (!depth) out += src[k];
    }
    return out;
  })(fn || '');
  ok('saveMake ไม่แตะ actual_stock เลยแม้แต่ที่เดียว (ดูเฉพาะโค้ด ไม่นับคอมเมนต์)',
    !!fn && codeOnly.indexOf('actual_stock') < 0);
  ok('saveMake แตะแค่ stock_total (ยอดที่ลูกค้าซื้อได้)', !!fn && fn.indexOf('stock_total:next') >= 0);
  ok('บวกเฉพาะส่วนต่าง ไม่ใช่ยอดเต็ม (แก้ 4→6 ต้องบวก 2)', !!fn && fn.indexOf('const d = n - before;') >= 0);
  ok('ยอดขายไม่มีทางติดลบ', !!fn && fn.indexOf('Math.max(0, curSell + d)') >= 0);
  ok('ทุกครั้งที่แก้ มี log ว่าใครแก้จากเท่าไหร่เป็นเท่าไหร่', !!fn && fn.indexOf('activity_log') >= 0);
}
{
  const fn = grab(K2, 'async function saveCount(');
  ok('ครัวนับแล้ว = ปิดใบสั่งงานที่ถึงกำหนด (คนยืนยัน ไม่ใช่เวลาผ่านไป)',
    !!fn && fn.indexOf('delete MAKE[mid];') >= 0);
  ok('ใบของสัปดาห์หน้าที่ยังไม่ถึงวัน ต้องไม่ถูกลบทิ้ง',
    !!fn && fn.indexOf("(!mk.from || String(mk.from) <= DAY)") >= 0);
}

console.log(NL + '2.5) 🕐 เวลาไทย — นัทจับได้เอง 13 ก.ย.: "โม๋ข่องนับ 2.10 คือเวลาไหน"');
{
  /* ฐานข้อมูลเก็บ UTC · ไทย +7 · ครัวนับ 9 โมงเช้า หน้าจอเคยขึ้น 02:10 */
  const f = new Function(grab(K2,'function thaiIso(') + ';' + grab(K2,'function thaiDateOf(') + ';' +
    grab(K2,'function thaiClock(') + '; return {d:thaiDateOf, c:thaiClock};')();
  ok('ครัวนับ 02:10 UTC → หน้าจอต้องขึ้น 09:10 น. เวลาไทย',
    f.c('2026-09-13T02:10:00Z').indexOf('09:10') >= 0);
  ok('วันที่ก็ต้องเป็นวันไทย: 20:00 UTC ของวันที่ 12 = วันที่ 13 ที่ไทย',
    f.d('2026-09-12T20:00:00Z') === '2026-09-13');
  ok('เย็นวันไทยยังเป็นวันเดิม', f.d('2026-09-12T10:00:00Z') === '2026-09-12');
  ok('ประวัติการนับใช้ตัวแปลง ไม่ตัดสตริงดิบ', K2.indexOf('esc(thaiClock(r.created_at))') >= 0);
  ok('ป้ายด่วนเทียบวันไทยกับวันไทย', K2.indexOf('thaiDateOf(o.created_at) >= dPlus(thaiToday(),-1)') >= 0);
  ok('ไม่เหลือการตัดสตริงเวลาดิบในหน้าครัวแล้ว',
    K2.indexOf("String(r.created_at).slice(5,16)") < 0 && K2.indexOf("String(o.created_at||'').slice(0,10)") < 0);
}

console.log(NL + '2.7) 🧮 หักจองเฉพาะใบที่ยังไม่ได้จัด (เคสจริง S135 · นัทโทรถามครัวยืนยันแล้ว 13 ก.ย.)');
{
  /* ครัวจัดของให้ทั้ง 2 ใบไปแล้ว · นับของเหลือในตู้ได้ 1 · เดิมคิด 1−2 = −1 ทั้งที่ของพอ
     หลัก: ของที่ออกจากตู้ไปแล้ว ไม่นับ ไม่หัก ทั้งสองฝั่ง */
  const body = [grab(K2,'function packDoneOf('), grab(K2,'function bookedOpen(')].join(NL);
  const mk = (id, date, qty, packed) => ({ id:id, status:'ready', delivery_date:date,
    items:[{id:id+'-i', menu_item_id:'M1', quantity:qty}], packed:packed });
  const run = (orders, today) => new Function('ORDERS','ITEMS','PACK','thaiToday','isMPHeadRow','packedOf',
    body + '; return bookedOpen();')(
      orders, Object.fromEntries(orders.map(o=>[o.id,o.items])),
      Object.fromEntries(orders.map(o=>[o.id, o.packed?{[o.id+'-i']:o.items[0].quantity}:{}])),
      () => today, () => false,
      (o) => Object.values((Object.fromEntries(orders.map(x=>[x.id, x.packed?{[x.id+'-i']:x.items[0].quantity}:{}])))[o.id]||{})
               .reduce((s,n)=>s+Number(n||0),0));
  const T = '2026-09-13';
  ok('ใบที่ยังไม่ได้จัด → ยังกันของไว้ให้เหมือนเดิม',
    run([mk('a', T, 2, false)], T).M1 === 2);
  ok('ใบที่จัดใส่ถุงแล้ว → ไม่หักซ้ำ (ของออกจากตู้ไปแล้ว)',
    run([mk('a', T, 2, true)], T).M1 === undefined);
  ok('เคส S135 จริง: 2 ใบจัดไปแล้วทั้งคู่ → หัก 0',
    run([mk('a', T, 1, true), mk('b','2026-09-14', 1, true)], T).M1 === undefined);
  ok('ปนกัน: จัดแล้ว 1 ใบ ยังไม่จัด 1 ใบ → หักเฉพาะใบที่ยังไม่จัด',
    run([mk('a', T, 1, true), mk('b','2026-09-14', 3, false)], T).M1 === 3);
  ok('ใบวันที่ผ่านไปแล้ว ไม่เอามานับ',
    run([mk('a','2026-09-01', 5, false)], T).M1 === undefined);
}
ok('คำสั่งบนจอเปลี่ยนให้ตรงกับสูตรใหม่ (ห้ามนับถุงที่จัดแล้ว)',
  K2.indexOf('เฉพาะของที่ยังไม่ได้จัด') >= 0 && K2.indexOf('รวมถุงที่แพ็คไว้แล้ว') < 0);
ok('ทุกหน้าที่โชว์ยอดจอง ใช้ฐานเดียวกัน',
  K2.split('bookedOpen()').length - 1 >= 3 && K2.indexOf('bookedOnOpen(DAY)') >= 0);

console.log(NL + '3) หน้าลูกค้า — เห็นของตามวันที่เลือกรับ');
ok('โหลดใบสั่งงานครัวมาด้วย (ไม่เพิ่ม query ใหม่)',
  LIFF.indexOf("const MAKE_KEY = 'k2_make'") >= 0 && LIFF.indexOf('CFG_KEYS = [') >= 0 &&
  LIFF.indexOf('MAKE_KEY,') >= 0);
ok('อ่านพลาดแล้วไม่พัง ถือว่าไม่มีแผน', LIFF.indexOf('catch (e) { kitchenMake = {}; }') >= 0);
{
  const body = [grab(LIFF, 'function thaiTodayYmd('), grab(LIFF, 'function makeHeldFor('),
                grab(LIFF, 'function effectiveStock('), grab(LIFF, 'function stockForDate(')].join(NL);
  const mk = (from, n) => ({ A: { n: n, from: from } });
  const f = new Function('kitchenMake', 'TODAY',
    'function thaiTodayYmd(){ return TODAY; }' + NL +
    body.replace(grab(LIFF, 'function thaiTodayYmd('), '') + NL +
    '; return {held:makeHeldFor, stock:stockForDate};')(mk('2026-09-16', 10), '2026-09-14');
  const item = { id: 'A', stock_total: 12 };   // ในตู้ 2 + จะทำเพิ่ม 10 = ซื้อได้ 12

  console.log('   · เคสนัทข้อ 2: X เหลือ 2 · เติม 10 · ส่งได้พุธ 16');
  ok('เลือกรับอังคาร 15 (ของยังไม่เสร็จ) → เห็น 2', f.stock(item, '2026-09-15') === 2);
  ok('เลือกรับพุธ 16 (วันที่ครัวบอก) → เห็น 12', f.stock(item, '2026-09-16') === 12);
  ok('เลือกรับพฤหัส 17 → เห็น 12', f.stock(item, '2026-09-17') === 12);
  ok('ยังไม่เลือกวัน (เดินดูเมนูอยู่) → เห็น 12 ไม่ขึ้นว่าหมด', f.stock(item, null) === 12);

  console.log('   · เมนูที่ไม่มีแผนอะไรเลย ต้องเหมือนเดิมเป๊ะ');
  const f2 = new Function('kitchenMake', 'TODAY',
    'function thaiTodayYmd(){ return TODAY; }' + NL +
    body.replace(grab(LIFF, 'function thaiTodayYmd('), '') + NL +
    '; return {stock:stockForDate};')({}, '2026-09-14');
  ok('ไม่มีแผน → ได้เท่าสต็อกเดิม', f2.stock({ id: 'A', stock_total: 5 }, '2026-09-15') === 5);
  ok('ไม่มีแผน + ขายไม่จำกัด → ยังไม่จำกัด', f2.stock({ id: 'A', stock_total: null }, '2026-09-15') === 999);
  ok('ไม่มีแผน + ของหมด → ยังหมด', f2.stock({ id: 'A', stock_total: 0 }, '2026-09-15') === 0);

  console.log('   · 🔴 เลยวันที่ครัวบอกแล้ว แต่ยังไม่มีใครนับ = ไม่มีหลักฐานว่าทำจริง');
  const f3 = new Function('kitchenMake', 'TODAY',
    'function thaiTodayYmd(){ return TODAY; }' + NL +
    body.replace(grab(LIFF, 'function thaiTodayYmd('), '') + NL +
    '; return {stock:stockForDate};')(mk('2026-09-14', 10), '2026-09-16');
  ok('เลยกำหนด 2 วัน ใบยังค้าง → กันไว้ เหลือ 2 (พังแบบปลอดภัย ไม่ขายของที่ไม่มี)',
    f3.stock(item, '2026-09-17') === 2);

  console.log('   · กันเลขเพี้ยน');
  const f4 = new Function('kitchenMake', 'TODAY',
    'function thaiTodayYmd(){ return TODAY; }' + NL +
    body.replace(grab(LIFF, 'function thaiTodayYmd('), '') + NL +
    '; return {stock:stockForDate};')(mk('2026-09-16', 99), '2026-09-14');
  ok('แผนมากกว่าสต็อกที่มี → ไม่ติดลบ ได้ 0', f4.stock({ id: 'A', stock_total: 12 }, '2026-09-15') === 0);
}

console.log(NL + '4) ด่านตอนกดสั่ง — กันที่หน้าจออย่างเดียวไม่พอ');
ok('มีด่านเช็คของเกินตามวันรับ', LIFF.indexOf('function cartOverStockFor(') >= 0);
ok('ด่านนี้ถูกเรียกตอนกดสั่งจริง', LIFF.indexOf('const _over = cartOverStockFor(selDate);') >= 0);
ok('ข้ามแพคเกจกับ Meal Plan (คนละเรื่องกับสต็อก)',
  (grab(LIFF, 'function cartOverStockFor(') || '').indexOf("c.type === 'package' || c.type === 'meal_plan'") >= 0);
ok('เช็คพลาดแล้วปล่อยผ่าน ห้ามบล็อกการสั่ง (กฎเดิมของไฟล์นี้)',
  LIFF.indexOf("catch (e) { console.warn('เช็คของที่กำลังจะทำไม่สำเร็จ ปล่อยผ่าน', e); }") >= 0);
ok('บอกลูกค้าว่าเลือกวันใหม่ได้ หรือลดจำนวนเหลือเท่าไหร่', LIFF.indexOf('หรือลดจำนวนเหลือ') >= 0);
ok('ด่านวันเริ่มขายเดิมยังอยู่ ไม่ได้ถูกแทนที่', LIFF.indexOf('const _notYet = cartDateBeforeReady(selDate);') >= 0);

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + pass) : ('✅ ผ่านทั้งหมด ' + pass + ' ข้อ'));
process.exit(fail ? 1 : 0);

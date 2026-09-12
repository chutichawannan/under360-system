/* เทสสมุดรายรับรายจ่าย pwa/money.html (ใบงาน docs/BRIEF_LEDGER.md · นัทขอเอง 12 ก.ย. 2569)

   เน้นเฝ้า "กติกาที่พังแล้วเงียบ" ไม่ใช่หน้าตา:
     · รายรับร้านต้องมาจาก orders เท่านั้น ห้ามให้ใครจดซ้ำ
     · ตัวกรองยอดขายต้องครบตาม scripts/finance/orders.mjs (เทส/HS-/ใบยอด 0)
     · เวลาไทยเสมอ (นัทอยู่ PST)
     · ลบแล้วต้องนับซ้ำ (RLS บล็อกเงียบแล้วคืน 204)
     · export เกิดในเครื่องคนกด ไม่ผ่านเซิร์ฟเวอร์ (ข้อมูลส่วนตัวห้ามหลุด) */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const url = (p) => new URL(p, import.meta.url);
const H = fs.readFileSync(url('../../pwa/money.html'), 'utf8').split(String.fromCharCode(13)).join('');
const SQL = fs.readFileSync(url('../sql_ledger.sql'), 'utf8');
const VJ = JSON.parse(fs.readFileSync(url('../../vercel.json'), 'utf8'));

let pass = 0, fail = 0;
const ok = (name, got) => {
  if (got === true) { pass++; console.log('  ✅', name); }
  else { fail++; console.log('  ❌', name); }
};
/* ดึงฟังก์ชันจริงออกมารัน — สแกนปีกกา เหมือนเทสตัวอื่นในชุดนี้ */
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

/* ตัวลูกศรบรรทัดเดียว (ไม่มีปีกกา) ใช้ grab ไม่ได้ — มันจะกวาดยาวไปกินบรรทัดถัดไป */
const line = (src, head) => {
  const i = src.indexOf(head);
  if (i < 0) return null;
  const j = src.indexOf(String.fromCharCode(10), i);
  return src.slice(i, j < 0 ? src.length : j);
};

console.log(NL + '1) ตาราง ledger — โครงตรงใบงาน');
[ 'at', 'owner', 'book', 'paid_by', 'kind', 'amount', 'category', 'note', 'slip_url', 'source', 'created_by' ]
  .forEach((c) => ok('มีคอลัมน์ ' + c, SQL.indexOf(NL + '  ' + c) >= 0));
ok('มีธง needs_review ไว้ให้กะปันติดตอนเดาไม่ชัด', SQL.indexOf('needs_review') >= 0);
ok('รันซ้ำได้ ถ้าเคยรันเวอร์ชันแรกที่ใช้คอลัมน์ side',
   SQL.indexOf('add column if not exists book') >= 0 && SQL.indexOf('update ledger set book = side') >= 0);
ok('บังคับกระเป๋าได้แค่ ส่วนตัว/ร้าน/เราสองคน ตั้งแต่ชั้น DB',
   SQL.indexOf("book in ('personal','shop','shared')") >= 0);
ok('บังคับ owner ได้แค่ นัท/พลอย', SQL.indexOf("owner in ('nut','ploy')") >= 0);
ok('มีช่องบอกว่าใครออกเงินจริงในกระเป๋าเราสองคน', SQL.indexOf('paid_by') >= 0);
ok('เขียนตรง ๆ ว่ายังล็อกไม่ให้อีกฝ่ายเห็นไม่ได้จริง (ห้ามเคลมเกิน)',
   SQL.indexOf('อย่าบอกใครว่าข้อมูลฝั่งพลอยถูกล็อก') >= 0);
ok('บังคับ kind ได้แค่ in/out', SQL.indexOf("kind in ('in','out')") >= 0);
ok('ห้ามเงินติดลบ (ทิศทางอยู่ที่ kind ไม่ใช่เครื่องหมาย)', SQL.indexOf('amount >= 0') >= 0);
ok('เปิด RLS', SQL.indexOf('enable row level security') >= 0);
ok('เขียนเตือนว่ายังไม่ได้รัน ต้องรันมือ', SQL.indexOf('ยังไม่ได้รัน') >= 0);

console.log(NL + '2) 🔑 รายรับร้านไม่ให้ใครจด — คำนวณจาก orders เท่านั้น');
ok('หน้าเว็บอ่าน orders มาคิดรายรับร้าน', H.indexOf('async function loadShopIncome(') >= 0);
ok('บอกบนจอว่ายอดนี้มาจาก orders ไม่มีใครต้องจด', H.indexOf('ไม่มีใครต้องจด') >= 0);
{
  /* ตัวกรองต้องตรงกับ scripts/finance/orders.mjs — ถ้าใครแก้ที่นั่นแล้วลืมที่นี่ ต้องมีคนสะดุด */
  const body = [grab(H, 'function isTestOrder('), 'const TEST_NAMES=' +
    JSON.stringify(['nut', 'test user', 'ทดลอบ 1', 'ploy ♡', 'schematest']) + ';',
    line(H, 'const isLoyaltyLog ='), line(H, 'const isSale =')].join(';' + NL);
  const f = new Function(body + '; return {isSale:isSale, isTest:isTestOrder, isLog:isLoyaltyLog};')();
  const O = (o) => Object.assign({ order_number: 'U-0912-001', total: 500, source: 'liff' }, o);
  ok('ออเดอร์ปกติ = ยอดขาย', f.isSale(O({})) === true);
  ok('ใบยอด 0 ไม่ใช่ยอดขาย (รอบส่งเพิ่ม/พนักงาน/prepaid)', f.isSale(O({ total: 0 })) === false);
  ok('HS- = log เก็บแต้ม ไม่ใช่ยอดขาย', f.isSale(O({ order_number: 'HS-123' })) === false);
  ok('source=hato_loyalty_log ไม่ใช่ยอดขาย', f.isSale(O({ source: 'hato_loyalty_log' })) === false);
  ok('ออเดอร์เทส parallel ไม่นับ', f.isSale(O({ source: 'parallel_test' })) === false);
  ok('ออเดอร์เทสของทีม (ชื่อลูกค้า Nut) ไม่นับ', f.isSale(O({ customer_name: 'Nut' })) === false);
  ok('โน้ตขึ้นต้น [PARALLEL] ไม่นับ', f.isSale(O({ notes: '[PARALLEL] เทส' })) === false);
}

console.log(NL + '3) เวลาไทยเสมอ (นัทอยู่ PST เปิดตอนไหนก็ต้องได้วันเดียวกับครัว)');
{
  const f = new Function(grab(H, 'function thaiYmd(') + '; return thaiYmd;')();
  ok('ตี 3 ของวันที่ 13 ตามเวลาไทย = 13 ไม่ใช่ 12', f(new Date('2026-09-12T20:00:00Z')) === '2026-09-13');
  ok('เย็นวันที่ 12 เวลาไทย ยังเป็น 12', f(new Date('2026-09-12T10:00:00Z')) === '2026-09-12');
  const g = new Function(grab(H, 'function monthRange(') + ';' + grab(H, 'const dayStartIso =') +
    '; return monthRange;')();
  const m = g('2026-09-12');
  ok('เดือนเริ่ม 1 ก.ย. เวลาไทย (= 31 ส.ค. 17:00 UTC)', m.from === '2026-08-31T17:00:00.000Z');
  ok('เดือนจบก่อน 1 ต.ค. เวลาไทย', m.to === '2026-09-30T17:00:00.000Z');
}

console.log(NL + '4) แก้/ลบ — จุดที่เคยพังเงียบ');
ok('ลบแล้วนับแถวซ้ำ ไม่เชื่อ 204', /await rest\('ledger\?id=eq\.' \+ r\.id, \{method:'DELETE'\}\)/.test(H)
  && H.indexOf('แถวยังอยู่') >= 0);
ok('แก้รายการแล้วปลดธงรอยืนยันให้เอง', H.indexOf('body.needs_review = false;') >= 0);
ok('แก้เฉพาะวัน ไม่ทำให้เวลาเดิมเพี้ยน', H.indexOf('thaiYmd(new Date(EDIT.at)) === ymd') >= 0);
ok('มีปุ่มยืนยันทีเดียวหลายรายการ', H.indexOf('function confirmAll(') >= 0);
ok('ยืนยันกระเป๋าทีละรายการได้', H.indexOf('function confirmBook(') >= 0);

console.log(NL + '4.5) v2 — 2 คน + กระเป๋าเราสองคน');
ok('มี 3 กระเป๋าบนหัวจอ ไม่ใช่ตัวกรองซ่อน',
   H.indexOf('setBook('+String.fromCharCode(39)+'shared') >= 0 || H.indexOf('b-shared') >= 0);
ok('กระเป๋าส่วนตัวแยกตามคน (ของใครของมัน)',
   H.indexOf("r.book === 'personal' && (r.owner||'nut') === WHO") >= 0);
ok('ยอดขายร้านโผล่เฉพาะกระเป๋าร้าน ไม่ปนส่วนตัว/เราสองคน',
   H.indexOf("const shop = BOOK === 'shop';") >= 0);
{
  const f = new Function(grab(H, 'function sharedBalance(') + '; return sharedBalance;')();
  const R = (paid_by, amount) => ({kind:'out', paid_by:paid_by, amount:amount});
  const a = f([R('nut', 1000), R('ploy', 400)]);
  ok('นัทออก 1000 พลอยออก 400 → นัทออกเกินครึ่ง 300', a.nutNet === 300);
  const b = f([R('nut', 500), R('ploy', 500)]);
  ok('ออกเท่ากัน = ไม่มีใครติดใคร', b.nutNet === 0);
  const c = f([R(null, 200)]);
  ok('ไม่ได้ระบุคนออกเงิน ไม่ทำให้ยอดหาย', c.total === 200);
  const d = f([{kind:'in', paid_by:'nut', amount:9999}]);
  ok("รายการรับเข้า ไม่ถูกนับเป็นเงินที่ใครออก", d.total === 0);
}

console.log(NL + '5) ความปลอดภัย/ความเป็นส่วนตัวตามใบงาน');
ok('ล็อกด้วยด่านรหัสตัวกลาง', H.indexOf('src="/gate.js"') >= 0);
ok('กัน Google', H.indexOf('noindex') >= 0);
ok('export เกิดในเครื่องคนกด (Blob) ไม่ส่งขึ้นเซิร์ฟเวอร์', H.indexOf('URL.createObjectURL(new Blob(') >= 0);
ok('CSV ใส่ BOM ให้ Excel อ่านไทยออก', H.indexOf('String.fromCharCode(0xFEFF)') >= 0);
ok('CSV มีคอลัมน์คนจด + คนออกเงิน (คนทำบัญชีต้องแยกกระเป๋าได้)',
   H.indexOf("'คนจด','คนออกเงิน'") >= 0);
ok('ไม่มีการเขียนไฟล์ข้อมูลส่วนตัวลง repo (หน้านี้ไม่มี fetch ไปที่อื่นนอกจาก Supabase)',
  H.split('fetch(').length - 1 === 1);

console.log(NL + '6) ทางเข้า — ห้ามทับ /money ที่เป็นใบทวงเงินลูกค้า');
{
  const r = (VJ.rewrites || []);
  const money = r.find((x) => x.source === '/money');
  const ledger = r.find((x) => x.source === '/ledger');
  ok('/money ยังเป็นใบทวงเงินเหมือนเดิม', !!money && money.destination === '/pwa/cash_due.html');
  ok('/ledger = สมุดรายรับรายจ่าย', !!ledger && ledger.destination === '/pwa/money.html');
  ok('หน้าเตือนเรื่องชื่อซ้ำไว้ในไฟล์ กันคนบอกผิดลิงก์', H.indexOf('ใบทวงเงินลูกค้า') >= 0);
}

console.log(NL + '7) ขอบเขตที่ใบงานสั่งว่ายังไม่ทำ');
ok('ไฟล์ประกาศขอบเขตไว้ว่ายังไม่ทำอะไรบ้าง (กันบานปลายรอบหน้า)', H.indexOf('ไม่ทำในเวอร์ชันแรก') >= 0);
ok('ยิงออกนอกได้ที่เดียวคือ Supabase (ไม่มี OCR / API ธนาคาร / ตัวติดตามใด ๆ)',
  (() => {
    const hosts = (H.match(/https:[/][/][a-zA-Z0-9.-]+/g) || [])
      .map((u) => u.slice(8)).filter((h) => h.length);
    return hosts.every((h) => h === 'zdartbvhbvqlwzwyyiia.supabase.co');
  })());
ok('เขียนกำกับว่าตัวเลขต้องผ่านคนทำบัญชีก่อนใช้จริง', H.indexOf('ผ่านคนทำบัญชี') >= 0);

console.log(NL + '────────────────────────────');
console.log((fail ? '❌ ตก ' + fail + ' ข้อ · ผ่าน ' + pass : '✅ ผ่านทั้งหมด ' + pass + ' ข้อ'));
process.exit(fail ? 1 : 0);

/* เทสสมุดเงินเรา pwa/money.html + scripts/sql_ledger.sql
   ใบงาน docs/BRIEF_LEDGER.md (นัทขอเอง 12 ก.ย. 2569) — ทำตาม v3 ที่นัทเคาะดีไซน์แล้ว

   เน้นเฝ้า "กติกาที่พังแล้วเงียบ" ไม่ใช่หน้าตา:
     · รายรับร้านต้องมาจาก orders เท่านั้น ห้ามให้ใครจดซ้ำ
     · ตัวกรองยอดขายต้องครบตาม scripts/finance/orders.mjs (เทส / HS- / ใบยอด 0)
     · เวลาไทยเสมอ (นัทอยู่ PST)
     · ลบแล้วต้องนับซ้ำ (RLS บล็อกเงียบแล้วคืน 204)
     · ห้ามเคลมว่า "ล็อกจากอีกฝ่ายแล้ว" — พี่ปืนสั่งย้ำ 12 ก.ย. เพราะนี่คือเงินส่วนตัวของนัทกับพลอย */
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
  const j = src.indexOf(NL, i);
  return src.slice(i, j < 0 ? src.length : j);
};

console.log(NL + '1) ตาราง ledger — โครงตรงใบงาน v2/v3');
['at', 'owner', 'book', 'paid_by', 'kind', 'amount', 'category', 'note', 'slip_url', 'source', 'created_by']
  .forEach((c) => ok('มีคอลัมน์ ' + c, SQL.indexOf(NL + '  ' + c) >= 0));
ok('มีธง needs_review ไว้ให้กะปันติดตอนเดาไม่ชัด', SQL.indexOf('needs_review') >= 0);
ok('รันซ้ำได้ ถ้าเคยรันเวอร์ชันแรกที่ใช้คอลัมน์ side',
  SQL.indexOf('add column if not exists book') >= 0 && SQL.indexOf('update ledger set book = side') >= 0);
ok('บังคับกระเป๋าได้แค่ ส่วนตัว/ร้าน/เราสองคน ตั้งแต่ชั้น DB',
  SQL.indexOf("book in ('personal','shop','shared')") >= 0);
ok('บังคับ owner ได้แค่ นัท/พลอย', SQL.indexOf("owner in ('nut','ploy')") >= 0);
ok('มีช่องบอกว่าใครออกเงินจริงในกระเป๋าเราสองคน', SQL.indexOf('paid_by') >= 0);
ok('ห้ามเงินติดลบ (ทิศทางอยู่ที่ kind ไม่ใช่เครื่องหมาย)', SQL.indexOf('amount >= 0') >= 0);
ok('เปิด RLS', SQL.indexOf('enable row level security') >= 0);
ok('เขียนเตือนว่ายังไม่ได้รัน ต้องรันมือ', SQL.indexOf('ยังไม่ได้รัน') >= 0);
ok('เขียนตรง ๆ ว่ายังล็อกไม่ให้อีกฝ่ายเห็นไม่ได้จริง (ห้ามเคลมเกิน)',
  SQL.indexOf('อย่าบอกใครว่าข้อมูลฝั่งพลอยถูกล็อก') >= 0);

console.log(NL + '2) 🔑 รายรับร้านไม่ให้ใครจด — คำนวณจาก orders เท่านั้น');
ok('หน้าเว็บอ่าน orders มาคิดรายรับร้าน', H.indexOf('async function loadShopIncome(') >= 0);
ok('บอกบนจอว่ายอดขายร้านดึงเอง ไม่ต้องจด', H.indexOf('ไม่ต้องจดเอง') >= 0);
{
  /* ตัวกรองต้องตรงกับ scripts/finance/orders.mjs — ถ้าใครแก้ที่นั่นแล้วลืมที่นี่ ต้องมีคนสะดุด */
  const body = [grab(H, 'function isTestOrder('), 'const TEST_NAMES=' +
    JSON.stringify(['nut', 'test user', 'ทดลอบ 1', 'ploy ♡', 'schematest']) + ';',
    line(H, 'const isLoyaltyLog ='), line(H, 'const isSale =')].join(';' + NL);
  const f = new Function(body + '; return {isSale:isSale};')();
  const O = (o) => Object.assign({ order_number: 'U-0912-001', total: 500, source: 'liff' }, o);
  ok('ออเดอร์ปกติ = ยอดขาย', f.isSale(O({})) === true);
  ok('ใบยอด 0 ไม่ใช่ยอดขาย (รอบส่งเพิ่ม/พนักงาน/prepaid)', f.isSale(O({ total: 0 })) === false);
  ok('HS- = log เก็บแต้ม ไม่ใช่ยอดขาย', f.isSale(O({ order_number: 'HS-123' })) === false);
  ok('source=hato_loyalty_log ไม่ใช่ยอดขาย', f.isSale(O({ source: 'hato_loyalty_log' })) === false);
  ok('ออเดอร์เทส parallel ไม่นับ', f.isSale(O({ source: 'parallel_test' })) === false);
  ok('ออเดอร์เทสของทีม (ชื่อลูกค้า Nut) ไม่นับ', f.isSale(O({ customer_name: 'Nut' })) === false);
  ok('โน้ตขึ้นต้น [PARALLEL] ไม่นับ', f.isSale(O({ notes: '[PARALLEL] เทส' })) === false);
}

console.log(NL + '3) เวลาไทยเสมอ (นัทอยู่ PST เปิดตอนไหนก็ต้องได้วันเดียวกับเมืองไทย)');
{
  const f = new Function(grab(H, 'function thaiYmd(') + '; return thaiYmd;')();
  ok('ตี 3 ของวันที่ 13 ตามเวลาไทย = 13 ไม่ใช่ 12', f(new Date('2026-09-12T20:00:00Z')) === '2026-09-13');
  ok('เย็นวันที่ 12 เวลาไทย ยังเป็น 12', f(new Date('2026-09-12T10:00:00Z')) === '2026-09-12');
  const g = new Function(grab(H, 'function monthRange(') + ';' + line(H, 'const dayStartIso =') +
    '; return monthRange;')();
  const m = g('2026-09-12');
  ok('เดือนเริ่ม 1 ก.ย. เวลาไทย (= 31 ส.ค. 17:00 UTC)', m.from === '2026-08-31T17:00:00.000Z');
  ok('เดือนจบก่อน 1 ต.ค. เวลาไทย', m.to === '2026-09-30T17:00:00.000Z');
  ok('ข้ามปี: ธ.ค. ต่อ ม.ค. ปีถัดไป ไม่พัง', g('2026-12-05').to === '2026-12-31T17:00:00.000Z');
}

console.log(NL + '4) แก้/ลบ — จุดที่เคยพังเงียบ');
ok('ลบแล้วนับแถวซ้ำ ไม่เชื่อ 204', H.indexOf('แถวยังอยู่') >= 0 && H.indexOf("method:'DELETE'") >= 0);
ok('แก้รายการแล้วปลดธงรอยืนยันให้เอง', H.indexOf('body.needs_review = false;') >= 0);
ok('แก้เฉพาะวัน ไม่ทำให้เวลาเดิมเพี้ยน', H.indexOf('thaiYmd(new Date(EDIT.at)) === ymd') >= 0);
ok('ป้ายรอยืนยันกระเป๋า แตะยืนยันได้ในแถวเลย (ตามดีไซน์)',
  H.indexOf('ยังไม่ยืนยันกระเป๋า') >= 0 && H.indexOf('chip flag') >= 0);

console.log(NL + '5) โครงหน้าตามดีไซน์ที่นัทเคาะ (v3)');
ok('แถบบน 4 แท็บ: ของนัท · ของพลอย · เราสองคน · สรุป',
  ['ของนัท', 'ของพลอย', 'เราสองคน', 'สรุป'].every((t) => H.indexOf(t) >= 0));
ok('แท็บของนัทมีปุ่มย่อย ส่วนตัว / ร้าน Under360',
  H.indexOf("nut:['personal','shop']") >= 0 && H.indexOf('ร้าน Under360') >= 0);
ok('กระเป๋าส่วนตัวแยกตามคน (ของใครของมัน)',
  H.indexOf("r.book === 'personal' && (r.owner||'nut') === 'nut'") >= 0 &&
  H.indexOf("r.book === 'personal' && r.owner === 'ploy'") >= 0);
ok('ยอดขายร้านโผล่เฉพาะกระเป๋าร้านกับหน้าสรุป ไม่ปนส่วนตัว',
  H.indexOf("(POT === 'shop' || isSum) ? SHOP_IN.month : 0") >= 0);
ok('รายการจัดกลุ่มตามวัน + มียอดรวมท้ายหัววัน',
  H.indexOf('function dayLabel(') >= 0 && H.indexOf('class="dayhead"') >= 0);
ok('หัววันเขียน วันนี้ / เมื่อวาน ตามดีไซน์',
  H.indexOf('วันนี้ · ') >= 0 && H.indexOf('เมื่อวาน · ') >= 0);
ok('มีแถบสัดส่วนหมวด 4 หมวดบนสุด', H.indexOf('.slice(0,4)') >= 0);
ok('หน้าสรุปมีบรรทัดใครออกไปก่อนมากกว่า',
  H.indexOf('ออกไปก่อนมากกว่า') >= 0 && H.indexOf('function renderSummary(') >= 0);
{
  const f = new Function(grab(H, 'function sharedBalance(') + '; return sharedBalance;')();
  const R = (by, amount) => ({ kind: 'out', paid_by: by, amount: amount });
  ok('นัทออก 1000 พลอยออก 400 นัทออกเกินครึ่ง 300', f([R('nut', 1000), R('ploy', 400)]).nutNet === 300);
  ok('ออกเท่ากัน = ไม่มีใครติดใคร', f([R('nut', 500), R('ploy', 500)]).nutNet === 0);
  ok('ไม่ได้ระบุคนออกเงิน ไม่ทำให้ยอดหาย', f([R(null, 200)]).total === 200);
  ok('รายการรับเข้า ไม่ถูกนับเป็นเงินที่ใครออก',
    f([{ kind: 'in', paid_by: 'nut', amount: 9999 }]).total === 0);
}

console.log(NL + '6) ใครเป็นใคร = LINE uid (ใบงาน v3 สั่ง ไม่ใช่ PIN ร่วม)');
ok('รู้ตัวตนจากบัญชีไลน์ ไม่ใช่รหัสร่วม',
  H.indexOf('liff.getProfile') >= 0 && H.indexOf('gate.js') < 0);
ok('ผูกไลน์กับชื่อครั้งเดียวแล้วล็อกช่องนั้น',
  H.indexOf('async function claimMe(') >= 0 && H.indexOf('if(OWNERS[uid]) return;') >= 0);
ok('ที่เก็บการผูกอยู่ใน kitchen_data ไม่ใช่ในเครื่องใครคนเดียว',
  H.indexOf("OWNERS_KEY = 'ledger_owners'") >= 0);
ok('แท็บของอีกฝ่ายกดไม่ได้',
  H.indexOf("if(t === 'nut' && ME !== 'nut') return;") >= 0 &&
  H.indexOf("if(t === 'ploy' && ME !== 'ploy') return;") >= 0);
/* 🔴 พี่ปืนสั่ง 12 ก.ย.: ห้ามพูดว่า "ล็อกแล้ว" เพราะเป็นเงินส่วนตัวของนัทกับพลอย
   ถ้าวันไหนมีคนลบหมายเหตุนี้ทิ้ง = มีคนกำลังจะเคลมเกินจริง ต้องสะดุดตรงนี้ */
ok('เขียนกำกับว่ายังไม่ได้ล็อกจริง ห้ามเคลมเกิน',
  H.indexOf('ห้ามบอกใครว่าข้อมูลถูกล็อกแล้ว') >= 0);
/* พี่ปืนชี้ 12 ก.ย.: คำเตือนในคอมเมนต์ = คนใช้ไม่มีวันเห็น
   → ต้องมีบนจอด้วย และต้องอยู่หน้าผูกบัญชีครั้งแรก (หน้าที่พลอยเจอก่อนเห็นตัวเลขใด ๆ) */
ok('คำเตือนโผล่บนจอจริง ไม่ใช่แค่ในคอมเมนต์โค้ด (เลขาเคาะทาง ก)',
  H.indexOf('class="lockline"') >= 0 &&
  H.indexOf('แยกกระเป๋าให้ดูง่าย · ยังไม่ได้ล็อกจากกันจริง') >= 0);
/* บรรทัดนี้ลบได้เมื่อทำชั้นล็อกจริงเสร็จเท่านั้น — ตราบที่ยังอ่านด้วย anon key ต้องอยู่
   ถ้าวันไหนใครลบทิ้งโดยยังไม่ได้ทำ server-side เทสข้อนี้จะตก */
ok('บรรทัดอยู่ใต้ชื่อแอปบนหน้าจริง (ไม่ใช่ซ่อนอยู่ท้ายหน้า)',
  H.indexOf('สมุดเงินเรา</h1>') < H.indexOf('class="lockline"') &&
  H.indexOf('class="lockline"') < H.indexOf('role="tablist"'));
ok('ยังอ่านด้วย anon key อยู่ = เหตุผลที่บรรทัดนี้ต้องคงอยู่',
  H.indexOf('SB_KEY') >= 0);
ok('หน้าผูกบัญชีครั้งแรกก็บอกเรื่องนี้ด้วย (จุดที่พลอยเจอก่อนเห็นตัวเลขใด ๆ)',
  H.indexOf('ไลน์นี้ยังไม่ได้ผูกกับสมุด') < H.indexOf('class=\"warnbox\"') &&
  H.indexOf('คนที่รู้วิธียังเปิดดูข้อมูลได้') >= 0);

console.log(NL + '7) ความเป็นส่วนตัว + ขอบเขตตามใบงาน');
ok('กัน Google', H.indexOf('noindex') >= 0);
ok('export เกิดในเครื่องคนกด (Blob) ไม่ส่งขึ้นเซิร์ฟเวอร์', H.indexOf('URL.createObjectURL(new Blob(') >= 0);
ok('CSV ใส่ BOM ให้ Excel อ่านไทยออก', H.indexOf('String.fromCharCode(0xFEFF)') >= 0);
ok('CSV มีคอลัมน์คนจด + คนออกเงิน (คนทำบัญชีต้องแยกกระเป๋าได้)',
  H.indexOf('คนจด') >= 0 && H.indexOf('คนออกเงิน') >= 0);
ok('ไฟล์ประกาศขอบเขตไว้ว่ายังไม่ทำอะไรบ้าง (กันบานปลายรอบหน้า)',
  H.indexOf('เวอร์ชันแรกตั้งใจไม่ทำ') >= 0);
ok('ยิงออกนอกเฉพาะที่จำเป็น: Supabase · LIFF · ฟอนต์ (ไม่มี OCR / API ธนาคาร / ตัวติดตาม)',
  (() => {
    const allow = ['zdartbvhbvqlwzwyyiia.supabase.co', 'static.line-scdn.net',
                   'fonts.googleapis.com', 'fonts.gstatic.com', 'claude.ai'];
    const hosts = (H.match(/https:[/][/][a-zA-Z0-9.-]+/g) || []).map((u) => u.slice(8)).filter(Boolean);
    return hosts.every((h) => allow.indexOf(h) >= 0);
  })());

console.log(NL + '8) ทางเข้า — ห้ามทับ /money ที่เป็นใบทวงเงินลูกค้า');
{
  const r = (VJ.rewrites || []);
  const money = r.find((x) => x.source === '/money');
  const ledger = r.find((x) => x.source === '/ledger');
  ok('/money ยังเป็นใบทวงเงินเหมือนเดิม', !!money && money.destination === '/pwa/cash_due.html');
  ok('/ledger = สมุดเงินเรา', !!ledger && ledger.destination === '/pwa/money.html');
  ok('หน้าเตือนเรื่องชื่อซ้ำไว้ในไฟล์ กันคนบอกผิดลิงก์', H.indexOf('ใบทวงเงินลูกค้า') >= 0);
}

console.log(NL + '────────────────────────────');
console.log((fail ? '❌ ตก ' + fail + ' ข้อ · ผ่าน ' + pass : '✅ ผ่านทั้งหมด ' + pass + ' ข้อ'));
process.exit(fail ? 1 : 0);

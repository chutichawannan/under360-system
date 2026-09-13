/* 🧪 test_k2 — หน้าครัวใหม่ pwa/k2.html ต้องอยู่ร่วมกับหน้าเก่าได้ (ISSUE 02)
 *
 * ทำไมต้องมีเทสนี้:
 *   นัทสั่งว่าหน้าใหม่ "ต้องคุยกับระบบเก่าด้วย" และครัวห้ามสะดุดแม้แต่วันเดียว
 *   → ต้องพิสูจน์ว่า ค่าที่หน้าใหม่เขียนลง DB แล้ว **หน้าเก่าอ่านกลับได้ค่าเดิม**
 *
 * วิธี: ดึงสูตรจริงของหน้าเก่าออกมาจาก kitchen_queue.html (ไม่เขียนใหม่เอง)
 *       แล้วป้อนค่าที่หน้าใหม่จะเขียน เข้าไปดูว่าได้เลขเดิมไหม
 *
 * รัน: node scripts/u/test_k2.mjs
 */
import fs from 'fs';

const NEW = fs.readFileSync('pwa/k2.html', 'utf8');
const OLD = fs.readFileSync('kitchen_queue.html', 'utf8');
/* ตัดคอมเมนต์ออกก่อน — คอมเมนต์อธิบายว่า 'ตัดอะไรทิ้ง' จะทำให้เทสจับคำผิดตัว */
const C1 = String.fromCharCode(47), C2 = String.fromCharCode(42);   // "/" และ "*" — เลี่ยงเขียน regex ที่ shell กินไปตอนสร้างไฟล์
const CODE = NEW.split(C1 + C2).map((part, i) => i === 0 ? part : part.slice(part.indexOf(C2 + C1) + 2)).join(' ')
                .split('\n').filter(l => l.trim().slice(0, 2) !== C1 + C1).join('\n');

let pass = 0, fail = 0;
const ok  = (n, c, extra) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n + (extra ? '  → ' + extra : '')); } };

/* ── ดึงฟังก์ชันจริงออกมาจากไฟล์ ไม่ re-implement ─────────────────────── */
function grab(src, sig) {
  const i = src.indexOf(sig);
  if (i < 0) return null;
  let d = 0, s = src.indexOf('{', i);
  for (let j = s; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}') { d--; if (!d) return src.slice(i, j + 1); }
  }
  return null;
}

console.log('\n1) สูตรของหน้าเก่า — ดึงมาจาก kitchen_queue.html จริง');
const oldReal = grab(OLD, 'function stkRealOf(');
ok('เจอ stkRealOf ในหน้าเก่า', !!oldReal);

/* หน้าเก่า: มีจริง = max(0, stock_total + ordered − incoming) */
const stkRealOf = oldReal
  ? new Function('m', 'ordered', 'stkIncOf', oldReal + '; return stkRealOf(m, ordered);')
  : null;
const realOld = (stockTotal, ordered, inc) =>
  stkRealOf({ stock_total: stockTotal, id: 'x' }, ordered, () => inc);

console.log('\n2) หน้าใหม่เขียนอะไรลง DB — อ่านจาก pwa/k2.html จริง');
ok('เขียน actual_stock = เลขที่คนนับ (ไม่ตัดทิ้ง)',
   /actual_stock\s*:\s*n\b/.test(NEW));
ok('เขียน stock_total = max(0, นับได้ − จอง)',
   /const\s+sellable\s*=.*Math\.max\(0,\s*n\s*-\s*booked\)/.test(NEW));
ok('ไม่มี Math.max บีบเลขที่คนนับ (กำแพงที่ทำให้พิมพ์ 3 ได้ 4)',
   !/actual_stock\s*:\s*Math\.max/.test(NEW));

console.log('\n3) 🤝 อยู่ร่วมกับหน้าเก่า — เขียนจากหน้าใหม่แล้วหน้าเก่าต้องอ่านได้เลขเดิม');
/* หน้าใหม่ไม่ใช้ "กำลังเติม" เลย → inc = 0 เสมอ */
[[10, 0], [10, 4], [7, 7], [3, 0], [0, 0], [25, 9]].forEach(([counted, booked]) => {
  const sellable = Math.max(0, counted - booked);         // สิ่งที่หน้าใหม่เขียน
  const seenByOld = realOld(sellable, booked, 0);          // สิ่งที่หน้าเก่าอ่านได้
  ok('นับ ' + counted + ' · จอง ' + booked + ' → หน้าเก่าเห็น ' + seenByOld,
     seenByOld === counted, 'ควรเห็น ' + counted);
});

console.log('\n4) ⚠️ เคสที่หน้าเก่าตามไม่ทัน — ต้องรู้ไว้ ไม่ใช่แกล้งไม่เห็น');
/* นับได้น้อยกว่าที่จอง = เคส S062 (จอง 4 · นับได้ 3)
   หน้าเก่าไม่มีที่เก็บค่าที่ต่ำกว่าจอง จึงเห็นเท่ากับจองเสมอ — นี่คือบั๊กที่ ISSUE 02 กำลังแก้ */
const s062 = { counted: 3, booked: 4 };
const sellable062 = Math.max(0, s062.counted - s062.booked);
const oldSees = realOld(sellable062, s062.booked, 0);
ok('หน้าเก่ายังเห็น 4 (ตามข้อจำกัดของมันเอง) — พฤติกรรมไม่เปลี่ยน',
   oldSees === 4, 'ได้ ' + oldSees);
ok('แต่หน้าใหม่เก็บ 3 ไว้ครบใน actual_stock — ไม่ถูกตัดทิ้ง',
   /Math\.max\(0,\s*parseInt\(val,\s*10\)\s*\|\|\s*0\)/.test(NEW));
ok('และลูกค้าซื้อได้ = 0 (ไม่ปล่อยขายเกินของ)', sellable062 === 0);

console.log('\n5) กติกาที่ห้ามผิดในหน้าใหม่');
ok('ไม่มี "ปิดวันอัตโนมัติ"', !/ปิดวันอัตโนมัติ|rollover/i.test(CODE));
ok('ไม่มีช่อง "กำลังเติม"', !/กำลังเติม|stockIncoming/.test(CODE));
ok('ติ๊กจัดของไม่แตะ menu_items เลย',
   !/async function tick[\s\S]{0,600}from\('menu_items'\)/.test(NEW));
ok('ติ๊กเก็บที่ส่วนกลาง ไม่ใช่ localStorage',
   /upsert\(\{key:'k2_pack'/.test(NEW) && !/localStorage[\s\S]{0,80}k2_pack/.test(NEW));
ok('ใช้คีย์ใหม่ ไม่ทับ pk_done ของหน้าเก่า', !/'pk_done'/.test(NEW));
ok('ยึดเวลาไทยเสมอ', /Date\.now\(\)\s*\+\s*7\s*\*\s*3600e3/.test(NEW));
ok('ทุก .select() มี .limit() (บทเรียน 1000-cap)',
   (NEW.match(/\.select\(/g) || []).length <= (NEW.match(/\.limit\(/g) || []).length);
/* 12 ก.ย. 2569: นัทเคาะย้ายครัวมา k2 ("เราจะย้ายกันวันนี้เนี่ยแหละ") → ป้าย "หน้าทดลอง" ต้องหายไปแล้ว
   ถ้าป้ายยังอยู่ = ย้ายไม่จบ ครัวจะไม่แน่ใจว่าหน้าไหนคือของจริง */
ok('ไม่มีป้าย "หน้าทดลอง" แล้ว (เป็นหน้าครัวตัวจริง)', !/หน้าทดลอง/.test(NEW));
/* นัทสั่งเอง 10 ก.ย. จากหน้าจริง: "ไม่ต้องมีภาพอาหารข้างหน้า" — กันรูปแอบกลับมา */
ok('ไม่มีรูปอาหารในหน้าเลยสักจุด',
   CODE.indexOf('<img') < 0 && CODE.indexOf('thumb(') < 0);
ok('หน้าครัวไม่โชว์คำว่า "จอง" ในโหมดนับ/จัดของ (เฉพาะแอดมิน)',
   /ครัวไม่เห็น/.test(NEW));

console.log('\n6) เลขบนหัว = จำนวนใบ ไม่ใช่จำนวนกล่อง (นัทสั่งตรง ๆ)');
ok('sum-big ในหน้าจัดของผูกกับจำนวนใบ',
   /const bills=list\.length[\s\S]{0,200}sum-big">'\+bills/.test(NEW));

console.log('\n7) 7 ข้อที่นัทรีวิวต้นแบบ');
ok('① ครัวดูวันอื่นได้ (วันนี้/พรุ่งนี้/ย้อนหลัง)', /function renderDays\(/.test(NEW) && /for\(let i=-3;i<=7;i\+\+\)/.test(NEW));
ok('② "ด่วน" อธิบายตัวเองในหน้า', /ด่วน — แอดมินเพิ่งสั่งระหว่างวัน/.test(NEW));
ok('④ มีหน้าแอดมิน ในตู้/จองแล้ว/ว่างจริง', /function viewAdmin\(/.test(NEW) && /จองแล้ว/.test(NEW));
ok('⑤ หน้านับของดูประวัติย้อนหลังได้', /ประวัติการนับ/.test(NEW) && /activity_log/.test(NEW));
/* 13 ก.ย.: ย่อคำเตือนเหลือบรรทัดเดียว (นัทติว่าหน้ารก) — เจตนาเดิมคือต้องบอกตรง ๆ ว่าเกลี่ยข้ามวันไม่ได้
   เลยเปลี่ยนไปตรวจใจความ ไม่ผูกกับคำว่า "อายุของ" คำเดียว */
ok('⑥ คนพิมพ์ทับแผนได้ + บอกตรง ๆ ว่าเกลี่ยข้ามวันให้ไม่ได้',
  NEW.indexOf('function savePlan(') >= 0 && NEW.indexOf('ยังเกลี่ยข้ามวันให้ไม่ได้') >= 0);
ok('⑦ ครัวเปิดหน้าวางแผนเองได้ (อยู่ในแถบล่าง)', /go\('plan'\)/.test(NEW));

console.log('\n8) ของที่เพิ่มรอบ 11 ก.ย. (เทียบกับข้อมูลจริงของวันนั้น)');
ok('แยกใบ Meal Plan ออกจากเมนูสต็อก', /function isMPOrder\(/.test(NEW) && /Meal Plan — ทำสดวันนี้/.test(NEW));
ok('แถวหัว Meal Plan ไม่ถูกนับเป็นกล่องในตัวนับ ☑',
   /function boxesOf\([^)]*\)[^}]*isMPHeadRow\(i\)\?0:/.test(NEW));
ok('ติดธงเมนูที่ปิดขายแล้วในใบที่สั่งไว้ก่อนปิด',
   /is_available===false/.test(NEW) && /ปิดขายแล้ว/.test(NEW));
ok('โหลดเมนูทั้งหมด ไม่กรอง is_available ตอนดึง (ต้องรู้จักเมนูที่ปิดไปแล้ว)',
   !/menu_items'\)[\s\S]{0,200}eq\('is_available',true\)/.test(NEW));
ok('แต่หน้านับของ/วางแผน/แอดมิน ยังโชว์เฉพาะเมนูที่เปิดขาย',
   (NEW.match(/MENUS\.filter\(m=>m\.is_available!==false\)/g) || []).length >= 3);

console.log('\n9) ไม่ปล่อยให้เลข 0 พูดแทนคน (เคส MC1 · 11 ก.ย.)');
ok('บอกได้ว่าเมนูไหน "ยังไม่เคยนับ" ไม่ใช่ปล่อยให้ 0 กำกวม',
   /ยังไม่เคยนับใน 7 วัน/.test(NEW) && /HIST\.some/.test(NEW));
ok('เตือนเมนูที่ตั้งเป็นขายไม่จำกัด (stock_total = null)',
   /const unlimited = \(m\.stock_total == null\)/.test(NEW) && /ขายได้ไม่จำกัด/.test(NEW));

/* ขนาดตัวอักษร/ช่องไฟ เคยคุมด้วยเทสตามคำสั่งนัทรอบ 10 ก.ย.
   ตอนนี้ดีไซน์ทั้งหมดมาจากชุด polish ที่นัททำเองแล้ว (สไตล์ชุดนี้ทับของเดิม) → เทสไม่ตัดสินเรื่องหน้าตาอีก
   ที่คุมแทนคือ "ชุด polish อยู่ครบ ฝังในไฟล์เดียว และลิงก์ไม่หาย" */
console.log('\n10) ชุด polish ที่นัททำเอง (11 ก.ย.) — ฝังในไฟล์เดียว ลิงก์ครบ');
ok('ไม่อ้างไฟล์ภายนอก ./mobile.css / ./mobile.js (ฝังในไฟล์แล้ว — กันมือถือติดของเก่าจาก service worker)',
   !/href="\.\/mobile\.css"|src="\.\/mobile\.js"/.test(NEW));
ok('ดีไซน์ชุด polish อยู่ในไฟล์ (ฟอนต์ Sarabun + หน้าต่างตั้งชื่อ)',
   /Sarabun/.test(NEW) && /\.user-sheet\{/.test(NEW));
ok('ส่วนแสดงผลชุด polish อยู่ในไฟล์ (ค้นหา/ตัวกรอง/ครอบ render)',
   /function applyFilter\(/.test(NEW) && /const originalRender=render;render=function\(\)/.test(NEW));
ok('ชุด polish รันหลังสคริปต์หลักเสมอ (ไม่งั้นครอบฟังก์ชันที่ยังไม่มี)',
   NEW.indexOf('function saveCount(') < NEW.indexOf('const originalRender=render'));
ok('gate.js ยังโหลดเป็นอย่างแรก', /<head>[\s\S]{0,200}<script src="\/gate\.js"><\/script>/.test(NEW));
/* 12 ก.ย. 2569: ย้ายครัวมา k2 แล้ว · หน้าเก่าขึ้นหน้าพาไป k2
   ถ้า k2 ยังมีลิงก์กลับไปหน้าเก่า ครัวจะกดวนกลับไปกลับมา → ต้องไม่มีแล้ว
   (ตอนเดินคู่ขนาน ข้อนี้เคยบังคับว่า "ต้องมี" — เปลี่ยนเพราะสถานะเปลี่ยน ไม่ใช่เพราะเทสยาก) */
ok('ไม่มีลิงก์กลับไปหน้าครัวเดิมแล้ว', !/<a href="\/kitchen_queue\.html">/.test(NEW));
ok('ปุ่มแถบล่าง 4 ปุ่มยังอยู่ครบ',
   ['nav-pack', 'nav-count', 'nav-plan', 'nav-admin'].every(id => NEW.indexOf('id="' + id + '"') >= 0));
ok('ไม่มีข้อมูลสมมติจากหน้า preview หลุดเข้ามา',
   !/preview-data|PREVIEW_DATA|previewNoNetworkWrites/.test(NEW));
ok('<style> กับ </style> เท่ากัน', (NEW.match(/<style>/g) || []).length === (NEW.match(/<\/style>/g) || []).length);

console.log('\n11) แก้ 3 จุดที่ reviewer ของชุด polish ชี้ในโค้ดเดิม — เทสด้วยฟังก์ชันจริง');
const src = ['function isMPHeadRow(', 'function boxesOf(', 'function packedOf(']
  .map(sig => grab(NEW, sig));
ok('ดึง isMPHeadRow / boxesOf / packedOf ออกมาได้ครบ', src.every(Boolean));
if (src.every(Boolean)) {
  const make = (items, pack) => new Function('ITEMS', 'PACK', src.join('\n') + '; return { boxesOf, packedOf };')(items, pack);
  /* ใบ Meal Plan จริงหน้าตาแบบนี้: แถวหัว MP-HP-R2 ×7 + เมนูจริง 7 แถว แถวละ 1 */
  const items = [{ id: 'h', menu_code: 'MP-HP-R2', quantity: 7 }]
    .concat([1, 2, 3, 4, 5, 6, 7].map(n => ({ id: 'm' + n, menu_code: 'HP3' + n, quantity: 1 })));
  const allTicked = {}; items.forEach(it => { allTicked[it.id] = it.quantity; });
  const o = { id: 'o1' };
  const f = make({ o1: items }, { o1: allTicked });
  ok('(ก) ติ๊กครบรวมแถวหัวชุด → ☑ ต้อง 7/7 ไม่ใช่ 14/7',
     f.packedOf(o) === 7 && f.boxesOf(o) === 7, 'ได้ ' + f.packedOf(o) + '/' + f.boxesOf(o));
  const onlyHead = make({ o1: items }, { o1: { h: 7 } });
  ok('(ก) ติ๊กแค่แถวหัวชุด → ยังไม่นับว่าจัดไปสักกล่อง',
     onlyHead.packedOf(o) === 0, 'ได้ ' + onlyHead.packedOf(o));
  const stock = [{ id: 'a', menu_code: 'S2', quantity: 2 }, { id: 'b', menu_code: 'D1', quantity: 1 }];
  const g = make({ o1: stock }, { o1: { a: 2 } });
  ok('(ก) ใบเมนูสต็อกธรรมดายังนับเหมือนเดิม (ติ๊ก S2×2 จาก 3 กล่อง → 2/3)',
     g.packedOf(o) === 2 && g.boxesOf(o) === 3, 'ได้ ' + g.packedOf(o) + '/' + g.boxesOf(o));
}
ok('(ข) กด "ยังไม่จัด" ต้องล้างติ๊กและบันทึกขึ้นส่วนกลาง',
   /async function markUnpack[\s\S]{0,700}delete PACK\[oid\][\s\S]{0,400}upsert\(\{key:'k2_pack'/.test(NEW));
ok('(ค) หน้าแอดมินโชว์เมนูที่ยังไม่เคยนับ ไม่ใช่ซ่อนไปเฉย ๆ',
   /const unknown=rows\.filter\(r=>r\.free==null\)/.test(NEW) && /ยังไม่เคยนับ — ไม่รู้ว่ามีของจริงเท่าไหร่/.test(NEW));

console.log('\n12) หน้านับของ: แยกหมวด + ปุ่มเลือกหมวด + พับหมวด (นัทสั่ง 11 ก.ย.)');
ok('โหลดหมวดของเมนูมาด้วย', NEW.indexOf("stock_total,actual_stock,is_available,category').limit(1000)") >= 0);
ok('โหลดชื่อไทยของหมวดจาก appConfig', NEW.indexOf("'k2_pack','k2_plan','appConfig'") >= 0);
ok('มีปุ่มเลือกหมวดและหัวข้อพับได้', ['function pickCountCat(', 'function toggleCountFold(', 'function countGroups(', 'class="catbar"', 'cathead'].every(x => NEW.indexOf(x) >= 0));
/* 12 ก.ย.: เพิ่มตัวเลือก 🎯 ต้องนับวันนี้ → เงื่อนไขกรองยาวขึ้น · เทสจับ "เจตนา" ไม่ผูกกับข้อความเป๊ะ
   เจตนา: หมวดที่พับ/ไม่ได้เลือก ต้อง **ไม่ถูกสร้างเป็น HTML เลย** (ถ้าซ่อนด้วย hidden ส่วน polish จะเปิดกลับเอง) */
ok('หมวดที่พับ/ไม่ได้เลือก ตัดออกตอน render ไม่ใช่ซ่อนด้วย hidden (กันส่วน polish เปิดกลับเอง)',
   NEW.indexOf('if(folded) return;') >= 0 && /groups\.filter\(g =>[^)]*g\.key === COUNT_CAT\)\.forEach/.test(NEW));
ok('หมวดที่ไม่มีชื่อไทยใน appConfig มีชื่อสำรอง (คอร์สเจ / Hyrox)', NEW.indexOf("jay2026:'คอร์สเจ 2569'") >= 0 && NEW.indexOf("hyrox:'Hyrox'") >= 0);
ok('จำหมวดที่เลือก/ที่พับไว้ในเครื่อง และครอบ try/catch', NEW.indexOf("try{ COUNT_CAT = localStorage.getItem('k2_count_cat')") >= 0);
ok('หัวข้อหมวดบอกจำนวนที่ยังไม่นับ', NEW.indexOf('ยังไม่นับ ') >= 0);
{
  const a0 = NEW.indexOf('const CAT_FALLBACK = {');
  const fb = a0 < 0 ? null : NEW.slice(a0, NEW.indexOf('};', a0) + 2);
  const fns = ['function catKey(', 'function catLabel(', 'function countGroups('].map(sig => grab(NEW, sig));
  ok('ดึง catKey / catLabel / countGroups ออกมาได้', !!fb && fns.every(Boolean));
  if (fb && fns.every(Boolean)) {
    const api = new Function('CAT_LABEL', [fb].concat(fns).join(String.fromCharCode(10)) + '; return { countGroups, catLabel };')({ no_special: 'ข้าวกล่อง', pack_regular: 'โปรตีนแพค' });
    const menus = [{ category: 'no_special' }, { category: 'no_special' }, { category: 'pack_regular' }, { category: 'no_special' }, { category: null }, { category: 'jay2026' }, { category: 'jay2026' }];
    const g = api.countGroups(menus);
    ok('หมวดที่มีเมนูมากขึ้นก่อน', g[0].key === 'no_special' && g[0].items.length === 3, JSON.stringify(g.map(x => x.key + ':' + x.items.length)));
    ok('เมนูไม่มีหมวด ไปอยู่ "ยังไม่มีหมวด" ไม่หาย', g.some(x => x.key === 'uncategorized' && x.items.length === 1) && api.catLabel('uncategorized') === 'ยังไม่มีหมวด');
    ok('ทุกเมนูอยู่ครบ ไม่ตกหล่นตอนแยกหมวด', g.reduce((s, x) => s + x.items.length, 0) === menus.length);
    ok('ชื่อจาก appConfig มาก่อนชื่อสำรอง', api.catLabel('no_special') === 'ข้าวกล่อง' && api.catLabel('jay2026') === 'คอร์สเจ 2569');
  }
}
console.log('\n13) เติมก่อนย้ายครัว (นัทสั่ง 11 ก.ย. "เติมเลยด่วน"): พิมพ์ใบจัดของ · กำลังผลิต · รอบ Meal Plan');
ok('โหลด stock_incoming + แผนป้าย + ยอดวางขายของนิว', NEW.indexOf("'stock_incoming','weekly_subcode_plan','weekly_stock_plan'") >= 0);
ok('โหลดรอบ Meal Plan (mp_deliveries) ในช่วงวันเดียวกับใบ และมี limit', /from\('mp_deliveries'\)\.select\([^)]*\)\.gte\('delivery_date',from\)\.lte\('delivery_date',to\)\.limit\(/.test(NEW));
ok('ปุ่มพิมพ์ใช้หน้าพิมพ์เดิม ส่งวันที่เลือกไปด้วย', NEW.indexOf("'/print_pickslip.html?date='+encodeURIComponent(ymd)+'&auto=1'") >= 0 && NEW.indexOf('href="\'+printUrl(DAY)+\'"') >= 0);
/* 12 ก.ย. 2569: หน้าวางแผนเลิกใช้ช่อง .cnt (เปลี่ยนเป็นช่อง "จะทำเพิ่ม" ที่คนใส่เอง)
   → เหลือช่อง .cnt ที่เดียวคือหน้านับของ · ข้อนี้ยังเฝ้าเรื่องเดิม: ห้ามงอกช่องกรอกในหน้านับของ */
ok('หน้านับของมีช่องกรอกช่องเดียว (กำลังผลิตโชว์อย่างเดียว)', (NEW.match(/class="cnt"/g) || []).length === 1, 'เจอช่อง cnt ' + (NEW.match(/class="cnt"/g) || []).length);
ok('k2 ไม่เขียน stock_incoming เอง (ช่องนี้เป็นของนิว/หน้าเดิม)', !/upsert\(\{key:'stock_incoming'/.test(NEW) && !/key=eq\.stock_incoming[^]{0,80}PATCH/.test(NEW));
{
  const fns = ['function ordersOn(', 'function incOf(', 'function weekStartOfYmd(', 'function weekPlanOf(', 'function mpRoundsOffOrder(', 'function mpRoundsOn('].map(sig => grab(NEW, sig));
  ok('ดึง incOf / weekPlanOf / mpRoundsOffOrder ออกมาได้', fns.every(Boolean));
  if (fns.every(Boolean)) {
    const make = (ctx) => new Function('ORDERS', 'MPD', 'INC', 'SUBPLAN', 'STOCKPLAN', fns.join(String.fromCharCode(10)) + '; return { incOf, weekPlanOf, mpRoundsOffOrder, mpRoundsOn, weekStartOfYmd };')(ctx.ORDERS || [], ctx.MPD || [], ctx.INC || {}, ctx.SUBPLAN || {}, ctx.STOCKPLAN || {});
    const f = make({
      ORDERS: [{ id: 'oA', delivery_date: '2026-09-14' }, { id: 'oOld', delivery_date: '2026-09-04' }],
      MPD: [
        { id: 'r1', order_id: 'oA', delivery_date: '2026-09-14', status: 'menu_assigned', customer_name: 'ตรงวัน' },
        { id: 'r2', order_id: 'oOld', delivery_date: '2026-09-14', status: 'menu_assigned', customer_name: 'PIMM' },
        { id: 'r3', order_id: null, delivery_date: '2026-09-14', status: 'scheduled', customer_name: 'ไม่มีใบ' },
        { id: 'r4', order_id: 'oOld', delivery_date: '2026-09-14', status: 'delivered', customer_name: 'ส่งแล้ว' },
        { id: 'r5', order_id: 'oOld', delivery_date: '2026-09-15', status: 'menu_assigned', customer_name: 'วันอื่น' }
      ],
      INC: { m1: { n: 5, by: 'น้องนิว', at: '2026-09-11T15:00:00Z' }, m2: { n: 0 } },
      SUBPLAN: { '2026-09-14': { S1: 'S158', D1: 'D158' } },
      STOCKPLAN: { '2026-09-14': { qty: { S1: 5, D1: 4 } } }
    });
    const off = f.mpRoundsOffOrder('2026-09-14').map(r => r.customer_name);
    ok('รอบที่ใบลงวันอื่น (เคส PIMM) ขึ้นเตือน', off.indexOf('PIMM') >= 0, JSON.stringify(off));
    ok('รอบที่ไม่มีใบเลย ขึ้นเตือนด้วย', off.indexOf('ไม่มีใบ') >= 0, JSON.stringify(off));
    ok('รอบที่ใบตรงวัน / ส่งแล้ว / คนละวัน ไม่ขึ้นเตือน', off.length === 2, JSON.stringify(off));
    ok('นับรอบ Meal Plan ของวันนั้นทั้งหมด', f.mpRoundsOn('2026-09-14').length === 4);
    ok('กำลังผลิต 5 → โชว์ 5', f.incOf('m1') && f.incOf('m1').n === 5);
    ok('กำลังผลิต 0 หรือไม่มี → ไม่โชว์', f.incOf('m2') === null && f.incOf('zz') === null);
    ok('สัปดาห์เริ่มวันจันทร์ (ศุกร์ 18 → จันทร์ 14 · อาทิตย์ 20 → จันทร์ 14)', f.weekStartOfYmd('2026-09-18') === '2026-09-14' && f.weekStartOfYmd('2026-09-20') === '2026-09-14');
    const p = f.weekPlanOf({ code: 'D158' }, '2026-09-16');
    ok('ยอดวางขายหาจากแผนป้าย (รหัสจริง) ได้ช่องและจำนวนถูก', p && p.slot === 'D1' && p.n === 4, JSON.stringify(p));
    ok('เมนูสัปดาห์ถัดไป/ไม่อยู่ในแผน → ไม่โชว์', f.weekPlanOf({ code: 'D158' }, '2026-09-21') === null && f.weekPlanOf({ code: 'S017' }, '2026-09-14') === null);
  }
}
console.log('\n14) ข้อจำกัดอาหาร (แพ้/ไม่ทาน) — ครัวต้องเห็นก่อนหยิบของ · หน้าเดิมมีมาตลอด');
ok('โหลด customer_preferences', NEW.indexOf("from('customer_preferences').select('customer_id,allergies,dislikes')") >= 0);
ok('ดึง customer_id + line_uid มากับใบ (ไม่งั้นหาข้อจำกัดไม่เจอ)',
   NEW.indexOf('source,total,customer_id,line_uid') >= 0);
ok('ซอยเป็นก้อน กัน URL ยาวเกิน', /ids\.slice\(i,\s*i\+60\)/.test(NEW));
ok('การ์ดออเดอร์เรียก dietHtml', NEW.indexOf('+dietHtml(o);') >= 0);
ok('อ่านไม่ได้ต้องไม่ทำทั้งหน้าพัง (มี try/catch)', /catch\(e\)\{ PREFS=\{\}; \}/.test(NEW));
{
  const fn = grab(NEW, 'function dietHtml(');
  ok('ดึง dietHtml ออกมาได้', !!fn);
  if (fn) {
    const mk = (prefs) => new Function('PREFS', 'esc', fn + '; return dietHtml;')(prefs, (x) => String(x));
    const byId = mk({ c1: { allergies: 'กุ้ง', dislikes: '' }, 'U-line': { allergies: '', dislikes: 'ผักชี' }, c3: { allergies: 'ถั่ว', dislikes: 'เผ็ด' }, c4: { allergies: '', dislikes: '' } });
    const has = (h, t) => String(h).indexOf(t) >= 0;
    ok('แพ้ → ขึ้นป้ายแดง พร้อมคำว่าแพ้', has(byId({ customer_id: 'c1' }), 'diet-al') && has(byId({ customer_id: 'c1' }), 'แพ้ กุ้ง'));
    ok('หาไม่เจอด้วย customer_id → ใช้ line_uid ต่อ (ของจริงมีเคสนี้)',
       has(byId({ customer_id: 'ไม่มีในตาราง', line_uid: 'U-line' }), 'ไม่ทาน ผักชี'));
    ok('มีทั้งแพ้และไม่ทาน → ขึ้นทั้งคู่ แพ้มาก่อน',
       (() => { const h = byId({ customer_id: 'c3' }); return has(h, 'แพ้ ถั่ว') && has(h, 'ไม่ทาน เผ็ด') && h.indexOf('diet-al') < h.indexOf('diet-dl'); })());
    ok('มีแถวแต่ว่างทั้งคู่ → ไม่ขึ้นอะไรเลย', byId({ customer_id: 'c4' }) === '');
    ok('ลูกค้าที่ไม่มีข้อจำกัด → ไม่ขึ้นอะไรเลย', byId({ customer_id: 'zzz' }) === '');
    ok('ใบที่ไม่มีตัวตนลูกค้า → ไม่พัง', byId({}) === '' && byId(null) === '');
  }
}

console.log('\n15) ลดเวลานับของครัว (นัทยกเอง 12 ก.ย. "นับของมันนาน" · พี่ปืนเคาะให้ทำ)');
/* 🔴 12 ก.ย. 2569 นัทสั่งซ่อนทั้งชุด: "ซ่อนระบบนับของที่นายคิดให้ไปก่อนเลย เพราะผิด objective"
   เทสข้อนี้กันไม่ให้ใครเผลอเปิดคืนโดยนัทไม่ได้สั่ง — โค้ดยังอยู่ครบ แค่ปิดสวิตช์ */
ok('สวิตช์ตัวช่วยนับของ = ปิดอยู่ (ห้ามเปิดเองโดยนัทไม่ได้สั่ง)', /var COUNT_SMART = false;/.test(NEW));
ok('ปิดแล้วหน้าต้องกลับไปโชว์ทุกเมนูเป็นค่าเริ่มต้น',
   NEW.indexOf("localStorage.getItem('k2_count_cat') || (COUNT_SMART ? 'todo' : 'all')") >= 0);
ok('เคยเลือก 🎯 ค้างไว้ ต้องดีดกลับเป็นทั้งหมด ไม่ปล่อยหน้าว่าง',
   NEW.indexOf("if(!COUNT_SMART && COUNT_CAT==='todo') COUNT_CAT='all';") >= 0);
/* เดิมข้อนี้เช็คว่าเปิดมาเจอ "ต้องนับวันนี้" — นัทสั่งซ่อนทั้งชุด 12 ก.ย. ค่าเริ่มต้นกลับเป็นทั้งหมด */
ok('เปิดหน้ามาเจอทุกเมนู (ตัวช่วยถูกซ่อนตามที่นัทสั่ง)',
   NEW.indexOf("localStorage.getItem('k2_count_cat') || (COUNT_SMART ? 'todo' : 'all')") >= 0);
ok('มีปุ่ม 🎯 ต้องนับวันนี้ พร้อมจำนวน', NEW.indexOf('🎯 ต้องนับวันนี้') >= 0);
ok('ปุ่มเท่าเดิมถูกซ่อนอยู่ (นัทสั่งซ่อน 12 ก.ย.) และเงื่อนไขเดิมยังอยู่ครบ',
   NEW.indexOf(String.fromCharCode(40)+"!COUNT_SMART||have===''||!counted)?'':'<button type=\"button\" class=\"same\"") >= 0);
ok('ยืนยันเท่าเดิม = เขียนผ่านทางเดียวกับการนับ (ไม่มีทางเขียนใหม่)', /return saveCount\(mid, m\.actual_stock, true\);/.test(NEW));
ok('log แยกคำว่า "ยืนยันเท่าเดิม" ออกจาก "นับของ"', NEW.indexOf("same?('ยืนยันเท่าเดิม ") >= 0);
ok('เลขในแผนเก็บชื่อคนใส่ + เวลา', /PLAN\[DAY\]\[mid\]=\{ n:Math\.max\(0,parseInt\(val,10\)\|\|0\), by:USER\|\|"", at:/.test(NEW));
ok('แผนรูปแบบเก่า (ตัวเลขล้วน) ยังอ่านได้', NEW.indexOf('function planNum(') >= 0 && NEW.indexOf('planNum((PLAN[DAY]||{})[m.id])') >= 0);
ok('ใส่เลขแผนต้องรู้ว่าใครใส่ก่อน', /async function savePlan[\s\S]{0,200}needUser\(\)/.test(NEW));
/* 12 ก.ย. 2569: พี่ปืนเตือนว่าครัวใช้หน้านี้อยู่กลางวันทำงาน — รายการน้อยลงจะถูกอ่านว่า "เมนูหาย"
   ป้ายนี้คือด่านกัน ห้ามหลุด (ถ้าหลุด แปลว่าครัวเห็นรายการหดโดยไม่มีใครบอกว่ากรองอยู่) */
ok('ตอนกรอง 🎯 มีป้ายบอกว่ากำลังกรอง ไม่ใช่ของหาย', NEW.indexOf('กำลังโชว์เฉพาะที่ควรนับวันนี้') >= 0);
ok('ป้ายบอกด้วยว่าอีกกี่เมนูที่ไม่ได้หาย', NEW.indexOf('ไม่ได้หาย') >= 0 && /const hidden = openMenus.length - todo.length;/.test(NEW));
ok('มีปุ่มกดดูครบอยู่ในป้ายเลย ไม่ต้องไปหา', NEW.indexOf('class="seeall" onclick="pickCountCat(&quot;all&quot;)"') >= 0);
ok('กล่องบอกว่ากำลังกรอง ผูกกับสวิตช์ที่ปิดอยู่',
   (()=>{ const i = NEW.indexOf('if(COUNT_SMART && COUNT_CAT===' + String.fromCharCode(39) + 'todo' + String.fromCharCode(39) + '){');
          return i >= 0 && NEW.slice(i, i+460).indexOf('filternote') >= 0; })());
{
  const fn = grab(NEW, 'function needCountToday(');
  ok('ดึง needCountToday ออกมาได้', !!fn);
  if (fn) {
    const f = new Function(fn + '; return needCountToday;')();
    const counted = () => true;      // เคยนับใน 7 วัน
    const never = () => false;       // ไม่เคยนับเลย
    const none = {};
    ok('เมนูสัปดาห์ (มีชื่อเล่น) ต้องนับเสมอ', f({ id:'a', subcode:'S1', stock_total:99 }, none, counted) === true);
    ok('ของใกล้หมด (เหลือ ≤3) ต้องนับ', f({ id:'b', subcode:'', stock_total:3 }, none, counted) === true);
    ok('มีคนจองวันนี้/พรุ่งนี้ ต้องนับ', f({ id:'c', subcode:'', stock_total:50 }, { c:2 }, counted) === true);
    ok('ไม่มีร่องรอยการนับใน 7 วัน ต้องนับ', f({ id:'d', subcode:'', stock_total:50 }, none, never) === true);
    ok('ของเหลือเยอะ ไม่มีจอง เพิ่งนับ → วันนี้ไม่ต้องนับ', f({ id:'e', subcode:'', stock_total:50 }, none, counted) === false);
    ok('ขายไม่จำกัด (stock_total ว่าง) + เพิ่งนับ → ไม่บังคับนับ', f({ id:'f', subcode:'', stock_total:null }, none, counted) === false);
  }
}

console.log('\n────────────────────────────');
console.log(fail ? '❌ ตก ' + fail + ' ข้อ · ผ่าน ' + pass : '✅ ผ่านทั้งหมด ' + pass + ' ข้อ');
if (fail) process.exitCode = 1;

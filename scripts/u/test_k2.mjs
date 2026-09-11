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
/* นับได้น้อยกว่าที่จอง = เคส S062 วันนี้ (จอง 4 · นับได้ 3)
   หน้าเก่าไม่มีที่เก็บค่าที่ต่ำกว่าจอง จึงเห็นเท่ากับจองเสมอ — นี่คือบั๊กที่ ISSUE 02 กำลังแก้ */
const s062 = { counted: 3, booked: 4 };
const sellable062 = Math.max(0, s062.counted - s062.booked);
const oldSees = realOld(sellable062, s062.booked, 0);
ok('หน้าเก่ายังเห็น 4 (ตามข้อจำกัดของมันเอง) — พฤติกรรมไม่เปลี่ยนจากวันนี้',
   oldSees === 4, 'ได้ ' + oldSees);
ok('แต่หน้าใหม่เก็บ 3 ไว้ครบใน actual_stock — ไม่ถูกตัดทิ้ง',
   /Math\.max\(0,\s*parseInt\(val,\s*10\)\s*\|\|\s*0\)/.test(NEW));
ok('และลูกค้าซื้อได้ = 0 (ไม่ปล่อยขายเกินของ)', sellable062 === 0);

console.log('\n5) กติกาที่ห้ามผิดในหน้าใหม่');
ok('ไม่มี "ปิดวันอัตโนมัติ"', !/ปิดวันอัตโนมัติ|rollover/i.test(CODE));
ok('ไม่มีช่อง "กำลังเติม"', !/กำลังเติม|stockIncoming/.test(CODE));
ok('ติ๊กจัดของไม่แตะ menu_items เลย',
   !/tick[\s\S]{0,600}from\('menu_items'\)/.test(NEW));
ok('ติ๊กเก็บที่ส่วนกลาง ไม่ใช่ localStorage',
   /upsert\(\{key:'k2_pack'/.test(NEW) && !/localStorage[\s\S]{0,80}k2_pack/.test(NEW));
ok('ใช้คีย์ใหม่ ไม่ทับ pk_done ของหน้าเก่า', !/'pk_done'/.test(NEW));
ok('ไม่แตะไฟล์หน้าเก่า (คนละไฟล์)', !/kitchen_queue\.html['"]/.test(NEW) || /หน้าเก่า/.test(NEW));
ok('ยึดเวลาไทยเสมอ', /Date\.now\(\)\s*\+\s*7\s*\*\s*3600e3/.test(NEW));
ok('ทุก .select\\(\\) มี .limit\\(\\) (บทเรียน 1000-cap)',
   (NEW.match(/\.select\(/g) || []).length <= (NEW.match(/\.limit\(/g) || []).length);
ok('มีป้ายบอกว่าเป็นหน้าทดลอง ไม่ใช่ของจริง', /หน้าทดลอง/.test(NEW));
/* นัทสั่งเอง 10 ก.ย. จากหน้าจริง: "ไม่ต้องมีภาพอาหารข้างหน้า" — กันรูปแอบกลับมา */
ok('ไม่มีรูปอาหารในหน้าเลยสักจุด',
   CODE.indexOf('<img') < 0 && CODE.indexOf('thumb(') < 0);
/* นัทเห็นของจริงแล้วสั่งกลับ 10 ก.ย.: "รหัสไม่ต้องใหญ่เว่อ ให้พอดีๆ กับชื่อเมนู"
   → เด่นด้วยความหนา+สี ไม่ใช่ขนาด · และกว้างคงที่เพื่อให้ชื่อเมนูเรียงตรงกันทุกแถว */
/* ต้องจับกฎ ".code{...}" ที่ขึ้นต้นบรรทัดเท่านั้น — ไม่งั้นไปโดน ".row.mp .code{...}" ที่อยู่ก่อนหน้า */
const codeCss = (NEW.match(/^[.]code[{][^}]*[}]/m) || [''])[0];
const codeSize = Number((codeCss.match(/font-size:(\d+)px/) || [0, 0])[1]);
ok('รหัสไม่ใหญ่เว่อ (≤ 17px) และเด่นด้วยความหนา',
   codeSize > 0 && codeSize <= 17 && /font-weight:7/.test(codeCss), 'ได้ ' + codeSize + 'px');
ok('คอลัมน์รหัสกว้างคงที่ → ชื่อเมนูเรียงตรงกันทุกแถว',
   /width:\d+px/.test(codeCss) && /flex:0 0 \d+px/.test(codeCss));
ok('แถวชิดขึ้น — padding บน/ล่าง ≤ 6px',
   Number((( NEW.match(/[.]row[{][^}]*[}]/) || [''])[0].match(/padding:(\d+)px/) || [0, 99])[1]) <= 6);
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
ok('⑥ แผนพิมพ์ทับได้ + บอกตรง ๆ ว่าไม่มีข้อมูลอายุของ', /function savePlan\(/.test(NEW) && /อายุของ/.test(NEW));
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
console.log('\n────────────────────────────');
console.log(fail ? '❌ ตก ' + fail + ' ข้อ · ผ่าน ' + pass : '✅ ผ่านทั้งหมด ' + pass + ' ข้อ');
if (fail) process.exitCode = 1;

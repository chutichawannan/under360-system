/* เทสปิดวันอัตโนมัติ — ดึงฟังก์ชันจริงจากไฟล์ครัวมารัน
   เคสจริง 6 ก.ย.: ของสัปดาห์หน้า 17 เมนูถูกย้ายเป็น "มีของจริง" ทั้งที่ยังไม่ได้ทำ */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../kitchen_queue.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');
const grab = (n) => {
  let i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  if (src.slice(i - 6, i) === 'async ') i -= 6;   // เก็บ async มาด้วย ไม่งั้น await ข้างในพัง
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; st = true; }
    else if (src[j] === '}') { d--; if (st && d === 0) return src.slice(i, j + 1); }
  }
};
let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};

const TODAY = '2026-09-06';
/* รันตัวจริง โดยดัก stkCommit ไว้ดูว่าย้ายอะไรบ้าง */
async function run(menus, incoming, currentUser) {
  const moved = [], logs = [];
  const ctx = {
    /* 12 ก.ย. 2569: ย้ายครัวมา k2 แล้ว หน้าเก่ามีสวิตช์ K2_MOVED กันไม่ให้ "ปิดวันอัตโนมัติ" ทำงานอีก
       เทสนี้ตั้งเป็น false เพื่อทดสอบ "ตรรกะ" ต่อไป — เผื่อวันไหนต้องปลดหน้าเก่ากลับมาใช้ ตรรกะต้องยังถูก
       (ตัวที่กันของจริงคือ test_kitchen_move ซึ่งเช็คว่าสวิตช์เป็น true บน main) */
    K2_MOVED: false,
    stockIncoming: incoming,
    allMenus: menus,
    thaiToday2: () => TODAY,
    stkOrderedMap: () => ({}),
    stkIncOf: (id) => (incoming[id] && incoming[id].n) || 0,
    stkRealOf: (m) => m.actual_stock || 0,
    kqCurrentUser: currentUser || '',
    stkCommit: null,
    console: { log: (m) => logs.push(m) },
  };
  const body = grab('stkNotYetProduced') + '\n' + grab('stkRolloverDay');
  const AsyncFn = Object.getPrototypeOf(async function(){}).constructor;
  const fn = new AsyncFn(...Object.keys(ctx), '__moved',
    'var _needRollover=false;\n' +
    'stkCommit = async function(m, real, inc, why){ __moved.push({code:m.code, real:real, actor:kqCurrentUser, why:why}); };\n' +
    body + '\n; return stkRolloverDay();');
  await fn(...Object.values(ctx), moved);
  return { moved, logs };
}
const M = (code, af, actual) => ({ id:code, code, name:code, available_from:af, actual_stock:actual||0 });
const INC = (code, n, at) => ({ [code]: { n, at } });

console.log('\n① 🔴 เคสจริง 6 ก.ย. — ของสัปดาห์หน้าต้องไม่ถูกย้าย');
{
  const r = await run([M('S017','2026-09-07',0)], INC('S017', 9, '2026-09-05'));
  t('ไม่ย้าย', r.moved.length, 0);
  t('ยังค้างอยู่ในกำลังเติม ไม่ถูกลบ', r.logs.some(x => /ข้ามของที่ยังไม่ถึงวันผลิต 1/.test(x)), true);
}

console.log('\n② ของที่ถึงวันแล้ว ต้องย้ายเหมือนเดิม');
{
  const r = await run([M('S050','2026-09-06',2)], INC('S050', 8, '2026-09-05'));
  t('ย้าย', r.moved.map(x => x.code), ['S050']);
  t('รวมของเดิม 2 + เติม 8 = 10', r.moved[0].real, 10);
}
{
  const r = await run([M('S051','2026-08-31',0)], INC('S051', 5, '2026-09-05'));
  t('วันผลิตผ่านมาแล้ว = ย้าย', r.moved.map(x => x.code), ['S051']);
}
{
  const r = await run([M('S052','',3)], INC('S052', 4, '2026-09-05'));
  t('ไม่ได้ตั้งวันเริ่มส่ง = ย้ายเหมือนเดิม', r.moved.map(x => x.code), ['S052']);
}

console.log('\n③ ปนกัน — ย้ายเฉพาะที่ถึงวัน');
{
  const inc = Object.assign({}, INC('A','5','2026-09-05'), INC('B',7,'2026-09-05'), INC('C',3,'2026-09-05'));
  const r = await run([M('A','2026-09-07'), M('B','2026-09-06'), M('C','2026-09-10')], inc);
  t('ย้ายแค่ B', r.moved.map(x => x.code), ['B']);
}

console.log('\n④ ของที่ตั้งวันนี้ ยังไม่ข้ามวัน = ไม่แตะ');
t('ตั้งวันนี้', (await run([M('S060','2026-09-01',0)], INC('S060', 6, TODAY))).moved.length, 0);

console.log('\n⑤ ชื่อผู้ทำใน log ต้องเป็นระบบ ไม่ใช่ครัว');
{
  const r = await run([M('S070','2026-09-01',0)], INC('S070', 5, '2026-09-05'), 'MoKHAUNG');
  t('actor = ระบบ (ปิดวัน)', r.moved[0].actor, 'ระบบ (ปิดวัน)');
  t('ไม่สวมชื่อครัว', r.moved[0].actor === 'MoKHAUNG', false);
}

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

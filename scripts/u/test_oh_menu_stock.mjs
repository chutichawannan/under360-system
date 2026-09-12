/* 🧪 หน้า OH แท็บเมนู — ข้อความสต็อกบนการ์ดต้องมาจากเลขจริง ไม่ใช่คอลัมน์ที่ตายแล้ว
 *
 * ที่มา: นัทถามเอง 12 ก.ย. 2569 (ผ่าน 05) — "แอดมินจะโวยวายไหม ว่าระบบขึ้นว่ามี ทำไมลูกค้าสั่งไม่ได้"
 *   เคส S079: ครัวนับได้ 3 · ลูกค้าจองหมด 3 · ซื้อได้อีก 0
 *   หน้าเดิมอ่าน stock_reserved ซึ่งไม่มีใครเขียนเลยทั้ง repo → ขึ้น "พร้อม" ตลอด
 *
 * รัน: node scripts/u/test_oh_menu_stock.mjs
 */
import fs from 'node:fs';

const OH = fs.readFileSync('operation_hub.html', 'utf8').split(String.fromCharCode(13)).join('');
const NL = String.fromCharCode(10);
let pass = 0, fail = 0;
const ok = (n, c, extra) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  🔴 ' + n + (extra ? NL + '     ได้: ' + extra : '')); } };

const grab = (sig) => {
  const i = OH.indexOf(sig);
  if (i < 0) return null;
  let d = 0;
  for (let k = OH.indexOf('{', i); k < OH.length; k++) {
    if (OH[k] === '{') d++;
    else if (OH[k] === '}') { d--; if (!d) return OH.slice(i, k + 1); }
  }
  return null;
};

console.log(NL + '1) เลิกพึ่งคอลัมน์ที่ไม่มีใครเขียน');
/* ตรวจ "การอ่านค่าจริง" — คำในคอมเมนต์ที่อธิบายว่าเลิกใช้แล้ว ไม่นับ */
ok('ไม่มีการอ่าน m.stock_reserved เหลือในหน้า OH แล้ว', OH.indexOf('m.stock_reserved') < 0);
ok('การ์ดเมนูเรียกตัวคิดข้อความตัวใหม่', OH.indexOf('var st=ohStockLabel(m);') >= 0);

console.log(NL + '2) ข้อความที่แอดมินเห็น — รันฟังก์ชันจริง');
const src = grab('function ohStockLabel(');
ok('ดึง ohStockLabel ออกมาได้', !!src);
if (src) {
  const f = new Function(src + '; return ohStockLabel;')();
  const t = (name, m, want) => {
    const got = f(m);
    ok(name, got.txt === want.txt && got.warn === want.warn, JSON.stringify(got));
  };
  /* เคสจริงที่นัทยกมา */
  t('S079 ครัวนับได้ 3 · จองหมด → บอกว่าจอง 3 ซื้อได้อีก 0 (ไม่ใช่ "พร้อม")',
    { actual_stock: 3, stock_total: 0 }, { txt: 'นับได้ 3 · จอง 3 · ซื้อได้อีก 0', warn: true });
  t('นับได้ 10 จอง 4 → ซื้อได้อีก 6 ไม่เตือน',
    { actual_stock: 10, stock_total: 6 }, { txt: 'นับได้ 10 · จอง 4 · ซื้อได้อีก 6', warn: false });
  t('ยังไม่เคยนับ (actual_stock ว่าง) แต่มีเลขขาย → บอกตรง ๆ ว่ายังไม่เคยนับ',
    { actual_stock: null, stock_total: 5 }, { txt: 'ยังไม่เคยนับ · ซื้อได้อีก 5', warn: false });
  t('ยังไม่เคยนับ + ขายไม่ได้แล้ว → เตือน',
    { actual_stock: null, stock_total: 0 }, { txt: 'ยังไม่เคยนับ · ซื้อได้อีก 0', warn: true });
  t('ขายไม่จำกัด (stock_total ว่าง) + เคยนับ',
    { actual_stock: 8, stock_total: null }, { txt: 'นับได้ 8 · ขายไม่จำกัด', warn: false });
  t('ขายไม่จำกัด + ไม่เคยนับ',
    { actual_stock: null, stock_total: null }, { txt: 'ขายไม่จำกัด', warn: false });
  /* กันเคสเพี้ยน: ครัวนับใหม่ได้น้อยกว่าที่ระบบให้ซื้อ (ไม่ควรติดลบ) */
  t('นับได้น้อยกว่าที่ขายได้ → จองต้องไม่ติดลบ',
    { actual_stock: 2, stock_total: 5 }, { txt: 'นับได้ 2 · จอง 0 · ซื้อได้อีก 5', warn: false });
  t('เลขมาเป็นข้อความ (PostgREST คืน string) ก็ยังคิดถูก',
    { actual_stock: '4', stock_total: '1' }, { txt: 'นับได้ 4 · จอง 3 · ซื้อได้อีก 1', warn: false });
}

console.log(NL + '────────────────────────────');
console.log(fail ? '🔴 ตก ' + fail + ' ข้อ · ผ่าน ' + pass : '✅ ผ่านทั้งหมด ' + pass + ' ข้อ');
process.exitCode = fail ? 1 : 0;

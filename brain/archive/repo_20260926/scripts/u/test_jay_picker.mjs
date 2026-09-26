/* เทสหน้าจองคอร์สเจ — ดึงฟังก์ชันจริงจากไฟล์ที่ deploy มารัน (ห้ามเขียน logic ใหม่มาเทส) */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8');
const grab = (name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + name);
  let d = 0, started = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; started = true; }
    else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
  }
  throw new Error('อ่าน ' + name + ' ไม่จบ');
};
const body = ['pkgFixedRaw','pkgFixedList','pkgFixedBoxes','splitSetItems','pkgFillGroup','pkgGroupEligible','pkgGroupQtySum','allGroupsFilled'].map(grab).join('\n');

let ok = 0, fail = 0;
const t = (name, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', name); }
  else { fail++; console.log('  ❌', name, '\n     ได้ ', g, '\n     ควร ', w); }
};

const JAY = 'jay-pkg-id';
const menu = [];
for (let i = 1; i <= 30; i++) menu.push({ code: 'J' + String(i).padStart(2,'0'), name: 'เมนู ' + i, category: 'jay2026' });
const GROUPS = [
  { kind:'list', count:9,  skus: menu.slice(0,9).map(m=>m.code) },
  { kind:'list', count:12, skus: menu.slice(9,21).map(m=>m.code) },
  { kind:'list', count:9,  skus: menu.slice(21,30).map(m=>m.code) },
];
const env = (over={}) => {
  const ctx = {
    pkgFixedDates: { [JAY]: [{d:'2026-10-08',n:9},{d:'2026-10-11',n:12},{d:'2026-10-15',n:9}] },
    packages: [{ id: JAY, groups: GROUPS }],
    menuItems: menu,
    currentPkg: { id: JAY, groups: GROUPS },
    pkgGroupSel: {},
    pkgStockLeft: () => ({ unlimited:true, left:999, stock:999 }),
    pkgClr: () => null,
    pkgSelTotal: () => 0,
    renderPkgSelect: () => {},
    toast: () => {},
    ...over
  };
  const fn = new Function(...Object.keys(ctx), body + '\n; return {pkgFixedList,pkgFixedBoxes,splitSetItems,pkgFillGroup,allGroupsFilled,pkgGroupSel};');
  return fn(...Object.values(ctx));
};

console.log('\n① วันส่ง + จำนวนกล่องต่อรอบ');
{
  const e = env();
  t('3 วันล็อก', e.pkgFixedList(JAY), ['2026-10-08','2026-10-11','2026-10-15']);
  t('9/12/9', e.pkgFixedBoxes(JAY), [9,12,9]);
}
{ // แอดมินแก้ groups แต่ลืมแก้ pkg_fixed_dates → ต้องยึด groups
  const G2 = [{kind:'list',count:10,skus:[]},{kind:'list',count:11,skus:[]},{kind:'list',count:9,skus:[]}];
  const e = env({ packages:[{id:JAY, groups:G2}] });
  t('groups ชนะ pkg_fixed_dates', e.pkgFixedBoxes(JAY), [10,11,9]);
}
{ // เซ็ตที่ไม่ได้แบ่งกลุ่มตามรอบ → ใช้ตัวเลขใน pkg_fixed_dates เหมือนเดิม
  const e = env({ packages:[{id:JAY, groups:[{kind:'category',count:30}]}] });
  t('ไม่มีกลุ่มตรงรอบ → ใช้ค่าเดิม', e.pkgFixedBoxes(JAY), [9,12,9]);
}

console.log('\n② ปุ่ม "เลือกทั้งชุด"');
{
  const e = env();
  e.pkgFillGroup(0); e.pkgFillGroup(1); e.pkgFillGroup(2);
  t('รอบ 1 ได้ 9', Object.keys(e.pkgGroupSel[0]).length, 9);
  t('รอบ 2 ได้ 12', Object.keys(e.pkgGroupSel[1]).length, 12);
  t('รอบ 3 ได้ 9', Object.keys(e.pkgGroupSel[2]).length, 9);
  t('เลือกครบทุกกลุ่ม', e.allGroupsFilled(), true);
  t('รอบ 2 ได้เมนูของรอบ 2', Object.keys(e.pkgGroupSel[1]).sort()[0], 'J10');
}
{ // เมนูหมด 2 ตัว → ต้องข้าม ไม่ใช่ใส่แล้วครัวไม่มีของ
  const out = new Set(['J03','J07']);
  const e = env({ pkgStockLeft: (sku) => out.has(sku) ? {unlimited:false,left:0,stock:0} : {unlimited:true,left:999,stock:999} });
  e.pkgFillGroup(0);
  t('ของหมดไม่ถูกใส่', Object.keys(e.pkgGroupSel[0]).some(c=>out.has(c)), false);
  t('ได้เท่าที่มี 7', Object.keys(e.pkgGroupSel[0]).length, 7);
  t('ยังไม่ครบ = กดยืนยันไม่ได้', e.allGroupsFilled(), false);
}

console.log('\n③ เมนูตกรอบถูกต้องตอนสร้างออเดอร์');
{
  const e = env();
  e.pkgFillGroup(0); e.pkgFillGroup(1); e.pkgFillGroup(2);
  // จำลอง addGroupedPkgToCart: ไล่ทีละกลุ่มตามลำดับ
  const items = [];
  GROUPS.forEach((g, gi) => Object.entries(e.pkgGroupSel[gi]).forEach(([sku, q]) => { for (let k=0;k<q;k++) items.push({sku}); }));
  t('รวม 30 กล่อง', items.length, 30);
  const chunks = e.splitSetItems(items, 3, e.pkgFixedBoxes(JAY));
  t('แบ่ง 9/12/9', chunks.map(c=>c.length), [9,12,9]);
  t('รอบ 1 = J01-J09', chunks[0].map(x=>x.sku), menu.slice(0,9).map(m=>m.code));
  t('รอบ 2 = J10-J21', chunks[1].map(x=>x.sku), menu.slice(9,21).map(m=>m.code));
  t('รอบ 3 = J22-J30', chunks[2].map(x=>x.sku), menu.slice(21,30).map(m=>m.code));
}
{ // เซ็ตอื่นที่ไม่ได้ล็อกกล่อง ต้องหารเท่ากันเหมือนเดิม (ห้ามพังของเก่า)
  const e = env();
  t('ไม่ล็อก = หารเท่ากัน', e.splitSetItems(Array.from({length:21},(_,i)=>i), 3, null).map(c=>c.length), [7,7,7]);
  t('เศษลงก้อนแรก', e.splitSetItems(Array.from({length:20},(_,i)=>i), 3, null).map(c=>c.length), [7,7,6]);
  t('ตัวเลขไม่ครบ = ไม่ใช้', e.splitSetItems(Array.from({length:30},(_,i)=>i), 3, [9,12,8]).map(c=>c.length), [10,10,10]);
}

console.log(`\n${fail? '❌':'✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail?1:0);

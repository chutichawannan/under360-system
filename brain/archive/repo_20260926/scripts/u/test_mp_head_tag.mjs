/* เทสป้ายคอร์สบนหัวการ์ด — ดึง classify + headTag จริงจากไฟล์มารัน
   เคสจริงที่ทำให้ต้องมีป้ายนี้: โอ๋สั่ง LC 1 ชุด + HP 1 ชุด วันเดียวกัน
   แล้วห้องกะปันอ่านรายการแล้วนึกว่าใบซ้ำ เกือบสั่งลบ */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../pwa/orders_upcoming.html', import.meta.url), 'utf8');
const grab = (n) => {
  const i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
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
const mk = (itemsBy) => new Function('itemsBy', grab('classify') + '\n' + grab('headTag') + '\n; return {classify,headTag};')(itemsBy);

/* ของจริงจาก DB วันที่ 4 ก.ย. — ใบคู่ของโอ๋ */
const LC = [
  { menu_code:'MP-LC-R7', menu_name:'Meal Plan LC · รอบ 7/12 (7 กล่อง)', quantity:1, notes:'meal_plan:lc:monthly:round:7/12' },
  { menu_code:'LC08', menu_name:'ข้าวคลุกกะปิ', quantity:1, notes:'meal_plan:box:r7/12' },
  { menu_code:'LC14', menu_name:'เกี๊ยวน้ำอกไก่และกุ้ง', quantity:1, notes:'meal_plan:box:r7/12' },
];
const HP = [
  { menu_code:'HP08', menu_name:'ข้าวคลุกกะปิ', quantity:1, notes:'meal_plan:box:r7/12' },
  { menu_code:'HP14', menu_name:'เกี๊ยวน้ำอกไก่และกุ้ง', quantity:1, notes:'meal_plan:box:r7/12' },
  { menu_code:'MP-HP-R7', menu_name:'Meal Plan HP · รอบ 7/12 (7 กล่อง)', quantity:1, notes:'meal_plan:hp:monthly:round:7/12' },
];

console.log('\n① ใบคู่ของโอ๋ 4 ก.ย. — ต้องแยกออกจากหัวการ์ด');
{
  const e = mk({ a:LC, b:HP });
  const ca = e.classify({id:'a'}), cb = e.classify({id:'b'});
  t('ใบ LC ติดป้าย LC', e.headTag(ca), '<span class="tag lc">LC</span>');
  t('ใบ HP ติดป้าย HP', e.headTag(cb), '<span class="tag hp">HP</span>');
  t('ป้ายต่างกัน = แยกออกโดยไม่ต้องแตะ', e.headTag(ca) !== e.headTag(cb), true);
  t('ทั้งคู่นับเป็น Meal Plan', [ca.isMP, cb.isMP], [true, true]);
}

console.log('\n② เคสอื่น ๆ');
{
  const e = mk({
    both: LC.concat(HP),
    pkg: [{ menu_code:'J01', menu_name:'เมนูเจ', quantity:1, notes:'pkg:abc:course:1/3' }],
    stock: [{ menu_code:'S051', menu_name:'ข้าวกล่อง', quantity:2, notes:'' }],
  });
  t('ใบเดียวมีทั้ง HP+LC', e.headTag(e.classify({id:'both'})), '<span class="tag">HP+LC</span>');
  t('เซ็ต/แพค ไม่ติดป้าย', e.headTag(e.classify({id:'pkg'})), '');
  t('เมนูสต็อค ไม่ติดป้าย', e.headTag(e.classify({id:'stock'})), '');
  t('ใบว่าง ไม่พัง', e.headTag(e.classify({id:'ไม่มี'})), '');
}

console.log('\n③ ของเดิมต้องไม่พัง');
{
  const e = mk({ a:LC });
  const c = e.classify({id:'a'});
  t('ยังนับกล่องถูก', c.boxes, 3);
  t('ยังเก็บชื่อเมนูไว้ให้กางดู', c.names.length, 3);
  t('ป้ายในส่วนกาง (chip) ยังอยู่', src.includes('<span class="chip lc">LC</span>'), true);
}

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

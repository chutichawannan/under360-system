/** f-track — บันทึกผลที่นัทยืนยัน ชุดที่ 1 (16 ก.ย. 2026) */
import { load, save, exportCsv, FK, GO, similar } from './catalog.mjs';
import { fetchAll } from './orders.mjs';

const cat = load();
const BY = 'นัท 16 ก.ย. 2026';

// Freshket มี 2 แหล่ง: ① ของที่ซื้อจริงในบิล 46 ใบ ② แคตตาล็อกหน้า reorder (เคยซื้อมาก่อนหน้านี้)
const fkBill = FK().map((x) => ({ ...x, src: 'บิล' }));
const cata = (await fetchAll('kitchen_data?select=key,data&key=eq.f_freshket_catalog'))[0]?.data?.items || [];
const fkCat = cata.map((x) => ({ id: '', n: x.n, pack: x.u, cnt: 0, p: +x.p || 0, src: 'แคตตาล็อก' }));
const fk = [...fkBill, ...fkCat];
const go = GO().map((x) => ({ ...x, src: 'บิล' }));

const MIN = 60;  // 🔴 ต่ำกว่านี้ถือว่า "ไม่พบ" — ห้ามยัดของมั่วเข้าสารบัญ
const resolve = (list, q) => {
  const exact = list.find((x) => x.n === q);
  if (exact) return exact;
  const best = list.map((x) => ({ x, s: similar(q, x.n) })).sort((a, b) => b.s - a.s)[0];
  return best && best.s >= MIN ? best.x : null;
};

// [ชื่อเรา, หมวด, หน่วยนับ, [Freshket เรียงตามลำดับ], [GO เรียงตามลำดับ]]
const CONFIRMED = [
  ['ซี่โครงหมู', 'เนื้อสัตว์', 'g', ['ซีโครงหมูหันชิน'], ['ซี่โครงหมูหั่นชิ้น 1 กก.']],
  ['ทูน่ากระป๋อง', 'เนื้อสัตว์', 'g',
    ['ทูน่าสเต็ก ในน้าเกลือ ตราซีเล็คฟิตต์', 'ทูน่าแซนวิชในน้าเกลือ ตราซีเล็คฟิตต์ 4 x'],
    ['ซีเล็ค ฟิตต์ ทูน่าสเต็กในน้ำเกลือ 1,885 ก.']],
  ['ปลาทูนึ่ง', 'เนื้อสัตว์', 'g',
    ['ปลาทูนึ่งแม่กลอง ขนาด 200-220 กรัม/แพ็ค', 'ปลาทูนึ่งแม่กลอง ขนาด 340-360 กรัม/แพ็ค'],
    ['ปลาทูนึ่ง 2 ตัว']],
  ['ปลาทูสด', 'เนื้อสัตว์', 'g', ['ปลาทูสด ขนาด 5-6 ตัว/กก.'], ['ปลาทูลัง 1 กก.']],
  ['ถั่วฝักยาว', 'ผักลูก', 'g', ['ถัวฝักยาว', 'ถัวฝักยาวเส้นผอมเรียว'], ['ถั่วฝักยาว แพ็ค 500 ก.']],
  ['แตงกวาญี่ปุ่น', 'ผักลูก', 'g', ['แตงกวาญี่ปุน'], ['แตงกวาญี่ปุ่น 1 กก.']],
  ['สาลี่', 'ผลไม้', 'g', ['สาลีน้าผึง'], ['สาลี่ทอง 1 กก.']],
];

const miss = [];
for (const [name, cate, unit, fkNames, goNames] of CONFIRMED) {
  const e = { หมวด: cate, หน่วยนับ: unit, ยืนยันโดย: BY, ร้าน: { freshket: [], go: [] } };
  const put = (shop, list, names) => names.forEach((n, i) => {
    const p = resolve(list, n);
    if (!p) { miss.push(`${shop} · ${name} → "${n}"`); return }
    e.ร้าน[shop].push({ ลำดับ: i + 1, รหัส: p.id || '', ชื่อ: p.n, ขนาด: p.pack || '', ราคาตุ๊กตา: p.p || '', ที่มา: p.src });
  });
  put('freshket', fk, fkNames);
  put('go', go, goNames);
  cat.items[name] = e;
}

cat.ไม่ใช่ = cat.ไม่ใช่ || {};
cat.ไม่ใช่['สาลี่'] = ['แป้งสาลีอเนกประสงค์ ตราว่าว'];

save(cat);
const n = exportCsv(cat);
console.log(`✅ บันทึก ${Object.keys(cat.items).length} ชื่อ · ${n} แถว → docs/INGREDIENT_CATALOG.csv`);
if (miss.length) console.log('\n⚠️ หาไม่เจอในข้อมูลที่มี (ไม่ได้ยัดของมั่วเข้าไป):\n  ' + miss.join('\n  '));
console.log('');
for (const [k, v] of Object.entries(cat.items)) {
  const f = v.ร้าน.freshket.map((p) => `${p.ลำดับ}) ${p.ชื่อ} · ${p.ขนาด}`).join('   ') || '— ไม่มี';
  const g = v.ร้าน.go.map((p) => `${p.ลำดับ}) ${p.ชื่อ}`).join('   ') || '— ไม่มี';
  console.log(`${k}\n   Freshket: ${f}\n   GO:       ${g}`);
}

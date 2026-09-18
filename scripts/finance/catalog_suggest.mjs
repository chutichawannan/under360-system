/** f-track — เสนอคู่ชื่อทีละชุดให้นัทยืนยัน (ไม่บันทึกอะไร) · node catalog_suggest.mjs ชื่อ1 ชื่อ2 ... */
import { FK, GO, similar } from './catalog.mjs';
import { fetchAll } from './orders.mjs';

const cata = (await fetchAll('kitchen_data?select=key,data&key=eq.f_freshket_catalog'))[0]?.data?.items || [];
const fk = [...FK().map((x) => ({ n: x.n, pack: x.pack, src: 'บิล' })), ...cata.map((x) => ({ n: x.n, pack: x.u, src: 'แคต' }))];
const go = GO().map((x) => ({ n: x.n, pack: x.pack, src: 'บิล' }));
const top = (list, q) => list.map((x) => ({ x, s: similar(q, x.n) })).filter((a) => a.s >= 50)
  .sort((a, b) => b.s - a.s).filter((a, i, arr) => arr.findIndex((b) => b.x.n === a.x.n) === i).slice(0, 3);

for (const q of process.argv.slice(2)) {
  console.log(`\n${q}`);
  for (const [shop, list] of [['FK', fk], ['GO', go]]) {
    const t = top(list, q);
    console.log(`  ${shop}: ` + (t.map((a) => `${a.x.n} [${a.x.pack || ''}] (${a.s})`).join('  |  ') || '—'));
  }
}

/**
 * f-track — ตารางกลางวัตถุดิบ: ชื่อที่เราใช้ ↔ Freshket ↔ GO
 *
 * แหล่งข้อมูล (ของจริงจากใบสั่งซื้อ/หน้าเว็บ ไม่ได้พิมพ์เอง):
 *   ① GO       — `finance/out/go_items_summary.csv` แกะจากใบยืนยันคำสั่งซื้อ 71 ใบ (parse_go_orders.mjs)
 *   ② Freshket — kitchen_data:f_freshket_catalog (ดึงจาก freshket.co/reorder ทุกหมวด)
 *   ③ ชื่อเรา   — kitchen_data:stock_count_list (ลิสต์นับสต็อกที่นัทจัดหมวดไว้)
 *
 * ผลลัพธ์: docs/INGREDIENT_MAP.csv
 */
import { fetchAll } from './orders.mjs';
import fs from 'node:fs';

const splitCsv = (l) => {
  const c = []; let cur = '', q = false;
  for (const ch of l) {
    if (ch === '"') { q = !q; continue }
    if (ch === ',' && !q) { c.push(cur); cur = ''; continue }
    cur += ch;
  }
  c.push(cur); return c;
};

const GO = fs.readFileSync('finance/out/go_items_summary.csv', 'utf8')
  .replace(/^﻿/, '').trim().split('\n').slice(1)
  .map((l) => { const c = splitCsv(l); return { bc: c[0], n: c[1], u: c[2], cnt: +c[3], p: +c[5], baht: +c[6] } });

const rows = await fetchAll('kitchen_data?select=key,data&key=in.(f_freshket_catalog,stock_count_list)');
const get = (k) => (rows.find((r) => r.key === k) || {}).data;
const FK = get('f_freshket_catalog').items;   // {c,n,u,p}
const SL = get('stock_count_list');

// ── แปลงเป็น ฿/กก. เพื่อเทียบข้ามเจ้าได้จริง ─────────────────────────
function perKg(pack, price) {
  const p = +String(price).replace(/,/g, '');
  if (!p) return '';
  const s = String(pack || '');
  let m;
  if (/^kilogram$/i.test(s.trim())) return Math.round(p);
  if ((m = /([\d.]+)\s*(?:กก\.|กิโลกรัม)/.exec(s))) return Math.round(p / +m[1]);
  if ((m = /([\d.]+)\s*ลิตร/.exec(s)) || (m = /([\d.]+)\s*ล\./.exec(s))) return Math.round(p / +m[1]);
  if ((m = /([\d.]+)\s*(?:กรัม|ก\.)\b/.exec(s))) return Math.round(p / (+m[1] / 1000));
  if ((m = /([\d.]+)\s*มล\./.exec(s))) return Math.round(p / (+m[1] / 1000));
  return '';
}

// ── จับคู่: ตัดยี่ห้อ/คำขยาย/ขนาด ออกก่อนเทียบ ───────────────────────
const strip = (s) => String(s || '')
  .replace(/ตรา\S*/g, '')
  .replace(/\(.*?\)/g, '')
  .replace(/คัดสวย|คัดขนาด|แช่แข็ง|เด็ดก้าน|ออร์แกนิค|นำเข้า|ยกกระสอบ|ถุงใหญ่|แกะกลีบคละไซส์|สไลซ์|หั่นชิ้น|ชนิด\S*|เนื้อล้วน|ติดกระดูก|พร้อม\S*/g, '')
  .replace(/[\d.,]+\s*(?:กก\.|กรัม|ก\.|ลิตร|ล\.|มล\.|ฟอง|ชิ้น|แผ่น|ตัว|นิ้ว|%|ลูก|แพ็ค)/g, '')
  .replace(/\s*x\s*\d+/gi, '')
  .replace(/[\d.\-/]+/g, ' ')
  .replace(/\s+/g, ' ').trim();

const findIn = (list, name) => {
  const t = strip(name);
  if (!t || t.length < 2) return null;
  return list.find((x) => strip(x.n) === t)
      || list.find((x) => strip(x.n).includes(t))
      || list.find((x) => t.includes(strip(x.n)) && strip(x.n).length >= 3);
};

const out = [];
for (const g of SL.groups) {
  for (const it of g.items) {
    const fk = findIn(FK, it.name);
    const go = findIn(GO, it.name) || findIn(GO, it.go || '');
    out.push({
      หมวด: g.name,
      ชื่อที่เราใช้: it.name,
      หน่วยนับ: it.unit || '',
      ซื้อกี่ครั้ง: it.buys || '',
      มีรูป: it.img ? 'มี' : 'ไม่มี',
      Freshket: fk ? fk.n : '',
      'Freshket ขนาด': fk ? fk.u : '',
      'Freshket ฿/กก.': fk ? perKg(fk.u, fk.p) : '',
      GO: go ? go.n : (it.go || ''),
      'GO หน่วย': go ? go.u : '',
      'GO ฿/หน่วย': go ? go.p : '',
      'GO ฿/กก.': (() => { if (!go) return ''; const v = perKg(go.u === 'Kilogram' ? 'Kilogram' : go.n, go.p); return Number.isFinite(v) ? v : ''; })(),
      'GO สั่งกี่ครั้ง': go ? go.cnt : '',
      'GO ยอดรวม': go ? go.baht : '',
    });
  }
}

// ── ของที่ซื้อจริงแต่ยังไม่อยู่ในลิสต์นับ ─────────────────────────────
const inList = new Set(out.flatMap((x) => [strip(x['ชื่อที่เราใช้']), strip(x.GO), strip(x.Freshket)]).filter(Boolean));
const missGO = GO.filter((x) => !inList.has(strip(x.n))).sort((a, b) => b.baht - a.baht);

const H = Object.keys(out[0]);
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
fs.writeFileSync('docs/INGREDIENT_MAP.csv',
  '﻿' + [H.join(',')].concat(out.map((r) => H.map((h) => esc(r[h])).join(','))).join('\n'), 'utf8');

fs.writeFileSync('docs/INGREDIENT_MISSING_FROM_COUNT.csv',
  '﻿' + ['บาร์โค้ด,สินค้า GO,หน่วย,สั่งกี่ครั้ง,ราคาต่อหน่วย,ยอดรวม']
    .concat(missGO.map((x) => [x.bc, esc(x.n), x.u, x.cnt, x.p, Math.round(x.baht)].join(','))).join('\n'), 'utf8');

const b = (n) => Math.round(n).toLocaleString('en-US');
console.log(`\n📋 ตารางกลาง ${out.length} รายการ → docs/INGREDIENT_MAP.csv`);
console.log(`   จับคู่ได้ทั้ง 2 เจ้า  ${out.filter((x) => x.Freshket && x.GO).length}`);
console.log(`   มีชื่อ GO           ${out.filter((x) => x.GO).length}`);
console.log(`   มีชื่อ Freshket     ${out.filter((x) => x.Freshket).length}`);
console.log(`   ยังไม่มีชื่อร้าน     ${out.filter((x) => !x.Freshket && !x.GO).length}`);
console.log(`   ไม่มีรูป            ${out.filter((x) => x['มีรูป'] === 'ไม่มี').length}`);
console.log(`\n🆕 ของที่ซื้อจาก GO จริงแต่ไม่อยู่ในลิสต์นับ: ${missGO.length} ชนิด · รวม ฿${b(missGO.reduce((a, x) => a + x.baht, 0))}`);
console.log('   20 อันดับที่ใช้เงินสูงสุด:');
for (const x of missGO.slice(0, 20)) console.log(`   ${b(x.baht).padStart(8)}  ${String(x.cnt).padStart(3)} ครั้ง  ${x.n.slice(0, 48)}`);
console.log('\n💰 เทียบราคาข้ามเจ้าได้ (฿/กก.):');
for (const r of out.filter((x) => x['Freshket ฿/กก.'] && x['GO ฿/กก.']))
  console.log(`   ${r['ชื่อที่เราใช้'].padEnd(16)} Freshket ${String(r['Freshket ฿/กก.']).padStart(5)}  |  GO ${String(r['GO ฿/กก.']).padStart(5)}`);

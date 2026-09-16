/**
 * f-track — รวมรายการวัตถุดิบจาก 3 แหล่ง → ตารางกลาง 1 ชุด
 *   ① Freshket catalog (151) — ดึงจาก freshket.co/reorder ทุกหมวด
 *   ② GO catalog (32)       — ดึงจาก gowholesale my-account/reorder
 *   ③ ลิสต์นับสต็อกปัจจุบัน (91) — kitchen_data:stock_count_list (มีชื่อ GO + รูป + หน่วย อยู่แล้ว)
 * ผลลัพธ์: docs/INGREDIENT_MAP.csv + สรุปช่องว่าง
 */
import { fetchAll } from './scripts/finance/orders.mjs';
import fs from 'node:fs';

const rows = await fetchAll('kitchen_data?select=key,data&key=in.(f_freshket_catalog,f_go_catalog,stock_count_list)');
const get = (k) => (rows.find((r) => r.key === k) || {}).data;
const FK = get('f_freshket_catalog').items;      // {c,n,u,p}
const GO = get('f_go_catalog').items;            // {n,u,p}
const SL = get('stock_count_list');              // {groups:[{name,emoji,items:[{key,name,go,img,unit,buys}]}]}

const CAT = { 86: 'ผัก/ผลไม้', 48: 'เนื้อสัตว์', 44: 'ปลา/อาหารทะเล', 53: 'ไข่', 84: 'นม/ชีส/เนย', 85: 'แช่แข็ง', 87: 'ขนม/ของหวาน', 83: 'ปรุงสำเร็จ', 77: 'เครื่องปรุง', 74: 'ของแห้ง', 76: 'เบเกอรี่', 75: 'ของใช้', 80: 'เครื่องดื่ม', all: '(รวม)' };

// ── แปลงหน่วยเป็น "฿ ต่อ กก./ลิตร" เพื่อเทียบข้ามเจ้าได้จริง ──────────
function perKg(pack, price) {
  const p = +String(price).replace(/,/g, '');
  if (!p || !pack) return '';
  let m;
  if ((m = /([\d.]+)\s*กก\./.exec(pack))) return Math.round(p / +m[1]);
  if ((m = /([\d.]+)\s*ลิตร/.exec(pack))) return Math.round(p / +m[1]);
  if ((m = /([\d.]+)\s*กรัม/.exec(pack))) return Math.round(p / (+m[1] / 1000));
  if ((m = /([\d.]+)\s*มล\./.exec(pack))) return Math.round(p / (+m[1] / 1000));
  return '';
}

// ── จับคู่ด้วยคำหลัก: ตัดยี่ห้อ/คำขยายออกก่อนเทียบ ────────────────────
const strip = (s) => String(s || '')
  .replace(/ตรา\S*/g, '').replace(/\(.*?\)/g, '')
  .replace(/คัดสวย|คัดขนาด|แช่แข็ง|เด็ดก้าน|ออร์แกนิค|นำเข้า|พร้อม\S*|สไลซ์|หั่นชิ้น|ชนิด\S*/g, '')
  .replace(/[\d.,]+\s*(กก\.|กรัม|ก\.|ลิตร|มล\.|ฟอง|ชิ้น|แผ่น|ตัว|นิ้ว|%)/g, '')
  .replace(/\s+/g, ' ').trim();

const findIn = (list, name) => {
  const t = strip(name);
  if (!t) return null;
  return list.find((x) => strip(x.n) === t)
      || list.find((x) => strip(x.n).includes(t) || t.includes(strip(x.n)));
};

// ── ตั้งต้นจากลิสต์นับสต็อก (ชื่อที่ "เรา" ใช้) ───────────────────────
const out = [];
for (const g of SL.groups) {
  for (const it of g.items) {
    const fk = findIn(FK, it.name);
    const go = findIn(GO, it.go || it.name);
    out.push({
      หมวด: g.name,
      ชื่อที่เราใช้: it.name,
      หน่วยนับ: it.unit || '',
      ซื้อกี่ครั้ง: it.buys || '',
      มีรูป: it.img ? 'มี' : 'ไม่มี',
      Freshket: fk ? fk.n : '',
      'Freshket ขนาด': fk ? fk.u : '',
      'Freshket ฿/กก.': fk ? perKg(fk.u, fk.p) : '',
      GO: it.go || (go ? go.n : ''),
      'GO ขนาด': go ? go.u : '',
      'GO ฿/กก.': go ? perKg(go.n + ' ' + go.u, go.p) : '',
    });
  }
}

// ── ของที่มีในบิลแต่ยังไม่อยู่ในลิสต์นับ ──────────────────────────────
const known = new Set(out.map((x) => strip(x['ชื่อที่เราใช้'])));
const extraFK = FK.filter((x) => !known.has(strip(x.n)) && !out.some((o) => strip(o.Freshket) === strip(x.n)));

const H = Object.keys(out[0]);
const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
fs.writeFileSync('docs/INGREDIENT_MAP.csv',
  '﻿' + [H.join(',')].concat(out.map((r) => H.map((h) => esc(r[h])).join(','))).join('\n'), 'utf8');

const both = out.filter((x) => x.Freshket && x.GO).length;
console.log(`\n📋 ตารางกลาง: ${out.length} รายการ → docs/INGREDIENT_MAP.csv`);
console.log(`   จับคู่ได้ทั้ง 2 เจ้า      ${both}`);
console.log(`   มีเฉพาะชื่อ Freshket     ${out.filter((x) => x.Freshket && !x.GO).length}`);
console.log(`   มีเฉพาะชื่อ GO           ${out.filter((x) => !x.Freshket && x.GO).length}`);
console.log(`   ยังไม่มีชื่อร้านเลย       ${out.filter((x) => !x.Freshket && !x.GO).length}`);
console.log(`   ไม่มีรูป                 ${out.filter((x) => x['มีรูป'] === 'ไม่มี').length}`);
console.log(`\n🆕 ของที่ซื้อจาก Freshket แต่ยังไม่อยู่ในลิสต์นับ: ${extraFK.length} รายการ`);
console.log(extraFK.slice(0, 25).map((x) => `   ${CAT[x.c] || x.c} · ${x.n} (${x.u})`).join('\n'));

console.log('\n💰 ตัวอย่างที่เทียบราคาข้ามเจ้าได้แล้ว (฿/กก.):');
for (const r of out.filter((x) => x['Freshket ฿/กก.'] && x['GO ฿/กก.']).slice(0, 12))
  console.log(`   ${r['ชื่อที่เราใช้'].padEnd(18)} Freshket ${String(r['Freshket ฿/กก.']).padStart(5)}  |  GO ${String(r['GO ฿/กก.']).padStart(5)}`);

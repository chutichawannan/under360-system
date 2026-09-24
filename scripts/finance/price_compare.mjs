/**
 * f-track — เทียบราคา GO ↔ Freshket ของวัตถุดิบตัวเดียวกัน (นัทสั่ง 24 ก.ย. 2026)
 * ใช้สารบัญที่นัทเคาะเอง (docs/INGREDIENT_CATALOG.json) เป็นตัวจับคู่ — ไม่เดาชื่อเอง
 *
 * คิดเป็น "฿ ต่อกิโล/ลิตร" เพื่อเทียบข้ามขนาดบรรจุได้
 * ⚠️ ราคาที่เห็นคือราคาที่เคยซื้อจริงในบิล ไม่ใช่ราคาหน้าเว็บวันนี้
 */
import { readCsv, load } from './catalog.mjs';
import fs from 'node:fs';

/** แปลงราคาต่อหน่วยบรรจุ → ฿/กก. (หรือ ฿/ล.) */
function perKg(name, pack, price) {
  const p = +String(price).replace(/,/g, '');
  if (!p) return null;
  const s = `${pack || ''} ${name || ''}`;
  let m;
  if (/^\s*(kilogram|กิโลกรัม)\s*$/i.test(pack || '')) return p;
  if ((m = /([\d.]+)\s*(?:กก\.|กิโลกรัม|kg)/i.exec(s))) return p / +m[1];
  if ((m = /([\d.]+)\s*(?:ลิตร|ล\.)\b/.exec(s))) return p / +m[1];
  if ((m = /([\d.]+)\s*(?:กรัม|ก\.)\b/.exec(s))) return p / (+m[1] / 1000);
  if ((m = /([\d.]+)\s*มล\./.exec(s))) return p / (+m[1] / 1000);
  return null;
}

const GO = readCsv('finance/out/go_order_items.csv')    // วันที่,ใบ,บาร์โค้ด,สินค้า,หน่วย,จำนวน,ราคา/หน่วย,รวม
  .map((c) => ({ shop: 'GO', date: c[0], name: c[3], pack: c[4], price: +c[6], baht: +c[7] }));
const FK = readCsv('finance/out/freshket_order_items.csv') // วันที่,บิล,รหัส,สินค้า,ขนาด,แพ็ค,น้ำหนัก,หน่วย,ราคา/หน่วย,รวม
  .map((c) => ({ shop: 'FK', date: c[0], name: c[3], pack: c[4] || c[7], price: +c[8], baht: +c[9] }));
const ALL = [...GO, ...FK];

const cat = load();
const rows = [];
for (const [ours, it] of Object.entries(cat.items || {})) {
  const names = { GO: (it.ร้าน?.go || []).map((x) => x.ชื่อ), FK: (it.ร้าน?.freshket || []).map((x) => x.ชื่อ) };
  const side = {};
  for (const shop of ['GO', 'FK']) {
    const buys = ALL.filter((r) => r.shop === shop && names[shop].includes(r.name));
    const pk = buys.map((r) => ({ v: perKg(r.name, r.pack, r.price), baht: r.baht })).filter((x) => x.v);
    if (!pk.length) continue;
    side[shop] = {
      min: Math.min(...pk.map((x) => x.v)), max: Math.max(...pk.map((x) => x.v)),
      avg: pk.reduce((a, x) => a + x.v, 0) / pk.length, n: pk.length,
      baht: buys.reduce((a, r) => a + (r.baht || 0), 0),
    };
  }
  if (side.GO && side.FK) {
    const cheap = side.GO.avg <= side.FK.avg ? 'GO' : 'Freshket';
    const diff = Math.abs(side.GO.avg - side.FK.avg);
    const spend = side.GO.baht + side.FK.baht;
    const loseSide = cheap === 'GO' ? side.FK : side.GO;
    rows.push({ ours, go: side.GO, fk: side.FK, cheap, diff,
      pct: diff / Math.max(side.GO.avg, side.FK.avg) * 100, spend,
      // ประหยัดได้ = ยอดที่ซื้อจากเจ้าแพงกว่า × ส่วนต่าง%
      save: loseSide.baht * (diff / Math.max(side.GO.avg, side.FK.avg)) });
  }
}
rows.sort((a, b) => b.save - a.save);

const b = (n) => Math.round(n).toLocaleString('en-US');
console.log('\n💰 เทียบราคา GO ↔ Freshket — เฉพาะของที่ซื้อ "ทั้ง 2 เจ้า" จริง (บิล 3 เดือน)\n');
console.log('วัตถุดิบ           | GO ฿/กก. | FK ฿/กก. | ถูกกว่า  | ต่าง% | ซื้อไปแล้ว | ถ้าเลือกถูกจะประหยัด');
for (const r of rows)
  console.log(
    r.ours.padEnd(18), '|', b(r.go.avg).padStart(8), '|', b(r.fk.avg).padStart(8), '|',
    r.cheap.padEnd(8), '|', r.pct.toFixed(0).padStart(4), '% |', b(r.spend).padStart(9), '|', b(r.save).padStart(10));
console.log(`\nรวมประหยัดได้ ~฿${b(rows.reduce((a, r) => a + r.save, 0))} จากยอดซื้อ ฿${b(rows.reduce((a, r) => a + r.spend, 0))} (3 เดือน)`);

const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const H = ['วัตถุดิบ', 'GO ฿/กก. (ต่ำ-สูง)', 'Freshket ฿/กก. (ต่ำ-สูง)', 'เจ้าที่ถูกกว่า', 'ต่าง %', 'ยอดซื้อ 3 เดือน', 'ประหยัดได้'];
fs.writeFileSync('docs/PRICE_COMPARE_GO_FK.csv', '﻿' + [H.map(esc).join(',')].concat(
  rows.map((r) => [r.ours, `${b(r.go.min)}-${b(r.go.max)} (เฉลี่ย ${b(r.go.avg)})`,
    `${b(r.fk.min)}-${b(r.fk.max)} (เฉลี่ย ${b(r.fk.avg)})`, r.cheap, r.pct.toFixed(0),
    Math.round(r.spend), Math.round(r.save)].map(esc).join(','))).join('\n'), 'utf8');
console.log('📄 docs/PRICE_COMPARE_GO_FK.csv\n');

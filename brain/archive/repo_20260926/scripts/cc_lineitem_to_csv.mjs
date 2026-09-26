// แปลงรายงาน "การขายรายสินค้า" (LineItem) ของ Hato -> CSV + สรุปให้ f-track ใช้ต่อ
// ที่มา: Hato final pull 5 ส.ค. 2026 (ก่อนปิดระบบ 7 ส.ค.)
// ต้อง extract xlsx ไว้ที่ download/hato_final/_li_raw ก่อน (ดู README ใน handoff)
import fs from 'node:fs';

const DIR = 'download/hato_final';
const xml = fs.readFileSync(`${DIR}/_li_raw/xl/worksheets/sheet1.xml`, 'utf8');

const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const rows = [];
const rowRe = /<row[^>]*>(.*?)<\/row>/gs;
let m;
while ((m = rowRe.exec(xml))) {
  const cells = [];
  const cellRe = /<c[^>]*?(?:\/>|>(.*?)<\/c>)/gs;
  let c;
  while ((c = cellRe.exec(m[1] + ''))) {
    const inner = c[1] || '';
    const t = inner.match(/<t[^>]*>(.*?)<\/t>/s);
    const v = inner.match(/<v>(.*?)<\/v>/s);
    cells.push(unesc(t ? t[1] : v ? v[1] : ''));
  }
  rows.push(cells);
}
const hdr = rows.shift();
const data = rows.filter(r => r.length > 3);
console.log(`อ่านได้ ${data.length.toLocaleString()} บรรทัดสินค้า · ${hdr.length} คอลัมน์`);

const idx = Object.fromEntries(hdr.map((h, i) => [h, i]));
const g = (r, k) => r[idx[k]] ?? '';

// --- CSV ---
const csv = [hdr.join(','), ...data.map(r => hdr.map((_, i) => `"${String(r[i] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
fs.writeFileSync(`${DIR}/lineitem_sales.csv`, '﻿' + csv, 'utf8');
console.log(`-> ${DIR}/lineitem_sales.csv (${(csv.length / 1048576).toFixed(1)} MB)`);

// --- สรุปให้ f-track ---
const dates = data.map(r => g(r, 'date')).filter(Boolean).sort();
const byMonth = {}, byChannel = {}, byCat = {}, byProduct = {};
let total = 0;
for (const r of data) {
  const baht = Number(g(r, 'base_total_baht') || 0);
  total += baht;
  const mo = (g(r, 'date') || '').slice(0, 7);
  byMonth[mo] = (byMonth[mo] || 0) + baht;
  const ch = g(r, 'channel') || '(ว่าง)';
  byChannel[ch] = (byChannel[ch] || 0) + baht;
  const ct = g(r, 'product_category_name') || '(ไม่มีหมวด)';
  byCat[ct] = (byCat[ct] || 0) + baht;
  const p = g(r, 'product_name') || '(ไม่มีชื่อ)';
  byProduct[p] = (byProduct[p] || 0) + baht;
}
const B = n => '฿' + Math.round(n).toLocaleString();
const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);

const out = [];
out.push(`# LineItem (การขายรายสินค้า) — Hato final pull 5 ส.ค. 2026`);
out.push(`ช่วงข้อมูล: ${dates[0]} ถึง ${dates[dates.length - 1]} · ${data.length.toLocaleString()} บรรทัด · รวม ${B(total)}`);
out.push(`\n## แยกช่องทาง`);
top(byChannel, 10).forEach(([k, v]) => out.push(`- ${k}: ${B(v)}`));
out.push(`\n## แยกหมวดสินค้า (top 12)`);
top(byCat, 12).forEach(([k, v]) => out.push(`- ${k}: ${B(v)}`));
out.push(`\n## สินค้าขายดี top 20 (ตามยอดเงิน)`);
top(byProduct, 20).forEach(([k, v], i) => out.push(`${i + 1}. ${k} — ${B(v)}`));
out.push(`\n## ยอดรายเดือน`);
Object.keys(byMonth).sort().forEach(k => { if (k) out.push(`- ${k}: ${B(byMonth[k])}`); });
fs.writeFileSync(`${DIR}/lineitem_summary.md`, out.join('\n'), 'utf8');
console.log(`-> ${DIR}/lineitem_summary.md`);
console.log(out.slice(0, 3).join('\n'));

#!/usr/bin/env node
// ═══ 🛑 ปิดถาวร 8 ส.ค. 2026 — วันที่ย้ายมาใช้ระบบร้านเราเองแบบ official ═══
// สคริปต์นี้พึ่ง Hato เป็นต้นทาง · Hato เลิกใช้แล้ว = ข้อมูลไม่มี/ไม่อัปเดตอีก
// รันต่อ = เสี่ยงเขียนข้อมูลผิดทับของจริง (เคสจริง: sync เมนูเคยปิดเมนูสัปดาห์ใหม่ทิ้ง 13 ตัว)
// ต้องการรันจริง ๆ (เช่นย้อนดูโค้ดเก่า) ให้ตั้ง env: HATO_LEGACY=iknowwhatimdoing
if (process.env.HATO_LEGACY !== 'iknowwhatimdoing') {
  console.error('🛑 สคริปต์นี้ปิดถาวรแล้ว (8 ส.ค. 2026 — เลิกใช้ Hato)');
  console.error('   เปิด/ปิดเมนู · แก้ออเดอร์ ทำที่หน้า DB / OH เท่านั้น');
  process.exit(1);
}
/**
 * เช็คว่า "เซ็ต/คอร์ส/แพลน" ที่ Hato เคยขาย มาครบในระบบเราหรือยัง — P-track 6 ส.ค. 2026
 *
 * ที่มา (N-05): นัทไม่แน่ใจว่าเซ็ตทั้งหมดขึ้นครบตามลิสต์แอดมิน → ต้อง verify ก่อน Hato ปิด 7 ส.ค.
 *
 * 🔑 ทำไมใช้ CSV ไม่ใช่ยิง Hato API:
 *   · `download/hato_final/lineitem_sales.csv` = สินค้าที่ **ขายจริง** ทุกบรรทัด 2 ปี (ไม่ใช่ catalog ที่มีของมั่วปน)
 *   · ตรงกับบทเรียน `hato-catalog-needs-curation` — catalog ของ Hato แยก "ของขายจริง" ไม่ได้ ต้องดูจากยอดขาย
 *   · ไม่ต้องพึ่ง token ที่หมดอายุทุกชั่วโมง และใช้ได้ต่อแม้ Hato ตายแล้ว
 *
 * ใช้: node scripts/hato_set_parity.mjs [จำนวนเดือนย้อนหลัง · default 6]
 */
import fs from 'fs';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const MONTHS = Number(process.argv[2] || 6);
const CSV = 'download/hato_final/lineitem_sales.csv';

// หมวดที่นับว่าเป็น "เซ็ต/คอร์ส/แพลน" (ไม่ใช่เมนูเดี่ยว)
const SET_CAT = /โปรโมชั่นเซ็ท|เซ็ต|เซ็ท|คอร์ส|แพลน|plan|package|set/i;
const SET_NAME = /เซ็ต|เซ็ท|คอร์ส|แพ็?ค|pack|plan|monthly|weekly|โปร\s|วัน\s*\d+\s*มื้อ|\d+\s*กล่อง/i;
// ตัดของที่ไม่ใช่สินค้า
const NOT_PRODUCT = /ค่าส่ง|ช้อน|ส้อม|ถุง|แยกวันส่ง|เพิ่มเติม|ทิป/i;

function parseCsvLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === ',' && !q) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur); return out;
}

const raw = fs.readFileSync(CSV, 'utf8').split(/\r?\n/).filter(Boolean);
const cols = parseCsvLine(raw[0].replace(/^﻿/, ''));
const ix = Object.fromEntries(cols.map((c, i) => [c, i]));

const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - MONTHS);
const cutISO = cutoff.toISOString().slice(0, 10);

const sets = new Map();  // key: sku|name → {sku,name,cat,qty,revenue,last,prices:Set}
for (let i = 1; i < raw.length; i++) {
  const r = parseCsvLine(raw[i]);
  const date = r[ix.date], name = r[ix.product_name] || '', cat = r[ix.product_category_name] || '', sku = r[ix.sku] || '';
  if (!date || date < cutISO) continue;
  if (NOT_PRODUCT.test(name)) continue;
  if (!(SET_CAT.test(cat) || SET_NAME.test(name))) continue;
  const key = (sku || '~') + '|' + name;
  const e = sets.get(key) || { sku, name, cat, qty: 0, revenue: 0, last: '', prices: new Set() };
  e.qty += Number(r[ix.quantity] || 0);
  e.revenue += Number(r[ix.base_total_baht] || 0);
  if (date > e.last) e.last = date;
  const p = Number(r[ix.unit_price_baht] || 0); if (p > 0) e.prices.add(p);
  sets.set(key, e);
}

const list = [...sets.values()].sort((a, b) => b.revenue - a.revenue);

// ของเราในระบบ
const pkgs = await (await fetch(`${SB}/packages?select=id,name,base_price,is_active,qty&limit=200`, { headers: H })).json();
const mpsets = await (await fetch(`${SB}/mp_offer_sets?select=set_key,label,price_hp,price_lc,boxes&limit=100`, { headers: H })).json();

const norm = (s) => String(s).toLowerCase().replace(/[\s\-_.()]/g, '');

// 🔗 แผนที่ชื่อ Hato → ชื่อเรา (ชื่อคนละระบบกันสิ้นเชิง แมตช์ด้วย string เปล่าไม่ได้)
//    ⚠️ ห้ามแมตช์ด้วย "ราคา" อย่างเดียว — เราขึ้นราคาจาก Hato ทุกตัว (นัทสั่ง "เอาราคาแพงสุดเป็นตัวตั้ง")
const ALIAS = [
  [/HPWeekly|High Protein.*Weekly/i,        '1 สัปดาห์ HP'],
  [/LCPWeekly|Low Carb.*รายสัปดาห์|Low Carb.*Weekly/i, '1 สัปดาห์ LC'],
  [/HPMonthly|High Protein.*Monthly/i,      '1 เดือน HP'],
  [/LCPMonthly|Low Carb.*รายเดือน|Low Carb.*Monthly/i, '1 เดือน LC'],
  [/เซ็ตทดลอง High Protein/i,               'ทดลอง HP'],
  [/เซ็ตทดลอง Low Carb/i,                   'ทดลอง LC'],
  [/SIZE S.*แพคกับข้าว/i,                   'Protein Pack S'],
  [/SIZE M.*แพคกับข้าว/i,                   'Protein Pack M'],
  [/SIZE L.*แพคกับข้าว/i,                   'Protein Pack L'],
  [/DIET SET A/i,                           'Diet Set A'],
  [/DIET SET B/i,                           'Diet Set B'],
  [/DIET SET C/i,                           'Diet Set C'],
  [/โบนบรอธ|bone ?broth/i,                  'โบนบรอธ'],
];
const aliasOf = (name) => (ALIAS.find(([re]) => re.test(name)) || [])[1] || null;
const ours = [
  ...pkgs.map((p) => ({ kind: 'packages', name: p.name, price: p.base_price, active: p.is_active })),
  ...mpsets.flatMap((m) => [
    { kind: 'mp_offer_sets', name: `${m.label} HP`, price: m.price_hp, active: true },
    { kind: 'mp_offer_sets', name: `${m.label} LC`, price: m.price_lc, active: true },
  ]),
];

console.log(`📊 เซ็ต/คอร์ส/แพลน ที่ Hato "ขายได้จริง" ย้อนหลัง ${MONTHS} เดือน (ตั้งแต่ ${cutISO})`);
console.log(`   เจอ ${list.length} รายการ · ระบบเรามี packages ${pkgs.length} (เปิด ${pkgs.filter((p) => p.is_active).length}) · mp_offer_sets ${mpsets.length}\n`);

const missing = [];
console.log('SKU'.padEnd(14) + 'ชื่อสินค้า'.padEnd(52) + 'ขาย'.padStart(5) + 'ยอดเงิน'.padStart(11) + '  ขายล่าสุด    ราคา            เรามีไหม');
console.log('─'.repeat(140));
for (const s of list) {
  const al = aliasOf(s.name);
  const hit = ours.find((o) => {
    if (al && norm(o.name).includes(norm(al))) return true;
    const a = norm(o.name), b = norm(s.name);
    return a.includes(b) || b.includes(a);
  });
  // เตือนถ้าราคาเราถูกกว่าที่ Hato เคยขาย (นัทสั่งยึดราคาแพงสุด)
  if (hit && s.prices.size && Number(hit.price) < Math.max(...s.prices)) {
    s._cheaper = `฿${hit.price} < Hato สูงสุด ฿${Math.max(...s.prices)}`;
  }
  if (!hit) missing.push(s);
  console.log(
    String(s.sku || '—').slice(0, 13).padEnd(14) +
    s.name.slice(0, 50).padEnd(52) +
    String(s.qty).padStart(5) +
    ('฿' + s.revenue.toLocaleString()).padStart(11) +
    '  ' + s.last + '  ' + [...s.prices].sort((a, b) => a - b).join('/').slice(0, 14).padEnd(16) +
    (hit ? `✅ ${hit.kind}` : '🔴 ไม่มี')
  );
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`🔴 เซ็ตที่ Hato ขายได้ แต่ระบบเราไม่มี: ${missing.length} รายการ`);
missing.forEach((s) => console.log(`   · ${s.name}  (ขาย ${s.qty} ครั้ง · ฿${s.revenue.toLocaleString()} · ล่าสุด ${s.last} · ราคา ${[...s.prices].join('/')})`));
const cheaper = list.filter((s) => s._cheaper);
console.log(`\n⚠️  ราคาเราต่ำกว่าที่ Hato เคยขาย (นัทสั่งยึดราคาแพงสุด): ${cheaper.length} รายการ`);
cheaper.forEach((s) => console.log(`   · ${s.name.slice(0, 46)} — ${s._cheaper}`));

console.log(`\n📦 เซ็ตในระบบเรา (${ours.length}):`);
ours.forEach((o) => console.log(`   ${o.active ? '🟢' : '⚪'} [${o.kind}] ${o.name} — ฿${o.price}`));

// MC2 / S205 (N-04 ที่ CC ฝากมา) มีในเมนูเราไหม
const codes = ['MC2', 'S205'];
const mi = await (await fetch(`${SB}/menu_items?select=code,name,price,is_available&code=in.(${codes.join(',')})`, { headers: H })).json();
console.log(`\n🔎 เช็คโค้ดที่ CC ฝากมา (N-04): ${codes.join(', ')}`);
codes.forEach((c) => {
  const m = (Array.isArray(mi) ? mi : []).find((x) => x.code === c);
  console.log(`   ${m ? (m.is_available ? '🟢 เปิดขาย' : '⚪ ปิดอยู่') : '🔴 ไม่มีในระบบ'}  ${c}  ${m ? m.name + ' ฿' + m.price : ''}`);
});

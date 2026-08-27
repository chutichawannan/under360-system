#!/usr/bin/env node
/**
 * ด่านตรวจใบงานครัวของห้องฟ้า — รันก่อนส่งใบทุกครั้ง
 *
 *   node scripts/fah_check_sheet.mjs 2026-08-28
 *
 * ทำไมถึงมีไฟล์นี้ (27 ส.ค. 2026):
 *   ฟ้าตัดลูกค้าออกจากใบ 3 ราย เพราะอ่าน order.delivery_date ผิด
 *   (คอร์สหลายรอบ รอบ 2..N ผูกกับ "ออเดอร์แม่" วันจึงไม่ตรงเป็นปกติ)
 *   ถ้าไม่มีคนมาตรวจ = ลูกค้า 3 คนไม่ได้ของ 2 คนเพิ่งจ่ายเงินก้อน
 *   → เปลี่ยนจาก "หวังว่าจะไม่พลาด" เป็น "เครื่องตรวจที่พังเสียงดัง"
 *
 * ตรวจ 7 ข้อ · เจอ FAIL = ห้ามส่งใบ ห้าม push
 */
import { readFileSync } from 'node:fs';

const DATE = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE || '')) {
  console.error('ใช้: node scripts/fah_check_sheet.mjs YYYY-MM-DD');
  process.exit(2);
}
const MAX_MENUS_PER_DAY = 10;   // แพลนตั้งไว้วันละ 8-10 เมนู (นัทเคาะ 20 ส.ค.)
const SINGLE_BOX_WARN   = 2;    // เมนูที่ทำ <=2 กล่อง = วัตถุดิบทิ้ง

const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

const fails = [], warns = [];
const FAIL = m => fails.push(m);
const WARN = m => warns.push(m);

// ---------- อ่านใบจัดของ ----------
const packPath = `kitchen/${DATE}_pack.html`;
let html;
try { html = readFileSync(packPath, 'utf8'); }
catch { console.error(`❌ ไม่มีไฟล์ ${packPath}`); process.exit(1); }

const mm = html.match(/var C\s*=\s*(\[[\s\S]*?\n\];)/);
if (!mm) { console.error('❌ หา var C = [...] ในใบจัดของไม่เจอ (โครงไฟล์เปลี่ยน?)'); process.exit(1); }
let C;
try { C = new Function('return ' + mm[1].replace(/;\s*$/, ''))(); }
catch (e) { console.error('❌ parse var C ไม่ได้:', e.message); process.exit(1); }

// ---------- ดึงคิวจริงจาก DB ----------
const q = async p => {
  const r = await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: 'Bearer ' + K } });
  if (!r.ok) { console.error('❌ query ล้มเหลว', r.status, await r.text()); process.exit(1); }
  return r.json();
};
const rowsAll = await q(`mp_deliveries?select=id,order_id,customer_name,mp_type,round_no,total_rounds,box_count,status&delivery_date=eq.${DATE}&limit=200`);
const rows = rowsAll.filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested');

console.log(`\n🔎 ตรวจใบวันที่ ${DATE}`);
console.log(`   คิวจริงใน DB : ${rows.length} ใบ (ตัด cancelled/skip แล้ว จาก ${rowsAll.length})`);
console.log(`   ในใบจัดของ   : ${C.length} ใบ · ${C.reduce((s,c)=>s+(c.box||0),0)} กล่อง`);

// จับคู่ใบ↔DB ด้วย "เลขออเดอร์" — ชื่อลูกค้าเขียนคนละแบบ จับคู่ด้วยชื่อไม่ได้
const ids  = [...new Set(rows.map(r => r.order_id).filter(Boolean))];
const ords = ids.length ? await q(`orders?select=id,order_number&id=in.(${ids.join(',')})&limit=200`) : [];
const numOf = Object.fromEntries(ords.map(o => [o.id, o.order_number]));
const sheetNums = new Set(C.map(c => (String(c.line||'').match(/[A-Z]{1,3}-[0-9-]+/) || [''])[0]).filter(Boolean));

// ---------- ข้อ 1: ห้ามมีใครหายจากใบ ----------
const missing = rows.filter(r => { const n = numOf[r.order_id]; return n ? !sheetNums.has(n) : false; });
if (missing.length) {
  FAIL(`มีคิวใน DB แต่ไม่มีในใบ ${missing.length} ใบ — ลูกค้าจะไม่ได้ของ:\n` +
    missing.map(r => `        · ${r.customer_name} ${r.mp_type} r${r.round_no}/${r.total_rounds} [${numOf[r.order_id]}]`).join('\n'));
}
const noOrder = rows.filter(r => !r.order_id);
if (noOrder.length) WARN(`${noOrder.length} แถวไม่มี order_id — ต้องตรวจด้วยตา: ` + noOrder.map(r => r.customer_name).join(' · '));
if (C.length < rows.length) FAIL(`จำนวนใบไม่ครบ: DB ${rows.length} ใบ แต่ในใบมี ${C.length} ใบ`);

// ---------- ข้อ 2: จำนวนเมนูของวันต้องไม่บาน ----------
const pool = [...new Set(C.flatMap(c => c.items || []))].sort();
console.log(`   เมนูที่ต้องผลิต: ${pool.length} ตัว — ${pool.join(',')}`);
if (pool.length > MAX_MENUS_PER_DAY) {
  FAIL(`เมนูบานเป็น ${pool.length} ตัว (เพดาน ${MAX_MENUS_PER_DAY}) — มีคนถือชุดเมนูของวันอื่นติดมา ต้องจัดใหม่จากชุดของวันนี้`);
}

// ---------- ข้อ 3: จำนวนเมนู = จำนวนกล่อง ----------
for (const c of C) {
  const n = (c.items || []).length;
  if (n !== c.box) {
    const flagged = /🚨|ขาด/.test(c.note || '');
    (flagged ? WARN : FAIL)(`${c.n}: เมนู ${n} ตัว แต่ box ${c.box}${flagged ? ' (ติดธงไว้แล้ว)' : ''}`);
  }
}

// ---------- ข้อ 4: ห้ามเมนูซ้ำในใบเดียวกัน ----------
for (const c of C) {
  const it = c.items || [];
  const dup = it.filter((x, i) => it.indexOf(x) !== i);
  if (dup.length) FAIL(`${c.n}: เมนูซ้ำในใบเดียวกัน → ${[...new Set(dup)].join(',')}`);
}

// ---------- ข้อ 5: box_count ในใบต้องตรง DB ----------
for (const r of rows) {
  const n = numOf[r.order_id];
  const hit = n ? C.find(c => String(c.line || '').includes(n)) : null;
  if (hit && r.box_count && hit.box !== r.box_count) {
    WARN(`${r.customer_name} [${n}]: ใบใช้ ${hit.box} กล่อง แต่ DB box_count=${r.box_count} — ยืนยันว่าตั้งใจ`);
  }
}

// ---------- ข้อ 6: ยอดตรง 3 ทาง ----------
const totalBoxes = C.reduce((s, c) => s + (c.box || 0), 0);
const heads = [...html.matchAll(/(\d+)\s*กล่อง/g)].map(x => +x[1]);
if (heads.length && !heads.includes(totalBoxes)) {
  FAIL(`ยอดไม่ตรง: บวกจากรายคนได้ ${totalBoxes} กล่อง แต่ในใบจัดของเขียน ${[...new Set(heads)].join('/')}`);
}
const prodPath = `kitchen/${DATE}.html`;
try {
  const prod = readFileSync(prodPath, 'utf8');
  const ph = [...prod.matchAll(/(\d+)\s*กล่อง/g)].map(x => +x[1]);
  if (ph.length && !ph.includes(totalBoxes)) FAIL(`ใบผลิต (${prodPath}) ไม่มียอด ${totalBoxes} เลย — ใบผลิตกับใบจัดของไม่ตรงกัน`);
} catch { WARN(`ไม่มีใบผลิต ${prodPath}`); }

// ---------- ข้อ 7: กล่องเดี่ยว ----------
const perMenu = {};
C.forEach(c => (c.items || []).forEach(i => perMenu[i] = (perMenu[i] || 0) + 1));
const singles = Object.entries(perMenu).filter(([, n]) => n <= SINGLE_BOX_WARN);
if (singles.length) WARN(`เมนูที่ทำน้อยมาก (วัตถุดิบเสี่ยงทิ้ง): ${singles.map(([k, n]) => `${k}=${n}กล่อง`).join(' · ')}`);

// ---------- สรุป ----------
console.log('\n   ยอดต่อเมนู: ' + Object.entries(perMenu).sort().map(([k, n]) => `${k}:${n}`).join(' · '));
if (warns.length) { console.log('\n🟡 เตือน (ไม่บล็อก):'); warns.forEach(w => console.log('   · ' + w)); }
if (fails.length) {
  console.log('\n🔴 ไม่ผ่าน — ห้ามส่งใบ ห้าม push:');
  fails.forEach(f => console.log('   ❌ ' + f));
  console.log('');
  process.exitCode = 1;
} else {
  console.log('\n✅ ผ่านครบ 7 ข้อ — ส่งใบได้\n');
}

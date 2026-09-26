#!/usr/bin/env node
/**
 * เตือนล่วงหน้าว่า "แพลนเมนูรายวันใกล้หมดแล้ว" — ห้องฟ้าต้องรู้เอง ไม่ใช่รอนัททวง
 *
 *   node scripts/fah_check_plan_horizon.mjs
 *
 * ทำไมถึงมีไฟล์นี้ (นัทถามเอง 27 ส.ค. 2026):
 *   "นายจะรู้ตัวเมื่อไหร่ว่าเราต้องทำเมนูล่วงหน้าต่อไปเรื่อยๆ เพราะตอนนี้มันสุดอยู่ที่วันที่ 4"
 *   → ของที่รู้ว่าต้องมี ต้องมาเอง · ไม่มีใครควรต้องทวง
 *
 * แพลนไม่ได้กระทบแค่ครัว — **ลูกค้าเห็นแพลนนี้ตอนกดสั่งใน LIFF**
 * แพลนสั้น = คนซื้อคอร์สรายเดือนกดเลือกเมนูรอบท้ายไม่ได้
 */
import { readFileSync } from 'node:fs';

const WARN_DAYS = 4;   // เหลือวันผลิตที่มีแพลน < 4 วัน = เตือน
const URGENT_DAYS = 2; // < 2 วัน = ด่วน

const PLAN = 'docs/FAH_MENU_PLAN_DAILY.md';
const todayTH = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

// ---------- วันที่ที่แพลนครอบคลุม ----------
let md;
try { md = readFileSync(PLAN, 'utf8'); }
catch { console.error(`❌ ไม่มีไฟล์ ${PLAN}`); process.exit(1); }

const TH_MON = { 'ม.ค.':1,'ก.พ.':2,'มี.ค.':3,'เม.ย.':4,'พ.ค.':5,'มิ.ย.':6,'ก.ค.':7,'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12 };
const year = +todayTH.slice(0, 4);
const planDates = [];
for (const m of md.matchAll(/^###\s*🗓️[^\n]*?(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)/gm)) {
  const d = String(m[1]).padStart(2, '0'), mo = String(TH_MON[m[2]]).padStart(2, '0');
  planDates.push(`${year}-${mo}-${d}`);
}
const uniq = [...new Set(planDates)].sort();
if (!uniq.length) { console.error('❌ อ่านวันที่จากแพลนไม่ได้เลย — โครงไฟล์เปลี่ยน?'); process.exit(1); }

const last = uniq[uniq.length - 1];
const ahead = uniq.filter(d => d >= todayTH);

console.log(`\n🗓️  วันนี้ (เวลาไทย) ${todayTH}`);
console.log(`   แพลนครอบคลุม   ${uniq[0]} → ${last}  (${uniq.length} วันผลิต)`);
console.log(`   เหลือข้างหน้า   ${ahead.length} วันผลิต${ahead.length ? ' — ' + ahead.join(' · ') : ''}`);

// ---------- รอบที่ขายไปแล้วแต่เลยขอบแพลน ----------
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const r = await fetch(`${U}/rest/v1/mp_deliveries?select=delivery_date,customer_name,mp_type,round_no,total_rounds,box_count,status&delivery_date=gt.${last}&order=delivery_date.asc&limit=300`,
  { headers: { apikey: K, Authorization: 'Bearer ' + K } });
if (!r.ok) { console.error('❌ query ล้มเหลว', r.status); process.exit(1); }
const beyond = (await r.json()).filter(x => x.status !== 'cancelled' && x.status !== 'skip_requested');

if (beyond.length) {
  const boxes = beyond.reduce((s, x) => s + (x.box_count || 0), 0);
  const days = [...new Set(beyond.map(x => x.delivery_date))];
  console.log(`\n🔴 มีรอบที่ขายไปแล้ว เลยขอบแพลน: ${beyond.length} รอบ · ${boxes} กล่อง · ${days.length} วันผลิต`);
  console.log(`   ยาวถึง ${days[days.length - 1]}`);
  const byDay = {};
  beyond.forEach(x => (byDay[x.delivery_date] ??= []).push(`${x.customer_name} r${x.round_no}/${x.total_rounds}`));
  for (const d of days) console.log(`   · ${d} — ${byDay[d].length} รอบ`);
} else {
  console.log('\n🟢 ไม่มีรอบที่ขายแล้วเลยขอบแพลน');
}

// ---------- สรุป ----------
let code = 0;
console.log('');
if (ahead.length <= URGENT_DAYS) {
  console.log(`🚨 ด่วน — แพลนเหลือแค่ ${ahead.length} วันผลิต ต้องต่อแพลนคืนนี้`);
  code = 1;
} else if (ahead.length <= WARN_DAYS) {
  console.log(`⚠️  เตือน — แพลนเหลือ ${ahead.length} วันผลิต (เกณฑ์ ${WARN_DAYS}) เริ่มวางต่อได้แล้ว`);
  code = 1;
} else {
  console.log(`✅ แพลนยังพอ (เหลือ ${ahead.length} วันผลิต)`);
}
if (beyond.length) {
  console.log(`   ⛑️  และมีลูกค้าที่จ่ายเงินแล้ว ${beyond.length} รอบ รอเมนูอยู่หลังวันที่ ${last} — คนพวกนี้เปิด LIFF แล้วเห็นว่า "ครัวยังไม่จัดเมนู"`);
  code = 1;
}
console.log('');
process.exitCode = code;

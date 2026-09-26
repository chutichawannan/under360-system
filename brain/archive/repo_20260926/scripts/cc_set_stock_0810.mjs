// ═══════════════════════════════════════════════════════════════
// ลงยอดสต็อกจริงที่ครัวนับมา (กลุ่ม Under Crew · 10 ส.ค. 2026)
// ═══════════════════════════════════════════════════════════════
// ทำไม: ครัวนับครบทุกตัวแล้ว แต่ตัวเลขอยู่ในแชท ระบบยังเป็น 0 หมด
//       → ฟ้าสรุปยอดให้ครัวไม่ได้ · ลูกค้าสั่งเกินของที่มีได้
// เขียนอะไร: stock_total (= เลขที่คุมยอดขาย ลูกค้าสั่งเกินไม่ได้) + actual_stock (บันทึกของครัว)
// รัน:  node scripts/cc_set_stock_0810.mjs          (ดูอย่างเดียว ไม่เขียน)
//       node scripts/cc_set_stock_0810.mjs --apply  (เขียนจริง · สำรองลงไฟล์ก่อนเสมอ)
import fs from 'node:fs';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const APPLY = process.argv.includes('--apply');

// ── ยอดที่ครัวรายงาน (ถอดจากแชทกลุ่ม Under Crew) ──
// อู — ข้าวกล่องเมนูประจำ
const NO = { No1:3, No2:11, No3:14, No4:7, No5:5, No6:21, No7:11, No8:16, No9:15,
             No10:20, No11:7, No12:7, No13:16, No14:10, No15:0 };
// โว๊ — แพ็คกับข้าว
const A = { A1:31, A2:14, A3:36, A4:14, A5:13, A6:23, A7:7, A8:39, A9:28, A10:6,
            A11:13, A12:22, A13:16, A14:22, A15:8, A16:21, A17:17, A18:7, A19:19, A20:14 };
// โม๋ข่อง — เมนูพิเศษสัปดาห์ที่ 9 (อ้างด้วยชื่อเล่น)
const S = { S1:2, S2:9, S3:9, S4:10, S5:9, S6:8, S7:8, S8:7 };
// โม๋ข่อง — ของเหลือสัปดาห์ก่อน (x 1 ตัว = เลยมา 1 สัปดาห์ · xx = 2 สัปดาห์)
const X = { S021:3, S205:3, S105:2 };   // XS3 กุ้งอบวุ้นเส้น · XS8 ข้าวผัดกิมจิ · XXS ข้าวแซลมอนย่างเกลือ

const get = async (q) => (await fetch(B + q, { headers: H })).json();
const all = await get('menu_items?select=id,code,subcode,name,stock_total,actual_stock,is_available&limit=1000');
const byCode = new Map(all.map(m => [String(m.code).toLowerCase(), m]));
const bySub  = (s) => all.filter(m => String(m.subcode || '').toLowerCase() === s.toLowerCase());

const plan = [];
const skip = [];
const add = (m, qty, src) => {
  if (!m) return;
  plan.push({ id: m.id, code: m.code, name: m.name, qty,
              was: m.stock_total === null ? 'ไม่จำกัด' : m.stock_total, src });
};
for (const [c, q] of Object.entries({ ...NO, ...A })) {
  const m = byCode.get(c.toLowerCase());
  m ? add(m, q, c) : skip.push(c + ' — ไม่พบโค้ดนี้ในระบบ');
}
for (const [s, q] of Object.entries(S)) {
  const l = bySub(s);
  if (l.length === 1) add(l[0], q, 'ชื่อเล่น ' + s);
  else skip.push(s + ' — ' + (l.length ? 'ชื่อเล่นซ้ำ ' + l.length + ' เมนู' : 'ยังไม่มีใครตั้งชื่อเล่นนี้'));
}
for (const [c, q] of Object.entries(X)) {
  const m = byCode.get(c.toLowerCase());
  m ? add(m, q, 'ของเหลือสัปดาห์ก่อน') : skip.push(c + ' — ไม่พบ');
}

console.log('จะตั้งสต็อก ' + plan.length + ' เมนู' + (APPLY ? '  ⚠️ โหมดเขียนจริง' : '  (ดูอย่างเดียว)') + '\n');
console.log('โค้ด    เมนู                              เดิม        →  ใหม่   ที่มา');
plan.forEach(p => console.log('  ' + String(p.code).padEnd(6) + String(p.name).slice(0, 30).padEnd(32) +
  String(p.was).padStart(9) + '  →  ' + String(p.qty).padStart(4) + '   ' + p.src));
if (skip.length) { console.log('\n⏭ ข้ามไว้ ต้องเคาะก่อน:'); skip.forEach(s => console.log('   · ' + s)); }

if (!APPLY) { console.log('\n(ยังไม่เขียนอะไร — เติม --apply ถ้าจะลงจริง)'); process.exit(0); }

// สำรองค่าเดิมก่อนเขียนเสมอ
const stamp = '2026-08-10';
const bak = `download/stock_backup_${stamp}.json`;
fs.mkdirSync('download', { recursive: true });
fs.writeFileSync(bak, JSON.stringify(plan.map(p => ({ id: p.id, code: p.code, stock_total_เดิม: p.was })), null, 1));
console.log('\n💾 สำรองค่าเดิมไว้ที่ ' + bak);

let ok = 0, fail = 0;
for (const p of plan) {
  const r = await fetch(B + 'menu_items?id=eq.' + p.id, { method: 'PATCH', headers: H,
    body: JSON.stringify({ stock_total: p.qty, actual_stock: p.qty }) });
  r.ok ? ok++ : (fail++, console.log('   ❌ ' + p.code + ' — ' + r.status + ' ' + (await r.text()).slice(0, 120)));
}
console.log(`\n✅ ลงแล้ว ${ok} เมนู` + (fail ? ` · พลาด ${fail}` : ''));

const after = await get('menu_items?select=code,stock_total&stock_total=not.is.null&limit=1000');
console.log('ตอนนี้เมนูที่มีเพดานสต็อกในระบบ: ' + after.length + ' ตัว (เดิม 22)');

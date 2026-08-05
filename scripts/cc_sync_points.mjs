// sync แต้มคงเหลือจากรายงาน Hato รอบสุดท้าย -> customers.loyalty_points
// นัทเคาะ 5 ส.ค. 2026: "ยึด Hato" (ลูกค้าเห็นเลขของ Hato อยู่จนถึงวันปิดระบบ)
// ปลอดภัย: สำรองค่าเดิมลง CSV ก่อนเขียนเสมอ · ไม่แตะ tier/ข้อมูลอื่น
// รัน dry-run:  node scripts/cc_sync_points.mjs
// รันจริง:      node scripts/cc_sync_points.mjs --apply
import fs from 'node:fs';

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const DIR = 'download/hato_final';
const APPLY = process.argv.includes('--apply');

const rows = (() => {
  const t = fs.readFileSync(`${DIR}/member_matched.csv`, 'utf8').replace(/^﻿/, '').split('\n');
  const hdr = t.shift().split(',');
  return t.filter(Boolean).map(l => {
    const v = (l.match(/"([^"]*)"/g) || []).map(s => s.slice(1, -1));
    return Object.fromEntries(hdr.map((h, i) => [h, v[i]]));
  });
})();

// ค่าปัจจุบันใน DB
const cur = [];
for (let off = 0; off < 20000; off += 1000) {
  const r = await fetch(`${B}/customers?select=id,loyalty_points,tier,display_name&limit=1000&offset=${off}&order=id`, { headers: H });
  const j = await r.json();
  if (!j.length) break;
  cur.push(...j);
  if (j.length < 1000) break;
}
const db = new Map(cur.map(c => [c.id, c]));

const todo = [];
for (const r of rows) {
  const c = db.get(r.customer_id);
  if (!c) continue;
  const hato = Number(r.points || 0), old = Number(c.loyalty_points || 0);
  if (hato !== old) todo.push({ id: c.id, name: c.display_name || '', old, hato, diff: hato - old });
}

console.log(`ต้องแก้ ${todo.length} คน · แต้มรวมเปลี่ยน ${todo.reduce((s, x) => s + x.diff, 0)}`);
console.log(`  ลดลง ${todo.filter(x => x.diff < 0).length} คน · เพิ่มขึ้น ${todo.filter(x => x.diff > 0).length} คน`);
console.log('  ตัวอย่าง 5:', todo.slice(0, 5).map(x => `${x.name || x.id.slice(0, 6)} ${x.old}->${x.hato}`).join(' , '));

if (!APPLY) { console.log('\n[DRY RUN] ยังไม่เขียน — ใส่ --apply เพื่อเขียนจริง'); process.exit(0); }

// สำรองก่อนเขียน
const bak = `${DIR}/backup_points_before_sync.csv`;
fs.writeFileSync(bak, '﻿customer_id,display_name,points_before,points_after\n' +
  todo.map(x => `"${x.id}","${String(x.name).replace(/"/g, '""')}",${x.old},${x.hato}`).join('\n'), 'utf8');
console.log('สำรองค่าเดิม ->', bak);

let ok = 0, fail = 0;
for (const x of todo) {
  const r = await fetch(`${B}/customers?id=eq.${x.id}`, {
    method: 'PATCH', headers: H, body: JSON.stringify({ loyalty_points: x.hato }),
  });
  if (r.ok) ok++; else { fail++; if (fail <= 3) console.log('  fail', x.id, r.status, (await r.text()).slice(0, 120)); }
}
console.log(`เขียนสำเร็จ ${ok} · ล้มเหลว ${fail}`);

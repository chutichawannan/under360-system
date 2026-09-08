#!/usr/bin/env node
/**
 * ⏱️ ทำนายเวลาครัวทำคอร์สเสร็จ + เตือนวันที่จะทะลุเพดาน 16:00
 *
 *   node scripts/fah_predict_finish.mjs            ดูเฉยๆ
 *   node scripts/fah_predict_finish.mjs --write    เขียนตารางทำนายลง docs/MP_FINISH_TIMES.md
 *
 * 🧭 เกณฑ์ที่นัทเคาะเอง 8 ก.ย. 2026 (ผ่านเลขา) — ใช้เป็นเกณฑ์ถาวร:
 *    · ครัวทำอาหารเสร็จ **ช้าสุดควรไม่เกิน 16:00**
 *    · จัดของให้งบเพิ่ม 3 ชม. → **ตอกออกไม่ควรเกิน 19:00**
 *
 * 📐 สูตรมาจากของจริง 9 วัน (docs/MP_FINISH_TIMES.md):
 *      เสร็จ = 08:00 + 80 นาที + (กล่อง x 3 นาที)
 *    ทายคลาด 1-4 นาที ในวันกล่องเยอะ (26 ส.ค. · 31 ส.ค. · 7 ก.ย.)
 *    วันกล่องน้อย (<60) สูตรทายเร็วเกินจริง 30-50 นาที — ครัวมีงานอื่นแทรก ไม่ได้ทำรวดเดียว
 *
 * ⚠️ สูตรนี้อธิบายด้วย **จำนวนกล่อง** อย่างเดียว
 *    เคยเชื่อกันว่า "เมนูหลากหลาย = ช้า" — ตรวจแล้ว **ไม่จริง**
 *    (31 ส.ค. ช้าสุด 15:54 มีแค่ 9 เมนู · 2 ก.ย. 15 เมนู เสร็จ 12:26)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: 'Bearer ' + K } })).json();

const START_MIN = 8 * 60;      // ครัวเข้า 08:00
const SETUP_MIN = 80;          // เวลาตั้งต้นก่อนเดินสายพาน
const PER_BOX_MIN = 3;         // ต่อ 1 กล่อง
const CEILING_MIN = 16 * 60;   // 🔴 เพดานที่นัทเคาะ — เสร็จช้าสุด 16:00
const PACK_MIN = 3 * 60;       // งบจัดของ 3 ชม. → ตอกออก
const MAX_BOXES = Math.floor((CEILING_MIN - START_MIN - SETUP_MIN) / PER_BOX_MIN);  // = 133

const hhmm = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const predict = boxes => START_MIN + SETUP_MIN + boxes * PER_BOX_MIN;

const WRITE = process.argv.includes('--write');
const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
const DOW = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];
const MON = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

const rows = (await q(`mp_deliveries?select=delivery_date,box_count,status,menu_items&delivery_date=gte.${today}&limit=400`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested');
const by = {};
for (const r of rows) {
  const d = (by[r.delivery_date] = by[r.delivery_date] || { box: 0, codes: new Set() });
  d.box += r.box_count || 0;
  for (const i of (r.menu_items || [])) {
    const c = String(i.code || '').replace(/^(LC|HP|HX)/, '');
    if (c) d.codes.add(c);
  }
}

console.log(`⏱️ ทำนายเวลาเสร็จ (เกณฑ์นัท: เสร็จไม่เกิน 16:00 · ตอกออกไม่เกิน ${hhmm(CEILING_MIN + PACK_MIN)})\n`);
console.log(`   เพดานกำลังผลิตที่คำนวณได้: **${MAX_BOXES} กล่อง/วัน** ถ้าเกินนี้ จะเสร็จหลัง 16:00 แน่นอน\n`);

const out = [];
const alerts = [];
for (const d of Object.keys(by).sort()) {
  const { box, codes } = by[d];
  const dt = new Date(d + 'T00:00:00Z');
  const label = `${DOW[dt.getUTCDay()]} ${dt.getUTCDate()} ${MON[dt.getUTCMonth()]}`;
  const p = predict(box);
  // วันกล่องน้อยสูตรทายเร็วเกินจริง → ให้ช่วงกว้างขึ้น
  const lo = p, hi = p + (box < 60 ? 45 : 15);
  const over = p > CEILING_MIN;
  const flag = over ? ' 🔴 เกิน 16:00' : (hi > CEILING_MIN ? ' 🟡 เฉียด' : '');
  console.log(`   ${label.padEnd(14)} ${String(box).padStart(3)} กล่อง · ${String(codes.size).padStart(2)} เมนู → ${hhmm(lo)}–${hhmm(hi)}${flag}`);
  out.push(`| **${label}** | ${box} | ${codes.size} | **~${hhmm(lo)}–${hhmm(hi)}** | ${hhmm(hi + PACK_MIN)} |`);
  if (over) alerts.push(`${label}: ${box} กล่อง → ทายเสร็จ ${hhmm(p)} เกินเพดาน 16:00 ที่นัทเคาะ (เกิน ${p - CEILING_MIN} นาที)`);
}

if (alerts.length) {
  console.log('\n🔴 วันที่จะทะลุเพดาน — ต้องรู้ล่วงหน้า ไม่ใช่รู้ตอนเย็นวันนั้น:');
  alerts.forEach(a => console.log('   · ' + a));
  console.log('   ทางเลือก: เกลี่ยรอบไปวันอื่น · เพิ่มคน · หรือยอมรับว่าวันนั้นตอกออกดึก');
}

if (WRITE) {
  const F = 'docs/MP_FINISH_TIMES.md';
  if (!existsSync(F)) { console.log(`\n⚠️ ไม่มี ${F} — ไม่เขียน`); process.exit(0); }
  const head = '## 🔮 ทำนายล่วงหน้า (สคริปต์เขียนเองทุกครั้งที่ทำใบงาน)';
  const block = [
    head, '',
    `> เกณฑ์นัท 8 ก.ย. 2026: **เสร็จช้าสุดไม่เกิน 16:00 · จัดของ +3 ชม. → ตอกออกไม่เกิน 19:00**`,
    `> เพดานกำลังผลิตที่คำนวณจากสูตร: **${MAX_BOXES} กล่อง/วัน**`,
    `> อัปเดต ${new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')} (เวลาไทย)`, '',
    '| วัน | กล่อง | เมนู | ทายว่าเสร็จ | ตอกออกไม่ควรเกิน |', '|---|---:|---:|---|---|',
    ...out, '',
    alerts.length ? '🔴 **เกินเพดาน:** ' + alerts.join(' · ') + '\n' : '✅ ทุกวันข้างหน้าอยู่ในเพดาน 16:00\n',
    '**เจอวันที่เสร็จช้ากว่าที่ทายเกิน 1 ชม. = มีเหตุจริง ให้ถามครัววันนั้น** (แบบ 4 ก.ย. ที่ช้ากว่าทาย 2 ชม.)',
  ].join('\n');
  let md = readFileSync(F, 'utf8');
  const i = md.indexOf(head);
  if (i >= 0) {
    const nxt = md.indexOf('\n## ', i + head.length);
    md = md.slice(0, i) + block + '\n' + (nxt >= 0 ? md.slice(nxt + 1) : '');
  } else md = md.trimEnd() + '\n\n' + block + '\n';
  writeFileSync(F, md);
  console.log(`\n✅ เขียนตารางทำนายลง ${F}`);
}

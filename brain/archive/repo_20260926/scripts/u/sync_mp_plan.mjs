/* 📅 ส่งแพลนเมนู Meal Plan ของห้องฟ้า → ที่ที่หน้าลูกค้าอ่านจริง
   (u-maintainer · 1 ก.ย. 2569)

   ปัญหาที่แก้ — เจอจริงวันนี้ หลังห้อง m ตามรอยมาให้:
     หน้าลูกค้าอ่านปฏิทินเมนูจาก kitchen_data คีย์ 'mp_menu_plan'
     แต่ **คีย์นั้นไม่เคยมีแถวอยู่เลย** ตั้งแต่เขียนโค้ดมา
     → ตกไปใช้ไฟล์สำรอง preview/mp_plan_seed.json ที่แก้ล่าสุด 20 ส.ค.
     → ลูกค้าเห็นเมนูค้างของเก่า และ **หลัง 4 ก.ย. ปฏิทินจะว่าง = สั่ง Meal Plan ไม่ได้เลย**
     ที่อันตรายที่สุดคือ **ไม่มีอะไรฟ้อง** — ตัวสำรองทำงาน "สำเร็จ" ทุกครั้ง

   วิธี: ใช้ตัวแปลงของห้อง m (scripts/m_build_mp_plan_json.mjs) เป็นตัวแปลงกลางตัวเดียว
        ไม่เขียน logic แปลงซ้ำ — ถ้าเขาแก้กติกา (เช่นเมนูที่ระงับ) ฝั่งนี้ตามทันทีเอง
        รันซ้ำได้ตลอด · ไม่มี argument = ดูอย่างเดียว ไม่เขียน

   วิธีใช้:
     node scripts/u/sync_mp_plan.mjs        ← ดูว่าจะเปลี่ยนอะไร (ไม่เขียน)
     node scripts/u/sync_mp_plan.mjs go     ← เขียนจริง
*/
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const H  = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const GO = process.argv[2] === 'go';
const DOW = ['อา','จ','อ','พ','พฤ','ศ','ส'];
const today = new Date(Date.now() + 7*3600e3).toISOString().slice(0,10);   // วันไทยเสมอ

// ── 1) แปลงจากตารางของห้องฟ้า (ใช้ตัวแปลงของห้อง m) ───────────────────
execSync('node scripts/m_build_mp_plan_json.mjs', { stdio: 'inherit' });
const built = JSON.parse(fs.readFileSync('web/mp_plan.json', 'utf8'));
const plan = built.plan || {};
const days = Object.keys(plan).sort();
if (!days.length) { console.error('❌ แปลงไม่ได้สักวัน — หยุดไว้ก่อน ไม่เขียนทับของเดิม'); process.exit(1); }

// ── 2) เทียบกับของที่ลูกค้าเห็นอยู่จริงตอนนี้ ─────────────────────────
const cur = await (await fetch(`${SB}/kitchen_data?key=eq.mp_menu_plan&select=data`, { headers: H })).json();
const now = (cur[0] && cur[0].data) || null;
const nowDays = now ? Object.keys(now).sort() : [];
const ahead = d => d.filter(x => x > today);

console.log('\n═══ เทียบก่อน–หลัง (วันไทย ' + today + ') ═══');
console.log(' ตอนนี้ในระบบ :', nowDays.length ? (nowDays.length + ' วัน · ถึง ' + nowDays[nowDays.length-1] + ' · เหลือให้ลูกค้าเลือก ' + ahead(nowDays).length + ' วัน')
                                              : '🔴 ว่าง — ลูกค้ากำลังเห็นไฟล์สำรองเก่า');
console.log(' หลังซิงก์   :', days.length + ' วัน · ถึง ' + days[days.length-1] + ' · เหลือให้ลูกค้าเลือก ' + ahead(days).length + ' วัน');

// ── 3) เขียน (รูปแบบต้องเป็น {วันที่: [เมนู]} ตรงๆ — หน้าลูกค้าอ่าน data.data โดยตรง) ──
if (!GO) { console.log('\n(ยังไม่เขียนจริง — ใส่ go ต่อท้ายเพื่อลงมือ)'); process.exit(0); }

const res = await fetch(`${SB}/kitchen_data`, {
  method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify({ key: 'mp_menu_plan', data: plan })
});
if (!res.ok) { console.error('🔴 เขียนไม่สำเร็จ:', (await res.text()).slice(0,200)); process.exit(1); }

// ── 4) อ่านซ้ำจากฐานข้อมูลยืนยัน ไม่เชื่อผลตอบกลับอย่างเดียว ──────────
const chk = await (await fetch(`${SB}/kitchen_data?key=eq.mp_menu_plan&select=data`, { headers: H })).json();
const got = (chk[0] && chk[0].data) || {};
const gotDays = Object.keys(got).sort();
const left = ahead(gotDays);
console.log('\n═══ อ่านซ้ำจากฐานข้อมูล ═══');
console.log(' เขียนแล้ว', gotDays.length, 'วัน · เมนูรวม', gotDays.reduce((s,d)=>s+(got[d]||[]).length,0), 'รายการ');
console.log(' วันที่ลูกค้าเลือกได้ต่อจากนี้:', left.length, 'วัน');
left.slice(0,6).forEach(d => console.log('   ', d, DOW[new Date(d+'T00:00:00Z').getUTCDay()], '·', (got[d]||[]).length, 'เมนู'));
if (left.length > 6) console.log('    … อีก', left.length - 6, 'วัน ถึง', left[left.length-1]);

// ── 5) เตือนล่วงหน้า — ไม่ให้เงียบหายซ้ำแบบเดิม ──────────────────────
const WARN = 14;
if (left.length === 0)      console.log('\n🔴 ไม่มีวันให้ลูกค้าเลือกเลย — สั่ง Meal Plan ไม่ได้ ต้องให้ห้องฟ้าเติมแพลนด่วน');
else if (left.length <= 3)  console.log('\n🔴 เหลือแค่', left.length, 'วัน — บอกห้องฟ้าเติมแพลนเดี๋ยวนี้');
else {
  const dLeft = Math.round((new Date(left[left.length-1]) - new Date(today)) / 86400000);
  if (dLeft <= WARN) console.log('\n⚠️ แพลนหมดในอีก', dLeft, 'วัน (' + left[left.length-1] + ') — เริ่มทวงห้องฟ้าได้แล้ว');
  else               console.log('\n✅ แพลนยาวถึง', left[left.length-1], '(อีก', dLeft, 'วัน)');
}

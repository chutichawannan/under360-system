#!/usr/bin/env node
/**
 * สร้างไฟล์ตารางเมนูรายวันสำหรับเว็บ (หน้า /mealplan ของห้อง m) จากข้อมูลจริงใน DB
 *
 *   node scripts/fah_build_web_plan.mjs
 *
 * เดิมไฟล์นี้เขียนมือจากแพลนที่วางไว้ → พอคิวจริงขยับ ไฟล์กับของจริงไม่ตรงกัน
 * (4 ก.ย. เว็บโชว์ 8 เมนู · ครัวทำจริง 9 · แพลนไฟล์บางวันมี 14 ทั้งที่ผลิต 9)
 * → ตอนนี้สร้างจาก `mp_deliveries.menu_items` ของแต่ละวันตรงๆ = เว็บเห็นสิ่งที่ครัวทำจริง
 */
import { writeFileSync } from 'node:fs';
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: 'Bearer ' + K } })).json();

const FROM = '2026-08-21', TO = '2026-10-05';
const DOW = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];
const MON = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

const rows = (await q(`mp_deliveries?select=delivery_date,status,menu_items&delivery_date=gte.${FROM}&delivery_date=lte.${TO}&limit=500`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested' && Array.isArray(r.menu_items) && r.menu_items.length);
const codes = [...new Set(rows.flatMap(r => r.menu_items.map(i => String(i.code))))];
const mi = [];
for (let i = 0; i < codes.length; i += 60) mi.push(...await q(`menu_items?select=code,name&code=in.(${codes.slice(i, i + 60).join(',')})&limit=200`));
const nameOf = Object.fromEntries(mi.map(x => [x.code, x.name]));
const protOf = n => {
  const s = String(n || '');
  if (/ทูน่า/.test(s)) return 'ทะเล (ทูน่า)';
  if (/แซลมอน/.test(s)) return 'ทะเล (แซลมอน)';
  if (/กุ้ง/.test(s)) return 'ทะเล (กุ้ง)';
  if (/ปลา/.test(s)) return 'ทะเล';
  if (/เนื้อ(?!อ่อน)/.test(s)) return 'เนื้อ';
  if (/หมู/.test(s)) return 'หมู';
  if (/ไก่/.test(s)) return 'ไก่';
  if (/เต้าหู้/.test(s)) return 'เต้าหู้';
  if (/ไข่/.test(s)) return 'ไข่';
  return '—';
};

const byDay = {};
for (const r of rows) {
  const set = (byDay[r.delivery_date] = byDay[r.delivery_date] || new Map());
  for (const i of r.menu_items) {
    const num = String(i.code || '').replace(/^(LC|HP|HX)/, '');
    if (!set.has(num)) set.set(num, nameOf[String(i.code)] || i.name || num);
  }
}

let md = `# 🍽️ ตารางเมนู Meal Plan รายวัน (สำหรับหน้าเว็บ /mealplan)\n\n`;
md += `> **สร้างอัตโนมัติจากข้อมูลจริงใน DB** — \`node scripts/fah_build_web_plan.mjs\`\n`;
md += `> อัปเดตล่าสุด ${new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')} (เวลาไทย) · ครอบคลุม ${FROM} – ${TO}\n\n`;
md += `## ⚠️ อ่านก่อนเอาไปขึ้นเว็บ\n\n`;
md += `1. **นี่คือชุดเมนูที่ครัวผลิตจริงในวันนั้น** — ลูกค้าแต่ละคนได้ 7 กล่องจากรายการนี้ ไม่ใช่ทั้งหมด\n`;
md += `2. **Meal Plan ผลิตเฉพาะ จันทร์ / พุธ / ศุกร์** — วันอื่นครัวทำอย่างอื่น\n`;
md += `3. 🔴 **ห้ามเขียนว่า "เลือกวันส่งได้"** สำหรับ Meal Plan (กฎแบรนด์ — คอร์สสต็อคเท่านั้นที่เลือกวันได้)\n`;
md += `4. ทุกเมนูทำได้ทั้ง **HP (เนื้อ 170g)** และ **LC (เนื้อ 120g)** — โปรโมทคู่กันเสมอ\n`;
md += `5. วันในอนาคตยังขยับได้ถ้าคิวเปลี่ยน — **ดึงไฟล์นี้ใหม่ทุกครั้งที่จะแสดง อย่าก๊อปไปแปะนิ่ง**\n\n`;
md += `| วันที่ | วันในสัปดาห์ | โค้ด | ชื่อเมนู | โปรตีน |\n|---|---|---|---|---|\n`;
let days = 0, lines = 0;
for (const date of Object.keys(byDay).sort()) {
  const d = new Date(date + 'T00:00:00');
  const label = `${d.getDate()} ${MON[d.getMonth()]}`;
  days++;
  for (const [code, name] of [...byDay[date].entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    md += `| ${label} | ${DOW[d.getDay()]} | LC${code}/HP${code} | ${name} | ${protOf(name)} |\n`;
    lines++;
  }
}
md += `\n**รวม ${days} วันผลิต · ${lines} รายการ**\n`;
writeFileSync('docs/FAH_MENU_PLAN_FOR_WEB.md', md);
console.log(`✅ เขียน docs/FAH_MENU_PLAN_FOR_WEB.md — ${days} วัน · ${lines} แถว`);
for (const date of Object.keys(byDay).sort()) console.log(`   ${date}  ${byDay[date].size} เมนู`);

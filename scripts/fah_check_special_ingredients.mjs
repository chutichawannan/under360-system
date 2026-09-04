#!/usr/bin/env node
/**
 * เตือนล่วงหน้า: วัตถุดิบที่ต้องหาก่อน (อโวคาโด · แผ่นแร็ป · มันม่วง ฯลฯ)
 *
 *   node scripts/fah_check_special_ingredients.mjs [มองล่วงหน้ากี่วัน=7]
 *
 * นัทสั่งเอง 3 ก.ย. 2026:
 *   *"เตือนฉันล่วงหน้า 2-3 วันหน่อย เราจะต้องหาวัตถุดิบล่วงหน้า 2-3 วัน
 *     เจอรอบไหนมีอโวคาโด และแผ่นแร็ป แจ้งฉันด้วย เช่น อีก 4 วันมีใช้อโวคาโด"*
 *
 * 📒 แหล่งความจริง = `docs/FAH_INGREDIENT_NOTES.md` (สมุดจดที่นัท/ครัวยืนยัน)
 *    ชนะการเดาจากชื่อเมนูเสมอ — เช่น เมนู 45 ชื่อมี "เครป" แต่ **แป้งเครปครัวทำเอง**
 *    ที่ต้องหาจริงคือ **มันม่วง** (นัทบอกเอง 3 ก.ย.)
 *    เมนูที่ยังไม่มีในสมุด → เดาจากชื่อไปก่อน แล้วขึ้นป้าย "ยังไม่ยืนยัน"
 */
import { readFileSync } from 'node:fs';
const AHEAD = Number(process.argv[2] || 7);
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: 'Bearer ' + K } })).json();

// ---------- 📒 อ่านสมุดจด ----------
const NOTES = 'docs/FAH_INGREDIENT_NOTES.md';
const noted = {};   // code -> { need:[], note, by }
try {
  for (const line of readFileSync(NOTES, 'utf8').split('\n')) {
    const m = line.match(/^\|\s*(\d{2})\s*\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|/);
    if (!m) continue;
    const need = m[3].trim();
    noted[m[1]] = {
      need: need === '-' || !need ? [] : need.split(/[,·]/).map(s => s.trim()).filter(Boolean),
      note: m[4].trim(),
      by: m[5].trim(),
      confirmed: !/ยังไม่ยืนยัน|ชื่อเมนู/.test(m[5]),
    };
  }
} catch { console.log(`⚠️ ไม่มี ${NOTES} — ใช้การเดาจากชื่อเมนูอย่างเดียว`); }

// ---------- เดาจากชื่อ (เฉพาะเมนูที่ยังไม่มีในสมุด) ----------
const GUESS = [
  { name: 'อโวคาโด', re: /อโวคาโด|อาโวคาโด|avocado/i },
  { name: 'แผ่นแร็ป', re: /แรป|แร๊ป|แร็ป|wrap|ตอร์ติญ่า|ทอร์ติญ่า/i },
];
const ICON = { 'อโวคาโด': '🥑', 'แผ่นแร็ป': '🌯', 'มันม่วง': '🍠', 'แป้งเครป': '🥞' };
const ic = s => (ICON[s] || '🧺') + ' ' + s;

const nowTH = new Date(Date.now() + 7 * 3600 * 1000);
const today = nowTH.toISOString().slice(0, 10);
const until = new Date(nowTH.getTime() + AHEAD * 86400000).toISOString().slice(0, 10);

const rows = (await q(`mp_deliveries?select=delivery_date,status,menu_items&delivery_date=gte.${today}&delivery_date=lte.${until}&order=delivery_date.asc&limit=300`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested' && Array.isArray(r.menu_items));
const codes = [...new Set(rows.flatMap(r => r.menu_items.map(i => String(i.code))))];
const mi = [];
for (let i = 0; i < codes.length; i += 60) mi.push(...await q(`menu_items?select=code,name&code=in.(${codes.slice(i, i + 60).join(',')})&limit=200`));
const nameOf = Object.fromEntries(mi.map(x => [x.code, x.name]));

const found = {};
const unknown = new Set();
for (const r of rows) {
  for (const i of r.menu_items) {
    const code = String(i.code), num = code.replace(/^(LC|HP|HX)/, '');
    const name = nameOf[code] || i.name || code;
    const qty = Number(i.qty) || 1;
    let needs = null, confirmed = false;
    if (noted[num]) { needs = noted[num].need; confirmed = noted[num].confirmed; }
    else {
      needs = GUESS.filter(g => g.re.test(name)).map(g => g.name);
      if (needs.length) unknown.add(`${num} ${name}`);
    }
    for (const nd of needs) {
      const day = (found[r.delivery_date] = found[r.delivery_date] || {});
      const kind = (day[nd] = day[nd] || { total: 0, menus: {}, confirmed });
      kind.total += qty;
      kind.menus[`${num} ${name}`] = (kind.menus[`${num} ${name}`] || 0) + qty;
      if (!confirmed) kind.confirmed = false;
    }
  }
}

const DOW = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];
const days = Object.keys(found).sort();
console.log(`\n🛒 วัตถุดิบที่ต้องหาล่วงหน้า — มองไป ${AHEAD} วัน (${today} → ${until})\n`);
if (!days.length) console.log('✅ ไม่มีเมนูที่ต้องหาของล่วงหน้าในช่วงนี้\n');
for (const d of days) {
  const left = Math.round((new Date(d) - new Date(today)) / 86400000);
  const when = left === 0 ? 'วันนี้' : left === 1 ? 'พรุ่งนี้' : `อีก ${left} วัน`;
  console.log(`📅 ${when} — ${DOW[new Date(d + 'T00:00:00').getDay()]} ${d.slice(8)}/${d.slice(5, 7)}${left <= 3 ? '   ⚠️ ต้องหาของแล้ว' : ''}`);
  for (const [nd, v] of Object.entries(found[d])) {
    console.log(`   ${ic(nd)} — รวม ${v.total} กล่อง${v.confirmed ? '' : '  (เดาจากชื่อเมนู ยังไม่ยืนยัน)'}`);
    Object.entries(v.menus).forEach(([m, n]) => console.log(`      · ${m} = ${n} กล่อง`));
  }
  console.log('');
}
if (unknown.size) {
  console.log(`📒 เมนูที่ยังไม่มีในสมุดจด (${NOTES}) — เดาจากชื่อไปก่อน ควรให้นัท/ครัวยืนยัน:`);
  [...unknown].sort().forEach(x => console.log(`   · ${x}`));
  console.log('');
}

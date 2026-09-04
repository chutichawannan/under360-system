#!/usr/bin/env node
/**
 * เตือนล่วงหน้า: วัตถุดิบที่ต้องหาก่อน (อโวคาโด · แผ่นแร็ป ฯลฯ)
 *
 *   node scripts/fah_check_special_ingredients.mjs [มองล่วงหน้ากี่วัน=7]
 *
 * นัทสั่งเอง 3 ก.ย. 2026:
 *   *"เตือนฉันล่วงหน้า 2-3 วันหน่อย เราจะต้องหาวัตถุดิบล่วงหน้า 2-3 วัน
 *     เจอรอบไหนมีอโวคาโด และแผ่นแร็ป แจ้งฉันด้วย เช่น อีก 4 วันมีใช้อโวคาโด"*
 *
 * ต่างจากใบสั่งของรายวัน: ใบนั้นออกเย็นก่อนวันผลิต = สายเกินไปสำหรับของที่ต้องสั่งล่วงหน้า
 * ตัวนี้มองไปข้างหน้าเป็นสัปดาห์ เพื่อให้มีเวลาไปหาของ
 */
const AHEAD = Number(process.argv[2] || 7);
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: 'Bearer ' + K } })).json();

// ⚠️ จับจาก "ชื่อเมนู" เพราะระบบไม่มีรายการวัตถุดิบต่อเมนู (มีสูตรจริงแค่ 15 จาก 107 เมนู)
//    → ถ้าเมนูไหนใช้ของพวกนี้แต่ชื่อไม่บอก จะจับไม่ได้ — เพิ่มโค้ดเข้า EXTRA ได้เลย
const WATCH = [
  { key: '🥑 อโวคาโด', re: /อโวคาโด|อาโวคาโด|avocado/i, extra: [] },
  { key: '🌯 แผ่นแร็ป', re: /แรป|แร๊ป|แร็ป|wrap|ตอร์ติญ่า|ทอร์ติญ่า/i, extra: [] },
  { key: '🥞 แผ่นเครป', re: /เครป/i, extra: [] },
];

const nowTH = new Date(Date.now() + 7 * 3600 * 1000);
const today = nowTH.toISOString().slice(0, 10);
const until = new Date(nowTH.getTime() + AHEAD * 86400000).toISOString().slice(0, 10);

const rows = (await q(`mp_deliveries?select=delivery_date,customer_name,mp_type,box_count,status,menu_items&delivery_date=gte.${today}&delivery_date=lte.${until}&order=delivery_date.asc&limit=300`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested' && Array.isArray(r.menu_items));

const codes = [...new Set(rows.flatMap(r => r.menu_items.map(i => String(i.code))))];
const mi = [];
for (let i = 0; i < codes.length; i += 60) mi.push(...await q(`menu_items?select=code,name&code=in.(${codes.slice(i, i + 60).join(',')})&limit=200`));
const nameOf = Object.fromEntries(mi.map(x => [x.code, x.name]));

// วัน → ชนิดของ → { เมนู: จำนวนกล่อง }
const found = {};
for (const r of rows) {
  for (const i of r.menu_items) {
    const code = String(i.code), name = nameOf[code] || i.name || code;
    const num = code.replace(/^(LC|HP|HX)/, '');
    for (const w of WATCH) {
      if (!w.re.test(name) && !w.extra.includes(num)) continue;
      const day = (found[r.delivery_date] = found[r.delivery_date] || {});
      const kind = (day[w.key] = day[w.key] || {});
      kind[`${num} ${name}`] = (kind[`${num} ${name}`] || 0) + (Number(i.qty) || 1);
    }
  }
}

const days = Object.keys(found).sort();
console.log(`\n🛒 วัตถุดิบที่ต้องหาล่วงหน้า — มองไป ${AHEAD} วัน (${today} → ${until})\n`);
if (!days.length) { console.log('✅ ไม่มีเมนูที่ใช้ของพิเศษในช่วงนี้\n'); process.exit(0); }

const DOW = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];
for (const d of days) {
  const left = Math.round((new Date(d) - new Date(today)) / 86400000);
  const when = left === 0 ? 'วันนี้' : left === 1 ? 'พรุ่งนี้' : `อีก ${left} วัน`;
  const dow = DOW[new Date(d + 'T00:00:00').getDay()];
  console.log(`📅 ${when} — ${dow} ${d.slice(8)}/${d.slice(5, 7)}${left <= 3 ? '   ⚠️ ต้องหาของแล้ว' : ''}`);
  for (const [kind, menus] of Object.entries(found[d])) {
    const total = Object.values(menus).reduce((a, b) => a + b, 0);
    console.log(`   ${kind} — รวม ${total} กล่อง`);
    Object.entries(menus).forEach(([m, n]) => console.log(`      · ${m} = ${n} กล่อง`));
  }
  console.log('');
}

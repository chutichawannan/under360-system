#!/usr/bin/env node
/**
 * ✅ เช็คลิสต์ก่อนปิดงานทุกครั้ง — ตรวจว่า "ทุกหน้าที่คนเห็น พูดตรงกัน"
 *
 *   node scripts/fah_verify_all.mjs
 *
 * นัทสั่งเอง 6 ก.ย. 2026: *"เมื่อไหร่จะเลิกผิดอะไรแบบนี้อีกนะ ตั้ง checklist ไว้ด้วยนะ
 *   แล้วมันต้องตรงทั้งหน้าเว็บและที่หน้าลิฟ ลูกค้าเห็นคนละที่มีปัญหาอีก"*
 *
 * 🗺️ ข้อมูลเมนูมี 4 หน้า ต้องพูดตรงกันเสมอ:
 *   1) `mp_deliveries.menu_items`      = กล่องของลูกค้าแต่ละคน (ครัวทำตามนี้)
 *   2) `order_items`                    = หน้าครัว KQ อ่านตัวนี้
 *   3) `kitchen_data.mp_menu_plan`      = **LIFF ที่ลูกค้ากดเลือกเมนู**
 *   4) `docs/FAH_MENU_PLAN_FOR_WEB.md`  = หน้าเว็บ /mealplan
 *   + ใบครัว/ใบจัดของใน `kitchen/`
 *
 * ⛔ เจอ 🔴 = ยังปิดงานไม่ได้ · ตัวนี้เป็นด่านสุดท้ายของ `fah_auto.mjs`
 */
import { readFileSync, existsSync } from 'node:fs';
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: 'Bearer ' + K } })).json();

const fails = [], warns = [];
const FAIL = m => fails.push(m);
const WARN = m => warns.push(m);
const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

// ---------- ดึงทุกแหล่ง ----------
const rows = (await q(`mp_deliveries?select=id,order_id,customer_name,mp_type,round_no,total_rounds,delivery_date,box_count,status,menu_items&delivery_date=gte.${today}&limit=400`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested');
const byDay = {};
rows.forEach(r => { (byDay[r.delivery_date] = byDay[r.delivery_date] || []).push(r); });
const codeSet = d => new Set((byDay[d] || []).flatMap(r => (r.menu_items || []).map(i => String(i.code || '').replace(/^(LC|HP|HX)/, ''))));

const kd = await q(`kitchen_data?select=data&key=eq.mp_menu_plan`);
const wrap = kd[0]?.data || {};
const liff = wrap.data || wrap;

const WEB = 'docs/FAH_MENU_PLAN_FOR_WEB.md';
const TH = {'ม.ค.':1,'ก.พ.':2,'มี.ค.':3,'เม.ย.':4,'พ.ค.':5,'มิ.ย.':6,'ก.ค.':7,'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12};
const RE = /^\|\s*(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*\|[^|]*\|\s*LC(\d+)\/HP\d+/;
const web = {};
if (existsSync(WEB)) for (const line of readFileSync(WEB, 'utf8').split('\n')) {
  const m = line.match(RE); if (!m) continue;
  const d = `2026-${String(TH[m[2]]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  (web[d] = web[d] || new Set()).add(m[3].padStart(2, '0'));
}
else FAIL(`ไม่มีไฟล์ ${WEB} — หน้าเว็บไม่มีข้อมูล`);

console.log(`\n✅ เช็คลิสต์ห้องฟ้า — ${today}\n`);
const days = Object.keys(byDay).sort();

// ---------- ① ลูกค้าเห็น (LIFF) ต้องครอบคลุมของที่ครัวทำ ----------
for (const d of days) {
  const real = codeSet(d);
  const shown = new Set((liff[d] || []).map(x => String(x.no)));
  const missing = [...real].filter(c => !shown.has(c));
  if (missing.length) FAIL(`① ${d}: ครัวจะทำ ${missing.join(',')} แต่ **ลูกค้าไม่เห็นใน LIFF** → ลูกค้าเลือกไม่ได้`);
}

// ---------- ② หน้าเว็บ ต้องตรงกับ LIFF ----------
for (const d of days) {
  const shown = new Set((liff[d] || []).map(x => String(x.no)));
  const w = web[d] || new Set();
  if (!shown.size) continue;
  const diffA = [...shown].filter(c => !w.has(c));
  const diffB = [...w].filter(c => !shown.has(c));
  if (diffA.length || diffB.length)
    FAIL(`② ${d}: **หน้าเว็บกับ LIFF ไม่ตรงกัน**` +
      (diffA.length ? ` · LIFF มีแต่เว็บไม่มี: ${diffA.join(',')}` : '') +
      (diffB.length ? ` · เว็บมีแต่ LIFF ไม่มี: ${diffB.join(',')}` : ''));
}

// ---------- ③ กล่องลูกค้า: เมนูครบตามจำนวนกล่อง ----------
for (const d of days) for (const r of byDay[d]) {
  const items = r.menu_items || [];
  const qty = items.reduce((a, i) => a + (Number(i.qty) || 1), 0);
  if (!items.length) FAIL(`③ ${d} ${r.customer_name}: **ยังไม่มีเมนูเลย** (${r.box_count} กล่อง)`);
  else if (qty !== r.box_count) WARN(`③ ${d} ${r.customer_name}: เมนู ${qty} ≠ กล่อง ${r.box_count}`);
  const nums = items.map(i => String(i.code || '').replace(/^(LC|HP|HX)/, ''));
  const dup = nums.filter((x, i) => nums.indexOf(x) !== i);
  if (dup.length) WARN(`③ ${d} ${r.customer_name}: เมนูซ้ำในกล่อง ${[...new Set(dup)].join(',')} (เช็คว่าลูกค้าเลือกเอง)`);
}

// ---------- ④ หน้าครัว KQ (order_items) ต้องมีเมนูครบ ----------
const ids = [...new Set(rows.map(r => r.order_id).filter(Boolean))];
const oi = [];
for (let i = 0; i < ids.length; i += 50) oi.push(...await q(`order_items?select=order_id,menu_code,notes&order_id=in.(${ids.slice(i, i + 50).join(',')})&limit=1000`));
const oiBy = {};
oi.forEach(x => { (oiBy[x.order_id] = oiBy[x.order_id] || []).push(x); });
for (const d of days) for (const r of byDay[d]) {
  if (!r.order_id || !(r.menu_items || []).length) continue;
  const pre = r.mp_type === 'lc' ? 'LC' : 'HP';
  const tag = `r${r.round_no}/${r.total_rounds}`;
  const mine = (oiBy[r.order_id] || []).filter(x => String(x.menu_code || '').startsWith(pre) && String(x.notes || '').includes(tag));
  if (!mine.length) FAIL(`④ ${d} ${r.customer_name}: **หน้าครัว KQ ไม่เห็นเมนู** (order_items ว่างสำหรับรอบนี้)`);
}

// ---------- ⑤ ใบครัวของวันผลิตถัดไป ----------
const next = days.find(d => d >= today);
if (next) {
  for (const f of [`kitchen/${next}.html`, `kitchen/${next}_pack.html`]) {
    if (!existsSync(f)) { FAIL(`⑤ ไม่มีไฟล์ ${f} — ครัวไม่มีใบ`); continue; }
    const html = readFileSync(f, 'utf8');
    if (/�/.test(html)) FAIL(`⑤ ${f}: มีตัวอักษรเพี้ยน`);
  }
  const idx = existsSync('kitchen/index.html') ? readFileSync('kitchen/index.html', 'utf8') : '';
  if (!idx.includes(next)) FAIL(`⑤ หน้ารวมครัว /k ไม่มีลิงก์ของ ${next} — ครัวหาใบไม่เจอ`);

  // ⑤b หน้า /k: ห้ามลิงก์ซ้ำ · ชื่อวันไทยต้องตรงกับวันที่ในลิงก์
  // (7 ก.ย. 2026 เคยขึ้น "ศุกร์ 4 ก.ย." ซ้ำ 3 คู่ เพราะก๊อปบล็อกเดิมแล้วลืมแก้ชื่อวัน — นัทจับได้เอง)
  const DOWv = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];
  const MONv = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  const seen = new Set();
  for (const mm of idx.matchAll(/href="(\d{4}-\d{2}-\d{2})(_pack)?\.html"><span class="d">([^<—]*)—/g)) {
    const key = mm[1] + (mm[2] || '');
    if (seen.has(key)) FAIL(`⑤ หน้ารวมครัว /k: **ลิงก์ซ้ำ** ${key}.html`);
    seen.add(key);
    const dd = new Date(mm[1] + 'T00:00:00Z');
    const want = `${DOWv[dd.getUTCDay()]} ${dd.getUTCDate()} ${MONv[dd.getUTCMonth()]}`;
    if (mm[3].trim() !== want) FAIL(`⑤ หน้ารวมครัว /k: ลิงก์ ${mm[1]} เขียนชื่อวันว่า "${mm[3].trim()}" ที่ถูกคือ "${want}" — ครัวกดผิดใบ`);
  }
}

// ---------- ⑥ ไฟล์สคริปต์ทุกตัวต้อง parse ผ่าน ----------
const { execFileSync } = await import('node:child_process');
for (const f of ['fah_auto.mjs','fah_build_sheet.mjs','fah_assign_menus.mjs','fah_enforce_nine.mjs','fah_sync_order_items.mjs','fah_sync_liff_plan.mjs','fah_build_web_plan.mjs','fah_check_sheet.mjs','fah_verify_all.mjs']) {
  const p = `scripts/${f}`;
  if (!existsSync(p)) { WARN(`⑥ ไม่มี ${p}`); continue; }
  try { execFileSync(process.execPath, ['--check', p], { stdio: 'pipe' }); }
  catch { FAIL(`⑥ **${p} พัง** (syntax error) — รอบอัตโนมัติจะไม่ทำงาน`); }
}

// ---------- สรุป ----------
console.log(`ตรวจ ${days.length} วันผลิต · ${rows.length} รอบ\n`);
if (warns.length) { console.log('🟡 เตือน:'); warns.forEach(w => console.log('   · ' + w)); console.log(''); }
if (fails.length) {
  console.log('🔴 ไม่ผ่าน — ยังปิดงานไม่ได้:');
  fails.forEach(f => console.log('   ❌ ' + f));
  console.log('');
  process.exitCode = 1;
} else console.log('✅ ผ่านครบทุกข้อ — ทุกหน้าที่คนเห็นพูดตรงกัน\n');

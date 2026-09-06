#!/usr/bin/env node
/**
 * ทำให้ "เมนูที่ลูกค้าเห็นตอนสั่ง (LIFF)" ตรงกับ "เมนูที่ครัวจะทำจริง"
 *
 *   node scripts/fah_sync_liff_plan.mjs            ดูอย่างเดียว
 *   node scripts/fah_sync_liff_plan.mjs --write    เขียนจริง
 *
 * ที่มา (6 ก.ย. 2026 · นัทจับได้เอง): ครัวบอกว่าวันจันทร์มี 14 เมนู ทั้งที่เราตั้งไว้ 10
 * ไล่แล้วพบว่า **แพลนเมนูถูกเก็บ 3 ที่ ไม่ sync กันเลย**
 *   1) `mp_deliveries.menu_items`  → ใบครัว/ใบจัดของ อ่านที่นี่   (ของจริงที่ครัวทำ)
 *   2) `docs/FAH_MENU_PLAN_FOR_WEB.md` → หน้าเว็บ /mealplan
 *   3) `kitchen_data.key='mp_menu_plan'` → **LIFF ที่ลูกค้ากดเลือกเมนู** ← ตัวนี้ค้างของเก่า
 * ผลคือ **ลูกค้าเลือกเมนูที่ครัวไม่ได้ทำ** และ **บิบิมบับที่นัทสั่งให้มี ไม่โผล่ให้ลูกค้าเลือกเลย**
 *
 * ตัวนี้เขียน (3) ให้ตรงกับ (1) — เฉพาะวันที่ยังไม่ถึง ไม่แตะประวัติ
 */
const WRITE = process.argv.includes('--write');
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: H })).json();

const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
// 🔒 วันใกล้ (ภายใน N วัน) = ครัวกำลังจะทำจริง → ลูกค้าต้องเห็นตรงเป๊ะ ห้ามเลือกของที่ครัวไม่ได้ทำ
//    วันไกล = แพลนยังขยับได้ → **เพิ่มได้อย่างเดียว ห้ามตัดตัวเลือกของลูกค้าทิ้ง** (ตัดทิ้ง = ลดโอกาสขาย)
const LOCK_DAYS = Number((process.argv.find(a => a.startsWith('--lock=')) || '--lock=4').split('=')[1]);
const lockUntil = new Date(Date.now() + (7 + LOCK_DAYS * 24) * 3600 * 1000).toISOString().slice(0, 10);

// ---------- ① ของจริงที่ครัวจะทำ ----------
const rows = (await q(`mp_deliveries?select=delivery_date,status,menu_items&delivery_date=gte.${today}&limit=400`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested' && Array.isArray(r.menu_items));
const real = {};
for (const r of rows) for (const i of r.menu_items) {
  const no = String(i.code || '').replace(/^(LC|HP|HX)/, '');
  (real[r.delivery_date] = real[r.delivery_date] || new Set()).add(no);
}

// ---------- ③ ที่ LIFF อ่าน ----------
const cur = await q(`kitchen_data?select=key,data&key=eq.mp_menu_plan`);
if (!cur.length) { console.error('❌ ไม่มี kitchen_data key=mp_menu_plan'); process.exit(1); }
const wrap = cur[0].data || {};
const plan = wrap.data ? { ...wrap.data } : { ...wrap };

// ---------- ชื่อ + โปรตีน ----------
const codes = [...new Set(Object.values(real).flatMap(s => [...s]))].map(n => 'LC' + n);
const mi = [];
for (let i = 0; i < codes.length; i += 60) mi.push(...await q(`menu_items?select=code,name&code=in.(${codes.slice(i, i + 60).join(',')})&limit=200`));
const nameOf = Object.fromEntries(mi.map(x => [x.code.replace(/^LC/, ''), x.name]));
// โปรตีนใช้คำเดียวกับที่ LIFF เคยใช้ (ตัวกรอง "เมนูทะเลไม่เกิน 4" อ่านคำนี้ — เขียนผิด = ตัวกรองพัง)
const protOf = n => {
  const s = String(n || '');
  if (/ทูน่า|แซลมอน|กุ้ง|ปลา|ซีฟู๊ด|ซีฟู้ด/.test(s)) return 'ทะเล';
  if (/เนื้อ(?!สัตว์)/.test(s)) return 'เนื้อ';
  if (/หมู/.test(s)) return 'หมู';
  if (/ไก่/.test(s)) return 'ไก่';
  if (/เต้าหู้|ไข่/.test(s)) return 'ไข่/เต้าหู้';
  return 'อื่นๆ';
};

let changed = 0;
for (const date of Object.keys(real).sort()) {
  const want = [...real[date]].sort();
  const have = (plan[date] || []).map(x => String(x.no));
  const same = want.length === have.length && want.every(n => have.includes(n));
  const add = want.filter(n => !have.includes(n));
  const del = have.filter(n => !want.includes(n));
  const near = date <= lockUntil;
  if (same) { console.log(`${date}  ✅ ตรงแล้ว (${want.length} เมนู)`); continue; }
  if (!near && !add.length) { console.log(`${date}  — วันไกล ไม่ตัดตัวเลือกทิ้ง (ลูกค้าเห็น ${have.length} · ครัวทำ ${want.length})`); continue; }
  changed++;
  console.log(`${date}  ลูกค้าเห็น ${have.length} → ควรเป็น ${want.length}`
    + (add.length ? `  ➕ เพิ่ม ${add.join(',')}` : '')
    + (near && del.length ? `  ➖ เอาออก ${del.join(',')}` : '')
    + (near ? '  [วันใกล้ · ล็อกให้ตรง]' : '  [วันไกล · เพิ่มอย่างเดียว]'));
  const finalList = near ? want : [...new Set([...have, ...want])].sort();
  plan[date] = finalList.map(no => ({ no, name: nameOf[no] || (plan[date] || []).find(x => String(x.no) === no)?.name || no,
    protein: nameOf[no] ? protOf(nameOf[no]) : ((plan[date] || []).find(x => String(x.no) === no)?.protein || 'อื่นๆ') }));
}

if (!changed) { console.log('\n✅ ลูกค้าเห็นตรงกับครัวทุกวันแล้ว\n'); process.exit(0); }
if (!WRITE) { console.log(`\nยังไม่เขียน — จะแก้ ${changed} วัน (ใส่ --write เพื่อเขียนจริง)\n`); process.exit(0); }

const body = wrap.data ? { ...wrap, data: plan } : plan;
const res = await fetch(`${U}/rest/v1/kitchen_data?key=eq.mp_menu_plan`, {
  method: 'PATCH', headers: H, body: JSON.stringify({ data: body, updated_at: new Date().toISOString() }) });
console.log(res.status < 300 ? `\n✅ เขียนแล้ว ${changed} วัน — ลูกค้าเห็นตรงกับครัวแล้ว\n` : `\n❌ ไม่สำเร็จ ${res.status} ${(await res.text()).slice(0, 200)}\n`);

/**
 * 🚦 เปิดเมนูสัปดาห์ใหม่ พร้อมด่านในตัว — เขียนหลัง 19 ก.ย. 2569 ที่เปิดขายแล้วลูกค้าเห็นแค่ 1 ใน 13 เมนู
 * เหตุผลที่ต้องมีไฟล์นี้: "เปิดขายใน DB" ≠ "ลูกค้าเห็น" — 12 ตัวติดหมวด hato_import ที่ไม่ขึ้นหน้า LIFF
 *
 * ค่าเริ่มต้น = ดูอย่างเดียว · เขียนของจริงต้องใส่ --apply --confirm <จันทร์> ให้ตรง
 *   node scripts/niw/open_week.mjs 2026-09-21
 *   node scripts/niw/open_week.mjs 2026-09-21 --apply --confirm 2026-09-21
 * exit 0 ผ่าน · 1 ไม่พร้อม/ไม่ยืนยัน (ไม่เขียนอะไร) · 2 เขียนแล้วตรวจซ้ำไม่ผ่าน
 */
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const A = process.argv.slice(2), W = A[0], APPLY = A.includes('--apply');
const SLOTS = ['S1','S2','S3','S4','S5','S6','S7','S8','D1','D2','D3','D4','D5'];
const CAT = { S: 'no_special', D: 'pack_regular' };   // 🔴 หมวดที่ลูกค้าเห็นจริง — ผิดหมวด = เมนูหายจากหน้าลูกค้า

const g = async u => (await fetch(SB + '/rest/v1/' + u, { headers: H })).json();
const P = async (code, body) => {
  const r = await fetch(SB + '/rest/v1/menu_items?code=eq.' + code,
    { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(body) });
  const j = await r.json();
  return r.ok && Array.isArray(j) && j.length === 1;
};
const putKD = async (k, d) => (await fetch(SB + '/rest/v1/kitchen_data?key=eq.' + k,
  { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ data: d, updated_at: new Date().toISOString() }) })).ok;

async function main() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(W || '')) { console.log('ใส่วันจันทร์ของสัปดาห์ เช่น 2026-09-21'); return 1; }

  const kd = await g('kitchen_data?select=key,data&key=in.(weekly_subcode_plan,weekly_stock_plan,weekly_gate,stock_incoming,menu_special_weeks)');
  const get = k => ((kd.find(x => x.key === k) || {}).data) || {};
  const plan = get('weekly_subcode_plan')[W], stockRec = get('weekly_stock_plan')[W], gate = get('weekly_gate')[W];
  const inc = get('stock_incoming'), msw = get('menu_special_weeks');

  const bad = [];
  if (!plan) bad.push('ไม่มีแผนช่องของสัปดาห์นี้ (weekly_subcode_plan)');
  if (!stockRec || !stockRec.qty) bad.push('ไม่มีแผนสต็อกของสัปดาห์นี้ (weekly_stock_plan)');
  if (!gate || !gate.pass) bad.push('ด่าน 05 ยังไม่ผ่าน (weekly_gate.pass)');
  if (gate && !gate.visual_ok) bad.push('ด่าน 05 ยังไม่ได้เปิดดูรูปด้วยตา (visual_ok)');
  if (bad.length) { bad.forEach(x => console.log('  🔴 ' + x)); console.log('⛔ ไม่ทำอะไร'); return 1; }

  const codes = SLOTS.map(s => plan[s]).filter(Boolean);
  if (codes.length !== 13) { console.log('  🔴 แผนช่องมี ' + codes.length + ' ตัว ไม่ใช่ 13'); return 1; }

  const rows = await g('menu_items?select=id,code,name,subcode,category,price,kcal,protein,carb,fat,image_urls,available_from,is_available,actual_stock,stock_total&code=in.(' + codes.join(',') + ')');
  const by = new Map(rows.map(m => [m.code, m]));
  const q = stockRec.qty;

  for (const s of SLOTS) {
    const m = by.get(plan[s]), want = CAT[s[0]];
    if (!m) { bad.push(s + ' ' + plan[s] + ' ไม่มีในตาราง'); continue; }
    if (m.available_from !== W) bad.push(s + ' ' + m.code + ' ' + m.name + ' — วันเริ่มขาย ' + m.available_from + ' ไม่ใช่ ' + W);
    if (m.category !== want) bad.push(s + ' ' + m.code + ' ' + m.name + ' — หมวด ' + m.category + ' ลูกค้าไม่เห็น ต้องเป็น ' + want);
    if (!(m.kcal > 0 && m.protein > 0 && m.carb > 0 && m.fat != null)) bad.push(s + ' ' + m.code + ' ' + m.name + ' — โภชนาการไม่ครบ');
    if (!(m.image_urls || [])[0]) bad.push(s + ' ' + m.code + ' ' + m.name + ' — ไม่มีรูป');
    if (s[0] === 'S' && m.price < 125) bad.push(s + ' ' + m.code + ' ' + m.name + ' — ราคา ' + m.price + ' ต่ำกว่า 125');
    if (s[0] === 'D' && m.price < 80) bad.push(s + ' ' + m.code + ' ' + m.name + ' — ราคา ' + m.price + ' ต่ำกว่า 80');
    if (!(Number(q[s]) > 0)) bad.push(s + ' ไม่มียอดผลิตในแผนสต็อก');
  }

  console.log('สัปดาห์ ' + W + ' · ' + (APPLY ? 'จะเขียนของจริง' : 'ดูอย่างเดียว'));
  SLOTS.forEach(s => {
    const m = by.get(plan[s]);
    if (m) console.log('  ' + s.padEnd(3) + m.code.padEnd(7) + String(m.category).padEnd(14) + (m.is_available ? 'เปิดอยู่' : 'ปิดอยู่ ') + '  ผลิต ' + q[s] + '  ' + String(m.name).slice(0, 34));
  });

  if (bad.length) { console.log('\n🔴 ไม่พร้อม ' + bad.length + ' ข้อ:'); bad.forEach(x => console.log('  · ' + x)); console.log('⛔ ไม่เขียนอะไรเลย'); return 1; }
  console.log('\n✅ ตรวจก่อนเปิดผ่านทุกข้อ (หมวด · วันเริ่มขาย · ป้าย · โภชนาการ · รูป · ราคา · ยอดผลิต · ด่าน 05)');
  if (!APPLY) { console.log('(ดูอย่างเดียว — ยังไม่ได้เขียน · ใส่ --apply --confirm ' + W + ' เพื่อเปิดจริง)'); return 0; }

  const ci = A.indexOf('--confirm');
  if (ci < 0 || A[ci + 1] !== W) { console.log('🔴 ต้องใส่ --confirm ' + W + ' ให้ตรง · ไม่เขียนอะไร'); return 1; }

  const held = await g('menu_items?select=code,subcode,name&subcode=not.is.null');
  const strip = held.filter(m => /^[SD][1-8]$/.test(String(m.subcode).trim()) && !codes.includes(m.code));
  let s1 = 0;
  for (const m of strip) { if (await P(m.code, { subcode: null })) s1++; else console.log('  ❌ ถอดป้ายไม่สำเร็จ ' + m.code + ' ' + m.name); }

  const at = new Date().toISOString();
  let s2 = 0;
  for (const s of SLOTS) {
    const m = by.get(plan[s]), n = Number(q[s]), real = Math.max(0, Number(m.actual_stock) || 0);
    if (await P(m.code, { is_available: true, subcode: s, category: CAT[s[0]], stock_total: real + n })) {
      s2++;
      const prev = inc[m.id];
      inc[m.id] = { n, by: 'น้องนิว (เปิดขายสัปดาห์ ' + W + ')', at, code: m.code, was: prev ? { n: prev.n, by: prev.by } : undefined };
      msw[m.code] = W;
    } else console.log('  ❌ เปิดไม่สำเร็จ ' + m.code + ' ' + m.name);
  }
  if (!await putKD('stock_incoming', inc)) console.log('  ❌ บันทึกกำลังผลิตไม่สำเร็จ');
  if (!await putKD('menu_special_weeks', msw)) console.log('  ❌ บันทึกป้ายสัปดาห์ไม่สำเร็จ');

  // ── ตรวจซ้ำจากของจริงหลังเขียน (ข้อที่เคยข้ามแล้วพัง 19 ก.ย.) ──
  const back = await g('menu_items?select=code,subcode,category,is_available,stock_total,name&code=in.(' + codes.join(',') + ')');
  const b2 = new Map(back.map(m => [m.code, m]));
  const after = [];
  for (const s of SLOTS) {
    const m = b2.get(plan[s]);
    if (!m || !m.is_available) after.push(s + ' ' + plan[s] + ' ยังไม่เปิดขาย');
    else if (m.subcode !== s) after.push(s + ' ' + m.code + ' ป้ายเป็น ' + m.subcode);
    else if (m.category !== CAT[s[0]]) after.push(s + ' ' + m.code + ' หมวด ' + m.category + ' ลูกค้าไม่เห็น');
    else if (m.stock_total == null) after.push(s + ' ' + m.code + ' ไม่มีสต็อก');
  }
  const all = await g('menu_items?select=code,subcode&subcode=not.is.null');
  const d = {};
  all.forEach(m => (d[m.subcode] = d[m.subcode] || []).push(m.code));
  Object.entries(d).filter(([, a]) => a.length > 1).forEach(([k, a]) => after.push('ป้าย ' + k + ' ซ้ำ: ' + a.join('/')));

  console.log('\nถอดป้ายชุดเก่า ' + s1 + '/' + strip.length + ' · เปิดขาย ' + s2 + '/13 · ลูกค้าเห็นครบ ' + (SLOTS.length - after.length) + '/13');
  if (after.length) { console.log('🔴 หลังเขียนยังไม่ครบ:'); after.forEach(x => console.log('  · ' + x)); return 2; }
  console.log('✅ ครบทุกช่อง — เหลือขั้นสุดท้ายที่เครื่องทำแทนไม่ได้: ขอภาพหน้าจอ LIFF จากคนที่ล็อกอินได้ (05) ว่าเห็น S1-S8 / D1-D5 ครบจริง · ยังไม่เห็นภาพ = ยังไม่จบงาน');
  return 0;
}
main().then(c => { process.exitCode = c; }).catch(e => { console.error('🔴 พัง (นับว่าไม่เปิด):', e && e.message || e); process.exitCode = 2; });

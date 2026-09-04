#!/usr/bin/env node
/**
 * บังคับ "วันละ 9 เมนูเป๊ะ" — ทุกวันผลิตในอนาคต
 *
 *   node scripts/fah_enforce_nine.mjs            ดูอย่างเดียว
 *   node scripts/fah_enforce_nine.mjs --write    เขียนจริง
 *
 * นัทสั่งเอง 3 ก.ย. 2026: *"จะต้องไม่ผิดอีก ทำได้ไหม ทุกวัน คือ 9 เมนู"*
 *
 * ปัญหาที่แก้: คอร์สรายเดือนถูกล็อกเมนูไว้ตั้งแต่วันสมัคร พอถึงวันผลิตจริง
 * กล่องพวกนี้ถือ "ชุดเมนูของวันอื่น" ติดมา → ครัวต้องทำเพิ่มเป็น 14-21 เมนู/วัน
 * (7 ก.ย. เคยขึ้น 21 เมนู · 9 ก.ย. 21 · 14 ก.ย. 14) = วัตถุดิบทิ้ง + กล่องเดี่ยวเต็มไปหมด
 *
 * วิธีทำ:
 *  1. เลือก "9 ตัวประจำวัน" จากแพลนของวันนั้น — เลือกตัวที่ลูกค้าถืออยู่แล้วมากสุดก่อน (เปลี่ยนน้อยสุด)
 *  2. จัดทุกกล่องของวันนั้นใหม่ ให้มาจาก 9 ตัวนั้นเท่านั้น
 *  3. เคารพของแพ้ · ห้ามซ้ำในกล่อง · เลี่ยงซ้ำ 5 รอบล่าสุด
 *  ⛔ ไม่แตะกล่องที่ลูกค้าเลือกเมนูเอง (by:'customer') ถ้าเมนูนั้นอยู่ใน 9 ตัวแล้ว
 */
import { readFileSync } from 'node:fs';
const WRITE = process.argv.includes('--write');
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: H })).json();
const PER_DAY = 9;
// ---- ตั้งค่าพิเศษรายวัน (นัทสั่งเป็นรอบๆ) ----
// TARGET: วันไหนอยากได้กี่เมนู · MUST: เมนูที่ต้องมีในวันนั้นแน่ๆ
// 3 ก.ย. 2026 นัทสั่ง: "อาทิตย์หน้า จันทร์พุธศุกร์ เพิ่มพิเศษเป็น 10 เมนู มีเมนูบิบิมบับให้เลือกทั้ง 3 วัน"
const TARGET = { '2026-09-07': 10, '2026-09-09': 10, '2026-09-11': 10 };
const MUST   = { '2026-09-07': ['39'], '2026-09-09': ['39'], '2026-09-11': ['39'] };  // 39 = บิบิมบับหมู
const MIN_BOXES_FOR_MUST = 3;   // เมนูที่สั่งให้มี ต้องมีคนกินอย่างน้อยเท่านี้ ไม่งั้นกลายเป็นกล่องเดี่ยว

const TUNA = ['03','28','57','69','78'], BEEF = ['12','33','34','48','73'], TOFU = ['72'];
const SHRIMP = ['22','55','64','82'], PORK = ['04','05','06','09','39','51','59','71'], RAW = ['41'];
const RULES = [
  { m: /Oh thanaporn|โอ๋/, ban: [...TUNA, ...BEEF, ...RAW, '10', '32'] },
  { m: /Mimchan|มิ้ม/, ban: TOFU },
  { m: /Moss|พรหมพงศ์/, ban: BEEF },
  { m: /Anchalee|อัญชลี/, ban: [...BEEF, ...TOFU] },
  { m: /Chyz|พีช/, ban: SHRIMP },
  { m: /Panpilai|พรรณพิไล/, ban: PORK },
];
const banOf = n => (RULES.find(r => r.m.test(n))?.ban) || [...BEEF];
const known = n => !!RULES.find(r => r.m.test(n));

// ---------- แพลนรายวัน ----------
const TH = {'ม.ค.':1,'ก.พ.':2,'มี.ค.':3,'เม.ย.':4,'พ.ค.':5,'มิ.ย.':6,'ก.ค.':7,'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12};
const RE = /^\|\s*(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*\|[^|]*\|\s*LC(\d+)\/HP\d+\s*\|([^|]*)\|([^|]*)\|/;
const plan = {}, allMenus = new Map();
for (const line of readFileSync('docs/FAH_MENU_PLAN_FOR_WEB.md', 'utf8').split('\n')) {
  const m = line.match(RE); if (!m) continue;
  const d = `2026-${String(TH[m[2]]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  const e = { code: m[3].padStart(2,'0'), name: m[4].trim(), prot: m[5].trim() };
  (plan[d] = plan[d] || []).push(e);
  allMenus.set(e.code, e);
}

const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const rows = (await q(`mp_deliveries?select=id,order_id,customer_name,mp_type,round_no,total_rounds,delivery_date,box_count,status,menu_items&delivery_date=gte.${today}&order=delivery_date.asc&limit=300`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested');
const histAll = await q('mp_deliveries?select=customer_name,delivery_date,menu_items&menu_items=not.is.null&limit=1000');
const recentOf = (name, before) => new Set(histAll.filter(x => x.customer_name === name && x.delivery_date < before)
  .sort((a, b) => b.delivery_date.localeCompare(a.delivery_date)).slice(0, 5)
  .flatMap(x => (x.menu_items || []).map(i => String(i.code || '').replace(/^(LC|HP|HX)/, ''))));

// วันที่ผลิตล่าสุดของแต่ละโค้ด — ใช้ดันเมนูที่นานไม่ได้ทำขึ้นมาก่อน
const lastMade = {};
for (const h of histAll) for (const i of (h.menu_items || [])) {
  const c = String(i.code || '').replace(/^(LC|HP|HX)/, '');
  if (!lastMade[c] || h.delivery_date > lastMade[c]) lastMade[c] = h.delivery_date;
}

const byDay = {};
rows.forEach(r => { (byDay[r.delivery_date] = byDay[r.delivery_date] || []).push(r); });

let dayFixed = 0, boxFixed = 0;
for (const date of Object.keys(byDay).sort()) {
  const list = byDay[date];
  const perDay = TARGET[date] || PER_DAY;
  const must = MUST[date] || [];
  const pool = plan[date] || [];
  // นับว่าเมนูไหนถูกใช้อยู่แล้วกี่กล่อง (เลือกตัวที่กระทบน้อยสุด)
  const usage = {};
  list.forEach(r => (r.menu_items || []).forEach(i => {
    const c = String(i.code || '').replace(/^(LC|HP|HX)/, '');
    usage[c] = (usage[c] || 0) + (Number(i.qty) || 1);
  }));
  // ผู้สมัครเป็น 9 ตัวประจำวัน = เมนูในแพลนของวันนั้น + เมนูที่ถูกใช้จริง (เผื่อแพลนไม่ครบ)
  const cand = new Map();
  pool.forEach(e => cand.set(e.code, e));
  Object.keys(usage).forEach(c => { if (!cand.has(c) && allMenus.has(c)) cand.set(c, allMenus.get(c)); });
  const scored = [...cand.values()].sort((a, b) => (usage[b.code] || 0) - (usage[a.code] || 0)
    || pool.findIndex(x => x.code === a.code) - pool.findIndex(x => x.code === b.code));
  // คุมบาลานซ์: โปรตีนชนิดเดียวไม่เกิน 4 ใน 9
  const nine = [], protCount = {};
  // เมนูที่นัทสั่งให้มี ใส่ก่อนเสมอ
  for (const code of must) {
    const e = cand.get(code) || allMenus.get(code);
    if (e && !nine.includes(e)) { nine.push(e); protCount[e.prot] = (protCount[e.prot] || 0) + 1; }
  }
  for (const e of scored) {
    if (nine.length >= perDay) break;
    if (nine.includes(e)) continue;
    const c = protCount[e.prot] || 0;
    if (c >= 4) continue;
    nine.push(e); protCount[e.prot] = c + 1;
  }
  for (const e of scored) { if (nine.length >= perDay) break; if (!nine.includes(e)) nine.push(e); }
  // ยังไม่ครบเป้า → ดึงจากคลังเมนูทั้งหมด เลือกตัวที่ "นานไม่ได้ทำ" ก่อน
  if (nine.length < perDay) {
    const extra = [...allMenus.values()]
      .filter(e => !nine.some(x => x.code === e.code))
      .sort((a, b) => (lastMade[a.code] || '2000-01-01').localeCompare(lastMade[b.code] || '2000-01-01'));
    for (const e of extra) { if (nine.length >= perDay) break; nine.push(e); }
  }
  const nineSet = new Set(nine.map(e => e.code));

  const before = new Set(Object.keys(usage));
  const off = [...before].filter(c => !nineSet.has(c));
  const mustShort = must.filter(c => (usage[c] || 0) < MIN_BOXES_FOR_MUST);
  const shortOfTarget = !!TARGET[date] && before.size < perDay;   // เฉพาะวันที่นัทสั่งจำนวนไว้ ถึงจะบังคับให้ครบ
  if (!off.length && before.size <= perDay && !mustShort.length && !shortOfTarget) { console.log(`${date}  ✅ ${before.size} เมนู ตรงแล้ว`); continue; }

  console.log(`\n${date}  ผลิตจริง ${before.size} เมนู → บีบเหลือ ${nine.length}: ${nine.map(e => e.code).join(',')}`);
  dayFixed++;
  for (const r of list) {
    const pre = r.mp_type === 'lc' ? 'LC' : 'HP';
    const items = (r.menu_items || []).map(i => ({ ...i, num: String(i.code || '').replace(/^(LC|HP|HX)/, '') }));
    const bad = items.filter(i => !nineSet.has(i.num));
    if (!bad.length) continue;
    const ban = banOf(r.customer_name);
    const recent = recentOf(r.customer_name, date);
    const inBox = new Set(items.filter(i => nineSet.has(i.num)).map(i => i.num));
    let avail = nine.filter(e => !inBox.has(e.code) && !ban.includes(e.code));
    let order2 = [...avail.filter(e => !recent.has(e.code)), ...avail.filter(e => recent.has(e.code))];
    if (!order2.length && !known(r.customer_name)) order2 = nine.filter(e => !inBox.has(e.code));
    const swaps = [];
    for (const b of bad) {
      const pick = order2.find(e => !inBox.has(e.code));
      if (!pick) { swaps.push([b.num, null]); continue; }
      inBox.add(pick.code);
      swaps.push([b.num, pick.code]);
      b.code = pre + pick.code; b.name = pick.name; b.by = 'fah'; b.note = '';
    }
    console.log(`   ${r.customer_name.slice(0, 24).padEnd(26)} ${pre} r${r.round_no}/${r.total_rounds} · ${swaps.map(([f, t]) => `${f}→${t || '⚠️ไม่มีตัวแทน'}`).join(' ')}`);
    if (!WRITE) continue;
    if (swaps.some(([, t]) => !t)) { console.log('      ⏭️ ข้าม (หาตัวแทนไม่ครบ)'); continue; }
    const body = items.map(({ num, ...rest }) => rest);
    const res = await fetch(`${U}/rest/v1/mp_deliveries?id=eq.${r.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({
      menu_items: body,
      admin_notes: `🤖 ห้องฟ้าบีบเหลือ 9 เมนู/วัน [${today}] — ${swaps.map(([f, t]) => `${f}→${t}`).join(', ')} · รอแอดมินตรวจ`,
      updated_at: new Date().toISOString() }) });
    if (res.status < 300) boxFixed++; else console.log('      ❌', res.status);
  }

  // ---- เติมเมนูที่นัทสั่งให้มี เข้ากล่องให้ถึงขั้นต่ำ (ไม่งั้นเป็นเมนูที่ "มีในลิสต์แต่ไม่มีใครกิน") ----
  // เติมทั้ง (ก) เมนูที่นัทสั่งให้มี และ (ข) เมนูในลิสต์ประจำวันที่ยังไม่มีใครกินเลย
  // → ผลิตจริงจะได้ครบเท่าเป้าหมายของวันนั้น ไม่ใช่ "มีในลิสต์แต่ไม่มีในกล่อง"
  const toFill = [...must, ...nine.map(e => e.code).filter(c => !must.includes(c) && !(usage[c] > 0))];
  for (const code of toFill) {
    let have = 0;
    for (const r of list) have += (r.menu_items || []).filter(i => String(i.code || '').replace(/^(LC|HP|HX)/, '') === code).reduce((a, i) => a + (Number(i.qty) || 1), 0);
    if (have >= MIN_BOXES_FOR_MUST) continue;
    const e = cand.get(code) || allMenus.get(code);
    if (!e) { console.log('   ⚠️ ไม่มีเมนู ' + code + ' ในระบบ'); continue; }
    for (const r of list) {
      if (have >= MIN_BOXES_FOR_MUST) break;
      const pre = r.mp_type === 'lc' ? 'LC' : 'HP';
      const items = (r.menu_items || []).map(i => ({ ...i, num: String(i.code || '').replace(/^(LC|HP|HX)/, '') }));
      if (items.some(i => i.num === code)) continue;
      if (banOf(r.customer_name).includes(code)) continue;
      // แตะเฉพาะที่ฟ้าใส่เอง · ห้ามแตะเมนูที่นัทสั่งให้มี · เลือกตัวที่มีคนกินเยอะสุด (ซ้ำซ้อนสุด) ออกก่อน
      let idx = -1, best = -1;
      items.forEach((i, k) => {
        if (i.by !== 'fah' || must.includes(i.num) || i.num === code) return;
        const u = usage[i.num] || 0;
        // ห้ามดึงเมนูที่มีคนกินน้อยอยู่แล้วออก ไม่งั้นมันหลุดจากลิสต์ (ได้เมนูใหม่ แต่เสียเมนูเก่า = เท่าเดิม)
        if (u <= MIN_BOXES_FOR_MUST) return;
        if (u > best) { best = u; idx = k; }
      });
      if (idx < 0) continue;
      const from = items[idx].num;
      items[idx].code = pre + code; items[idx].name = e.name; items[idx].by = 'fah'; items[idx].note = '';
      have++;
      console.log('   ➕ ' + r.customer_name.slice(0, 22).padEnd(24) + ' ' + pre + ' · ' + from + '→' + code + ' (' + e.name + ')');
      if (!WRITE) continue;
      const body = items.map(({ num, ...rest }) => rest);
      const res = await fetch(U + '/rest/v1/mp_deliveries?id=eq.' + r.id, { method: 'PATCH', headers: H, body: JSON.stringify({
        menu_items: body,
        admin_notes: '🤖 ห้องฟ้าเติมเมนู ' + code + ' ตามที่นัทสั่ง [' + today + '] · ' + from + '→' + code + ' · รอแอดมินตรวจ',
        updated_at: new Date().toISOString() }) });
      if (res.status < 300) boxFixed++; else console.log('      ❌', res.status);
    }
  }

}
console.log(`\n${WRITE ? `✅ เขียนจริง — แก้ ${dayFixed} วัน · ${boxFixed} กล่อง` : `ยังไม่เขียน — จะแก้ ${dayFixed} วัน`}\n`);

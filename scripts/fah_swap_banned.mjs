#!/usr/bin/env node
/**
 * สลับเมนูที่ถูกระงับ/ปิดขาย ออกจากกล่องลูกค้าที่ยังไม่ถึงวันส่ง
 *
 *   node scripts/fah_swap_banned.mjs            ดูอย่างเดียว
 *   node scripts/fah_swap_banned.mjs --write    เขียนจริง
 *
 * ที่มา (3 ก.ย. 2026): เจอเมนู 53 (นัทสั่งระงับตั้งแต่ 21 ส.ค. เพื่อปรับสูตร)
 * อยู่ในกล่องลูกค้าวันศุกร์ 5 คน — และ 2 ใน 5 เพิ่งถูกใส่สดๆ (ลูกค้าเลือกเอง 1 · แอดมินเลือกให้ 1)
 * แปลว่าเมนูที่ "ปิดขาย" แล้ว ยังเลือกได้อยู่ทั้ง 2 ฝั่ง → ต้นเหตุอยู่ที่ระบบ (ส่ง u-maintainer แล้ว)
 * ตัวนี้แก้ปลายทางให้ครัวไม่ต้องทำเมนูที่ยังไม่พร้อม
 *
 * เกณฑ์เลือกตัวแทน: จากชุดของวันนั้น · ไม่ซ้ำในกล่อง · ไม่ใช่ของแพ้ · เลี่ยงซ้ำ 5 รอบล่าสุด · โปรตีนใกล้เคียงก่อน
 */
import { readFileSync } from 'node:fs';
const WRITE = process.argv.includes('--write');
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: H })).json();

// ⛔ เมนูที่ถูกระงับจริง — ระบุเป็นรายตัวเท่านั้น
// 🪤 กับดัก: เมนู LC/HP ทุกตัว is_available=false เป็นปกติ (แอดมินจ่ายให้ ไม่ได้ขายหน้าร้าน)
//    ถ้าเอา is_available มาเป็นเกณฑ์ = "ทุกเมนูถูกระงับ" — เจอจริงตอนเขียนตัวนี้ 3 ก.ย. 2026
const BANNED = new Set([
  '53',  // (Z4) Baked Salmon Butter lemon sauce — นัทระงับ 21 ส.ค. 2026 เพื่อปรับสูตร
]);

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
const known = n => !!RULES.find(r => r.m.test(n));   // มีข้อมูลของแพ้จริงไหม

const TH_MON = {'ม.ค.':1,'ก.พ.':2,'มี.ค.':3,'เม.ย.':4,'พ.ค.':5,'มิ.ย.':6,'ก.ค.':7,'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12};
const RE = /^\|\s*(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*\|[^|]*\|\s*LC(\d+)\/HP\d+\s*\|([^|]*)\|([^|]*)\|/;
const plan = {};
for (const line of readFileSync('docs/FAH_MENU_PLAN_FOR_WEB.md', 'utf8').split('\n')) {
  const m = line.match(RE); if (!m) continue;
  const d = `2026-${String(TH_MON[m[2]]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  (plan[d] = plan[d] || []).push({ code: m[3].padStart(2,'0'), name: m[4].trim(), prot: m[5].trim() });
}

const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const rows = (await q(`mp_deliveries?select=id,order_id,customer_name,mp_type,round_no,total_rounds,delivery_date,status,menu_items&delivery_date=gte.${today}&order=delivery_date.asc&limit=300`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested' && Array.isArray(r.menu_items) && r.menu_items.length);

const histAll = await q('mp_deliveries?select=customer_name,delivery_date,menu_items&menu_items=not.is.null&limit=1000');
const recentOf = name => new Set(histAll.filter(x => x.customer_name === name && x.delivery_date < today)
  .sort((a, b) => b.delivery_date.localeCompare(a.delivery_date)).slice(0, 5)
  .flatMap(x => (x.menu_items || []).map(i => String(i.code || '').replace(/^(LC|HP|HX)/, ''))));

let n = 0;
for (const r of rows) {
  const pre = r.mp_type === 'lc' ? 'LC' : 'HP';
  const items = r.menu_items.map(i => ({ ...i, num: String(i.code || '').replace(/^(LC|HP|HX)/, '') }));
  const bad = items.filter(i => BANNED.has(i.num));
  if (!bad.length) continue;
  const pool = plan[r.delivery_date] || [];
  const inBox = new Set(items.map(i => i.num));
  const ban = banOf(r.customer_name);
  const recent = recentOf(r.customer_name);
  const cand = pool.filter(x => !BANNED.has(x.code) && !inBox.has(x.code) && !ban.includes(x.code));
  let ordered = [...cand.filter(x => !recent.has(x.code)), ...cand.filter(x => recent.has(x.code))];
  // ทางออกสุดท้าย: ถ้าไม่มีตัวแทนเลย และคนนี้ "ไม่มีข้อมูลของแพ้จริง" (เรากันเนื้อวัวไว้เองเพื่อความปลอดภัย)
  // → ปลดล็อกเนื้อวัวให้เฉพาะเคสนี้ แล้วติดธงให้คนตรวจ ดีกว่าปล่อยให้กล่องขาด
  let usedFallback = false;
  if (!ordered.length && !known(r.customer_name)) {
    ordered = pool.filter(x => !BANNED.has(x.code) && !inBox.has(x.code));
    usedFallback = ordered.length > 0;
  }
  const swaps = [];
  for (const b of bad) {
    const pick = ordered.find(x => !inBox.has(x.code));
    if (!pick) { swaps.push([b.num, null]); continue; }
    inBox.add(pick.code);
    swaps.push([b.num, pick]);
    b.code = pre + pick.code; b.name = pick.name; b.by = 'fah'; b.note = `สลับจาก ${pre}${b.num} (เมนูปิดขาย/ระงับ)`;
  }
  n++;
  console.log(`${r.delivery_date}  ${r.customer_name.slice(0, 24).padEnd(26)} ${pre} r${r.round_no}/${r.total_rounds}${usedFallback ? "  ⚠️ ใช้ทางออกสุดท้าย: ปลดล็อกเนื้อวัว (คนนี้ไม่มีข้อมูลของแพ้) — ให้แอดมินยืนยัน" : ""}`);
  swaps.forEach(([from, to]) => console.log(`    ${from} → ${to ? `${to.code} ${to.name} (${to.prot})` : '⚠️ ไม่มีตัวแทนในชุดของวันนั้น — ต้องคนตัดสิน'}`));
  if (!WRITE) continue;
  if (swaps.some(([, to]) => !to)) { console.log('    ⏭️ ข้าม ไม่เขียน (หาตัวแทนไม่ได้)'); continue; }
  const body = items.map(({ num, ...rest }) => rest);
  const res = await fetch(`${U}/rest/v1/mp_deliveries?id=eq.${r.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({
    menu_items: body,
    admin_notes: `🤖 ห้องฟ้าสลับเมนูที่ระงับออก [${today}] — ${swaps.map(([f, t]) => `${f}→${t.code}`).join(', ')} · รอแอดมินตรวจ`,
    updated_at: new Date().toISOString() }) });
  console.log('    ' + (res.status < 300 ? '✅ เขียนแล้ว' : `❌ ไม่สำเร็จ ${res.status}`));
}
console.log(`\n${WRITE ? '✅ เขียนจริงแล้ว' : 'ยังไม่เขียนอะไร'} · เจอ ${n} รอบที่มีเมนูปิดขาย\n`);

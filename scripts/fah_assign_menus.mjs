#!/usr/bin/env node
/**
 * จ่ายเมนูให้รอบที่ยังว่าง — ห้องฟ้าทำเอง (subagent nong-fah ถูกปิดถาวร 31 ส.ค. 2026)
 *
 *   node scripts/fah_assign_menus.mjs            ดูอย่างเดียว ไม่เขียน
 *   node scripts/fah_assign_menus.mjs --write    เขียนจริง
 *
 * กฎฝังในโค้ด (ไม่ปล่อยให้ตัดสินใจเอง):
 *  1. เมนูต้องมาจาก "ชุดของวันผลิตนั้น" เท่านั้น (docs/FAH_MENU_PLAN_FOR_WEB.md)
 *  2. ตัดของแพ้รายคน — ไม่รู้ข้อมูล = กันเนื้อวัวไว้ก่อน (กฎเหล็ก: ห้ามเดา)
 *  3. ห้ามซ้ำในกล่องเดียวกัน · เลี่ยงซ้ำ 5 รอบล่าสุดของคนนั้น · กันโปรตีนชนิดเดียวเกิน 3
 *  4. ทุกเมนูที่เขียนต้องมีป้าย by:'fah' — ตามได้ว่าใครเป็นคนเลือก
 *  5. order_items เขียนเฉพาะรอบที่มีใบของตัวเอง — รอบที่ยังแชร์ใบกับรอบอื่นข้ามไว้ก่อน
 *     (ไม่งั้นใบเดียวมีเมนูหลายรอบปนกัน ครัวอ่านไม่ออก)
 */
import { readFileSync } from 'node:fs';

const WRITE = process.argv.includes('--write');
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: H })).json();

// ---- โค้ดตามชนิดวัตถุดิบ ----
const TUNA = ['03', '28', '57', '69', '78'];
const BEEF = ['12', '33', '34', '48', '73'];
const TOFU = ['72'];
const SHRIMP = ['22', '55', '64', '82'];
const PORK = ['04', '05', '06', '09', '39', '51', '59', '71'];
const RAW = ['41'];        // 07 ลาบแซลมอน = ทำสุก (นัทยืนยัน 27 ส.ค.) ไม่นับเป็นของดิบ
const BANNED = ['53'];     // นัทสั่งระงับ 21 ส.ค. — กำลังปรับสูตร

// ---- ข้อจำกัดรายคน (จาก customer_note ในระบบ) ----
const RULES = [
  { match: /Oh thanaporn|โอ๋/, ban: [...TUNA, ...BEEF, ...RAW, '10', '32'], why: 'ไม่ทานทูน่า/เนื้อ/ของดิบ/ไข่ต้ม' },
  { match: /Mimchan|มิ้ม/, ban: [...TOFU], why: 'ไม่ทานเต้าหู้/เครื่องใน/เลือด' },
  { match: /Moss|พรหมพงศ์/, ban: [...BEEF], why: 'ไม่ทานเนื้อวัว/ซอสลุยสวน/ขิง' },
  { match: /Anchalee|อัญชลี/, ban: [...BEEF, ...TOFU], why: 'ไม่ทานเนื้อ/เต้าหู้' },
  { match: /Chyz|พีช/, ban: [...SHRIMP], why: 'ไม่กินกุ้ง/เส้นบุก' },
  { match: /Panpilai|พรรณพิไล/, ban: [...PORK], why: 'ไม่รับเนื้อหมู' },
];
const restrictionsFor = name => {
  const hit = RULES.find(r => r.match.test(name));
  if (hit) return { ban: hit.ban, why: hit.why, known: true };
  return { ban: [...BEEF], why: 'ไม่มีข้อมูลของแพ้ → กันเนื้อวัวไว้ก่อน', known: false };
};

// ---- ชุดเมนูต่อวันผลิต ----
const TH_MON = { 'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12 };
const RE = /^\|\s*(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*\|[^|]*\|\s*LC(\d+)\/HP\d+\s*\|([^|]*)\|([^|]*)\|/;
const plan = {};
for (const line of readFileSync('docs/FAH_MENU_PLAN_FOR_WEB.md', 'utf8').split('\n')) {
  const m = line.match(RE);
  if (!m) continue;
  const d = `2026-${String(TH_MON[m[2]]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
  (plan[d] = plan[d] || []).push({ code: m[3].padStart(2, '0'), name: m[4].trim(), prot: m[5].trim() });
}

const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const rows = (await q(`mp_deliveries?select=id,order_id,customer_name,mp_type,round_no,total_rounds,delivery_date,box_count,status,menu_items&delivery_date=gte.${today}&order=delivery_date.asc&limit=300`))
  .filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested');
const empty = rows.filter(r => !(Array.isArray(r.menu_items) && r.menu_items.length));
const useCount = {};
rows.forEach(r => { if (r.order_id) useCount[r.order_id] = (useCount[r.order_id] || 0) + 1; });

const hist = {};
for (const r of await q('mp_deliveries?select=customer_name,delivery_date,menu_items&menu_items=not.is.null&limit=1000')) {
  (hist[r.customer_name] = hist[r.customer_name] || []).push(r);
}
const recentOf = name => {
  const h = (hist[name] || []).filter(x => x.delivery_date < today)
    .sort((a, b) => b.delivery_date.localeCompare(a.delivery_date)).slice(0, 5);
  return new Set(h.flatMap(x => (x.menu_items || []).map(i => String(i.code || '').replace(/^(LC|HP|HX)/, ''))));
};

console.log(`\n📋 รอบที่ยังไม่มีเมนู ${empty.length} รอบ` + (WRITE ? ' — เขียนจริง' : ' — ดูอย่างเดียว (ใส่ --write เพื่อเขียน)') + '\n');
let ok = 0, skipped = 0, shortAny = 0;
for (const r of empty) {
  const pool = plan[r.delivery_date];
  if (!pool) { console.log(`⛔ ${r.delivery_date} ${r.customer_name} — ไม่มีแพลนของวันนั้น ข้าม`); continue; }
  const pre = r.mp_type === 'lc' ? 'LC' : 'HP';
  const { ban, why, known } = restrictionsFor(r.customer_name);
  const recent = recentOf(r.customer_name);
  const avail = pool.filter(x => !ban.includes(x.code) && !BANNED.includes(x.code));
  const fresh = avail.filter(x => !recent.has(x.code));
  const reused = avail.filter(x => recent.has(x.code));
  const need = r.box_count || 7;
  const picked = [];
  const byProt = {};
  for (const x of [...fresh, ...reused]) {
    if (picked.length >= need) break;
    const c = byProt[x.prot] || 0;
    if (c >= 3 && picked.length < need - 1) continue;
    picked.push(x); byProt[x.prot] = c + 1;
  }
  for (const x of [...fresh, ...reused]) { if (picked.length >= need) break; if (!picked.includes(x)) picked.push(x); }
  const short = need - picked.length;
  if (short > 0) shortAny++;
  const shared = useCount[r.order_id] > 1;
  console.log(`${r.delivery_date}  ${r.customer_name.slice(0, 26).padEnd(28)} ${pre} r${r.round_no}/${r.total_rounds} → ${picked.map(x => x.code).join(',')}` + (short > 0 ? `  ⚠️ ขาด ${short} กล่อง` : ''));
  console.log(`    ${known ? '🔒' : '⚠️'} ${why}` + (shared ? '  · 🎫 ใบยังแชร์กับรอบอื่น → ยังไม่เขียน order_items' : ''));
  if (!WRITE) continue;

  const items = picked.map(x => ({ qty: 1, code: pre + x.code, name: x.name, note: '', by: 'fah' }));
  let res = await fetch(`${U}/rest/v1/mp_deliveries?id=eq.${r.id}`, {
    method: 'PATCH', headers: H, body: JSON.stringify({
      menu_items: items, status: 'menu_assigned',
      admin_notes: `🤖 ห้องฟ้าจ่ายอัตโนมัติ [${today}] — ชุดของวันผลิต · ${why} · รอแอดมินตรวจ`,
      updated_at: new Date().toISOString(),
    }),
  });
  if (res.status >= 300) { console.log('    ❌ เขียนแพลนไม่สำเร็จ', res.status, (await res.text()).slice(0, 150)); continue; }
  ok++;
  if (shared) { skipped++; continue; }
  const oi = picked.map(x => ({
    order_id: r.order_id, menu_item_id: null, menu_code: pre + x.code, menu_name: x.name,
    quantity: 1, unit_price: 0, subtotal: 0, notes: `meal_plan:box:r${r.round_no}/${r.total_rounds}`,
  }));
  res = await fetch(`${U}/rest/v1/order_items`, { method: 'POST', headers: H, body: JSON.stringify(oi) });
  if (res.status >= 300) console.log('    ⚠️ order_items ไม่สำเร็จ', res.status, (await res.text()).slice(0, 150));
}
console.log('\n' + (WRITE
  ? `✅ เขียนแพลน ${ok} รอบ · ข้าม order_items ${skipped} รอบ (ใบยังแชร์กัน รอเปิดใบก่อน)` + (shortAny ? ` · ⚠️ ${shortAny} รอบเมนูไม่ครบกล่อง` : '')
  : 'ยังไม่เขียนอะไร') + '\n');

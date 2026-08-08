#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// hato_menu_sync.mjs — sync เมนูจาก "หน้าเว็บที่ลูกค้าเห็นจริง" ของ Hato
//
// 🔴 นัทสั่ง 6 ส.ค. 2026 (ทำแบบนี้ทุกครั้งที่สั่ง sync เมนู จนกว่าจะแยกกับ Hato):
//    "รายการเมนูข้าวกล่อง ต้องเท่ากัน นี่คือประเด็น
//     ส่วนรายการที่ขึ้นว่าสินค้าหมด ไม่ต้องออนไลน์"
//
// ต่างจาก hato_menu_mirror.mjs ยังไง:
//   · mirror  = อ่าน snapshot ที่ browser ดึงไว้ (ไม่มีข้อมูลสต็อก) → รู้แค่ "มี/ไม่มี"
//   · sync    = ยิง API ฝั่งลูกค้าสดๆ ได้ inStockQuantity ด้วย → รู้ "หมดหรือไม่หมด"
//
// 🔑 API ฝั่งลูกค้าเปิดให้ยิงตรงได้ ไม่ต้อง login ไม่ต้องใช้ token
//    (ต่างจาก admin API ที่ต้องดึง Firebase token จาก Chrome ทุกชั่วโมง)
//    endpoint: api.hatohub.com/liffapi/graphql · listProductsV2 → {products, pagination}
//    ตัวชี้ขาดว่าลูกค้าเห็นอะไร = locationProducts[locationID=2461]
//       · active=false            → ไม่โผล่บนหน้าเว็บเลย
//       · inStockQuantity <= 0    → โผล่แต่ขึ้นป้าย "สินค้าหมด"  ← นัทสั่งว่าอันนี้ไม่ต้องออนไลน์
//
// ⚠️ กฎที่ต้องเคารพ (บทเรียนเก่า):
//   · ห้ามส่ง image_urls / sort_order ตอน update (เคยทำรูปหาย 71 ตัว)
//   · ห้ามแตะ stock_total (ครัวกรอกผ่าน KQ + RPC adjust_stock)
//   · เทียบด้วย "ชื่อ" ไม่ใช่ sku — Hato ใส่รหัสหน้าร้าน (S1/D5) นำหน้าชื่อ และรหัสนั้นเปลี่ยนทุกสัปดาห์
//
// ใช้: node scripts/hato_menu_sync.mjs            → ดูอย่างเดียว
//      node scripts/hato_menu_sync.mjs --apply     → ลงมือจริง
// ═══════════════════════════════════════════════════════════════

const EP = 'https://api.hatohub.com/liffapi/graphql';
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: SK, Authorization: 'Bearer ' + SK };
const HW = { ...H, 'Content-Type': 'application/json', Prefer: 'return=representation' };

const LOC = 2461, VEN = 171;              // กรุงธนบุรี · สาขาเดียวที่มี
const APPLY = process.argv.includes('--apply');

// หมวดที่ไม่ใช่เมนูอาหาร — ข้าม
const SKIP_CATS = new Set(['ค่าส่ง', 'ช้อนส้อม', 'แจกฟรีเมื่อสั่งครบ 700 บาทขึ้นไป',
  'เซ็ตข้าวกล่อง', 'เซ็ตแพคกับข้าว', 'Meal Plan พรีเมี่ยม']);

// ตัดรหัสหน้าร้านที่แอดมินใส่นำหน้าชื่อ ("S1 สเต็กไก่..." → "สเต็กไก่...")
// ⚠️ รหัสนี้ = subcode ประจำสัปดาห์ ไม่ใช่ code จริง — ห้ามเอาไปเขียนทับ menu_items.code
// รูปแบบที่เจอจริงในข้อมูล Hato (แอดมินพิมพ์เอง เลยไม่เป็นแบบแผน):
//   "S1 …" "D5 …" "NEW S1 …"  → ตัวอักษร+เลข
//   "1A …" "2B …" "3E …"      → เลข+ตัวอักษร (อาหารเด็ก)
//   "XXXXD3 …" "XXXXXD5 …"    → ขยะที่แอดมินพิมพ์ทับไว้
const PREFIX = /^(NEW\s+)?(X{2,}\s*)?([A-Z]{1,4}\d{1,3}|\d{1,2}[A-Z])\s+/i;
// 🚫 Hato ติดคำว่า "NEW" ท้ายชื่อเมนูเป็นป้ายโปรโมท ไม่ใช่ส่วนหนึ่งของชื่ออาหาร
//    (นัทสั่งเอาออก 7 ส.ค. — เห็นในหน้าลูกค้าแล้วรก) → ตัดทุกครั้งที่อ่านชื่อจาก Hato
const NEW_TAIL = /[\s\-_.·]*[\(\[]?\bnew\b[\)\]]?\s*$/i;
const cleanName = (s) => {
  let out = (s || '').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 3 && PREFIX.test(out); i++) out = out.replace(PREFIX, '').trim();
  return out.replace(NEW_TAIL, '').trim();
};
const keyName = (s) => cleanName(s).toLowerCase().replace(/\s*new\s*$/i, '').replace(/[()\s\-]/g, '');

const Q = `query($loc:Int,$ven:Int,$lim:Int,$off:Int){
  listProductsV2(locationID:$loc,vendorID:$ven,limit:$lim,offset:$off){
    pagination{ total }
    products{
      id sku nameTh priceSatangs active excludedFromListing
      category{ nameTh }
      locationProducts{ locationID active inStockQuantity }
    }
  }
}`;

async function pull() {
  const all = []; let off = 0;
  for (;;) {
    const r = await fetch(EP, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: Q, variables: { loc: LOC, ven: VEN, lim: 200, off } }),
    });
    const j = await r.json();
    if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300));
    const p = j.data.listProductsV2.products || [];
    all.push(...p);
    if (p.length < 200) break;
    off += 200;
    if (off > 5000) break;
  }
  return all;
}

const raw = await pull();

// จัดกลุ่มตามที่ "ลูกค้าเห็นจริง"
const shown = [], soldout = [], hidden = [];
for (const p of raw) {
  const cat = p.category?.nameTh || '-';
  if (SKIP_CATS.has(cat)) continue;
  const lp = (p.locationProducts || []).find((x) => x.locationID === LOC);
  const item = {
    sku: p.sku, name: cleanName(p.nameTh), rawName: p.nameTh, cat,
    price: Math.round((p.priceSatangs || 0) / 100),
    stock: lp ? lp.inStockQuantity : null,
  };
  if (!p.active || p.excludedFromListing || !lp || !lp.active) { hidden.push(item); continue; }
  if (lp.inStockQuantity !== null && lp.inStockQuantity <= 0) { soldout.push(item); continue; }
  shown.push(item);
}

console.log(`โหมด: ${APPLY ? '🔴 ลงมือจริง' : '👀 ดูอย่างเดียว (ใส่ --apply เพื่อแก้จริง)'}`);
console.log(`ดึงจาก Hato (หน้าลูกค้า สาขา ${LOC}) ทั้งหมด ${raw.length} รายการ`);
console.log(`  🟢 ลูกค้าเห็น + ซื้อได้   ${shown.length}`);
console.log(`  🚫 ขึ้น "สินค้าหมด"      ${soldout.length}   ← นัทสั่ง: ไม่ต้องออนไลน์`);
console.log(`  ⚪ Hato ปิดไว้เอง        ${hidden.length}\n`);

// เมนูฝั่งเรา
let ours = [], from = 0;
for (;;) {
  const d = await (await fetch(`${SB}/menu_items?select=id,code,name,price,is_available,category,subcode&order=id&limit=1000&offset=${from}`, { headers: H })).json();
  if (!Array.isArray(d) || !d.length) break;
  ours.push(...d); from += 1000; if (from > 5000) break;
}
const byName = new Map();
ours.forEach((m) => { const k = keyName(m.name); if (!byName.has(k)) byName.set(k, m); });

const toOpen = [], toClose = [], missing = [], priceDiff = [];
for (const h of shown) {
  const m = byName.get(keyName(h.name));
  // ราคา ฿0 = "โปรโมชั่นแถม" ไม่ใช่เมนู (เช่น บ๊ะจ่าง 10 แถม 1) — ของพวกนี้ระบบเราทำเป็น packages
  if (!m) { if (h.price > 0) missing.push(h); continue; }
  if (!m.is_available) toOpen.push({ h, m });
  if (Number(m.price) < h.price) priceDiff.push({ h, m });   // นัท: ยึดราคาแพงสุด
}
for (const h of soldout) {
  const m = byName.get(keyName(h.name));
  if (m && m.is_available) toClose.push({ h, m });
}

// ⬅️ อีกด้านของ "ต้องเท่ากัน" — เราเปิดขายอยู่ แต่ Hato ไม่ได้ขาย
// (นัทสั่ง 6 ส.ค.: "รายการเมนูข้าวกล่อง ต้องเท่ากัน นี่คือประเด็น")
const hatoKeys = new Set(shown.map((h) => keyName(h.name)));
const soldoutIds = new Set(toClose.map(({ m }) => m.id));   // นับใน "สินค้าหมด" ไปแล้ว อย่านับซ้ำ

// 🛡️ กันพลาดร้ายแรง (เกิดจริง 8 ส.ค. 2026 — ผมปิดเมนูสัปดาห์ใหม่ทิ้ง 13 ตัวใน 1 คำสั่ง)
//    เหตุ: เราเริ่มลงเมนูของ "สัปดาห์หน้า" เข้าระบบตัวเองแล้ว (ห้อง 05 ลงรอบ 10-16 ส.ค.)
//          แต่ Hato ไม่มีวันมีเมนูสัปดาห์หน้า → กติกา "Hato ไม่มี = ปิด" เลยไล่ปิดของใหม่ทิ้งหมด
//    กฎใหม่: เมนูที่ "เราเป็นคนคุมเอง" (มี subcode = ชื่อเล่นประจำสัปดาห์) ห้ามปิดอัตโนมัติเด็ดขาด
const ownManaged = (m) => !!String(m.subcode || '').trim();
const extraRaw = ours.filter((m) => m.is_available && !hatoKeys.has(keyName(m.name)) && !soldoutIds.has(m.id));
const extra = extraRaw.filter((m) => !ownManaged(m));
const shielded = extraRaw.filter(ownManaged);
if (shielded.length) {
  console.log(`🛡️  ข้ามไม่ปิด ${shielded.length} เมนู — เป็นเมนูที่เราคุมเอง (มีชื่อเล่น) Hato ไม่มีเป็นเรื่องปกติ`);
  shielded.forEach((m) => console.log(`   · ${String(m.code).padEnd(8)} ${String(m.subcode).padEnd(4)} ${String(m.name).slice(0, 42)}`));
  console.log('');
}

console.log(`⚠️  เราเปิดขาย แต่ Hato ไม่มีรายการนี้เลย → ต้องปิดให้เท่ากัน : ${extra.length}`);
extra.forEach((m) => console.log(`   · ${String(m.code).padEnd(8)} ${String(m.name).slice(0, 46).padEnd(48)} ฿${m.price}  [${m.category}]`));

console.log(`\n🔴 Hato ขายอยู่ แต่เราไม่มีเมนูนี้เลย : ${missing.length}`);
missing.forEach((h) => console.log(`   · [${h.cat}] ${h.name} ฿${h.price}  (sku Hato: ${h.sku})`));
console.log(`\n🟢 Hato ขาย แต่เราปิดอยู่ → ต้องเปิด : ${toOpen.length}`);
toOpen.forEach(({ h, m }) => console.log(`   · ${m.code.padEnd(8)} ${h.name.slice(0, 44)}`));
console.log(`\n🚫 Hato ขึ้น "สินค้าหมด" แต่เราเปิดอยู่ → ต้องปิด : ${toClose.length}`);
toClose.forEach(({ h, m }) => console.log(`   · ${m.code.padEnd(8)} ${h.name.slice(0, 44)}`));
console.log(`\n💰 ราคาเราต่ำกว่า Hato (นัทสั่งยึดแพงสุด) : ${priceDiff.length}`);
priceDiff.forEach(({ h, m }) => console.log(`   · ${m.code.padEnd(8)} ${h.name.slice(0, 40).padEnd(42)} เรา ฿${m.price} < Hato ฿${h.price}`));

if (!APPLY) { console.log('\n(ยังไม่แก้อะไร — ใส่ --apply เพื่อลงมือ)'); process.exit(0); }

let ok = 0, fail = 0;
async function patch(id, body, label) {
  const r = await fetch(`${SB}/menu_items?id=eq.${id}`, { method: 'PATCH', headers: HW, body: JSON.stringify(body) });
  if (r.ok) { ok++; } else { fail++; console.log(`   ❌ ${label}: ${(await r.text()).slice(0, 90)}`); }
}
// ⚠️ ส่งเฉพาะฟิลด์ที่ตั้งใจแก้ — ห้ามใส่ image_urls / sort_order / stock_total
for (const { m } of toOpen)  await patch(m.id, { is_available: true },  `เปิด ${m.code}`);
for (const { m } of toClose) await patch(m.id, { is_available: false }, `ปิด ${m.code}`);
for (const m of extra)       await patch(m.id, { is_available: false }, `ปิดส่วนเกิน ${m.code}`);
for (const { h, m } of priceDiff) await patch(m.id, { price: h.price }, `ราคา ${m.code}`);

console.log(`\n✅ แก้สำเร็จ ${ok} · ล้มเหลว ${fail}`);
console.log(`ℹ️  เมนูที่ Hato มีแต่เราไม่มี ${missing.length} รายการ — ไม่สร้างอัตโนมัติ (ต้องมี code/หมวด/รูป ให้เจ้าของเคาะ)`);

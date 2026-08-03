#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// hato_menu_parity.mjs — เทียบเมนูที่ "เปิดขายจริง" ระหว่าง Hato กับระบบเรา
//
// อ่านสถานะฝั่ง Hato จากห้อง p-img (browser ดึงมาให้ — ต้องมี token จาก Chrome ที่ login)
// เทียบกับ menu_items.is_available ของเรา แล้วออกรายงาน 3 กอง
//
// ⚠️ อ่านอย่างเดียว ไม่แก้อะไร — ให้เจ้าของตัดสินใจก่อน
// ═══════════════════════════════════════════════════════════════

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: SK };

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
// ชื่อเมนู Hato มักขึ้นต้นด้วยรหัสหน้าร้าน เช่น "S1 สเต็กไก่..." — ตัดออกก่อนเทียบชื่อ
const stripCode = (s) => norm(s).replace(/^[A-Z]{1,4}\d{1,3}\s+/i, '');

(async () => {
  const msg = await (await fetch(`${SB}/session_messages?select=text,sender&room=eq.p-img&sender=like.hato-onsale-*&order=created_at.desc&limit=1`, { headers: H })).json();
  if (!msg.length) { console.error('❌ ไม่พบสถานะ Hato ในห้อง p-img'); process.exit(1); }
  const hato = JSON.parse(msg[0].text);

  let ours = [], off = 0;
  while (true) {
    const r = await (await fetch(`${SB}/menu_items?select=code,name,price,is_available,category&limit=1000&offset=${off}`, { headers: H })).json();
    ours = ours.concat(r); if (r.length < 1000) break; off += 1000;
  }
  const ourOn = ours.filter((m) => m.is_available);
  const ourAll = new Map(ours.map((m) => [m.code, m]));
  const ourOnSet = new Set(ourOn.map((m) => m.code));
  const hatoMap = new Map(hato.filter((h) => h.sku).map((h) => [h.sku, h]));

  console.log(`Hato เปิดขาย ${hato.length} SKU · เราเปิดขาย ${ourOn.length}\n`);

  // ⚠️ Hato มี SKU 2 ระบบปนกัน (รหัสเก่า S080 กับรหัสหน้าร้าน "No11") ส่วนเราใช้รหัสหน้าร้าน
  //    → ถ้า match ด้วย SKU อย่างเดียว เมนูเดียวกันจะโผล่ทั้งกอง 1 และกอง 2 = อ่านแล้วเข้าใจผิดว่าขาด
  //    จึง match รอบสองด้วย "ชื่อเมนูหลังตัดรหัสนำหน้า"
  const keyName = (s) => stripCode(s).toLowerCase().replace(/\s*new\s*$/i, '').replace(/[()\s]/g, '');
  const ourByName = new Map(ourOn.map((m) => [keyName(m.name), m]));
  const hatoByName = new Map(hato.map((h) => [keyName(h.name), h]));

  // เซ็ต/แพลน อยู่คนละตารางกับเมนู (packages / mp_offer_sets) — ไม่ใช่ของขาด
  const pkgs = await (await fetch(`${SB}/packages?select=name,base_price,is_active`, { headers: H })).json();
  const mpsets = await (await fetch(`${SB}/mp_offer_sets?select=set_key,label,price_hp,price_lc`, { headers: H })).json();
  const pkgNames = new Set((Array.isArray(pkgs) ? pkgs : []).filter((p) => p.is_active).map((p) => keyName(p.name)));
  const isSetLike = (h) => /set|plan|weekly|monthly|เซ็ต|แพลน|แพค.*(7|21|42|84)|โปรโมชั่น|แถม/i.test(h.name || '') || /Set|Plan|Weekly|Monthly|^LC1$|^HP1$/i.test(h.sku || '');

  // กอง 1 — Hato ขาย เราไม่ได้ขาย
  const g1 = hato.filter((h) => h.sku && !ourOnSet.has(h.sku));
  // แยกว่าจริง ๆ แล้ว "ขาด" หรือแค่ SKU คนละตัว / เป็นเซ็ต / เป็นของระบบ
  const g1_sameName = g1.filter((h) => ourByName.has(keyName(h.name)));                                  // เมนูเดียวกัน คนละ SKU
  const g1_rest = g1.filter((h) => !ourByName.has(keyName(h.name)));
  const g1_sets = g1_rest.filter(isSetLike);                                                              // เซ็ต/แพลน/โปร (อยู่ตาราง packages)
  const g1_system = g1_rest.filter((h) => !isSetLike(h) && (/^0+$/.test(h.sku) || /^1$/.test(h.sku) || /ช้อนส้อม|แยกวันส่ง|เปลี่ยนวันจัดส่ง|วันส่งพิเศษ|เพิ่มเติม/.test(h.name)));
  const g1_real = g1_rest.filter((h) => !isSetLike(h) && !g1_system.includes(h));                          // ⬅ ขาดจริง
  const g1_closed = g1_real.filter((h) => ourAll.has(h.sku));
  const g1_missing = g1_real.filter((h) => !ourAll.has(h.sku));

  console.log(`━━ กอง 1: Hato ขาย / เราไม่ขาย (นับด้วย SKU) = ${g1.length} รายการ`);
  console.log(`   แยกแล้วพบว่า:`);
  console.log(`   • ${g1_sameName.length} = เมนูเดียวกัน แค่ SKU คนละตัว (Hato ใช้รหัสเก่า เราใช้รหัสหน้าร้าน) → ไม่ได้ขาด`);
  console.log(`   • ${g1_sets.length} = เซ็ต/แพลน/โปรโมชั่น → อยู่ตาราง packages/mp_offer_sets ไม่ใช่ menu_items`);
  console.log(`   • ${g1_system.length} = ของระบบ (ช้อนส้อม/แยกวันส่ง/ค่าส่วนต่าง) → ไม่ต้องมี`);
  console.log(`   🔴 ${g1_real.length} = ขาดจริง (ไม่มีในฐาน ${g1_missing.length} · มีแต่ปิดไว้ ${g1_closed.length})\n`);
  g1_missing.forEach((h) => console.log(`   [ต้องเพิ่ม] ${h.sku} · ${h.name} · ฿${h.price}`));
  g1_closed.forEach((h) => console.log(`   [เปิดตามไหม] ${h.sku} · ${h.name} · ฿${h.price}  (ในฐานชื่อ: ${ourAll.get(h.sku).name})`));
  if (g1_sets.length) { console.log('\n   [เซ็ต/แพลน — เช็คว่ามีใน packages ครบไหม]');
    g1_sets.forEach((h) => console.log(`      ${pkgNames.has(keyName(h.name)) ? '✅ มี' : '⚠️ ไม่เจอชื่อตรง'} · ${h.name} · ฿${h.price}`)); }

  // กอง 2 — เราขาย Hato ไม่ขาย
  const g2all = ourOn.filter((m) => !hatoMap.has(m.code));
  const g2_sameName = g2all.filter((m) => hatoByName.has(keyName(m.name)));   // Hato ยังขาย แค่คนละ SKU
  const g2_real = g2all.filter((m) => !hatoByName.has(keyName(m.name)));
  console.log(`\n━━ กอง 2: เราขาย / Hato ไม่มี SKU นี้ = ${g2all.length} รายการ`);
  console.log(`   • ${g2_sameName.length} = Hato ยังขายอยู่ แค่ SKU คนละตัว → ไม่ต้องปิด`);
  console.log(`   🔴 ${g2_real.length} = Hato ปิดไปแล้วจริง (พิจารณาปิดตาม)\n`);
  g2_real.forEach((m) => console.log(`   ${m.code} · ${m.name} · ฿${m.price} · หมวด ${m.category}`));

  // ราคาของคู่ที่ match ด้วยชื่อ (คนละ SKU) — ต้องเช็คด้วย เพราะเป็นเมนูเดียวกัน
  console.log(`\n━━ ราคาของคู่ "ชื่อตรงแต่ SKU ต่าง" (${g1_sameName.length} คู่)`);
  let nameDiffPrice = 0;
  g1_sameName.forEach((h) => { const m = ourByName.get(keyName(h.name));
    if (m && +m.price !== +h.price) { nameDiffPrice++; console.log(`   🔴 ${m.code}(เรา ฿${m.price}) ↔ ${h.sku}(Hato ฿${h.price}) · ${m.name}`); } });
  if (!nameDiffPrice) console.log('   ✅ ราคาตรงกันหมด');

  // กอง 3 — มีทั้งคู่แต่ข้อมูลไม่ตรง
  const both = ourOn.filter((m) => hatoMap.has(m.code));
  const priceDiff = [], nameDiff = [];
  both.forEach((m) => {
    const h = hatoMap.get(m.code);
    if (+m.price !== +h.price) priceDiff.push({ code: m.code, ours: +m.price, hato: +h.price, name: m.name, hatoName: h.name });
    else if (stripCode(h.name) !== norm(m.name)) nameDiff.push({ code: m.code, ours: norm(m.name), hato: stripCode(h.name) });
  });
  console.log(`\n━━ กอง 3: มีทั้งคู่ ${both.length} รายการ — ราคาไม่ตรง ${priceDiff.length} · ชื่อไม่ตรง ${nameDiff.length}`);
  if (priceDiff.length) {
    console.log('\n   🔴 ราคาไม่ตรง (นัทเคาะว่ายึดราคา Hato — แต่ต้อง verify ว่าเมนูเดียวกันจริง):');
    priceDiff.forEach((d) => console.log(`   ${d.code} · เรา ฿${d.ours} → Hato ฿${d.hato}\n        ชื่อเรา : ${d.name}\n        ชื่อ Hato: ${d.hatoName}`));
  }
  if (nameDiff.length) {
    console.log('\n   🟡 ชื่อไม่ตรง (ราคาตรง):');
    nameDiff.slice(0, 20).forEach((d) => console.log(`   ${d.code}\n        เรา : ${d.ours}\n        Hato: ${d.hato}`));
    if (nameDiff.length > 20) console.log(`   ... อีก ${nameDiff.length - 20} รายการ`);
  }
})().catch((e) => { console.error('💥 ' + e.message); process.exit(1); });

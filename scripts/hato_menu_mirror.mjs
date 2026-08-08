#!/usr/bin/env node
// ═══ 🛑 ปิดถาวร 8 ส.ค. 2026 — วันที่ย้ายมาใช้ระบบร้านเราเองแบบ official ═══
// สคริปต์นี้พึ่ง Hato เป็นต้นทาง · Hato เลิกใช้แล้ว = ข้อมูลไม่มี/ไม่อัปเดตอีก
// รันต่อ = เสี่ยงเขียนข้อมูลผิดทับของจริง (เคสจริง: sync เมนูเคยปิดเมนูสัปดาห์ใหม่ทิ้ง 13 ตัว)
// ต้องการรันจริง ๆ (เช่นย้อนดูโค้ดเก่า) ให้ตั้ง env: HATO_LEGACY=iknowwhatimdoing
if (process.env.HATO_LEGACY !== 'iknowwhatimdoing') {
  console.error('🛑 สคริปต์นี้ปิดถาวรแล้ว (8 ส.ค. 2026 — เลิกใช้ Hato)');
  console.error('   เปิด/ปิดเมนู · แก้ออเดอร์ ทำที่หน้า DB / OH เท่านั้น');
  process.exit(1);
}
// ═══════════════════════════════════════════════════════════════
// hato_menu_mirror.mjs — ทำให้เมนูที่ "Hato เปิดขายออนไลน์" มีครบในระบบเรา
//
// นัทสั่ง (3 ส.ค.): "ขาดไม่ขาดไม่สำคัญเท่าตัวที่ออนไลน์ฮาโตะอยู่มาครบ"
// → ยึด Hato เป็นต้นทาง: ตัวไหน Hato ขายอยู่ ต้องมีในเราและเปิดขาย
//
// โหมด: node scripts/hato_menu_mirror.mjs           → dry-run (ดูอย่างเดียว ไม่แก้)
//       node scripts/hato_menu_mirror.mjs --apply    → ลงมือจริง
//
// ⚠️ กฎที่ต้องเคารพ (CC เตือน):
//   · ห้ามส่ง image_urls / sort_order ตอน update ของเดิม (เคยทำรูปหาย 71 ตัว)
//   · ห้ามแตะ stock_total (ครัวกรอกผ่าน KQ + RPC adjust_stock ตัดสต็อกอัตโนมัติ)
// ═══════════════════════════════════════════════════════════════

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: SK, Authorization: 'Bearer ' + SK };
const APPLY = process.argv.includes('--apply');

// หมวด Hato → หมวดเรา (ยืนยันจากจำนวนสินค้าที่ตรงกัน)
const CAT_MAP = {
  'ข้าวกล่อง': 'no_special',
  'เมนูพิเศษประจำสัปดาห์': 'no_special',        // นัทสั่งรวมกับข้าวกล่อง
  'โปรตีนแพค': 'pack_regular',
  'BABY FOOD อาหารเด็ก 6-12 เดือน': 'cat_mqz6m6b7gkm',
  'ปลาแซลมอนและกระพงสด': 'cat_mqz5oz7oey9',
  'UNDER360 Bone Broth': 'cat_mqz49my7l8r',
  'บ๊ะจ่าง': 'cat_mqwg0bh3vho',
  'ซาลาเปา ไส้กรอก ขนม น้ำพริก คอมบูฉะ ของทานเล่น': 'hato_import',
  'คิมบับลีนไส้ตู้ม': 'hato_import',
  'อาหารเจ': 'hato_import',
};
// หมวดที่ "ไม่ใช่เมนู" — ข้ามทั้งหมด
const SKIP_CATS = new Set(['ค่าส่ง', 'ช้อนส้อม', 'แจกฟรีเมื่อสั่งครบ 700 บาทขึ้นไป', 'เซ็ตข้าวกล่อง', 'เซ็ตแพคกับข้าว', 'Meal Plan พรีเมี่ยม']);

// ตัดรหัสหน้าร้านที่ Hato ใส่นำหน้าชื่อ ("S1 สเต็กไก่..." → "สเต็กไก่...")
const cleanName = (s) => (s || '').replace(/\s+/g, ' ').trim().replace(/^(NEW\s+)?[A-Z]{1,4}\d{1,3}\s+/i, '').trim();
const keyName = (s) => cleanName(s).toLowerCase().replace(/\s*new\s*$/i, '').replace(/[()\s]/g, '');

(async () => {
  const msg = await (await fetch(`${SB}/rest/v1/session_messages?select=text&room=eq.p-img&sender=like.hato-onsale-full-*&order=created_at.desc&limit=1`, { headers: H })).json();
  if (!msg.length) { console.error('❌ ไม่พบข้อมูล onsale — ให้ browser ดึงก่อน'); process.exit(1); }
  const hato = JSON.parse(msg[0].text);

  let ours = [], off = 0;
  while (true) {
    const r = await (await fetch(`${SB}/rest/v1/menu_items?select=id,code,name,price,category,is_available,image_urls&limit=1000&offset=${off}`, { headers: H })).json();
    ours = ours.concat(r); if (r.length < 1000) break; off += 1000;
  }
  const byCode = new Map(ours.map((m) => [m.code, m]));
  const byName = new Map(ours.map((m) => [keyName(m.name), m]));

  const menus = hato.filter((h) => !SKIP_CATS.has(h.cat));
  console.log(`Hato onsale ${hato.length} → เป็นเมนูจริง ${menus.length} (ตัดค่าส่ง/ช้อนส้อม/เซ็ต/แพลน ${hato.length - menus.length})`);
  console.log(`ระบบเรา: ${ours.length} เมนู · เปิดขาย ${ours.filter((m) => m.is_available).length}\n`);

  const toCreate = [], toOpen = [], toFixPrice = [], ok = [], held = [];
  for (const h of menus) {
    const target = CAT_MAP[h.cat] || 'hato_import';
    const found = byCode.get(h.sku) || byName.get(keyName(h.name));
    if (!found) {
      // 🛑 กันของที่ลอกมาตรง ๆ ไม่ได้:
      //    · ราคา ฿0 → ถ้าขึ้นหน้าลูกค้า = สั่งฟรีได้
      //    · SKU ไม่ใช่รหัสจริง ("0", "1", "1 แพค") → ชนกันเอง/อ้างอิงไม่ได้
      //    ของพวกนี้ที่ Hato คือ "โปรโมชั่นเซ็ต" ซึ่งฝั่งเราทำเป็น packages แล้ว
      const badSku = !h.sku || /^\d+$/.test(h.sku) || /\s/.test(h.sku);
      if (+h.price <= 0 || badSku) { held.push({ h, target, why: +h.price <= 0 ? 'ราคา ฿0' : 'SKU ใช้ไม่ได้: "' + h.sku + '"' }); continue; }
      toCreate.push({ h, target }); continue;
    }
    if (!found.is_available) toOpen.push({ h, m: found });
    // ราคา: ยึดแพงสุด (นัทเคาะ 3 ส.ค.)
    if (+found.price < +h.price) toFixPrice.push({ h, m: found });
    if (found.is_available && +found.price >= +h.price) ok.push(found.code);
  }

  console.log(`━━ ต้องสร้างใหม่ ${toCreate.length}`);
  toCreate.forEach((x) => console.log(`   ${x.h.sku} · ${cleanName(x.h.name)} · ฿${x.h.price} · [${x.h.cat}] → ${x.target}${x.h.img ? ' · มีรูป' : ' · ไม่มีรูป'}`));
  console.log(`\n━━ ต้องเปิดขาย ${toOpen.length}`);
  toOpen.forEach((x) => console.log(`   ${x.m.code} · ${x.m.name}`));
  console.log(`\n━━ ราคาต่ำกว่า Hato (ยึดแพงสุด) ${toFixPrice.length}`);
  toFixPrice.forEach((x) => console.log(`   ${x.m.code} · ฿${x.m.price} → ฿${x.h.price} · ${x.m.name}`));
  console.log(`\n━━ ตรงอยู่แล้ว ${ok.length}`);
  if (held.length) {
    console.log(`\n━━ 🛑 กันไว้ ไม่สร้างอัตโนมัติ ${held.length} (ต้องให้เจ้าของตัดสินใจ)`);
    held.forEach((x) => console.log(`   ${x.h.sku} · ${x.h.name} · ฿${x.h.price} → ${x.why}`));
  }

  if (!APPLY) { console.log('\n(dry-run — ใส่ --apply เพื่อลงมือจริง)'); return; }

  let c = 0, o = 0, p = 0;
  for (const x of toCreate) {
    const row = { code: x.h.sku, name: cleanName(x.h.name), category: x.target, type: 'single', price: x.h.price, is_available: true, description: '', calories: 0 };
    const r = await fetch(`${SB}/rest/v1/menu_items`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(row) });
    if (!r.ok) { console.log(`   ❌ สร้าง ${x.h.sku}: ${r.status} ${(await r.text()).slice(0, 70)}`); continue; }
    const ins = (await r.json())[0]; c++;
    // ใส่รูปจาก Hato (โหลดมาเก็บ Storage เรา ไม่ hotlink)
    if (x.h.img) {
      try {
        const im = await fetch(x.h.img);
        if (im.ok) {
          const buf = Buffer.from(await im.arrayBuffer());
          const safe = /^[A-Za-z0-9._-]+$/.test(x.h.sku) ? x.h.sku : ins.id;
          const up = await fetch(`${SB}/storage/v1/object/menu-images/${safe}.jpg`, { method: 'POST', headers: { ...H, 'x-upsert': 'true', 'Content-Type': 'image/jpeg' }, body: buf });
          if (up.ok) await fetch(`${SB}/rest/v1/menu_items?id=eq.${ins.id}`, { method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ image_urls: [`${SB}/storage/v1/object/public/menu-images/${safe}.jpg`] }) });
        }
      } catch (e) { /* รูปพลาดไม่เป็นไร เมนูสร้างแล้ว */ }
    }
  }
  for (const x of toOpen) {
    const r = await fetch(`${SB}/rest/v1/menu_items?id=eq.${x.m.id}`, { method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ is_available: true }) });
    if (r.ok) o++;
  }
  for (const x of toFixPrice) {
    const r = await fetch(`${SB}/rest/v1/menu_items?id=eq.${x.m.id}`, { method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ price: x.h.price }) });
    if (r.ok) p++;
  }
  console.log(`\n✅ สร้าง ${c} · เปิดขาย ${o} · แก้ราคา ${p}`);
})().catch((e) => { console.error('💥 ' + e.message); process.exit(1); });

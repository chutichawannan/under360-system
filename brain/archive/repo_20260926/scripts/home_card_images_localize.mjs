#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// home_card_images_localize.mjs — ย้ายรูปการ์ดหน้าโฮมจาก CDN ภายนอก → Storage เรา
//
// ⏰ ทำไม: การ์ดเซ็ต 7 ใบเคย wire ด้วย URL ของ Hato CDN ตรงๆ (hotlink)
//    บอกเลิก Hato 7 ส.ค. 2026 → CDN ตาย = หน้าโฮมรูปแตกทั้งแถบ
//
// รันซ้ำได้ — ข้ามใบที่ย้ายแล้วอัตโนมัติ
// ═══════════════════════════════════════════════════════════════

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: SK, Authorization: 'Bearer ' + SK };
const BUCKET = 'menu-images'; // ใช้ bucket เดิม (public + anon เขียนได้อยู่แล้ว)

(async () => {
  // ⚠️ home_layout ไม่มีคอลัมน์ id — key คือ section_key
  const cards = await (await fetch(`${SB}/rest/v1/home_layout?select=section_key,title,bg_image&is_active=eq.true&order=sort_order`, { headers: H })).json();
  if (!Array.isArray(cards)) { console.error('❌ query ไม่คืน array: ' + JSON.stringify(cards).slice(0, 160)); process.exit(1); }
  const ext = cards.filter((c) => c.bg_image && /^https?:\/\//.test(c.bg_image) && !c.bg_image.includes('zdartbvhbvqlwzwyyiia'));
  console.log(`การ์ดทั้งหมด ${cards.length} · ชี้ CDN ภายนอก ${ext.length} ใบ`);
  if (!ext.length) return console.log('✅ ไม่มีอะไรต้องย้าย');

  let ok = 0;
  for (const c of ext) {
    try {
      let img = null, err = '';
      for (let a = 0; a < 3; a++) {
        try { img = await fetch(c.bg_image); if (img.ok) break; err = 'http ' + img.status; img = null; }
        catch (e) { err = e.message.slice(0, 40); img = null; }
        await new Promise((r) => setTimeout(r, 600 * (a + 1)));
      }
      if (!img) { console.log(`   ❌ ${c.title}: ${err}`); continue; }
      const buf = Buffer.from(await img.arrayBuffer());

      // ชื่อไฟล์ยึด section_key (ASCII เสมอ) กัน key ไม่ valid
      const path = `card_${c.section_key.replace(/[^A-Za-z0-9._-]/g, '_')}.jpg`;
      const up = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, {
        method: 'POST', headers: { ...H, 'x-upsert': 'true', 'Content-Type': 'image/jpeg' }, body: buf,
      });
      if (!up.ok) { console.log(`   ❌ ${c.title}: upload ${up.status}`); continue; }

      const pub = `${SB}/storage/v1/object/public/${BUCKET}/${path}`;
      const pa = await fetch(`${SB}/rest/v1/home_layout?section_key=eq.${encodeURIComponent(c.section_key)}`, {
        method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ bg_image: pub }), // ⚠️ แตะเฉพาะ bg_image — ห้ามส่ง field อื่นทับ
      });
      if (!pa.ok) { console.log(`   ❌ ${c.title}: db ${pa.status}`); continue; }
      console.log(`   ✅ ${c.title} → ${path} (${Math.round(buf.length / 1024)}KB)`);
      ok++;
    } catch (e) { console.log(`   ❌ ${c.title}: ${e.message.slice(0, 50)}`); }
  }
  console.log(`\nย้ายสำเร็จ ${ok}/${ext.length}`);
})().catch((e) => { console.error('💥 ' + e.message); process.exit(1); });

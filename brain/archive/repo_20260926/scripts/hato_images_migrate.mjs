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
// hato_images_migrate.mjs — ย้ายรูปเมนูจาก Hato CDN → Supabase Storage ของเรา
//
// ⏰ ทำไมต้องรีบ: บอกเลิก Hato 7 ส.ค. 2026 — หลังจากนั้น CDN อาจตาย
//    เก็บแค่ URL ของ Hato ไม่พอ ต้องโหลดไฟล์มาไว้ที่ Storage เราเอง
//
// ⚠️ ทำไมไม่ทำใน browser: cloudfront ของ Hato ไม่ส่ง CORS header
//    → fetch จากหน้าเว็บโดน block ("Failed to fetch") · node ไม่ติด CORS
//
// วิธีใช้: node scripts/hato_images_migrate.mjs [จำนวนที่จะทำ]
//   mapping มาจากห้อง p-img ใน session_messages (browser เขียนไว้ให้)
//   รันซ้ำได้ — ข้ามตัวที่มีรูปแล้วอัตโนมัติ
// ═══════════════════════════════════════════════════════════════

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: SK, Authorization: 'Bearer ' + SK };
const LIMIT = +(process.argv[2] || 400);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // 1) อ่าน mapping ที่ browser เขียนไว้ (ห้อง p-img)
  const msgs = await (await fetch(`${SB}/rest/v1/session_messages?select=sender,text&room=eq.p-img&order=created_at.desc&limit=10`, { headers: H })).json();
  if (!msgs.length) { console.error('❌ ไม่พบ mapping ในห้อง p-img — ให้ browser เขียนก่อน'); process.exit(1); }
  const latest = msgs.filter((m) => m.sender.startsWith('imgmap-')).sort((a, b) => a.sender.localeCompare(b.sender));
  const todo = JSON.parse(latest.map((m) => m.text).join(''));
  console.log(`📋 mapping ${todo.length} รายการ`);

  // 2) ข้ามตัวที่มีรูปแล้ว (รันซ้ำได้)
  let have = new Set();
  for (let i = 0; i < todo.length; i += 100) {
    const ids = todo.slice(i, i + 100).map((t) => t.id).join(',');
    const rows = await (await fetch(`${SB}/rest/v1/menu_items?select=id,image_urls&id=in.(${ids})`, { headers: H })).json();
    rows.forEach((r) => { if (r.image_urls && r.image_urls.length) have.add(r.id); });
  }
  const work = todo.filter((t) => !have.has(t.id)).slice(0, LIMIT);
  console.log(`   มีรูปแล้ว ${have.size} · จะทำรอบนี้ ${work.length}\n`);

  let ok = 0, fail = 0;
  const fails = [];
  for (const [i, t] of work.entries()) {
    try {
      // retry 3 ครั้ง — CDN/เน็ตสะดุดกลางทางเคยทำให้ทั้ง job ตาย
      let img = null, lastErr = '';
      for (let a = 0; a < 3; a++) {
        try { img = await fetch(t.url); if (img.ok) break; lastErr = 'cdn ' + img.status; img = null; }
        catch (e) { lastErr = String(e.message).slice(0, 40); img = null; }
        await sleep(700 * (a + 1));
      }
      if (!img) { fails.push(`${t.code}: ${lastErr}`); fail++; continue; }
      const buf = Buffer.from(await img.arrayBuffer());
      if (buf.length < 1000) { fails.push(`${t.code}: ไฟล์เล็กผิดปกติ ${buf.length}b`); fail++; continue; }

      // Storage key รับเฉพาะ ASCII — code ที่เป็นภาษาไทย (เช่น "กานาฉ่าย") ต้องใช้ id แทน
      const safe = /^[A-Za-z0-9._-]+$/.test(t.code) ? t.code : t.id;
      const path = `${safe}.jpg`;
      const up = await fetch(`${SB}/storage/v1/object/menu-images/${path}`, {
        method: 'POST', headers: { ...H, 'x-upsert': 'true', 'Content-Type': 'image/jpeg' }, body: buf,
      });
      if (!up.ok) { fails.push(`${t.code}: upload ${up.status} ${(await up.text()).slice(0, 60)}`); fail++; continue; }

      const pub = `${SB}/storage/v1/object/public/menu-images/${path}`;
      const pa = await fetch(`${SB}/rest/v1/menu_items?id=eq.${t.id}`, {
        method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ image_urls: [pub] }),
      });
      if (!pa.ok) { fails.push(`${t.code}: db ${pa.status}`); fail++; continue; }

      ok++;
      if (ok % 25 === 0 || i === work.length - 1) console.log(`   ${ok}/${work.length} · ล่าสุด ${t.code}${t.on ? ' (ขายอยู่)' : ''}`);
      await sleep(120); // ถนอม CDN
    } catch (e) { fails.push(`${t.code}: ${String(e.message).slice(0, 50)}`); fail++; }
  }

  console.log(`\n✅ สำเร็จ ${ok} · ❌ พลาด ${fail}`);
  if (fails.length) { console.log('รายการที่พลาด:'); fails.slice(0, 15).forEach((f) => console.log('   ' + f)); }
})().catch((e) => { console.error('💥 job ตายกลางทาง: ' + e.message + '\n   (รันซ้ำได้ — ข้ามตัวที่มีรูปแล้วอัตโนมัติ)'); process.exit(1); });

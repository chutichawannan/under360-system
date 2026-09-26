// ══════════════════════════════════════════════════════════════════════
// ตรวจว่า "ส่งข้อความ LINE หาลูกค้าของเราได้จริงไหม"   (แก้ใหญ่ 18 ส.ค. 2026)
// ══════════════════════════════════════════════════════════════════════
//
// ⚠️ ของเดิมตอบผิด — อ่านผลแล้วเข้าใจกลับด้าน
//    เดิมมันเทียบแค่ "uid จาก LIFF เรา" กับ "uid ที่เก็บไว้ยุค Hato" แล้วสรุปว่า
//    ไม่ตรง = push ไม่ผ่าน  →  🔴 มาตลอด
//    แต่การเทียบนั้น **ไม่ได้ทดสอบแชนแนล Messaging API เลยสักครั้ง** มันวัดแค่ว่า
//    LIFF ของเรากับ LIFF ของ Hato อยู่คนละ provider (จริง แต่คนละคำถาม)
//
//    คำถามที่ต้องตอบคือ: **แชนแนล Messaging API ของ OA (2005639534) รับ uid ที่ LIFF
//    ของเราเก็บมาไหม** — ตอบได้ทางเดียวคือดูว่า "เคย push สำเร็จจริงหรือยัง"
//
// ✅ หลักฐานที่ใช้ตอนนี้: kitchen_data key 'order_notified'
//    api/notify-order-confirm.js จะเขียนเลขใบลงคีย์นี้ **เฉพาะตอน LINE ตอบ r.ok**
//    (ดู `if (r.ok) { ok++; sentSet.add(...) }`) → มีเลขใบอยู่ = push ผ่านจริงแล้ว
//
// รัน: node scripts/cc_check_uid_scope.mjs
// ══════════════════════════════════════════════════════════════════════

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const get = async (q) => {
  const r = await fetch(B + q, { headers: H });
  if (!r.ok) throw new Error('อ่าน Supabase ไม่ได้: HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
};
const norm = (p) => String(p || '').replace(/\D/g, '').slice(-9);

// ── ① หลักฐานตรง: เคย push สำเร็จหรือยัง ──────────────────────────────
const kd = await get('kitchen_data?key=eq.order_notified&select=data');
const sent = kd[0]?.data?.orders || [];
console.log('══ ① ใบที่ LINE ตอบ "ส่งสำเร็จ" แล้ว : ' + sent.length + ' ใบ ══');
if (sent.length) console.log('   ' + sent.slice(-10).join(', '));

let proven = false;
for (const num of sent) {
  const o = (await get(`orders?order_number=eq.${num}&select=order_number,line_uid,customer_name,source,created_at`))[0];
  if (!o?.line_uid) continue;
  const inHato = await get(`orders?line_uid=eq.${o.line_uid}&order_number=like.HT-*&select=order_number&limit=1`);
  const fromOurLiff = o.order_number.startsWith('U-') && inHato.length === 0;
  console.log(`   ${o.order_number} · ${o.customer_name} · src=${o.source} · uid=${o.line_uid.slice(0, 9)}…` +
    (fromOurLiff ? '  ← uid นี้มาจาก LIFF ของเราล้วน (ไม่เคยโผล่ยุค Hato)' : ''));
  if (fromOurLiff) proven = true;
}

// ── ② uid ยุค Hato ใช้ต่อไม่ได้ (เรื่องจริง แต่คนละคำถามกับข้อ ①) ──────
const mine = await get('orders?select=order_number,line_uid,customer_phone&order_number=like.U-*&line_uid=not.is.null&order=created_at.desc&limit=300');
const hato = [];
for (let off = 0; off < 12000; off += 1000) {
  const b = await get(`orders?select=line_uid,customer_phone&order_number=like.HT-*&line_uid=not.is.null&order=created_at.desc&limit=1000&offset=${off}`);
  if (!Array.isArray(b) || !b.length) break;
  hato.push(...b);
  if (b.length < 1000) break;
}
const byPhone = new Map();
for (const o of hato) { const p = norm(o.customer_phone); if (p.length === 9) (byPhone.get(p) || byPhone.set(p, new Set()).get(p)).add(o.line_uid); }
let same = 0, diff = 0;
for (const o of mine) { const s = byPhone.get(norm(o.customer_phone)); if (!s) continue; s.has(o.line_uid) ? same++ : diff++; }
console.log('\n══ ② คนเดียวกัน (เบอร์ตรงกัน) uid ยุค Hato vs uid LIFF เรา ══');
console.log(`   ตรงกัน ${same} · ไม่ตรง ${diff}  → uid ที่ migrate มาจาก Hato ${diff > 0 && same === 0 ? '**ใช้ push ไม่ได้**' : 'ใช้ได้'}`);

// ── สรุป ─────────────────────────────────────────────────────────────
console.log('\n════════════════ สรุป ════════════════');
if (proven) {
  console.log('🟢 ส่งข้อความหาลูกค้าได้จริง — พิสูจน์แล้วด้วยใบที่ push ผ่าน');
  console.log('   → แชนแนล Messaging API ของ OA รับ uid ที่ LIFF ของเราเก็บมา = **ไม่ต้องย้ายแชนแนล**');
} else if (sent.length) {
  console.log('🟡 มีใบที่ push ผ่าน แต่ยังไม่มีใบไหนยืนยันได้ว่า uid มาจาก LIFF เราล้วน');
} else {
  console.log('🟡 ยังไม่เคย push สำเร็จสักใบ → ยังฟันธงไม่ได้');
  console.log('   วิธีพิสูจน์: /api/notify-order-confirm?order=<เลขใบ U-> (ส่งจริง 1 ใบ) แล้วรันตัวนี้ซ้ำ');
}
console.log('');
console.log('⚠️ สิ่งที่ยังทำไม่ได้เหมือนเดิม: ลูกค้าที่มีแต่ uid ยุค Hato (ไม่เคยเปิด LIFF ใหม่)');
console.log('   → ส่งหาคนกลุ่มนั้นต้องใช้ broadcast จาก OA Manager ไม่ใช่ push ด้วย uid');
console.log('   → ตัวเลขปัจจุบัน: ใบ U- ที่มี uid ใช้ push ได้ ' + mine.length + ' ใบ · uid ยุค Hato ' + hato.length + ' ใบใช้ไม่ได้');

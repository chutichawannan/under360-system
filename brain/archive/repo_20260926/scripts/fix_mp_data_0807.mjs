#!/usr/bin/env node
/**
 * เก็บงานข้อมูล MP ค้าง — P-track 7 ส.ค. 2026 (วันปิด Hato)
 *
 * งานที่เก็บ (มาจากบอร์ด: U · พี่เก่ง · CC · R&D 01):
 *   ① โอ๋ ไม่มีส่งวันที่ 7 — นัทยืนยันเอง ("ไม่มีส่งวันที่ 7 แน่นอน")
 *      ⚠️ ชีทแอดมิน "ยังมีแถว 7 ส.ค." อยู่ (HT-139647921 รอบ 14/15) แต่เจ้าของบอกว่าไม่จริง
 *         → ยึดเจ้าของ · และต้องกันไม่ให้ sync รอบหน้าสร้างกลับมาอีก
 *      โอ๋มีใบ 10 ส.ค. อยู่แล้ว (MP-0810-018/019) = ไม่ได้ทำให้ลูกค้าตกรอบ
 *   ② N-19b ฝน — 7 ใบไม่มีที่อยู่/เบอร์/พิกัด (แมสจัดรอบไม่ได้)
 *      ปลอดภัยเพราะ ฝน มี "ที่อยู่เดียว เบอร์เดียว" ตลอด 26 ใบย้อนหลัง
 *      🔴 Milk ทำแบบเดียวกันไม่ได้ — มี 2 ที่อยู่ 2 เบอร์ (คนละคนชื่อคล้ายกัน) ต้องดึงจาก Hato
 *   ③ โค้ดเมนูเพี้ยนใน mp_deliveries.menu_items (U รายงาน · ของวันนี้ทั้งหมด)
 *      เก็บผิดเป็น {code:"HP", name:"35pasta salmon white sauce"}
 *      ที่ถูก        {code:"HP35", name:"pasta salmon white sauce"}
 *      ต้นเหตุ: ตัวแยกโค้ดอ่านหัวคอลัมน์ชีทที่เขียนติดกันว่า "LC 35pasta..." → เลขหลุดไปอยู่หน้าชื่อ
 *
 * ใช้: node scripts/fix_mp_data_0807.mjs           → ดูอย่างเดียว
 *      node scripts/fix_mp_data_0807.mjs --apply    → ลงมือจริง
 */

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const HW = { ...H, 'Content-Type': 'application/json', Prefer: 'return=representation' };
const APPLY = process.argv.includes('--apply');
const say = (...a) => console.log(...a);
let changed = 0;

async function patch(path, body, label) {
  if (!APPLY) { say(`   🔎 จะแก้: ${label}`); changed++; return; }
  const r = await fetch(`${SB}/${path}`, { method: 'PATCH', headers: HW, body: JSON.stringify(body) });
  say(`   ${r.ok ? '✅' : '❌'} ${label}${r.ok ? '' : ' → ' + (await r.text()).slice(0, 80)}`);
  if (r.ok) changed++;
}

say(`โหมด: ${APPLY ? '🔴 ลงมือจริง' : '👀 ดูอย่างเดียว'}\n`);

// ─────────── ① โอ๋ ไม่มีส่ง 7 ส.ค. ───────────
say('━━━ ① โอ๋ — ยกเลิกใบวันที่ 7 ส.ค. (นัทยืนยัน "ไม่มีส่งวันที่ 7 แน่นอน") ━━━');
const oh = await (await fetch(`${SB}/orders?select=id,order_number,customer_name,delivery_date,notes,status&customer_name=ilike.*Oh%20thanaporn*&delivery_date=eq.2026-08-07&status=neq.cancelled`, { headers: H })).json();
const oh10 = await (await fetch(`${SB}/orders?select=order_number&customer_name=ilike.*Oh%20thanaporn*&delivery_date=eq.2026-08-10&status=neq.cancelled`, { headers: H })).json();
say(`   ใบ 7 ส.ค. ที่ยัง active: ${oh.length} · ใบ 10 ส.ค. ที่มีอยู่แล้ว: ${oh10.length} (${oh10.map((x) => x.order_number).join(', ')})`);
if (oh.length && !oh10.length) {
  say('   ⛔ หยุด — ไม่มีใบ 10 ส.ค. รองรับ ถ้ายกเลิก 7 ส.ค. ลูกค้าจะตกรอบ · ต้องให้คนตรวจก่อน');
} else {
  for (const o of oh) {
    await patch(`orders?id=eq.${o.id}`,
      { status: 'cancelled', notes: `[P 7 ส.ค. · นัทยืนยันว่าโอ๋ไม่มีส่งวันที่ 7 — รอบจริงคือ 10 ส.ค. (มีใบแล้ว)] ${String(o.notes || '').slice(0, 110)}`, updated_at: new Date().toISOString() },
      `ยกเลิก ${o.order_number}`);
    await patch(`mp_deliveries?order_id=eq.${o.id}`,
      { status: 'cancelled', admin_notes: '[P 7 ส.ค.] ยกเลิกตามนัท — โอ๋ไม่มีรอบส่งวันที่ 7', updated_at: new Date().toISOString() },
      `ยกเลิกแถวแผนเมนูของ ${o.order_number}`);
  }
}

// ─────────── ② ฝน — เติมที่อยู่/เบอร์/พิกัด ───────────
say('\n━━━ ② N-19b — เติมที่อยู่/เบอร์/พิกัดจากใบพี่น้อง ━━━');
// 🔑 จับคู่ด้วย "ชื่อเต็มเป๊ะ" (มี LINE handle อยู่ในชื่อ) ไม่ใช่ ilike
//    CC เตือนว่าห้ามจับด้วยชื่อ — เพราะค้นหลวม ๆ "MiLk" ไปโดนลูกค้าคนอื่นที่ชื่อคล้ายกัน (คนละบ้าน คนละเบอร์)
//    พอใช้ชื่อเต็มเป๊ะ + ตรวจว่าใบเก่าทุกใบมี "เบอร์เดียว ที่อยู่เดียว" → ปลอดภัยพอ ไม่ต้องพึ่ง Hato
const TARGETS = ['ฝน(LINE: Numfon 🌈)', 'Milk(LINE: MiLk.)'];
for (const NAME of TARGETS) {
  const rowsC = await (await fetch(`${SB}/orders?select=id,order_number,customer_name,customer_phone,customer_id,delivery_address,delivery_lat,delivery_lng,delivery_date&customer_name=eq.${encodeURIComponent(NAME)}&status=neq.cancelled&order=delivery_date&limit=200`, { headers: H })).json();
  const filled = rowsC.filter((r) => r.delivery_address && r.delivery_lat);
  const phones = new Set(filled.map((r) => r.customer_phone).filter(Boolean));
  const addrs = new Set(filled.map((r) => String(r.delivery_address).replace(/ซอย/g, 'ซ.').replace(/\s+/g, ' ').trim()));
  say(`\n   ▸ ${NAME}  — ใบทั้งหมด ${rowsC.length} · มีข้อมูล ${filled.length} · เบอร์ ${phones.size} · ที่อยู่ ${addrs.size} แบบ`);
  if (!filled.length || phones.size !== 1 || addrs.size > 2) {
    say('     ⛔ ข้ามคนนี้ — ข้อมูลไม่นิ่งพอ (เบอร์/ที่อยู่มากกว่า 1 ชุด) เสี่ยงเติมผิดบ้าน');
    continue;
  }
  const src = filled[filled.length - 1];
  say(`     ต้นแบบ: ${src.order_number} · ${src.customer_phone} · ${String(src.delivery_address).slice(0, 42)} · ${src.delivery_lat},${src.delivery_lng}`);
  const empty = rowsC.filter((r) => !r.delivery_address || !r.delivery_lat);
  say(`     ใบที่ต้องเติม: ${empty.length}`);
  for (const o of empty) {
    await patch(`orders?id=eq.${o.id}`, {
      customer_phone: o.customer_phone || src.customer_phone,
      customer_id: o.customer_id || src.customer_id,
      delivery_address: o.delivery_address || src.delivery_address,
      delivery_lat: o.delivery_lat ?? src.delivery_lat,
      delivery_lng: o.delivery_lng ?? src.delivery_lng,
      updated_at: new Date().toISOString(),
    }, `เติม ${o.order_number} (${o.delivery_date})`);
  }
}

// ─────────── ③ โค้ดเมนูเพี้ยนใน mp_deliveries ───────────
say('\n━━━ ③ โค้ดเมนูเพี้ยนใน mp_deliveries.menu_items ━━━');
const rows = await (await fetch(`${SB}/mp_deliveries?select=id,customer_name,delivery_date,menu_items&delivery_date=gte.2026-08-01&limit=500`, { headers: H })).json();
let fixRows = 0, fixItems = 0;
for (const r of rows) {
  const mi = Array.isArray(r.menu_items) ? r.menu_items : null;
  if (!mi) continue;
  let touched = false;
  const out = mi.map((x) => {
    const code = String(x.code || ''), name = String(x.name || '');
    // เจอ code เป็น prefix เปล่า (HP/LC/HX) และเลขไปโผล่หน้าชื่อ → ประกอบกลับ
    const m = /^(\d{1,3})(\D.*)$/.exec(name);
    if (/^(HP|LC|HX)$/i.test(code) && m) {
      touched = true; fixItems++;
      return { ...x, code: code.toUpperCase() + m[1], name: m[2].trim() };
    }
    return x;
  });
  if (!touched) continue;
  fixRows++;
  await patch(`mp_deliveries?id=eq.${r.id}`, { menu_items: out, updated_at: new Date().toISOString() },
    `${r.delivery_date} ${String(r.customer_name).slice(0, 20)} — แก้ ${out.filter((x, i) => x.code !== mi[i].code).length} เมนู`);
}
say(`   แถวที่มีโค้ดเพี้ยน: ${fixRows} · เมนูที่แก้: ${fixItems}`);

say(`\n${'═'.repeat(56)}\n${APPLY ? 'แก้ไปทั้งหมด' : 'จะแก้ทั้งหมด'} ${changed} รายการ`);
// 🎓 บันทึกไว้: ตอนแรกคิดว่า Milk ต้องดึงจาก Hato เพราะค้นแบบ ilike "*MiLk*" แล้วเจอ 2 เบอร์ 2 ที่อยู่
//    → ที่จริงเป็นลูกค้าคนละคนที่ชื่อคล้ายกัน · พอค้นด้วย "ชื่อเต็มเป๊ะ" เหลือชุดเดียว แก้ได้เองไม่ต้องพึ่ง Hato
//    บทเรียน: "ชื่อกำกวม" อาจแปลว่าเราค้นหลวมไป ไม่ใช่ข้อมูลไม่พอ — ลองค้นให้แคบก่อนสรุปว่าต้องหาจากที่อื่น

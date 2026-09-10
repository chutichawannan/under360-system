/**
 * แก้ตาม: **มีแค่ D1-D5 เท่านั้น** (นัทแจ้ง 17 ส.ค. 2026 — ผมตั้ง D6/D9 ผิด ไม่มีช่องพวกนั้นจริง)
 *
 * ผลลัพธ์ที่ถูก — D1-D5 จับคู่ S1-S5 ตรงตัว:
 *   D1 แซลมอนซอสแกงเขียวหวาน      ↔ S1
 *   D2 ปลากระพงผัดฉ่า             ↔ S2
 *   D3 โอยาโกะด้งแบบกับข้าว        ↔ S3
 *   D4 ผักกาดห่ออกไก่ฯ แบบกับข้าว  ↔ S4
 *   D5 มีทบอลอกไก่                ↔ S5
 *
 * 2 ตัวที่หลุดจากชุด (เพราะมีแค่ 5 ช่อง) — ล้าง subcode ทิ้ง แต่ **ยังเปิดขายไว้ตามเดิม**
 * ไม่ปิดการขาย/ไม่ถอดธงเมนูสัปดาห์ เพราะครัวอาจผลิตไปแล้ว → ให้นัทเคาะเองว่าจะเอาออกไหม
 *   D156 ยำหมูหวาน            (คู่กับ S6 แต่ไม่มีช่อง D6)
 *   D152 สะโพกไก่อบกระเทียมเห็ด (ไม่มีคู่ S เลย)
 *
 * รัน: node scripts/niw/fix_subcode_pairs2.mjs
 */

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'content-type': 'application/json', Prefer: 'return=representation' };

async function patch(code, body, label) {
  const r = await fetch(SB + '/rest/v1/menu_items?code=eq.' + code, { method: 'PATCH', headers: H, body: JSON.stringify(body) });
  const t = await r.text();
  console.log('  ' + (r.ok ? '✅' : '❌ ' + r.status) + ' ' + label + (r.ok ? '' : ' — ' + t.slice(0, 200)));
}

async function main() {
  console.log('=== แก้ให้เหลือแค่ D1-D5 ===\n');
  await patch('D156', { subcode: null }, 'D156 ยำหมูหวาน — ล้าง D6 (ยังเปิดขายตามเดิม)');
  await patch('D152', { subcode: null }, 'D152 สะโพกไก่อบกระเทียมเห็ด — ล้าง D9 (ยังเปิดขายตามเดิม)');

  // นัทสั่ง: D3 ยังไม่มีรูป → ใช้รูปของ S3 ไปก่อน (เมนูเดียวกัน แค่ไม่มีข้าว)
  const s3 = await (await fetch(SB + '/rest/v1/menu_items?select=image_urls&code=eq.S030', { headers: { apikey: KEY } })).json();
  const img = s3[0]?.image_urls || [];
  if (img.length) await patch('D030', { image_urls: img }, 'D030 ใช้รูปของ S030 (' + img[0].split('/').pop() + ')');
  else console.log('  ⚠️ S030 ไม่มีรูปให้ยืม');

  console.log('\n=== ตรวจผลจริง ===');
  const v = await fetch(SB + '/rest/v1/menu_items?select=subcode,code,name,price,is_available&subcode=not.is.null&order=subcode', { headers: { apikey: KEY } });
  const list = await v.json();
  const S = list.filter(x => /^S/i.test(x.subcode));
  const D = list.filter(x => /^D/i.test(x.subcode));
  console.log('\n【กับข้าว D】 ' + D.length + ' ตัว' + (D.length === 5 ? ' ✅ ครบ 5 พอดี' : ' ⚠️ ต้องเป็น 5'));
  for (const x of D) console.log('  ' + String(x.subcode).padEnd(4) + ' ' + String(x.code).padEnd(6) + ' ' + String(x.name).slice(0, 40).padEnd(42) + '฿' + String(x.price).padStart(4));
  console.log('\n【ข้าวกล่อง S】 ' + S.length + ' ตัว');
  for (const x of S) console.log('  ' + String(x.subcode).padEnd(4) + ' ' + String(x.code).padEnd(6) + ' ' + String(x.name).slice(0, 40).padEnd(42) + '฿' + String(x.price).padStart(4));

  // เตือนถ้าเลขไม่ตรงกัน
  const bad = D.filter(d => !S.some(s => s.subcode.slice(1) === d.subcode.slice(1)));
  console.log('\n' + (bad.length ? '⚠️ D ที่ไม่มี S เลขเดียวกัน: ' + bad.map(x => x.subcode).join(', ') : '✅ D1-D5 มี S1-S5 คู่ครบทุกตัว'));

  // เมนูสัปดาห์นี้ที่ไม่มี subcode (หลุดจากชุด)
  const w = await fetch(SB + '/rest/v1/menu_items?select=code,name,is_available,subcode&is_weekly_special=eq.true&subcode=is.null&order=code', { headers: { apikey: KEY } });
  const orphan = (await w.json()).filter(x => x.is_available);
  console.log('\n📋 เมนูที่ติดธง "เมนูสัปดาห์" แต่ไม่มีชื่อเล่น (' + orphan.length + ' ตัว) — เผื่อนัทอยากเคลียร์:');
  for (const x of orphan.slice(0, 40)) console.log('  ' + String(x.code).padEnd(6) + ' ' + String(x.name).slice(0, 44));
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

/**
 * ติดแท็กสัปดาห์ให้เมนูพิเศษที่ยังไม่มีป้าย — นัทเจอเอง 17 ส.ค. (D3/D4 ไม่มีป้ายบน LIFF)
 *
 * ป้าย "เมนูพิเศษ 17-23 Aug" ที่ลูกค้าเห็น มาจาก kitchen_data key `menu_special_weeks`
 *   { "S172": "2026-08-17", ... }  ← เก็บเป็น "วันจันทร์ต้นสัปดาห์"
 * คนละที่กับ `menu_items.is_weekly_special` และคนละที่กับ `subcode`
 * → เมนูที่เพิ่งสร้าง/เพิ่งเปิด จะไม่มีป้ายจนกว่าจะติดแท็ก
 *
 * 🖐️ ติดมือได้ที่: หน้า Home Editor → แถวเมนู → ปุ่ม "🏷️ ติดแท็ก" → เลือกสัปดาห์
 *
 * รัน: node scripts/niw/tag_week_specials.mjs [--dry]
 */
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'content-type': 'application/json' };
const DRY = process.argv.includes('--dry');

/** วันจันทร์ต้นสัปดาห์ — ยึดเวลาไทยเสมอ (นัทอยู่ PST คิดจากเครื่องจะติดผิดสัปดาห์) */
function thisWeekStartBkk() {
  const n = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  n.setHours(0, 0, 0, 0);
  n.setDate(n.getDate() - ((n.getDay() + 6) % 7));
  return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
}

async function main() {
  const week = thisWeekStartBkk();
  console.log('สัปดาห์นี้ (เวลาไทย) = ' + week + '\n');

  const menus = await (await fetch(SB + '/rest/v1/menu_items?select=code,name,subcode&subcode=not.is.null&order=subcode', { headers: { apikey: KEY } })).json();
  const kd = await (await fetch(SB + '/rest/v1/kitchen_data?select=data&key=eq.menu_special_weeks', { headers: { apikey: KEY } })).json();
  const map = (kd[0] && kd[0].data) || {};

  const missing = menus.filter(m => map[m.code] !== week);
  console.log('เมนูที่มีชื่อเล่น (S1-S8/D1-D5): ' + menus.length + ' ตัว');
  console.log('ยังไม่มีป้ายสัปดาห์นี้: ' + missing.length + ' ตัว');
  for (const m of missing) console.log('  ' + String(m.subcode).padEnd(4) + ' ' + String(m.code).padEnd(6) + ' ' + String(m.name).slice(0, 38) + '   (เดิม: ' + (map[m.code] || 'ไม่มีป้าย') + ')');

  if (!missing.length) { console.log('\n✅ ครบทุกตัวแล้ว ไม่ต้องแก้'); return; }
  if (DRY) { console.log('\n[dry] ไม่ได้เขียนจริง'); return; }

  for (const m of missing) map[m.code] = week;
  const r = await fetch(SB + '/rest/v1/kitchen_data?on_conflict=key', {
    method: 'POST',
    headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ key: 'menu_special_weeks', data: map, updated_at: new Date().toISOString() }),
  });
  console.log('\n' + (r.ok ? '✅ ติดแท็กแล้ว ' + missing.length + ' ตัว' : '❌ ' + r.status + ' ' + (await r.text()).slice(0, 200)));

  // ตรวจซ้ำจากของจริง
  const kd2 = await (await fetch(SB + '/rest/v1/kitchen_data?select=data&key=eq.menu_special_weeks', { headers: { apikey: KEY } })).json();
  const map2 = (kd2[0] && kd2[0].data) || {};
  const still = menus.filter(m => map2[m.code] !== week);
  console.log('ตรวจซ้ำ: ' + (still.length ? '❌ ยังขาด ' + still.map(x => x.code).join(', ') : '✅ ครบ ' + menus.length + '/' + menus.length + ' ตัว'));
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

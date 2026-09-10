/**
 * แก้ชื่อเล่นเมนู (subcode) ให้ D ตรงกับ S — นัทสั่งเอง 17 ส.ค. 2026
 *
 * ปัญหา: เลข D ไม่ได้ไล่ตาม S → S3/D3 กับ S4/D4 เป็นคนละเมนู
 * นัทเคาะ: "D3 = โอยาโกะด้งแบบกับข้าว · D4 = ผักกาดห่ออกไก่ น้ำจิ้มสุกี้ แบบกับข้าว"
 *          (เมนูเดียวกับ S แค่ไม่มีข้าว)
 *
 * ผลลัพธ์ที่ต้องการ (ยึด S เป็นหลัก):
 *   D1 แซลมอนซอสแกงเขียวหวาน      ↔ S1   (เดิมถูกแล้ว)
 *   D2 ปลากระพงผัดฉ่า             ↔ S2   (เดิมถูกแล้ว)
 *   D3 โอยาโกะด้งแบบกับข้าว        ↔ S3   ← สร้างใหม่ (D030 เลขคู่ S030)
 *   D4 ผักกาดห่ออกไก่ฯ แบบกับข้าว  ↔ S4   ← ใช้ D131 ที่มีอยู่ (เดิมปิดขาย)
 *   D5 มีทบอลอกไก่                ↔ S5   (เดิมถูกแล้ว)
 *   D6 ยำหมูหวาน                  ↔ S6   ← ย้ายมาจาก D3
 *   D9 สะโพกไก่อบกระเทียมเห็ด      = ไม่มีคู่ S ← ย้ายมาจาก D4
 *
 * ราคา D030 = ฿80 (ตามแพทเทิร์นของคู่อื่น: S ฿125 → D ฿70-80)
 * รัน: node scripts/niw/fix_subcode_pairs.mjs [--dry]
 */

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'content-type': 'application/json', Prefer: 'return=representation' };
const DRY = process.argv.includes('--dry');

async function patch(code, body, label) {
  if (DRY) { console.log('  [dry] PATCH ' + code + ' ' + JSON.stringify(body)); return; }
  const r = await fetch(SB + '/rest/v1/menu_items?code=eq.' + code, { method: 'PATCH', headers: H, body: JSON.stringify(body) });
  const t = await r.text();
  console.log('  ' + (r.ok ? '✅' : '❌ ' + r.status) + ' ' + label + (r.ok ? '' : ' — ' + t.slice(0, 200)));
}

async function main() {
  console.log('=== แก้ subcode ให้ D ตรงกับ S ' + (DRY ? '(ทดลอง ไม่เขียนจริง)' : '') + ' ===\n');

  // ① ต้องย้ายของเดิมออกจากช่อง D3/D4 ก่อน ไม่งั้นเลขซ้ำ
  console.log('① ย้ายของเดิมออกจากช่อง D3/D4');
  await patch('D156', { subcode: 'D6' }, 'D156 ยำหมูหวาน: D3 → D6 (คู่กับ S6)');
  await patch('D152', { subcode: 'D9' }, 'D152 สะโพกไก่อบกระเทียมเห็ด: D4 → D9 (ไม่มีคู่ S)');

  // ② D4 = ผักกาดห่ออกไก่ (ใช้ D131 ที่มีอยู่แล้ว เดิมปิดขาย)
  console.log('\n② ตั้ง D4 = ผักกาดห่ออกไก่ น้ำจิ้มสุกี้ แบบกับข้าว');
  await patch('D131', {
    name: 'ผักกาดห่ออกไก่ น้ำจิ้มสุกี้ แบบกับข้าว',
    is_available: true, is_weekly_special: true, subcode: 'D4', category: 'pack_regular',
  }, 'D131 เปิดขาย + เปลี่ยนชื่อ + ตั้ง D4');

  // ③ D3 = โอยาโกะด้ง — ไม่มีตัว D ในระบบ ต้องสร้างใหม่ (ใช้ code D030 ให้เลขตรงกับ S030)
  console.log('\n③ สร้าง D3 = โอยาโกะด้งแบบกับข้าว (code D030)');
  const row = {
    code: 'D030', name: 'โอยาโกะด้งแบบกับข้าว', category: 'pack_regular', type: 'single',
    price: 80, description: '', is_available: true, is_weekly_special: true, subcode: 'D3',
    stock_total: null, actual_stock: 0, sort_order: 0, calories: 0, no_morning: false, image_urls: [],
  };
  if (DRY) console.log('  [dry] POST ' + JSON.stringify(row));
  else {
    const r = await fetch(SB + '/rest/v1/menu_items', { method: 'POST', headers: H, body: JSON.stringify(row) });
    const t = await r.text();
    console.log('  ' + (r.ok ? '✅ สร้าง D030 แล้ว' : '❌ ' + r.status + ' — ' + t.slice(0, 250)));
  }

  // ④ ตรวจผลจริง
  console.log('\n=== ตรวจผลหลังแก้ ===');
  const v = await fetch(SB + '/rest/v1/menu_items?select=subcode,code,name,price,is_available&subcode=not.is.null&order=subcode', { headers: { apikey: KEY } });
  const list = await v.json();
  for (const x of list) {
    console.log('  ' + String(x.subcode).padEnd(4) + ' ' + String(x.code).padEnd(6) + ' ' +
      String(x.name).slice(0, 40).padEnd(42) + '฿' + String(x.price).padStart(4) + (x.is_available ? '' : '  [ปิดขาย]'));
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

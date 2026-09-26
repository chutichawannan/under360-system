/**
 * เช็คก่อนเปลี่ยน code เมนู D — มีอะไรอ้างอิงรหัสพวกนี้อยู่บ้าง
 * ตรวจอย่างเดียว ไม่แก้อะไร
 *
 * แผน B (นัทเคาะ 17 ส.ค.): "สลับเลข D ให้ตรงคู่ S" = เปลี่ยน code ไม่ใช่เปลี่ยนชื่อ
 * ประวัติออเดอร์ปลอดภัยแล้ว (order_items เก็บ menu_name/menu_code เป็น snapshot — verify แล้ว)
 * ที่ต้องเช็คคือ "ของที่ยังมีชีวิต" ที่ชี้มาที่ code
 */
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

// คู่ที่ชื่อตรงกันชัด — D ตัวนี้ ควรย้ายไปเลขของ S
const MOVES = [
  { d: 'D162', to: 'D021', s: 'S021', name: 'กุ้งผัดซอสอบวุ้นเส้น' },
  { d: 'D029', to: 'D050', s: 'S050', name: 'มีทบอลอกไก่' },
  { d: 'D201', to: 'D063', s: 'S063', name: 'ไก่ย่างราดพริกสามรส' },
  { d: 'D150', to: 'D181', s: 'S181', name: 'ปลากระพงนึ่งราดซอสไข่เค็ม' },
  { d: 'D156', to: 'D185', s: 'S185', name: 'ยำหมูหวาน' },
  { d: 'D009', to: 'D006', s: 'S006', name: 'หมูหวาน' },
  { d: 'D131', to: 'D157', s: 'S157', name: 'ผักกาดห่ออกไก่ฯ' },
  { d: 'D154', to: 'D172', s: 'S172', name: 'แซลมอนซอสแกงเขียวหวาน' },
];

const get = async (path) => {
  const r = await fetch(SB + '/rest/v1/' + path, { headers: { apikey: KEY } });
  return r.ok ? r.json() : { __err: r.status };
};

async function main() {
  const codes = MOVES.map(m => m.d);
  const targets = MOVES.map(m => m.to);

  console.log('=== ① เลขปลายทางว่างจริงไหม (ถ้าไม่ว่าง = ชนกัน ต้องย้ายเป็นทอด) ===');
  const occupied = await get('menu_items?select=code,name,is_available&code=in.(' + targets.join(',') + ')');
  const occMap = new Map((occupied || []).map(x => [x.code, x]));
  for (const m of MOVES) {
    const o = occMap.get(m.to);
    console.log('  ' + m.d + ' → ' + m.to + '  ' + (o ? '🔴 ชน! มี ' + o.code + ' ' + o.name + (o.is_available ? ' [เปิดขาย]' : ' [ปิด]') : '✅ ว่าง'));
  }

  console.log('\n=== ② มีแพคเกจ/เซ็ต อ้างถึงรหัสพวกนี้ไหม (ถ้ามี เปลี่ยนแล้วเซ็ตพัง) ===');
  const pi = await get('package_items?select=sku,package_id&sku=in.(' + codes.join(',') + ')');
  if (pi && pi.__err) console.log('  อ่าน package_items ไม่ได้ (HTTP ' + pi.__err + ')');
  else if (!pi.length) console.log('  ✅ ไม่มีแพคเกจไหนอ้างถึงเลย');
  else { console.log('  🔴 มี ' + pi.length + ' แถว:'); pi.forEach(x => console.log('     ' + x.sku + ' อยู่ในแพค ' + x.package_id)); }

  console.log('\n=== ③ สูตร/แผนสัปดาห์ ที่ผูกกับรหัส ===');
  const kd = await get('kitchen_data?select=key,data&key=in.(recipes,menu_special_weeks)');
  for (const row of (kd || [])) {
    const txt = JSON.stringify(row.data || {});
    const hit = codes.filter(c => txt.includes('"' + c + '"'));
    console.log('  ' + row.key + ': ' + (hit.length ? '🔴 อ้างถึง ' + hit.join(', ') : '✅ ไม่อ้างถึง'));
  }

  console.log('\n=== ④ การ์ดหน้าโฮม (home_layout) ชี้เมนูเฉพาะตัวไหนไหม ===');
  const hl = await get('home_layout?select=*');
  if (hl && hl.__err) console.log('  อ่านไม่ได้ (HTTP ' + hl.__err + ')');
  else {
    const txt = JSON.stringify(hl || []);
    const hit = codes.filter(c => txt.includes(c));
    console.log('  ' + (hit.length ? '🔴 อ้างถึง ' + hit.join(', ') : '✅ ไม่อ้างถึง'));
  }

  console.log('\n=== ⑤ ออเดอร์ที่ยังไม่ส่ง (ยังมีชีวิต) ที่ใช้รหัสพวกนี้ ===');
  const oi = await get('order_items?select=menu_code,menu_name,orders!inner(order_number,delivery_date,status)&menu_code=in.(' + codes.join(',') + ')&orders.delivery_date=gte.2026-08-17');
  if (oi && oi.__err) console.log('  อ่านไม่ได้');
  else if (!oi.length) console.log('  ✅ ไม่มีออเดอร์ค้างที่ใช้รหัสพวกนี้');
  else { console.log('  ⚠️ มี ' + oi.length + ' บรรทัด (ประวัติเก็บชื่อไว้แล้ว ไม่พัง แต่ให้รู้ไว้):');
    oi.slice(0, 10).forEach(x => console.log('     ' + x.orders.delivery_date + ' ' + x.orders.order_number + ' ' + x.menu_code + ' ' + x.menu_name)); }

  console.log('\n=== ⑥ รูปภาพ ===');
  const imgs = await get('menu_items?select=code,image_urls&code=in.(' + codes.join(',') + ')');
  for (const x of (imgs || [])) {
    const u = (x.image_urls || [])[0] || '';
    const fname = u.split('/').pop() || '(ไม่มีรูป)';
    const m = MOVES.find(v => v.d === x.code);
    console.log('  ' + x.code + ' → ' + m.to + '  ไฟล์รูป: ' + fname + (fname.startsWith(x.code) ? '  ⚠️ ชื่อไฟล์ผูกกับรหัสเดิม (รูปยังขึ้นปกติ แต่ชื่อไฟล์จะไม่ตรงรหัสใหม่)' : ''));
  }
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

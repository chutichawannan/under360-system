/* สร้างแพค "Clearance -30%" (ปิดไว้ก่อน is_active=false · ไม่ใส่การ์ดหน้าโฮม)
   ใส่เมนูที่ is_available=true และ stock_total > 0 เข้าไปก่อน — แอดมินแก้เพิ่ม/ลดได้ที่หน้า DB
   รัน: node scripts/cc_create_clearance_pkg.cjs        (list อย่างเดียว = เติม --dry) */
const URL = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const DRY = process.argv.includes('--dry');

async function rest(path, opts) {
  const r = await fetch(URL + '/rest/v1/' + path, opts || {});
  const t = await r.text();
  if (!r.ok) throw new Error(path + ' → ' + r.status + ' ' + t);
  return t ? JSON.parse(t) : null;
}

(async () => {
  // 1) เมนูที่ขายอยู่ + มีสต็อคจริง
  const menus = await rest('menu_items?select=code,name,price,stock_total,category&is_available=eq.true&stock_total=gt.0&order=code&limit=500', { headers: H });
  console.log('เมนูที่ is_available=true และ stock_total>0 :', menus.length);
  menus.forEach(m => console.log('  ', m.code, '฿' + m.price, '· สต็อค', m.stock_total, '·', m.name));
  const codes = menus.map(m => m.code).filter(Boolean);
  if (DRY) return;
  if (!codes.length) { console.log('❌ ไม่มีเมนูเข้าเกณฑ์ — ยังไม่สร้างแพค'); return; }

  // 2) มีแพคนี้อยู่แล้วไหม (รันซ้ำได้ ไม่สร้างซ้ำ)
  const exist = await rest('packages?select=id,name,is_active&name=eq.' + encodeURIComponent('Clearance -30%') + '&limit=1', { headers: H });
  const groups = [{ label: 'เลือกเมนูล้างสต็อค (อย่างน้อย 5 อย่าง)', kind: 'list', category: '', categories: [], skus: codes, count: 99, allow_repeat: true }];
  let pkgId;
  if (exist && exist.length) {
    pkgId = exist[0].id;
    await rest('packages?id=eq.' + pkgId, { method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify({ groups, updated_at: new Date().toISOString() }) });
    console.log('♻️  อัปเดตลิสต์ในแพคเดิม', pkgId);
  } else {
    const row = {
      name: 'Clearance -30%', size: 'CLR', qty: 5, base_price: 0,
      description: 'เลือกเมนูในลิสต์อย่างน้อย 5 อย่าง ลด 30% จากราคาจริง',
      is_active: false,          // ⚠️ ปิดไว้ก่อน — ลูกค้ายังไม่เห็น จนกว่านัทจะสั่งเปิด
      display_order: 99, groups, delivery_rounds: 1, flexible_delivery: false, free_shipping: false
    };
    const ins = await rest('packages', { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(row) });
    pkgId = ins[0].id;
    console.log('✅ สร้างแพคใหม่', pkgId, '(is_active=false)');
  }

  // 3) ตั้งค่า clearance ที่ kitchen_data (percent 30 · ขั้นต่ำ 5)
  const cur = await rest('kitchen_data?select=data&key=eq.pkg_clearance&limit=1', { headers: H });
  const data = (cur && cur[0] && cur[0].data) || {};
  data[pkgId] = { percent: 30, min_items: 5 };
  await rest('kitchen_data', {
    method: 'POST',
    headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ key: 'pkg_clearance', data, updated_at: new Date().toISOString() })
  });
  console.log('✅ ตั้งค่า pkg_clearance:', pkgId, '→ ลด 30% ขั้นต่ำ 5 · เมนูในลิสต์', codes.length, 'รายการ');
})().catch(e => { console.error('❌', e.message); process.exit(1); });

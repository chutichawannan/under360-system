// AUDIT ผลเทสของนัท N-01..N-33 — ตรวจกับโค้ดบน origin/main จริง + DB จริง
// ไม่เชื่อ commit message · นัทสั่ง 6 ส.ค. 2026 "audit ทุกข้อที่ฉันคุยกับนาย"
import { execSync } from 'node:child_process';

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

execSync('git fetch -q origin');
const F = {};
for (const f of ['liff_customer.html', 'operation_hub.html', 'kitchen_queue.html', 'main_database_v2.html']) {
  try { F[f] = execSync('git show origin/main:' + f, { maxBuffer: 64 * 1024 * 1024 }).toString(); }
  catch (e) { F[f] = ''; }
}
const has = (file, re) => re.test(F[file] || '');
const q = async (path) => (await fetch(B + path, { headers: H })).json();
const count = async (path) => {
  const r = await fetch(B + path, { headers: { ...H, Prefer: 'count=exact', Range: '0-0' } });
  return Number((r.headers.get('content-range') || '/0').split('/')[1]);
};

const rows = [];
const add = (id, what, ok, note) => rows.push({ id, what, ok, note });

// ── ตรวจกับโค้ด ──
add('N-01', 'บล็อกกดเพิ่มเกินสต็อก',
  has('liff_customer.html', /เหลือในสต็อก|เกินสต็อก|remaining\s*<=\s*0|stockLeft/i), 'liff_customer');
add('N-06', 'รวบเมนูซ้ำในเซ็ตเป็นบรรทัดเดียว xN',
  has('liff_customer.html', /rollup|รวบ|×\s*\$\{|groupSame|countBy/i), 'liff_customer');
add('N-07', 'ปุ่ม "เปลี่ยน" → "ลบ"',
  !has('liff_customer.html', />\s*เปลี่ยน\s*</), 'ต้องไม่เหลือปุ่มคำว่า เปลี่ยน');
add('N-08', 'บังคับเลือกวิธีชำระเงินก่อนสั่ง',
  has('liff_customer.html', /เลือกวิธีชำระ|payMethod\s*(===|==)\s*''|!payMethod|กรุณาเลือกวิธี/), 'liff_customer');
add('N-09', 'QR PromptPay ของจริง (ไม่ใช่ placeholder)',
  has('liff_customer.html', /qr-img|promptpay_gsb|qr_url/i), 'liff_customer');
add('N-12', 'ล้างตะกร้าแล้วการ์ดหน้าแรกไม่ค้าง',
  has('liff_customer.html', /syncCartDeps|refreshHomeCards|renderHome\(\)/), 'liff_customer');
add('N-13', 'พับ/กางการ์ดในหน้าครัว',
  has('kitchen_queue.html', /collapse|พับ|toggleCard/i), 'kitchen_queue');
add('N-15', 'ค้นหาในหน้าออเดอร์ (ชื่อ/เบอร์/เลขใบ)',
  has('operation_hub.html', /ค้นหา.*เบอร์|searchOrders|ordSearch/i), 'operation_hub');
add('N-17', 'แมสจัดรอบตามช่วงเวลา (เช้าก่อนบ่าย)',
  has('operation_hub.html', /slotRank|slotOrder|เช้าก่อนบ่าย|timeSlotRank/i), 'operation_hub');
add('N-18', 'กล่องสถิติแมสพับได้',
  has('operation_hub.html', /ประหยัดเงิน|statsCollapse|พับ/i), 'operation_hub');
add('N-19', 'บังคับปักหมุดก่อนสั่ง + ปุ่มตำแหน่งปัจจุบัน',
  has('liff_customer.html', /ต้องปักหมุด|กรุณาปักหมุด|ยังไม่ได้ปักหมุด/), 'liff_customer');
add('N-21', 'เมนู Request เป็นลิสต์ไม่มีรูป',
  has('liff_customer.html', /N-21/), 'liff_customer');
add('N-25', 'หน้าสำเร็จ MP บอกรอบถัดไป',
  has('liff_customer.html', /รอบต่อไป|รอบถัดไป/), 'liff_customer');
add('N-26', 'Meal Plan ส่งฟรี',
  has('liff_customer.html', /N-26/), 'liff_customer');
add('N-27', 'MP รอบ 2..N เปิดใบออเดอร์แยก',
  has('liff_customer.html', /MP-\$\{|roundOrder|createRoundOrders|รอบ.*order_number/i), 'liff_customer');
add('N-28', 'แพลนเมนูโชว์เลขออเดอร์',
  has('operation_hub.html', /order_number.*รอบ|โชว์เลขออเดอร์|mpOrderNo/i), 'operation_hub');
add('N-29', 'ลิสต์เมนูซ้ายโชว์ทุกเมนู (เลิกช่องค้นหา)',
  !has('operation_hub.html', /ค้นหาเมนู \(ชื่อ\/โค้ด\)/), 'ต้องไม่เหลือช่องค้นหาเดิม');
add('N-30', 'toggle ดูเฉพาะเมนูที่ต้องผลิต',
  has('operation_hub.html', /เฉพาะที่ต้องผลิต|onlyPlanned|showOnlyUsed/i), 'operation_hub');
add('N-32', 'ครัวเลือกวันล่วงหน้าได้',
  has('kitchen_queue.html', /ล่วงหน้า|futureDays|14/), 'kitchen_queue');
add('N-33', 'แพลนเมนูเขียนลง order_items',
  has('operation_hub.html', /order_items.*insert|insert.*order_items/i), 'operation_hub');

const main = async () => {
  // ── ตรวจกับ DB ──
  const today = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

  const testLeft = await q('orders?select=order_number,customer_name,delivery_date,status&delivery_date=gte.' + today + '&or=(customer_name.ilike.*เทส*,customer_name.ilike.*test*,order_number.ilike.*ODTEST*)');
  const testAlive = testLeft.filter(o => o.status !== 'cancelled');
  add('เทส', 'ออเดอร์เทสในวันจริง (ต้องเหลือ 0 ใบที่ยังไม่ยกเลิก)', testAlive.length === 0,
    testAlive.length ? testAlive.map(o => o.order_number).join(',') : 'สแกนแล้วเหลือ 0');

  const noGeo = await q('orders?select=order_number,customer_name&delivery_date=gte.' + today + '&delivery_lat=is.null&status=neq.cancelled&limit=200');
  add('N-19b', 'ใบล่วงหน้าที่ไม่มีพิกัด (แมสจัดรอบไม่ได้)', noGeo.length === 0, noGeo.length + ' ใบยังไม่มีพิกัด');

  const pkgs = await q('packages?select=name,base_price&is_active=eq.true');
  add('N-05', 'แพคเกจที่เปิดขาย', true, pkgs.length + ' ตัว: ' + pkgs.map(p => p.name.split('—')[0].trim()).join(' · '));
  add('N-22', 'เซ็ต Hyrox ในหน้าลูกค้า', pkgs.some(p => /hyrox/i.test(p.name)), pkgs.some(p => /hyrox/i.test(p.name)) ? 'มีแล้ว' : 'ยังไม่มี');

  const promos = await q('promo_codes?select=code,description&limit=50');
  const badEnc = promos.filter(p => /\?{3,}/.test(p.description || ''));
  add('N-11', 'คำอธิบายโค้ดส่วนลดเป็น ????', badEnc.length === 0,
    badEnc.length ? badEnc.map(p => p.code).join(',') + ' ยังเพี้ยน' : 'ไม่พบตัวเพี้ยนใน DB');

  const noImg = await q('menu_items?select=code&is_available=eq.true&or=(image_urls.is.null,image_urls.eq.{})');
  add('N-04b', 'เมนูเปิดขายที่ไม่มีรูป', noImg.length === 0, noImg.length + ' ตัว: ' + noImg.map(m => m.code).join(','));

  const cards = await q('home_layout?select=title,bg_image');
  const noCardImg = cards.filter(c => !c.bg_image);
  add('N-04', 'การ์ดหน้าแรกมีรูปครบ', noCardImg.length === 0, noCardImg.length ? noCardImg.map(c => c.title).join(',') : cards.length + ' ใบครบ');

  const subc = await q('menu_items?select=code&is_available=eq.true&subcode=not.is.null');
  const totalOn = await count('menu_items?select=id&is_available=eq.true');
  add('N-02', 'ชื่อเล่นเมนู (subcode) กรอกแล้ว', false, subc.length + ' จาก ' + totalOn + ' เมนูที่เปิดขาย');

  // พิมพ์ผล
  const ok = rows.filter(r => r.ok).length;
  console.log('═══ AUDIT ผลเทสนัท — ตรวจกับ origin/main + DB จริง ═══');
  console.log('ผ่าน ' + ok + ' / ' + rows.length + ' ข้อที่ตรวจอัตโนมัติได้\n');
  for (const r of rows) console.log((r.ok ? '  ✅' : '  ❌') + ' ' + r.id.padEnd(7) + ' ' + r.what.padEnd(46) + ' | ' + r.note);
};
main();

/* 🔍 ตัวเฝ้ารายวัน — สูตรของหน้าครัวใหม่ (pwa/k2.html · ISSUE 02)
 *
 *   ลูกค้าซื้อได้  =  ของในตู้ที่ครัวนับได้  −  จองที่ยังไม่ส่ง
 *   (stock_total)     (actual_stock)          (order_items ของใบที่วันส่ง >= วันนี้ และยังไม่ delivered)
 *
 * ต่างจาก check_stock_formula.mjs ตรงไหน:
 *   ตัวนั้นเช็คสูตรของ "ระบบเก่า" (มี กำลังเติม อยู่ในสมการ) — ไว้ดูว่าของเดิมเพี้ยนแค่ไหน
 *   ตัวนี้เช็คสูตรของ "ระบบใหม่" — ไว้ดูว่าหลังเปลี่ยนมาใช้หน้าใหม่แล้ว เลขยังตรงอยู่ไหม
 *
 * เกณฑ์: เมนูที่ครัวเคยนับไว้ (actual_stock ไม่ null) ต้องเข้าสูตร 100%
 *        ไม่เข้าสูตรเมื่อไหร่ = มีทางที่ขยับเลขโดยไม่ผ่านหน้าใหม่ → ต้องไล่หา
 *
 * รัน: node scripts/u/check_k2_invariant.mjs
 */
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const g = async q => (await fetch(B + q, { headers: { apikey: K, Authorization: 'Bearer ' + K } })).json();
const today = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

const T = today();
const menus = await g('menu_items?select=id,code,subcode,name,stock_total,actual_stock&is_available=eq.true&limit=500');

/* ออเดอร์ที่ยัง "จอง" ของอยู่ — วันส่งตั้งแต่วันนี้ไป และยังไม่ส่งจริง */
let orders = [];
for (let off = 0; off < 5000; off += 1000) {
  const r = await g(`orders?select=id,status,source&delivery_date=gte.${T}&limit=1000&offset=${off}`);
  orders = orders.concat(r);
  if (r.length < 1000) break;
}
const live = orders.filter(o => o.status !== 'cancelled' && o.status !== 'delivered' && o.source !== 'parallel_test');
const ids = live.map(o => o.id);

const booked = {};
for (let i = 0; i < ids.length; i += 60) {
  const r = await g(`order_items?order_id=in.(${ids.slice(i, i + 60).join(',')})&select=menu_item_id,quantity&limit=2000`);
  r.forEach(it => { if (it.menu_item_id) booked[it.menu_item_id] = (booked[it.menu_item_id] || 0) + (it.quantity || 0); });
}

const counted = menus.filter(m => m.actual_stock != null);
const bad = [];
counted.forEach(m => {
  const b = booked[m.id] || 0;
  const should = Math.max(0, Number(m.actual_stock) - b);
  if (Number(m.stock_total || 0) !== should) {
    bad.push(`${(m.subcode || m.code)}  ซื้อได้=${m.stock_total} · ควรเป็น=${should}  (ในตู้ ${m.actual_stock} − จอง ${b})`);
  }
});

console.log(`วันที่ตรวจ ${T}  ·  เมนูเปิดขาย ${menus.length}  ·  ที่ครัวเคยนับไว้ ${counted.length}`);
console.log(bad.length ? `❌ ไม่เข้าสูตร ${bad.length} เมนู` : '✅ เข้าสูตรครบทุกเมนู');
bad.slice(0, 25).forEach(x => console.log('  ' + x));
if (bad.length > 25) console.log(`  … อีก ${bad.length - 25} เมนู`);
if (bad.length) process.exitCode = 1;

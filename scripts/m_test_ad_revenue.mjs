/* เทสตรรกะการ์ด "แอดตัวไหนทำเงิน" กับข้อมูลจริงใน DB
   ดึงโค้ดตัวกรองออกจาก web_dashboard.html มารันตรงๆ = เทสของจริง ไม่ใช่ของจำลอง */
import fs from 'fs';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

/* ดึงฟังก์ชันกรองจากไฟล์จริง — ถ้าใครแก้หน้าเว็บแล้วพัง เทสนี้จะจับได้ */
const html = fs.readFileSync('web/web_dashboard.html', 'utf8');
const grab = (re, name) => { const m = html.match(re); if (!m) { console.error('❌ ดึง ' + name + ' ไม่ได้'); process.exit(1); } return m[0]; };
/* ES module ใช้ eval สร้างตัวแปรใน scope ไม่ได้ → ประกอบเป็นฟังก์ชันแล้วคืนออกมา */
const { adIsTest, adIsLoyalty } = new Function(
  grab(/const AD_TEST_NAMES = \[[^\]]*\];/, 'AD_TEST_NAMES') + '\n' +
  grab(/function adLooseTest\(name\)\{[\s\S]*?\n\}/, 'adLooseTest') + '\n' +
  grab(/function adIsTest\(o\)\{[\s\S]*?\n\}/, 'adIsTest') + '\n' +
  grab(/function adIsLoyalty\(o\)\{[\s\S]*?\n\}/, 'adIsLoyalty') + '\n' +
  'return { adIsTest, adIsLoyalty };'
)();

const from = new Date(Date.now() - 30 * 86400000).toISOString();
const res = await fetch(`${SB}/rest/v1/orders?select=order_number,total,source,source_campaign,customer_id,customer_name,created_by,notes,created_at&created_at=gte.${from}&order=created_at.desc&limit=1000`, { headers: H });
const orders = await res.json();

const clean = orders.filter(o => Number(o.total) > 0 && !adIsTest(o) && !adIsLoyalty(o));

console.log('═══ เทสกับข้อมูลจริง 30 วันล่าสุด ═══\n');
console.log('  ดึงมาทั้งหมด        : ' + orders.length + ' ใบ');
console.log('  ตัดใบยอด ฿0         : -' + orders.filter(o => !(Number(o.total) > 0)).length);
console.log('  ตัดออเดอร์เทส       : -' + orders.filter(o => Number(o.total) > 0 && adIsTest(o)).length);
console.log('  ตัด log แต้ม (HS-)  : -' + orders.filter(o => Number(o.total) > 0 && !adIsTest(o) && adIsLoyalty(o)).length);
console.log('  → เหลือนับจริง      : ' + clean.length + ' ใบ\n');

const g = {};
for (const o of clean) {
  const k = o.source_campaign || '(ไม่รู้ที่มา)';
  (g[k] ||= { n: 0, sum: 0 });
  g[k].n++; g[k].sum += Number(o.total) || 0;
}
const rows = Object.entries(g).sort((a, b) => b[1].sum - a[1].sum);
console.log('ตารางที่จะขึ้นบนหน้าจอ:');
console.log('  ' + 'แคมเปญ'.padEnd(28) + 'ออเดอร์'.padStart(8) + 'ยอดเงิน'.padStart(14));
for (const [k, v] of rows) {
  console.log('  ' + k.padEnd(28) + String(v.n).padStart(8) + ('฿' + Math.round(v.sum).toLocaleString('th-TH')).padStart(14));
}
const tagged = rows.filter(r => r[0] !== '(ไม่รู้ที่มา)').reduce((s, r) => s + r[1].sum, 0);
const all = rows.reduce((s, r) => s + r[1].sum, 0);
console.log('\n  ยอดที่รู้ที่มา: ฿' + Math.round(tagged).toLocaleString('th-TH') + ' จาก ฿' + Math.round(all).toLocaleString('th-TH') + ' (' + (all ? Math.round(tagged * 100 / all) : 0) + '%)');

/* ตรวจว่าใบเทสของนัทถูกกรองออกจริง (มันชื่อ "Nut เทสสสส" — ไม่ตรง TEST_NAMES เป๊ะ) */
const probe = orders.find(o => String(o.source_campaign || '').includes('probe20aug'));
if (probe) {
  console.log('\n⚠️ ใบเทสของนัท ' + probe.order_number + ' (' + probe.customer_name + ')');
  console.log('   ถูกกรองออกไหม: ' + (adIsTest(probe) ? '✅ ใช่' : '❌ ไม่ — จะโป่งเข้าไปในตัวเลขจริง'));
}

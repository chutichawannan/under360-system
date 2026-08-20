/* วัดว่าตัวกรองออเดอร์เทสแบบ "ตรงเป๊ะ" ปล่อยอะไรหลุดบ้าง (m-track 20 ส.ค. 2026)
   เจอตอนเทสการ์ด "แอดตัวไหนทำเงิน": ใบ "Nut เทสสสส" ไม่ถูกกรอง เพราะไม่ตรงกับ 'nut' เป๊ะ
   ⚠️ ตัวกรองเดียวกันนี้อยู่ใน scripts/finance/orders.mjs ด้วย = กระทบตัวเลขยอดขายที่ทุกห้องอ้าง */

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const TEST_NAMES = ['nut', 'test user', 'ทดลอบ 1', 'ploy ♡', 'schematest'];
const exact = n => TEST_NAMES.includes(String(n || '').trim().toLowerCase());
/* แบบเสนอใหม่: ขึ้นต้นด้วยชื่อเทส หรือมีคำว่าเทส/ทดสอบ/test อยู่ในชื่อ */
const loose = n => {
  const s = String(n || '').trim().toLowerCase();
  if (!s) return false;
  if (exact(s)) return true;
  if (TEST_NAMES.some(t => s.startsWith(t + ' ') || s.startsWith(t + 'เ'))) return true;
  return /เทส|ทดสอบ|ทดลอบ|\btest\b/.test(s);
};

const all = [];
for (let off = 0; ; off += 1000) {
  const r = await fetch(`${SB}/orders?select=order_number,customer_name,total,created_at&created_at=gte.2026-01-01&order=created_at.desc&limit=1000&offset=${off}`, { headers: H });
  const rows = await r.json();
  if (!Array.isArray(rows)) break;
  all.push(...rows);
  if (rows.length < 1000) break;
}
const paid = all.filter(o => Number(o.total) > 0);

const slipped = paid.filter(o => !exact(o.customer_name) && loose(o.customer_name));
const sum = slipped.reduce((s, o) => s + Number(o.total), 0);

console.log('═══ ออเดอร์ปี 2026 ที่มียอดเงิน: ' + paid.length + ' ใบ ═══\n');
console.log('ตัวกรองปัจจุบัน (ตรงเป๊ะ) จับได้     : ' + paid.filter(o => exact(o.customer_name)).length + ' ใบ');
console.log('ตัวกรองที่เสนอ (ยืดหยุ่น) จับได้    : ' + paid.filter(o => loose(o.customer_name)).length + ' ใบ');
console.log('\n🔴 ที่หลุดอยู่ตอนนี้ = ' + slipped.length + ' ใบ · ฿' + Math.round(sum).toLocaleString('th-TH') + '\n');

const byName = {};
slipped.forEach(o => { const k = o.customer_name || '(ไม่มีชื่อ)'; (byName[k] ||= { n: 0, sum: 0 }); byName[k].n++; byName[k].sum += Number(o.total); });
console.log('ชื่อที่หลุด (ตรวจด้วยตาว่าเป็นเทสจริงไหม ห้ามกินลูกค้าจริง):');
Object.entries(byName).sort((a, b) => b[1].sum - a[1].sum).forEach(([k, v]) => {
  console.log('  ' + String(k).padEnd(26) + String(v.n).padStart(4) + ' ใบ  ฿' + Math.round(v.sum).toLocaleString('th-TH'));
});

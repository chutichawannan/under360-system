// ============================================================
//  เตือนโอนเงินร้านค้าส่ง (GO wholesale) — v2 · 15 ส.ค. 2026
//  ------------------------------------------------------------
//  🔴 v1 ผิดสมมติฐาน: ไปดัก "ตอนคุณหมิวทวง" — แต่นัทอธิบายว่าของจริงคือ
//     นัทสั่งล่วงหน้า 1 วัน -> ของมาเช้าวันถัดไป -> **สายส่ง SMS ลิงก์ชำระมาที่มือถือนัท**
//     คุณหมิว (เซลส์) ไม่รู้เรื่องการส่ง และจะทวงก็ต่อเมื่อ "เลยเวลา" แล้วเท่านั้น
//     => ถ้ารอให้หมิวทวงถึงค่อยเตือน = เตือนช้าเสมอ และส่วนใหญ่ไม่มีให้ดักเลย
//
//  ✅ v2 ดักจาก "ใบสั่งของที่นัทพิมพ์เอง" ซึ่งกะปันเห็นในกลุ่มอยู่แล้ว
//     สั่งวันนี้ -> พรุ่งนี้ของมา -> พรุ่งนี้ต้องโอน  => เตือนวันถัดจากวันสั่ง
//     ปิดเรื่องด้วยการพิมพ์ "โอนแล้ว" ในกลุ่ม (หรือหมิวตอบว่าได้รับแล้ว)
//
//  ⛔ ไม่ใช่ระบบบัญชี (งานห้อง f) — นี่คือนาฬิกาปลุกของเลขาเท่านั้น
//  ดูผลโดยไม่ส่งจริง: node scripts/kapan_bill_watch.mjs --dry
// ============================================================
const KEY  = process.env.KAPAN_SAY_KEY || 'kapan-pm-2026';
const BASE = 'https://under360-system.vercel.app';
const DRY  = process.argv.includes('--dry');
const DAYS = 14;

const BILL  = ['เหลือชำระ', 'ค้างชำระ', 'ยอดชำระ', 'ลิงค์ชำระ', 'ลิงก์ชำระ', 'ยังไม่ได้ชำระ', 'รบกวนชำระ'];
const PAID  = ['โอนแล้ว', 'โอนเรียบร้อย', 'ชำระแล้ว', 'จ่ายแล้ว', 'ได้รับเงินแล้ว', 'ยอดเข้าแล้ว'];
const UNITS = ['โล', 'กิโล', 'ถุง', 'ลัง', 'แพค', 'แพ็ค', 'ขวด', 'กระสอบ', 'กรัม', 'แกลลอน', 'ห่อ'];

const hasAny = (t, list) => list.some(w => t.includes(w));
const dayOf  = (r) => String(r.line_ts || r.created_at || '').slice(0, 10);
function findAmount(t) {
  const m = t.match(/([0-9][0-9,]*\.?[0-9]*)\s*บาท/);
  if (m) return m[1];
  const m2 = t.match(/ยอด\s*([0-9][0-9,]*\.?[0-9]*)/);
  return m2 ? m2[1] : null;
}
// "ใบสั่งของ" = ข้อความหลายบรรทัด + มีหน่วยนับของ อย่างน้อย 2 บรรทัด
function isOrderList(t) {
  const lines = t.split('\n').map(x => x.trim()).filter(Boolean);
  if (lines.length < 3) return false;
  return lines.filter(l => hasAny(l, UNITS)).length >= 2;
}

const res = await (await fetch(BASE + '/api/kapan-read?key=' + KEY + '&limit=300')).json().catch(() => ({ ok: false }));
if (!res.ok) { console.log('อ่านแชทไม่ได้:', JSON.stringify(res).slice(0, 200)); process.exit(0); }

const since = Date.now() - DAYS * 86400000;
const msgs = (res.rows || [])
  .filter(r => new Date(r.line_ts || r.created_at).getTime() >= since)
  .filter(r => r.group_id && r.group_id !== 'SELFTEST');

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
const paidDays = new Set(msgs.filter(r => hasAny(String(r.text || ''), PAID)).map(dayOf));

// ① ใบสั่งของ -> ของมาวันถัดไป -> วันนั้นต้องโอน
const dueList = [];
for (const r of msgs) {
  const t = String(r.text || '');
  if (!isOrderList(t)) continue;
  const d = new Date(dayOf(r) + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1);
  const due = d.toISOString().slice(0, 10);
  if (due > today) continue;                       // ของยังไม่มา
  if (paidDays.has(due)) continue;                 // วันนั้นมีคนบอกว่าโอนแล้ว
  const n = t.split('\n').filter(x => x.trim()).length;
  dueList.push({ order: dayOf(r), due, items: n });
}

// ② เผื่อกรณีหมิวทวงจริง (เลยกำหนดแล้ว) — อันนี้ด่วนกว่า
const chased = [];
msgs.forEach((r, i) => {
  const t = String(r.text || '');
  if (!hasAny(t, BILL)) return;
  const after = msgs.slice(i + 1);
  if (after.some(x => hasAny(String(x.text || ''), PAID))) return;
  chased.push({ when: dayOf(r), who: r.display_name || 'ร้านค้า', amount: findAmount(t) });
});

if (!dueList.length && !chased.length) { console.log('ไม่มีอะไรค้าง — ไม่ต้องเตือน'); process.exit(0); }

const out = [];
if (chased.length) {
  out.push('🔴 ร้านค้าทวงแล้ว (เลยกำหนด)');
  for (const c of chased) out.push('· ' + c.when + ' · ' + c.who + (c.amount ? ' · ' + c.amount + ' บาท' : ''));
  out.push('');
}
if (dueList.length) {
  out.push('💸 ของมาแล้ว ยังไม่เห็นว่าโอน');
  for (const d of dueList.slice(0, 5)) out.push('· สั่ง ' + d.order + ' (' + d.items + ' รายการ) → ของมา ' + d.due);
  if (dueList.length > 5) out.push('+ อีก ' + (dueList.length - 5) + ' วัน');
  out.push('');
}
out.push('โอนแล้วพิมพ์ "โอนแล้ว" ในกลุ่ม จะได้ไม่เตือนซ้ำ');
const text = out.join('\n');

console.log(text);
if (DRY) process.exit(0);

const r = await fetch(BASE + '/api/kapan-say', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: KEY, text }),
});
console.log('ส่งเข้าไลน์:', r.status, JSON.stringify(await r.json()));

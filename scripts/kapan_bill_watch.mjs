// ============================================================
//  เตือนโอนเงินคุณหมิว (GO wholesale) — นัทบอกเอง 15 ส.ค.: "ฉันชอบลืมโอนคุณหมิวด้วย ถ้ามีการเตือนก็จะดี"
//  ------------------------------------------------------------
//  วิธีทำงาน: อ่านแชทกลุ่มที่กะปันเก็บไว้ -> หาข้อความ "แจ้งยอด/เหลือชำระ" จากฝั่งร้านค้า
//             -> ถ้าหลังจากนั้นยังไม่มีสัญญาณว่าจ่ายแล้ว = ยังค้าง -> เตือนนัทผ่านกะปัน
//  ⛔ ไม่ใช่ระบบบัญชี (นั่นเป็นงานห้อง f) — นี่คือ "นาฬิกาปลุก" ของเลขาเท่านั้น
//  รันเปล่าๆ ได้: node scripts/kapan_bill_watch.mjs --dry   (ดูผลโดยไม่ส่งเข้าไลน์)
// ============================================================
const KEY  = process.env.KAPAN_SAY_KEY || 'kapan-pm-2026';
const BASE = 'https://under360-system.vercel.app';
const DRY  = process.argv.includes('--dry');
const DAYS = 21;

// คำที่แปลว่า "ร้านค้าแจ้งยอดให้จ่าย"
const BILL = ['เหลือชำระ', 'ค้างชำระ', 'ยอดชำระ', 'ลิงค์ชำระ', 'ลิงก์ชำระ', 'ยังไม่ได้ชำระ', 'รบกวนชำระ'];
// คำที่แปลว่า "จ่ายแล้ว"
const PAID = ['โอนแล้ว', 'ชำระแล้ว', 'จ่ายแล้ว', 'ได้รับเงินแล้ว', 'ได้รับแล้วค่ะ', 'ยอดเข้าแล้ว', 'ขอบคุณค่ะ ได้รับ'];

const hasAny = (t, list) => list.some(w => t.includes(w));
// ดึงยอดเงินจากข้อความ เช่น "ยอด 4,542.59 บาท"
function findAmount(t) {
  const m = t.match(/([0-9][0-9,]*\.?[0-9]*)\s*บาท/);
  if (m) return m[1];
  const m2 = t.match(/ยอด\s*([0-9][0-9,]*\.?[0-9]*)/);
  return m2 ? m2[1] : null;
}

const rows = await (await fetch(BASE + '/api/kapan-read?key=' + KEY + '&limit=200')).json()
  .catch(() => ({ ok: false }));
if (!rows.ok) { console.log('อ่านแชทไม่ได้:', JSON.stringify(rows).slice(0, 200)); process.exit(0); }

const since = Date.now() - DAYS * 86400000;
const msgs = (rows.rows || [])
  .filter(r => new Date(r.line_ts || r.created_at).getTime() >= since)
  .filter(r => r.group_id && r.group_id !== 'SELFTEST');

const bills = [];
msgs.forEach((r, i) => {
  const t = String(r.text || '');
  if (!hasAny(t, BILL)) return;
  // จ่ายแล้วหรือยัง = ดูข้อความ "หลังจากนี้" ในกลุ่มเดียวกัน
  const after = msgs.slice(i + 1).filter(x => x.group_id === r.group_id);
  const paid = after.some(x => hasAny(String(x.text || ''), PAID));
  if (!paid) bills.push({ when: (r.line_ts || r.created_at || '').slice(0, 16).replace('T', ' '),
                          who: r.display_name || 'ร้านค้า', amount: findAmount(t), text: t.slice(0, 90) });
});

if (!bills.length) { console.log('ไม่มีบิลค้าง — ไม่ต้องเตือน'); process.exit(0); }

const lines = ['💸 บิลที่ยังไม่เห็นว่าจ่าย', ''];
for (const b of bills) {
  lines.push('· ' + b.when + ' · ' + b.who + (b.amount ? ' · ' + b.amount + ' บาท' : ''));
  lines.push('  "' + b.text + '"');
}
lines.push('', 'ถ้าจ่ายไปแล้วพิมพ์ "โอนแล้ว" ในกลุ่มได้เลย จะได้ไม่เตือนซ้ำ');
const text = lines.join('\n');

console.log(text);
if (DRY) process.exit(0);

const r = await fetch(BASE + '/api/kapan-say', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: KEY, text }),
});
console.log('ส่งเข้าไลน์:', r.status, JSON.stringify(await r.json()));

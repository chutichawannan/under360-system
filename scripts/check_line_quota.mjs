/* ยามเฝ้าโควตา/แพ็กเกจ LINE OA — สร้าง 4 ก.ย. 2569
 *
 *   node scripts/check_line_quota.mjs            เช็คเฉยๆ
 *   node scripts/check_line_quota.mjs --save     เช็คแล้วบันทึกค่าปัจจุบันเป็นค่าอ้างอิง
 *
 * ทำไมต้องมี — เหตุการณ์จริง 4 ก.ย. 2569:
 *   29 ส.ค. แพ็กเกจยังเป็นโปร 35,000 ข้อความ
 *   4 ก.ย.  ตกเป็นแพ็กฟรี 300 ข้อความ  ← ไม่มีใครรู้ ไม่มีอะไรเตือน
 *   เจอตอนกำลังจะวางแผนยิงบรอดแคสต์ = **เกือบเสียยอดทั้งสัปดาห์**
 *
 *   นัทถามตรงๆ ว่า "นายจะปล่อยไว้แบบนี้จริงๆ หรอ ยอดฉันจะเป็นไง"
 *   → คำตอบไม่ใช่ "ยิงกลุ่มเล็กไปก่อน" แต่คือ **ทำให้มันส่งเสียงตั้งแต่วันที่มันตก**
 *
 * ⛔ โควตาไม่ใช่ของประดับ — มันคือความสามารถในการเข้าถึงลูกค้าทั้งฐาน
 *    ตกแล้วไม่รู้ = ทั้งสัปดาห์ยิงไม่ได้ = ยอดหายทั้งสัปดาห์
 *
 * exit 0 = ปกติ · exit 1 = ผิดปกติ ต้องแจ้งนัททันที
 */
import fs from 'fs';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = (fs.readFileSync('CLAUDE.md', 'utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/) || [])[0];
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const WATCH_KEY = 'line_quota_watch';

const SEC = (() => { try { return fs.readFileSync('.scratch/campaign_secret.txt', 'utf8').trim(); } catch { return null; } })();
if (!SEC) { console.error('🔴 ไม่มี .scratch/campaign_secret.txt — เรียก API ไม่ได้'); process.exit(1); }

const r = await fetch('https://under360-system.vercel.app/api/line-campaign', {
  method: 'POST',
  headers: { 'x-u360-key': SEC, 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'quota' }),
});
const j = await r.json().catch(() => null);
if (!j || !j.ok) { console.error('🔴 ถาม LINE ไม่สำเร็จ:', JSON.stringify(j).slice(0, 200)); process.exit(1); }

const type = j.quota?.type, value = Number(j.quota?.value || 0), used = Number(j.used?.totalUsage || 0);
const left = value - used;

// ค่าอ้างอิงที่เคยบันทึกไว้
const prevRes = await fetch(SB + `/rest/v1/kitchen_data?select=data&key=eq.${WATCH_KEY}`, { headers: H });
const prev = (await prevRes.json().catch(() => []))[0]?.data || null;

const fmt = n => Number(n).toLocaleString();
console.log('\n══ โควตา LINE OA — Under360 Cleanfood ══');
console.log('  แพ็กเกจ  : ' + type + ' ' + fmt(value) + ' ข้อความ/เดือน');
console.log('  ใช้ไป    : ' + fmt(used) + '   เหลือ ' + fmt(left));
if (prev) console.log('  ค่าอ้างอิงเดิม: ' + prev.type + ' ' + fmt(prev.value) + ' (บันทึก ' + String(prev.at).slice(0, 10) + ')');

let bad = 0;
if (prev && value < Number(prev.value)) {
  bad++;
  console.log('\n🔴🔴 แพ็กเกจตกจาก ' + fmt(prev.value) + ' → ' + fmt(value) + ' ข้อความ');
  console.log('   นี่คือเหตุการณ์เดียวกับ 4 ก.ย. 2569 ที่ตกจาก 35,000 → 300 โดยไม่มีใครรู้');
  console.log('   👉 แจ้งนัททันที ให้เปิด LINE OA → ตั้งค่า → แพ็กเกจ/การชำระเงิน');
  console.log('   👉 และเช็คช่อง "กำหนดจำนวนสูงสุดของข้อความบรอดแคสต์" ด้วย — ตั้งเพดานไว้เองก็ทำให้ตัวเลขตกเหมือนกัน');
}
if (value <= 1000) {
  bad++;
  console.log('\n🔴 โควตาต่ำผิดปกติ (' + fmt(value) + ') — แพ็กเกจฟรีคือ 300 · ของเราควรเป็น 35,000');
}
if (left < 2000 && value > 1000) {
  console.log('\n🟡 เหลือน้อยกว่า 2,000 — ยิงรอบใหญ่ไม่ได้แล้ว');
  console.log('   กติกานัท: แบ่ง 5 ก้อน ~7,000/รอบ · สิ้นเดือนเทที่เหลือให้หมดก่อนรีเซ็ตวันที่ 1');
}

if (process.argv.includes('--save')) {
  await fetch(SB + '/rest/v1/kitchen_data', {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ key: WATCH_KEY, data: { type, value, at: new Date().toISOString() } }),
  });
  console.log('\n💾 บันทึกค่าอ้างอิงแล้ว: ' + type + ' ' + fmt(value));
}

console.log('\n' + '─'.repeat(46));
if (bad) { console.log('🔴 ผิดปกติ — ห้ามวางแผนยิงจนกว่าจะแก้'); process.exit(1); }
console.log('✅ ปกติ · ยิงได้ถึง ' + fmt(left) + ' ข้อความในเดือนนี้');
process.exit(0);

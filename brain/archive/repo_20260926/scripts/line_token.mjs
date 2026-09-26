// ══════════════════════════════════════════════════════════════
// ออก LINE Channel Access Token ของ OA ลูกค้า (Under360 Cleanfood)
// ══════════════════════════════════════════════════════════════
// ทำไมต้องมีสคริปต์นี้:
//   แชนแนล Messaging API ของ OA ลูกค้า (ID 2005639534) อยู่ในบัญชี
//   นักพัฒนาของ Hato → นัทเปิด LINE Developers Console ไม่ได้
//   แต่นัทเป็น "แอดมินของ OA" → หยิบ Channel ID + ความลับ จาก
//   OA Manager แล้วออก token เองได้ตรงๆ ผ่าน API ของ LINE
//
// วิธีใช้:
//   node scripts/line_token.mjs
//   แล้วเอา "ความลับแชนแนล" จากหน้า
//   manager.line.biz/account/@rwc2010a/setting/messaging-api มาวาง
//
// ปลอดภัยไหม:
//   · ความลับไม่ถูกบันทึกลงไฟล์ ไม่ถูกส่งไปไหนนอกจาก api.line.me
//   · ไม่ขึ้น git (สคริปต์ไม่เขียนอะไรลงดิสก์เลย)
//   · ออก token ใหม่ "ไม่ทำให้ token เดิมของ Hato ใช้ไม่ได้"
//     (LINE ให้มี token ใช้งานพร้อมกันได้ถึง 30 ตัว) → ระบบ Hato ไม่พัง
// ══════════════════════════════════════════════════════════════

import readline from 'node:readline';

const CHANNEL_ID = '2005639534'; // Under360 Cleanfood (@rwc2010a)

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, res));

console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  ออก LINE Token — Under360 Cleanfood (@rwc2010a)             ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');
console.log('เอา "ความลับแชนแนล" มาจากหน้านี้ (กดปุ่มคัดลอกได้เลย):');
console.log('  https://manager.line.biz/account/@rwc2010a/setting/messaging-api');
console.log('');

const secret = (await ask('วางความลับแชนแนลตรงนี้ แล้วกด Enter > ')).trim();
rl.close();

if (!secret) {
  console.log('\n⛔ ไม่ได้ใส่อะไรมา — ยกเลิก');
  process.exit(1);
}

console.log('\n⏳ กำลังขอ token จาก LINE...');

const res = await fetch('https://api.line.me/v2/oauth/accessToken', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CHANNEL_ID,
    client_secret: secret,
  }),
});

const data = await res.json().catch(() => ({}));

if (!res.ok || !data.access_token) {
  console.log('\n⛔ ไม่สำเร็จ (' + res.status + ')');
  console.log('   ' + (data.error_description || data.error || JSON.stringify(data)));
  console.log('');
  console.log('เช็ค 2 อย่าง:');
  console.log('  1. ก๊อปความลับมาครบไหม (ห้ามมีเว้นวรรค/ขึ้นบรรทัดติดมา)');
  console.log('  2. ก๊อปมาจากบัญชี "Under360 Cleanfood" ใช่ไหม (ไม่ใช่ OA อื่น)');
  process.exit(1);
}

const days = Math.round((data.expires_in || 0) / 86400);

console.log('');
console.log('✅ ได้แล้ว — อายุ ' + days + ' วัน');
console.log('');
console.log('──────── ก๊อปทั้งบรรทัดล่างนี้ ────────');
console.log(data.access_token);
console.log('────────────────────────────────────────');
console.log('');
console.log('เอาไปวางที่:');
console.log('  Vercel → โปรเจค under360-system → Settings → Environment Variables');
console.log('  ชื่อ  : LINE_CHANNEL_ACCESS_TOKEN');
console.log('  ค่า   : (ก๊อปข้างบน)');
console.log('  ติ๊ก  : Production + Preview + Development');
console.log('  → Save แล้ว Redeploy 1 ครั้ง');
console.log('');
console.log('⚠️ token = กุญแจส่งข้อความหาลูกค้า 23,314 คน — ห้ามแปะในแชท/ไฟล์/git');
console.log('⏰ หมดอายุใน ' + days + ' วัน → ถึงตอนนั้นรันสคริปต์นี้ใหม่ (~1 นาที)');
console.log('');

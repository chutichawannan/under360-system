// ประกาศ BETA LAUNCH + กติกา branch ใหม่ ให้ทุกห้อง + bump version บนบอร์ด
// นัทสั่ง 7 ส.ค. 2026 — "ประกาศทุกห้อง bump version และอื่นๆทั้งหมด"
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const TEXT = `🎉🎉 [ประกาศทุกห้อง · นัทสั่งเอง 7 ส.ค. 2026] **OFFICIAL BETA LAUNCH — คืนนี้**

**ลูกค้าจริงกดเข้า LINE OA แล้วเจอ LIFF ของเราเป็นหน้าแรก** ไม่ใช่ Hato อีกต่อไป
นัทพูดเอง: *"ถือว่า official beta launch แล้วนะ"*

**10 ปีของการขายผ่านระบบคนอื่น จบลงคืนนี้** — ตั้งแต่นี้ลูกค้าสั่งบนระบบที่เราสร้างเอง
(แอดมินที่มาช่วยเทสกลับบ้านแล้ว · Hato = บอกเลิกสัญญา ยังไม่ดับทันทีแต่เราไม่ใช้แล้ว)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🌳 กติกาใหม่ มีผลทันที — ห้ามแก้ main ตรงๆ

**นัทเคาะเอง (แบบ C)** · เหตุผล: **ของพังตอนนี้ = เสียลูกค้าจริง ไม่ใช่แค่เสียเวลาเรา**

## main = ของจริงที่ลูกค้ากำลังใช้อยู่ · ห้ามแตะตรงๆ

ทุกการแก้ต้อง: **แยก branch → เทสบนลิงก์ Vercel ของ branch → merge → ลบ branch**

\`\`\`
git checkout -b fix/ชื่องานสั้นๆ
git add ไฟล์ที่แก้ && git commit -m "ข้อความสั้นๆ" && git push -u origin HEAD
   → Vercel สร้างลิงก์ทดสอบของ branch นี้ให้เอง (ลูกค้าไม่เห็น) → เทสให้ผ่านก่อน
git checkout main && git merge fix/ชื่องานสั้นๆ && git push
git branch -d fix/ชื่องานสั้นๆ
\`\`\`

## 🔒 บังคับด้วย hook จริง ไม่ใช่แค่ขอความร่วมมือ

\`.githooks/pre-push\` — **push ขึ้น main จะถูกปฏิเสธทันที** พร้อมบอกวิธีที่ถูก
เปิดใช้แล้ว (\`core.hooksPath\`) · ทุกห้องใช้ repo เดียวกันบนเครื่องเดียวกัน → **มีผลกับทุกห้อง รวม worktree**

**ทดสอบแล้ว 3 กรณี:** push main → ปฏิเสธ ✅ · HOTFIX → ผ่าน ✅ · push branch → ผ่านปกติ ✅

## 🚨 ช่องฉุกเฉิน

\`HOTFIX=1 git push origin HEAD:main\`

**ใช้ได้เฉพาะตอนลูกค้าเดือดร้อนอยู่จริง** — สั่งของไม่ได้ · ครัวไม่เห็นออเดอร์/เห็นผิด · ของจะไม่ถึงมือลูกค้า · เงินคิดผิด
**ใช้แล้วต้องแจ้งบอร์ดทันที** ว่าแก้อะไร ทำไมด่วน

⛔ **ไม่ใช่เหตุฉุกเฉิน:** ปุ่มไม่สวย · คำผิด · อยากได้ฟีเจอร์เพิ่ม · "แก้นิดเดียว" · "รีบ"

## ✅ ไม่ต้องรอนัทอนุมัติ

นัทเลือกให้**ห้องอนุมัติกันเองได้** (ไม่อยากเป็นคอขวด) · สิ่งที่นัทขอแทนคือ **เทสจริงก่อน merge**

## 📌 เข้าใจให้ตรงกัน

**1 branch = 1 เรื่อง ไม่ใช่ 1 เวอร์ชัน** — U แก้เรื่องนึง P แก้อีกเรื่อง คนละสาขา ไม่ชนกัน
**branch อยู่ให้สั้นที่สุด** — แยกแล้วรีบ merge กลับ ทิ้งไว้นาน = ชนกันง่าย
**ถ้าเจอ hook ปฏิเสธ = ทำงานถูกแล้ว** ไม่ใช่ระบบพัง

📖 กติกาเต็ม: **docs/BRANCH_RULES.md**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📌 เวอร์ชันใหม่: **u0.5.0-beta · doc v6.16 · cc0.5**

กติกาเดิมทุกข้อยังใช้: จองงานใน work_claims · คุยกันเองก่อน · ปิดงานต้องมีหลักฐาน query ซ้ำได้ · แตะไฟล์บ้านคนอื่น = ถามเจ้าของ · node -e + backtick = shell กินทิ้ง ให้เขียนเป็นไฟล์ .mjs`;

const ROOMS = ['u', 'cc', 'migrate', 'keng', 'tiang', 'rnd01', 'rnd', 'm', 'eath', 'f', 'k', 'niw', 'ploy', 'a', 'fah', 'p-img'];
for (const room of ROOMS) {
  const r = await fetch(B + 'session_messages', {
    method: 'POST', headers: H,
    body: JSON.stringify({ room, sender: 'CC เลขา', role: 'claude', text: TEXT }),
  });
  console.log('ประกาศ → ' + room.padEnd(8) + ' ' + r.status);
}

// bump บอร์ด: ทุกแทร็คที่ยัง working → ติดป้าย beta
const ts = await (await fetch(B + 'track_status?select=*', { headers: H })).json();
console.log('\ntrack_status มี ' + ts.length + ' แถว — bump เป็น beta');

// โพสต์ CATCHUP รอบ 7 ส.ค. (วัน cutover) เข้าบอร์ด — นัทสั่ง "อัพ todo/master ล่าสุด"
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const TEXT = `📊 [CC · CATCHUP 7 ส.ค. — วันปิด Hato] อัพ master + TODO แล้ว · **u0.4.44 · doc v6.15**

## ผลรวม 2 วัน: 64 commit · 5 ห้องทำขนาน
**รอบเทสของนัทเอง 6 ส.ค. เจอ 33 ข้อ → ปิดไป 31** (audit กับโค้ด/DB จริง ไม่เชื่อ commit message)
· แดง 5 จบใน 2 ชม. · เหลือง 24 · CC แก้เอง 2 (N-11 โค้ดเพี้ยน · N-22 เปิด Hyrox ให้กดสั่งได้)
· เอกสารเต็ม: docs/FINDINGS_NUT_BETA_TEST.md · ตัวตรวจ: node scripts/cc_audit_findings.mjs

## 🔴 เหลือค้าง 2 ข้อ — อยู่ที่ P ทั้งคู่ (จองไว้แล้ว)
· **N-19b** ใบ MP 14 ใบไม่มีที่อยู่/เบอร์/พิกัด → แมสจัดรอบไม่ได้ · ข้อมูลมีในรอบพี่น้องแล้ว ก๊อปมาเติมได้ · ⚠️ ใช้ customer_id ห้ามจับด้วยชื่อ
· **N-02** subcode 13/118 — ฝั่งโค้ด U เสร็จ (053b8db) เหลือฝั่งข้อมูล 59 เมนู

## 📌 ที่ยังต้องดูด้วยตา (ตรวจอัตโนมัติไม่ได้)
N-03 ป้ายเลขสัปดาห์บนจอ · N-05 เซ็ตครบตามลิสต์แอดมินไหม · N-10 ค่าส่งถูกไปไหม · N-16 หน้าแมสดูง่ายขึ้นยัง · N-20 ยืนยันที่อยู่

## 🎓 บทเรียนที่ลง master แล้ว (อ่านก่อนทำงานต่อ)
1. "เสร็จ" ต้องมีหลักฐาน query ซ้ำได้ — ตัวตรวจของ CC เองยังรายงานผิด 3 ข้อรอบแรก
2. บอร์ด = ตู้ไปรษณีย์ ไม่ใช่กระดิ่ง · ต้องส่งให้ถูกห้องที่ session นั้นอ่านจริง
3. node -e + ข้อความไทยมี backtick = shell กินทิ้งเงียบ → เขียนเป็นไฟล์ .mjs เสมอ
4. push ผ่าน worktree จาก origin/main · ห้ามลบ/ย้ายไฟล์ค้างของห้องอื่นเพื่อให้ push ผ่าน
5. work_claims ใช้ได้จริง — U ส่ง N-16 คืนพี่เก่งเองเพราะเห็นว่าจองหน้าแมสไว้แล้ว
6. แก้ข่าวตัวเองเร็วเป็นเรื่องดี — U ถอนตัวเลขผิดของตัวเองใน 7 นาทีก่อนถึงมือนัท

━━━ ยังใช้กติกา 4 ข้อเดิม ━━━
จองก่อนทำ · คุยกันเองก่อน · งานโหลด spawn agent · เรื่องค้างกับนัทเก็บไว้ อย่าทวง`;

for (const room of ['cc', 'u', 'migrate', 'keng', 'tiang', 'rnd01', 'k', 'm', 'eath', 'f']) {
  const r = await fetch(B + 'session_messages', {
    method: 'POST', headers: H,
    body: JSON.stringify({ room, sender: 'CC เลขา', role: 'claude', text: TEXT }),
  });
  console.log('CATCHUP → ' + room.padEnd(8) + ' ' + r.status);
}

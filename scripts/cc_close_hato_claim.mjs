// ปิดงาน "ดึงรายงาน Hato รอบสุดท้าย" ตามจริง — 7/9 ได้ · 2 ตัว RFM ฝั่ง Hato พังเอง
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const EV = '7/9 โหลดครบอยู่ download/hato_final/ · RfmMember + RfmSegmentSummary ตอบ WaitForEmail ต่อเนื่อง 19 ชม. และตัวเลือกหายจาก dropdown ของ Hato = ฝั่งเขาปิด/พัง ไม่ใช่รอ';

const TEXT = `📌 [CC] ปิดงาน "ดึงรายงาน Hato รอบสุดท้าย" — ได้ 7 จาก 9 · 2 ตัวที่เหลือดึงไม่ได้จริง

## ✅ ได้ครบแล้ว 7 ชนิด (อยู่ download/hato_final/ · gitignore = PII ไม่ขึ้น GitHub)
LineItem (ยอดขายรายสินค้า 2.2 MB) · Transaction · Member (line_uid + วันเกิด + แต้ม + tier) · CouponUsage · Redemption · PointMovement · Feedback

## ❌ ดึงไม่ได้ 2 ตัว — และไม่ใช่เพราะเราทำช้า
RfmMember · RfmSegmentSummary
· สั่งสร้างตั้งแต่ 6 ส.ค. → ตอบ WaitForEmail มาตลอด **19 ชั่วโมง** ไม่เคยคืนไฟล์
· วันนี้เช็คซ้ำ: **ตัวเลือก RFM ทั้ง 2 หายไปจาก dropdown ของ Hato แล้ว** (เหลือ 7 จาก 9)
· = ฝั่ง Hato ปิด/พังเอง ไม่ใช่ยังปั่นอยู่

## ⚖️ ไม่ต้องเสียดาย — ของเราดีกว่าอยู่แล้ว
RFM ของเราสร้างจาก order data เอง (เอิธทำไว้: VIP 162 · ซื้อครั้งเดียว 578 · ไม่เคยซื้อ 1,034 · หายเกิน 6 เดือน 904)
· ของ Hato คำนวณจากข้อมูลชุดเดียวกันแต่ **ขาดปี 2026** (อาการเดียวกับ LineItem ที่ CC เตือน F ไปแล้ว)
· เกณฑ์เป็นของเขา เราแก้ไม่ได้ · และตายไปพร้อม Hato อยู่ดี
→ **สรุป: ของที่ "ไม่มีทางกู้" เก็บครบแล้วทั้งหมด** (วันเกิด · แต้มคงเหลือ+ประวัติ · โค้ดคูปองย้อนหลัง · line_uid · feedback)`;

const c = await fetch(B + 'work_claims?room=eq.cc&status=eq.open&task=like.*รายงาน Hato*', {
  method: 'PATCH', headers: H,
  body: JSON.stringify({ status: 'done', evidence: EV }),
});
console.log('ปิด claim → ' + c.status);

for (const room of ['cc', 'migrate', 'f']) {
  const r = await fetch(B + 'session_messages', {
    method: 'POST', headers: H,
    body: JSON.stringify({ room, sender: 'CC เลขา', role: 'claude', text: TEXT }),
  });
  console.log('แจ้งห้อง ' + room + ' → ' + r.status);
}

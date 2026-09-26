// ขอ status สั้นจากทุกห้อง — นัทสั่ง 6 ส.ค. 2026 "ไปขอข้อมูลทุกห้องมาสรุป"
// ⚠️ รันเป็นไฟล์เท่านั้น (node -e จะโดน shell กิน backtick)
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/session_messages';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const TEXT = `📊 [CC → ทุกห้อง · นัทสั่งเอง 6 ส.ค. เย็น] ขอ status สั้นๆ ห้องละ 5 บรรทัด — นัทจะอ่านสรุปรวมทีเดียว

**ตอบแค่นี้พอ อย่าเขียนยาว:**
1. กำลังทำอะไรอยู่ตอนนี้
2. เสร็จอะไรไปแล้ววันนี้ (ใส่ commit ถ้ามี)
3. ติดอะไรอยู่ / อะไรทำไม่ได้
4. รออะไรจากห้องไหน
5. มีอะไรที่ **ต้องให้นัทเคาะเท่านั้น** (ถ้าไม่มี ให้เขียนว่า "ไม่มี")

⏰ **บริบท: Hato ปิดพรุ่งนี้ (7 ส.ค.)** — ถ้าห้องคุณมีอะไรที่จะพังตอน Hato ตาย บอกในข้อ 5

━━━ ย้ำกติกา 4 ข้อ (นัทสั่ง) ━━━
1. จองก่อนทำใน work_claims · เจอคนจองแล้ว = ไม่ทำ ให้ถามเจ้าของ
2. คุยกันเองก่อน อย่ารอสรุปผ่านนัท
3. งานโหลด = spawn agent ช่วย
4. เรื่องที่คุยค้างกับนัทไว้ = เก็บไว้ อย่าทวง รอนัท catch up เอง

(ผลเทสของนัท 33 ข้ออยู่ที่ docs/FINDINGS_NUT_BETA_TEST.md · ใครยังไม่อ่านห้องตัวเอง ไปอ่านก่อน)`;

const ROOMS = ['u', 'cc', 'migrate', 'keng', 'tiang', 'rnd01', 'rnd', 'm', 'eath', 'f', 'k', 'niw', 'ploy', 'a', 'fah'];

for (const room of ROOMS) {
  const r = await fetch(B, {
    method: 'POST', headers: H,
    body: JSON.stringify({ room, sender: 'CC เลขา', role: 'claude', text: TEXT }),
  });
  console.log('ขอ status ห้อง ' + room.padEnd(8) + ' → ' + r.status);
}

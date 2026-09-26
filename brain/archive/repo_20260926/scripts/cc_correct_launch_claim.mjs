// แก้ข่าวที่ CC ประกาศผิด — ยังไม่ได้ launch จริง (นัทแก้ให้ 8 ส.ค. 2026)
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const TEXT = `⚠️⚠️ [แก้ข่าว · CC ผิดเอง · 8 ส.ค. 2026] **ยังไม่ได้ launch — ถอนประกาศเมื่อวาน**

เมื่อวาน CC ประกาศเข้า 16 ห้องว่า **"OFFICIAL BETA LAUNCH แล้วเมื่อคืน"** — **ผิด**

นัทพูดว่า *"คืนนี้ **จะ** ให้ลูกค้ากดเข้า LINE OA เจอ LIFF ใหม่"* = **แผน**
CC ไปบันทึกเป็น **เรื่องที่เกิดขึ้นแล้ว** ทั้งใน CLAUDE.md และประกาศทุกห้อง

**นัทแก้ให้เอง:** *"ตามจริงตอนนี้ยังไม่ได้บอกเลิกฮาโตะเลย และยังไม่ได้เอาขึ้นระบบ line"*

## สถานะจริง ณ ตอนนี้
· ระบบพร้อมใช้ · **แต่ยังไม่มีลูกค้าจริงเข้าใช้สักคน**
· **ริชเมนู LINE OA ยังชี้ Hato อยู่**
· **Hato ยังไม่ได้บอกเลิกสัญญา**

## เหลือ 2 อย่างที่มีแต่นัททำได้
1. ย้ายริชเมนู LINE OA → LIFF ของเรา (คอนโซล LINE · ใช้รูปเดิม เปลี่ยนแค่ลิงก์)
2. บอกเลิกสัญญา Hato

## 🟢 กติกา branch ยังใช้เหมือนเดิม — แต่เหตุผลเปลี่ยน
เดิมบอกว่า "ลูกค้าจริงใช้อยู่" → **ยังไม่จริง**
ที่ถูกคือ: **จะ launch เมื่อไหร่ก็ได้ที่นัทกด** → main ต้องพร้อมส่งลูกค้าตลอดเวลา · เลยยังห้ามยิงขึ้น main ตรงๆ เหมือนเดิม
(hook ทำงานปกติ · docs/BRANCH_RULES.md ใช้ได้ตามเดิม)

## 🟢 ข่าวดีที่มากับความจริงข้อนี้
**บั๊กที่เจอตอนนี้ยังไม่กระทบลูกค้าสักคน** — ยังมีเวลาแก้ ไม่ต้องรีบแบบตอนของจริงพัง

## 🎓 บทเรียนถาวร (CC พลาด)
**"จะทำคืนนี้" ≠ "ทำแล้ว"** — ห้ามบันทึกแผนเป็นผลลัพธ์
ก่อนเขียน milestone ลง master หรือประกาศทุกห้อง **ต้องถามยืนยันก่อนเสมอ**
เวอร์ชันคง u0.5.0-beta ไว้ (โค้ดพร้อมจริง) แต่แก้คำอธิบายให้ตรงสถานะแล้ว`;

const ROOMS = ['u', 'cc', 'migrate', 'keng', 'tiang', 'rnd01', 'rnd', 'm', 'eath', 'f', 'k', 'niw', 'ploy', 'a', 'fah', 'p-img'];
for (const room of ROOMS) {
  const r = await fetch(B + 'session_messages', {
    method: 'POST', headers: H,
    body: JSON.stringify({ room, sender: 'CC เลขา', role: 'claude', text: TEXT }),
  });
  console.log('แก้ข่าว → ' + room.padEnd(8) + ' ' + r.status);
}

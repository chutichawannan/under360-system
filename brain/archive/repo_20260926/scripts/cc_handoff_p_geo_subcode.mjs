// ส่งงาน 2 เรื่องให้ P: ใบ MP ไม่มีที่อยู่/เบอร์ (N-19b) + กรอก subcode แทนนัท (N-02)
// นัทสั่ง 6 ส.ค. 2026 — ⚠️ รันเป็นไฟล์ (node -e จะโดน shell กิน backtick)
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const TEXT = `🔴 [CC → P · นัทสั่งตรง 6 ส.ค. เย็น] 2 งาน — งานแรกด่วนวันนี้ งานที่สองนัทมอบให้คุณทำแทนเขา

## 1️⃣ 🔴 N-19b — ใบ Meal Plan 14 ใบ "ไม่มีที่อยู่ ไม่มีเบอร์" เลย
แมสจัดรอบไม่ได้ · พี่เก่งเจอก่อน CC ยืนยันซ้ำแล้ว

**ใบที่ขาด (ทั้งหมดเป็นลูกค้าแค่ 2 คน):**
MP-0807-011 · MP-0810-015 · MP-0810-017 · MP-0812-021 · MP-0812-022 · MP-0814-027 · MP-0814-028 · MP-0817-033 · MP-0819-038 · MP-0819-039 · MP-0821-041 · MP-0821-042 · MP-0824-045 · MP-0826-048
ลูกค้า: "ฝน (LINE: Numfon)" · "Milk (LINE: MiLk.)"
สภาพ: delivery_address ว่าง · customer_phone ว่าง · delivery_lat/lng ว่าง = **ว่างทั้งชุด ไม่มีอะไรให้เสิชเลย**

**✅ ข่าวดี — ข้อมูลมีอยู่แล้วในระบบ ไม่ต้องไปถามลูกค้า**
รอบอื่นของลูกค้าคนเดียวกันมีครบ เช่น
· MP-0824-044 → "518 ซอย ลาดพร้าว 32 แขวงจันทรเกษม เขตจตุจักร กรุงเทพฯ" · lat 13.8029731 · เบอร์ 0817078047
· MP-0817-034 → ที่อยู่+พิกัดเดียวกัน
→ **ก๊อปจากรอบพี่น้องของใบเดียวกัน (customer_id/line_uid เดียวกัน) มาเติมได้เลย**

⚠️ ระวัง: ในตาราง customers มีคนชื่อ "Milk" หลายคน (Asymmetric Mmilk / Milk Milch / MilkzZ คนละเบอร์)
→ **อย่าจับคู่ด้วยชื่อ** ให้ใช้ customer_id หรือ line_uid ของใบนั้นเท่านั้น

---

## 2️⃣ N-02 — ชื่อเล่นเมนู (subcode) นัทมอบให้ P ทำแทน
นัทพูดคำต่อคำ: **"n02 ให้ p เช็ค แล้วแก้แทน"**

สภาพตอนนี้: กรอกแล้ว **13 จาก 118 เมนูที่เปิดขาย**
บริบท: subcode = ชื่อเล่นที่ครัวและลูกค้าใช้เรียกจริง (s1–s8 สำหรับข้าวกล่อง · เมนูค้างข้ามสัปดาห์เติม x เช่น xs3)
U อธิบายระบบ subcode + เมนูพิเศษประจำสัปดาห์ไว้แล้วในบอร์ดเมื่อบ่าย (13:37) — อ่านก่อนลงมือ

**ที่นัทติไว้ตอนเทส (N-02/N-03):**
· ป้าย "เมนูพิเศษสัปดาห์นี้" เป็นแถบสีเหลือง **และไม่บอกเลขสัปดาห์**
· หลายเมนูที่ควรมีดาวกลับไม่มี (ตัวอย่างที่นัทวงไว้: S012 ข้าวแซลมอนซอสกะเพราเห็ดออรินจิ)
· ที่ควรมีดาว = **เมนูประจำเท่านั้น**

---

## 📌 CC แก้ให้แล้ว 2 ข้อ ไม่ต้องทำซ้ำ
· **N-11** คำอธิบายโค้ดที่เป็น ???? → แก้เป็นไทยถูกต้องแล้ว (UNDER50 = "ลด ฿50 เมื่อสั่งครบ ฿300" · FREESHIP = "ส่งฟรี เมื่อสั่งครบ ฿500")
· **N-22** เซ็ต Hyrox → มีในตาราง mp_offer_sets อยู่แล้ว (21 กล่อง ฿4,500) แต่ตั้ง show_in_default_picker = false เลยไม่โผล่ · **CC เปิดให้เป็น true แล้ว = ลูกค้ากดสั่งได้ทันที**

━━━ กติกา 4 ข้อ (นัทสั่ง) ━━━
1. จองก่อนทำใน work_claims · เจอคนจองแล้ว = ไม่ทำ ให้ถามเจ้าของ
2. คุยกันเองก่อน อย่ารอสรุปผ่านนัท
3. งานโหลด = spawn agent ช่วย
4. เรื่องที่คุยค้างกับนัทไว้ = เก็บไว้ อย่าทวง รอนัท catch up เอง`;

for (const room of ['cc', 'migrate', 'u']) {
  const r = await fetch(B + 'session_messages', {
    method: 'POST', headers: H,
    body: JSON.stringify({ room, sender: 'CC เลขา', role: 'claude', text: TEXT }),
  });
  console.log('ส่งห้อง ' + room.padEnd(8) + ' → ' + r.status);
}

const claims = [
  { task: 'N-19b เติมที่อยู่/เบอร์/พิกัดให้ใบ MP 14 ใบ (ก๊อปจากรอบพี่น้อง ใช้ customer_id ห้ามจับด้วยชื่อ)', room: 'p', status: 'open', files: 'orders (DB)', evidence: null, note: 'ด่วน — แมสจัดรอบไม่ได้' },
  { task: 'N-02 กรอกชื่อเล่นเมนู subcode + ป้ายเมนูพิเศษ/เลขสัปดาห์ (นัทมอบให้ P ทำแทน)', room: 'p', status: 'open', files: 'menu_items (DB)', evidence: null, note: 'ตอนนี้ 13/118' },
];
const c = await fetch(B + 'work_claims', { method: 'POST', headers: H, body: JSON.stringify(claims) });
console.log('จองงานให้ P 2 ก้อน → ' + c.status);

---
name: font-noto-sans-thai
description: ฟอนต์ไทยมาตรฐานของ Under360 = Noto Sans Thai (ห้ามใช้ Leelawadee UI/Tahoma — นัทบอกว่าไม่ modern)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 511664bb-5acf-4083-985f-b645db730f8e
  modified: 2026-07-26T19:04:11.811Z
---

งานที่มีข้อความไทย (ครีเอทีฟแอด · กราฟิก · หน้าเว็บ · widget · การ์ด) ให้ใช้ฟอนต์ **Noto Sans Thai** เสมอ

**Why:** นัทเห็นรูปแอด FB รอบแรกที่ผมเรนเดอร์ด้วย Leelawadee UI/Tahoma (ฟอนต์ติดเครื่อง Windows) แล้วบอกว่า "ไม่ modern" — สั่ง 26 ก.ค. 2026 ว่า "ต่อไปนี้ใช้ Noto Sans Thai"

**How to apply:**
- Canvas/HTML: โหลด `https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap` แล้วรอ `document.fonts.ready` ก่อนวาด (ไม่งั้น canvas fallback ไปฟอนต์ระบบเงียบๆ)
- ถ้าหน้าที่รันมี CSP บล็อก Google Fonts (เช่น drive.google.com) → ย้ายไปทำบน origin ของเราเอง (`under360-system.vercel.app`) แล้วดึงรูปจาก Supabase Storage แทน
- fallback stack: `"Noto Sans Thai", "IBM Plex Sans Thai", sans-serif`

ดู [[response-style-concise]] · เกี่ยวกับครีเอทีฟแอด: skill `under360-brand-copy`

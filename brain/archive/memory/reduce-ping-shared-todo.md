---
name: reduce-ping-shared-todo
description: นัทเป็นคอขวดเมื่อหลาย session ping/บรีฟ — เขียนลง TODO.md กลางแทนการ ping
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e0ce4fa5-b4d0-43db-9182-f632f69d694a
  modified: 2026-07-21T04:23:54.676Z
---

20 ก.ค. 2026: นัทรัน 4 session ขนานกัน (m-track / u-track / a-track / เอิธ) ทุกตัวชอบ ping + ส่งบรีฟข้าม session ให้นัทอ่านตลอด → **นัทกลายเป็นคอขวด ต้องคอยอ่านทุกบรีฟ**

**แก้:** สร้าง `TODO.md` กลางที่ repo root + skill `[[under360-shared-todo]]` — ทุก session เขียนงานลงไฟล์เดียว

**Why:** นัทอ่านทุก cross-session brief ไม่ไหว งานสะดุดที่ตัวเขา

**How to apply:**
- **แทนการ ping/send_message/บรีฟ → เขียนลง `TODO.md`** (section ของ track ตัวเอง + หัวข้อ "🔴 นัทต้องทำ" ถ้าต้องให้นัทลงมือ)
- ping เฉพาะเรื่อง **ด่วนจริง/บล็อกงาน** เท่านั้น
- อ่าน `TODO.md` ตอนเริ่ม session · pull ก่อนแก้ · แก้เฉพาะ section ตัวเอง
- นัทเปิด TODO.md ดูเองตามจังหวะ ไม่ถูก interrupt
- เกี่ยวโยง [[response-style-concise]] (ตอบสั้น จ่ายทีละเรื่อง) [[no-premature-done]]

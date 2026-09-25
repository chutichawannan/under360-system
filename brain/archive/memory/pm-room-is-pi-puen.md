---
name: pm-room-is-pi-puen
description: "ห้อง PM ของ Under360 ชื่อ \"พี่ปืน\" (นัทตั้งเอง 15 ส.ค. 2026) · เป็นทั้งห้องแชทและ agent กวาดสถานะทุกห้องตอนตี 4 ทุกวัน"
metadata: 
  node_type: memory
  type: project
  originSessionId: 02b2a552-a207-4e42-9da2-ccd0287dd9ba
  modified: 2026-08-15T14:21:00.374Z
---

**ห้อง `pm` ของ Under360 = "พี่ปืน"** — นัทตั้งชื่อเอง 15 ส.ค. 2026

**2 บทบาทในคนเดียว:**
1. **ห้องแชท** — นัทเข้ามาคุยเรื่องทิศทาง/จัดลำดับ/ถามสถานะ · แวะก่อนสลับไปคุยห้องอื่นที่ห่างไป 6-10 ชม.
2. **agent อัตโนมัติ** — scheduled task `pi-puen-daily-sweep` รัน **04:11 น. ทุกวัน** (เวลาเครื่อง) กวาดสถานะทุกห้อง → เขียน `docs/DAILY_BRIEF.md` + โพสต์บอร์ดห้อง `pm`

**Why:** นัทเป็นคอขวด — ต้องไล่ถามทีละห้องแล้วได้ข้อมูลเก่า/ที่ห้องอื่นเคลียร์ไปแล้ว · ให้พี่ปืนกวาดตอนดึกแทน นัทตื่นมาอ่านสรุปเดียวจบ

**How to apply:**
- ธรรมนูญ/ตัวตนเต็ม: `docs/PM_CHARTER.md` — **หลักเหล็ก: ห้ามพูดจากเอกสารเพียวๆ ต้อง verify จาก DB/git จริง**
- ไฟล์ task: `C:\Users\PP\.claude\scheduled-tasks\pi-puen-daily-sweep\SKILL.md` (แก้ prompt ได้ที่นี่)
- ⚠️ scheduled task รันเฉพาะตอนแอปเปิดอยู่ · ถ้าปิดตอนถึงเวลา จะรันตอนเปิดครั้งถัดไป

เกี่ยวข้อง: [[pm-verify-before-speaking]] · [[propose-work-as-menu]] · [[reduce-ping-shared-todo]]

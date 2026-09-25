---
name: backup-before-first-db-rewrite
description: แก้ข้อมูลจริงหลายแถว (เช่น order_items) ต้องสำรองก่อน "ครั้งแรก" ลงโฟลเดอร์ Desktop/under360_backups/ ไม่ใช่ scratchpad
metadata:
  type: feedback
---

ก่อนแก้ข้อมูลจริงเป็นชุด (order_items · menu_items หลายแถว · kitchen_data ก้อนใหญ่) ต้อง **สำรองค่าเดิมก่อนการแก้ครั้งแรก** แล้วเก็บที่ `Desktop/under360_backups/<วันที่>_<ชื่องาน>/` (ชื่อโฟลเดอร์ไม่ใช่ YYYY-MM-DD เป๊ะ = ตัวลบ backup อัตโนมัติไม่แตะ) + เขียนวิธีย้อน

**Why:** 11 ก.ย. 2026 ผมแก้รหัสในประวัติออเดอร์ 280 + 14 แถวก่อน แล้วค่อยสำรองตอนรอบใหญ่ 749 แถว → 294 แถวแรกย้อนไม่ได้ · ไฟล์สำรองยังไปอยู่ใน scratchpad ชั่วคราว (ถูกลบได้) พี่ปืนต้องตามย้ายให้ · หลักบ้านนี้ "ดาต้าลูกค้าสำคัญกว่าระบบ" ต้องรู้ทางถอยก่อนแตะ

**How to apply:**
- สำรองก่อนเขียนครั้งแรกเสมอ แม้คิดว่าแก้นิดเดียว (รอบเล็กมักตามด้วยรอบใหญ่)
- มีสคริปต์ย้อนคู่กัน: `scripts/niw/restore_order_codes.mjs <ไฟล์> [--apply]`
- แก้ order_items.menu_code → แจ้งห้อง f (งานรายเมนูย้อนหลังขยับ) · orders.mjs ไม่อ่าน menu_code
- สคริปต์ห้องอื่นที่เขียน menu_code (hato_sync / fah_sync_order_items) อาจทับที่แก้ — ยังไม่ได้เช็คโค้ด

Related: [[sd-pair-same-dish-not-same-week]] · [[delete-204-is-not-deleted]]

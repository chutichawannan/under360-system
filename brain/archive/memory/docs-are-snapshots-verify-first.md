---
name: docs-are-snapshots-verify-first
description: เอกสาร (HANDOFF/TODO/CLAUDE.md) = snapshot ณ เวลาที่เขียน ไม่ใช่สถานะปัจจุบัน — ต้อง verify กับ origin/main + DB ก่อนสั่งงานห้องอื่นเสมอ
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d478d3c0-c4c2-4e24-86d3-5df54c3558f9
  modified: 2026-08-04T23:10:01.116Z
---

ก่อนบอกห้องอื่นว่า "งานนี้ยังค้าง" หรือสั่งให้ทำอะไร **ต้อง verify กับ `origin/main` และ DB จริงก่อนเสมอ** — ห้ามอ่านจาก HANDOFF/TODO/CLAUDE.md แล้วสมมติว่ายังจริง

**Why:** 5 ส.ค. 2026 CC ส่งข้อมูลเก่าไปให้ห้องอื่น 3 ครั้งในวันเดียว — สั่ง U ทำ guard 60 กม. ที่ U ทำเสร็จไปแล้ว (commit `76d7d47`) · เสนอ M ให้ publish blog draft 40 ตัวที่ไม่มีอยู่จริง (published 61/61) และ localize รูป wixstatic ที่ทำไปแล้ว · ต้นเหตุ 2 ชั้น: (1) เอกสารเป็น snapshot ไม่ใช่ live state (2) CC นั่งอยู่ branch `amdoit` แล้ว grep working tree ตัวเอง ซึ่งล้าหลัง main อยู่ 2 commit จึงหาโค้ดที่มีอยู่จริงไม่เจอ

**How to apply:**
- **grep/อ่านโค้ดผ่าน `git grep <pattern> origin/main` เสมอ** ไม่ใช่ grep working tree (โดยเฉพาะเมื่ออยู่คนละ branch กับ main) — `git fetch origin` ก่อน
- ตารางข้อมูล (`customer_preferences`, `menu_items.subcode`, `stock_total`) → query นับแถวจริงก่อนบอกใครว่า "ใช้ได้แล้ว" (ดู [[no-premature-done]])
- ตอบกลับที่ดีที่สุดจากห้องอื่นคือตอบที่ **ตบข้อมูลเก่าของ CC กลับมาพร้อม query จริง** — ต้อนรับ ไม่ใช่ตั้งรับ
- เกี่ยวกับ [[ห้าม cp ทับตอน deploy]] (แพทเทิร์นเดียวกัน: working tree ≠ ความจริง)

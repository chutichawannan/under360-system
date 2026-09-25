---
name: nut-todo-list-location
description: "นัทขอ \"todo\" เมื่อไหร่ = ดึงใบ \"TODO นัท (รวมใบเดียว)\" ใน docs/loops/secretary.md บน origin/main มาให้ครบทั้งใบ"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 0b5a8ac4-f628-4e71-9e02-752ff94ff979
  modified: 2026-09-22T14:24:41.385Z
---

TODO ส่วนตัวของนัท (งานที่นัทบอกว่าจะทำเอง + งานเจที่มีเส้นตาย) รวมไว้ใบเดียวที่ `docs/loops/secretary.md` หัวข้อ **"🗂️ TODO นัท (รวมใบเดียว)"** (เริ่ม 22 ก.ย. 2569)

**How to apply:**
- นัทพิมพ์ "todo" / "ขอ todo" / "มีอะไรค้าง" → อ่านจาก `git show origin/main:docs/loops/secretary.md` (ทรีในเครื่องเก่ากว่า main เสมอ) แล้วเรียกมาให้ **ครบทั้งใบ**
- ก่อนส่ง เช็คสถานะจริงของแต่ละข้อที่เช็คได้ (DB/หน้าเว็บ) แล้วขีดข้อที่เสร็จ — ห้ามส่งของเก่าที่ปิดไปแล้ว
- นัทโยนงานใหม่ที่ "จะทำเอง" เข้ามา → เติมลงใบเดียวกันนี้ ไม่เปิดใบใหม่

Related: [[i-will-do-it-means-wait]] · [[no-dispatch-still-means-write-it-down]]

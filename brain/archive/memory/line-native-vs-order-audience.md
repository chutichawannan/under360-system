---
name: line-native-vs-order-audience
description: แบ่งงาน audience — LINE native (ยิงได้ track ไม่ได้ นัทกดเอง) vs order-data BC (คุม uid ผม/เอิธ track ได้)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 392d9268-1407-45b1-a13e-cb5380b42bc8
  modified: 2026-07-24T13:44:50.583Z
---

LINE OA มี audience 2 ประเภทที่ต้องแยกวิธีทำงาน:

**① LINE native audience** (อิมเพรสชัน/คลิกข้อความ/คลิกริชเมนู/ฟิลเตอร์ "ระยะเวลาเป็นเพื่อน") — LINE สร้างจากพฤติกรรมในแอป · **LINE ไม่ปล่อย uid ออกมา (black box)** → ยิงได้ แต่ track รายคน/attribution ไม่ได้ → **นัทกดใน LINE เองเร็วกว่า** · Claude ได้แค่อ่านตัวเลข + เขียนข้อความ (ไม่ต้องนั่งเข้า Chrome กดวิเคราะห์ทุกครั้ง — ค่าต่ำ)

**② order-data audience** (ไฟล์ BC ที่คัดจากตาราง `orders` → อัพโหลด uid เอง) — **เราคุม uid + โค้ดต่างกันต่อใบ** → Claude/เอิธ track ได้ 100% ทำจบใน DB (คัด segment + match uid↔order วัดยอดต่อใบ) ไม่ต้องแตะ LINE

**กฎแบ่งงาน:** track ได้ = ผม/เอิธ (DB) · ยิงกว้าง track ไม่ได้ = นัทกด LINE เอง + ผมเขียนข้อความให้ · attribution จริงมาจาก **โค้ด + ไฟล์ BC** ไม่ใช่ LINE tag (แชทแท็ก = manual + มั่ว 95% ดู [[broadcast-ads-owner-nut]])

**Why:** นัทเทรน Claude (23 ก.ค.) ให้ครั้งหน้ารู้เองว่าอะไรทำได้/ทำไม่ได้ ไม่ต้องกลับมาคุยซ้ำ — เพื่อ handoff ให้เอิธ/สั่ง Claude ตรงๆ ได้ · ปลายทาง = ทิ้ง Hato จบที่ LIFF 360 เอง (track ทุกคนผ่านโค้ด+uid)

**How to apply:** เจอ audience LINE native → บอกนัทกดเอง + เตรียมข้อความกว้างให้ · เจอ segment จาก order → ทำใน DB จบ ไม่เข้า LINE · อย่าเสนอเข้า Chrome นั่งวิเคราะห์ LINE native (uid เอาออกไม่ได้ = เสียเวลา)

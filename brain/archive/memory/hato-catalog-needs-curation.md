---
name: hato-catalog-needs-curation
description: Hato catalog มีของมั่วปนของขายจริง แยกด้วย flag/โค้ดไม่ได้ — ต้องให้แอดมิน curate เป็น whitelist (source of truth เดียวสำหรับเมนูลูกค้า + น้องนิว)
metadata: 
  node_type: memory
  type: project
  originSessionId: 0bfe48ff-1c3b-4383-80be-cb6308d49365
  modified: 2026-07-30T05:15:49.993Z
---

พิสูจน์แล้ว (29 ก.ค. 2026): เมนูที่นัทชี้ว่า "ไม่ได้ขาย" (MC4/MC5/D198/D199) มี flag ใน Hato **เหมือนของขายจริง (S105/S134/D101) เป๊ะทุกช่อง** — `active=true · status=Active · excludedFromListing=false · locationProducts[2461].active=true`. → **ไม่มี flag/field ใดใน Hato แยก "ของมั่ว/add-on/ของเลิกขาย" ออกจาก "เมนูจริง" ได้เลย** (locationProducts.active แยกได้แค่ปิดขายชัดๆ เช่น S077=false)

**ผลกระทบ:** migrate/reconcile อัตโนมัติจากข้อมูล Hato จะลากของมั่วมาด้วยเสมอ. หมวด `hato_import` ("เมนูเพิ่มเติม") = dump ปนกัน — ของจริง (D105/D101) + add-on (MC1 ซาลาเปา/MC4 ข้าวแพค/MC5 กิมจิ) + test ชื่อขึ้นต้น "XXXX" (D064/S201/D067/D143).

**ทางแก้เดียวที่เชื่อได้ = owner curation** (เหมือนที่ทำกับ "ลิสต์เซ็ต" แล้วสะอาดทันที): แอดมินส่งลิสต์เมนูที่ขายจริงมา → offline ที่เหลือ → ได้ **whitelist มาสเตอร์ตัวเดียว**.

**สำคัญต่อ [[migrate-customer-order-history]] และการออกแบบน้องนิว:** น้องนิว (และทุก downstream) ต้องหยิบเมนูจาก **whitelist ที่ approve แล้วเท่านั้น — ห้ามดึงจาก Hato/`is_available` ดิบ** · แยกลิสต์ตามชนิด (HP/LC/ข้าวกล่อง/กับข้าว) · guardrail: assign เฉพาะที่อยู่ใน whitelist · ห้ามแตะ add-on/ingredient · ไม่มั่นใจ=flag ไม่เดา · คนยืนยันก่อนเข้าครัว. "น้องนิวเอ๋อ" = garbage-in ไม่ใช่ตัว agent โง่. เชื่อมโยง [[two-sales-channels-ht-hs]] (บทเรียนเดียวกัน: เจ้าของ = ground truth, ห้ามอนุมานจากข้อมูลดิบ).

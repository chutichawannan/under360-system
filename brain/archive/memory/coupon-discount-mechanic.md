---
name: coupon-discount-mechanic
description: ระบบส่วนลด/คูปอง Under360 — 2 ชั้น (โค้ด + ส่งฟรีติดสินค้า) ชั้น 2 ยังไม่ทำ
metadata: 
  node_type: memory
  type: project
  originSessionId: bde8aa49-da42-434a-9109-fde3459291b7
---

ระบบส่วนลด Under360 ออกแบบเป็น **2 ชั้น**:

**ชั้น 1 — คูปองโค้ด (✅ ทำแล้ว commit e6ac679)**
- ตาราง `promo_codes` (มี schema ครบ): code, discount_type, discount_value, min_order, usage_limit, used_count, is_active, expires_at, description
- discount_type: `fixed` (ลดบาท) · `percent` (ลด%) · `free_shipping` (ค่าส่งฟรี = ลดค่าส่ง 100%)
- LIFF: ช่องกรอกโค้ดเหนือยอดรวมในหน้า cart → `applyPromo()` validate (active/หมดอายุ/ใช้ครบ/ยอดขั้นต่ำ) → `computeOrder()` คิดยอด → save `promotion_code`+`discount_amount` ลง orders + `used_count`+1
- OH แท็บโปรโมชั่น: `savePromo/loadPromos/togglePromo/delPromo` (เดิม HTML form มีแต่ JS ว่าง)
- คูปองตัวอย่างที่สร้างไว้เทส: UNDER50 (ลด ฿50 ขั้นต่ำ 300), FREESHIP (ส่งฟรี ขั้นต่ำ 500)

**ชั้น 2 — ส่งฟรีติดที่สินค้า (🔴 ยังไม่ทำ)**
- แอดมินติ๊กสินค้าชิ้นไหน "ส่งฟรี" → ตะกร้ามีชิ้นนั้น = ค่าส่งฟรีอัตโนมัติ (ไม่ต้องใช้โค้ด)
- ต้องเพิ่มคอลัมน์ `menu_items.free_shipping BOOLEAN` + checkbox ใน main_database_v2.html (หน้าแก้เมนู) + LIFF auto-detect ใน computeOrder()

**Why:** business logic ที่นัทออกแบบเอง — กระทบทั้ง LIFF, OH, main_database
**How to apply:** ค่าส่งคิดเฉพาะตอน `deliveryFeeKnown()` (ปักหมุด/express) เท่านั้น — free_shipping ลดได้เฉพาะค่าส่งที่รู้แล้ว เกี่ยว [[orders-plan-dataflow-vision]]

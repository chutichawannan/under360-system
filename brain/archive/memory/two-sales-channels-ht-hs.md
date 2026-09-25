---
name: two-sales-channels-ht-hs
description: HS- = ระบบเก็บแต้ม/loyalty log ของ Hato (ไม่ใช่ช่องขายแยก · นัทยืนยัน) — ยอดขายจริง = HT- อย่างเดียว · ห้ามนับ HS- เป็นยอด
metadata: 
  node_type: memory
  type: project
  originSessionId: 9e0f0020-7b48-4096-8278-d1d4a1d8977c
  modified: 2026-07-28T15:40:52.491Z
---

**`HS-` = ระบบเก็บแต้ม (loyalty log) ของ Hato ตัวเดียวกัน — ไม่ใช่ช่องขายแยก** (นัทเจ้าของยืนยัน 28 ก.ค. 2026 · "สังขกร ชัยวงศ์ขจร" ที่สั่ง 226 ครั้ง = บัญชีแอดมิน ไม่ใช่ลูกค้า)
- **`HT-`** = ออเดอร์ขายจริง (LIFF/ออนไลน์) · มี `order_items` · migrate ครบ 25/25 เดือน = **ยอดขายจริงใช้ตัวนี้เท่านั้น**
- **`HS-`** = log เก็บแต้ม · ไม่มี `order_items` · มี `transaction_id`/`terminal_no`/`staff_no` · P re-source เป็น **`source='hato_loyalty_log'`** แล้ว → ทุก report กรอง `source != 'hato_loyalty_log'`

🔴 **กับดักที่หลอกทั้งทีม (28 ก.ค. 2026):** เอา HS- เข้ามานับ = **ยอดบานปลอม** · "ก.พ. 2026 พุ่ง ฿1M" = ภาพลวงจาก HS- ล้วน · forensics 3 ทาง (temporal/customer-overlap/customer_id) **เอนไป "HS = ช่องขายจริง additive" — ผิดหมด** เพราะ pattern บอก "distinct transaction" ได้ แต่บอกไม่ได้ว่า "คืออะไร" → **เจ้าของตอบเท่านั้นที่ชี้ขาด** (บทเรียน: forensic เอนทางเดียวกันหลายวิธี ≠ ถูก · ถามเจ้าของก่อนลงมือกับตัวเลขใหญ่)

**ยอดขายจริง (HT- อย่างเดียว) H1 2026:** ม.ค. ฿556K → มิ.ย. ฿390K = **ตก ~30% ค่อยเป็นค่อยไป ไม่ใช่ดิ่ง 74%** · ก.ค. อ่อนลง (ยังไม่จบเดือน)

**กฎเหล็ก:** ยอดขาย/P&L/RFM ใช้ **HT- เท่านั้น** · กรองเสมอ: `source not in (test, parallel_test, hato_loyalty_log, line-เทส)` + ใบ control SKU (`แยกวันส่ง` ยอด 0 → [[zero-total-orders-meaning]]) · ใช้ `scripts/finance/orders.mjs` (single source of truth) ห้ามนับมือ · **ก่อนสรุปเทรนด์ เช็คความครบข้อมูลรายช่องทางรายเดือนก่อนเสมอ**

เกี่ยวข้อง: [[migrate-customer-order-history]] · [[business-context-and-versioning]]

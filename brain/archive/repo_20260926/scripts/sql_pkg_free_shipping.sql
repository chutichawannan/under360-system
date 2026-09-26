-- u0.4.34 — free_shipping: ติ๊กแพคเกจใน DB ว่า "ซื้อแพคนี้ = ส่งฟรีทั้งออเดอร์"
-- ใช้ดึงจุดขาย "ค่าส่งถูก/ฟรี" โดยเฉพาะ package · LIFF: ถ้าตะกร้ามี package free_shipping → ค่าส่ง = 0
ALTER TABLE packages ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;

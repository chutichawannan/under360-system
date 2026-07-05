-- v0.4.10 — เพิ่มช่องช้อนส้อมที่หน้าเช็คเอาท์ ให้ครัวเห็นชัดๆ ตอนจัดของ
-- default true เพราะลูกค้าส่วนใหญ่ต้องการช้อนส้อม — ออเดอร์เก่าก่อนหน้านี้จะถือว่า true ไปด้วย (ปลอดภัย ไม่กระทบอะไร)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS want_utensils BOOLEAN DEFAULT true;

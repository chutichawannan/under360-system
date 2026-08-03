-- u-track · เก็บ "ผู้ส่ง" ที่แอดมินเลือกในหน้าแมสเซนเจอร์
-- ปัญหาเดิม: เลือกผู้ส่งแล้วไม่ถูกบันทึกที่ไหนเลย — จัดรอบทั้งวัน สลับแท็บ = หายหมด
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier TEXT;   -- 'store' | 'lalamove' | 'grab' | null

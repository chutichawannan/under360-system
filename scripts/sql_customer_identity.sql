-- u-track · ระบบ identity ลูกค้า (กันซ้ำ + ชื่อทั้งคู่ + ประเภท/สี)
-- รันใน Supabase SQL editor · ปลอดภัย (IF NOT EXISTS) รันซ้ำได้

-- 1) เก็บชื่อไลน์แยกจากชื่อจริง (display_name = ชื่อจริง · line_display_name = ชื่อไลน์ ไม่ทับกัน)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS line_display_name TEXT;

-- 2) ประเภทลูกค้า (override) — null = อนุมานจาก source_first อัตโนมัติ (Hato/ก่อนHato/ใหม่)
--    ค่าที่แอดมินตั้งเอง: 'b2b' (ร้านค้า) · 'vip' · ฯลฯ → ใช้แยกสี/กรองในหน้า DB
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type TEXT;

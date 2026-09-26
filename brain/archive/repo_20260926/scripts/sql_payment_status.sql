-- u0.4.32 — payment_status: สถานะการโอนเงินของออเดอร์
-- แยกจากคอลัมน์ status เดิม (status = สถานะครัว/จัดส่ง: confirmed/preparing/ready/delivered)
-- payment_status: 'unpaid' = รอโอน · 'paid' = โอนแล้ว
--   • LIFF ตั้งอัตโนมัติเป็น 'paid' เมื่อลูกค้าอัพสลิป (beta: assume สลิปจริงก่อน) มิฉะนั้น 'unpaid'
--   • แอดมินกดสลับเองได้ในหน้า OH (กรณีลูกค้าโอนผ่านไลน์ ไม่ได้อัพในระบบ)
--   • ตกเย็นแอดมินไล่เช็คสลิปจริงย้อนหลัง

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';

-- ออเดอร์เก่าที่มีแนบสลิปอยู่แล้ว → mark เป็น paid (ปรับได้ตามจริง)
UPDATE orders SET payment_status = 'paid'
WHERE slip_image IS TRUE AND (payment_status IS NULL OR payment_status = 'unpaid');

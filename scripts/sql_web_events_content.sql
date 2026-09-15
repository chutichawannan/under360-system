-- 🎯 เก็บ "ชิ้นงานโฆษณา" ลง web_events — 06 Ads ขอ 15 ก.ย. 2569
--
-- ปัญหา: ตาราง web_events ไม่มีคอลัมน์ utm_content
--        → คำขอที่ส่ง utm_content มาถูกทิ้งเงียบ ไม่มี error ให้เห็น
--        → บอกได้แค่ "มาจากแคมเปญ pack2026" แต่บอกไม่ได้ว่ารูปไหนพามา
--
-- ⚠️ อ่านก่อนรัน: ฝั่ง "ออเดอร์" เก็บชิ้นงานอยู่แล้วที่ orders.source_content
--    (ตรวจแล้ว 15 ก.ย. — มีข้อมูลจริง เช่น jay2026-c2 / link_in_bio)
--    ไฟล์นี้แก้เฉพาะฝั่ง "คนเข้าเว็บ" ซึ่งตอบคนละคำถาม (คนคลิก ≠ คนซื้อ)
--
-- ปลอดภัย: เพิ่มคอลัมน์เฉย ๆ แถวเก่าเป็น NULL · ไม่แตะข้อมูลเดิม · รันซ้ำได้
-- ไม่กระทบโควตา Supabase (ไม่ได้เพิ่มความถี่การเขียน)

ALTER TABLE web_events ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- ตรวจหลังรัน — ต้องได้ 1 แถว
-- select column_name from information_schema.columns
--  where table_name='web_events' and column_name='utm_content';

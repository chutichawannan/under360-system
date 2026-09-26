-- v0.4.3 — แก้ระบบสต็อก: เดิม LIFF/KQ อ้างคอลัมน์ stock_quantity ที่ไม่มีอยู่จริง (ทำให้กดซื้อได้ตลอด + KQ query พังเงียบๆ)
-- คอลัมน์จริงคือ stock_total / stock_reserved / actual_stock
-- ทุกแถวตอนนี้ stock_total=0 (ไม่เคยมีใครตั้งค่าจริง) — รีเซ็ตเป็น NULL ครั้งเดียวให้ปลอดภัย
-- นิยามใหม่ตั้งแต่นี้ไป: NULL = ไม่จำกัด (ค่าเริ่มต้น) / 0 = หมดสต็อกจริง / ตัวเลข > 0 = เหลือเท่านี้
UPDATE menu_items SET stock_total = NULL WHERE stock_total = 0;
ALTER TABLE menu_items ALTER COLUMN stock_total DROP DEFAULT;

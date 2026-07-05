-- v0.4.12 — โค้ดส่วนลดเจาะจงสินค้า/แพคเกจ/มีลแพลน + flag "แนะนำลูกค้าตอนเช็คเอาท์"
-- ค่า default ทำให้โค้ดเดิมทั้งหมด (UNDER50, FREESHIP, JULY100) ทำงานเหมือนเดิมทุกอย่าง (scope_type='all')
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS scope_type TEXT NOT NULL DEFAULT 'all';
-- 'all'      = ใช้ได้ทั้งร้าน (ค่าเดิม)
-- 'sku'      = ใช้ได้เฉพาะเมนูที่เลือก      → scope_value = array ของ menu_items.code
-- 'package'  = ใช้ได้เฉพาะแพคเกจที่เลือก    → scope_value = array ของ packages.id
-- 'mp_offer' = ใช้ได้เฉพาะชุด Meal Plan ที่เลือก → scope_value = array ของ mp_offer_sets.set_key
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS scope_value JSONB DEFAULT '[]'::jsonb;

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS show_suggested BOOLEAN NOT NULL DEFAULT false;
-- true  = โชว์เป็นตัวเลือกแนะนำที่หน้าเช็คเอาท์ลูกค้า (แตะใช้ได้เลย ไม่ต้องพิมพ์)
-- false (ค่าเดิม) = ลูกค้าต้องพิมพ์โค้ดเองเท่านั้น (โค้ดลับ/แจกเฉพาะกลุ่ม เช่น แจกทาง LINE broadcast)

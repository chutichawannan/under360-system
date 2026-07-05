-- v0.4.14 — โค้ดบางอันซ้อนกับโค้ดอื่นได้ + scope แบบ "ยกเว้น" (negative)
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS stackable BOOLEAN NOT NULL DEFAULT false;
-- true  = โค้ดนี้ใช้ร่วมกับโค้ด "ซ้อนได้" อันอื่นพร้อมกันได้ในออเดอร์เดียว
-- false (ค่าเดิม) = โค้ดเดี่ยว ใช้แล้วแทนที่โค้ดอื่นที่เคยใส่ไว้ทั้งหมด (พฤติกรรมเดิมก่อนหน้านี้)

ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS scope_mode TEXT NOT NULL DEFAULT 'include';
-- 'include' (ค่าเดิม) = ใช้ได้เฉพาะกับรายการใน scope_value เท่านั้น
-- 'exclude' = ใช้ได้กับทุกอย่าง ยกเว้นรายการใน scope_value (เช่น "ลดทุกอย่าง ยกเว้น Meal Plan")
-- มีผลเฉพาะตอน scope_type ไม่ใช่ 'all' เท่านั้น

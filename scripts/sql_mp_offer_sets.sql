-- v0.4.10 — Meal Plan Offer Sets: ทำ MP_SETS (เดิม hardcode ในโค้ด) ให้แก้ผ่านหน้า DB ได้เอง
-- + รองรับสร้าง "Set 2" ชุดโปรโมชั่นแยก ลิ้งจากการ์ดหน้าแรกได้เอง ไม่ต้องรอ Claude
CREATE TABLE mp_offer_sets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  set_key text NOT NULL UNIQUE,           -- 'trial' / 'weekly' / 'monthly' / กำหนดเองสำหรับชุดโปรโมชั่น เช่น 'trial_promo990'
  label text NOT NULL,                    -- ชื่อที่ลูกค้าเห็น เช่น "ทดลอง" / "ทดลองพิเศษ 990.-"
  boxes int NOT NULL,
  price_hp int NOT NULL,
  price_lc int NOT NULL,
  is_active boolean DEFAULT true,         -- ปิด = ซ่อนจากทุกที่ (ทั้งหน้าหลักและลิ้งเฉพาะ)
  show_in_default_picker boolean DEFAULT true, -- true = โชว์ในหน้า Meal Plan ปกติ (Set 1) / false = ซ่อนจากหน้าหลัก แต่ยังลิ้งตรงได้ (ใช้ทำ Set 2 โปรโมชั่น)
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_mp_offer_sets_active ON mp_offer_sets(is_active);
ALTER TABLE mp_offer_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_mp_offer_sets" ON mp_offer_sets FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_mp_offer_sets" ON mp_offer_sets FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_mp_offer_sets" ON mp_offer_sets FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_mp_offer_sets" ON mp_offer_sets FOR DELETE TO anon USING (true);

-- Seed: ย้ายราคาปัจจุบัน (ที่เคย hardcode ใน liff_customer.html) เข้าตาราง ให้ "Set 1" ทำงานเหมือนเดิมทุกอย่าง
INSERT INTO mp_offer_sets (set_key, label, boxes, price_hp, price_lc, display_order) VALUES
  ('trial',   'ทดลอง',      7,  1499,  1399,  0),
  ('weekly',  '1 สัปดาห์',  21, 3990,  3790,  1),
  ('monthly', '1 เดือน',    84, 13990, 13490, 2);

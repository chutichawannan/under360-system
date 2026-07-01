-- v0.4 Meal Plan scheduling engine — รันครั้งเดียวใน Supabase SQL Editor
CREATE TABLE IF NOT EXISTS mp_deliveries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  line_uid text,
  customer_name text,
  mp_type text NOT NULL,              -- hp | lc
  mp_set text NOT NULL,                -- trial | weekly | monthly
  round_no integer NOT NULL,
  total_rounds integer NOT NULL,
  delivery_date date NOT NULL,
  time_slot text,
  time_slot_label text,
  delivery_address text,
  box_count integer DEFAULT 7,
  status text DEFAULT 'scheduled',     -- scheduled | request_open | request_submitted | menu_assigned | skip_requested | skipped | delivered | cancelled
  menu_items jsonb DEFAULT '[]',       -- [{code,name}] เมนูที่แอดมิน assign
  customer_request jsonb DEFAULT '[]', -- [{code,name}] เมนูที่ลูกค้า request
  customer_note text,
  request_opens_at date,
  request_deadline date,
  notified_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mpd_date ON mp_deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_mpd_customer ON mp_deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_mpd_order ON mp_deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_mpd_status ON mp_deliveries(status);
ALTER TABLE mp_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_mp_deliveries" ON mp_deliveries FOR ALL TO anon USING (true) WITH CHECK (true);

-- v0.4.1 — เตือนก่อนส่ง 1 วัน (แยกจาก notified_at ที่ใช้ตอนเปิด request window)
ALTER TABLE mp_deliveries ADD COLUMN IF NOT EXISTS day_before_notified_at timestamptz;
-- status ใหม่ที่ใช้ตอนนี้ (คอลัมน์ status เป็น text ธรรมดา ไม่มี CHECK constraint ไม่ต้องรันอะไรเพิ่ม):
--   no_change = ลูกค้าไม่ตอบภายใน request_deadline → ระบบปิดอัตโนมัติ ไม่เปลี่ยนแปลงเมนู

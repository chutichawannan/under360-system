-- v0.4.2 — เก็บชื่อ LINE แยกจากชื่อผู้รับ (กรณีลูกค้าสั่งให้คนอื่นหลายรอบ ต้องแยกได้ว่าใครสั่งจริง)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS line_display_name text;
ALTER TABLE mp_deliveries ADD COLUMN IF NOT EXISTS line_display_name text;

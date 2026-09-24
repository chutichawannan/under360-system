-- ═══ เก็บข้อความ "ขาเข้า" จากลูกค้าใน LINE OA ร้าน (f-track · 24 ก.ย. 2569) ═══
-- นัทสั่ง: "เปิด webhook ไปเลย" — เก็บอย่างเดียว ไม่ตอบลูกค้า
-- ใช้กับ api/line-store-webhook.js · อ่านผ่านเซิร์ฟเวอร์เท่านั้น (เหมือนแชทกะปัน)
--
-- 🔒 RLS: anon เขียนไม่ได้ อ่านไม่ได้ — กันแชทลูกค้ารั่วผ่านหน้าเว็บ
--    (บทเรียน 15 ส.ค.: line_group_messages เคยเปิดให้ anon แล้วต้องมาปิดทีหลัง)

create table if not exists line_customer_messages (
  id           bigserial primary key,
  line_uid     text,
  display_name text,
  msg_type     text,
  text         text,
  message_id   text unique,          -- LINE ส่งซ้ำได้ → กันบันทึกซ้ำ
  direction    text default 'in',    -- 'in' = ลูกค้าพิมพ์มา · 'out' = เราส่งออก (ยังไม่เปิด)
  line_ts      timestamptz,
  created_at   timestamptz default now()
);

create index if not exists lcm_uid_ts on line_customer_messages (line_uid, line_ts desc);

alter table line_customer_messages enable row level security;
-- ไม่สร้าง policy ใดๆ = anon แตะไม่ได้เลย · service role ข้าม RLS อยู่แล้ว

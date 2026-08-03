-- u-track · ที่เก็บ "แพ้อาหาร / ไม่กิน / ชอบ" ของลูกค้า (ปลดล็อกน้องนิว)
-- ปัญหาเดิม: โค้ดเขียนลง customers.preferences ซึ่งไม่มีคอลัมน์จริง → ข้อมูลหายเงียบ
create table if not exists customer_preferences (
  customer_id     text primary key,
  dislikes        text        default '',
  allergies       text        default '',
  liked_menus     jsonb       default '[]'::jsonb,
  disliked_menus  jsonb       default '[]'::jsonb,
  updated_by      text,
  updated_at      timestamptz default now()
);
alter table customer_preferences enable row level security;
drop policy if exists "cp_all_anon" on customer_preferences;
create policy "cp_all_anon" on customer_preferences for all using (true) with check (true);

-- ═══ Under360: live_presence — นับคนออนไลน์แบบ real-time (เว็บ + แอปสั่งของ LIFF) ═══
-- วางใน Supabase SQL Editor แล้วรันได้เลย
-- แต่ละหน้า (เว็บ/LIFF) จะ upsert แถวของตัวเองทุก 15 วิ · dashboard นับแถวที่ last_seen ใหม่กว่า 30 วิ = "ออนไลน์อยู่"

create table if not exists live_presence (
  sid        text primary key,          -- session id สุ่มต่อการเปิดหน้า 1 ครั้ง
  area       text,                       -- 'web' | 'liff'
  page       text,
  last_seen  timestamptz default now()
);

alter table live_presence enable row level security;

-- anon upsert/read ได้ (ข้อมูลไม่อ่อนไหว — แค่จำนวนคนออนไลน์)
create policy "lp_all_anon" on live_presence
  for all using (true) with check (true);

-- (ทางเลือก) ลบแถวเก่าเกิน 1 ชม. เป็นครั้งคราว กันตารางบวม — รันมือหรือตั้ง cron ก็ได้
-- delete from live_presence where last_seen < now() - interval '1 hour';

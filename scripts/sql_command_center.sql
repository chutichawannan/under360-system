-- ══════════════════════════════════════════════════════════
-- Command Center — ศูนย์รวมทุก track/agent + ช่องคุยแยกห้อง
-- (u-track · 26 ก.ค. 2026) — รันครั้งเดียวใน Supabase SQL editor
-- ══════════════════════════════════════════════════════════

-- 1) ข้อความในแต่ละห้อง (นัท ↔ แต่ละ track/agent)
create table if not exists session_messages (
  id         uuid primary key default gen_random_uuid(),
  room       text not null,                 -- 'u','m','a','migrate','f','eath','niw','keng','fah','tiang'
  sender     text not null,                 -- ใครพิมพ์ (เช่น 'nut', 'u', 'eath')
  role       text not null default 'claude',-- 'nut' | 'claude' | 'system' (ใช้จัดสีซ้าย/ขวา)
  text       text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_session_messages_room on session_messages(room, created_at);
alter table session_messages enable row level security;
create policy "sm_all_anon" on session_messages for all using (true) with check (true);

-- 2) สถานะล่าสุดของแต่ละห้อง (โชว์บนการ์ด — แต่ละ session อัปเดตแถวตัวเอง)
create table if not exists track_status (
  room       text primary key,
  status     text default 'idle',           -- 'idle' | 'working' | 'blocked'
  current    text default '',               -- กำลังทำอะไรอยู่ (บรรทัดเดียว)
  version    text default '',               -- เวอร์ชันล่าสุด เช่น 'u0.4.37'
  open_loops int  default 0,                -- ค้างกี่อย่าง
  updated_at timestamptz default now(),
  updated_by text
);
alter table track_status enable row level security;
create policy "ts_all_anon" on track_status for all using (true) with check (true);

-- work_claims — "จองงานก่อนทำ" กัน session ทำงานซ้ำกัน
-- ที่มา: 5 ส.ค. 2026 (นัทสั่ง) — P-track ทำรายงาน Hato ค้าง 9 วันเพราะห้องอื่นไม่รู้ว่ามีคนถืออยู่
-- ใช้คู่กับ hook SessionStart (scripts/cc_board.ps1) ที่ยิงบอร์ดเข้า context ทุกครั้งที่เปิดห้องใหม่

create table if not exists work_claims (
  id          uuid primary key default gen_random_uuid(),
  task        text not null,                   -- ชื่องานสั้นๆ ("ดึงรายงาน Hato รอบสุดท้าย")
  room        text not null,                   -- ห้องที่จอง (u / p / cc / m / e / migrate ...)
  status      text not null default 'open',    -- open | done | dropped
  files       text,                            -- ไฟล์/ตารางที่จะแตะ (กันชนกันระดับไฟล์)
  evidence    text,                            -- ปิดงานต้องมี: หลักฐานจาก DB/ไฟล์ ไม่ใช่คำบอกเล่า
  note        text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table work_claims enable row level security;

drop policy if exists "wc_all_anon" on work_claims;
create policy "wc_all_anon" on work_claims for all using (true) with check (true);

create index if not exists work_claims_status_idx on work_claims (status, updated_at desc);

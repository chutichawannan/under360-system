-- ═══ Under360 Web: ตาราง web_events (attribution + dashboard) ═══
-- วางใน Supabase SQL Editor แล้วรันได้เลย

create table if not exists web_events (
  id          uuid primary key default gen_random_uuid(),
  event       text not null,          -- 'pageview' | 'cta_click'
  page        text,                   -- 'index' | 'mealplan' | 'blog:slug'
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  referrer    text,
  ua          text,
  created_at  timestamptz default now()
);

create index if not exists idx_web_events_created on web_events(created_at desc);
create index if not exists idx_web_events_event on web_events(event);

alter table web_events enable row level security;

-- เว็บสาธารณะ insert ได้ (เก็บสถิติ)
create policy "we_insert_anon" on web_events for insert with check (true);
-- web_dashboard.html ต้อง select ได้ (หน้านี้ noindex + ไม่ประกาศลิงก์)
-- ⚠️ TODO (Claude Code): ตอนรีวิว security ทั้งระบบ พิจารณาย้าย dashboard ไปหลัง auth แล้วปิด policy นี้
create policy "we_select_anon" on web_events for select using (true);

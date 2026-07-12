-- ═══ Under360 Web: ตาราง blog_posts ═══
-- วางใน Supabase SQL Editor แล้วรันได้เลย

create table if not exists blog_posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  excerpt     text,
  cover_url   text,
  content_md  text not null,
  published   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table blog_posts enable row level security;

-- RLS แบบเดียวกับตารางอื่นในระบบ (anon ทำได้หมด)
-- ⚠️ TODO (Claude Code): ตอนรีวิว security ทั้งระบบ ค่อยแยก policy อ่าน/เขียน
create policy "blog_all_anon" on blog_posts
  for all using (true) with check (true);

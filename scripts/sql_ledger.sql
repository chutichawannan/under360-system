-- ============================================================
-- 💰 สมุดรายรับรายจ่าย — ตาราง ledger  (ใบงาน docs/BRIEF_LEDGER.md · นัทขอเอง 12 ก.ย. 2569)
-- u-maintainer · ทำตามใบงาน **v2** (นัทขยายโจทย์เอง: ใช้ 2 คน นัท + พลอย)
--
-- หลักที่ตารางนี้ต้องรองรับ:
--   ข้อ 2  รายรับของร้านไม่ต้องจด → ดึงจาก orders (หน้าเว็บคำนวณให้)
--          ⛔ ห้ามเขียนยอดขายซ้ำลงตารางนี้ จะกลายเป็น 2 แหล่งเลขทันที (บทเรียน ISSUE 02)
--   ข้อ 3  ที่ต้องจดคือ "รายจ่าย" + "รายรับนอกระบบ" (เงินสด · โอนเข้าส่วนตัว · B2B วางบิล)
--   ข้อ 4  แยกกระเป๋าตั้งแต่ตอนจด ไม่ใช่มาแยกตอนสิ้นเดือน (กฎบัญชีกลางใน CLAUDE.md)
--   v2     3 กระเป๋า: ส่วนตัว · ร้าน Under360 · ของเราสองคน   +  owner = ใครจด
--
-- 🔑 note = ข้อความดิบที่คนพิมพ์ — เก็บไว้เสมอ ห้ามทิ้ง
--    กะปัน "เดา" กระเป๋ากับหมวดให้ ถ้าเดาผิดแล้วไม่เหลือต้นฉบับ = ไม่มีใครย้อนได้ว่าจริง ๆ คืออะไร
--
-- 🔴 ข้อจำกัดที่ต้องรู้ก่อนใช้จริง — ใบงาน v2 เขียนว่า "หน้าของอีกฝ่ายเปิดดูไม่ได้"
--    ตารางนี้ยังทำให้จริงไม่ได้ด้วย policy เดียว เพราะทุกหน้าในระบบยิงด้วย anon key ตัวเดียวกัน
--    → ตอนนี้ "แยกหน้า" = แยกที่การแสดงผล ไม่ใช่แยกที่สิทธิ์จริง
--    ถ้าพลอยต้องการให้นัทเปิดดูไม่ได้จริง ๆ ต้องอ่าน/เขียนผ่าน serverless (service role) + ผูก LINE uid
--    **อย่าบอกใครว่าข้อมูลฝั่งพลอยถูกล็อกจากนัทแล้ว จนกว่าจะทำชั้นนั้น**
--
-- ⚠️ ไฟล์นี้ยังไม่ได้รัน — ต้องเปิด Supabase SQL Editor รันด้วยมือ (anon key สร้างตารางไม่ได้)
--    หน้าเว็บรู้จักสถานะ "ยังไม่ได้รัน SQL" และบอกบนจอเอง ไม่ขึ้นหน้าว่างเฉย ๆ
-- ============================================================

create table if not exists ledger (
  id           uuid primary key default gen_random_uuid(),
  at           timestamptz not null default now(),  -- เวลาที่เกิดรายการ (ไม่ใช่เวลาที่จด)
  owner        text not null default 'nut',         -- 'nut' | 'ploy' — ใครเป็นคนจด (แยกจาก LINE uid ของคนพิมพ์)
  book         text not null default 'personal',    -- 'personal' | 'shop' | 'shared' — กระเป๋าไหน
  paid_by      text,                                -- ใช้กับ book='shared': ใครเป็นคนออกเงินจริง ('nut' | 'ploy')
  kind         text not null default 'out',         -- 'out' จ่าย | 'in' รับ
  amount       numeric not null,                    -- บาท (บวกเสมอ ทิศทางอยู่ที่ kind)
  category     text,                                -- วัตถุดิบ · ค่าส่ง · แอด · ค่าแรง · บ้าน · ลูก ฯลฯ
  note         text,                                -- ข้อความดิบที่คนพิมพ์ — ห้ามทิ้ง
  slip_url     text,                                -- รูปสลิปที่ส่งตามมา (ถ้ามี)
  source       text default 'line',                 -- 'line' | 'manual' | 'import'
  created_by   text,                                -- ชื่อคน/ห้องที่เขียนแถวนี้ (กะปัน / หน้าเว็บ)
  needs_review boolean default false,               -- กะปันเดาไม่ชัดว่ากระเป๋าไหน → ติดธงให้มาแก้ทีหลัง
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- กันค่าที่เป็นไปไม่ได้ตั้งแต่ชั้น DB — กะปันเขียนตรงผ่าน REST ด้วย ไม่ได้ผ่านหน้าเว็บทางเดียว
alter table ledger drop constraint if exists ledger_owner_ck;
alter table ledger add  constraint ledger_owner_ck check (owner in ('nut','ploy'));
alter table ledger drop constraint if exists ledger_book_ck;
alter table ledger add  constraint ledger_book_ck check (book in ('personal','shop','shared'));
alter table ledger drop constraint if exists ledger_paid_ck;
alter table ledger add  constraint ledger_paid_ck check (paid_by is null or paid_by in ('nut','ploy'));
alter table ledger drop constraint if exists ledger_kind_ck;
alter table ledger add  constraint ledger_kind_ck check (kind in ('in','out'));
alter table ledger drop constraint if exists ledger_amount_ck;
alter table ledger add  constraint ledger_amount_ck check (amount >= 0);

-- หน้าเว็บอ่านเป็นช่วงเวลาเสมอ (วันนี้ / เดือนนี้) แล้วค่อยแยกกระเป๋า
create index if not exists ledger_at_idx        on ledger (at desc);
create index if not exists ledger_book_at_idx   on ledger (book, at desc);
create index if not exists ledger_owner_at_idx  on ledger (owner, at desc);
create index if not exists ledger_review_idx    on ledger (needs_review) where needs_review;

alter table ledger enable row level security;

-- เหมือนตารางอื่นในระบบ: anon ทำได้ทุกอย่าง เพราะหน้าเว็บทั้งบ้านยิงด้วย anon key
-- 🔴 แปลว่า PIN = ด่านหน้าบ้าน ไม่ใช่กำแพงจริง (กฎเดียวกับ gate.js) · ดูข้อจำกัดด้านบน
drop policy if exists "ledger_all_anon" on ledger;
create policy "ledger_all_anon" on ledger for all using (true) with check (true);

-- ─────────────────────────────────────────────
-- เผื่อรันซ้ำหลังเคยรันเวอร์ชันแรก (ที่ใช้คอลัมน์ side) — เติมคอลัมน์ v2 แล้วย้ายข้อมูลเก่า
-- ปลอดภัยต่อการรันซ้ำ: ถ้าไม่เคยมี side จะไม่ทำอะไรเลย
-- ─────────────────────────────────────────────
alter table ledger add column if not exists owner   text not null default 'nut';
alter table ledger add column if not exists book    text not null default 'personal';
alter table ledger add column if not exists paid_by text;
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'ledger' and column_name = 'side') then
    update ledger set book = side where book is distinct from side and side in ('personal','shop');
  end if;
end $$;

-- ─────────────────────────────────────────────
-- seed: รายการจริงรายการแรกที่นัทพิมพ์เข้ามาแล้ว (ใบงาน v3)
-- 12 ก.ย. 2569 · เราสองคน · "กินข้าวกับพลอย" · นัทออก · ฿1,471
-- กันซ้ำถ้ารันไฟล์นี้หลายรอบ
-- ─────────────────────────────────────────────
insert into ledger (at, owner, book, paid_by, kind, amount, category, note, source, created_by)
select '2026-09-12T12:00:00+07:00'::timestamptz, 'nut', 'shared', 'nut', 'out', 1471,
       'กินข้าวด้วยกัน', 'กินข้าวกับพลอย', 'line', 'กะปัน'
where not exists (
  select 1 from ledger where note = 'กินข้าวกับพลอย' and amount = 1471 and book = 'shared'
);

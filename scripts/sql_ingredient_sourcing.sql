-- ============================================================
-- วัตถุดิบ: ราคา + ประวัติสั่งซื้อ + ข้อมูลของ (shelf life / ฟรีซได้)
-- CC · 18 ส.ค. 2026
--
-- ที่มา: เลขา → CC (17 ส.ค.) — "CC สร้างตารางเลย"
--   เหตุผล: ประวัติวัตถุดิบ 3 เดือน (GO + Freshket) ที่ดึงมาแล้ว
--   ยังไม่มีที่เก็บ → เช็คแล้ว 404 ทั้ง 5 ชื่อ:
--   ingredient_prices · ingredients · purchase_history · supplier_prices · ingredient_purchases
--   ถ้าค้างอยู่ในไฟล์/ใน session มันจะหายตอนปิดห้อง
--
-- กติกาที่ตารางนี้ต้องรองรับ (docs/BRIEF_PRICE_COMPARE.md — นัทกำหนดเอง):
--   ข้อ 1 ทุกเกรด/ทุกตัวเลือก  → 1 สินค้า = หลายแถวใน ingredient_prices
--   ข้อ 2 ต้องมี ฿/กก. เสมอ    → price_per_kg (generated ถ้ากรอก pack_size_kg)
--   ข้อ 4 ความถี่การใช้        → ingredient_purchases (กี่ครั้ง ครั้งละเท่าไหร่ ห่างกันกี่วัน)
--   ข้อ 5/8 ฟรีซได้ / อายุของ  → ingredient_facts  ⬅ 2 ตัวนี้คือคอขวดที่ยังไม่มีที่ไหนเลย
--
-- ⚠️ ไฟล์นี้ยังไม่ได้รัน — ต้องเปิด Supabase SQL Editor รันด้วยมือ
--    (anon key สร้างตารางไม่ได้ · รอบอัตโนมัติเปิดเบราว์เซอร์ login ไม่ได้)
-- ============================================================


-- ─────────────────────────────────────────────
-- 1) ราคาปัจจุบัน — ทุกเกรด ทุกขนาด ทุกเจ้า
--    1 สินค้า มีได้หลายแถว (เกรด/ขนาดต่างกัน = คนละแถว)
-- ─────────────────────────────────────────────
create table if not exists ingredient_prices (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,              -- ชื่อที่เราใช้เรียกกันเอง เช่น 'พริกยักษ์แดง'
  vendor        text not null,              -- 'go' | 'freshket'
  vendor_sku    text,                       -- รหัส/ลิงก์สินค้าฝั่งเจ้านั้น (ถ้ามี)
  vendor_name   text,                       -- ชื่อเต็มตามหน้าเว็บเจ้านั้น (ไว้ trace ย้อน)
  grade         text,                       -- 'เบอร์รอง' | 'คัดสวย' | ยี่ห้อ | null ถ้าไม่มีเกรด
  pack_size     numeric,                    -- ตัวเลขขนาดบรรจุ เช่น 500
  pack_unit     text,                       -- 'g' | 'kg' | 'ml' | 'l' | 'ขวด' | 'ถุง' | 'ฟอง'
  pack_size_kg  numeric,                    -- ขนาดบรรจุแปลงเป็น กก. (กรอกเมื่อแปลงได้)
  price         numeric not null,           -- ราคาต่อแพ็ค (บาท)
  price_per_kg  numeric,                    -- ฿/กก. — กติกาข้อ 2 บังคับมี ถ้าแปลงหน่วยได้
  in_stock      boolean default true,       -- เจ้านั้นมีของขายอยู่ไหม
  checked_at    timestamptz default now(),  -- ดึงราคานี้มาเมื่อไหร่ (ราคาเปลี่ยนได้)
  note          text,
  created_at    timestamptz default now()
);

create index if not exists idx_ing_prices_name   on ingredient_prices (name);
create index if not exists idx_ing_prices_vendor on ingredient_prices (vendor);


-- ─────────────────────────────────────────────
-- 2) ประวัติการสั่งซื้อจริง — "ใช้บ่อยแค่ไหน"
--    นัทย้ำเอง: ที่ต้องการจากประวัติ 3 เดือน คือ "การใช้" ไม่ใช่ "ราคา"
--    → ของอะไร · สั่งกี่ครั้ง · ครั้งละเท่าไหร่ · ห่างกันกี่วัน
-- ─────────────────────────────────────────────
create table if not exists ingredient_purchases (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,              -- ชื่อกลาง ให้ตรงกับ ingredient_prices.name
  vendor        text not null,              -- 'go' | 'freshket'
  vendor_name   text,                       -- ชื่อตามบิลของเจ้านั้น
  order_date    date not null,              -- วันที่สั่ง
  bill_no       text,                       -- เลขที่บิล/ออเดอร์ฝั่งเจ้านั้น
  qty           numeric,                    -- จำนวนที่สั่ง (นับเป็นแพ็ค)
  pack_size     numeric,
  pack_unit     text,
  qty_kg        numeric,                    -- ปริมาณรวมเป็น กก. (ถ้าแปลงได้)
  unit_price    numeric,                    -- ราคาต่อแพ็คตอนนั้น
  line_total    numeric,                    -- ยอดรวมบรรทัดนั้น
  note          text,
  created_at    timestamptz default now()
);

create index if not exists idx_ing_purch_name on ingredient_purchases (name);
create index if not exists idx_ing_purch_date on ingredient_purchases (order_date);
-- กันลงซ้ำตอน import รอบสอง (บิลเดียว สินค้าเดียว = แถวเดียว)
create unique index if not exists uq_ing_purch
  on ingredient_purchases (vendor, bill_no, vendor_name)
  where bill_no is not null;


-- ─────────────────────────────────────────────
-- 3) ข้อมูลของ — 🔴 คอขวดตัวจริง (BRIEF_PRICE_COMPARE ข้อ 4/5/8)
--    "shelf life กับ ฟรีซได้ไหม ยังไม่มีที่ไหนเลย"
--    เจ้าของข้อมูล = ฟ้า/ครัว · buyer เป็นคนไล่เก็บ
--    ไม่มี 2 ช่องนี้ = ตัดสินใจ "ซื้อขนาดไหน" ไม่ได้เลย
-- ─────────────────────────────────────────────
create table if not exists ingredient_facts (
  name             text primary key,        -- ชื่อกลาง ตรงกับ 2 ตารางบน
  shelf_life_days  int,                     -- อยู่ได้กี่วันหลังรับของ (ของสด/ของแห้ง)
  freezable        boolean,                 -- ฟรีซได้ไหม
  freeze_note      text,                    -- ฟรีซแล้วเสียคุณภาพไหม / ต้องแบ่งพอร์ชั่นยังไง
  storage          text,                    -- 'ฟรีซ' | 'ชิลล์' | 'แห้ง'
  min_pack_note    text,                    -- ขนาดเล็กสุดที่มีขายจริง (กติกาข้อ 4)
  updated_by       text,                    -- 'fah' | 'buyer' | 'kitchen' | 'nut'
  updated_at       timestamptz default now()
);


-- ─────────────────────────────────────────────
-- RLS — ตามแบบเดียวกับตารางอื่นในบ้านนี้ (anon อ่าน/เขียนได้)
-- ไม่มีข้อมูลลูกค้าอยู่ในนี้ = ไม่ใช่ข้อมูลอ่อนไหว
-- ─────────────────────────────────────────────
alter table ingredient_prices    enable row level security;
alter table ingredient_purchases enable row level security;
alter table ingredient_facts     enable row level security;

drop policy if exists "ing_prices_all_anon"    on ingredient_prices;
drop policy if exists "ing_purchases_all_anon" on ingredient_purchases;
drop policy if exists "ing_facts_all_anon"     on ingredient_facts;

create policy "ing_prices_all_anon"    on ingredient_prices    for all using (true) with check (true);
create policy "ing_purchases_all_anon" on ingredient_purchases for all using (true) with check (true);
create policy "ing_facts_all_anon"     on ingredient_facts     for all using (true) with check (true);


-- ─────────────────────────────────────────────
-- เช็คหลังรัน (ต้องได้ 200 ทั้ง 3 ตัว ไม่ใช่ 404)
--   /rest/v1/ingredient_prices?select=*&limit=1
--   /rest/v1/ingredient_purchases?select=*&limit=1
--   /rest/v1/ingredient_facts?select=*&limit=1
-- ─────────────────────────────────────────────

-- 🛵 ปลายทางเชื่อได้แค่ไหน + เก็บเลขงานจอง Lalamove
-- ─────────────────────────────────────────────────────────────
-- รันครั้งเดียวใน Supabase → SQL Editor → วางทั้งไฟล์ → Run
-- ปลอดภัย: ทุกคำสั่งเป็น "เพิ่มถ้ายังไม่มี" ไม่ลบ ไม่แก้ข้อมูลเดิมสักแถว
--
-- 🔴 ทำไมต้องมี (เหตุผลเดียวกัน 2 เรื่อง — PM ชี้เอง 16 ส.ค. 2569):
--    "ระบบไม่รู้ว่าข้อมูลปลายทางเชื่อได้แค่ไหน"
--
--    ตอนนี้ระบบ**เดาหมุดให้**ลูกค้าที่ไม่ปักหมุด (เสิร์ชจากที่อยู่)
--    แต่ในฐานข้อมูล **หมุดที่เดา กับ หมุดที่ลูกค้าปักเอง หน้าตาเหมือนกันทุกอย่าง**
--    → หน้าแมสโชว์ความแม่นได้แค่ตอนเพิ่งกดคำนวณ พอรีเฟรชก็หายหมด
--    → วันหนึ่งจะมีคนเชื่อหมุดที่ผิดไป 500 เมตร แล้วส่งของผิดที่
--    → และถ้าเปิดจองรถจริงเมื่อไหร่ = เสียเงินจริงไปกับที่ผิดด้วย
--
--    ⛔ นี่คือ **เงื่อนไขก่อนเปิดจองรถจริง** ไม่ใช่งานแยก

-- ── 1) ที่มาของหมุด — หมุดนี้ใครเป็นคนให้ ────────────────────────────
--    customer  = ลูกค้าปักเอง                → เชื่อได้เต็ม ส่งจริง/คิดเงินได้
--    geocode   = ระบบเสิร์ชจากที่อยู่ให้      → ดูคู่กับ pin_accuracy
--    admin     = แอดมินใส่ให้ทีหลัง          → เชื่อได้
--    NULL      = ของเก่าก่อนมีคอลัมน์นี้      → ไม่รู้ที่มา ให้ระวังไว้ก่อน
alter table orders add column if not exists pin_source text;

-- ── 2) หมุดแม่นระดับไหน (ค่าตรงจาก Google Geocoder) ──────────────────
--    ROOFTOP             = ตรงถึงบ้านเลขที่           → จองรถได้เลย
--    RANGE_INTERPOLATED  = ประมาณจากช่วงเลขที่บนถนน  → พอใช้ ควรเช็ค
--    GEOMETRIC_CENTER    = ได้แค่กลางซอย/ถนน          → 🔴 ห้ามจองรถจนกว่าจะโทรถาม
--    APPROXIMATE         = ได้แค่ย่าน/ตำบล            → 🔴 ห้ามจองรถ
alter table orders add column if not exists pin_accuracy text;

-- ── 3) เลขงานจอง Lalamove — ไม่เก็บ = จองแล้วตามงานไม่ได้ ─────────────
alter table orders add column if not exists lalamove_order_id text;   -- เลขงานฝั่ง Lalamove
alter table orders add column if not exists lalamove_share_url text;  -- ลิงก์ติดตามคนขับ (ส่งให้ลูกค้าได้)
alter table orders add column if not exists lalamove_status text;     -- ASSIGNING / ON_GOING / COMPLETED / CANCELED
alter table orders add column if not exists lalamove_price numeric;   -- ราคาที่จองจริง (คนละตัวกับที่ประเมินไว้)
alter table orders add column if not exists lalamove_booked_at timestamptz;

-- หาไว: "วันนี้จองรถไปแล้วกี่ใบ" / "ใบไหนยังไม่ได้จอง"
create index if not exists idx_orders_lalamove on orders (lalamove_order_id) where lalamove_order_id is not null;

-- ── 4) เติมย้อนหลังให้ข้อมูลที่รู้ที่มาแน่ๆ ───────────────────────────
-- ⚠️ ตั้งใจไม่เดาให้ทุกแถว — แถวที่ไม่รู้ที่มาจริงๆ ปล่อย NULL ไว้ดีกว่าใส่ค่าผิด
--    (ใส่ 'customer' มั่วๆ = สร้างความมั่นใจปลอมให้คนที่มาอ่านทีหลัง อันตรายกว่าไม่รู้)
-- ใบที่ห้องพี่เก่งเสิร์ชเติมให้เอง 10-14 ส.ค. — รู้แน่ว่ามาจาก geocode
update orders set pin_source = 'geocode'
 where pin_source is null
   and delivery_lat is not null
   and order_number in (
     'U-0810-008','U-0810-011','U-0810-010','U-0810-012','U-0810-009','U-0810-013',
     'U-0811-012','U-0811-013','U-0811-014','U-0811-015','U-0811-017','U-0811-016',
     'U-0814-004','U-0813-005','U-0814-005','U-0814-007','U-0814-008','U-0814-009',
     'U-0814-010','U-0814-011'
   );

-- ── ตรวจหลังรัน (ควรได้ 5 คอลัมน์ใหม่ + 20 แถวที่ติดป้าย geocode) ────
-- select count(*) filter (where pin_source = 'geocode')  as เสิร์ชให้,
--        count(*) filter (where pin_source is null)      as ไม่รู้ที่มา,
--        count(*) filter (where lalamove_order_id is not null) as จองรถแล้ว
--   from orders where delivery_date >= current_date - 30;

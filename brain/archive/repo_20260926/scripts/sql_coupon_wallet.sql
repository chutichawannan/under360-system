-- 🎫 กระเป๋าคูปอง — "เก็บคูปอง" แบบ Shopee/Lazada (นัทสั่งเอง 30 ส.ค. 2569)
--
-- ทำไมต้องมี — ตัวเลขจากระบบเราเอง (นับจาก promo_codes.used_count จริง):
--   FREESHIP  โผล่เองที่หน้าจ่าย ไม่ต้องพิมพ์  → ใช้ไป 56 ครั้ง
--   UNDER50   ต้องพิมพ์เอง                     → 16
--   THANKS200 ต้องพิมพ์เอง                     →  9
--   MP15 · NEW200 · COMEBACK · FBPACK          →  0 ทุกตัว
--   = ตัวแปรคือ "ต้องพิมพ์ไหม" ไม่ใช่ "ลดเยอะแค่ไหน"
--   คูปองเก็บได้ = ลูกค้ากดครั้งเดียวตอนเห็นโฆษณา แล้วมันรออยู่ในกระเป๋าตอนจ่ายเงิน
--
-- ⚠️ ตารางนี้เก็บแค่ "ใครเก็บคูปองอะไรไว้" — เงื่อนไขคูปอง (ลดเท่าไหร่ · ขั้นต่ำ · ใช้กับอะไรได้
--    · ซ้อนกันได้ไหม · หมดอายุเมื่อไหร่) ยังอยู่ที่ promo_codes เหมือนเดิม ไม่ย้าย ไม่ทำซ้ำ
--    (บทเรียน 27-28 ส.ค.: เก็บข้อมูลเดียวกันไว้ 2 ที่แล้วไม่มีใครบังคับให้ตรง = ลูกค้าตกหล่น)

create table if not exists coupon_wallet (
  id           uuid primary key default gen_random_uuid(),
  line_uid     text not null,                    -- เจ้าของคูปอง (ผูกกับบัญชีไลน์ ไม่ใช่เบอร์ — เบอร์เปลี่ยนได้)
  code         text not null,                    -- ตรงกับ promo_codes.code
  collected_at timestamptz not null default now(),
  source       text,                             -- เก็บมาจากไหน: 'liff' | 'broadcast' | 'web' | 'admin'
  used_at      timestamptz,                      -- ใช้ไปแล้วเมื่อไหร่ (null = ยังไม่ใช้)
  used_order_id uuid,                            -- ใช้กับออเดอร์ไหน — ไว้ตามว่าคูปองทำเงินได้จริงไหม
  created_at   timestamptz not null default now()
);

-- 🔒 คนละคนเก็บโค้ดเดียวกันได้ แต่คนเดิมเก็บซ้ำไม่ได้ (กันกดรัวจนได้หลายใบ)
create unique index if not exists coupon_wallet_uid_code_uniq on coupon_wallet (line_uid, code);

-- ลูกค้าเปิดกระเป๋าตัวเอง = ค้นด้วย line_uid ตลอด
create index if not exists coupon_wallet_uid_idx on coupon_wallet (line_uid);
-- รายงาน "คูปองนี้มีคนเก็บกี่คน ใช้จริงกี่คน" = ค้นด้วย code
create index if not exists coupon_wallet_code_idx on coupon_wallet (code);

alter table coupon_wallet enable row level security;

-- ใช้ pattern เดียวกับตารางอื่นในระบบ (LIFF ทั้งหมดวิ่งด้วย anon key)
-- ⚠️ ข้อจำกัดที่รู้ตัว: anon อ่านแถวของคนอื่นได้ในทางเทคนิค — เหมือน orders/customers ที่ใช้อยู่แล้ว
--    ในนี้ไม่มีอะไรมากกว่า "uid นี้เก็บโค้ดนี้ไว้" (ไม่มีชื่อ เบอร์ ที่อยู่ ยอดเงิน)
--    ถ้าจะรัดกุมกว่านี้ต้องขยับทั้งระบบไปใช้ JWT รายคน ซึ่งเป็นงานคนละก้อน
create policy "coupon_wallet_all_anon" on coupon_wallet for all using (true) with check (true);

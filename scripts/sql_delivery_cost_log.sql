-- 📊 เก็บสถิติค่าส่งรายวัน — สะสมไว้ตอบคำถาม "จ้างแมสเดือนละเท่าไหร่ถึงคุ้ม"
-- นัทสั่ง 5 ส.ค. 2569: "นายทยอยเก็บข้อมูลไว้ละกัน ถ้าทำลาล่าทุกวันเข้า จะมีดาต้าพอที่จะคำนวณ
--                      แน่นอนว่าแมสราคาเท่าไหร่ถึงจะสมเหตุสมผล"
--
-- ใช้ยังไง: แค่กดปุ่ม "💰 คำนวณค่าส่งถูกสุด" ในหน้าแมสเซนเจอร์ ระบบบันทึกให้เอง (1 วัน 1 แถว เขียนทับได้)
-- ถ้ายังไม่รันไฟล์นี้ ปุ่มยังใช้ได้ปกติ แค่ไม่บันทึกสถิติ (โค้ด catch error ไว้แล้ว)

create table if not exists delivery_cost_log (
  delivery_date   date primary key,        -- วันที่ส่งของ (1 วัน 1 แถว)
  stops           int  not null default 0, -- จำนวนจุดส่งที่คิดค่าส่งได้ (ตัดนอกเขต/ไม่มีพิกัดออกแล้ว)
  trips           int  not null default 0, -- จำนวนคันที่ต้องเรียกหลังจัดรอบ
  cost_grouped    int  not null default 0, -- ค่าส่งรวม เมื่อจัดรอบแล้ว
  cost_separate   int  not null default 0, -- ค่าส่งรวม ถ้ายิงแยกทีละจุด (ฐานเทียบ)
  max_stops       int  not null default 3, -- เพดานงานต่อคันที่ใช้ตอนคำนวณ
  skipped         int  not null default 0, -- ใบที่คิดไม่ได้ (ไม่มีพิกัด / นอกเขต / ส่งแล้ว)
  detail          jsonb,                   -- รายรอบ: [{stops:[ชื่อ], price, solo}]
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table delivery_cost_log enable row level security;

-- อนุญาต anon อ่าน/เขียน (หน้า OH ใช้ anon key เหมือนตารางอื่นในระบบ)
drop policy if exists dcl_all_anon on delivery_cost_log;
create policy dcl_all_anon on delivery_cost_log for all using (true) with check (true);

-- ── ตัวอย่าง query ที่จะใช้ตอนตัดสินใจจ้างแมส ──
-- select count(*)                as วันที่เก็บได้,
--        round(avg(stops),1)     as จุดต่อวัน,
--        round(avg(cost_grouped))as ค่าส่งต่อวัน,
--        round(avg(cost_grouped) * 26) as ค่าส่งต่อเดือน
-- from delivery_cost_log;

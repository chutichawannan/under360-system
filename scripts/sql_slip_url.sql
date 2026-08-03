-- ═══════════════════════════════════════════════════════════════════
-- เก็บ "สลิปโอนเงิน" ให้ตรวจสอบได้จริง (audit ก่อน cutover · 3 ส.ค. 2026)
--
-- ปัญหาเดิม: ลูกค้าอัพสลิป → ระบบตีว่า "จ่ายแล้ว" ทันที
--            แต่ **รูปสลิปถูกทิ้ง** (คอลัมน์ slip_image เป็น boolean เก็บได้แค่ true/false)
--            แอดมินเห็นแค่ 📎 เปิดดูไม่ได้ = ตรวจสอบการโอนไม่ได้เลย
--            → หลังเลิก Hato นี่คือช่องทางรับเงินช่องทางเดียว
--
-- แก้เป็น: เก็บรูปจริงลง Storage + เก็บลิงก์ไว้ที่ orders.slip_url
--          และไม่ตีว่า "จ่ายแล้ว" จนแอดมินกดยืนยัน (payment_status = 'pending_review')
--
-- 📌 รันที่ Supabase → SQL Editor → วางทั้งไฟล์ → Run  (รันซ้ำได้ ไม่พัง)
-- ═══════════════════════════════════════════════════════════════════

-- 1) คอลัมน์เก็บลิงก์รูปสลิป (ของเดิม slip_image เป็น boolean เก็บลิงก์ไม่ได้ — คงไว้ไม่ต้องแตะ)
alter table orders add column if not exists slip_url text;

-- 2) ที่เก็บไฟล์สลิป
--    ⚠️ ตั้ง public=true เพื่อให้หน้าแอดมิน (ใช้ anon key) เปิดดูรูปได้
--    ความปลอดภัย = ชื่อไฟล์เดารหัสไม่ได้ (สุ่ม) ไม่ใช่การล็อกสิทธิ์
--    ถ้าต้องการเข้มกว่านี้ (สลิปมีเลขบัญชีลูกค้า) ค่อยเปลี่ยนเป็น private + signed URL ทีหลัง
insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', true)
on conflict (id) do nothing;

-- 3) สิทธิ์: ลูกค้า (anon) อัพได้ · เปิดดูได้ · แก้ไม่ได้ ลบไม่ได้
drop policy if exists "slips_insert_anon" on storage.objects;
create policy "slips_insert_anon" on storage.objects
  for insert to anon with check (bucket_id = 'payment-slips');

drop policy if exists "slips_select_anon" on storage.objects;
create policy "slips_select_anon" on storage.objects
  for select to anon using (bucket_id = 'payment-slips');

-- 4) กันเลขออเดอร์ซ้ำ (audit เจอ: ระบบนับใบเก่าแล้ว +1 → 2 คนกดพร้อมกันได้เลขเดียวกัน)
--    ตรวจแล้ว 3 ส.ค. 2026: ออเดอร์ 15,891 ใบ **ไม่มีเลขซ้ำเลย** → ใส่กฎนี้ได้ปลอดภัย
--    เมื่อมีกฎนี้ ถ้าชนกันจริง insert จะ error → โค้ด LIFF จะขยับเลขแล้วลองใหม่เองอัตโนมัติ
create unique index if not exists orders_order_number_uidx on orders(order_number);

-- ═══════════════════════════════════════════════════════════════════
-- หลังรันเสร็จ: LIFF จะอัพสลิปขึ้น Storage อัตโนมัติ
-- แอดมินเห็นปุ่ม "🧾 ดูสลิป" ในหน้า OH → ตรวจแล้วกดยืนยันเป็น "จ่ายแล้ว"
-- (ถ้ายังไม่รัน SQL นี้ ระบบยังทำงานได้ปกติ แค่ยังเก็บรูปไม่ได้)
-- ═══════════════════════════════════════════════════════════════════

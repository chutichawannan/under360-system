-- u0.4.35 — สร้าง bucket menu-images (Public) + policy ให้ anon อัพโหลด/แก้/อ่านได้
-- จำเป็นก่อนอัพรูปเมนูจากโบรชัวร์เข้า Storage (ปัจจุบัน anon เขียน Storage ไม่ได้ = RLS block)
-- รันในหน้า Supabase → SQL Editor → Run

-- 1) สร้าง bucket ถ้ายังไม่มี (public = อ่านรูปสาธารณะได้ผ่าน /object/public/)
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do update set public = true;

-- 2) policy บน storage.objects เฉพาะ bucket menu-images (กันไปยุ่ง bucket อื่น)
drop policy if exists "anon_menuimg_insert" on storage.objects;
drop policy if exists "anon_menuimg_update" on storage.objects;
drop policy if exists "anon_menuimg_select" on storage.objects;

create policy "anon_menuimg_insert" on storage.objects
  for insert to anon with check (bucket_id = 'menu-images');
create policy "anon_menuimg_update" on storage.objects
  for update to anon using (bucket_id = 'menu-images') with check (bucket_id = 'menu-images');
create policy "anon_menuimg_select" on storage.objects
  for select to anon using (bucket_id = 'menu-images');

-- v0.4.13 — แก้บั๊ก "สร้างแพคเกจไม่สำเร็จ" (โค้ดถูกต้อง แต่ตาราง packages/package_items
-- ไม่เคยมี RLS policy อนุญาต anon INSERT/UPDATE/DELETE เลยตั้งแต่สร้างตาราง v0.3.2 — ยืนยันแล้วผ่าน
-- curl ตรง: Supabase ตอบ error 42501 "new row violates row-level security policy")
-- ใช้ DROP...IF EXISTS ก่อนทุกอันเพื่อความปลอดภัย เผื่อบางอันมีอยู่แล้วบางส่วน รันซ้ำได้ไม่พัง

DROP POLICY IF EXISTS "anon_select_packages" ON packages;
DROP POLICY IF EXISTS "anon_insert_packages" ON packages;
DROP POLICY IF EXISTS "anon_update_packages" ON packages;
DROP POLICY IF EXISTS "anon_delete_packages" ON packages;
CREATE POLICY "anon_select_packages" ON packages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_packages" ON packages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_packages" ON packages FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_packages" ON packages FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "anon_select_package_items" ON package_items;
DROP POLICY IF EXISTS "anon_insert_package_items" ON package_items;
DROP POLICY IF EXISTS "anon_update_package_items" ON package_items;
DROP POLICY IF EXISTS "anon_delete_package_items" ON package_items;
CREATE POLICY "anon_select_package_items" ON package_items FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_package_items" ON package_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_package_items" ON package_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_package_items" ON package_items FOR DELETE TO anon USING (true);

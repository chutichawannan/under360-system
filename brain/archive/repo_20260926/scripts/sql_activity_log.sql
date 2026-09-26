-- v0.4.6 — ตาราง log กิจกรรม (ใครแก้อะไร) แบบ batch ต่อ session กันสแปม
-- session_id = สุ่มใหม่ทุกครั้งที่เปิดหน้า (1 รอบเปิดเว็บ = 1 session) การกระทำประเภทเดียวกันใน session
-- เดียวกันจะ UPDATE แถวเดิมแทนที่จะ insert ใหม่ทุกคลิก (เช่น กด +10 สต็อก 5 ครั้งติดกัน = 1 แถว รวมยอด)
CREATE TABLE activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  actor text NOT NULL,
  source text NOT NULL DEFAULT 'db',        -- 'db' = main_database_v2.html, 'he' = home_editor.html
  action_type text NOT NULL,                -- 'stock' | 'category' | 'package' | 'he_layout'
  summary text NOT NULL,
  detail jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_activity_log_updated_at ON activity_log(updated_at DESC);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_activity_log" ON activity_log FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_activity_log" ON activity_log FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_activity_log" ON activity_log FOR UPDATE TO anon USING (true) WITH CHECK (true);

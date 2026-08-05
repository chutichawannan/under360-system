-- ============================================================
--  k-track · 5 ส.ค. 2026 — ชั้นแปลภาษาให้บอทครัว + หน้าคอนโซลของนัท
--  รันหลัง scripts/sql_line_group_log.sql (ต้องมีตาราง line_group_messages ก่อน)
--
--  ทำไม: ครัว 6 คนเป็นไทใหญ่ · อ่านไทยได้ 2/6 · อ่านพม่าได้ ~4-5/6
--        → เก็บทั้งข้อความต้นฉบับ + คำแปลไทย ไว้ในแถวเดียวกัน
--        แปลครั้งเดียวตอนเก็บ (ไม่ใช่ตอนเปิดอ่าน) = ไม่ยิง API ซ้ำ
--
--  🔒 ความเป็นส่วนตัวคงเดิม: anon เขียนได้อย่างเดียว อ่านไม่ได้
--     หน้าคอนโซลอ่านผ่าน api/kitchen-console.js (service role + คีย์ฝั่ง server)
-- ============================================================

alter table line_group_messages add column if not exists src_lang   text;   -- 'th' | 'my' | 'shan' | 'other'
alter table line_group_messages add column if not exists text_th    text;   -- คำแปลไทย (ให้นัทอ่าน)
alter table line_group_messages add column if not exists text_my    text;   -- คำแปลพม่า (ให้ครัวอ่าน)
alter table line_group_messages add column if not exists from_owner boolean default false;  -- true = นัทพิมพ์จากหน้าคอนโซล

create index if not exists idx_lgm_line_ts on line_group_messages (line_ts desc);

-- ⚠️ ไม่มี policy select ให้ anon โดยตั้งใจ — แชทครัวต้องไม่หลุดผ่าน anon key ที่ฝังในหน้าเว็บ

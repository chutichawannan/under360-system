-- ═══════════════════════════════════════════════════════════════════
-- 🤖 บอทผู้ช่วยครัวในกลุ่ม LINE — ที่เก็บบทสนทนา (นัทสั่ง 5 ส.ค. 2026)
--
-- ทำอะไร: บอทอยู่ในกลุ่มครัว → **เก็บบทสนทนาทั้งหมด** + **ตอบเมื่อถูกถาม** (เช่น "ยอดพรุ่งนี้กี่กล่อง")
-- ทำไม: ทุกวันนี้ยอดสั่งวิ่งผ่านแชท คนพิมพ์ต่อกันเอง → ย้อนตรวจไม่ได้ (ดู docs/CASE_01_wrong_box_count.md)
--
-- 🔒 ความเป็นส่วนตัว (สำคัญ — อ่านก่อนรัน):
--    ตารางนี้เก็บ "บทสนทนาของพนักงาน" → ตั้งสิทธิ์ให้ **เขียนได้อย่างเดียว อ่านไม่ได้** ด้วย anon key
--    (anon key ฝังอยู่ในหน้าเว็บ = ใครก็หยิบไปใช้ได้ ถ้าเปิดให้อ่าน = แชทครัวหลุดสู่สาธารณะ)
--    การอ่าน = ผ่าน SQL Editor ของเจ้าของ หรือ endpoint ที่ล็อกด้วย CRON_SECRET เท่านั้น
--    ⚠️ ควร **แจ้งทีมครัวก่อนเชิญบอทเข้ากลุ่ม** (มารยาท + PDPA)
--
-- 📌 รันที่ Supabase → SQL Editor → วางทั้งไฟล์ → Run (รันซ้ำได้)
-- ═══════════════════════════════════════════════════════════════════

create table if not exists line_group_messages (
  id           bigserial primary key,
  message_id   text unique,          -- กันบันทึกซ้ำเวลา LINE ส่ง event ซ้ำ
  group_id     text,                 -- กลุ่มไหน (บอทอยู่ได้หลายกลุ่ม)
  user_id      text,                 -- ใครพิมพ์ (LINE userId)
  display_name text,                 -- ชื่อที่โชว์ (ดึงได้เท่าที่ LINE ให้)
  msg_type     text,                 -- text / image / sticker / file …
  text         text,                 -- เนื้อข้อความ (เก็บเฉพาะ type=text)
  is_bot_reply boolean default false,-- true = ข้อความที่บอทตอบเอง
  line_ts      timestamptz,          -- เวลาจาก LINE
  created_at   timestamptz default now()
);

create index if not exists lgm_group_time on line_group_messages(group_id, created_at desc);
create index if not exists lgm_user       on line_group_messages(user_id);

alter table line_group_messages enable row level security;

-- ✍️ เขียนได้ (webhook ใช้ anon key เขียน)
drop policy if exists lgm_insert_anon on line_group_messages;
create policy lgm_insert_anon on line_group_messages
  for insert to anon with check (true);

-- 🚫 ไม่เปิด select/update/delete ให้ anon โดยเจตนา
--    → แชทครัวอ่านได้เฉพาะเจ้าของระบบ (SQL Editor / service_role) เท่านั้น

-- ═══════════════════════════════════════════════════════════════════
-- หลังรันเสร็จ นัทต้องทำอีก 3 อย่าง (ดู TODO.md):
--   1) ใส่ LINE_CHANNEL_SECRET + LINE_CHANNEL_ACCESS_TOKEN ใน Vercel
--   2) เปิด "อนุญาตให้บอทเข้ากลุ่ม" ในคอนโซล LINE + ตั้ง Webhook URL
--      → https://under360-system.vercel.app/api/line-webhook
--   3) เชิญบอทเข้ากลุ่มครัว (บอทจะทักทายและบอก groupId ให้เอง)
-- ═══════════════════════════════════════════════════════════════════

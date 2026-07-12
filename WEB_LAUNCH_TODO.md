# ✅ Web Launch — สิ่งที่นัทต้องกดเอง (Claude ทำโค้ดครบแล้ว)
> สร้าง 12 ก.ค. 2026 หลัง Claude Code เคลียร์ handoff Step 1–4 · ทุกอย่างในนี้คือของที่ **ต้องใช้บัญชี/เครื่อง/ข้อมูลของนัท** — Claude ทำแทนไม่ได้ · ทำตามลำดับ

---

## 🟢 กลุ่ม 1 — รัน SQL ใน Supabase (ก่อนเว็บทำงานเต็มระบบ)
เปิด Supabase → SQL Editor → วางทีละไฟล์ → Run

- [ ] **`scripts/sql_blog_posts.sql`** — สร้างตาราง `blog_posts` (ต้องรันก่อน import บล็อค)
- [ ] **`scripts/sql_web_events.sql`** — สร้างตาราง `web_events` (attribution + Web Dashboard) · มี index + policy insert(anon)/select(anon) ให้แล้ว
- [ ] (ทีหลัง ตอนทำน้องนิว) `customer_preferences` — SQL อยู่ใน `CLAUDE.md` หัวข้อ "Supabase Tables"

> ⚠️ Claude รัน DDL (สร้างตาราง) เองไม่ได้ — anon key ไม่มีสิทธิ์ ต้องนัทรันในหน้า Supabase

---

## 🟢 กลุ่ม 2 — Import บล็อค 20 บทความ (หลังรัน sql_blog_posts.sql แล้ว)
- [ ] เปิด `web/import_blog.html` ในเบราว์เซอร์ → กดปุ่ม **"Import ทั้งหมด"** (upsert by slug รันซ้ำได้)
  - Claude ดูดจาก Wix มาให้ครบแล้ว **18 บทความ + ของเดิม 2 = รวม 20** (ผ่าน sitemap จริง 100%)
- [ ] **รีวิว 6 บทความที่ตั้ง `published=false` ไว้** (Claude เจอว่ามีพูดถึงราคา/โปร/เมนูเฉพาะ เลยกันไว้ให้นัทเช็คก่อน) — ถ้าโอเคเปลี่ยนเป็น published=true ที่ `web/blog_admin.html`:
  - `high-protein-meal-plan` · `protein-pack-guide` · `healthy-bajang` · `low-sodium-fish-sauce` · `clean-food-nutrient-gaps` · `clean-food-without-exercise`
- [ ] เช็คหน้า `web/blog.html` ว่าบทความขึ้นครบ + วันที่ถูก (คงวันที่เผยแพร่เดิมไว้แล้ว)

---

## 🟡 กลุ่ม 3 — Google Ads (Claude เตรียมพร้อม รอค่าจากนัท)
สร้างผ่าน **เว็บ desktop เท่านั้น** (แอปมือถือดันเข้า Smart Campaign) · Customer ID 318-768-6554

- [ ] **สร้าง Conversion Action** ชื่อ "คลิกสั่งใน LINE" (ประเภท Website → คลิกปุ่ม) → จะได้ **2 ค่า: `AW-XXXXXXXXXX` + `CONVERSION_LABEL`**
  → ส่ง 2 ค่านี้กลับมาให้ Claude แทนใน `web/index.html` + `web/mealplan.html` (จุด TODO ทำไว้แล้ว 3 จุด/ไฟล์)
- [ ] **เปิดแคมเปญ 1 — Brand Defense** (~50฿/วัน · keyword: under360/under 360/อันเดอร์360/360foodbox · Match Exact+Phrase) — **เปิดได้เลย ไม่ต้องรอเว็บ** (สเปคเต็มใน CLAUDE.md หัวข้อ Marketing)
- [ ] **แคมเปญ 2 — Meal Plan Search** (~300฿/วัน · 5 ad groups A–E) — เปิด**หลัง**เว็บ live + conversion tag ทำงาน · Phrase+Exact เท่านั้น · ใส่ negative keywords ตาม CLAUDE.md
- [ ] ⚠️ ก่อนเปิดแคมเปญ 2: เช็คราคา Meal Plan ในตาราง `mp_offer_sets` ให้ตรงกับ ad copy ("เริ่ม 1,399.-") — ดู Known Issue #12

---

## 🟡 กลุ่ม 4 — Vercel / Deploy
- [ ] เว็บใหม่ deploy อัตโนมัติแล้วที่ **`under360-system.vercel.app/web/`** (index/mealplan/blog) — เปิดเช็คได้เลย
- [ ] **ตั้ง env var `LINE_CHANNEL_ACCESS_TOKEN`** ใน Vercel (Settings → Environment Variables) — เพื่อให้ cron แจ้งเตือน Meal Plan ส่ง LINE จริง (ตอนนี้ cron ทำงานแต่ไม่ส่ง)
- [ ] **ยังไม่ชี้โดเมน 360foodbox.com มา Vercel** และ **ห้ามยกเลิก Wix** — ทำตอน migrate โดเมน (เช็คก่อนว่าโดเมนจดผ่าน Wix หรือที่อื่น)

---

## 🟡 กลุ่ม 5 — เทส + delegate
- [ ] **เทส iOS Safari** (ยังไม่เคยเทสเลยทั้งระบบ) — เปิด `web/index.html` + `web/mealplan.html` + LIFF บน iPhone จริง เช็ค layout/ปุ่มสั่ง
- [ ] **spot-check เวลาตัดยอด Meal Plan ใหม่** — ตอนนี้แก้เป็น "สั่งได้ถึง 8:30 น. ของวันส่ง" (จ/พ/ศ) แล้ว เมนูสต็อกคงเดิม 18:00 — ลองสั่ง Meal Plan เช้าๆ วันจันทร์ดูว่าวันนี้เลือกได้
- [ ] **IG feed** — delegate พลอย/แอดมิน สมัคร behold.so (ฟรี) เชื่อม IG @under360 → เอา feed URL มาใส่ `BEHOLD_URL` ใน `web/index.html` (ตอนนี้โชว์ grid สำรอง 6 รูป)
- [ ] **น้องนิว (ปลดล็อก):** ส่งชีทเมนู HP/LC (LC01-77 / HP01-77 + tag โปรตีน) มาให้ Claude import เข้า DB เป็น recipe หมวด meal_lc/meal_hp

---

## ⏳ ที่ยัง park ไว้ (Claude จดไว้แล้ว ไม่ลืม)
- **Localize รูป wixstatic → /web/img** — มี chip task แยกไว้แล้ว (ทำเมื่อไหร่ก็ได้ก่อนยกเลิก Wix · ตอนนี้ hotlink อยู่ ใช้งานได้ปกติ)
- **เว็บหน้า "เมนู" (ดึง menu_items)** — phase 2 หลังปุ่ม Export DB (ทำ Export แล้ว) — จด backlog
- **SEO server-render `api/post.js`** — optional ประเมินก่อนทำ (client-render ที่มีอยู่ใช้ได้)

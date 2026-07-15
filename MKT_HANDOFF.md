# MKT_HANDOFF — บันทึกงาน Marketing track (m-track)

> ไฟล์นี้ = สมุดบันทึกงานของ **แชท Marketing track** (แยกจากแชท Vibe/u-track)
> vibe เป็นเจ้าของ `CLAUDE.md` คนเดียว → งาน m-track จดที่นี่ก่อน แล้ว vibe merge เข้า CLAUDE.md ตอนนัทสั่งปิด session
> **13 ก.ค. 2026 เริ่มไฟล์** — 2 แชทรันขนาน แชร์โฟลเดอร์เดียวกัน (branch main)

## 🤝 ข้อตกลงแบ่งงาน 2 แชท (ยืนยันสองฝ่าย 13 ก.ค.)
| ฝั่ง | เจ้าของไฟล์ |
|---|---|
| **m-track (แชทนี้)** | `web/*`, `report.html`, blog (`web/import_blog.html`), `MKT_HANDOFF.md` |
| **u-track (vibe)** | `main_database_v2.html`, `liff_*.html`, `operation_hub.html`, `kitchen_queue.html`, `home_editor.html`, `CLAUDE.md` |
| **กฎร่วม** | add เฉพาะไฟล์ตัวเอง (ห้าม `git add -A`) · **pull ก่อน push ทุกครั้ง** · ชนไฟล์ = เตือนกันทันที · จะข้ามเลนต้องเคลมก่อน ไม่แตะเงียบ |

---

## 📋 สถานะรายการงาน m-track (จากลิสต์ 6 ข้อ 13 ก.ค.)
| # | งาน | สถานะ |
|---|-----|-------|
| 1 | รีวิว 6 บทความ draft | ✅ vibe ทำไปแล้ว (commit `f65f033` WS2 copy) — ไม่ต้องทำซ้ำ |
| 2 | localize รูป wixstatic → /web/img | 🔵 มี session แยกทำอยู่ (worktree `infallible-chatelet`) — ไม่ทำในแชทนี้ |
| 3 | `report.html` mock → Supabase จริง (วัด HP vs LC, เสา 3) | ⏳ พร้อมทำ |
| 4 | ad copy ชุด A–E (Google Ads) | ✅ ร่างเสร็จ (ดูด้านล่าง) — นัทเอาไปวางคอนโซลเอง |
| 5 | CTA เว็บ hatohub → LINE OA/LIFF | 🔴 **จอด — รอนัทเคาะ** (hatohub = ระบบ live ปัจจุบัน · ต้องมีลิงก์ OA จริง + ยืนยันระบบใหม่พร้อม) |
| 6 | blog ใหม่ ยิง keyword ที่ยังไม่มีบทความ | ⏳ พร้อมทำ — เป้าแรก "คอร์สอาหารคลีน" (keyword #1, 127 conv, ยังไม่มีบทความ) |

---

## ✅ ข้อ 4 — Ad copy ชุด A–E (ร่างเสร็จ 13 ก.ค. · self-check brand ผ่าน)
> ราคาจริง: ทดลอง 7 กล่อง LC 1,399 / HP 1,699 · Weekly 21 กล่อง LC 3,190 / HP 4,190 · Monthly LC 12,000 / HP 15,900 · ส่งฟรี
> กฎ: HP+LC คู่เสมอ · ไม่มี "เลือกเวลาส่ง" · ไม่ดิสแช่แข็ง · ไม่ใส่ under360 ในหัวทั่วไป
> (ชุดเต็มอยู่ใน transcript แชท marketing — ย้ายมาลงที่นี่ตอน finalize)

---

## 🌐 โดเมน + ย้ายออก Wix (เช็คแล้ว 13 ก.ค.)
- `360foodbox.com` = **Primary domain จดกับ Wix** (Purchased from Wix) · subscription โดเมนแยก renews **9 ธ.ค. 2026** · Premium plan (Core) renews พ.ย. 2027
- **วิธีย้ายที่ปลอดภัย = ชี้ DNS มา Vercel** (ไม่ต้องโอนโดเมนออก) — ทำตอนเว็บใหม่ครบ 100% + นัทหัวโล่ง
- 🔴 **blog มีทราฟฟิก Google จริง** (~898 post views/เดือน · ติดคำ "กลูเตนฟรีคือ", "ประโยชน์/โทษข้าวไรซ์เบอร์รี่") → **ต้องทำ 301 redirect URL เก่า→ใหม่ก่อนสลับ** ห้ามให้ SEO 10 ปีหล่น
- **นัทจะกด upgrade/ย้ายเว็บ "วันที่สะดวก"** (ยังไม่ทำคืนนี้ — ตัดสินใจถูกแล้ว)

## 📌 Backlog — harvest ฟีเจอร์/ข้อมูล Wix ก่อนปิด (นัทเห็นว่า dashboard Wix มีของช่วยขาย)
- สำรวจฟีเจอร์ Wix ที่อาจช่วยการขาย ก่อนทิ้ง (Analytics/Google Search queries, Inbox, Customers & Leads, Automations, Marketing)
- **ดึงข้อมูลออกก่อนปิด:** Google Search top queries (ทองคำ SEO), รายชื่อ customers/leads, ข้อความ Inbox (มี 50 ค้าง — เช็คว่ามีลูกค้ารอตอบไหม)
- แผน redirect map: ทุก URL บทความเก่า Wix → slug ใหม่ (มี `web/posts/_MANIFEST.md` เป็นฐาน)
- 🎨 **[เฟสเค้นรายละเอียดเว็บ — ทำทีหลัง ไม่ใช่ตอนนี้]** blog list: view toggle "รูปด้านข้าง" (list view) สลับกับการ์ดปกบน · นัทอยากได้แต่ยืนยันเองว่าเป็นเฟส polish หลังเร่งมาเก็ตติ้ง/ย้าย Wix เสร็จ
- 🤖 **[delegate → น้องเตียง]** จัดการรูปปก blog ในอนาคต: เลือก/ย่อ/อัปโหลด Storage/ลิงก์ cover_url ให้อัตโนมัติ (ตอนนี้ทำมือ + มีปุ่ม "วิธีอัปรูป" ใน blog_admin ให้แอดมินทำเองได้)
- 📚 **บทความเก่า Wix ~44 ตัวที่ยังไม่ย้าย** (จาก sitemap 65 − ย้ายแล้ว 21): หลายอันเป็น evergreen มีค่า SEO (glutenfree, ketogenicdiet, drinkingwater, durians ฯลฯ) บางอันเก่า/นอก positioning — **รีวิว+ย้ายเฉพาะตัวมีค่า** เป็นคอนเทนต์เพิ่ม (งานเลนคอนเทนต์ ทำได้เมื่อนัทพร้อม)

## 📌 Backlog เพิ่ม (15 ก.ค.)
- **[เฟสหลัง] รีวิว 21 บทความเก่าที่ flag ราคา/โปร** — ตอนนี้ publish ไปแล้วเพื่อเอา traffic (นัทตัดสินใจ) แต่เนื้อห��มีราคา/โปรเก่า/เมนูเลิกขาย → กลับมาแก้ให้ตรงปัจจุบัน (ดู review_note ในผล workflow / เนื้อหาบทความ)
- **[item 3] real-time click tracking + attribution** — มี `web_events` + `cta_click` (timestamp) แล้ว · ต้องทำเพิ่ม: (1) จอ real-time ดูคลิกสด (ต่อยอด `web_dashboard.html`) (2) ปิดลูป click→order ผ่าน LIFF อ่าน `localStorage.u360_utm` ตอนสร้าง order (u-track, หลัง CTA→LIFF) · cookies: ยังไม่ต้อง (ใช้ UTM+localStorage) — ต้องมี consent banner ก็ต่อเมื่อใส่ FB/Google pixel

## ⏰ ทวงนัท (pending)
- **[รอบหน้า] harvest keyword จาก Wix** — นัทจะแคป Top Queries (Home → Search Performance on Google) มาให้ Claude ทำแผน keyword/คอนเทนต์ (นัทบอก "ทำพรุ่งนี้ ทวงด้วย")

## ✅ workflow เสร็จ — ย้ายบทความเก่า Wix
- **migrate-wix-blog** ดึงสำเร็จ 40/41 บทความ (1 error) → เข้า `import_blog.html` แล้ว (commit `e424408`) · **รวม 61 บทความ** (เดิม 21 + ใหม่ 40) · ทั้ง 40 ใหม่ = `published:false` คงวันที่เดิม · 21 ตัว flag ราคา/โปรเก่า
- 🔴 **นัทต้องทำ:** เปิด `web/import_blog.html` → กด **Import** อีกครั้ง (บทความใหม่เข้า DB เป็น draft) → รีวิว+publish ใน`blog_admin.html`
- 🟡 **งานต่อก่อน cutover Wix:** localize รูป cover + รูปในเนื้อหาของ 40 บทความใหม่ (ยัง hotlink wixstatic อยู่) — ทำก่อนปิด Wix ไม่งั้นรูปหาย

## ✅ Real-time presence + Noti (15 ก.ค. — เสร็จ verified)
- **นับคนออนไลน์สด** (เว็บ + LIFF) + **noti เด้ง/เสียงเมื่อมี cta_click ใหม่** บน Web Dashboard
- ตาราง `live_presence` (นัทรัน SQL แล้ว) · เว็บ heartbeat (index/mealplan/blog, m-track) + LIFF heartbeat (u-track commit `9420c93`, ping เฉพาะตอน tab visible) upsert ทุก 15 วิ · dashboard นับ last_seen < 30 วิ
- verified สดผ่าน: web ping จริงเข้า + liff count เด้ง + หมดอายุ 30 วิทำงาน
- 🔵 option ค้าง: เพิ่ม `line_uid` ใน presence เพื่อดู "ลูกค้าคนไหน" กำลังดู (ไม่ใช่แค่จำนวน) — u-track เติมให้ได้ แต่มี PII/PDPA ต้องชั่งใจก่อน · noti เข้ามือถือ (LINE) รอ LINE token

## 📝 Log
- **13 ก.ค.** เริ่มไฟล์ + ตกลงแบ่งงาน 2 แชท + ร่าง ad copy A–E + flag ข้อ 5 (CTA) รอนัทเคาะ
- **13 ก.ค.** ✅ blog บทความคอร์สอาหารคลีน (push `a286058`) · ✅ localize รูป Wix 28 รูป → web/img (push `8ecc389`) · ✅ รัน sql_blog_posts + import 21 บทความเข้า DB (โชว์ 14 · draft 7) · ✅ เช็คโดเมน (จด Wix, ชี้ DNS ไม่ต้องโอน)

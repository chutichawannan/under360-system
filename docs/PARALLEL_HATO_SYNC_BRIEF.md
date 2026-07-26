# 🔄 P-Track — Parallel Ops: Hato → Under360 Back-end Sync (BRIEF)

> สร้าง 26 ก.ค. 2026 · เปิด track ใหม่ตามคำสั่งนัท ("จัดการเรื่อง parallel ระบบหน้าบ้าน")
> **owner = session ใหม่ (P-track)** · เวอร์ชันเริ่ม `p0.1-brief`
> อ่าน `CLAUDE.md` (master) ก่อนเสมอ · เกี่ยวโยง memory `migrate-customer-order-history` (reuse mapping)

---

## 🎯 Goal / Why
ช่วง **beta รับออเดอร์ 2 เลนขนาน** — เลน 1 = **Hato** (ลูกค้าจริงสั่งอยู่ตอนนี้) · เลน 2 = **ระบบใหม่** (LIFF/Supabase เพิ่ง publish)
→ ต้องการให้ **ออเดอร์ฝั่ง Hato ไหลเข้า back-end ใหม่ด้วย** เพื่อ:
1. back-end ใหม่มีข้อมูลออเดอร์ **ครบ** (ไม่ใช่แค่ที่สั่งผ่าน LIFF)
2. โบนัส: ถ้า replay ผ่าน flow ระบบเราเอง = **ทดสอบระบบใหม่ด้วยออเดอร์จริง**ไปในตัว
- ⏱️ **ไม่ต้อง realtime** — รอกด sync / poll เป็นช่วงเวลา (นัทย้ำ)

## 🧭 Vision (นัท 26 ก.ค.)
- ❌ **ไม่เอา** อัปโหลดไฟล์รายงาน (manual เกินไป — เคยเสนอ นัทปฏิเสธ)
- ✅ อยากได้ **agent (Claude on Chrome)** เปิด Hato เอง เป็นช่วงเวลา → กดเข้าหน้าออเดอร์ → อ่าน detail ทีละอัน → ดึงลง "ทดลองสั่งผ่านระบบเราเอง"
- "hook รายออเดอร์" = อยากได้ถ้ามี แต่ Hato ไม่น่าเปิด webhook ให้ (❓ **ยังไม่ verify** — ต้องเช็คหน้า setting/integration ของ Hato)

## ✅ VERIFIED แล้ว (session นี้ 26 ก.ค. — Claude เข้า Hato จริงผ่าน Chrome นัท)
- **เข้าถึง Hato backoffice ได้** (นัท login `chutichawannan@gmail.com` ค้างใน Chrome) · vendorID = `2GqEdvMXO5W` (ร้าน "Under 360")
- **หน้า list ออเดอร์:** `portal.hatohub.com/store/order` — มี filter สาขา/ประเภทวันที่/ช่วงวันที่ · แถวออเดอร์เป็นลิงก์ `HT-xxxx` → detail
- **หน้า detail:** `portal.hatohub.com/store/order/{internalID}?vendorID=2GqEdvMXO5W`
  - ⚠️ โหลด async — เปิดแล้วขึ้น "กำลังโหลด..." ก่อน → ต้อง `get_page_text` **ซ้ำอีก 1 ที** ถึงได้ข้อมูล
- **ฟิลด์ที่อ่านได้ครบ (get_page_text):** เลข `HT-xxxx` · เวลาออเดอร์ · สถานะออเดอร์ · ช่องทาง (Delivery) · ช้อนส้อม(รับ/ไม่รับ) · **สถานะ+ช่องทางชำระเงิน** (เช่น Omise พร้อมเพย์ + รหัสอ้างอิง chrg_xxx) · สมาชิก(ชื่อ/เลขสมาชิก/ระดับ/แต้ม/เบอร์) · **วันเวลาที่จัดส่ง** · ลูกค้า + LINE name · **ที่อยู่เต็ม + พิกัด lat/lng** · โน้ต/รายละเอียดที่อยู่ · **รายการสินค้า (ชื่อ + SKU + ราคา + จำนวน + รวม)** · ส่วนลด · ยอดรวม · ยอดต้องชำระ
- **ตัวอย่างจริง 2 ออเดอร์ (อ่านสำเร็จ):**
  | HT | ลูกค้า | ส่ง | จ่าย | สินค้า (SKU) |
  |---|---|---|---|---|
  | HT-1707968403 | แซม (Sam Cooper) 0826808686 · Siamese39 สุขุมวิท39 · 13.739,100.573 | 28/7 8-9 | ✅ Omise | `Diet Set A` ข้าวกล่องลองทาน 4วัน 12กล่อง ฿1,350 |
  | HT-1786241575 | นภัสสร (Ja) 0929551550 · สมุทรปราการ · 13.582,100.601 | 27/7 9-10 | ✅ Omise | `LC1` เซ็ตทดลอง Low Carb 7กล่อง ฿1,399 · `BJ3` บ๊ะจ่างไรซ์เบอร์รี่ ฿110 |

## 🔑 Key insights
1. **สินค้า Hato มี SKU code อยู่แล้ว** (`Diet Set A` / `LC1` / `BJ3`) — ผสมทั้ง **เซ็ต** และ **รายจาน** · บางตัวโค้ดคล้ายระบบเรา (BJ=บ๊ะจ่าง, LC=low carb) → **จับคู่บางส่วนอัตโนมัติได้**
2. **หน้า detail มีรายสินค้า/SKU** (ต่างจากไฟล์รายงาน 61 คอลัมน์ที่ **ไม่มี** line items) → **แก้ปัญหา order_items ได้** ด้วยการอ่าน detail (ไม่ต้องรอ "รายงานรายสินค้า" ของ migrate-track)
3. บางเซ็ตมีบรรทัด "• ระบุเมนูภายหลัง(เฉพาะสั่งข้ามอาทิตย์)" = เมนูจริง assign ทีหลัง (เหมือน Meal Plan เรา) → order_items บางออเดอร์เป็นระดับ **เซ็ต** ไม่ใช่รายจานเสมอ

## 🏗️ Design direction (ร่าง — รอนัทเคาะ)
- **ตาราง mapping `hato_sku → our_code`** (`menu_items.code` / `packages.id` / `mp_offer_sets.set_key`) — สร้างครั้งเดียว · auto-match เดาก่อน · ตัวที่ไม่ตรงนัทเคาะ (เหมือน fuzzy match ใน `batch_photo_upload.html`)
- **Idempotent by `HT-xxxx`** = order_number (กันซ้ำ) — **reuse mapping ของ migrate-track:** dedupe ลูกค้า = เบอร์(normalize)หลัก + line_uid สำรอง · **ไม่ทับ tier/loyalty เดิม** · `source='hato'`
- **Collector = agent Chrome:** เปิด list → หา HT ที่ยังไม่มีใน DB → เข้า detail → parse → upsert `orders`(+`order_items`)/`customers`
- Field map ตรง schema เรา: payment_status ✅ · want_utensils ✅ · delivery_date/time ✅ · delivery_lat/lng ✅ · addresses(jsonb) ✅

## ⚠️ Constraints / risks
- **ไม่ใช่ webhook เซิร์ฟเวอร์** → ต้องเปิดคอม + Chrome login Hato ค้าง ตอน agent รัน (poll ตั้งเวลาได้ แต่ **ไม่ 24/7 ลอยๆ**)
- Hato = antd → **อ่าน (get_page_text) โอเค** แต่คุม dropdown/filter/pagination อาจหลุด (migrate เตือน) — ต้องจัดการ list pagination + date filter ให้ครบทุกออเดอร์ใหม่
- เขียน `orders` ตารางร่วม → **ต้อง coordinate migrate-track (เจ้าของ mapping) + u-track** ก่อนเขียนจริง
- "ระบุเมนูภายหลัง" → order_items บางออเดอร์ยังไม่มีเมนูจริงตอน sync (ต้อง handle + อาจ re-sync ทีหลัง)

## ❓ Open questions — รอนัทเคาะ
1. **insert ตรงเข้า `orders`/`order_items`** (ง่าย ตรงกับ migrate) **vs replay ผ่าน order flow ระบบเราจริง** (ได้ทดสอบระบบ แต่ซับซ้อน + ต้อง match catalog ให้ "สั่งได้จริง")?
2. **cadence** — poll อัตโนมัติทุกกี่นาที? หรือปุ่ม **"Sync ตอนนี้"** แบบ manual พอ?
3. สถานะออเดอร์ไหนที่ sync — เฉพาะ "ออเดอร์ใหม่"? หรือทุกสถานะ?
4. order_items — ดึงเมนูจริงเลย หรือ header ก่อน (เมนูทีหลัง)?

## 👣 Next steps
1. ⬜ ดึง **แคตตาล็อกสินค้า Hato ทั้งหมด** (หน้า "สินค้า"/menu ใน backoffice) → ได้ลิสต์ SKU ครบ (เร็วกว่าไล่ทีละออเดอร์)
2. ⬜ สร้างตาราง mapping `hato_sku → our_code` (auto-match + นัทเคาะที่เหลือ)
3. ⬜ ทดสอบ collector: list → detail → parse 1 วัน (ครบทุกออเดอร์ใหม่)
4. ⬜ upsert เข้า Supabase (idempotent, reuse migrate scripts) + verify ไม่ซ้ำ/ไม่ทับ
5. ⬜ เคาะ cadence → ตั้งปุ่ม sync / schedule
6. ⬜ (option) เช็คว่า Hato มี webhook/integration ให้ตั้งไหม (ถ้ามี = ไม่ต้อง poll)

## 🔗 อ้างอิง
- memory `migrate-customer-order-history` — mapping 61 คอลัมน์ + idempotent scripts (reuse ได้เลย)
- schema `orders`/`order_items`/`customers` — CLAUDE.md หัวข้อ "Supabase Tables"
- pattern importer มี UI: `batch_photo_upload.html` (fuzzy match + review ก่อน commit)

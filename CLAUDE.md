# Under360 — CLAUDE.md
> อ่านไฟล์นี้ก่อนทำงานทุกครั้ง — Single source of truth

---

## 🏪 Project Overview

**Under360** — Healthy food delivery กรุงเทพฯ มา 10 ปี
- **นัท** = sole back-of-house (ครัว สูตร ต้นทุน inventory + ดูแล IT ทั้งหมดด้วย AI)
- **ไม่มี coding background** — Claude เขียนโค้ดทั้งหมด แล้ว push GitHub

```
GitHub:  github.com/chutichawannan/under360-system
Vercel:  under360-system.vercel.app (auto-deploy จาก GitHub ทันที)
```

**Working loop:** แก้โค้ด → `git commit` → `git push` → Vercel deploy อัตโนมัติ → test

---

## 🔑 Credentials (ใช้ตรงๆ ในโค้ด)

```
Supabase URL:   https://zdartbvhbvqlwzwyyiia.supabase.co
Supabase anon:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8
LIFF ID:        2010442513-NI3JGTkb
Google Maps:    AIzaSyDYjI7S2_KTrUXSYxUPNJOXMFPJyUsXH_U
ครัว LAT/LNG:  13.7179969, 100.5010971
PROMPTPAY:      0846556601 (ออมสิน 020272500180)
```

---

## 🛠️ Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | Vanilla HTML/CSS/JS — **single-file per page** (ห้ามแยก JS/CSS) |
| Backend | Supabase (DB + Storage) |
| Deploy | GitHub → Vercel (auto-deploy) |
| Customer | LINE LIFF (`2010442513-NI3JGTkb`) |
| Storage | `menu-images` (Public) · `card-images` (Public) |

---

## 📁 Files

| ไฟล์ | หน้าที่ | สถานะ |
|------|--------|-------|
| `liff_customer.html` | LIFF ลูกค้า: เมนู + checkout + Meal Plan self-service (เลื่อน/ยกเลิกรอบ) + ป้อบอัพเมนู/lightbox | ✅ live (v0.4.9) |
| `main_database_v2.html` | DB เมนู/วัตถุดิบ + packages + หมวดหมู่ (merge/กันซ้ำ) + สต็อกจริง + Activity Log | ✅ live (v0.4.7) — optimize ขนาดไฟล์แล้ว (330KB) |
| `home_editor.html` | จัด HomeGrid + routing Package/MP | ✅ live (v0.3.2) |
| `kitchen_queue.html` | หน้าครัว + Meal Plan queue แยก view + print | ✅ live |
| `operation_hub.html` | Admin hub (orders/menu/แพลนเมนู/promo/messenger/customer/HE + เปิด KQ/DB/report ผ่าน iframe) | ✅ live |
| `customer.html` | ข้อมูลลูกค้า standalone | ✅ live |
| `batch_photo_upload.html` | Batch upload รูปเมนูจากภาพโบรชัวร์ (AI vision จับตำแหน่ง+ชื่อ, fuzzy match, crop, upload) | 🟡 เขียนเสร็จ ต่อ Supabase/Storage จริงแล้ว — ยังไม่เคยรันจริงสักครั้ง ดูหมวด "Photo Migration" ด้านล่างก่อนรัน |
| `liff_register.html` | สมัครสมาชิก | ✅ ต่อ Supabase จริง (upsert customers) — ไม่ใช่ mock แล้ว |
| `liff_profile.html` | โปรไฟล์ลูกค้า | 🟡 ดึงจริงก่อน (customers+orders join) เหลือ mock แค่ fallback ตอน query พัง |
| `report.html` | รายงาน | deployed (mock data ทั้งหมด) |
| `landing.html` | FB/IG → LINE bridge | deployed |
| `api/webhook.js` | Meta Webhook scaffold | built, ยังไม่ configure |
| `api/notify-mp-requests.js` | Cron แจ้งเตือน Meal Plan (เปิด request window / auto no-change / เตือนก่อนส่ง 1 วัน) | ✅ live — รอตั้ง `LINE_CHANNEL_ACCESS_TOKEN` ถึงจะส่ง LINE จริง |

---

## 🥡 Product Lines

### Line 1 — เมนูสต็อค (SKU: No · S · D)
- ทำล่วงหน้า 1 วัน, สต็อกจริงคือ `menu_items.stock_total` (⚠️ ไม่ใช่ `stock_quantity` — คอลัมน์นั้นไม่มีอยู่จริง เคยพังทั้งเส้นทางเพราะเข้าใจผิด แก้แล้ว commit `9620cc1`)
- นิยาม: `NULL`=ไม่จำกัด (default) · `0`=หมดสต็อกจริง · `N>0`=เหลือ N (badge "เหลือ N ชิ้นสุดท้าย" เมื่อ ≤5)
- ส่งได้ทุก time slot รวมเช้า
- ขายทั้ง individual และ Package S/M/L
- **Pre-order:** เมนูอาทิตย์หน้าตั้ง `available_from` = วันจันทร์ถัดไป → โชว์ badge 📅 + block ผสมตะกร้า

### Line 2 — Meal Plan ทำสด (SKU: HP · LC)
- ทำสดวันนั้น ส่งบ่ายเท่านั้น — `no_morning = true` อัตโนมัติ
- **ไม่มี stock concept** — วางแผนจากวัตถุดิบ
- **✅ เป็น add-to-cart ปกติ** ลูกค้าเลือก HP/LC + set size → เข้าตะกร้าเลย
- Admin assign เมนูหลังบ้าน ผ่าน **OH แพลนเมนู** (ตัวจริง ต่อ `mp_deliveries` แล้ว) — น้องนิว (v0.4) จะมาช่วย auto-suggest ทีหลัง
- ⚠️ เมนู HP/LC **ไม่ต้องขึ้นหน้าลูกค้าเลือกเอง** — มีไว้ให้แอดมิน assign หลังบ้านเท่านั้น (ยืนยันแล้วว่าตั้งใจ ไม่ใช่บั๊ก)

### Package S/M/L
- HomeGrid card → `openPackage(pkgId)` → เลือก 9 เมนู → เข้าตะกร้า
- Premium items: extra_price กำหนดต่อ SKU ใน `package_items` table
- Admin จัดการ Package ผ่าน tab แพคเกจใน `main_database_v2.html`

---

## 🗄️ Supabase Tables

### มีแล้ว
`orders` · `order_items` · `menu_items` · `customers` · `home_layout` · `kitchen_data`
`daily_menu_assignments` (ใช้จริงแต่คนละเรื่องกับ Meal Plan รายลูกค้า — เป็นกริดวางแผนผลิตรวมของครัว ดู main_database_v2.html tab "📅 แผนผลิต") · `bot_sessions` · `promo_codes` · `packages` · `package_items` · `mp_deliveries` (Meal Plan ระยะยาวรายลูกค้า — คนละตารางกับข้างต้น)

### ⚠️ ยังไม่ได้สร้าง/เพิ่ม — รอนัทรัน SQL (โค้ดทุกจุด catch error รองรับไว้แล้ว ไม่รันก็ไม่พัง แค่ feature ยังไม่ทำงาน)
| ไฟล์ SQL | ทำอะไร | ผลถ้ายังไม่รัน |
|---------|--------|---------------|
| `scripts/sql_activity_log.sql` | สร้างตาราง `activity_log` (ดูหัวข้อ "📜 Activity Log") | แถบ log โชว์ "ยังไม่มีประวัติ" เฉยๆ |
| `scripts/sql_utensils.sql` | เพิ่มคอลัมน์ `orders.want_utensils` (ช่องช้อนส้อมที่เช็คเอาท์) | LIFF เช็ค capability เองแล้วข้ามฟิลด์นี้ไปเงียบๆ — สั่งซื้อปกติทุกอย่าง แค่ยังไม่เก็บค่าช้อนส้อม |
| `scripts/sql_mp_offer_sets.sql` | สร้างตาราง `mp_offer_sets` + seed ราคาเดิม 3 ชุด (ทดลอง/สัปดาห์/เดือน) | LIFF/HE/DB fallback ไปใช้ราคา hardcode เดิมอัตโนมัติ — ใช้งานได้ปกติ แค่แก้ราคาเองที่หน้า DB ไม่ได้จนกว่าจะรัน |

### SQL ที่รันแล้ว ✅
```sql
-- v0.3.1
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS no_morning BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_account TEXT;
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT TO anon USING (true);

-- v0.3.2
CREATE TABLE packages ( id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text, size text, qty integer, base_price integer, description text,
  is_active boolean DEFAULT true, display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now() );
CREATE TABLE package_items ( id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid REFERENCES packages(id) ON DELETE CASCADE,
  sku text NOT NULL, extra_price integer DEFAULT 0,
  created_at timestamptz DEFAULT now(), UNIQUE(package_id, sku) );
-- ⚠️ order_type ไม่ได้ลงจริง (insert เคยพังเพราะคอลัมน์ไม่มี) — เลิกใช้แล้ว
-- order_type เดาจาก order_items.notes: pkg: / meal_plan: / ว่าง=individual

-- v0.3.3 pre-order
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_from DATE;
ALTER TABLE orders     ADD COLUMN IF NOT EXISTS delivery_week TEXT DEFAULT 'current';

-- v0.4.0 Meal Plan scheduling (scripts/sql_mp_deliveries.sql)
CREATE TABLE mp_deliveries ( id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id), customer_id uuid, line_uid text,
  customer_name text, line_display_name text, mp_type text, mp_set text,
  round_no int, total_rounds int, delivery_date date, time_slot text, time_slot_label text,
  delivery_address text, box_count int DEFAULT 7, status text DEFAULT 'scheduled',
  menu_items jsonb, customer_request jsonb, customer_note text,
  request_opens_at date, request_deadline date, notified_at timestamptz,
  day_before_notified_at timestamptz, admin_notes text,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now() );
-- + RLS policy อนุญาต anon (ดูรายละเอียดเต็มใน scripts/sql_mp_deliveries.sql)

-- v0.4.1 line_display_name (scripts/sql_line_display_name.sql)
ALTER TABLE orders        ADD COLUMN IF NOT EXISTS line_display_name TEXT;
ALTER TABLE mp_deliveries ADD COLUMN IF NOT EXISTS line_display_name TEXT;

-- v0.4.3 stock fix (scripts/sql_stock_fix.sql)
UPDATE menu_items SET stock_total = NULL WHERE stock_total = 0;
ALTER TABLE menu_items ALTER COLUMN stock_total DROP DEFAULT;
-- นิยามใหม่: NULL = ไม่จำกัด (default) / 0 = หมดสต็อกจริง / N>0 = เหลือ N ชิ้น
```

### ✅ SQL รันครบแล้ว — ไม่มีค้าง (ยกเว้น `day_before_notified_at` ALTER ท้าย sql_mp_deliveries.sql ถ้ายังไม่ได้รัน — เช็คซ้ำได้)

### Storage
- `menu-images` (Public) ✅
- `card-images` (Public) ✅

---

## 🏠 HomeGrid Architecture (สำคัญมาก)

**HomeGrid card = entry point เดียวสำหรับทุก product type**
Admin จัดการผ่าน `home_editor.html` — ไม่มี hardcode bands

**Card click routing** ใน `colCardClick(el)` อ่าน `data-cat` (= `item_filter.category`):
```
__pkg:{uuid}__   → openPackage(uuid)     — Package picker
__meal_plan__    → openMealPlanPicker()  — Meal Plan picker
__anchor__       → scroll to menu list
{category}       → jumpCat(category)     — scroll to category
```

**HE dropdown "ลิ้งไปที่"** มีตัวเลือก:
- ไม่ลิ้งไปไหน
- ⬇ เลื่อนลงไปที่เมนู (`__anchor__`)
- 🥗 Meal Plan (`__meal_plan__`)
- 📦 Package S/M/L (โหลดจาก Supabase `packages` table)
- หมวดหมู่เมนู (จาก menu_items)

---

## ⚙️ Coding Conventions — ห้ามผิด

```
LIFF files      → const sb = supabase.createClient(URL, KEY) ตรงๆ ห้ามใช้ getSB()
main_database   → ใช้ getSB() pattern (const sb = getSB())
DEV_MODE        → false บน production เสมอ
Order number    → U-MMDD-NNN (e.g. U-0627-001)
Supabase query  → ต้อง .limit(N) ถ้าต้องการ > 1000 rows
render(true)    → force bypass keyboard defer
Phone format    → fmtPhone() → เพิ่ม 0 นำหน้าถ้า 9 หลัก
</style> tag    → grep duplicate ก่อน commit เสมอ
Parallel read   → ห้าม Promise.all() ใน Claude artifact storage → sequential เท่านั้น
Mobile scroll   → ใช้ inline spacer div ไม่ใช่ padding-left
Single file     → HTML/CSS/JS ในไฟล์เดียว ไม่แยก
Syntax check    → node scripts/check-html-js.js <file.html> หลัง edit ทุกครั้ง
                  (ไฟล์เป็น HTML ก้อนเดียว → ดึง <script> มาเช็ค ไม่ใช่ node --check ตรงๆ)
```

> 🛠️ **Dev env:** ลง Node.js v24 LTS แล้ว (winget) — รัน syntax check / สคริปต์ได้
> ถ้า `node` ไม่เข้า PATH ใน terminal ให้รีสตาร์ท Claude Code ครั้งเดียว
> Allowlist: `.claude/settings.json` อนุญาต curl อ่าน Supabase REST แล้ว (ไม่ถามซ้ำ)

> ⚠️ **บั๊กแพทเทิร์นที่เจอซ้ำๆ (4 ครั้งในวันเดียว 2026-07-04) — ระวังไว้เวลาแก้ฟีเจอร์ที่มีจุดแสดงผลซ้ำกันหลายที่:**
> ไฟล์พวกนี้มักมีโค้ด render เมนู/สต็อกซ้ำกันคนละจุด (เช่น รายการเมนูหลัก vs การ์ดพรีวิวหน้าแรก, ปุ่ม stock ที่การ์ด vs ที่ตาราง pin) — แก้จุดเดียวแล้วคิดว่าจบ มักพลาดอีกจุดที่เหมือนกันทุกประการ (stock sync ผูกกับ dead code, ปุ่ม migrate ไม่มี HTML, badge/limit หายในหน้าแรก, `openProduct()` อ้าง element ที่ไม่เคยสร้างเลย) **ก่อนบอกว่า "แก้แล้ว" ต้อง `grep` หาทุกจุดที่มี pattern เดียวกันในไฟล์ก่อนเสมอ** อย่าเชื่อว่าแก้จุดเดียวพอ

---

## 🚦 Current Version: v0.4.11 (✅ push แล้ว — live บน Vercel, commit ล่าสุด `fb42370` — ⚠️ มี 3 SQL รอรัน: Activity Log, ช้อนส้อม, ชุด Meal Plan — ดูรายละเอียดด้านล่าง)

> v0.3.3 คือเวอร์ชันสุดท้ายที่เคย log ไว้เป็นทางการ — หลังจากนั้นมีงานใหญ่หลายอย่างเข้ามาต่อเนื่องโดยไม่ได้ bump เลขไว้ (ระบบ Meal Plan scheduling ทั้งชุด, คูปอง, แก้สต็อก ฯลฯ) ตารางล่างคือสรุปรวมให้ตามทัน:

### ✅ สรุปงานที่ทำไปแล้วตั้งแต่ v0.3.3
| Version | งาน | Commit |
|---------|-----|--------|
| v0.3.4* | คูปอง/ส่วนลด (`promo_codes`) ที่หน้า checkout | (รวมอยู่ในช่วง cart fix) |
| v0.4.0 | ระบบ Meal Plan ระยะยาว (`mp_deliveries`) — LIFF self-service (เลื่อน/ยกเลิกรอบ) + OH แพลนเมนู (คอลัมน์ตามวันที่) + KQ แยก view + LINE cron แจ้งเตือน | `a0f542c` |
| v0.4.1 | ชื่อ+เบอร์ผู้รับ (recipient) แยกจากชื่อบัญชีไลน์ (`line_display_name`) | — |
| v0.4.2 | หน้าแรก: การ์ด collage เลื่อนอิสระ (เอา scroll-snap ออก) | `7b017a7` |
| v0.4.3 | แก้ระบบสต็อกที่พังทั้งเส้นทาง (`stock_quantity`→`stock_total` จริง, LIFF/KQ/DB ครบ) | `9620cc1` |
| v0.4.4 | DB: แถบหมวดลากเลื่อนได้ + แก้นับหมวดผิด/panel ค้างข้ามแท็บ + รวมหมวดซ้ำ + กันตั้งชื่อหมวดซ้ำในอนาคต | `f599c12` `ac25456` `edf2eb1` |
| v0.4.5 | Version audit ทั้งระบบ + แก้ลำดับเมนู liff ให้ตรง HE + ลากเลื่อนการ์ดหน้าแรกด้วยเมาส์ + **แก้สต็อกหลักไม่เคย sync จริง** (bug ซ้อนจาก v0.4.3) + ปุ่ม +10 เติมสต็อก + DB "🍳 ผลิตวันนี้" (เปลี่ยนจาก mock เป็นของจริง) | `80f1d57` `768e88f` `12299a4` |
| v0.4.6 | Activity Log — แถบประวัติการเปลี่ยนแปลง+เติมสต็อก (batch ต่อ session+ประเภท, debounce 3 วิ กันสแปม) ที่หัว DB + log จาก HE ด้วย ⚠️ รอรัน `scripts/sql_activity_log.sql` | `520aa68` |
| v0.4.7 | Optimize `main_database_v2.html`: ลบข้อมูล seed ที่ import ครั้งเดียวไปแล้วทิ้งทั้งหมด (`INGREDIENT_SEED`/`NO_CODE_RECIPES`/`NUTRITION_SEED`/`SKU_SEED`/`REFERENCE_PRICES` + ฟังก์ชัน migrate ที่ปุ่มหายไปแล้ว) — ไฟล์ลดจาก 778KB → 330KB (**-58%**) ไม่กระทบฟีเจอร์ที่ใช้จริงเลย (ทดสอบผ่าน preview ครบแล้ว) | `93e20ca` |
| v0.4.8 | **แก้บั๊กร้ายแรง:** คลิกเมนูใดๆ ในหน้า liff พังจริง (throw error เงียบๆ — `openProduct()` อ้าง HTML ที่ไม่เคยมีอยู่จริง) + เพิ่มคลิกชื่อเมนู→ป้อบอัพ (ชื่อ/แคลอรี่/คำอธิบาย) และคลิกรูป→lightbox (ของเดิมเขียน JS/CSS ไว้ครบแต่ไม่เคยต่อ onclick) + แก้รูปเมนูไม่เคยโชว์ (`item.image_url`→`item.image_urls[0]`, 6 จุด) + แก้ badge/limit สต็อกหายในการ์ดพรีวิวหน้าแรก (โค้ดคนละชุดกับรายการเมนูหลัก) | `5020fc9` |
| v0.4.9 | แก้ตามที่นัทเทสจริง: "หมดแล้ว" ต้องขึ้นทันทีที่ลูกค้าใส่ตะกร้าครบสต็อก (ไม่ใช่แค่ตอน stock_total=0 — เปลี่ยน `isOut` ให้เช็คจาก remaining แทน) + lightbox ขึ้นกรอบเปล่าแทนที่จะไม่ทำอะไรเมื่อเมนูยังไม่มีรูป (คลิกไอคอน 🍱 ได้แล้วด้วย ไม่ใช่แค่คลิก `<img>` จริง) | `d79272d` |
| v0.4.10 | จากผลเทสแอดมิน (คอมเมนต์ 7 ข้อ): แก้ sort_order เมนูทุกหมวดที่ไม่เคยตั้งเลย (80 รายการ ผ่าน REST ตรง) + เจอ**แท็บโปรโมชั่นไม่มีปุ่มนำทางใน OH เลย** (โค้ดมีครบ กดเข้าไม่ได้มาตลอด) + เปิดใช้หน้า "ตั้งค่า" (เดิม disabled) มี 2 setting แรก (จำนวนเมนู/หน้าที่ DB, ขนาดช่องช้อนส้อมที่ KQ) + เพิ่มหมวดหมู่ในหน้าตะกร้า/ยืนยัน/ประวัติ + **แก้บั๊กแต้มลูกค้าโชว์ผิด** (`liff_profile.html` อ้างคอลัมน์ `points` ที่ไม่มีจริง โชว์ 0 แต้มมาตลอดไม่ว่าจะมีจริงเท่าไหร่) + เพิ่มช่องช้อนส้อมที่เช็คเอาท์ + โชว์เด่นๆ ที่บัตรครัว | `8b21320` `de73b82` `dfd7594` |
| v0.4.11 | ระบบ "ชุด Meal Plan" — ย้าย MP_SETS จาก hardcode ในโค้ดไปเป็นตาราง `mp_offer_sets` แก้ราคาเองได้ที่หน้า DB + สร้าง "Set 2" ชุดโปรโมชั่นแยกลิ้งจากการ์ดหน้าแรกเองได้ (ไม่ต้องรอ Claude) | `fb42370` |

*หมายเหตุ: เลข version ช่วง v0.3.4–v0.4.4 เป็นการ backfill ประมาณช่วงเวลาจาก commit log ไม่ใช่เลขที่ตั้งใจ bump ไว้ตอนนั้นทุกจุด — นับจากนี้จะ log ให้ตรงเวลาจริงมากขึ้น

### ⚠️ Known Issues (อัพเดทล่าสุด — เช็คจาก code จริงรอบนี้)
| # | ปัญหา | Priority |
|---|-------|----------|
| 1 | ✅ **แก้แล้ว** — `main_database_v2.html` แท็บ Meal Plan sub-view "👥 กำหนดเมนูลูกค้า" (mock 8 คน) เปลี่ยนเป็น **"🍳 ผลิตวันนี้"** จริงแล้ว ต่อ `mp_deliveries` ตรง ดู [What's in main_database_v2.html](#) หัวข้อ "🍳 ผลิตวันนี้" | ✅ Done |
| 2 | `report.html` ยัง mock data ทั้งหมด (`genMockData` fallback) | 🟡 Med |
| 3 | `liff_profile.html` ดึงข้อมูลจริงก่อนแล้ว (customers+orders join) เหลือ mock แค่ fallback ตอน query พัง — ดีขึ้นกว่าที่เคยบันทึกไว้ | 🟢 ใกล้เสร็จ |
| 4 | `liff_register.html` ต่อ Supabase จริงแล้ว (upsert customers) — **ไม่ใช่ mock แล้ว** แก้ไขจากที่เคยบันทึกผิดไว้ | ✅ ไม่ใช่ปัญหาแล้ว |
| 5 | `LINE_CHANNEL_ACCESS_TOKEN` ยังไม่ตั้งใน Vercel env — cron ทำงานปกติแต่ไม่ส่ง LINE จริง | 🔴 ก่อน launch |
| 6 | KQ ต้องตรวจสอบว่าดึง order จริงจาก Supabase ได้ไหม (ทดสอบบน production) | 🔴 ก่อน launch |
| 7 | **พบใหม่ 2026-07-04:** หน้า DB สต็อกหลักที่การ์ดเมนู (`.stock-ctrl`) ไม่เคย sync ขึ้น `menu_items.stock_total` จริงมาตลอด (โค้ด sync เดิมผูกกับ `renderPttCard`/`chgStockFast` ที่เป็น dead code ไม่เคยถูกเรียก) — **แก้แล้ว** เพิ่ม `syncStockDebounced()` เข้า `commitStock()` จริง + เพิ่มปุ่ม "+10" | ✅ Done |
| 8 | **พบใหม่ 2026-07-04 (ยังไม่แก้ ไม่กระทบการใช้งานตอนนี้):** `mpIsoDate()` ในแท็บ "แผนผลิต" ของ Meal Plan ใช้ `.toISOString().split('T')[0]` — เป็น pattern เดียวกับบั๊ก timezone ที่เคยแก้ไปแล้วในไฟล์อื่น (UTC+7 จะเพี้ยนไป 1 วันได้) แต่ยังไม่มีรายงานปัญหาจริง จึงยังไม่แตะ — ถ้าจะแก้ทีหลังใช้ pattern `localYMD()`/`toISO()` แบบเดียวกับที่แก้ไปแล้ว | 🟡 ระวังไว้ |
| 9 | ✅ **แก้แล้ว** — `liff_customer.html`: คลิกเมนูในหน้า liff **พังจริงตอนนี้มาตลอด** (`openProduct()` อ้าง element ที่ไม่เคยมี HTML รองรับเลย → throw error เงียบๆ ไม่ทำอะไร) ลบทิ้ง เปลี่ยนเป็นคลิกชื่อเมนู→ป้อบอัพ + คลิกรูป→lightbox (ของเดิมมี JS/CSS ครบแต่ไม่เคยต่อ onclick) + แก้รูปเมนูไม่เคยโชว์เลย (`item.image_url`→`item.image_urls[0]`) + แก้ badge/limit สต็อกหายในการ์ดพรีวิวหน้าแรก | ✅ Done |

---

## 📋 What's in liff_customer.html (v0.4.9)

### Screens
`s-menu` · `s-pkg-select` · `s-meal-plan` · `s-cart` · `s-confirm` · `s-ok` · `s-orders` · Meal Plan self-service (จัดการรอบ/เลื่อนวัน/ยกเลิก)

> ⚠️ `s-product` (หน้ารายละเอียดสินค้าแบบเต็มจอ) **ถูกลบทิ้งแล้ว** (commit `5020fc9`) — พังมาตลอดเพราะไม่เคยมี HTML รองรับ ตอนนี้แทนที่ด้วยป้อบอัพ (ดูด้านล่าง)

### Key features
- **Package flow:** HomeGrid card → `openPackage()` → เลือกเมนู → ตะกร้า
- **Meal Plan flow:** HomeGrid card → `openMealPlanPicker()` → เลือก HP/LC + set → ตะกร้า
- **Pre-order:** `isNextWeekItem()` ตรวจ `available_from` → badge 📅 + block mixed cart
- **Cart week-block:** `cartWeekType()` → อาทิตย์นี้ + อาทิตย์หน้า ผสมกันไม่ได้
- **Saved address:** restore จาก `customers.default_address` อัตโนมัติ
- **Order history:** `s-orders` screen + `goOrders()`
- **Profile:** redirect ไป `liff_profile.html` พร้อม uid
- **คลิกชื่อเมนู → ป้อบอัพรายละเอียด** (`openMenuDetail()`, element `#mdOverlay`) — ชื่อ/โค้ด/แคลอรี่/โปรตีน/คำอธิบาย/ราคา + ปุ่มเพิ่มตะกร้า (เคารพ stock limit ผ่าน `addItem()` เดิม)
- **คลิกรูปเมนู → lightbox ขยายเต็มจอ** (`openItemLightbox(id)` → `openLightbox(urls)`, element `#lbOverlay`) — รองรับหลายรูป เลื่อนดูได้ + จุดบอกตำแหน่ง
- **สต็อก:** ใช้ `effectiveStock()`/`menu_items.stock_total` เหมือนกันทั้งรายการเมนูหลัก (`renderMenu()`) และการ์ดพรีวิวหน้าแรก (`renderHomeGrid()`'s Item Grid Sections) — `NULL`=ไม่จำกัด (ต้องตั้งค่าจริงที่หน้า DB ถึงจะเห็น limit/badge "เหลือ N ชิ้นสุดท้าย") — `isOut` (v0.4.9) เช็คจาก **remaining** (stock−qty ในตะกร้า) ไม่ใช่แค่ `stock_total<=0` ตรงๆ ดังนั้นถ้าสต็อกมี 10 แล้วลูกค้าใส่ตะกร้าครบ 10 การ์ดจะขึ้น "หมดแล้ว" ทันทีแม้ `stock_total` ยังเป็น 10 อยู่ (ไม่ใช่ real-time reserve ข้ามลูกค้า แค่ per-session)

### Meal Plan Config (⚠️ แก้ราคาก่อน launch — ยังไม่ยืนยัน)
```javascript
const MP_SETS = [
  { id:'trial',   label:'ทดลอง',      boxes:7,  price_hp:1499,  price_lc:1399  },
  { id:'weekly',  label:'1 สัปดาห์',  boxes:21, price_hp:3990,  price_lc:3790  },
  { id:'monthly', label:'1 เดือน',    boxes:84, price_hp:13990, price_lc:13490 },
];
// comment ในโค้ดเปลี่ยนจาก "ราคาเป็น mock" เป็น "แก้ราคาที่นี่ก่อน launch" แล้ว
// แต่ตัวราคายังไม่เปลี่ยน — นัทยังต้องยืนยันก่อน launch จริงอยู่ดี
```

### Order types
- `individual` — เมนูปกติ
- `package` — Package S/M/L (order_items แยก row ต่อเมนู + notes: 'pkg:{id}')
- `meal_plan` — Meal Plan (1 order_items row + notes: 'meal_plan:hp:weekly')

### Delivery week
- `current` — ส่งอาทิตย์นี้ (default)
- `next` — pre-order ส่งอาทิตย์หน้า (items มี `available_from` > today)

---

## 📋 What's in main_database_v2.html (v0.4.7)

### ⚡ Optimize ขนาดไฟล์ (v0.4.7) — ลบ seed data ที่ import ครั้งเดียวไปแล้วทิ้ง
ไฟล์เคย 778KB (~55% เป็น hardcoded seed array ที่ import ครั้งเดียวตอน deploy ครั้งแรกแล้วไม่มีวันรันซ้ำ — auto-gate ด้วย `initFlags` ถาวร หรือปุ่ม migrate ที่ไม่มี HTML element เหลืออยู่แล้ว = dead code) — **ลบแล้ว ไฟล์เหลือ 330KB (-58%)** ไม่กระทบฟีเจอร์ที่ใช้จริงเลย (ทดสอบผ่าน preview ครบ: recipes/ingredients/categories load ปกติ, stock +10, category manager ใช้ได้หมด)

**ถ้าเจอสูตรที่ยังไม่ได้ import เข้าระบบในอนาคต** (นัทถามไว้แล้ว ยืนยันวิธีนี้): ส่งไฟล์ Excel ให้ Claude วิเคราะห์แล้วใส่เข้า Supabase ตรงๆ ได้เลย — **ไม่ต้อง**กลับไปฝัง hardcoded array ในโค้ดแบบเดิมอีก (เป็นต้นเหตุที่ทำให้ไฟล์บวมมาตลอด)

### Tabs
เมนู · วัตถุดิบ · Meal Plan · 📦 แพคเกจ

### Tab แพคเกจ
- สร้าง/แก้ Package S/M/L ได้เอง
- Checkbox เมนู active ทั้งหมด + กำหนด extra_price ต่อ SKU
- Quick buttons +0 / +40 + custom price input
- Save = delete + insert ใหม่ใน `package_items`

### Tab Meal Plan — 2 sub-view คนละเรื่องกัน (ทั้งคู่ต่อข้อมูลจริงแล้ว)
- **"📅 แผนผลิต"** — กริดวางแผนผลิตหลายวันของครัวโดยรวม (ไม่ผูกกับลูกค้ารายคน) ต่อ `daily_menu_assignments` จริง — คนละเรื่องกับ Meal Plan ระยะยาวรายลูกค้า (`mp_deliveries`) แม้ชื่อตารางจะดูคล้ายกัน
- **"🍳 ผลิตวันนี้"** (เดิมชื่อ "👥 กำหนดเมนูลูกค้า", commit `12299a4` — เปลี่ยนจาก mock เป็นของจริงแล้ว) — ให้ครัวดูว่าวันนี้ต้องผลิต/แพ็คอะไรบ้างสำหรับ Meal Plan ระยะยาว โดยไม่ต้องสลับไปหน้า KQ:
  - นำทางวันที่ (‹ › + date picker + ปุ่มวันนี้ + รีเฟรช) — โหลดจาก `mp_deliveries` ตรง (`.eq('delivery_date',...)`, ไม่รวม skipped/cancelled)
  - Section 1 สรุป: รอบทั้งหมด / นับ HP / นับ LC / นับลูกค้าที่รีเควสเมนูเอง (`customer_request` ไม่ว่าง) / นับรอบที่ยังกำหนดเมนูไม่ครบ
  - Section 2 "🍳 ต้องผลิต": aggregate `menu_items` ทุกรอบของวันนั้น กลุ่มตาม code (เหมือนหน้าจัดของ KQ แต่ไม่ต้องสลับหน้า) แต่ละเมนูโชว่ลูกค้า/รอบที่ต้องการ + ช่องโน้ตแก้เมนูฉุกเฉินต่อคน (ผูกกับ `menu_items[].note` ตัวเดียวกับที่ OH ใช้ — พิมพ์ที่นี่ก็เห็นที่ OH ด้วย ไม่ใช่ข้อมูลแยกชุด)
  - Debounce 600ms ต่อโน้ต, ทดสอบผ่าน preview + REST แล้วว่าเซฟถูกแถว/ถูก entry ไม่กระทบเมนูอื่น

### จัดการหมวดหมู่ (ใหม่ — commit `edf2eb1`)
- ปุ่ม **🔗 รวม** ต่อแถวหมวด — ย้ายเมนูทั้งหมดจากหมวดหนึ่งไปอีกหมวด แล้วลบหมวดต้นทางทิ้ง (`mergeCategoryInto`)
- Rename หมวดชื่อซ้ำกับหมวดอื่น → บล็อกด้วย alert ทันที (กันปัญหาซ้ำแบบ "ข้าวกล่อง" ที่เคยเกิด)
- แถบหมวด (`.cat-tab-strip`) ลากเลื่อนซ้ายขวาด้วยเมาส์ได้แล้ว (commit `f599c12`)

---

## 📋 What's in home_editor.html (v0.3.2)

- dropdown "ลิ้งไปที่" มี 🥗 Meal Plan + 📦 Package options
- โหลด packages จาก Supabase (`loadHEPackages()`) ก่อน render dropdown
- เลือก Package → บันทึก `item_filter.category = '__pkg:{uuid}__'`
- เลือก Meal Plan → บันทึก `item_filter.category = '__meal_plan__'`

---

## 🗺️ Roadmap

| Version | งาน | สถานะ |
|---------|-----|-------|
| v0.3.1 | Order flow · Customer migration | ✅ Done |
| v0.3.2 | Package S/M/L system | ✅ Live |
| v0.3.3 | Meal Plan flow + Pre-order | ✅ Live |
| v0.3.4 | Product images (`batch_photo_upload.html`) | 🟡 เขียนเสร็จแล้ว ต่อ Supabase Storage จริง — ยังไม่เคยรัน ดูหมวด "📸 Photo Migration" ด้านล่าง |
| v0.3.5 | OH Admin Tools (weekly swap, toggle, อัพรูป, package mgmt) | ✅ ทำครบตามที่วางแผนไว้ (แพลนเมนู mp_deliveries ตัวจริง, promo, messenger, DB "🍳 ผลิตวันนี้") |
| v0.4   | AI Agents: น้องนิว + พี่เก่ง | 🚀 Beta Launch (ยังไม่เริ่ม) |
| v1.0   | ปิด Hato Heart | 🏁 Full Launch |

---

## 🔴 Post-push Checklist (v0.3.3 — เหลือ verify บน production)

```
1. ✅ รัน SQL แล้ว (available_from + delivery_week — verify ผ่าน REST)

2. ⚠️ MP_SETS ยังเป็นราคา mock — live แล้วแต่ต้องยืนยัน:
   trial 7 กล่อง   HP 1499 / LC 1399
   weekly 21 กล่อง HP 3990 / LC 3790
   monthly 84 กล่อง HP 13990 / LC 13490

3. ✅ Push ไฟล์ทั้ง 3 แล้ว (commit 09fcf9f)
   liff_customer.html · main_database_v2.html · home_editor.html

4. Test checklist liff_customer (รอ test บน production):
   □ Package S card ใน HomeGrid → เลือก 9 เมนู → ตะกร้า
   □ Meal Plan card → เลือก HP + weekly → ตะกร้า
   □ เมนูอาทิตย์หน้า (ใส่ available_from ทดสอบ) → badge 📅
   □ กด + เมนูอาทิตย์หน้าตอนตะกร้ามีอาทิตย์นี้ → toast block

5. Test checklist main_database_v2:
   □ Tab แพคเกจ → โหลด Package S
   □ แก้ไข → เลือกเมนู + +40 → บันทึก → Supabase อัพเดท
```

---

## 🔴 Post-push Checklist (Meal Plan Scheduling — mp_deliveries, commit a0f542c)

```
1. ✅ SQL รันแล้ว: ตาราง mp_deliveries + RLS policy (verify ผ่าน REST insert/delete)
2. ⚠️ SQL ค้าง: ALTER TABLE เพิ่ม day_before_notified_at (scripts/sql_mp_deliveries.sql ส่วนท้าย — v0.4.1)
3. ⚠️ ยังไม่ตั้ง: Vercel env var LINE_CHANNEL_ACCESS_TOKEN (ไม่มีก็ใช้ระบบได้ปกติ แค่ยังไม่ push LINE)

4. Test checklist LIFF (liff_customer.html):
   □ สั่ง Meal Plan จริง 1 ออเดอร์ (เช่น trial) → เช็คใน Supabase ว่า mp_deliveries มีแถวตามจำนวนรอบ (boxes/7)
     และ delivery_date ตกวัน จ/พ/ศ ทุกแถว
   □ เข้าหน้า "ออเดอร์ของฉัน" → เห็น banner "🥗 จัดการ Meal Plan" → กดเข้าหน้าใหม่ได้
   □ เห็นรายการรอบ + status badge ตรงกับที่ตั้งใน OH
   □ ตั้งแถวทดสอบ status=request_open ผ่าน OH ก่อน → กลับมา LIFF → เลือก request เมนู → ยืนยัน →
     เช็ค status เปลี่ยนเป็น request_submitted
   □ กด "ขอเลื่อน/ข้ามรอบนี้" → confirm → เช็ค status เปลี่ยนเป็น skip_requested

5. Test checklist OH (operation_hub.html):
   □ แท็บแพลนเมนู → เห็นส่วน "📦 Meal Plan ระยะยาว" โหลดรายการจริง
   □ กดปุ่มกรอง "🔴 ต้องดำเนินการ" → เห็นเฉพาะแถว request_submitted/skip_requested
   □ กด "🍽 กำหนดเมนู" → เลือก SKU → บันทึก → status เปลี่ยนเป็น menu_assigned
   □ แก้วันที่ส่งรายรอบ (date input) → เช็ค Supabase อัพเดทจริง
   □ พิมพ์โน้ตแอดมิน → รอ debounce 600ms → เช็ค admin_notes บันทึกแล้ว

6. Test checklist KQ (kitchen_queue.html):
   □ เลือกวันที่ตรงกับ mp_deliveries ที่มี → เห็น section สีม่วง "📦 Meal Plan ระยะยาว" แยกจากออเดอร์ปกติ
   □ กด "✅ ส่งแล้ว" → เช็ค status เปลี่ยนเป็น delivered + ปุ่มเปลี่ยนเป็น label static

7. Test checklist api/notify-mp-requests.js (หลังตั้ง LINE_CHANNEL_ACCESS_TOKEN):
   □ เช็คใน Vercel dashboard → Cron Jobs → เห็น job รันสำเร็จรายวัน (schedule 0 1 * * * UTC = 08:00 ไทย)
   □ ทดสอบ "เปิด request window": ตั้งแถว status=scheduled, request_opens_at=วันนี้หรือก่อนหน้า, notified_at=null
     → รัน endpoint (เปิด URL /api/notify-mp-requests ตรงๆ หรือรอ cron) → เช็ค status→request_open + ได้ LINE
   □ ทดสอบ "auto no-change": ตั้งแถว status=request_open, request_deadline=เมื่อวาน → รัน endpoint
     → เช็ค status→no_change + ได้ LINE ข้อความ "ไม่เปลี่ยนแปลงเมนู"
   □ ทดสอบ "เตือนก่อนส่ง 1 วัน": ตั้งแถว delivery_date=พรุ่งนี้, day_before_notified_at=null → รัน endpoint
     → เช็ค day_before_notified_at ถูกเซ็ต + ได้ LINE ข้อความเตือน
```

---

## 📸 Photo Migration (`batch_photo_upload.html`) — ตรวจสอบแล้ว พร้อมใช้แบบมีคนคุม

**สรุป:** ไฟล์นี้เขียนเสร็จสมบูรณ์แล้ว (ไม่ใช่ stub) — flow: อ่าน `All_menu.xlsx` หา SKU → โหลด `menu_items` จริงจาก Supabase → ลากรูปโบรชัวร์เข้ามา → ส่งรูปให้ Claude Vision หาตำแหน่ง+ชื่อแต่ละเมนู → crop อัตโนมัติ → fuzzy match ชื่อกับเมนูจริง (fuzzy score ≥0.82 = auto-select) → ตารางรีวิวให้เช็ค/แก้ทีละแถวก่อน → อัพโหลดเข้า Storage bucket `menu-images` จริง + PATCH `menu_items.image_urls` จริง (ยืนยันแล้วว่าคอลัมน์/บัคเก็ตตรงกับที่ `main_database_v2.html` ใช้งานอยู่)

**ต้องมีอะไรก่อนรัน:** เปิดไฟล์ในเบราว์เซอร์ตรงๆ (ไม่ต้อง deploy) แล้วใส่ Anthropic API key ของตัวเองในช่อง (เก็บใน localStorage เครื่องตัวเองเท่านั้น ไม่ขึ้น Supabase) — เหมาะกับรันเองคนเดียว **ไม่ควรแชร์ลิงก์นี้ให้คนนอก** เพราะ key ฝังอยู่ฝั่ง browser ตรงๆ

**⚠️ ความเสี่ยงที่ควรรู้ก่อนรันจริงกับโบรชัวร์ทั้งชุด (ยังไม่ได้แก้ ถ้าอยากให้แก้บอกได้):**
1. `image_urls` array ไม่มีการจำกัดจำนวน — โค้ดจะ prepend URL ใหม่เข้าไปเรื่อยๆ แต่ `main_database_v2.html` โชว์แค่ 4 ช่องแรก (`.slice(0,4)`) แปลว่าถ้ารันหลายรอบ array จะยาวขึ้นเรื่อยๆ แบบไม่โชว์ผล กินพื้นที่ DB เปล่าๆ
2. Path อัพโหลดคือ `{sku}.jpg` แบบ upsert=true — ถ้ารูปโบรชัวร์ 2 ใบ map ไปที่ SKU เดียวกัน (เช่น อัพซ้ำ 2 สัปดาห์) รูปเก่าจะถูกทับเงียบๆ ไม่มี confirm ไม่มี versioning
3. threshold 0.82 ยังไม่เคยทดสอบกับชื่อเมนูจริงของร้าน (ภาษาไทย มีคำซ้ำ/สะกดต่าง) — แนะนำเช็ค auto-selected ทุกแถวก่อนกด upload จริง ไม่ควร trust แบบ batch เต็มๆ ตั้งแต่รอบแรก

**คำแนะนำ:** ลองรัน 1 โบรชัวร์ก่อน (ไม่กี่ SKU) → เช็คว่า `main_database_v2.html` ยังโชว์ 4 ช่องรูปถูกต้อง ไม่พังจากปัญหา #1-2 → ค่อยไล่ทำทั้งชุด

---

## 📜 Activity Log — ประวัติการเปลี่ยนแปลง + ประวัติเติมสต็อก (v0.4.6 — รอรัน SQL)

**ต้องรันก่อนใช้งาน:** `scripts/sql_activity_log.sql` (สร้างตาราง `activity_log` + RLS policy) — โค้ดฝั่งแอปเขียนรองรับกรณีตารางยังไม่มีอยู่แล้ว ไม่พังถ้ายังไม่รัน แค่แถบ log จะโชว์ "ยังไม่มีประวัติ" เฉยๆ

**ดีไซน์ (ตอบโจทย์ "แก้ถี่ไปจะเก็บ log เยอะ"):**
- **Batch ต่อ (browser session + ประเภทการกระทำ)** — session ใหม่ทุกครั้งที่เปิดหน้า `main_database_v2.html` การกระทำประเภทเดียวกัน (เช่น ปรับสต็อก) ภายใน session เดียวกันจะรวมเข้าแถวเดียว ไม่ insert ใหม่ทุกคลิก
- **Debounce เขียนจริง 3 วิ** — กด +10/+1 ติดกันหลายครั้ง จะสะสมในหน่วยความจำก่อน แล้วค่อยเขียนขึ้น Supabase ครั้งเดียวตอนหยุดกด 3 วิ (ทดสอบแล้ว: กด 3 ครั้งติดกัน → ยิง request จริงแค่ 1 ครั้ง)
- **4 action_type:** `stock` (main_database_v2.html, สรุปเป็น "LC02 +2, HP01 +1"), `category` (สร้าง/รวม/ลบ/เปลี่ยนชื่อ), `package` (สร้าง/แก้/ลบแพค), `he_layout` (home_editor.html — 1 คลิกปุ่ม "บันทึก" = 1 log อยู่แล้วโดยธรรมชาติ ไม่ต้อง debounce)
- **ไม่ครอบคลุม (ตัดสินใจไว้แล้ว กันไม่ over-engineer):** การแก้ field เดี่ยวๆ ในสูตร (ชื่อ/ราคา/วัตถุดิบ) ยังไม่ log เพราะพื้นผิวกว้างเกินไป มีแค่ 4 action_type ข้างบน ถ้าอยากเพิ่มบอกได้
- **UI:** แถบบางที่หัวหน้า `main_database_v2.html` (เห็นทุกแท็บ) โชว์กิจกรรมล่าสุด 1 บรรทัด กดปุ่ม "ประวัติ ▼" เพื่อขยายดูย้อนหลัง 50 รายการ
- **ใครแก้:** ใช้ `state.currentUser` (ชื่อเล่นที่กรอกไว้มุมขวาบน) — `home_editor.html` **ยังไม่มีระบบใส่ชื่อของตัวเอง** เลยอ่านจาก `localStorage['lastNickname']` แทน (คีย์เดียวกับที่ DB ใช้จำชื่อ) → **ถ้าอยากให้ log จาก HE โชว์ชื่อถูก ต้องเคยกรอกชื่อที่หน้า DB ในเบราว์เซอร์เครื่องเดียวกันมาก่อนอย่างน้อย 1 ครั้ง** ไม่งั้นจะโชว์ "ไม่ทราบชื่อ"
- **หมายเหตุ HE:** `saveAll()` เป็นปุ่ม "บันทึกทั้งหมด" อยู่แล้ว (ไม่ diff เทียบก่อน-หลัง) log เลยรายงาน "จำนวนการ์ด/เมนูที่อยู่ในการบันทึกครั้งนี้" ไม่ใช่ "จำนวนที่เปลี่ยนจริง" — ประมาณการเพื่อความเรียบง่าย ไม่ผิดแต่ไม่ได้ precise 100%

---

## 🚚 ลูกค้าสั่ง 2 รอบที่เดียวกัน ไม่คิดค่าส่งซ้ำ — ❌ ยกเลิกแล้ว (2026-07-04)

นัทตัดสินใจไม่ทำ ("อาจจะยากไป") หลังฟังข้อเสนอ (เพิ่ม lat/lng ใน orders + badge เตือนแอดมินที่ OH) — ไม่ต้องทำต่อ ถ้าอนาคตอยากรื้อฟื้นเรื่องนี้ ข้อเสนอเดิมอยู่ใน git history ของไฟล์นี้ (commit `80f1d57`)

---

## 🤖 AI Agents (v0.4)

**น้องนิว**
- Stock: estimate velocity → batch qty → feed KQ
- Meal Plan: assign 7 เมนู/ลูกค้า/สัปดาห์ → ลูกค้า request ได้ไม่เกิน 2/สัปดาห์
- **Weekly pain point ของนัท:** เลือก S1–S8 จาก 300+ เมนู (เกณฑ์: ขายดี/อร่อย/กำไร/สวย/ไม่ซ้ำ 2 เดือน)
  → น้องนิวเสนอ 8 รายการ + นัท approve → S1–S5 กลายเป็น D1–D5 อัตโนมัติ

**พี่เก่ง** — route delivery + Lalamove v3 API
- **วิสัยทัศน์ที่นัทอธิบายไว้ (2026-07-05, ยังไม่เริ่มสร้าง):** หน้าจัดแมสใหม่เป็นแบบ "รายการ" ให้แมส (คนขับ) กดอัพเดทสถานะงานส่งเองได้จากมือถือ + ถ่ายรูปหลักฐานส่งของลงแอพได้เลย (proof of delivery) เพื่อให้แอดมินเห็นว่าตอนนี้แมสอยู่ไหน/ส่งถึงหรือยัง + ต่อ Lalamove API ตรงในหน้านี้เพื่อเรียกรถ/ดูสถานะ realtime จากหน้าเดียว — คนละเรื่องกับ "แมสเซนเจอร์" ที่มีอยู่ตอนนี้ (แค่หน้าดูรายการ ไม่มีปุ่มอัพเดทจริง ไม่มี LINE แจ้งลูกค้าเลย ดู Known Issues)

**Tables ที่ต้องสร้าง:** `menu_history` · `customer_preferences` · `production_plan` · `weekly_assignments`

---

## 📌 Backlog & Decisions Pending

| รายการ | รายละเอียด |
|--------|-----------|
| **แจ้งเมนู HP/LC ล่วงหน้า?** | ปรึกษาพลอยก่อน — กระทบ marketing messaging + design น้องนิว |
| **KQ ดึง order จริง?** | ต้องทดสอบก่อน launch — ครัวต้องเห็น order |
| **Staging/Preview branch** | ทำหลัง launch — Vercel preview branch |
| **Package M/L** | หลังขาย S ได้ก่อน |
| **Loyalty tier threshold** | 🔴 **รอนัท** — มี real legacy data แล้ว (`customers.loyalty_points` มีอยู่ 492/2,160 คน สูงสุด 7,451 แต้ม) แต่ยังไม่มี logic สะสม/ใช้แต้มอัตโนมัติเลยในระบบ + `liff_profile.html`'s TIERS array (เทียร์1-3/VIP) ไม่ตรงกับค่าจริงใน `customers.tier` (bronze/Fit&Fabulous/Wellness Warriors/Healthy Habits) — นัทขอ **หยุดรอก่อน** จนกว่าจะ migrate ข้อมูลจากระบบเก่ามาครบ ("สะสมแต้ม เดี๋ยว migrate ยังไม่ได้ดึงไฟล์จากของเก่าเลยฉันจะทำให้ระบบเสร็จก่อน", 2026-07-04) — ห้ามเริ่มออกแบบ tier ใหม่จนกว่านัทจะแจ้ง |
| **น้องเตียง (graphic)** | หลัง n้องนิว approve เมนู → auto generate poster |

---

## 💬 Working Style

- **นัทส่ง multi-part ในข้อความเดียว** — ตอบให้ครบทุก part
- **"ปรับได้เลย"** = ทำเลย ไม่ต้องถามซ้ำ
- **คิดทะลุแผน** = redirect ทันที → "นั่นอยู่ใน backlog โฟกัส [task] ก่อน"
- **Commit message** = ภาษาไทยสั้นๆ เช่น `เพิ่ม Package flow + Meal Plan flow v0.3.2-3`
- **ทุก session** = อ่าน CLAUDE.md ก่อนเสมอ

---

*Last updated: 5 ก.ค. 2026 — v0.4.11 ✅ push แล้ว (commit `fb42370`) — ระบบ "ชุด Meal Plan" (`mp_offer_sets`): ย้าย MP_SETS จาก hardcode ไปเป็นตารางแก้ราคาเองได้ที่หน้า DB + สร้าง "Set 2" โปรโมชั่นแยกลิ้งจากการ์ดหน้าแรกได้เอง — ก่อนหน้า v0.4.10: จากผลเทสแอดมินจริง 7 ข้อ — แก้ sort_order 80 รายการ, เจอแท็บโปรโมชั่นไม่มีปุ่มนำทางใน OH (โค้ดมีครบแต่กดเข้าไม่ได้), เปิดหน้า "ตั้งค่า" (จำนวนเมนู/หน้า DB + ขนาดช่องช้อนส้อม KQ), เพิ่มหมวดหมู่ในตะกร้า/ยืนยัน/ประวัติ, แก้บั๊กแต้มลูกค้าโชว์ 0 ตลอด (`liff_profile.html` อ้างคอลัมน์ `points` ที่ไม่มีจริง → เปลี่ยนเป็น `loyalty_points`), เพิ่มช้อนส้อมที่เช็คเอาท์+โชว์เด่นที่บัตรครัว — ⚠️ **มี 3 SQL รอนัทรัน** (ไม่รันก็ไม่พัง แค่ฟีเจอร์ยังไม่เปิด): `scripts/sql_activity_log.sql`, `scripts/sql_utensils.sql`, `scripts/sql_mp_offer_sets.sql` — เรื่องแต้มสะสม/tier ตัดสินใจ **หยุดรอนัท** จนกว่าจะ migrate ข้อมูลระบบเก่าเสร็จ (ดู Backlog) — วิสัยทัศน์พี่เก่ง/Lalamove (แมสอัพเดทสถานะเอง+ถ่ายรูปหลักฐาน+realtime) บันทึกไว้แล้วเป็น future scope ยังไม่เริ่มสร้าง — นัทกำลังเตรียมทริปแคนาดา 7 วัน จะใช้ claude.ai/code จากมือถือแทน Claude Code เดิม (รอสัญญาณ "พร้อมไปแคนาดาแล้ว" ก่อนเริ่มเตรียมไฟล์ให้) — ถัดไป: รอนัทลองรัน batch_photo_upload.html (จะช่วยทีละขั้นตอน)*

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
| `liff_customer.html` | LIFF ลูกค้า: เมนู + checkout | ✅ updated (v0.3.3) — รอ push |
| `main_database_v2.html` | DB เมนู/วัตถุดิบ + packages tab | ✅ updated (v0.3.2) — รอ push |
| `home_editor.html` | จัด HomeGrid + routing Package/MP | ✅ updated (v0.3.2) — รอ push |
| `kitchen_queue.html` | หน้าครัว + print | ✅ live |
| `operation_hub.html` | Admin hub (5 tabs) | ✅ live — รอ v0.3.5 |
| `customer.html` | ข้อมูลลูกค้า standalone | ✅ live |
| `liff_register.html` | สมัครสมาชิก | deployed (mock data) |
| `liff_profile.html` | โปรไฟล์ลูกค้า | deployed (mock data) |
| `report.html` | รายงาน | deployed (mock data) |
| `landing.html` | FB/IG → LINE bridge | deployed |
| `api/webhook.js` | Meta Webhook scaffold | built, ยังไม่ configure |

---

## 🥡 Product Lines

### Line 1 — เมนูสต็อค (SKU: No · S · D)
- ทำล่วงหน้า 1 วัน, มี `stock_quantity`
- ส่งได้ทุก time slot รวมเช้า
- ขายทั้ง individual และ Package S/M/L
- **Pre-order:** เมนูอาทิตย์หน้าตั้ง `available_from` = วันจันทร์ถัดไป → โชว์ badge 📅 + block ผสมตะกร้า

### Line 2 — Meal Plan ทำสด (SKU: HP · LC)
- ทำสดวันนั้น ส่งบ่ายเท่านั้น — `no_morning = true` อัตโนมัติ
- **ไม่มี stock concept** — วางแผนจากวัตถุดิบ
- **✅ เป็น add-to-cart ปกติ** ลูกค้าเลือก HP/LC + set size → เข้าตะกร้าเลย
- Admin assign เมนูหลังบ้าน (น้องนิวทำใน v0.4)

### Package S/M/L
- HomeGrid card → `openPackage(pkgId)` → เลือก 9 เมนู → เข้าตะกร้า
- Premium items: extra_price กำหนดต่อ SKU ใน `package_items` table
- Admin จัดการ Package ผ่าน tab แพคเกจใน `main_database_v2.html`

---

## 🗄️ Supabase Tables

### มีแล้ว
`orders` · `order_items` · `menu_items` · `customers` · `home_layout` · `kitchen_data`
`daily_menu_assignments` · `bot_sessions` · `promo_codes` · `packages` · `package_items`

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
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'individual';
```

### ⚠️ SQL ที่ยังต้องรัน
```sql
-- v0.3.3 pre-order
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_from DATE;
ALTER TABLE orders     ADD COLUMN IF NOT EXISTS delivery_week TEXT DEFAULT 'current';
```

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
Syntax check    → node --check file.js หลัง edit ทุกครั้ง
```

---

## 🚦 Current Version: v0.3.3 (dev เสร็จ รอ push)

### ✅ Fixed Issues (แก้แล้วในแชทนี้)
| # | ปัญหาเดิม | สถานะ |
|---|-----------|-------|
| 1 | HP/LC ควรเป็น subscribe flow | ✅ เปลี่ยนเป็น add-to-cart + picker screen |
| 2 | Stock badge บน HP/LC | ✅ แสดง "🥗 Meal Plan" badge แทน |
| 3 | no_morning ต้อง tick per item | ✅ auto จาก category แล้ว |

### ⚠️ Known Issues (ยังค้างอยู่)
| # | ปัญหา | Priority |
|---|-------|----------|
| 1 | KQ รวม Stock + Meal Plan (ควรแยก view) | 🟡 Med |
| 2 | report.html, liff_profile.html, liff_register.html ยัง mock data | 🟡 Med |
| 3 | KQ ต้องตรวจสอบว่าดึง order จริงจาก Supabase ได้ไหม | 🔴 ก่อน launch |

---

## 📋 What's in liff_customer.html (v0.3.3)

### Screens
`s-menu` · `s-pkg-select` · `s-meal-plan` · `s-cart` · `s-confirm` · `s-ok` · `s-orders`

### Key features
- **Package flow:** HomeGrid card → `openPackage()` → เลือกเมนู → ตะกร้า
- **Meal Plan flow:** HomeGrid card → `openMealPlanPicker()` → เลือก HP/LC + set → ตะกร้า
- **Pre-order:** `isNextWeekItem()` ตรวจ `available_from` → badge 📅 + block mixed cart
- **Cart week-block:** `cartWeekType()` → อาทิตย์นี้ + อาทิตย์หน้า ผสมกันไม่ได้
- **Saved address:** restore จาก `customers.default_address` อัตโนมัติ
- **Order history:** `s-orders` screen + `goOrders()`
- **Profile:** redirect ไป `liff_profile.html` พร้อม uid

### Meal Plan Config (⚠️ แก้ราคาก่อน launch)
```javascript
const MP_SETS = [
  { id:'trial',   label:'ทดลอง',      boxes:7,  price_hp:1499,  price_lc:1399  },
  { id:'weekly',  label:'1 สัปดาห์',  boxes:21, price_hp:3990,  price_lc:3790  },
  { id:'monthly', label:'1 เดือน',    boxes:84, price_hp:13990, price_lc:13490 },
];
// ราคาเป็น mock — นัทต้องยืนยันก่อน push จริง
```

### Order types
- `individual` — เมนูปกติ
- `package` — Package S/M/L (order_items แยก row ต่อเมนู + notes: 'pkg:{id}')
- `meal_plan` — Meal Plan (1 order_items row + notes: 'meal_plan:hp:weekly')

### Delivery week
- `current` — ส่งอาทิตย์นี้ (default)
- `next` — pre-order ส่งอาทิตย์หน้า (items มี `available_from` > today)

---

## 📋 What's in main_database_v2.html (v0.3.2)

### Tabs
เมนู · วัตถุดิบ · Meal Plan · 📦 แพคเกจ ← **ใหม่**

### Tab แพคเกจ
- สร้าง/แก้ Package S/M/L ได้เอง
- Checkbox เมนู active ทั้งหมด + กำหนด extra_price ต่อ SKU
- Quick buttons +0 / +40 + custom price input
- Save = delete + insert ใหม่ใน `package_items`

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
| v0.3.2 | Package S/M/L system | ✅ Dev done — รอ push |
| v0.3.3 | Meal Plan flow + Pre-order | ✅ Dev done — รอ push |
| v0.3.4 | Product images (`batch_photo_upload.html`) | 🔴 ยังไม่รัน |
| v0.3.5 | OH Admin Tools (weekly swap, toggle, อัพรูป, package mgmt) | 🔄 ถัดไป |
| v0.4   | AI Agents: น้องนิว + พี่เก่ง | 🚀 Beta Launch |
| v1.0   | ปิด Hato Heart | 🏁 Full Launch |

---

## 🔴 Push Checklist (ทำก่อน push)

```
1. รัน SQL ที่ยังค้าง:
   ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available_from DATE;
   ALTER TABLE orders     ADD COLUMN IF NOT EXISTS delivery_week TEXT DEFAULT 'current';

2. แก้ราคา MP_SETS ใน liff_customer.html (บรรทัดต้นไฟล์)

3. Push ไฟล์ทั้ง 3:
   liff_customer.html     ← v0.3.3
   main_database_v2.html  ← v0.3.2
   home_editor.html       ← v0.3.2

4. Test checklist liff_customer:
   □ Package S card ใน HomeGrid → เลือก 9 เมนู → ตะกร้า
   □ Meal Plan card → เลือก HP + weekly → ตะกร้า
   □ เมนูอาทิตย์หน้า (ใส่ available_from ทดสอบ) → badge 📅
   □ กด + เมนูอาทิตย์หน้าตอนตะกร้ามีอาทิตย์นี้ → toast block

5. Test checklist main_database_v2:
   □ Tab แพคเกจ → โหลด Package S
   □ แก้ไข → เลือกเมนู + +40 → บันทึก → Supabase อัพเดท
```

---

## 🤖 AI Agents (v0.4)

**น้องนิว**
- Stock: estimate velocity → batch qty → feed KQ
- Meal Plan: assign 7 เมนู/ลูกค้า/สัปดาห์ → ลูกค้า request ได้ไม่เกิน 2/สัปดาห์
- **Weekly pain point ของนัท:** เลือก S1–S8 จาก 300+ เมนู (เกณฑ์: ขายดี/อร่อย/กำไร/สวย/ไม่ซ้ำ 2 เดือน)
  → น้องนิวเสนอ 8 รายการ + นัท approve → S1–S5 กลายเป็น D1–D5 อัตโนมัติ

**พี่เก่ง** — route delivery + Lalamove v3 API

**Tables ที่ต้องสร้าง:** `menu_history` · `customer_preferences` · `production_plan` · `weekly_assignments`

---

## 📌 Backlog & Decisions Pending

| รายการ | รายละเอียด |
|--------|-----------|
| **แจ้งเมนู HP/LC ล่วงหน้า?** | ปรึกษาพลอยก่อน — กระทบ marketing messaging + design น้องนิว |
| **KQ ดึง order จริง?** | ต้องทดสอบก่อน launch — ครัวต้องเห็น order |
| **Staging/Preview branch** | ทำหลัง launch — Vercel preview branch |
| **Package M/L** | หลังขาย S ได้ก่อน |
| **Loyalty tier threshold** | วิเคราะห์จาก real data หลัง launch |
| **น้องเตียง (graphic)** | หลัง n้องนิว approve เมนู → auto generate poster |

---

## 💬 Working Style

- **นัทส่ง multi-part ในข้อความเดียว** — ตอบให้ครบทุก part
- **"ปรับได้เลย"** = ทำเลย ไม่ต้องถามซ้ำ
- **คิดทะลุแผน** = redirect ทันที → "นั่นอยู่ใน backlog โฟกัส [task] ก่อน"
- **Commit message** = ภาษาไทยสั้นๆ เช่น `เพิ่ม Package flow + Meal Plan flow v0.3.2-3`
- **ทุก session** = อ่าน CLAUDE.md ก่อนเสมอ

---

*Last updated: มิ.ย. 2026 — v0.3.3 dev done, รอ push + v0.3.4-5 ถัดไป*

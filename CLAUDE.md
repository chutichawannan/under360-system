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
| `liff_customer.html` | LIFF ลูกค้า: เมนู + checkout | ✅ live |
| `main_database_v2.html` | DB เมนู/วัตถุดิบ | ✅ live |
| `kitchen_queue.html` | หน้าครัว + print | ✅ live |
| `operation_hub.html` | Admin hub (5 tabs) | ✅ live |
| `home_editor.html` | จัด HomeGrid หน้าร้าน | ✅ live |
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

### Line 2 — Meal Plan ทำสด (SKU: HP · LC)
- ทำสดวันนั้น ส่งบ่ายเท่านั้น — `no_morning = true` อัตโนมัติ
- **ไม่มี stock concept** — วางแผนจากวัตถุดิบ
- ลูกค้า subscribe → น้องนิว assign เมนู (ไม่ใช่ add-to-cart)

---

## 🗄️ Supabase Tables

### มีแล้ว
`orders` · `order_items` · `menu_items` · `customers` · `home_layout` · `kitchen_data` · `daily_menu_assignments` · `bot_sessions` · `promo_codes` · `packages` · `package_items`

### รัน SQL แล้ว ✅ (มิ.ย. 2026)
```sql
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS no_morning BOOLEAN DEFAULT false;   -- ✅ done
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_account TEXT;                   -- ✅ done
CREATE POLICY "anon_read_order_items" ON order_items FOR SELECT TO anon USING (true); -- ✅ done
```

---

## ⚙️ Coding Conventions — ห้ามผิด

```
LIFF files      → ใช้ const sb = supabase.createClient(URL, KEY) ตรงๆ ห้ามใช้ getSB()
DEV_MODE        → false บน production เสมอ
Order number    → U-MMDD-NNN (e.g. U-0627-001)
Supabase query  → ต้อง .limit(N) ถ้าต้องการ > 1000 rows
render(true)    → force bypass keyboard defer
Phone format    → fmtPhone() → เพิ่ม 0 นำหน้าถ้า 9 หลัก
</style> tag    → grep duplicate ก่อน commit เสมอ (ทำให้ raw CSS ขึ้น)
Parallel read   → ห้าม Promise.all() ใน Claude artifact storage → sequential เท่านั้น
Mobile scroll   → ใช้ inline spacer div ไม่ใช่ padding-left
Single file     → HTML/CSS/JS ในไฟล์เดียว ไม่แยก
```

---

## 🚦 Current Version: v0.3.x

### ⚠️ Known Issues (รู้แล้ว รอ fix)
| # | ปัญหา | Priority |
|---|-------|----------|
| 1 | HP/LC ใน LIFF แสดงเป็น add-to-cart (ควรเป็น subscribe flow) | 🔴 High |
| 2 | Stock badge แสดงบน HP/LC (ไม่ make sense) | 🔴 High |
| 3 | no_morning ต้อง tick per item (ควร auto จาก category) | 🟡 Med |
| 4 | KQ รวม Stock + Meal Plan (ควรแยก view) | 🟡 Med |

### 📋 Pending Tasks
- [ ] Push ไฟล์ที่แก้แล้วทั้งหมดขึ้น GitHub
- [x] Run SQL ที่ค้างอยู่ใน Supabase ✅
- [ ] Update `MP_SETS` pricing config ก่อน launch
- [ ] Test 6 ไฟล์: liff_register, liff_customer, liff_profile, kitchen_queue, landing, webhook

### 🗺️ Roadmap
| Version | งาน |
|---------|-----|
| v0.3.2 | Package S/M/L system ⭐ Revenue Critical |
| v0.3.3 | Meal Plan subscribe flow ⭐ Revenue Critical |
| v0.3.4 | Product images ⭐ Revenue Critical |
| v0.3.5 | OH + HE admin self-management |
| v0.4   | AI Agents: น้องนิว + พี่เก่ง 🚀 Beta Launch |
| v1.0   | ปิด Hato Heart 🏁 Full Launch |

---

## 🤖 AI Agents (v0.4)

**น้องนิว** — assign Meal Plan เมนู 7 วัน/คน + estimate Stock velocity → feed KQ
**พี่เก่ง** — route delivery + Lalamove v3 API
**ฟ้า** — kitchen/ingredient planning (จาก output น้องนิว)
**Tables ที่ต้องสร้าง:** `menu_history` · `customer_preferences` · `production_plan` · `weekly_assignments`

---

## 💬 Working Style

- **นัทส่ง multi-part ในข้อความเดียว** — ตอบให้ครบทุก part
- **"ปรับได้เลย"** = ทำเลย ไม่ต้องถามซ้ำ
- **คิดทะลุแผน** = ถ้านัทขอทำนอก scope → redirect ทันที → "นั่นอยู่ใน backlog แล้ว โฟกัส [task] ก่อน — จัดใส่ backlog ดีไหม?"
- **Commit message** = ภาษาไทยสั้นๆ บอกว่าแก้อะไร เช่น `แก้ HP/LC badge + no_morning auto`
- **ทุก session** = อ่าน CLAUDE.md นี้ก่อนเสมอ

---

*Last updated: มิ.ย. 2026 — v0.3.1 complete, กำลัง setup Claude Code workflow*

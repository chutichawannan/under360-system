# Under360 — CLAUDE.md
> อ่านไฟล์นี้ก่อนทำงานทุกครั้ง — Single source of truth
> **12 ก.ค. 2026:** รวมจาก `UNDER360_MASTERNOTE_v6_7.md` + `UNDER360_HISTORY.md` (นัทเดินทางกลับถึง Santa Clarita เปิด Claude Code ได้แล้ว) — เก็บรายละเอียดเทคนิค/บั๊กเดิมของ CLAUDE.md ไว้ครบ + เพิ่มชั้น Marketing/Brand/Agent roster จาก masternote

**ระบบเวอร์ชัน 4 แทร็ค (ตั้งแต่ 9 ก.ค. 2026):** **u** = Under System (โค้ดหลังบ้านทั้งหมด รวม FB bot) · **m** = Marketing (GBP/Blog/Ads/Web) · **a** = Agents (นิว→เก่ง→ฟ้า→เตียง→เอิธ) · **doc** = เอกสารกลาง (MASTERNOTE + HISTORY — ไฟล์แชท ไม่ push git, รวมเป็น CLAUDE.md เฉพาะตอนนัทกลับถึงคอม) — Claude เคาะเลขเวอร์ชันตอนปิด session ใหญ่ ถ้านัทส่ง MASTERNOTE+HISTORY ใหม่มาอีกครั้ง ให้ merge เข้าไฟล์นี้แบบเดียวกับที่ทำรอบนี้

---

## 📊 Big-Picture Roadmap — 7 เสาหลัก (อ่านก่อนเสมอ)

> **ภาพรวมทั้งโปรเจคหลังบ้าน ~27%** — เสา 1 (โค้ด) ใกล้เสร็จแล้ว แต่เสา 2–7 แทบยังไม่เริ่ม เป้าหมายโปรเจค: กลับไป **500,000฿/เดือน** (เคย peak 300-500K ก่อนโควิด)

| # | เสาหลัก | % | สถานะสั้น |
|---|--------|---|----------|
| 1 | **ระบบ Order & ลูกค้า (Online)** | 80% | LIFF/DB/KQ/OH live + **payment status · ระยะขับจริง · แพคส่งฟรี · รูปเมนู 70/thumb** (u0.4.36) · SQL หลักรันครบ · **migrate 7,577 ออเดอร์เก่าเข้าแล้ว** (partial) — เหลือ LINE token + **beta test (0%: เทส iOS/ข้ามเครื่อง+เทส 1 ออเดอร์)** + Enable Distance API |
| 2 | **ปฏิบัติการ & ต้นทุน** (ครัว/ส่ง/ไฟ/แกส/คน) | 15% | subsidize ค่าส่ง 30-50K/ด → เป้าแรกพี่เก่ง · 🆕 **บัญชี = โฟกัสใหม่ (นัท 20 ก.ค.):** ฝั่งขาย (`orders`) ครบ แต่ **ฝั่งต้นทุน/ซื้อไม่มีที่จดเลย (expense table 404)** → ต้องสร้าง `expenses` + หน้าจดต้นทุนมือถือ + report กำไร-ขาดทุน (รอนัทตอบจดต้นทุนไว้ที่ไหน — เอิธ scope) |
| 3 | **Product-Market Fit** (เมนู↔มาเก็ตติ้ง) | 15% | ✅ ตอบแล้ว: หัวหอก = Meal Plan (HP+LC) กรุงเทพ · ตจว./แพ็คกับข้าว = passive · ค้าง: วัดสัดส่วนยอด HP vs LC จริง |
| 4 | **CRM & Customer Intelligence** | 20% | 🚨 **LINE OA ~20,000 followers → ลูกค้าจริง <100 คน/สัปดาห์ (<0.5%)** — เพิ่มยอดเท่าตัวไม่ต้องหาคนใหม่ · **GAP: แอดมินไม่เคยตามลูกค้าคอร์สจบเลย** = เงินหล่นทุกสัปดาห์ (ดู "🚨 CRM insight") |
| 5 | **Marketing Engine** (SEO+GEO+Ads+Influencer) | 20% | GBP ✅ · blog 3 ตัวขึ้น Wix ✅ · Google Ads verify ผ่าน ✅ · keyword ทองคำขุดแล้ว · เว็บใหม่เขียนครบรอ deploy |
| 6 | **AI Agents** (นิว→เก่ง→ฟ้า→เตียง→เอิธ) | 15% | **เอิธ = a0.3 รันจริงแล้ว** (subagent + desktop widget interactive) นำหน้าสุด · นิว spec locked (รอ order_items) · เก่ง/ฟ้า/เตียง = spec · **ตัวถัดไป = QA แอดมิน LINE OA** (นัทเลือก 22 ก.ค.) |
| 7 | **Under360 Base** (virtual office ปลายทาง) | 2% | วิสัยทัศน์ปลายทาง = v1.0 |

**⚙️ Sequencing:** **เลนโค้ด** (LIFF/FB bot/เว็บ Vercel — ต้องนั่งคอม+Claude Code) vs **เลนสมอง** (ออกแบบ agent/marketing/คอนเทนต์/ตั้งค่า platform — ทำผ่านมือถือได้) — ดูหัวข้อ "🧭 Roadmap ที่ถูกต้อง" ด้านล่างสำหรับกฎกันหลงทางแบบเต็ม

**กฎ delegate (นัทสั่ง):** งานไหน AI agent ทำแทนได้ → เสนอ delegate เสมอ อย่าทำมือซ้ำๆ ไปเรื่อยๆ — จดเข้า backlog agent ที่เกี่ยวข้อง

---

## 🏪 Project Overview

**Under360** — Healthy food delivery กรุงเทพฯ มา 10 ปี
- **นัท** = sole back-of-house (ครัว สูตร ต้นทุน inventory + ดูแล IT ทั้งหมดด้วย AI) — ไม่มี coding background, Claude เขียนโค้ดทั้งหมดแล้ว push GitHub
- **พลอย (Thunyathorn)** = ภรรยา/เจ้าของร่วม — ดูแล marketing + on-ground กรุงเทพทั้งหมด (นัท=หลังบ้าน, พลอย=หน้าบ้าน ไม่แย่ง territory กัน)

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
Omise:          1%/transaction credit card
Anthropic API:  platform.claude.com (แยกบิลจาก claude.ai subscription)
เบอร์ร้าน (GBP): 064 173 6519
Google Ads:     under360food@gmail.com (ocid 202127689) — Active ✅ verified · Customer ID 318-768-6554
GBP:            under360food@gmail.com = Primary owner · พลอย = Owner
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
| Web/SEO | 360foodbox.com (ปัจจุบัน Wix — blog live · กำลังย้าย Vercel ดูหัวข้อ "🌐 เว็บใหม่" — **ห้ามยกเลิก Wix ก่อนย้ายโดเมนเสร็จ**) |
| Marketing | GBP · Google Ads · FB 81.9K followers · IG 68.6K followers · LINE OA (broadcast รายสัปดาห์ผ่าน HatoHub) |

---

## 📁 Files

| ไฟล์ | หน้าที่ | สถานะ |
|------|--------|-------|
| `liff_customer.html` | LIFF ลูกค้า: เมนู + checkout + Meal Plan self-service + สั่งเซ็ต/คอร์ส (popup + subcode) + multi-round delivery split + ป้อบอัพเมนู/lightbox | ✅ live (u0.4.28) |
| `main_database_v2.html` | DB เมนู/วัตถุดิบ + packages/set builder (กลุ่มการเลือก/หลายหมวดรวมนับ) + หมวดหมู่ (merge/กันซ้ำ) + สต็อกจริง + Activity Log | ✅ live (u0.4.28) — optimize ขนาดไฟล์แล้ว (330KB) |
| `home_editor.html` | จัด HomeGrid + routing Package/MP + anchor point เมนูเฉพาะ | ✅ live (v0.4.21) |
| `kitchen_queue.html` | หน้าครัว + Meal Plan queue แยก view + print + วันที่สั่ง/ส่ง + log ทุกคลิกปุ่มสถานะ + ระบบชื่อผู้ใช้ | ✅ live (v0.4.22) |
| `operation_hub.html` | Admin hub (orders/menu/แพลนเมนู/promo/messenger/customer/HE + เปิด KQ/DB/report ผ่าน iframe) | ✅ live |
| `customer.html` | ข้อมูลลูกค้า standalone | ✅ live |
| `batch_photo_upload.html` | Batch upload รูปเมนูจากภาพโบรชัวร์ (AI vision จับตำแหน่ง+ชื่อ, fuzzy match, crop, upload) | 🟡 เขียนเสร็จ ต่อ Supabase/Storage จริงแล้ว — ยังไม่เคยรันจริงสักครั้ง ดูหมวด "Photo Migration" ด้านล่างก่อนรัน |
| `liff_register.html` | สมัครสมาชิก | ✅ ต่อ Supabase จริง (upsert customers) — ไม่ใช่ mock แล้ว |
| `liff_profile.html` | โปรไฟล์ลูกค้า | 🟡 ดึงจริงก่อน (customers+orders join) เหลือ mock แค่ fallback ตอน query พัง |
| `report.html` | รายงาน | deployed (mock data ทั้งหมด) — 🆕 นัทอยากได้เร็วขึ้น (ใช้วัด HP vs LC) |
| `landing.html` | FB/IG → LINE bridge — 🆕 จะใช้เป็น landing กลาง FB Ads แทนชี้ตรงเข้า LINE (ดู FB Attribution) | deployed |
| `api/webhook.js` | Meta Webhook scaffold | built, ยังไม่ configure |
| `api/notify-mp-requests.js` | Cron แจ้งเตือน Meal Plan (เปิด request window / auto no-change / เตือนก่อนส่ง 1 วัน) | ✅ live — รอตั้ง `LINE_CHANNEL_ACCESS_TOKEN` ถึงจะส่ง LINE จริง |
| `web/*.html` | เว็บสาธารณะใหม่แทน Wix: `index`/`mealplan`/`blog`/`blog_admin`/`import_blog`/`web_dashboard` + `posts/` | ✅ **live** ที่ `under360-system.vercel.app/web/` (12 ก.ค. — ยังไม่ชี้โดเมน, Wix ยังอยู่) · track() ยิง web_events แล้ว · ดู "🌐 เว็บใหม่" + `WEB_LAUNCH_TODO.md` |
| `WEB_LAUNCH_TODO.md` | Checklist งานที่นัทต้องกดเอง (SQL/Google Ads/Vercel token/iOS/IG/ชีท HP-LC) | ✅ พร้อมทำตาม |

---

## 🥗 Product Lines

### Line 1 — เมนูสต็อค (SKU: No · S · D)
- ทำล่วงหน้า 1 วัน, สต็อกจริงคือ `menu_items.stock_total` (⚠️ ไม่ใช่ `stock_quantity` — คอลัมน์นั้นไม่มีอยู่จริง เคยพังทั้งเส้นทางเพราะเข้าใจผิด แก้แล้ว commit `9620cc1`)
- นิยาม: `NULL`=ไม่จำกัด (default) · `0`=หมดสต็อกจริง · `N>0`=เหลือ N (badge "เหลือ N ชิ้นสุดท้าย" เมื่อ ≤5)
- ส่งได้ทุก time slot รวมเช้า
- ขายทั้ง individual และ Package S/M/L
- **Pre-order:** เมนูอาทิตย์หน้าตั้ง `available_from` = วันจันทร์ถัดไป → โชว์ badge 📅 + block ผสมตะกร้า

### Line 2 — Meal Plan ทำสด (SKU: HP · LC) — ⭐ ตัวชูโรง (โปรโมทคู่เสมอ อย่าเรียกแค่ HP)
- ทำสดวันนั้น ส่งบ่ายเท่านั้น — `no_morning = true` อัตโนมัติ
- **ไม่มี stock concept** — วางแผนจากวัตถุดิบ
- **✅ เป็น add-to-cart ปกติ** ลูกค้าเลือก HP/LC + set size → เข้าตะกร้าเลย
- Admin assign เมนูหลังบ้าน ผ่าน **OH แพลนเมนู** (ตัวจริง ต่อ `mp_deliveries` แล้ว) — น้องนิว จะมาช่วย auto-suggest (ดูสเปกล็อกแล้วในหัวข้อ AI Agents)
- ⚠️ เมนู HP/LC **ไม่ต้องขึ้นหน้าลูกค้าเลือกเอง** — มีไว้ให้แอดมิน assign หลังบ้านเท่านั้น (ยืนยันแล้วว่าตั้งใจ ไม่ใช่บั๊ก) และ **ไม่ลง delivery platform** — เป็น subscription ขายผ่าน LINE OA เท่านั้น (ดู Delivery Platform Strategy)
- สเปคเนื้อสัตว์: HP 170g/กล่อง · LC 120g/กล่อง

> ⚠️ **ราคาไม่ตรงกัน — ต้อง verify ก่อน launch:** โค้ด `MP_SETS` ใน `liff_customer.html` (ดูหัวข้อ "What's in liff_customer.html") ยังเป็นราคา placeholder เดิม (ทดลอง HP1499/LC1399, weekly HP3990/LC3790, monthly HP13990/LC13490) — แต่ masternote v6.7 (11 ก.ค.) ระบุว่านี่คือ **"ราคาโฆษณาจริง"**: ทดลอง 7 กล่อง LC 1,399/HP 1,699 · Weekly 21 กล่อง LC 3,190/HP 4,190 · Monthly 84 กล่อง LC 12,000/HP 15,900 · ส่งฟรีทุกแพ็ค — ราคาจริงตอนนี้ควรมาจากตาราง `mp_offer_sets` (v0.4.11 ย้ายไปแก้ที่หน้า DB ได้แล้ว ไม่ต้องแก้โค้ด) **ยังไม่ได้เช็คว่า `mp_offer_sets` ปัจจุบันตรงกับราคาโฆษณาจริงหรือไม่ — เช็คก่อนเปิดแคมเปญ Google Ads แคมเปญ 2 (Meal Plan Search) เพราะ ad copy อ้างราคา "เริ่ม 1,399.-" ตรงกันแล้ว**

### Line 3 — แพ็คกับข้าวฟรีซแพ็ค (ตจว. ทั่วไทย) — 🟢 passive
- ปรุงเสร็จแช่แข็งทันที ส่งทั่วประเทศ — ขายอยู่ ไม่ยุบ แต่ไม่ลงแรงโปรโมทเพิ่ม (ดู Positioning) — **ห้ามเขียนคอนเทนต์ดิสอาหารแช่แข็ง** เป็นสินค้าของร้านเอง

### Package S/M/L
- HomeGrid card → `openPackage(pkgId)` → เลือก 9 เมนู → เข้าตะกร้า
- Premium items: extra_price กำหนดต่อ SKU ใน `package_items` table
- Admin จัดการ Package ผ่าน tab แพคเกจใน `main_database_v2.html`

---

## ⚠️ 2 แกนการผลิต × คอร์ส/บันเดิล (แก้ความเข้าใจผิด 13 ก.ค. 2026 — สำคัญมาก)

> นัทแก้ความเข้าใจ Claude ที่เคยสับสนว่า "Weekly course = Meal Plan" — **ผิด** · คอร์ส Weekly/Monthly แบบ "เลือกวันส่งเองได้" = **ทำสต็อค** ไม่ใช่ทำสด · Claude เคยเผลอ flag คำ "เลือกวันส่งได้" ว่าผิดกฎ ทั้งที่ถูกต้องสำหรับสินค้าทำสต็อค

**2 แกนการผลิต (จำให้แม่น):**
- **ทำสด = Meal Plan (HP/LC)** — ปรุงเช้าวันส่ง ส่งบ่าย **เฉพาะ จ/พ/ศ · เลือกวันส่งเองไม่ได้** (เงื่อนไขเยอะ) · อยู่ในระบบแล้ว (`mp_offer_sets`/`mp_deliveries`)
- **ทำสต็อค = เมนู No/S/D** — ทำล่วงหน้า เก็บสต็อก → **ยืดหยุ่น เลือกวันส่งเองได้**

**คอร์ส/เซ็ตที่ขายจากของ "ทำสต็อค" (ยังขายอยู่จริงตอนนี้ แต่ทำมือ ยังไม่อยู่ในระบบ OH):**
- **คอร์สรายสัปดาห์/เดือน (สต็อค):** ลูกค้าเลือก N กล่อง (เช่น 21) จากเมนูสต็อคที่มี/วางแผนสต็อก → แบ่งส่งหลายรอบ (เช่น 3 รอบ) → **ลูกค้าเลือกวันส่งเองได้** (เพราะทำล่วงหน้า) — **คนละตัวกับ Meal Plan HP/LC weekly** (ทำสด จ/พ/ศ) แม้ใช้คำ "รายสัปดาห์/คอร์ส" เหมือนกัน
- **บันเดิลผสมราคาเหมา:** เช่น ข้าว 7 กล่อง + แพ็คกับข้าว 7 + น้ำ 3 ขวด + ขนม 1 = xxx บาท (ผสมหลายชนิดในราคาเดียว) — นัทเคยทำเสนอลูกค้าเองมาแล้ว

**🔴 ต้องสร้าง — OH "set/course builder" (นัทขอ, ยังไม่มี):** ให้แอดมิน "กำหนดเองได้เลยว่าจะขายอะไร ตั้งชื่อเซ็ต ตั้งราคาเซ็ต แล้วคลิกสินค้าใส่เข้าเซ็ตได้เลย" — รองรับทั้ง (1) คอร์สสต็อค multi-round + ลูกค้าเลือกวันส่ง (2) บันเดิลผสมราคาเหมา · เป้า **"กินลูกค้าทุกความต้องการ"** (บางคนไม่สะดวก จ/พ/ศ อยากเลือกเมนู/ไซส์เอง)
  - ✅ **v1 ฝั่งแอดมินสร้างแล้ว** (commit `9ae4607`, รอรัน `scripts/sql_package_sets.sql`): DB Package editor มีส่วน "🧩 กลุ่มการเลือก" — ตั้งกลุ่มได้กี่กลุ่มก็ได้ (เลือกตามหมวด N กล่อง / เจาะจงรายเมนู) + ราคาเหมา (base_price) + `delivery_rounds` + `flexible_delivery` (เลือกวันเอง) · surcharge ใช้ `package_items.extra_price` เดิม · เก็บ `packages.groups` (jsonb) · capability-check ซ่อน UI ถ้ายังไม่รัน SQL
  - ✅ **แอดมิน builder ครบ** (u0.4.24): กลุ่มการเลือก (ตามหมวด/เจาะจงเมนูจาก dropdown+chips) + `count` ต่อกลุ่ม + **`allow_repeat` (🔁 กดซ้ำ) ต่อกลุ่ม** + เตือนถ้า count เกินเมนูออนไลน์ในหมวด + ราคาเหมา + `delivery_rounds`/`flexible_delivery`
  - ✅ **กลุ่ม "หลายหมวด (รวมนับ)"** (u0.4.26): kind `multicat` — 1 กลุ่มผูกได้หลายหมวด (`groups[].categories[]`) `count` เดียวคุมยอดรวมข้ามหมวด (ครบพอดี แบ่งอิสระ ไม่มี min/max ต่อหมวด) · ตอบเคส "ข้าวกล่อง+กับข้าว รวมไม่เกิน 10 แบ่งเอง" · DB dropdown "📂 หลายหมวด" + chip เพิ่ม/ลบหมวด · LIFF `pkgGroupEligible` รวมเมนูทุกหมวดในกลุ่ม · backward-compat กับ category/list เดิม
  - ✅ **LIFF ลูกค้าสั่งเซ็ต v1** (u0.4.24): `renderPkgSelectGrouped` เป็น **popup sheet** (เหมือน Meal Plan, `#pkg-backdrop`+`#s-pkg-select.on`) · เลือกตามกลุ่ม · `allow_repeat=true`→ปุ่ม **+/- (qty)** · false→ติ๊กเมนูละ 1 · surcharge (`package_items.extra_price`, ปุ่ม +40) · ราคา=base+Σ(qty×surcharge) · โชว์ **subcode** (รหัสตัดตัวอักษรนำหน้า เหมือน KQ) · cart type `package` แตกเป็นกล่องตาม qty · ทางเดิม pick-N ไม่กระทบ (แยก branch)
  - ✅ **multi-round delivery split เสร็จ (u0.4.25, ปิด workstream 1):** เซ็ต `delivery_rounds>1` → หน้า checkout โชว์ section "แบ่งส่ง N รอบ" + toggle **"รับรวดเดียว"** + date picker ต่อรอบ (รอบ 1 = picker หลัก, รอบ 2..N = picker เพิ่ม default +7 วัน/รอบ) · **โมเดล: 1 รอบ = 1 order** (นัทเลือกเอง — ตรงกับที่แอดมินทำมือ: สั่ง 2-3 ชุดแล้วแต่รอบส่ง): รอบ 1 = order หลักถือเงินเต็ม, รอบ 2..N = order ยอด 0 แต่ละอันมี `delivery_date`+กล่องของรอบนั้น (`order_items.notes='pkg:{id}:course:r/N'`, order.notes ระบุ parent) · `splitSetItems` แบ่งกล่องเท่าๆ กัน (21/3→7,7,7 · 84/4→21×4) · **KQ อ่าน orders ตาม date อยู่แล้ว ไม่ต้องแตะ · ไม่มี SQL ใหม่** · ⚠️ v1: ค่าส่งคิดครั้งเดียวที่ order หลัก (รอบ 2..N fee=0) · รองรับ set เดียวต่อออเดอร์เป็นหลัก (หลาย set ใช้ max N ร่วมกัน)

**กระทบอะไร (ต้องแก้ตามความเข้าใจใหม่ — จัดลำดับ ไม่ทำรวดเดียว):**
- **เว็บ/บล็อค:** ✅ WS2 เสร็จ (commit `f65f033`) — index card + goal switcher เพิ่มคอร์ส/เซ็ตเลือกเมนู+วันรับเอง (สต็อค) · mealplan แก้ Meal Plan ส่ง จ/พ/ศ (เดิมเขียน จันทร์–เสาร์ ผิด) · บทความ `high-protein-meal-plan` แก้ conflation แล้ว + published (บล็อคครบ 20/20 published) · เหลือ: เว็บยังไม่มี flow สั่งเซ็ตจริง (รอ LIFF side)
- **กฎ copy (แก้):** "ห้ามเขียนเลือกเวลา/วันส่งได้" = **เฉพาะ Meal Plan (ทำสด)** · คอร์ส/บันเดิลจากสต็อค **เขียน "เลือกวันส่งได้" ได้** (ทำล่วงหน้า)
- **OH:** สร้าง set/course builder (ข้อบน) · **Marketing:** positioning ต้องครอบคลุมทั้งทำสด + คอร์สสต็อก ไม่ใช่ Meal Plan อย่างเดียว

---

## 🗄️ Supabase Tables

### มีแล้ว
`orders` · `order_items` · `menu_items` · `customers` · `home_layout` · `kitchen_data`
`daily_menu_assignments` (ใช้จริงแต่คนละเรื่องกับ Meal Plan รายลูกค้า — เป็นกริดวางแผนผลิตรวมของครัว ดู main_database_v2.html tab "📅 แผนผลิต") · `bot_sessions` · `promo_codes` · `packages` · `package_items` · `mp_deliveries` (Meal Plan ระยะยาวรายลูกค้า — คนละตารางกับข้างต้น) · `activity_log` · `mp_offer_sets`

### ✅ SQL รันครบแล้ว — ไม่มีค้าง (ยืนยันผ่าน REST ตรง 2026-07-05 — ถ้าเจอเอกสารอื่นบอกว่ายังไม่รัน ให้เชื่อบรรทัดนี้ ไม่ใช่เอกสารนั้น อาจเป็น snapshot เก่าก่อนนัทรัน)

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

-- v0.4.6 activity log (scripts/sql_activity_log.sql) — รันแล้ว
-- ตาราง activity_log + RLS policy — ดูหัวข้อ "📜 Activity Log" ด้านล่าง

-- v0.4.10 ช้อนส้อม (scripts/sql_utensils.sql) — รันแล้ว 2026-07-05
ALTER TABLE orders ADD COLUMN IF NOT EXISTS want_utensils BOOLEAN DEFAULT true;

-- v0.4.11 ชุด Meal Plan (scripts/sql_mp_offer_sets.sql) — รันแล้ว 2026-07-05
-- CREATE TABLE mp_offer_sets (...) + seed trial/weekly/monthly — รายละเอียดเต็มในไฟล์

-- v0.4.12 promo scope (scripts/sql_promo_scope.sql) — รันแล้ว 2026-07-05
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS scope_type TEXT NOT NULL DEFAULT 'all';
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS scope_value JSONB DEFAULT '[]'::jsonb;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS show_suggested BOOLEAN NOT NULL DEFAULT false;

-- v0.4.13 packages RLS (scripts/sql_packages_rls.sql) — รันแล้ว 2026-07-05
-- เพิ่ม RLS policy anon select/insert/update/delete ให้ packages + package_items — รายละเอียดเต็มในไฟล์

-- v0.4.14 promo stack (scripts/sql_promo_stack.sql) — รันแล้ว 2026-07-05
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS stackable BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS scope_mode TEXT NOT NULL DEFAULT 'include';

-- u0.4.24 set/course builder (scripts/sql_package_sets.sql) — รันแล้ว
ALTER TABLE packages ADD COLUMN IF NOT EXISTS groups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS delivery_rounds INT DEFAULT 1;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS flexible_delivery BOOLEAN DEFAULT false;

-- u0.4.32 payment_status (scripts/sql_payment_status.sql) — รันแล้ว 2026-07-22
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';

-- u0.4.34 แพคส่งฟรี (scripts/sql_pkg_free_shipping.sql) — รันแล้ว 2026-07-22
ALTER TABLE packages ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;

-- u0.4.29 live presence (scripts/sql_live_presence.sql, m-track เตรียม) — รันแล้ว 2026-07-22
-- CREATE TABLE live_presence (...) + policy anon upsert — m dashboard นับคนออนไลน์

-- u0.4.35 Storage bucket (scripts/sql_storage_menu_images.sql) — รันแล้ว 2026-07-22
-- สร้าง bucket menu-images (public) + policy anon insert/update/select (สำหรับอัพรูปเมนู)
```

> เหลือแค่เช็คซ้ำได้ (ไม่แน่ใจว่ารันหรือยัง): `day_before_notified_at` ALTER ท้าย `sql_mp_deliveries.sql` (v0.4.1)

### ⏳ SQL พร้อมรัน ยังไม่รัน — `customer_preferences` (ปลดล็อกน้องนิว กลุ่ม 1 ข้อ 2)
```sql
create table if not exists customer_preferences (
  customer_id     text primary key,       -- ให้ตรงกับ key ตาราง customers
  dislikes        text        default '',
  allergies       text        default '',
  liked_menus     jsonb       default '[]'::jsonb,
  disliked_menus  jsonb       default '[]'::jsonb,
  updated_by      text,                    -- 'customer' | 'admin' | 'nong_niw'
  updated_at      timestamptz default now()
);
alter table customer_preferences enable row level security;
create policy "cp_all_anon" on customer_preferences for all using (true) with check (true);
```
⚠️ ปรับ RLS ให้ตรงกับตาราง customers/orders เดิมก่อนรัน · dislikes/allergies เป็น free text (น้องนิวซึ่งเป็น LLM แมตช์กับเมนูเอง ไม่ต้อง tag/dropdown ตายตัว) · allergies treat เข้มกว่า dislikes

### ⏳ SQL พร้อมรัน ยังไม่รัน — `web_events` (attribution เว็บใหม่ — ดูหัวข้อ Marketing Track)
```sql
create table if not exists web_events (
  id uuid primary key default gen_random_uuid(),
  event text not null,              -- 'pageview' | 'cta_click'
  page text,                        -- 'index' | 'mealplan' | 'blog:slug'
  utm_source text, utm_medium text, utm_campaign text,
  referrer text, ua text,
  created_at timestamptz default now()
);
alter table web_events enable row level security;
create policy "we_insert_anon" on web_events for insert with check (true);
-- อ่านผ่าน dashboard/report เท่านั้น — ไม่เปิด select ให้ anon
```

### Storage
- `menu-images` (Public) ✅ — **สร้างจริง + policy anon upload แล้ว (u0.4.35)** · มีรูปเมนู 70 ตัว `{code}.jpg` (u0.4.36) · LIFF การ์ดใช้ transform ย่อ: `/storage/v1/render/image/public/menu-images/{code}.jpg?width=N` (ดู `thumbUrl()`)
- `card-images` (Public) ✅ — ⚠️ anon **เขียนไม่ได้** (ไม่มี policy insert — ต่างจาก menu-images) ถ้าจะอัพต้องเพิ่ม policy

---

## 🏠 HomeGrid Architecture (สำคัญมาก)

**HomeGrid card = entry point เดียวสำหรับทุก product type**
Admin จัดการผ่าน `home_editor.html` — ไม่มี hardcode bands

**Card click routing** ใน `colCardClick(el)` อ่าน `data-cat` (= `item_filter.category`):
```
__pkg:{uuid}__        → openPackage(uuid)     — Package picker
__meal_plan__         → openMealPlanPicker()  — Meal Plan picker
__anchor__            → scroll to menu list
__anchoritem:{code}__ → jumpToMenuItem(code)  — เลื่อนตรงไปเมนูใดเมนูหนึ่งเป๊ะๆ (v0.4.21)
{category}            → jumpCat(category)     — scroll to category
```

**HE dropdown "ลิ้งไปที่"** มีตัวเลือก:
- ไม่ลิ้งไปไหน
- ⬇ เลื่อนลงไปที่เมนู (`__anchor__`)
- 🥗 Meal Plan (`__meal_plan__`)
- 📦 Package S/M/L (โหลดจาก Supabase `packages` table)
- 🎯 เมนูเฉพาะ (anchor point — เลื่อนตรงไปเมนูใดเมนูหนึ่ง เช่น S001, เหมาะปักหมุดเมนูประจำสัปดาห์)
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

> ⚠️ **เขียนข้อมูลจริงระหว่างทดสอบ:** หลายฟังก์ชัน (`clickMenu()` ใน OH, ปุ่มสถานะใน KQ ฯลฯ) เขียนลง Supabase ทันทีที่คลิก ไม่ใช่แค่ preview เฉยๆ — เคยเผลอเขียนทับแถวทดสอบจริงมาแล้ว (revert คืนผ่าน curl PATCH ได้) ระวังเวลาทดสอบ flow ที่เกี่ยวกับข้อมูลลูกค้า/ออเดอร์จริง

---

## 🚀 Current Version: u0.4.36 (payment status + ระยะขับจริง + แพคส่งฟรี + รูปเมนู 70/thumb) + เว็บ live (m0.2) — ✅ push แล้ว

> **22 ก.ค. 2026 — เปิดใช้ LIFF จริง (ก่อน beta) + งานหลายก้อน:** payment_status 3 หน้า (LIFF assume สลิปจริง→OH toggle→KQ badge) · ค่าส่ง**ระยะขับจริง** (Google Distance Matrix แทน haversine) · **แพคเกจติ๊กส่งฟรี**ได้ใน DB · **รูปเมนู 70 ตัว**ดูดจากโบรชัวร์ Drive → Supabase Storage + การ์ดใช้ **thumb ย่อ (image transform) + lazy** โหลดไว · live presence heartbeat (m-track dashboard) · **migrate: import แล้ว 7,577 ออเดอร์เก่า** (ดูหัวข้อ migrate) · **เหลือก่อนเปิดจริง:** Enable Distance Matrix API + เทส iOS/ข้ามเครื่อง + สั่งเทส 1 ออเดอร์ (ดู `TODO.md` กลาง)

> **13 ก.ค. 2026 — OH set/course builder v1 (ตอบ requirement "กินลูกค้าทุกความต้องการ"):** แอดมินสร้างเซ็ต/คอร์ส/บันเดิลเองในหน้า DB (กลุ่มการเลือก + กดซ้ำได้ + ราคาเหมา + แบ่งรอบส่ง/เลือกวัน) → ลูกค้าสั่งใน LIFF (popup + ปุ่ม +/- + subcode) · เหลือ multi-round delivery split (ก้อนสุดท้าย) · **แก้ความเข้าใจใหญ่: 2 แกนการผลิต (ทำสด vs ทำสต็อค) — ดูหัวข้อ "⚠️ 2 แกนการผลิต"** · เว็บ/บล็อค copy ปรับให้ครอบคลุมคอร์สสต็อก (WS2)
> **🔀 ช่วงนี้นัทรัน 2 session ขนาน:** **u-track** (แชทนี้ — โค้ดหลังบ้าน `main_database_v2`/`liff_*`/OH/KQ/HE + ดูแล CLAUDE.md) · **m-track** (`web/`, `report.html`, blog, รูป, CTA — เขียน `MKT_HANDOFF.md` มาให้ merge) · กติกากันทับ: add เฉพาะไฟล์ตัวเอง (ห้าม `git add -A`) + pull ก่อน push ทุกครั้ง

> **12 ก.ค. 2026 — เคลียร์ handoff Step 1–4 รอบเดียว (ทุกงานเลนโค้ดที่ทำแทนนัทได้):**
> - **Step 1/1.5 (m-track):** เว็บสาธารณะใหม่ deploy แล้วที่ `under360-system.vercel.app/web/` (index/mealplan/blog — เทสผ่าน desktop, render + goal switcher + ไม่มี console error) · web_events tracking (pageview+cta_click) ทุกหน้า · Web Dashboard ต่อใน OH sidebar
> - **Step 2 (m-track):** ดูด 18 บทความจาก Wix sitemap จริง (100% สำเร็จ ผ่าน workflow 18 agents) → `web/import_blog.html` รวม 20 บทความ (6 ตั้ง published=false รอนัทรีวิว)
> - **Step 4 (u0.4.23):** LIFF Meal Plan สั่งได้ถึง 8:30 น. ของวันส่ง (verify แล้ว cutoff เดิม=18:00 ไม่ใช่ 17:00) · DB ปุ่ม Export เมนู CSV/JSON
> - **สิ่งที่นัทต้องกดเอง (บัญชี/เครื่อง/ข้อมูล) → ดู `WEB_LAUNCH_TODO.md`:** รัน SQL (blog_posts/web_events/customer_preferences), import blog, Google Ads (conversion action + Brand Defense), Vercel LINE token, iOS test, IG Behold, ชีท HP/LC
> - Step 3 (Google Ads) = Claude เตรียมครบใน CLAUDE.md/WEB_LAUNCH_TODO แล้ว รอนัทกดในคอนโซล (Claude สร้างแคมเปญเองไม่ได้)

> ✅ ยืนยัน 2026-07-05: SQL 3 ไฟล์ (promo_scope/packages_rls/promo_stack) รันแล้ว **ไม่มี SQL ค้างฝั่งโค้ดเดิม** · **SQL ใหม่ที่ยังไม่รัน (รอนัท): `sql_blog_posts.sql`, `sql_web_events.sql`, `customer_preferences`** — โค้ดทุกจุด catch error รองรับไว้แล้ว (เว็บ/dashboard/tracking ไม่พังถ้ายังไม่รัน)

> v0.3.3 คือเวอร์ชันสุดท้ายที่เคย log ไว้เป็นทางการ — หลังจากนั้นมีงานใหญ่หลายอย่างเข้ามาต่อเนื่องโดยไม่ได้ bump เลขไว้ทุกจุด ตารางล่างคือสรุปรวมให้ตามทัน:

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
| v0.4.6 | Activity Log — แถบประวัติการเปลี่ยนแปลง+เติมสต็อก (batch ต่อ session+ประเภท, debounce 3 วิ กันสแปม) ที่หัว DB + log จาก HE ด้วย | `520aa68` |
| v0.4.7 | Optimize `main_database_v2.html`: ลบข้อมูล seed ที่ import ครั้งเดียวไปแล้วทิ้งทั้งหมด — ไฟล์ลดจาก 778KB → 330KB (**-58%**) ไม่กระทบฟีเจอร์ที่ใช้จริงเลย | `93e20ca` |
| v0.4.8 | **แก้บั๊กร้ายแรง:** คลิกเมนูใดๆ ในหน้า liff พังจริง (throw error เงียบๆ — `openProduct()` อ้าง HTML ที่ไม่เคยมีอยู่จริง) + เพิ่มคลิกชื่อเมนู→ป้อบอัพ และคลิกรูป→lightbox + แก้รูปเมนูไม่เคยโชว์ (`item.image_url`→`item.image_urls[0]`, 6 จุด) + แก้ badge/limit สต็อกหายในการ์ดพรีวิวหน้าแรก | `5020fc9` |
| v0.4.9 | แก้ตามที่นัทเทสจริง: "หมดแล้ว" ต้องขึ้นทันทีที่ลูกค้าใส่ตะกร้าครบสต็อก (`isOut` เช็คจาก remaining แทน) + lightbox ขึ้นกรอบเปล่าแทนที่จะไม่ทำอะไรเมื่อเมนูยังไม่มีรูป | `d79272d` |
| v0.4.10 | จากผลเทสแอดมิน (คอมเมนต์ 7 ข้อ): แก้ sort_order เมนูทุกหมวดที่ไม่เคยตั้งเลย + เจอ**แท็บโปรโมชั่นไม่มีปุ่มนำทางใน OH เลย** + เปิดใช้หน้า "ตั้งค่า" + **แก้บั๊กแต้มลูกค้าโชว์ผิด** (`liff_profile.html` อ้างคอลัมน์ `points` ที่ไม่มีจริง) + เพิ่มช่องช้อนส้อมที่เช็คเอาท์ | `8b21320` `de73b82` `dfd7594` |
| v0.4.11 | ระบบ "ชุด Meal Plan" — ย้าย MP_SETS จาก hardcode ในโค้ดไปเป็นตาราง `mp_offer_sets` แก้ราคาเองได้ที่หน้า DB | `fb42370` |
| v0.4.12 | โปรโมชั่นเจาะจงสินค้า/แพคเกจ/มีลแพลน + โค้ดแนะนำที่เช็คเอาท์ — ดูหัวข้อ "🎁 Promo Scope + โค้ดแนะนำ" ด้านล่าง | `0be063f` |
| v0.4.13 | **แก้บั๊ก "สร้างแพคเกจไม่สำเร็จ"** (RLS policy ไม่เคยมีให้ anon เขียน `packages`/`package_items` เลยตั้งแต่สร้างตาราง) + **แก้ไขโค้ดโปรโมชั่นได้แล้ว** (เฉพาะ `used_count===0`) + เพิ่มปุ่มลบสินค้าหมดสต็อกออกจากตะกร้า + **รื้อระบบขนาด Card ใน HE ใหม่ทั้งหมด** → 4 ฟอแมตอิสระ | `608b0aa` |
| v0.4.14 | **โค้ดซ้อนกันได้ + scope แบบ "ยกเว้น"** + **แก้บั๊กการ์ดหน้าแรก liff ไม่โชว์ scroll** + **แก้บั๊กการ์ด "ทดลองสั่ง Mealplan" เปิดเป็นสัปดาห์/เดือนแทนที่จะเป็นทดลอง** | `c07a48c` |
| v0.4.15 | DB: ย้ายแถบหมวดหมู่ขึ้นเหนือแถบค้นหา + **แก้บั๊กลากเรียงลำดับ PTT (ปักหมุด) ใช้ไม่ได้เลย** (root-cause: commit `fe0eae7` 24 มิ.ย. ลบ `draggable="true"` ทิ้งโดยไม่ตั้งใจ) | `50f6fea` |
| v0.4.16 | HE: **การ์ด "จิ๋ว" 2 อันติดกันในลำดับ ซ้อนเป็นคอลัมน์เดียวอัตโนมัติ** | `c8ea61a` |
| v0.4.17 | **จตุรัส/เต็มผืน สูงไม่พอดีกับจิ๋วที่ซ้อนคู่/แนวตั้ง** — ปรับทุกฟอแมตให้สูง 230px เท่ากันหมด + **แก้บั๊ก liff การ์ดหน้าแรกถูกตัดขาว ไม่สุดจอ** | `ca1849b` |
| v0.4.18 | **เต็มผืนกว้างไป** — ปรับสัดส่วนเป็น 288×230 (5:4) + **เพิ่มลากเรียงลำดับ Card ใน HomeGrid ได้จริง** (เดิมไอคอน "⠿" ไม่เคยผูก event เลย) | `427ba66` |
| v0.4.19 | **เพิ่ม auto-scroll การ์ด Collage หน้าแรกให้ลูกค้าจริงเห็นด้วย** (เดิมมีแค่ใน HE preview ไม่เคยพอร์ตมา liff) | `e312ae5` |
| v0.4.20 | ปรับปรุงหน้า OH "แพลนเมนู" ครั้งใหญ่: panel "เมนูวันนี้" ผูกวันที่จริง + แก้บั๊ก checkbox ค้าง + เพิ่มสรุปรายวัน + วันที่เลยมาแล้วย้ายไป "▼ ดูประวัติ" | `69bf2ca` |
| v0.4.21 | **เพิ่มฟีเจอร์ "เมนูเฉพาะ" (anchor point)** — `scrollIntoView()` ผูกกับ DOM id ของการ์ดเมนูนั้นตรงๆ | `ff6a5b9` |
| v0.4.22 | **KQ — งานสุดท้ายก่อน beta test:** วันที่สั่ง/ส่งในการ์ด + ปุ่ม "↩ ยกเลิก" ให้ "ส่งแล้ว" (Meal Plan) + **ระบบ log ทุกครั้งที่กดปุ่มสถานะ** + ปุ่ม "👋 ตั้งชื่อ" | `f2293ef` |
| v0.4.23 | **Step 4 งานโค้ดค้าง:** LIFF Meal Plan cutoff → 8:30 น. ของวันส่ง (`CUTOFF_HOUR=18` เดิมสำหรับสต็อก + `MP_CUTOFF_HOUR/MIN=8/30` ใหม่, `renderDatePick` แยก startOffset ตาม isMeal, offset 0=วันนี้ได้ถ้าก่อน 8:30 + ตรง จ/พ/ศ) + DB `exportMenuFiles()` ปุ่ม "⬇ Export เมนู" โหลด CSV(BOM)/JSON | `e07fe3b` |
| m0.2 (web) | **Step 1/1.5/2 (m-track):** เว็บใหม่ /web live (Vercel) + web_events tracking ทุกหน้า + Web Dashboard ใน OH + blog 20 บทความ (`web/import_blog.html`) | `1f69381` |
| u0.4.24 | **OH set/course builder ครบวงจร v1** — แอดมินตั้งเซ็ต/คอร์ส/บันเดิล (กลุ่มการเลือก หมวด/รายเมนู + กดซ้ำได้ + ราคาเหมา + แบ่งรอบ/เลือกวัน) → ลูกค้าสั่งใน LIFF (popup sheet + ปุ่ม +/- qty + surcharge + subcode) · เหลือ multi-round delivery split · SQL: `scripts/sql_package_sets.sql` | `9ae4607`→`0517fcd` |
| u0.4.25 | **multi-round delivery split (ปิด workstream 1)** — เซ็ต `delivery_rounds>1` → checkout section แบ่งส่ง N รอบ + toggle "รับรวดเดียว" + date picker ต่อรอบ → submit สร้าง N orders (1 รอบ=1 order, รอบ 1 ถือเงินเต็ม, รอบ 2..N ยอด 0) · ไม่มี SQL ใหม่ | `d37de05` |
| u0.4.26 | **set builder กลุ่ม "หลายหมวด (รวมนับ)"** — kind `multicat`: 1 กลุ่มผูกหลายหมวด count เดียวคุมยอดรวมข้ามหมวด (ตอบเคส "ข้าวกล่อง+กับข้าว รวม 10 แบ่งเอง") · DB chip เพิ่ม/ลบหมวด + LIFF eligible รวมทุกหมวด · ไม่มี SQL ใหม่ | `b3855be` |
| u0.4.27 | **fix จากผลเทสนัท (รอบเทส set builder):** ① ลบ Meal Plan ออกตะกร้า → date picker ปลดล็อกกลับมาเลือกทุกวัน (เพิ่ม `syncCartDeps`) ② multicat dropdown โชว์จำนวนเมนูต่อหมวด "(N)" กันเลือกหมวดว่าง ③ ซ่อนช่อง "จำนวนกล่อง" เมื่อแพคมีกลุ่ม (ซ้ำซ้อน) ④ layout แถวเมนู DB — ขยาย breakpoint ชื่ออยู่บรรทัดเต็มถึง 860px (จอ>520px ไม่ถูกบีบ) | `90adcfd` |
| u0.4.28 | **LIFF perf + ลบปุ่ม Export:** init เดิม await เรียงกัน ~7 รอบ → `Promise.allSettled` batch เดียว + รวม kitchen_data 4 คีย์เป็น 1 query (`.in`) → splash เร็วขึ้นชัด · ลบปุ่ม "Export เมนู" + `exportMenuFiles` ตามที่นัทสั่ง (เมนูยังไม่นิ่ง) | `505f0c1` |
| u0.4.29 | **live presence heartbeat** — LIFF upsert `live_presence` ทุก 15 วิ (เฉพาะตอน tab visible) → m-track dashboard นับคนเปิดแอป real-time · SQL `sql_live_presence.sql` (m เตรียม, นัทรัน) | `9420c93` |
| u0.4.30 | **fix จากผลเทส:** คลิกรูปในป้อบอัพเลือกเซ็ต → lightbox · date picker หลายรอบ: วัน ≤ รอบก่อน = เทา (บังคับเพิ่มขึ้น) + default chain · note "สินค้าอื่นรวมรอบ 1" · หน้าสรุปสำเร็จโชว์ชื่อรายการที่สั่ง | `095fd92` |
| u0.4.31 | **ค่าส่งใช้ระยะขับจริง** — `updateRoadDistance()` เรียก Google Distance Matrix (มากับ Maps JS) แทน haversine เส้นตรง · โชว์ haversine ทันที แล้วแทนด้วยระยะขับจริง · กัน race + fallback เงียบ · zone ยังใช้เส้นตรง (รัศมี) · ⚠️ ต้อง enable Distance Matrix API บน key | `dbf9d7d` |
| u0.4.32–33 | **payment_status** (สถานะโอนเงิน แยกจาก status ครัว) — LIFF: อัพสลิป→`paid` อัตโนมัติ (beta assume จริง) · OH: badge 💰โอนแล้ว/⏳รอโอน กดสลับได้ (mark โอนผ่านไลน์) +📎 · KQ: badge read-only · SQL `sql_payment_status.sql` (นัทรันแล้ว) | `39eb93d`·`b973188` |
| u0.4.34 | **แพคเกจติ๊ก "ส่งฟรี"** ได้ใน DB (`packages.free_shipping`, capability-safe) → LIFF ยกเว้นค่าส่งทั้งออเดอร์ถ้าตะกร้ามีแพคส่งฟรี · SQL `sql_pkg_free_shipping.sql` (นัทรันแล้ว) · + master "Delivery Reality" แก้เนื้อแท้ค่าส่ง | `8077101` |
| u0.4.35 | **SQL bucket menu-images + policy** — `sql_storage_menu_images.sql` (นัทรันแล้ว): สร้าง bucket public + policy anon insert/update/select (เดิม anon เขียน Storage ไม่ได้) | `404a3d2` |
| u0.4.36 | **รูปเมนู 70 ตัว** — ดูดโบรชัวร์ Drive 7 โฟลเดอร์ (browser DOM ดึง file ID) → จับคู่ code เป๊ะ → download→Storage `menu-images`→`image_urls` (A/No/1A-3E/SM/PL/BB · verify ชื่อตรง) · **การ์ดใช้ `thumbUrl()` (Supabase image transform ย่อ width=) + `loading=lazy`** โหลดไว, lightbox ใช้ full · online 77 เมนู มีรูป 70 | `6eb2e74` |

*หมายเหตุ: เลข version ช่วง v0.3.4–v0.4.4 เป็นการ backfill ประมาณช่วงเวลาจาก commit log ไม่ใช่เลขที่ตั้งใจ bump ไว้ตอนนั้นทุกจุด — นับจากนี้จะ log ให้ตรงเวลาจริงมากขึ้น ใช้ prefix `u` ตามระบบเวอร์ชัน 4 แทร็คใหม่

### ⚠️ Known Issues
| # | ปัญหา | Priority |
|---|-------|----------|
| 1 | ✅ แก้แล้ว — DB tab "🍳 ผลิตวันนี้" ต่อ `mp_deliveries` จริงแล้ว | ✅ Done |
| 2 | `report.html` ยัง mock data ทั้งหมด | 🟡 นัทอยากได้เร็วขึ้น — ใช้วัด HP vs LC (เสา 3) |
| 3 | `liff_profile.html` ดึงข้อมูลจริงก่อนแล้ว เหลือ mock แค่ fallback ตอน query พัง | 🟢 ใกล้เสร็จ |
| 4 | `liff_register.html` ต่อ Supabase จริงแล้ว — ไม่ใช่ mock แล้ว | ✅ ไม่ใช่ปัญหาแล้ว |
| 5 | `LINE_CHANNEL_ACCESS_TOKEN` ยังไม่ตั้งใน Vercel env — cron ทำงานปกติแต่ไม่ส่ง LINE จริง | 🔴 ก่อน launch |
| 6 | KQ ต้องตรวจสอบว่าดึง order จริงจาก Supabase ได้ไหม (ทดสอบบน production) | 🔴 ก่อน launch |
| 7 | ✅ แก้แล้ว — สต็อกหลักที่การ์ดเมนูไม่เคย sync ขึ้น `menu_items.stock_total` จริง (ผูกกับ dead code) | ✅ Done |
| 8 | `mpIsoDate()` ในแท็บ "แผนผลิต" ใช้ `.toISOString().split('T')[0]` — pattern เดียวกับบั๊ก timezone UTC+7 ที่เคยแก้ไปแล้วในไฟล์อื่น แต่ยังไม่มีรายงานปัญหาจริง | 🟡 ระวังไว้ |
| 9 | ✅ แก้แล้ว — liff คลิกเมนูพังจริงตอนนี้มาตลอด (`openProduct()` อ้าง element ที่ไม่เคยมี) | ✅ Done |
| 10 | ✅ แก้แล้ว (u0.4.23) — verify แล้วว่า cutoff เดิม = **18:00** (นัทจำถูก, เอกสาร 17:00 ผิด) · Meal Plan เปลี่ยนเป็นสั่งได้ถึง 8:30 น. ของวันส่งแล้ว เมนูสต็อกคงเดิม | ✅ Done |
| 11 | 🆕 LIFF + เว็บใหม่ ยังไม่เคยเทสบน iOS Safari เลย — 🔴 นัทต้องเทสบน iPhone จริง (ดู WEB_LAUNCH_TODO กลุ่ม 5) | 🔴 ก่อน launch |
| 12 | 🆕 ราคา Meal Plan ในโค้ด vs ราคาที่ประกาศ (masternote) ไม่ตรงกัน — ดูกล่องเตือนในหัวข้อ Product Lines Line 2 · **เว็บ mealplan.html + ad copy ใช้ราคาโฆษณาแล้ว (LC1399/HP1699…) → เช็ค `mp_offer_sets` ให้ตรงก่อนเปิด Ads** | 🔴 ก่อนเปิด Ads แคมเปญ 2 |
| 13 | 🟡 ปุ่ม "⬇ Export เมนู" (เพิ่ม u0.4.23) **ถูกลบแล้ว u0.4.28** ตามที่นัทสั่ง — เมนู DB ยังไม่นิ่ง (หมวดซ้ำ เช่น pack_special ว่าง vs pack_regular) ยังไม่พร้อม export ไปลง platform · **งานลง delivery platform → รอเมนูนิ่งก่อน แล้วค่อยขอ export ใหม่** (โค้ดเดิมอยู่ใน git history commit `e07fe3b` ดึงกลับได้) | 🟡 Deferred |

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
- **คลิกชื่อเมนู → ป้อบอัพรายละเอียด** (`openMenuDetail()`, element `#mdOverlay`) — ชื่อ/โค้ด/แคลอรี่/โปรตีน/คำอธิบาย/ราคา + ปุ่มเพิ่มตะกร้า
- **คลิกรูปเมนู → lightbox ขยายเต็มจอ** (`openItemLightbox(id)` → `openLightbox(urls)`, element `#lbOverlay`)
- **Anchor jump:** `id="menu-item-{code}"` ทุกการ์ดเมนู + `jumpToMenuItem(code)` — สลับหมวดอัตโนมัติ + เลื่อนเป๊ะ + ไฮไลท์ 1.6 วิ
- **Auto-scroll การ์ด Collage หน้าแรก** — `startHomeAutoScroll()`/`stopHomeAutoScroll()` (rAF 1px/frame) หยุดถาวรทันทีที่ลูกค้าแตะ/ลากเอง (ไม่ resume ต่างจาก HE preview)
- **สต็อก:** ใช้ `effectiveStock()`/`menu_items.stock_total` เหมือนกันทั้งรายการเมนูหลัก (`renderMenu()`) และการ์ดพรีวิวหน้าแรก — `isOut` เช็คจาก **remaining** (stock−qty ในตะกร้า) ไม่ใช่แค่ `stock_total<=0` ตรงๆ

### Meal Plan Config (⚠️ ราคายังไม่ verify — ดูกล่องเตือนในหัวข้อ Product Lines)
```javascript
const MP_SETS = [
  { id:'trial',   label:'ทดลอง',      boxes:7,  price_hp:1499,  price_lc:1399  },
  { id:'weekly',  label:'1 สัปดาห์',  boxes:21, price_hp:3990,  price_lc:3790  },
  { id:'monthly', label:'1 เดือน',    boxes:84, price_hp:13990, price_lc:13490 },
];
// v0.4.11: MP_SETS ถูกย้ายไปเป็นตาราง mp_offer_sets แล้ว แก้ราคาที่หน้า DB ได้เลย
// ค่าฮาร์ดโค้ดนี้เหลือเป็น fallback — เช็คว่า mp_offer_sets ตรงกับราคาโฆษณาจริงก่อน launch
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

### ⚡ Optimize ขนาดไฟล์ (v0.4.7)
ไฟล์เคย 778KB (~55% เป็น hardcoded seed array ที่ import ครั้งเดียวตอน deploy ครั้งแรกแล้วไม่มีวันรันซ้ำ) — **ลบแล้ว ไฟล์เหลือ 330KB (-58%)** ไม่กระทบฟีเจอร์ที่ใช้จริงเลย

**ถ้าเจอสูตรที่ยังไม่ได้ import เข้าระบบในอนาคต:** ส่งไฟล์ Excel ให้ Claude วิเคราะห์แล้วใส่เข้า Supabase ตรงๆ ได้เลย — **ไม่ต้อง**กลับไปฝัง hardcoded array ในโค้ดแบบเดิมอีก

### Tabs
เมนู · วัตถุดิบ · Meal Plan · 📦 แพคเกจ

### Tab แพคเกจ
- สร้าง/แก้ Package S/M/L ได้เอง · Checkbox เมนู active + extra_price ต่อ SKU · Save = delete + insert ใหม่ใน `package_items`

### Tab Meal Plan — 2 sub-view คนละเรื่องกัน (ทั้งคู่ต่อข้อมูลจริงแล้ว)
- **"📅 แผนผลิต"** — กริดวางแผนผลิตหลายวันของครัวโดยรวม ต่อ `daily_menu_assignments` จริง — คนละเรื่องกับ Meal Plan ระยะยาวรายลูกค้า (`mp_deliveries`)
- **"🍳 ผลิตวันนี้"** — ให้ครัวดูว่าวันนี้ต้องผลิต/แพ็คอะไรบ้างสำหรับ Meal Plan ระยะยาว โดยไม่ต้องสลับไปหน้า KQ (นำทางวันที่ + สรุปรอบ/HP/LC + aggregate เมนูต้องผลิต + ช่องโน้ตแก้เมนูฉุกเฉิน)

### จัดการหมวดหมู่
- ปุ่ม 🔗 รวม ต่อแถวหมวด · rename ชื่อซ้ำ → บล็อกทันที · แถบหมวดลากเลื่อนซ้ายขวาด้วยเมาส์ได้ (อยู่เหนือแถบค้นหาตั้งแต่ v0.4.15)

---

## 📋 What's in home_editor.html (v0.4.21)

- dropdown "ลิ้งไปที่" มี 🥗 Meal Plan + 📦 Package + 🎯 เมนูเฉพาะ options — โหลด packages/menu items จาก Supabase ก่อน render

### 🖼️ Card Format (v0.4.13–v0.4.18) — 4 ฟอแมตอิสระ ไม่มีระบบจับกลุ่ม/solo อีกต่อไป
| Format | ขนาด (px, อ้างอิงหน้าจอ 390px) |
|--------|-------------------------------|
| ◼ จตุรัส (square) | 230×230 |
| ▯ แนวตั้ง (portrait) | 150×230 |
| ▬ เต็มผืน (full) | 288×230 (5:4) |
| ▪ จิ๋ว (tiny) | 110×110 (คู่ที่ซ้อนกัน = 110×230) |

ค่า px เดียวกันเป๊ะทั้งใน HE (`renderPrevCard()`) และ `liff_customer.html` — พรีวิวใน HE = สิ่งที่ลูกค้าเห็นจริง 100%

**เก็บข้อมูล:** ใช้คอลัมน์ `col_span` เดิม (int) encode 1-5 แทนชื่อ format — `tiny=2, portrait=3, square=4, full=5` (ค่าเก่า 2/4 จาก small/large ยุคก่อนอ่านถูกต้องอัตโนมัติ ไม่ต้อง migrate)

**ลากเรียงลำดับ Card ได้แล้ว (v0.4.18):** ไอคอน "⠿" ใช้ pattern เดียวกับลากเรียงหมวดเมนู (`catDragStart`/`catDrop`)

**จิ๋ว 2 อันติดกัน → ซ้อนเป็นคอลัมน์ (v0.4.16):** class `.col-tiny-stack`/`.col-tiny-stack-he` สูงรวม 230px — โดดเดี่ยวไม่มีคู่ยังคงเดี่ยว 110×110

---

## 🗺️ Roadmap

| Version | งาน | สถานะ |
|---------|-----|-------|
| u0.3.1–0.3.3 | Order flow · Package S/M/L · Meal Plan flow + Pre-order | ✅ Done |
| u0.3.4 | Product images (`batch_photo_upload.html`) | 🟡 เขียนเสร็จแล้ว ยังไม่เคยรัน ดู "📸 Photo Migration" |
| u0.3.5 | OH Admin Tools | ✅ ทำครบตามที่วางแผนไว้ |
| u0.4.22 | KQ (หน้าสุดท้ายก่อน beta) | ✅ ลงแล้ว |
| — | **Beta test แบบ parallel กับ Hato** — แอดมินกดออเดอร์จริงลงมือคู่ขนานไปก่อน เพื่อเจอบั๊กก่อนใช้จริง | ⏳ รอเริ่ม |
| — | Migrate ลูกค้า + **ประวัติสั่งซื้อ Hato** | 🟢 **กำลังทำ (migrate-track)** — **import แล้ว 7,577 ออเดอร์เก่า + 2,304 ลูกค้า** (22 ก.ค.) จาก 2 report Hato (LIFF `HT-` 6 ด. + HatoStore `HS-` 23 ด.) idempotent ไม่ทับ tier/loyalty · **ยังขาด:** LIFF อีก 19 ด. · **`order_items` รายเมนู** (ยังไม่มีใน report ไหน → ขอ "รายงานรายสินค้า" — บล็อกน้องนิว) · Hato >2 ปี + pre-Hato · pipeline (email→Drive flidty.c@→curl) จดใน memory `migrate-customer-order-history` |
| — | Facebook Chatbot (`api/webhook.js` configure) | ⏳ หลัง migrate |
| — | 🆕 เว็บ Vercel 5 หน้า + ย้ายโดเมน (Marketing กลุ่ม 3) | ⏳ ตอนกลับถึงคอม — ดู "🌐 เว็บใหม่" |
| v0.4 | **AI Agents** — นิว→เก่ง→ฟ้า→เตียง→เอิธ (ดูหัวข้อ 🤖 ด้านล่าง) | ⏳ ยังไม่เริ่มสักตัว (น้องนิว spec locked แล้ว) |
| v1.0 | ปิด Hato Heart = **Under360 Base** | 🏁 Full Launch |

---

## 📸 Photo Migration (`batch_photo_upload.html`) — ตรวจสอบแล้ว พร้อมใช้แบบมีคนคุม

**สรุป:** ไฟล์นี้เขียนเสร็จสมบูรณ์แล้ว — flow: อ่าน `All_menu.xlsx` หา SKU → โหลด `menu_items` จริงจาก Supabase → ลากรูปโบรชัวร์เข้ามา → ส่งรูปให้ Claude Vision หาตำแหน่ง+ชื่อแต่ละเมนู → crop อัตโนมัติ → fuzzy match ชื่อกับเมนูจริง (fuzzy score ≥0.82 = auto-select) → ตารางรีวิวให้เช็ค/แก้ทีละแถวก่อน → อัพโหลดเข้า Storage bucket `menu-images` จริง + PATCH `menu_items.image_urls` จริง

**ต้องมีอะไรก่อนรัน:** เปิดไฟล์ในเบราว์เซอร์ตรงๆ ใส่ Anthropic API key ของตัวเอง (เก็บ localStorage เครื่องตัวเองเท่านั้น) — **ไม่ควรแชร์ลิงก์นี้ให้คนนอก** เพราะ key ฝังอยู่ฝั่ง browser ตรงๆ

**⚠️ ความเสี่ยงที่ควรรู้ก่อนรันจริงกับโบรชัวร์ทั้งชุด:**
1. `image_urls` array ไม่มีการจำกัดจำนวน — DB โชว์แค่ 4 ช่องแรก แปลว่าถ้ารันหลายรอบ array จะยาวขึ้นเรื่อยๆ แบบไม่โชว์ผล
2. Path อัพโหลดคือ `{sku}.jpg` แบบ upsert=true — รูปเก่าจะถูกทับเงียบๆ ไม่มี confirm ไม่มี versioning
3. threshold 0.82 ยังไม่เคยทดสอบกับชื่อเมนูจริงของร้าน — แนะนำเช็ค auto-selected ทุกแถวก่อนกด upload จริง

**คำแนะนำ:** ลองรัน 1 โบรชัวร์ก่อน → เช็คว่า DB ยังโชว์ 4 ช่องรูปถูกต้อง → ค่อยไล่ทำทั้งชุด

---

## 📜 Activity Log — ประวัติการเปลี่ยนแปลง + ประวัติเติมสต็อก (v0.4.6 — ✅ SQL รันแล้ว)

`scripts/sql_activity_log.sql` — ใช้งานได้ปกติ

**ดีไซน์:**
- **Batch ต่อ (browser session + ประเภทการกระทำ)** — session ใหม่ทุกครั้งที่เปิดหน้า DB
- **Debounce เขียนจริง 3 วิ** — กด +10/+1 ติดกันหลายครั้งสะสมในหน่วยความจำก่อน
- **action_type:** `stock` · `category` · `package` · `he_layout` · `kq_status` (v0.4.22 — ไม่ batch, log ทุกคลิกเพราะเป็นเรื่อง accountability)
- **ไม่ครอบคลุม (ตัดสินใจไว้แล้ว):** แก้ field เดี่ยวๆ ในสูตร (ชื่อ/ราคา/วัตถุดิบ) ยังไม่ log — พื้นผิวกว้างเกินไป
- **UI:** แถบบางที่หัว DB โชว์กิจกรรมล่าสุด กดปุ่ม "ประวัติ ▼" ดูย้อนหลัง 50 รายการ — query ไม่กรอง source เลยเห็น log จาก KQ ในหน้าเดียวกันด้วยอัตโนมัติ
- **ใครแก้:** `state.currentUser` ที่ DB / `localStorage['lastNickname']` ที่ HE+KQ (คีย์เดียวกัน — ต้องเคยกรอกชื่อที่หน้า DB เครื่องเดียวกันมาก่อนอย่างน้อย 1 ครั้ง ไม่งั้น HE จะโชว์ "ไม่ทราบชื่อ")

---

## 🎁 Promo Scope + โค้ดแนะนำ + ซ้อนโค้ด (v0.4.12–v0.4.14 — เขียนเสร็จ ทดสอบผ่าน + SQL รันแล้ว)

**ที่มา:** โค้ดส่วนลดที่ใช้ได้เฉพาะสินค้า/แพคเกจ/มีลแพลน + toggle "แนะนำ" ให้ลูกค้าเห็นเลยที่เช็คเอาท์ (แตะใช้ได้ทันที) + v0.4.14 ต่อยอด: บางโค้ดซ้อนกันได้ + scope แบบ "ยกเว้น"

**Schema (`promo_codes`):**
- `scope_type` — `'all'` · `'sku'` · `'package'` · `'mp_offer'`
- `scope_value` — jsonb array: sku→`menu_items.code`, package→`packages.id`, mp_offer→`mp_offer_sets.set_key`
- `scope_mode` — `'include'` (เฉพาะที่เลือก) หรือ `'exclude'` (ทุกอย่างยกเว้นที่เลือก)
- `show_suggested` — true = โชว์เป็น chip แนะนำที่หน้าเช็คเอาท์ลูกค้า
- `stackable` — true = ใช้ร่วมกับโค้ด "ซ้อนได้" อันอื่นพร้อมกันได้

**Admin (`operation_hub.html` แท็บโปรโมชั่น):** picker เลือกเมนู/แพคเกจ/มีลแพลน + toggle include/exclude + checkbox แนะนำ/ซ้อนได้ — แก้ไขโค้ดได้เฉพาะ `used_count===0`

**Customer (`liff_customer.html`):** `appliedPromos` เป็น array — chip "🎁 โค้ดแนะนำสำหรับคุณ" แตะใช้ทันที

**กติกาซ้อนโค้ด:** `stackable=true` + `stackable=true` → รวมกัน (กันลดเกินยอดด้วย `Math.min`) · โค้ดไม่ซ้อนได้ apply ทับ → แทนที่ทั้งหมด · โค้ดเดิมซ้ำ → reject

**Capability-check:** ถ้ายังไม่รัน SQL — OH ซ่อน UI ที่เกี่ยวข้อง โค้ดแบบเดิมยังใช้งานได้ปกติ

---

## 🚚 ลูกค้าสั่ง 2 รอบที่เดียวกัน ไม่คิดค่าส่งซ้ำ — ❌ ยกเลิกแล้ว (2026-07-04)

นัทตัดสินใจไม่ทำ ("อาจจะยากไป") — ข้อเสนอเดิมอยู่ใน git history ของไฟล์นี้ (commit `80f1d57`)

---

## 🧭 Positioning & Brand Strategy (เคาะแล้ว 8 ก.ค. 2026)

> **"ไม่ขายคลีน — ขายอาหารที่เข้ากับเป้าหมายและไลฟ์สไตล์ของคุณ โดยมีโปรตีนเป็นแกน"**

- เทรนด์ "อาหารคลีน" จบแล้ว ตลาดแตกเป็น dietary ตามไลฟ์สไตล์ — แต่ทุกสายมีโปรตีนเอี่ยวหมด
- **2 ชั้นที่ต้องแยก:** ชั้น keyword (คนพิมพ์ "อาหารคลีน delivery") ใช้เป็น SEO doorway เท่านั้น vs ชั้น positioning จริง (Real Food/Balanced Diet/โปรตีนเป็นแกน)
- **ตัวชูโรง = Meal Plan ทั้งไลน์ (HP+LC) — โปรโมทเป็นคู่เสมอ** อย่าเรียกแค่ HP
- **กลยุทธ์กำลังพล (แก้ 21 ก.ค. — เดิม "แรง 100% MP"):** **ดันทั้ง MP + Stock/Package เต็มที่ แต่แยกกลุ่ม** — ลูกค้า MP กับ Stock คนละกลุ่มแต่อยู่ OA เดียวกัน · ตอนนี้ยอดตกหนัก ต้องการกระแสเงินสดเร็ว → **Stock/Package ปิดง่ายกว่า (฿165 vs ฿1,399)** · บันไดลูกค้าใหม่: **Package (ไม่ผูกมัด) → กินติด → ขยับเป็น Meal Plan** · ตจว./แพ็คกับข้าว = passive only เหมือนเดิม
- **สนามรบ:** ไม่สู้บน Shopee (แพ้เชิงโครงสร้าง) → ย้ายไปสนาม Google Search/บทความ/AI search/รีวิว ที่ชนะด้วยโดเมนอายุ 10 ปี + เนื้อหา ซื้อทางลัดไม่ได้
- **มุมเล่าที่คู่แข่งเลียนแบบยาก:** ร้านช่วยออกค่าส่งให้ลูกค้า (subsidize 3-5 หมื่น/เดือน — **คำภายในเท่านั้น**) · **ประสบการณ์ 10 ปี + เริ่มเน้นปรุงสด** (จุดใหม่ที่เพิ่งชู — 10 ปี = อายุร้าน/ประสบการณ์ ไม่ใช่ระยะเวลาปรุงสด ห้ามผูก "ปรุงสด 10 ปี") · จัดเมนูเฉพาะคน ตัดของแพ้อัตโนมัติ

### 🍜 ปรัชญาอาหาร + ตัวตนแบรนด์ (วัตถุดิบสำหรับ copy/content ทุกชิ้น)
> **แก่นเดียว:** "ไม่ใช่คลีนจนทรมาน ไม่ใช่ตามใจปากจนพัง — แต่คือ *พอดี* ที่กินได้ทุกวันจริงๆ อร่อยด้วย สุขภาพดีด้วย โปรตีนแน่นเป็นแกน"

- **การเดินทางแบรนด์:** เริ่มจากคลีนสายแข็ง (อกไก่เท่านั้น ไม่เอา processed food) → บทเรียน: ไม่อร่อย+ไม่ยั่งยืน → ปรับเป็น Balanced Diet/Real Food อร่อยกินได้จริง
- **คุม 3 ตัวร้ายให้ "พอดี" ไม่ใช่ "ตัดทิ้ง":** น้ำมันรำข้าว add-on ≤5g/เมนู · น้ำตาลพอดี · โซเดียมกว่า 90% ของเมนูต่ำกว่าตลาด/อาหารข้างทาง · ไม่เคลมสมบูรณ์แบบแต่เลี่ยง ultra-processed ให้มากสุด
- **จุดเด่นวัตถุดิบ:** โปรตีนดิบ LC 120g / HP 170g · ข้าวเปลี่ยนจากไรซ์เบอรี่เป็น **ข้าว กข 43** (อร่อยเหมือนหอมมะลิ ดัชนีน้ำตาลต่ำ — ไม่ใช่ทุกเมนู)
- ⏳ ค้าง: สัมภาษณ์ไลฟ์สไตล์พลอย (ยังไม่จบ — เก็บไว้ทำตอนมีเวลายาวๆ)

**🖊️ กฎเขียน copy — ใช้ทุกครั้งที่แต่งคอนเทนต์/โฆษณา:**
- ไม่โม้ว่าดีที่สุด — ให้ความรู้ก่อนแล้วแสดงว่าเราตอบโจทย์
- โปรโมท **HP+LC คู่เสมอ**
- ห้ามดิสแช่แข็ง (เราขายฟรีซแพ็คเอง) · **ห้ามเขียน "เลือกเวลา/วันส่งได้" เฉพาะ Meal Plan (ทำสด จ/พ/ศ)** — ⚠️ คอร์ส/บันเดิลจากของ **ทำสต็อค** ทำล่วงหน้า **เลือกวันส่งได้** เขียนได้ (ดู "⚠️ 2 แกนการผลิต")
- ใช้จุดจริงได้: น้ำมันรำข้าว/≤5g · โซเดียมต่ำ 90% เมนู · ข้าว กข 43 · โปรตีน 120/170g · เลี่ยง ultra-processed
- **ค่าส่ง (แก้ 16 ก.ค. โดยเอิธ · benchmark verify 22 ก.ค. `web/eath/delivery_fee_benchmark.md`):** "subsidize 30-50K/เดือน" = **context ภายในเท่านั้น** · **✅ เคลมได้:** "Meal Plan ส่งฟรีทุกแพ็คไม่มีขั้นต่ำ" (ชนะ 3/3 เจ้าที่มีข้อมูล) · "กทม. ส่วนใหญ่ฟรี เริ่มเพียง 20฿" · "ส่งทั่วไทย" (ตจว.~200฿ = จุดต่างจริง) · "ไม่ต้องคำนวณค่าส่งเอง" · **🚫 ห้ามเคลม:** "ถูกที่สุด"/"ถูกกว่าทุกเจ้า"/เทียบตัวเลข (ข้อมูลคู่แข่งไม่ครบ) · "ส่งฟรีทุกออเดอร์" (ผิด — เฉพาะ Meal Plan)
- **"ปรุงสด 10 ปี" = ผิด ห้ามใช้** → เขียน "ประสบการณ์ 10 ปี" หรือ "เริ่มเน้นปรุงสด" แยกกัน (10 ปี = อายุร้าน ไม่ใช่ระยะเวลาปรุงสด)

### 📜 ประวัติร้าน 10 ปี (บริบทสำหรับทุก session)
1. ยุคแรก: ข้าวกล่องอย่างเดียว หมุนเวียนรายสัปดาห์
2. ยุคขยาย: เพิ่มเมนูประจำ
3. ยุคเจาะ ตจว.: สร้างแพ็คกับข้าวฟรีซแพ็ค ส่งทั่วประเทศ
4. ยุคโดนตี: คู่แข่งชื่อ **"350"** ซื้อคีย์เวิร์ด "360" บน Shopee ทำให้ยอดแพ็คตก
5. ยุคปัจจุบัน: pivot มา Meal Plan (HP/LC) เป็นเรือธง — จุดที่ยืนอยู่ตอนนี้
- **ทีม:** นัท+พลอย (Thunyathorn) = สามีภรรยา เจ้าของร่วม — พลอยถนัดลุยเร็ว/หน้าบ้าน, นัทถนัดละเอียด/หลังบ้าน — จุดแข็งคนละแบบ ไม่ใช่ปัญหา
- นัทกำลังพิสูจน์ให้พลอยเห็นว่า "หลังบ้านใช้ AI ได้ผลจริง" ก่อนดึงพลอยเข้ามาใน workflow เต็มตัว

### 🚚 Delivery Reality (แก้ความเข้าใจเดิม — สำคัญต่อคอนเทนต์ทุกชิ้น)
- ส่งทั่วกรุงเทพ+ปริมณฑล (ปรุงสดรายวัน) และทั่วไทย (ฟรีซแพ็ค) — **ไม่ใช่ร้านเฉพาะย่าน**
- **ค่าส่ง (เนื้อแท้ — นัทยืนยัน 16 ก.ค.):** ร้านช่วยออกค่าส่งให้ (subsidize — คำภายใน) → ลูกค้าจ่ายถูกกว่าจริงเสมอ
  - **~200฿ = เพดานสูงสุด (max cap)** ที่คิดลูกค้า ต่อให้ส่งไกลแค่ไหน — **ไม่ใช่ราคาปกติ** · สำหรับส่ง **ตจว. (ฟรีซแพ็ค) 200฿ = ถูกมาก** (จุดต่าง ยังไม่เจอเจ้าคลีนไหนส่ง ตจว. เทียบได้)
  - **range จริงส่วนใหญ่ 20-80฿** และ **หลายครั้งฟรี** (โดยเฉพาะ กทม.)
  - **Meal Plan weekly/monthly = ส่งฟรีทุกแพ็ค** ไม่มีขั้นต่ำ · แพคเกจบางตัวติ๊ก "ส่งฟรี" ได้ที่ DB (u0.4.34)
  - **⚠️ กฎโฆษณา:** ห้ามโฆษณาเป็นตัวเลข "ละ 200" (ฟังดูแพง) · จุดขาย = **"ค่าส่งถูก เพราะร้านช่วยออกให้ — ถูกแม้ซื้อไม่เยอะ"** ไม่ใช่ตัวเลข · ห้ามเคลม "ถูกที่สุด" จนกว่า verify
- **ไม่ให้ลูกค้าเลือกเวลาส่ง** — แมสร้านจัดรอบเอง ลูกค้าแค่ "แจ้งช่วงเวลาที่สะดวกรับ" ได้ — ห้ามเขียนคอนเทนต์ว่า "เลือกเวลาส่งได้"
- ฟรีซแพ็คทำถูกวิธี (ปรุงเสร็จแช่แข็งทันที) — ห้ามดิสอาหารแช่แข็งในคอนเทนต์

---

## 🤖 AI Agents — Roster เต็ม + Roadmap

**หลักการร่วม:** Agent ทุกตัวตั้งชื่อตามพนักงานเก่าตัวจริงของร้าน · วิสัยทัศน์ระยะยาว = pixel-art virtual office · เป้าหมายใหญ่ = แพลตฟอร์ม **"Under360 Base"** แทน Hato Heart เต็มระบบ (= v1.0) · ทั้งหมดยังไม่เริ่มสร้าง — ต้อง dev พฤติกรรมให้นิ่งก่อนต่อเข้าระบบจริง · **ลำดับสร้าง: น้องนิวก่อนเสมอ** (ตัวอื่นพึ่ง output ของน้องนิว)

| Agent | หน้าที่ | Priority | Status |
|-------|--------|----------|--------|
| **น้องนิว** | assign เมนูลูกค้า + production planning + ประเมิน sales velocity → feed Kitchen Queue | 🔴 สูงสุด | ⏳ spec locked (v6.3) ยังไม่โค้ด — ดูสเปกเต็มด้านล่าง |
| **พี่เก่ง** | delivery routing + Lalamove integration — 🆕 เป้าแรก: ลดค่าส่ง subsidize 30-50K/เดือน | 🟡 สูง | ⏳ ยังไม่เริ่ม |
| **ฟ้า** | kitchen / ingredient planning (ประเมินยอดสั่งวัตถุดิบแม่นขึ้น หลังน้องนิว output พร้อม) | 🟡 สูง | ⏳ ยังไม่เริ่ม |
| **น้องเตียง** | graphic design/ads/marketing briefs — รีวิว/จัดหน้า blog · ภาพประกอบบทความ+Ads · ออกแบบการ์ดคูปอง/QR | 🟡 ปานกลาง | ⏳ ยังไม่เริ่ม |
| **น้องเอิธ** | competitor/market intel + trend + influencer + ad ops + feedback monitor (5 stream) | 🟢 **รันจริง** | ✅ **a0.3** — subagent (`.claude/agents/nong-eath.md`, sonnet) + **desktop widget** (Electron, ตัวการ์ตูน pixel มุมจอ · คลิก✎สั่ง/AUTO toggle/ลากย้าย · commit `a2c4026`) · output = "ชีทพลอย" paste-ready ใน `web/eath/` · ห้ามทำเอง: จ่าย/publish แอด·ทาบ influencer (ร่างเท่านั้น) · **ตัวถัดไป: QA แอดมิน LINE OA** |

**Flow เมนูกระแส:** เอิธ (เจอเทรนด์+ดูคู่แข่ง) → ฟ้า (ทำได้ไหม/ต้นทุน) → นิว (จัดเข้าผลิต)

### 🤖 น้องนิว v1 — LOCKED SPEC (Meal Plan menu assignment)
> Codify สมองนัทที่เคย assign เมนูเองในหน้า OH แพลนเมนู — keystone agent ที่ตัวอื่นรอ output · ต้องเสร็จก่อน deadline สั่งวัตถุดิบ (3 ทุ่ม)

**ชั้น 1 — เลือก 14 เมนูผลิตวันนี้ (production pool):**
- Random 12 เมนู ตามโควตาโปรตีน: ปลา+กุ้ง (ทะเล) = 4 · ไก่+หมู = 8 · bias เมนู 🟢เขียว (rating=3)
- แบ่ง 12 = **6 hook** (เมนูดัง/เขียว ซ้ำรอบก่อนได้) + **6 fresh** (ไม่ซ้ำ ~3 รอบล่าสุด ปรับได้ 1-5 รอบ)
  - hook ซ้ำใน "การผลิต" ได้ แต่ชั้น 2 ยังกันไม่ให้ลูกค้าคนเดิมได้ซ้ำถี่
  - ⏳ ช่วงยังไม่มีคะแนน (v1): hook/fresh ยังไม่แยก → random 12 (ทะเล4/ไก่หมู8) เลี่ยงรอบล่าสุดเฉยๆ เปิด hook/fresh เมื่อมีเขียว
- คน (นัท/แอดมิน) ใส่เพิ่มเอง 2 เมนู → รวม 14
- ⚠️ เมนูที่ถูก request สำหรับวันนั้น = reserve เข้า 14 ก่อน แล้วค่อย random ที่เหลือ

**ชั้น 2 — assign เมนูให้ลูกค้าแต่ละคน (จาก 14 เมนู):**
1. เช็ค request ก่อน (2/14 ที่ลูกค้าตั้งใจ) → ล็อกเข้ากล่องก่อน
2. เติมช่องที่เหลือ: ตัดของแพ้/ไม่กินออก (กฎเหล็ก) · ลูกค้าใหม่ → เมนู 🟢signature hook ต่อคอร์ส · ลูกค้าเก่า → ไม่ซ้ำ ~10 มื้อล่าสุด คะแนนดีสุด
3. ซ้ำเลี่ยงไม่ได้ → วน 🟢signature (ยอมซ้ำ) + mark ให้น้องเอิธเก็บฟีดแบค
4. ของไม่กินตัดหมด → flag "ทำพิเศษ +1 จาน"

**Output:** กล่องของลูกค้าแต่ละคน + flags → แอดมิน confirm → ครัวเห็นใน Kitchen Queue

**ข้อมูลที่ใช้ (ความพร้อม):** ⚪ คะแนนเมนู = deferred v1 (แรนดอมไม่มีเขียวก่อน) · 🟢 ประวัติเมนูลูกค้า = ดึงจาก orders/deliveries ได้แล้ว · 🔴 catalog HP/LC = คนละชุดกับ S/D ต้อง import เข้า DB ก่อน (กลุ่ม 1 ข้อ 1) · 🔴 preference ลูกค้า = ต้องสร้างที่เก็บ (`customer_preferences`, กลุ่ม 1 ข้อ 2)

**ยืนยันแล้ว:** HP/LC = คนละชุดเมนูกับ S/D/No/A → คะแนนเขียวของ S/D ใช้กับ HP/LC ไม่ได้ · v1 = assign ครบ 7 · Request Menu UX ค่อยต่อทีหลัง

### 🍱 Meal Plan — สเปคอนาคต (ยังไม่สร้าง — ต่อหลังน้องนิว v1)
**Request Menu (2 รายการ/สัปดาห์):** ลูกค้า Meal Plan request เมนูเอง 2 รายการ/สัปดาห์ กระจายลง delivery ไหนก็ได้ อีก 5+ รายการครัวกำหนด — 🤫 surprise factor: ลูกค้าเห็นแค่ 2 เมนูที่ตัวเอง request เท่านั้น — Flow: Admin เลือกรายการจาก catalog → LINE broadcast ทุกสุดสัปดาห์ → ลูกค้า tap เข้า LIFF → tick 1-2 เมนู → confirm → save + แจ้ง admin ใน OH → ครัวเห็นใน daily plan — Deadline อาทิตย์ 20:00 ปิดรับ — Tables ใหม่: `weekly_broadcast` · `customer_requests`

**ครัว 3 Zone + Reservation:** Zone A จัดวันนี้ (ส่งพรุ่งนี้) → กด ✓ ย้ายไป C · Zone B จัดล่วงหน้า (เมนูพิเศษ pre-order แยก panel ต่อ delivery date) · Zone C จัดแล้วรอส่ง (Messenger ยืนยันหยิบ) — ปัญหา advance order: เมนูพิเศษผลิตสัปดาห์นี้ส่งสัปดาห์หน้าไม่มีระบบ reserve อาจถูกขายซ้ำ → ต้องมี `menu_reservations`

**Weekly Menu Plan (คนละตัวกับ Daily Plan):** กำหนดเมนูประจำสัปดาห์ S 8 เมนู + D 5 เมนู/สัปดาห์ — AI เลือกซ้ำน้อยสุด+คะแนนดีสุด → Daily Plan + LINE broadcast + เปิด Request Menu

### 🥬 Freshket Ordering Agent — ยังไม่เริ่ม
ระบบสั่งวัตถุดิบอัตโนมัติจาก Freshket ด้วย Computer Use — **Deferred: รอน้องนิวเสร็จก่อน** (ต้องมี ingredient output จากแผนผลิตก่อน) · เกี่ยวโยงกับฟ้า · `fah_instructions.md` (ยังไม่เขียน) เก็บ product preference/เกณฑ์เลือกของ

### 🚚 Delivery Design เชิงกติกา (พี่เก่ง)
**Time windows:** ยืดหยุ่นทั้งวัน = มีส่วนลด (จูงใจ slot จัดรถง่าย) · เช้าก่อน 12:00 · บ่าย 13:00–17:00 — ลูกค้าแจ้งช่วงสะดวกรับได้ แต่ไม่ใช่เลือกเวลาเป๊ะ (คอนเทนต์ห้ามเขียนว่าเลือกเวลาได้)

**Dual-mode:** Real-time monitor (เฝ้าออเดอร์เข้าทันที ลูกค้าต่อรองเวลาได้ไม่เกิน 2 ครั้ง/เดือน — คนละอันกับ request เปลี่ยนเมนู 2 ครั้ง/สัปดาห์) · Route planner (วางแผนเส้นทางรวมประจำวันตอน 17:00)

**Lalamove v3 API:** ขอราคา realtime + auto-booking อนาคต — ช่วง trust-building แรก admin ต้อง approve ก่อนทุกครั้ง

**วิสัยทัศน์ที่นัทอธิบาย (2026-07-05):** หน้าจัดแมสใหม่เป็น "รายการ" ให้แมสกดอัพเดทสถานะเองจากมือถือ + ถ่ายรูปหลักฐานส่งของ (proof of delivery) — คนละเรื่องกับ "แมสเซนเจอร์" ปัจจุบัน (แค่หน้าดูรายการ ไม่มีปุ่มอัพเดทจริง ไม่มี LINE แจ้งลูกค้าเลย)

**Tables ที่ต้องสร้าง:** `menu_history` · `customer_preferences` (SQL พร้อมแล้ว ดูหัวข้อ Supabase Tables) · `production_plan` · `weekly_assignments` · `menu_reservations`

---

## 📣 Marketing Track — สถานะจริง (อัปเดต 11 ก.ค. 2026)

**Scope 4 เครื่องยนต์:** ① SEO เว็บ ② AI Search/GEO ③ Google/FB Ads ④ Influencer

### ✅ เสร็จแล้ว
1. **Google Business Profile — ✅ verify ผ่าน (9 ก.ค.)** — ขึ้น Google Map แล้ว · dining modes ครบ (Delivery+No-contact=Yes) · Profile strength 65% (ไม่ต้องไล่ 100%) · Advertise setup กด Skip ถูกแล้ว (ทำแคมเปญ manual ดีกว่า Smart Campaign)
   - ลิงก์รีวิว: `https://g.page/r/CTHTcnneZEtoEBI/review`
   - การ์ด QR ขอรีวิวทำเสร็จแล้ว (พร้อมพิมพ์แนบกล่อง) → **แอดมินทยอยส่งลูกค้าประจำวันละ 5-10 คน** (ห้ามแลกส่วนลด)
2. **Blog 3 บทความขึ้น Wix แล้ว** (360foodbox.com): ① "อาหารคลีน Delivery กรุงเทพ เจ้าไหนดี?" (slug: healthy-food-delivery-bangkok) ② "Meal Plan โปรตีนสูงคืออะไร" (slug: high-protein-meal-plan — ธง positioning ใหม่) ③ "ส่งถึงไหนบ้าง" (slug: delivery-areas) — ไฟล์ต้นฉบับ .md เก็บไว้ใช้ซ้ำตอนย้าย Vercel
3. **Google Ads กู้คืนสำเร็จ + verify ผ่านแล้ว** (เมล 8 ก.ค. · Customer ID 318-768-6554 · ocid 202127689) — บัญชีเก่า canceled→Active
4. **เคาะเรื่องเว็บ:** ห้ามยกเลิก Wix จนกว่าจะย้ายโดเมนไป Vercel เสร็จ (เนื้อหา/SEO ย้ายได้หมด ทิ้งแค่ดีไซน์)

### 💎 Keyword ทองคำ (บัญชี Ads เก่า — All time: 3.9K clicks · ฿23.4K · 51.3K impr · CTR 7.6% · 256 conv)
| Keyword | Clicks | CTR | Conv | หมายเหตุ |
|---------|--------|-----|------|----------|
| **คอร์สอาหารคลีน** | 1,860 | 10.85% | **127** (฿87/conv) | 🏆 ตัวคุ้มสุด — ตรง Meal Plan เป๊ะ |
| **อาหารคลีนเดลิเวอรี่** | 1,480 | 8.20% | **95.5** (฿94/conv) | 🏆 ตัวหลักคู่กัน |
| **Under360 (brand)** | 176 | 49.7% | 32 (฿12/conv) | CPC ฿2.22 ถูกสุด — กัน "350" เสียบชื่อ |
| อาหาร คลีน เดลิเวอรี่ ใกล้ฉัน | 39 | 11.68% | 1 | พอใช้ |
| ❌ อาหารสุขภาพ | 105 | 3.53% | 0 (เผา ฿1,120) | คำกว้าง เผาเงิน — ตัดทิ้ง |
| ❌ อาหารคลีน ลดน้ำหนัก | 15 | 2.07% | 0 (เผา ฿138) | ตัดทิ้ง |

**Insight:** คำมีเจตนาซื้อ (คอร์ส/เดลิเวอรี่/สั่ง) ชนะ · คำหาความรู้เผาเงิน · แคมเปญเก่าหมดอายุ Apr 2025 ตั้ง location ผิด (ทั้งประเทศ) → สร้างใหม่ ไม่ resume ของเก่า

### 🎯 แคมเปญ Google Ads — ออกแบบแล้ว (รอเปิด)
**โครงสร้าง 2 แคมเปญแยก:**
- **แคมเปญ 1 — Brand Defense** (~50฿/วัน) — keyword: under360 · under 360 · อันเดอร์360 · 360foodbox · Match Exact+Phrase — 💤 **PARK อย่าเพิ่งเปิด (นัทถอดออกจากคิว 21 ก.ค.):** "350" ครองบน Shopee ไม่ได้ข้ามมาเล่น keyword Google · brand keyword ทำได้แค่ 176 clicks ตลอดกาล = ป้องกันยอดที่ไม่มีอยู่ · ตอนนี้ต้องการตัว**เพิ่มยอด** ไม่ใช่ป้องกัน → **เปิดตอน funnel เดินแล้ว** (มีคนเห็นแอด/อินฟลูแล้วเสิร์ชชื่อร้านต่อ)
- **แคมเปญ 2 — Meal Plan Search** (~300฿/วัน) — Match Phrase+Exact เท่านั้น ห้าม Broad — **เปิดหลัง**เว็บ Vercel live + conversion tag ทำงาน

**Negative keywords:** อาหารสุขภาพ · ลดน้ำหนัก · สูตร · วิธีทำ · ฟรี · สมัครงาน · แฟรนไชส์
**Location:** กรุงเทพ+ปริมณฑล 5 จังหวัด ตั้งเป็น "Presence" (ไม่ใช่ "Interest")
**Bidding:** เริ่ม Maximize Clicks เพดาน CPC ฿10 → พอมี conversion ~30 ตัว สลับ Maximize Conversions
**⚠️ ต้องตั้ง conversion tracking ก่อนเปิด** (นับคนกดปุ่ม "สั่งผ่าน LINE")

**Ad copy:** Headlines — คอร์สอาหารคลีน ส่งถึงบ้าน · อาหารคลีนเดลิเวอรี่ กรุงเทพ · คอร์สอาหารคลีน เริ่ม 1,399.- · Meal Plan ส่งฟรีถึงหน้าบ้าน · เมนูไม่ซ้ำ อิ่มไม่จำเจ · จัดเมนูตามเป้าหมายของคุณ · ทดลอง 7 กล่อง ก่อนสมัครยาว · โปรตีนแน่น คุมคาร์บได้ · สั่งง่าย จบใน LINE · อาหารสุขภาพ ส่งทั่วกรุงเทพ (ทุกหัวต้องยืนเดี่ยวได้ — Google สลับเอง) — ❌ ตัดทิ้งแล้ว: "under360" ในหัวทั่วไป · "เลือกได้ทั้ง HP/LC" · "ปรุงสด 10 ปี" (ไม่ตรง) · "ตัดวัตถุดิบที่แพ้"

### 🔑 Keyword ชุดใหม่ (เคาะ 11 ก.ค. — ไทยล้วน, ตัด meal plan/low carb อังกฤษออก)
| Ad group | Keywords | หมายเหตุ |
|---|---|---|
| **A — คอร์สอาหารคลีน** | คอร์สอาหารคลีน · คอร์สอาหารคลีน ราคา · คอร์สอาหารสุขภาพ | พิสูจน์แล้ว 127 conv |
| **B — เดลิเวอรี่** | อาหารคลีนเดลิเวอรี่ · อาหารคลีนส่งถึงบ้าน · อาหารคลีนรายสัปดาห์ · อาหารคลีนรายเดือน | พิสูจน์แล้ว 95 conv |
| **C — เพิ่มกล้าม/ฟิตเนส** | อาหารเพิ่มกล้าม · เซ็ตอาหารเพิ่มกล้าม · ข้าวกล่องโปรตีนสูง · อาหารโปรตีนสูงส่งถึงบ้าน · อาหารสำหรับคนออกกำลังกาย · ข้าวกล่องฟิตเนส | ยิง HP ทางอ้อม |
| **D — คุมแคล** | อาหารคุมแคล · ข้าวกล่องแคลต่ำ · อาหารคลีนคุมแคลอรี่ | ยิง LC ทางอ้อม |
| **E — นักกีฬา/ก่อนแข่ง (ทดลอง)** | อาหารนักกีฬา · มื้ออาหาร hyrox · อาหารเตรียมแข่ง · อาหารก่อนวิ่งมาราธอน | volume ต่ำ ทิ้งเบ็ดดักเทรนด์ Hyrox |

C vs D = วัด HP vs LC ว่าคนหาอะไรมากกว่า (ตอบ TODO เสา 3 ไปในตัว) — ทุกกลุ่ม Phrase+Exact เท่านั้น

### 📊 Facebook Ads — ปัญหาจริง = Attribution ขาด (ไม่ใช่ ad ห่วย)
> **ผล audit 3 ปี (เอิธ 22 ก.ค. · `web/eath/fb_ads_audit.md`+`fb_ads_ploy_history.md`):** บัญชียิงจริง = **`463330657546428` ตัวเดียว** (บัญชีพลอยยิงเองไม่โผล่ใน login นัท → ต้อง share สิทธิ์/reauth) · **spend ฿41,840 · reach 565K · 133 แคมเปญ (ยิงจริงแค่ 20)** · **99% ยิงผิด objective (message/reach retarget ลูกค้าเก่า ~79%) → Meta ไม่เคย optimize เพื่อการซื้อ → วัด revenue ไม่ได้เลย** · objective "ยอดขาย" ทดลองแค่ครั้งเดียว (IG only, ฿1.52/คลิก ดีมาก) · **สูตรถูกสุด ฿76-100/แชท** = audience `CustomerList` + engagement-365day + ครีเอทีฟ "คิมบับ" · → **ต้องผูก attribution + ยิง conversion objective ก่อนเทงบใหม่**
- **สาเหตุ:** เมื่อก่อนปิดการขายจบใน FB → Meta วัดได้ · ตั้งแต่ดันลูกค้าไป LINE (ผ่าน Hato) → Meta เห็นแค่ "คนทัก" ไม่เห็นยอดซื้อ + iOS privacy บังตาเพิ่ม → ลูกค้าจาก FB→LINE ปนกันหมด ไม่รู้เลยว่าใครมาจากไหน
- **ทางแก้ (งานหลังบ้าน):** FB ad ชี้มา `landing.html` (มีไฟล์แล้ว) แทนชี้ตรง LINE + แปะ UTM (`?utm_source=fb&utm_campaign=xxx`) → LIFF อ่าน `localStorage.u360_utm` ตอนสร้าง order → บันทึกลง `orders` → วัด FB เป็นบาทจริงได้
- **กลยุทธ์:** ไม่แตะแอดพลอย (baseline) → ยิงแทร็คใหม่ของนัทคู่ขนาน → ตัวเลขจากระบบนัทตัดสิน
- **หลักยิงแอด:** ปล่อยน้อยตัว งบพอผ่าน learning phase (~50 results/สัปดาห์/แอด) ไม่หว่านหลายตัวงบบางๆ

### 🎯 Platform ↔ Product mapping (เอิธ วิเคราะห์แอดพลอย 3 ปี · นัทเคาะ 22 ก.ค.)
> **หลักการ: เลือกแพลตฟอร์มตามโปรดักต์↔กลุ่มเป้าหมาย — ไม่ใช่ "แพลตฟอร์มไหนไม่เวิร์ค"** (แก้ความเข้าใจเก่าว่า FB/IG ไม่เหมาะ — จริงๆ คือจับคู่ไม่ตรง · data: reach champion เดิม = "แพคกับข้าว IG" · CustomerList ถูกสุด = FB · 2 แพลตฟอร์มได้ผลคนละแบบจริง)
- **Meal Plan (HP/LC พรีเมียม) → ยิง IG** — กลุ่มมีฐานะ ดูแลสุขภาพ ไลฟ์สไตล์ชาวเมือง เล่น IG หลัก
- **Stock menu / แพคกับข้าว (ถูก ยืดหยุ่น) → ยิง Facebook** — กลุ่มเน้นสะดวก คุ้มเงิน จ่ายน้อย อยู่ FB (แนว Cleanfit ที่เวิร์คกับฟรีซแพ็ค)
- บริบทเต็ม (วิเคราะห์ 3 ปี + สูตรที่เวิร์ค): `web/eath/fb_ads_ploy_history.md`

### 🚨 CRM insight — ของฟรีที่ยังไม่ได้แตะ (Marketing session #3, 21 ก.ค.)
> ⚠️ **ตัวเลข LINE OA ด้านล่างมาจาก analysis อีก session (m-track/main ~21 ก.ค.) — ยังไม่ยืนยันหน้าที่มา ควร recheck ก่อนอ้างในงานจริง** (เอิธไม่ใช่แหล่ง)
> **ตัวเลขที่ใหญ่กว่าทุกเรื่อง:** LINE OA เคยแอด **~53,411** · reach จริง **~23,244** · **บล็อก ~25,906 (~49%!)** · → ลูกค้าจริง **<100 คน/สัปดาห์** · ยอดตกหนักทั้งเก่า+ใหม่
> **✅ พิสูจน์ว่า segment ชนะ (data ที่อ้าง):** ยิงกว้าง ~23k = เปิด 7.7% / คลิก **0** · เจาะกลุ่ม Meal Plan ~10k = เปิด 22.4% / คลิก **74** (**เปิด 3 เท่า**) → **เลิกยิงกว้าง segment เสมอ** · broadcast/CRM ตอนนี้เป็น scope เอิธ (tag/audience อยู่ HatoHub ยังไม่ดึง)
- **ทำไม 20,000 ไม่แปลงเป็นยอด (สมมติฐาน):** broadcast ยิง **ใบเดียว** หาคน 20,000 จากคนละโปรดักต์/ยุค/ราคา → ~80% ไม่ใช่ของตัวเอง → สมองเรียนรู้ "ไม่ต้องเปิด" = **ดองแชท** (≠ ลืมร้าน) · **ทางแก้ = segment broadcast ตาม tag** ไม่ยิงรวม
- **tag ปัจจุบันใน LINE OA (ของ Hato):** `ติดตาม` (สนใจยังไม่สั่ง) · `มีลแพลน` · *(ไม่มี tag)* = สาย Stock/คลีนปกติ
- **🔴 GAP ใหญ่ (ปลดล็อกทันที ไม่ต้องรอ migrate):** แอดมิน **ไม่เคยตามลูกค้าคอร์สจบเลย** → ไล่ทักกลุ่ม **A** (คอร์สจบ ≤30 วัน, ปิดง่ายสุด) → B (จบ 1-3 ด.) → C (tag ติดตาม ≤90 วัน) วันละ 10-15 คน · **กฎเหล็ก: ทักแล้วติด tag กลับทุกคน** (โปรดักต์เคยซื้อ/เหตุผลหยุด/สนใจไหม) → ได้ profile ฐานลูกค้าจริงมาฟรีใน 2 สัปดาห์ · **owner = แอดมิน/พลอย** (สคริปต์+รายละเอียดใน `CLAUDE_CODE_HANDOFF_20260721.md`)
- **ค้างที่นัท (Claude ทำแทนไม่ได้):** สถิติ broadcast ย้อนหลัง (ส่ง/เปิด/คลิก) + จำนวนคนต่อ tag — อยู่ใน Hato ไม่มี token → นัทแคปจากมือถือ · **ตัวเลข "เปิด" = ตัวชี้ขาด** (เปิดน้อย=ปัญหาหัวข้อ/ความถี่ · เปิดเยอะแต่ไม่ซื้อ=ข้อเสนอไม่โดน — คนละยา)

### 🎯 Competitor Intelligence
> งานเฝ้าคู่แข่ง = ขยาย scope น้องเอิธ · **`web/eath/competitor_master.csv` = 42 ราย เรียงตามภัย**

| ร้าน | จุดแข็ง/ภัยคุกคาม | มุมที่กระทบเรา |
|------|------------------|----------------|
| **Passion Food (คุณซอส)** | ⭐ ภัยหลัก — ลอกเมนู · personal brand แรง · เก่ง Grab/LINEMAN · 7 ปี 2 สาขา | ตีคู่พลอยเรื่อง personal branding |
| **Calories Killer** | ยิง ad โหดสุด retarget · เชฟ Le Cordon Bleu 300+ เมนู · **มีเว็บ checkout เอง** (attribution ดีกว่าเรา) · gift-threshold 5,000฿ | สงคราม ad + มี web checkout = ได้เปรียบ attribution |
| **Cleanfit** | แพ็คกับข้าวฟรีซเหมือนเราเป๊ะ · **ยิง FB หนักสุด 20+ แอด active** · แต่ Inbox-only = attribution รั่วเหมือนเรา | ชนไลน์ฟรีซแพ็ค → passive ถูกแล้ว |
| **Meal by Meal** | positioning ทับเผง | ชนตรง positioning |
| **Homie Clean Food** | เคลม #1 กทม. · HP/LC | ชนตรง HP/LC |
| อื่นๆ | TipTop (406K likes ฐานใหญ่สุด) · NutriChef (medical) · Ginzy (Hyrox) · ใบเมี่ยง/นับแคล (à-la-carte ชนสต็อก) | ดู master csv |

**Insight:** ส่วนใหญ่แข่ง personal branding + FB ads · **2 เทคนิคคู่แข่งใช้ Under360 ยังไม่เคยทำ:** gift-with-purchase threshold (Calories Killer) + โชว์ราคาตรงทุกแอด (Cleanfit) · **คู่แข่งส่วนใหญ่ attribution ไม่ดีกว่าเรา** (Inbox-only) — ยกเว้น Calories Killer ที่มี web checkout

### 👀 Influencer Watchlist (เอิธ วิจัยจริง · `web/eath/influencer_master.csv` = 44 คน · execute = พลอยทาบเอง เอิธแค่ร่าง)
> ⚠️ **แก้ 22 ก.ค.:** "@chalad.gin" ที่เคยจดใน master **ไม่มีในไฟล์วิจัยจริง** (น่าจะจำ handle ผิด) — ตัดออก ใช้รายชื่อจริงด้านล่าง
- **44 คน 4 tier:** 🌟 WARM LEAD 5 (Under360 ฟอลโล่แล้ว ทาบก่อน) · 🟢 น่าลอง 23 · 🟡 สำรอง 9 · 🔴 ตัด 6
- **WARM LEAD 5:** `@meiji_27anorma` (IG 283K, HP) · `@alita_pear` (IG 329K, HP) · `@khruzee` (IG 120K, HP โค้ช) · **`@healthydiary45.0kg` (IG 117K — top priority LC** รีวิวร้านประจำ) · `@prw.diet` (IG 224K, LC ⚠️red-flag over-claim 5กก/เดือน)
- **Top pick ทั้งชีท:** **`@phitchaa_aa` "คลีนบ้างไม่คลีนบ้าง" (TikTok 277.5K** — ชื่อตรง positioning เป๊ะ) · + @oilys_story · @drbankfooddoctor (TikTok 728K) · @healthytalkbylee (735K)
- **เกณฑ์คัด:** niche fit (ให้ความรู้ก่อนขาย) + tier + verify follower สด + engagement ratio + **lime (คนจริง) vs lemon (ปั้ม/บอต)** · verify แล้ว 11/13 · ตัดคน follower ปลอม/niche ไม่ fit · **monitoring อัตโนมัติ = เอิธ (stream C)**

### 🛵 Delivery Platform Strategy (เคาะ 9 ก.ค. — แก้ความเข้าใจผิดเดิม)
> เดิมเข้าใจว่า "ไม่ควรเปิด platform" — **ผิด** สิ่งที่ควรเลี่ยงคือ "ทุ่มงบ active/แข่งราคา" ไม่ใช่การเปิดทิ้งไว้

- **Passive presence** (เปิดร้านไว้ให้คน+AI ค้นเจอ) = **คุ้มเสมอ** ยากแค่ setup ครั้งเดียว
- **Active spending** (ทุ่มงบ/แข่งราคา GP 30-35%) = เลี่ยง
- **⚠️ HP/LC ไม่ลง delivery platform/วงใน** — เป็น subscription ขายผ่าน LINE OA เท่านั้น · ลง platform เฉพาะ Stock menu (No/S/D)
- **🆕 กฎกล่องเดี่ยว vs Package แยกช่องทาง (21 ก.ค.):** ร้าน subsidize ค่าส่ง 30-50K/เดือน → ดัน "กล่องเดี่ยว ฿165" บนช่องทางร้านเอง = ยิ่งขายยิ่งเจ็บ
  - **LINE OA / LIFF (ช่องทางร้าน) → ดัน Package S/M/L** (ตะกร้าใหญ่พอค่าส่ง subsidize ไม่กินกำไร · มีในระบบแล้ว) · ตอนนี้ติ๊ก "ส่งฟรี" ต่อ package ได้ (u0.4.34)
  - **Delivery platform → กล่องเดี่ยวได้เต็มที่** (ไรเดอร์แพลตฟอร์มรับค่าส่งแทนร้าน = ที่เดียวที่กล่องเดี่ยวคุ้มเชิงเศรษฐศาสตร์)
- เหตุผลที่เคยปิด LINE MAN = man-hour หมด (แอดมินลาออกหมด) **ไม่ใช่ขายไม่ได้** → แก้ด้วย delegate setup ให้แอดมิน

| Platform | สถานะ | ต้องทำ |
|----------|-------|--------|
| Wongnai | ✅ OFFICIAL · 4.1★ · #4/124 คลองสาน | อัปเดต 4 จุด: tag Meal Plan · เวลาเปิด-ปิด (เช็คคู่กับ cutoff time) · เพิ่มเมนู Stock No/S/D · แก้ราคา NO12 ให้ตรง (การ์ดเขียน 160 ข้างล่าง 165) — **HP/LC ไม่ลง** |
| GBP | ✅ verify ผ่าน ขึ้น Map | เก็บรูป/รีวิวดันสู่ 100% |
| LINE MAN | 🟡 เคยเปิด (LINE MAN Kitchen ปทุมวัน) ตอนนี้ปิด | เปิดใหม่ — ลิสต์เมนู/ราคาให้แอดมินกรอก |
| Grab/อื่นๆ | ⬜ ยังไม่เช็ค | สำรวจ+เปิด passive |

**⚠️ ติดขัด:** เคยทำปุ่ม Export เมนู CSV/JSON (u0.4.23) แต่**ลบออกแล้ว (u0.4.28)** เพราะเมนู DB ยังไม่นิ่ง (หมวดซ้ำ) → **backlog: ขอ export ใหม่เมื่อเมนูนิ่ง** แล้วดึงลิสต์ไปกรอก platform (โค้ดเดิมอยู่ commit `e07fe3b`)

### 📡 ช่องทาง Marketing ที่ยังไม่แตะ (introvert-friendly — นัทลุยออนไลน์ / พลอยลุยออฟไลน์+หน้ากล้อง)
Referral program (candidate เด่นสุด — ต่อกับ points/promo_codes ที่มีอยู่แล้ว) · CRM/Win-back segmentation (ทำ manual อยู่บ้าง → automate) · Remarketing/GDN (รอ pixel เว็บ) · Demand Gen/YouTube Ads · LINE Ads Platform (น่าสนใจสูงสำหรับตลาดไทย) · Affiliate (โครงเดียวกับ referral) · Pantip/community answering (SEO artifact) · B2B/Corporate lunch (เก็บท้ายสุด พลอยรับช่วงปิดดีล) · YouTube/TikTok หน้ากล้อง/Influencer/Event (เลนพลอย)

### 🤖 งาน marketing ที่จะ delegate ให้ agent (backlog — อย่าทำมือถาวร)
น้องเตียง: รีวิว/จัดหน้า blog · ผลิตภาพ/โปสเตอร์ Ads · ออกแบบการ์ดคูปอง/QR — น้องเอิธ: ตอบพื้นที่ส่ง/ค่าส่งใน LINE · เก็บฟีดแบครีวิว · ส่งลิงก์ขอรีวิวอัตโนมัติหลัง order

### 🆕 Backlog การตลาด
- **คูปองออฟไลน์แนบกล่อง (retention):** QR/โค้ดส่วนลดพิมพ์แนบอาหาร → ต่อยอด `promo_codes` — ดีไซน์=น้องเตียง — รวมใบเดียวกับ QR รีวิวได้
- **Auto-review เข้า LIFF/น้องเอิธ:** ปุ่ม "รีวิวร้าน" ใน LIFF หลังรับของ

---

## 🌐 เว็บใหม่ (แทน Wix) — เขียนเสร็จ · กำลัง migrate Wix→Vercel (m-track, 22 ก.ค.)

> **ตัดสินใจ: ไม่แตะ/ไม่แก้ Wix อีกแล้ว** — เขียนใหม่หมดเป็น single-file · ✅ deploy `under360-system.vercel.app/web/` · **สถานะ migration Wix→Vercel = Step 3/5** (Step3 สร้าง Vercel project → 4 ชี้ DNS → 5 เทส redirect → ทิ้ง Wix) · **บล็อกที่นัท: สร้าง Vercel project ใหม่ (Root=`web`) ส่ง URL ให้ m** · ⚠️ **Wix ยังไลฟ์ = เว็บ SEO ตัวจริง** (organic 85%, ~1,055 sessions/30วัน) ห้ามยกเลิกจนย้าย DNS+redirect เสร็จ
> - **Blog:** 61 บทความใน DB (เดิม 21 + ย้าย Wix 40) · 21 เดิม published · 40 ใหม่ = draft รอรีวิว/publish (`web/blog_admin.html`) · ~44 บทความเก่า Wix ยังไม่ย้าย (ย้ายเฉพาะตัวคุ้ม SEO ทีหลัง)
> - **🔴 redirect = ชีวิต** (Wix ยอดขาย ฿0 → ทิ้งไม่เสียยอด เสียแค่ SEO 10 ปี): `web/vercel.json` (301 พร้อม), `web/_redirects_plan.md` (แผนเต็ม, activate ตอน cutover) · **บทความ `riceberry-pros-cons` = 692 views ≈ 70% ของ blog + AI cite 136 → redirect ห้ามพลาด** · คำติดอันดับ 1-2: กลูเตนฟรี · ไรซ์เบอร์รี่ · น้ำปลา low sodium
> - **AI/GEO:** 427 query ผ่าน AI/30วัน (ChatGPT/Gemini/Claude/Perplexity) แต่ session=0 → คงโครง FAQ ทุกบทความ · **Asset:** 311 contacts / 90 subscribers (PII ไม่ลง repo — `web/eath/`+contacts อยู่ใน gitignore)
> - งานที่เหลือ (SQL/Ads/token/iOS/IG) = `WEB_LAUNCH_TODO.md` · รายละเอียด m-track = `MKT_HANDOFF.md`

| ไฟล์ | หน้าที่ | สถานะ |
|---|---|---|
| `index.html` | Home — positioning ใหม่ + goal switcher + product 3 ไลน์ + ปรัชญา + delivery + FAQ + IG feed + blog preview | ✅ เขียนเสร็จ ยังไม่เทส |
| `mealplan.html` | Landing สำหรับ Ads — HP+LC คู่ · ราคา 3 tier · FAQPage schema · sticky CTA มือถือ | ✅ เขียนเสร็จ |
| `blog.html` + `blog_admin.html` | ระบบบล็อคครบวงจร (Supabase `blog_posts` · Markdown · draft/พรีวิว) | ✅ เขียนเสร็จ |
| `import_blog.html` | กดปุ่มเดียว import บทความเข้า Supabase (upsert by slug รันซ้ำได้) | ✅ ฝัง 2 บทความแรก |
| `posts/_MANIFEST.md` | รายชื่อบทความ Wix ทั้งหมด 19 ตัว + URL + slug + กฎ migrate | ✅ |
| `scripts/sql_blog_posts.sql` | สร้างตาราง blog_posts + RLS | ⏳ รอรัน |
| `web_dashboard.html` | หลังบ้านดูสถิติ `web_events` — pageviews/CTA rate/แยก source/sparkline | ✅ เขียนเสร็จ ⏳ รอ `sql_web_events.sql` |

**จุดสำคัญ:** Conversion tag (gtag)+UTM capture ฝังในโค้ดแล้ว เหลือใส่ AW-ID+label · CTA ชี้ hatohub ตอนนี้ → เปลี่ยนเป็น LINE OA/LIFF ตอน migrate · IG feed ใช้ Behold.so (ฟรี, delegate พลอย/แอดมิน connect) เพราะ IG Basic Display API ปิดถาวรแล้ว (ธ.ค. 2024) · รูปทั้งเว็บยัง hotlink wixstatic ต้องดาวน์โหลดเข้า repo ก่อนยกเลิก Wix · **คงวันที่เผยแพร่เดิมเสมอ (created_at)** ตอน migrate blog · บทความมีราคา/โปรเก่า → published=false รอนัทรีวิว

**Blog migration:** ✅ **เสร็จแล้ว 12 ก.ค.** — ดูด 18 บทความจาก Wix `blog-posts-sitemap.xml` จริง (workflow 18 agents, 18/18 สำเร็จ, แปลงเป็น Markdown สะอาด คงวันที่เผยแพร่เดิม) + ของเดิม 2 = **20 บทความใน `web/import_blog.html`** พร้อม import · 6 บทความที่พูดถึงราคา/โปร/เมนูเฉพาะ ตั้ง `published=false` รอนัทรีวิว (high-protein-meal-plan, protein-pack-guide, healthy-bajang, low-sodium-fish-sauce, clean-food-nutrient-gaps, clean-food-without-exercise) · **นัทแค่รัน `sql_blog_posts.sql` → เปิด `web/import_blog.html` → กด Import**

**Web Backend (Step 1.5 — เพิ่ม 11 ก.ค.):** สถาปัตยกรรมคงเดิม — Supabase = backend หลัก, Vercel serverless เฉพาะจำเป็น ไม่สร้าง server แยก · `web_events` table (SQL ในหัวข้อ Supabase Tables ด้านบน) → เพิ่ม snippet insert pageview ตอนโหลด + cta_click ใน orderNow() (fire-and-forget, catch เงียบ) → ต่อยอด LIFF อ่าน `localStorage.u360_utm` ตอนสร้าง order → ปิดลูป "FB/Google = กี่บาทจริง" · SEO render (`api/post.js` — optional, ประเมินก่อนทำ ถ้าซับซ้อนเกิน v1 จด backlog client-side render ที่มีอยู่ยังใช้ได้)

---

## 🧭 Roadmap ที่ถูกต้อง — เข็มทิศกันหลงทาง (นัทขอเอง 9 ก.ค. — สำคัญมาก)

> นัทเรียก session ที่หลงทางว่า **"เลอะเทอะ เตลิด"** (เดินจาก LIFF → FB bot → น้องนิว → marketing → delivery platform ในวันเดียว) — **นัทขอให้ Claude ตบกลับเสมอ**

**ทำไมกระโดดไปมา (ไม่ใช่นัทแย่):** นัทอยู่ต่างประเทศ ทำงานมือถือ → เลนโค้ด park หมด → ไถลไป "เลนสมอง" (marketing/strategy) อัตโนมัติ เพราะเป็นสิ่งเดียวที่ทำได้ — ไม่ผิด แค่ต้องจัดลำดับ

**ลำดับที่ถูก (อย่าข้าม):**
1. **มือถือ/เดินทาง (เลนโค้ด park):** เลนสมองเท่านั้น — marketing track + ออกแบบ agent spec + setup platform ผ่านแอดมิน
2. **กลับถึงคอม:** รวม MASTERNOTE+HISTORY → Claude Code (ทำอยู่ตอนนี้) → เคลียร์งานโค้ดค้างทั้งหมด (ดูกลุ่ม 1-3 ด้านล่าง)
3. **หลังโค้ดนิ่ง:** beta test คู่ Hato → migrate ลูกค้าเก่า → เปิด agent ทีละตัว (นิว→เก่ง→ฟ้า→เตียง→เอิธ)
4. **ปลายทาง:** ปิด Hato Heart = v1.0

**กฎกันหลงทาง:** ทุกครั้งที่นัทเริ่มพูดเรื่องใหม่กลาง task → Claude ถาม _"อันนี้เลนสมองหรือเลนโค้ด? อยู่ในลำดับไหน?"_ → ถ้าไม่ใช่ของตอนนี้ = จด backlog แล้วดึงกลับ

### กลุ่ม 1 — ปลดล็อกน้องนิว (ทำก่อน)
1. นำเมนู HP/LC เข้า DB เป็น recipe หมวด meal_lc/meal_hp — import จากชีท (LC01-77/HP01-77) + tag โปรตีน — คะแนนเขียวกดทีหลังได้ ไม่บล็อกลอนช์
2. สร้างตาราง `customer_preferences` (SQL พร้อมแล้ว — ดูหัวข้อ Supabase Tables)
3. หน้าสั่ง (LIFF/checkout): เพิ่มช่องให้ลูกค้ากรอก preference เอง
4. ฟีเจอร์แอดมินกรอก preference ย้อนหลัง — backfill ประวัติลูกค้าเก่าจากชีท/โน้ตแชท

### กลุ่ม 2 — LIFF (cutoff + ความเร็ว/เทส)
5. แก้เวลาตัดยอด Meal Plan → กดสั่งได้ถึง 8:30 น. ของวันส่ง (⚠️ verify เวลาจริงในโค้ดก่อน — เอกสาร 17:00 vs นัทจำ 18:00 — ดู Known Issues #10) — Stock menu คงเดิม
6. Optimize LIFF ให้เร็วขึ้น (sequential storage reads/ขนาดรูป/render)
7. ⚠️ เทสจริงบน iOS Safari ก่อนลอนช์ — ยังไม่เคยเทสเลย (Known Issues #11)

### กลุ่ม 3 — Marketing (โค้ด)
8. สร้างเว็บสาธารณะบน Vercel (ดูหัวข้อ "🌐 เว็บใหม่")
9. ย้ายโดเมน 360foodbox.com: Wix → Vercel (เช็คก่อนว่าโดเมนจดผ่าน Wix หรือที่อื่น — ยังไม่ได้เช็ค)
10. รีวิว LINE OA ทั้งระบบ

### Backlog (ทีหลัง — ฟ้า/cost pillar)
- Ordering วัตถุดิบปัจจุบันสั่ง ~13-14:00 ประมาณเอาจากยอด+เผื่อยอดดึก = ของเหลือบ่อย → ฟ้าจะช่วยประเมินแม่นขึ้นหลังน้องนิว output พร้อม
- ค่าส่ง subsidize 30-50K/เดือน → เป้าหมายแรกของพี่เก่ง (route optimization + Lalamove quote เทียบแมสร้าน)

---

## 📌 Backlog & Decisions Pending

| รายการ | รายละเอียด |
|--------|-----------|
| **แจ้งเมนู HP/LC ล่วงหน้า?** | ปรึกษาพลอยก่อน — กระทบ marketing messaging + design น้องนิว |
| **KQ ดึง order จริง?** | ต้องทดสอบก่อน launch — ครัวต้องเห็น order |
| **Staging/Preview branch** | ทำหลัง launch — Vercel preview branch |
| **Package M/L** | หลังขาย S ได้ก่อน |
| **Loyalty tier threshold** | 🔴 **รอนัท** — มี real legacy data แล้ว (`customers.loyalty_points` มีอยู่ 492/2,160 คน สูงสุด 7,451 แต้ม) แต่ยังไม่มี logic สะสม/ใช้แต้มอัตโนมัติเลย + `liff_profile.html`'s TIERS array ไม่ตรงกับค่าจริงใน `customers.tier` (bronze/Fit&Fabulous/Wellness Warriors/Healthy Habits) — นัทขอหยุดรอก่อนจนกว่าจะ migrate ข้อมูลจากระบบเก่ามาครบ — ห้ามเริ่มออกแบบ tier ใหม่จนกว่านัทจะแจ้ง |
| **น้องเตียง (graphic)** | หลังน้องนิว approve เมนู → auto generate poster |
| **Package เงื่อนไขขั้นสูง** | ปัจจุบันมีแค่ extra_price ต่อ SKU — แผนอนาคต `package_conditions` (จำกัดจำนวนต่อคน/รายการบังคับ) ทำหลัง order history migration |
| **โดเมน 360foodbox.com จดผ่าน Wix หรือที่อื่น?** | ยังไม่ได้เช็ค (Wix → Settings → Domains) ต้องรู้ก่อนวางแผนย้าย |
| **ยิงคืนใส่ "350" (competitor conquesting)** | ทำได้ถูกกติกา แต่เคาะแล้วยังไม่ทำ — volume ต่ำ งบใหม่ควรลงคำสินค้าก่อน |

---

## 💬 Working Style

- **นัทส่ง multi-part ในข้อความเดียว** — ตอบให้ครบทุก part
- **"ปรับได้เลย"** = ทำเลย ไม่ต้องถามซ้ำ
- **คิดทะลุแผน** = redirect ทันที → "นั่นอยู่ใน backlog โฟกัส [task] ก่อน" (ดู "🧭 Roadmap ที่ถูกต้อง" ด้านบนสำหรับกฎเต็ม)
- **มือถือ + งานหลายขั้นตอน** = ทีละขั้นตอนเดียว รอสกรีนช็อตยืนยัน ห้ามยัดหลายเรื่องในเทิร์นเดียว
- **งานที่ agent ทำแทนได้** = เสนอ delegate เสมอ
- **คอนเทนต์แบรนด์:** ไม่โม้ว่าดีที่สุด — ให้ความรู้ก่อนแล้วแสดงว่าเราตอบโจทย์ · โปรโมท HP+LC คู่เสมอ · ห้ามดิสแช่แข็ง · ห้ามเขียน "เลือกเวลาส่งได้"
- **Commit message** = ภาษาไทยสั้นๆ เช่น `เพิ่ม Package flow + Meal Plan flow v0.3.2-3`
- **อัปเดต HISTORY ทุกแทร็ค (บังคับ)** = ทุก session ที่มี milestone/decision ของแทร็คไหน (u/m/a/doc) → จดลงตาราง Timeline ของแทร็คนั้นใน `UNDER360_HISTORY.md` + bump เลขเวอร์ชัน + เขียน changelog ท้าย CLAUDE.md — **ห้ามจดแค่แทร็คที่กำลังทำ ต้องเก็บครบทุกแทร็คที่ขยับ** (a-track spec-only ก็นับ เช่น `a0.2-spec`) · Claude เคาะเลขเอง เรียก skill `under360-masternote` ตอนปิด session

---

*Last updated: 22 ก.ค. 2026 (consolidate ครบทุกแทร็ค — นัทสั่ง "อัพทั้งหมด ไม่รอปิด session" · ดึงจาก 4 แชท): **u-track** u0.4.29-36 (presence·lightbox·ระยะขับจริง Distance Matrix·payment_status 3 หน้า·แพคส่งฟรี·รูปเมนู 70 ดูดโบรชัวร์ Drive→Storage+thumb transform) → เสา 1 = 80% · **migrate-track** 7,577 ออเดอร์เก่า import (2 report Hato, ยังขาด order_items) · **m-track** migration Wix→Vercel Step 3/5 + blog 61 + redirect plan (riceberry 692 views) · **a-track/เอิธ** = a0.3 รันจริง (subagent+widget) นำหน้าสุด (แก้ "0% coded") + FB audit 3 ปี (บัญชี 463330657546428, ฿41,840, 99% ผิด objective) + competitor_master 42 + **influencer_master 44 (แก้ @chalad.gin ที่จดผิด → warm lead จริง 5: meiji/alita/khruzee/healthydiary45/prw.diet)** + Platform↔Product (MP→IG/Stock→FB) + delivery เคลมได้/ห้ามเคลม · **[แก้ source]** เลข LINE OA (53,411/บล็อก 49%) = จาก m-track/main ไม่ใช่เอิธ (เอิธไม่ได้เข้า LINE OA) — recheck ก่อนอ้าง + บัญชี/expenses gap (เสา 2) · **agent ตัวถัดไป = QA แอดมิน LINE OA** (ติดเข้าถึงแชท) · attribution PARK (spec lock) · Platform↔Product ไม่รอ session close แล้ว. — [21 ก.ค. เดิม] (merge Marketing session #3 → masternote v6.8 · เลนสมอง ไม่แตะโค้ด): 7 deltas — ① Brand Defense = PARK (รอ funnel เดิน ไม่เปิด) ② Positioning "แรง 100% MP" → ดันทั้ง MP+Stock/Package แยกกลุ่ม (Stock ปิดง่าย ฿165, บันได Package→MP) ③ กฎกล่องเดี่ยว=platform / ช่องทางร้าน=Package ④ 🚨 CRM insight: 20,000 followers→<100 ลูกค้า/สัปดาห์ + broadcast รวม=ดองแชท→segment + GAP แอดมินไม่เคยตามคอร์สจบ (ไล่ทัก A-E ติด tag กลับ) ⑤ Influencer Watchlist @chalad.gin (เอิธเฝ้า/พลอย execute) · attribution = precondition ก่อนเร่งงบ (ย้ำ ไม่ใช่ delta) · **ไม่ merge ซ้ำ:** FB attribution flow/Delivery Reality/subsidize มีใน master แล้ว · งาน Supabase read-only exploration (handoff) = migrate session ดูแลอยู่ · **เวอร์ชัน:** doc→v6.8, m/u/a ไม่ bump (session นี้ไม่ launch/ไม่แตะโค้ด). — [14 ก.ค. เดิม] (u0.4.27–28 + doc-sync): **u0.4.24–26** OH set/course builder ครบวงจร (กลุ่มการเลือก/กดซ้ำ/ราคาเหมา → LIFF popup + subcode · multi-round delivery split 1รอบ=1order · กลุ่มหลายหมวดรวมนับ) · **u0.4.27** fix จากผลเทสนัท (date ปลดล็อกหลังลบ MP · multicat dropdown count · ซ่อน qty ซ้ำ · layout แถวเมนู DB) · **u0.4.28** LIFF perf (init waterfall 7 รอบ → Promise.allSettled batch) + ลบปุ่ม Export เมนู · HISTORY.md เติม u0.4.23–28 ครบ · **บริบท migrate:** นัทจะรวบรวมไฟล์ลูกค้า+ประวัติสั่งซื้อ 10 ปี (รวม pre-Hato) มา import (ทำหลัง beta) · **หมายเหตุ 2-session parallel:** u-track (แชทนี้) + a/doc-track แก้ CLAUDE.md/HISTORY กติกากันทับ (add เฉพาะไฟล์ตัวเอง + pull ก่อน push). — [12 ก.ค. รอบ 2 เดิม] เคลียร์ handoff Step 1–4 ต่อจาก Step 0: เว็บใหม่ deploy live `/web` + web_events tracking + Web Dashboard ใน OH (Step 1/1.5, commit `1f69381`) · blog 20 บทความพร้อม import — ดูด 18 จาก Wix ผ่าน workflow (Step 2) · LIFF Meal Plan cutoff 8:30 วันส่ง + DB ปุ่ม Export เมนู u0.4.23 (Step 4, commit `e07fe3b`) · Google Ads (Step 3) เตรียมพร้อมรอนัทกดคอนโซล · งานที่นัทต้องทำเอง (SQL/Ads/Vercel token/iOS/IG/ชีท HP-LC) รวมใน `WEB_LAUNCH_TODO.md` · ค้างจริง: localize รูป wixstatic (spawn เป็น task แยก, ตอนนี้ hotlink ใช้ได้), ชี้โดเมน+ยกเลิก Wix (ห้ามทำก่อน migrate). — [Step 0 เดิม] รวม `UNDER360_MASTERNOTE_v6_7.md` (11 ก.ค.) + `UNDER360_HISTORY.md` (v1, 9 ก.ค.) เข้า CLAUDE.md ตาม Step 0 ของ `CLAUDE_CODE_HANDOFF.md` (นัทเดินทางกลับถึง Santa Clarita เปิด Claude Code ได้แล้ว — ทริปแคนาดาจบ) — โค้ด (u-track) ยังอยู่ที่ **u0.4.22 ✅ live** ไม่มีอะไรเปลี่ยนฝั่งโค้ดในรอบนี้ (merge เอกสารล้วน) — เพิ่มเข้ามาใหม่จาก masternote: 7 เสาหลักโปรเจค, Positioning/Brand voice rules เต็มชุด, ประวัติร้าน 10 ปี, Delivery Reality, Agent Roster ขยายเป็น 5 ตัว (นิว/เก่ง/ฟ้า/เตียง/เอิธ) + น้องนิว v1 locked spec เต็ม + Meal Plan future specs, Marketing Track เต็ม (Google Ads keyword/แคมเปญ/FB attribution/competitor intel/delivery platform strategy), เว็บใหม่ (under360-web.zip รอ deploy), Roadmap เข็มทิศ+กลุ่มงาน 1-3, SQL ใหม่ 2 ตัวที่ยังไม่รัน (`customer_preferences`, `web_events`) — **แก้ไขจุดที่ masternote คลาดเคลื่อน:** SQL 3 ตัว (promo_scope/packages_rls/promo_stack) ที่ masternote เขียนว่า "ยังไม่ได้สร้าง" จริงๆ **รันแล้วตั้งแต่ 5 ก.ค.** (ยืนยันผ่าน REST ตรง) — และตั้งข้อสังเกตราคา Meal Plan ในโค้ดกับราคาที่ masternote อ้างว่า "โฆษณาจริง" ไม่ตรงกัน ต้อง verify ก่อนเปิดแคมเปญ Ads (ดู Known Issues #12) — `nut_personal_profile.md` (ข้อมูลส่วนตัว/ครอบครัวของนัท) **ไม่ได้เอาเข้าไฟล์นี้โดยตั้งใจ** เพราะเป็นไฟล์ cross-project ที่มีข้อมูลอ่อนไหว (การเงิน/ครอบครัว) ไม่เหมาะกับ repo โค้ดที่ push GitHub — เก็บแยกไว้ในเครื่องนัทตามเดิม — **ถัดไปตาม handoff:** Step 1 deploy เว็บใหม่ (แตก `under360-web.zip` → อ่าน `HANDOFF_WEB.md` → Vercel) → Step 2 blog migration → Step 3 Google Ads → Step 4 งานโค้ดค้าง (กลุ่ม 1-3 ด้านบน) — รอนัทสั่งว่าจะเริ่ม Step ไหนต่อ*

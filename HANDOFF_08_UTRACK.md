# HANDOFF → 08 U-track (LIFF beta + cutover)
> ส่งต่อจาก session 07 (context เต็ม · 27-28 ก.ค. 2026) · โฟกัส: ไล่ปิด LIFF ให้พร้อม beta + เดินหน้า cutover Hato→LIFF 360

## อ่านก่อนเริ่ม (ตามลำดับ)
1. skill `under360-session-start` → `CLAUDE.md` (single source of truth)
2. `TODO.md` (repo root)
3. ไฟล์นี้

---

## 🎯 ภาพใหญ่: cutover ทิ้ง Hato → LIFF 360 ยืนเอง (นัทเคาะแล้ว)
- **นัทตัดสินใจ: ไม่ต่อ Hato** (จ่าย = รายปี ล็อกทั้งปีกับระบบที่จะทิ้ง) → เร่ง LIFF 360 ยืนเอง
- **แต่ "Hato อยู่จนกว่า LIFF เราพร้อม"** = ไม่มีเส้นตายบีบ · ทำให้นิ่งก่อนค่อย soft-cutover
- **soft-cutover:** ย้ายริชเมนูไป LIFF 360 ตอน Hato ยัง alive เป็น backup
- **bar cutover (นัทยืนยัน):** แค่ **ออเดอร์เข้าระบบ + ครัวเห็น + แอดมินส่งต่อได้** (ของสวยรอได้ · ตัด report ทิ้ง)

## 🤝 แผนที่ห้อง (multi-session — ประสานผ่าน Command Center)
- **Command Center / เลขากลาง** = `local_344aaf67-68f4-4a6b-bc1f-35214dd98ef1` — รวบสถานะทุกห้อง ถือ checkpoint · ส่งงานเข้ามาให้ 07 เยอะ (ใช้ `mcp__ccd_session_mgmt__send_message` ตอบกลับ) · หน้า `command_center.html` (u0.4.38)
- **ห้อง 12 (นิว) สินค้าหลังบ้าน** = `local_2de86715-93e1-4a68-a53c-b60362d2026a` — dev JD น้องนิว (คุมผลิตเมนูพิเศษ)
- **P-track** = replay ออเดอร์ Hato จริงเทียบระบบเรา (เจอ gap/บั๊กหลายตัว) · **F-track** = การเงิน/P&L · **m-track** = เว็บ/blog

## ✅ ทำเสร็จ session 07 (ขึ้น main หมด ยกเว้นที่ระบุ)
- **Google Cloud API เปิดครบ** (นัทกด) → LIFF เสิชที่อยู่/ปักหมุด/ระยะขับจริง/ค่าส่ง **ใช้ได้หมดแล้ว** = ด่านใหญ่ผ่าน
- **LIFF checkout fixes:** หมุดขยับ→ที่อยู่อัปเดตตาม (reverse geocode) + ปุ่ม "ล้างที่อยู่/ค้นใหม่" + แถบตะกร้าส้มไม่ทับเมนูตัวท้าย + เก็บ `delivery_lat/lng/distance_km` ตอน submit (เดิมทิ้ง!)
- **ซ่อน express** (เรท Lalamove ปลอม) · **ราคา MP fallback** ตรงราคาจริง
- **เมนูพิเศษประจำสัปดาห์:** flag `is_weekly_special` + HE ปุ่มดาว ⭐ ติ๊ก + LIFF ป้าย "เมนูพิเศษสัปดาห์นี้" ⚠️ **นัทขอเปลี่ยนเป็นระบบ "แท็กแก้ข้อความ+สี" — รอเคาะ shape (ดู pending)**
- **HE ลากเรียงเมนู = แทรกบรรทัด** (เดิม swap)
- **สั่งแทนลูกค้า (OH) + export order list** = **อยู่ branch `feature/oh-order-onbehalf` (worktree) ยังไม่ merge** — รอนัท/แอดมินเทส UI 1 ใบ → cherry-pick main · SQL `created_by` รันแล้ว
- **ล้างออเดอร์เทส:** มาร์ค 26 ใบ (Nut/Test User/ฯลฯ) → `status=cancelled`+`source=test` → **ยอด ก.ค. จริง ≈ ฿172K ไม่ใช่ ฿236K** (ที่นัทใช้ตัดสินใจ)
- **เปิด/ปิดเมนู 16 + แพค 6** (P-track เทส set/MP) — 16 เมนูปิดกลับแล้ว (ไม่มีรูป) · **ก่อน cutover ต้องเปิดคืน** (ดู TODO)

## 🔁 Loop หลัก = ครบแล้ว (เช็คแล้ว)
ลูกค้าสั่ง LIFF → `orders`+`order_items` → **KQ ดึง orders + โชว์ menu_name ต่อออเดอร์ตามวันส่ง (ครัวเห็นเมนูผลิต) ✅** → messenger/export วางแผนส่ง · Meal Plan: OH "ผลิตวันนี้" + KQ MP view

## 🔵 รอนัทเคาะ (บล็อกการเดินต่อ)
1. **ระบบแท็กเมนูพิเศษ** — เอา "แท็กแชร์" (ตั้งครั้งเดียว/แก้ข้อความ+สี/ใช้หลายเมนู) ไหม? · ⚠️ **นิว (ห้อง 12) อ่าน field นี้** → เปลี่ยนแล้วต้อง ping ห้อง 12 · business logic: เมนูพิเศษของเหลือขายต่อจนหมด · เกินสัปดาห์=เปิดต่อไม่ผลิต · **นิวจัดการปิด** (ผูกสต็อก) · ผม=แค่ป้าย
2. **stock model** — นัทอยากได้ default 0 + checkbox "ส่งได้ไม่จำกัด" · ⚠️ ~55 เมนูตอนนี้ NULL(ไม่จำกัด) **ต้องคงไว้ ไม่งั้นร้านว่าง** — รอยืนยันก่อนทำ (อย่า zero ทั้งหมด!)
3. **เทส UI สั่งแทน 1 ใบ บน preview** → merge เข้า main

## 🔨 คิวงาน (หลังเคาะ)
- แท็กเมนูพิเศษ (~1-2 ชม.) · stock checkbox · auto-promo (ค่าครบแล้ว: Welcome ฿50/ครบ ฿500 · tier 5% เฉพาะ `Wellness Warriors` **ห้ามแตะ bronze** · **กัน legacy 4,600 คน**: new customer ต้อง orders=0 AND ไม่ใช่ source pre_hato/ploy_je/admin_notes[PRE-HATO]) · **credit system (prepaid ฿0 orders 17%)** = หลัง beta · admin-first + LIFF โชว์ยอด read-only + ledger immutable + RPC atomic + UI กรอกยอดตั้งต้น (ดูสเปคเต็มในแชท session 07/เลขากลาง)

## ⚙️ วิธี deploy (สำคัญ — shared working tree หลาย session)
- **อย่าสลับ branch ของ shared tree** (กวน session อื่น) · **ใช้ worktree แยก cherry-pick ขึ้น main:**
```
git add <ไฟล์u-track> && git commit -m "..." (บน branch ปัจจุบัน)
WT=<scratchpad>/md; git worktree add "$WT" main; cd "$WT"; git cherry-pick <sha>; git pull --rebase origin main; git push origin main; cd -; git worktree remove "$WT" --force; git worktree prune
```
- `node scripts/check-html-js.js <file>` ก่อน commit เสมอ
- **SQL: รันผ่าน Supabase SQL editor ใน Chrome** (Claude-in-Chrome) — anon REST ทำ ALTER/DDL ไม่ได้ · ⚠️ editor พิมพ์เพี้ยน/ช้าบ่อย: navigate `sql/new?skip=true` → รอ 3-6 วิ → คลิก (450,123) → type → screenshot verify → คลิก Run → verify ผ่าน REST · **ห้ามรัน DELETE ผ่าน editor** (พิมพ์เพี้ยน WHERE = ลบทั้งตาราง)
- REST อ่าน/เขียน (PATCH/insert) ได้ตรง (anon key ใน CLAUDE.md) · DELETE = RLS บล็อก

## 🚦 next step แรกของ session 08
ถามนัท 3 ข้อ pending (แท็ก/stock/เทสสั่งแทน) → หยิบทำตามที่นัทเคาะ · ระหว่างรอ = ไล่บั๊ก LIFF ต่อ (นัททำ beta ทีละจุด) · **จบ session อัปเดต HISTORY+CLAUDE.md (u0.4.40+ ยังไม่ได้ bump — งาน 07 เยอะ)**

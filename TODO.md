# 📋 Under360 — Shared TODO (ทุก session ใช้ร่วมกัน)

> **เป้า: ลดคอขวดที่นัท** — แทนที่ทุก track (m/u/a/earth) จะ ping/บรีฟให้นัทอ่านตลอด → **เขียนลงไฟล์นี้ที่เดียว** นัทเปิดดูเมื่อไหร่ก็ได้ ตามจังหวะตัวเอง
> **นัทดูแค่หัวข้อ "🔴 นัทต้องทำ" พอ** — ที่เหลือเป็นลิสของแต่ละ track (ใครลิสมัน)

**กติกา (กัน merge ชนกัน):**
- pull ก่อนแก้เสมอ · **แก้เฉพาะ section ของ track ตัวเอง** (+ เพิ่มใน "🔴 นัทต้องทำ" ได้ทุก track)
- `- [ ]` = ค้าง · `- [x]` = เสร็จ · ต่อท้ายด้วยชื่อ track `[m]` `[u]` `[a]` `[e]`
- **⭐ = ง่าย + ควรทำก่อน** (ปลดล็อก/ใช้เวลาน้อย) → หยิบเคลียร์ก่อน กัน TODO ล้น
- เรื่องด่วนจริงค่อย ping · เรื่องทั่วไป/ส่งต่อ/ให้นัททำ = ลงไฟล์นี้พอ
- แต่ละแชทเวลาโชว์ TODO → ขึ้น track ตัวเองก่อน แล้วตามด้วยคนอื่น (ดู skill under360-shared-todo)

---

## 🔴 นัทต้องทำ (ACTION REQUIRED) — ดูตรงนี้ที่เดียว
- [ ] **สร้าง Vercel project ใหม่** (Root Directory = `web`) → ส่ง URL ให้ m `[m · migration Step 3]`
- [ ] ⭐ **re-import blog** (เปิด web/import_blog.html กด Import) — ให้ค่าส่งใหม่ + ปก 61 บทความเข้า DB · ง่าย ~2 นาที `[m]`
- [ ] เปิด **Google Ads Brand Defense** ในคอนโซล (เปิดได้เลย ไม่ต้องรอเว็บ) `[m]`
- [ ] เทส **iOS Safari** (LIFF + เว็บ) ก่อน launch `[u/m]`
- [ ] ⭐ **Enable "Distance Matrix API"** ใน Google Cloud Console (เพิ่มบน key เดิม) → เทสปักหมุดว่าขึ้น "🚗 ระยะขับจริง" · ปลดล็อกค่าส่งแม่น (ถ้าค้าง 📍 = ยังไม่เปิด) `[u]`
- [ ] ⭐ **ส่งไฟล์โบรชัวร์รูปเมนู** ให้ u → เดี๋ยว u ครอป+อัพเข้า menu_items ให้ (รูป LIFF ยังว่าง โชว์ 🍱) `[u]`
- [ ] **สั่งเทส 1 ออเดอร์จริง** (อัพสลิป) → เช็ค OH ขึ้น 💰โอนแล้ว + กดสลับได้ + KQ เห็นออเดอร์+badge `[u]`
- [ ] (ก่อนเปิด Ads) เช็คราคา `mp_offer_sets` ตรง ad copy "เริ่ม 1,399.-" · ตั้ง `LINE_CHANNEL_ACCESS_TOKEN` ใน Vercel (noti MP) `[u]`

## 🟢 M-track (marketing / web / blog)
- [ ] **Migration** ย้าย Wix→Vercel: Step 3 (project) → 4 (DNS) → 5 (เทส redirect) → ทิ้ง Wix — *กำลังทำ*
- [ ] (หลัง beta) build FB attribution — UTM spec lock แล้ว (ดู MKT_HANDOFF)
- [ ] (เฟส polish เว็บ) review 21 บทความ flag ราคา/โปร · blog view toggle รูปด้านข้าง
- [x] harvest SEO Wix ครบ (WIX_SEO_HARVEST.md) · แก้ copy "ปรุงสด 10 ปี" + ค่าส่ง · localize รูป · gen web/vercel.json `[m]`

## 🔵 U-track (code / LIFF / DB / หลังบ้าน)
- [ ] ⭐ **รูปเมนู LIFF** — รอโบรชัวร์จากนัท → ครอป+อัพ `menu-images` + PATCH `image_urls` (จับคู่โค้ด, โชว์ mapping ให้เช็คก่อน) — *ด่านสุดท้ายก่อนเปิดรับออเดอร์*
- [ ] (หลัง beta) **build FB attribution dual-track** — spec lock แล้ว: orders `utm_source/medium/campaign/content` + `attr_method`('auto'/'manual'/'both') + `attr_tagged_by` · LIFF อ่าน `localStorage.u360_utm` (auto) · OH dropdown แคมเปญ (manual) · report รวม 2 แหล่ง dedup `DISTINCT orders.id` เรียงด้วยบาท · **park จนกว่ามี ad traffic จริง** (ตอนนี้ funnel ไม่มีคนวิ่งผ่าน)
- [ ] (session close) log `u0.4.29–34` → HISTORY + attribution spec → CLAUDE.md หมวด FB Attribution
- [x] **u0.4.25–34** (16–20 ก.ค.): multi-round split · multicat · perf init batch · payment_status 3 หน้า (LIFF/OH/KQ) · ระยะขับจริง (Distance Matrix) · แพคเกจส่งฟรี + badge · live presence · master ค่าส่ง/brand rules `[u]`

## 🟣 A-track / เอิธ (agents / competitor intel / marketing ops)
- _(A/เอิธ เติมลิสของตัวเองที่นี่)_

---

## ✅ เพิ่งเสร็จ (ล่าสุด — เก็บสั้นๆ กันซ้ำ)
- `[m]` real-time presence + noti · blog ปก 61 · redirect plan+vercel.json · gitignore contacts/eath (กัน PII/intel หลุด)

*อัปเดตล่าสุด: 20 ก.ค. 2026 (m-track สร้างไฟล์)*

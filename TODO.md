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
- [ ] 🥇 **อันดับ 1 (นัทสั่ง 23 ก.ค.) — เปิด Google Cloud API ให้ช่องเสิชที่อยู่ทำงาน** `[u]`
  - **หลักฐานยืนยันแล้ว:** ตอนพิมพ์ในช่องเสิช iPhone เด้ง **"หน้านี้โหลด Google Maps ไม่ถูกต้อง"** = API ไม่เปิดจริง (ไม่ใช่บั๊กโค้ด) · ผลเสียจริง: ออเดอร์เทส U-0724-001 **ที่อยู่บันทึกเป็น "Ico"** (ข้อความมั่วที่พิมพ์ค้าง) = ส่งของไม่ได้
  - [ ] **เปิด Places API** (ตัวที่ทำให้เสิชขึ้น) — ⚠️ Claude กดผ่าน Chrome ไม่ผ่าน (ปุ่ม Enable ไม่ตอบสนอง สงสัยสิทธิ์บัญชี) → **นัทกดเอง**
  - [ ] **เปิด Geocoding API** (ปักหมุดแล้วที่อยู่เด้งเอง)
  - [ ] 🔑 **แก้ API key restriction** → Credentials → key → "API restrictions" → เพิ่ม 4 ตัว (Maps JS/Places/Geocoding/Distance Matrix) หรือ "Don't restrict key" → SAVE
  - [x] Distance Matrix API = เปิดแล้ว (แต่ dashboard เคยขึ้น error 100% → น่าจะโดน key restriction เดียวกัน)
- [x] ✅ **Publish LIFF** (LINE Login channel) — นัททำแล้ว 22 ก.ค. → เปิดจากเครื่องนอกได้ `[u]`
- [ ] ⭐ **อัพ Custom Audience เข้า Meta** — `download/meta_custom_audience.csv` (2,746 เบอร์+อีเมล: DB 2,154 + เจพลอย 592 ใหม่) → สร้าง Custom Audience + Lookalike 1-3% (ปลดล็อก ad รอบ 1 warm+cold) `[e]`
- [ ] **แชร์ให้ `flidty.c@gmail.com`** (= บัญชีที่ Drive connector ผูกอยู่ · Viewer พอ): ① 🔴 ชีท **"เบอร์โทรลูกค้า +66"** (`1c0dhoBH…`) → +9,541 เบอร์เข้า CA ② 🟡 โฟลเดอร์รูปอาหาร/โบรชัวร์ → ครีเอทีฟ IG/MP รอบหน้า + ภาพฟรีซแพ็ค · *File A (`1gT7j…`) ดึงครบแล้ว = subset ของเจ ไม่ต้องแชร์* `[e]`
- [x] ✅ **สร้าง Vercel project (under360-web, Root=web)** — deploy สำเร็จ + redirect verified (riceberry ไป article ถูก) `[m]`
- [x] ⭐ **re-import blog** — ✅ m ทำให้แล้วผ่าน REST (ค่าส่งใหม่ + ปก 61 บทความเข้า DB · verify ผ่าน) `[m]`
- [ ] เปิด **Google Ads Brand Defense** ในคอนโซล (เปิดได้เลย ไม่ต้องรอเว็บ) `[m]`
- [ ] เทส **iOS Safari** (LIFF + เว็บ) ก่อน launch `[u/m]`
- [ ] ⭐ **เทส LIFF ข้ามเครื่อง** (iPhone + Android เครื่องอื่น) — เช็ครูปเมนูขึ้นครบ/thumb โหลดไว · flow สั่ง+payment+ปักหมุด บนจอจริง `[u]`
- [x] ⭐ **ล็อกอิน FB พลอย** ✅ นัท login แล้ว (22 ก.ค.) → เอิธ/main เข้าวิเคราะห์แอดพลอย Meta ได้เลย (ปลดล็อกแล้ว) `[e]`
- [ ] (ไม่ด่วน) เคาะ **บัญชีแอด under360** (463330657546428) ที่ตาย — 133 แคมเปญ, ตัวเปิดอยู่ error หมด, 2 ร่างค้าง → รื้อ/แก้ หรือปล่อยหลัง beta `[e]`
- [x] ✅ **รูปเมนู LIFF เสร็จ** — อัพ 70 รูปจากโบรชัวร์ (Drive) เข้า Storage + image_urls ครบ · เหลือ 7 เมนูไม่มีรูป (BJ บ๊ะจ่าง/D061/LC34) ถ้ามีรูปส่งเพิ่มได้ `[u]`
- [~] **สั่งเทส 1 ออเดอร์จริง** — ✅ **สั่งผ่านแล้ว U-0724-001** (23 ก.ค. · ฿1,551 · ค่าส่ง 22 · เข้า DB ครบ status=confirmed) · **เหลือ: อัพสลิป** เพื่อเทส payment badge (ตอนนี้ payment_status=unpaid เพราะยังไม่อัพ) → เช็ค OH ขึ้น 💰โอนแล้ว + กดสลับได้ + KQ เห็นออเดอร์+badge `[u]`
- [ ] (ก่อนเปิด Ads) เช็คราคา `mp_offer_sets` ตรง ad copy "เริ่ม 1,399.-" · ตั้ง `LINE_CHANNEL_ACCESS_TOKEN` ใน Vercel (noti MP) `[u]`
- [ ] ⭐ **ยืนยันราคาเซ็ตทดลอง MP กับ main ก่อนลง ad copy** — DB=HP 1,499/LC 1,399 · masternote เคยเขียน HP 1,699 → จะใช้เลขไหน? (LIFF ขายจาก DB=1,499) `[e]`
- [ ] ⭐ **ตอบ: ตอนนี้จดค่าใช้จ่าย/ยอดซื้อ(ต้นทุน)ไว้ที่ไหน** (สมุด/Excel/บิล Freshket/ไม่จด?) → ออกแบบหน้าจดบัญชีให้ตรงพฤติกรรม `[a]`
- [x] ✅ **Hato report ครบ 25 เดือน + รายสินค้า** — นัทสร้าง+ฟอเวิดแล้ว → import ครบ (ดู 🟠 Migrate-track) `[migrate]`
- [ ] (ไม่ด่วน) ฟอเวิด Hato ที่**เก่ากว่า 2 ปี + ยุค pre-Hato** → migrate เติม batch ต่อ (pipeline พร้อม รันซ้ำได้) `[migrate]`
- [ ] 🔴🔥 **CUTOVER Hato → LIFF 360 ก่อนหมดอายุรายปี (นัทเตือน 24 ก.ค. — รอบจ่ายใกล้ · ปีนี้จะไม่ต่อ Hato)** — broadcast 01-05 + ริชเมนู ทั้งหมดชี้ลิงก์ Hato (`2005639551-QgP5rNdW`) · **ถ้าไม่ต่อรายปี = ลิงก์ตาย → broadcast ที่ยิงไป ~1,809 คน กดไม่เข้าเลย พังหมด** · ต้อง ① LIFF 360 พร้อม (beta ผ่าน) ② ย้ายริชเมนู+ลิงก์ broadcast → LIFF ใหม่ ③ ค่อยทิ้ง Hato · **timing ผูกรอบจ่าย — เคาะวัน deadline ก่อน commit** `[u]`
- [x] ✅ **ส่งสคริปต์แอดมินให้กิ๊ฟ/เพอรี่ — นัทส่งแล้ว 24 ก.ค.** — ไฟล์ `web/eath/admin_script_salmon.md` (ตอบคนทักจากโค้ด 01-05 + ถามรสแซลมอน 05 + ⚠️ ติด tag เหตุผลไม่ซื้อทุกคน) `[e→นัท]`

## 🟢 M-track (marketing / web / blog)
- [ ] **Migration** ย้าย Wix→Vercel: Step 3 (project) → 4 (DNS) → 5 (เทส redirect) → ทิ้ง Wix — *กำลังทำ*
- [ ] (หลัง beta) build FB attribution — UTM spec lock แล้ว (ดู MKT_HANDOFF)
- [ ] (เฟส polish เว็บ) review 21 บทความ flag ราคา/โปร · blog view toggle รูปด้านข้าง
- [x] harvest SEO Wix ครบ (WIX_SEO_HARVEST.md) · แก้ copy "ปรุงสด 10 ปี" + ค่าส่ง · localize รูป · gen web/vercel.json `[m]`

## 🔵 U-track (code / LIFF / DB / หลังบ้าน)
- [ ] 🔥 **ปุ่ม "สั่งแทนลูกค้า" ใน OH — นัทอนุมัติแล้ว 23 ก.ค. (ส่งจาก session 05 LINE OA/CRM)** · **ปัญหาที่แก้:** แอดมินกดสั่งแทนลูกค้าที่ไม่สะดวกกดเอง → ออเดอร์ไปกองในชื่อแอดมิน → ข้อมูลลูกค้าเพี้ยนสะสมทุกครั้งที่แอดมินเปลี่ยน (เพิ่งเสียเวลาทั้งวันแกะย้อนหลัง 2,640 ออเดอร์) · **ต้องมี:** ตอนสร้างออเดอร์ใน OH ให้เลือก/กรอก **"ลูกค้าตัวจริง" แยกจาก "คนกด"** → เก็บ 2 ฟิลด์ (`customer_id` = ลูกค้าจริง · `created_by` = แอดมินที่กด) ไม่ใช่ยัดรวมช่องเดียว `[a→u]`
- [ ] **ป้ายประเภทลูกค้าในหน้า customer ของ OH** — แสดง badge จาก `customers.admin_notes` ที่ขึ้นต้น `[ADMIN:...]` / `[B2B:...]` (session 05 จะติดป้ายให้ใน DB) → แอดมินเปิดดูลูกค้าแล้วรู้ทันทีว่าคนนี้ไม่ใช่ลูกค้าปลายทาง `[a→u]`
  - 🆕 **เพิ่ม: โชว์บรรทัด `[PRE-HATO 2020-22]` ใน admin_notes ด้วย** (migrate ลงให้ 2,135 คน) — เป็น**ไซส์ซิ่งกำลังซื้อ**: `{ลูกค้าตัวใหญ่/สม่ำเสมอ/ขาจร} · สั่ง N ครั้ง · รวม X กล่อง (เฉลี่ย Y/ครั้ง) · {ซื้อเป็นเซต(คอร์ส)/รายครั้ง} · {เน้นข้าวกล่อง/กับข้าว/ผสม} · ล่าสุด` → แอดมิน/OH เห็นทันทีว่าลูกค้าคนนี้ซื้อมาก/น้อย ซื้อแบบไหน `[migrate→u]`
- [ ] 🆕 **โฟกัสโปรไฟล์ลูกค้า = "กำลังซื้อ/ไซส์ซิ่ง" ไม่ใช่เมนูโปรด (นัทแก้ 25 ก.ค.)** — เวลาทำ customer profile/segment (เจพลอย legacy import, OH, report): เก็บ **ขนาดออเดอร์ · ซื้อเป็นเซตไหม (คอร์ส) · ข้าวกล่อง vs แพ็คกับข้าว · โปรที่ใช้ · ความถี่/ยอด** → รู้ว่าลูกค้าซื้อมากหรือน้อย · (เมนูที่ชอบ = รอง) `[migrate→u]`
- [ ] 🎁 **ระบบ gift item (โปรแถม) — นัทสั่ง 23 ก.ค. (จาก session 05 LINE OA/CRM)** · **Context:** broadcast win-back 5 ใบใช้โปร "แถมแซลมอนดิบ 100g" (โค้ด 01–04 `SALMON` / 05 `MEALPLAN`) — ตอนนี้ยิงผ่าน Hato LIFF (`2005639551`) ที่**ไม่มีระบบโค้ด** → ลูกค้าต้องทักแอดมิน manual รับ gift (เปลืองแรงแอดมิน + ไม่มีตรวจสอบ) · **นัทเสนอ mechanic:** ช่องกรอกโค้ด gift → **auto-add ไอเทม (แซลมอน) ลงตะกร้าเป็นราคา 0** ทันที (ลูกค้าเห็นของแถมในตะกร้าเลย ไม่ต้องลุ้น) · **ทางทำ:** ต่อยอด `promo_codes` เดิม เพิ่ม type ใหม่ `gift_item` (`scope_value` = sku ของแถม + qty) แทน discount% · **เงื่อนไขที่ต้องมี:** ① เช็คยอดตะกร้าถึงขั้นต่ำ (เช่น 500) ก่อน add ② qty ตามโค้ด (1 หรือ 2 ชิ้น) ③ กันกรอกโค้ดซ้ำ add หลายรอบ ④ gift หลุดออกอัตโนมัติถ้าลดของจนยอดต่ำกว่าขั้นต่ำ · **⏳ ใช้ได้เมื่อ cutover Hato → LIFF under360 ใหม่** (broadcast ปัจจุบันใช้ทักแอดมิน manual ไปก่อน — ไม่บล็อกการยิงคืนนี้) `[a→u]`
- [x] ✅ **แก้จากผลเทส iPhone รอบแรก (23 ก.ค.)** — ① "ส่งด่วน" → **"ส่งระบุเวลา"** + กดแล้วโชว์ "เรท Lalamove" ② ช้อนส้อม **default ไม่ติ๊ก** + ปุ่มเล็ก/สีจาง (กดยากขึ้น) + คำใหม่ "ต้องการรับช้อนส้อมพลาสติก" + fallback true→false ทั้ง 2 จุด `[u]`
- [ ] 🚚 **ต่อ Lalamove API จริง** (นัทสั่ง 23 ก.ค.) — ตอนนี้ slot "ส่งระบุเวลา" ยังไม่มีเรทจริง ต้องต่อ API ดึงราคา + (เฟสถัดไป) auto-booking · เกี่ยวกับ agent **พี่เก่ง** (delivery routing) · v1 = ขอราคา realtime ก่อน, booking ให้ admin approve `[u]`
- [ ] 🎨 **ดีไซน์ใหม่ + เลิกใช้ emoji ทั้งระบบ** (นัทสั่ง 23 ก.ค. "ขอมินิมอล") — **รอดีไซน์จาก GPT ก่อน** แล้วค่อยลงมือ (อย่าเพิ่งไล่ลบ emoji เอง เดี๋ยวชนกับดีไซน์ใหม่) · จุดแรกที่นัทชี้ = **หน้าสรุปสั่งสำเร็จ (s-ok)** `[u]`
- [ ] 🐛 **`orders.delivery_distance_km` ไม่เคยถูกบันทึกเลย** (null ทุกออเดอร์ รวม U-0724-001) — มีคอลัมน์แต่ LIFF ไม่เขียน → ตรวจย้อนหลังไม่ได้ว่าค่าส่งคิดจากระยะขับจริงหรือเส้นตรง · ควรเขียน distKm + วิธีที่ใช้ (road/haversine) ตอน submit `[u]`
- [ ] 💡 **Agent QA แอดมิน LINE OA** (agent ตัวถัดไป · scope เอิธ) — อ่านแชทแอดมิน↔ลูกค้า → flag ตอบ error/ตอบไม่ครบ/ลูกค้าเงียบ → สรุปตารางให้นัท · ✅ **22 ก.ค. ปลดล็อกแล้ว (session 05)!** chat.line.biz เข้าถึงได้ (นัท login Chrome) + `get_page_text` อ่านบทสนทนาเต็ม+รายชื่อแชทได้ scale (ที่ว่าอ่านไม่ได้=ผิด) → **พร้อม build** (ดู `web/eath/line_oa_deep_dive.md`) `[a/e]`
- [ ] 💡 **Agent monitoring (ทั่วไป)** — หน้าให้นัทดู action ที่ agent เสนอ + approve ก่อนรันจริง + log — รอสเปก
- [x] ✅ **รูปเมนู LIFF (22 ก.ค.)** — อ่านโบรชัวร์ Drive 7 โฟลเดอร์ (browser DOM ดึง file ID) → จับคู่ code เป๊ะ 70 เมนู → download→Storage `menu-images`→image_urls · SQL bucket+policy (นัทรัน) · ชื่อตรง verified (BB ไก่/หมูไม่สลับ) · เหลือ 7 เมนูไม่มีรูป (BJ/D061/LC34) + กราฟิก info/offer ยังไม่ได้ใช้
- [ ] 🔥 **build FB attribution dual-track — UN-PARK (นัทสั่ง 22 ก.ค. "ใกล้เสร็จแล้ว ไม่ต้อง park")** · ยิงแอดรอบ 1 แล้ว (log มือ) → **ต้องมีทันรอบ 2** · 3 ชิ้น:
  - ① **แก้ `landing.html`** (m/u): ตัดรีวิวปลอม "ลด 3 กิโล" (ผิดกฎ+เสี่ยง Meta reject) + ใส่ web_events (pageview/cta_click) + capture UTM → `localStorage.u360_utm` + เนื้อหาให้ตรง Stock/MP (ตอนนี้โชว์ราคา MP เก่า+"จ/พ/ศ" ผิดบริบท)
  - ② **LIFF อ่าน `u360_utm` ตอน checkout → เขียน orders** (u): `utm_source/medium/campaign/content` + `attr_method`('auto'/'manual'/'both') + `attr_tagged_by`
  - ③ **SQL เพิ่มคอลัมน์ utm/attr ใน orders** (นัทรัน) + OH dropdown แคมเปญ (manual) + report รวม 2 แหล่ง dedup `DISTINCT orders.id` เรียงด้วยบาท
  - spec เต็ม: `web/eath/utm_taxonomy.md` · **ที่มา: ห้อง 06 Ads-track**
- [ ] (session close) log `u0.4.29–36` → HISTORY + CLAUDE.md: attribution spec (park) · **Platform↔Product mapping** (เอิธ 22 ก.ค.: MP/HP-LC→IG กลุ่มมีฐานะไลฟ์สไตล์เมือง · Stock/แพคกับข้าว→FB กลุ่มคุ้มเงินสะดวก · เลือก platform ตามโปรดักต์↔กลุ่ม ไม่ใช่ "platform ไหนไม่เวิร์ค") · payment_status/free_shipping/ระยะขับจริง/รูปเมนู 70/thumb
- [x] **u0.4.25–34** (16–20 ก.ค.): multi-round split · multicat · perf init batch · payment_status 3 หน้า (LIFF/OH/KQ) · ระยะขับจริง (Distance Matrix) · แพคเกจส่งฟรี + badge · live presence · master ค่าส่ง/brand rules `[u]`

## 🟣 A-track / เอิธ (agents / competitor intel / marketing ops)
- [x] ✅ **LINE OA/CRM deep dive (a0.4 · session 05 · 22 ก.ค.)** — เข้า manager.line.biz+chat.line.biz จริง (นัท login Chrome) → verify เลข (reach 23,246/block 25,911>reach) · **พลิก 3 เข้าใจ:** audience=native LINE OA ไม่ใช่ Hato · segment 10k=active-user ไม่ใช่ mealplan · แชทอ่านได้เต็ม→Agent QA ปลดล็อก · **Segment framework=RFM จาก order data** (never-bought 1,034+หาย 904=84% inactive · line_uid 2,300 ยิงได้) · tag พึ่งไม่ได้(95% มั่ว)→ใช้ order data · `web/eath/line_oa_deep_dive.md` `[a/e]`
- [x] ✅ **skill `under360-catchup`** — ย่อยให้ตามทัน + กัน open-loops หล่น (นัท pain: พิมพ์ทิ้งเยอะแล้วลืม/Claude พิมพ์ 10 ตอบ 1) `[a]`
- [ ] **LINE OA broadcast แข็งขึ้น (กำลังทำ · session 05 → ปลายทาง handoff เอิธ routine):** ① segment RFM (สร้าง audience จาก order data) ② rulebook ยิง (เลิกกว้าง/CTA/deadline) ③ message templates ต่อ segment ④ calendar · **ค้าง: เช็ค LINE upload audience จาก uid** · MP/เซ็ต/ข้าวกล่อง รอ Hato รายงานรายสินค้า · verify catch-all 560k outlier `[e]`
- [ ] ⭐ **บัญชี (เสา 2/4) — โฟกัสใหม่ นัทสั่ง 20 ก.ค.:** ขาย=`orders` มีครบ (subtotal/total/payment_account/order_items → report.html ต่อจริง) · **ซื้อ/ต้นทุน=ไม่มีที่จดเลย** (ทุกตาราง expense 404) → สร้าง `expenses` table + หน้าจดต้นทุน (มือถือ, หมวด วัตถุดิบ/ส่ง/แกส/ไฟ/คน) + report กำไร-ขาดทุน · รอนัทตอบว่าจดต้นทุนไว้ที่ไหน `[a]`
- [ ] เตียง JD (agent กราฟิก) — พร้อมร่าง: คูปอง/QR/ปกบล็อก/infographic/widget ทำเองได้ · ภาพ Ads static/video = ร่างบรีฟให้ AI อื่น (park หลังบัญชี) `[a]`
- [ ] เอิธ routine job (weekly competitor+trend+digest อัตโนมัติ) — รอเคาะ 3 ข้อ (ทำอะไร/เมื่อไหร่/ผลไปไหน) · โยงกับ weekly digest ของ [e] `[a]`
- [x] เอิธ subagent (a0.3) + desktop widget interactive (คลิก✎สั่ง/AUTO toggle/ลากย้าย) commit `a2c4026` — สั่งจาก widget รันได้จริง `[a]`
- [x] ✅ **วิเคราะห์แอดพลอยฝั่ง Meta เสร็จ (22 ก.ค.)** — โกยครบ campaign/ad-set/ad (฿41,840/3ปี) + ถอดวิธี "แปลกแต่ได้ผล" + benchmark คู่แข่ง → `web/eath/fb_ads_ploy_history.md` · ส่งต่อ 06 แล้ว `[e]`
- [ ] (หลัง beta, รอ attribution มี data) ทำ weekly ad digest จริง — template พร้อมแล้ว `[e]`
- [ ] **Ad รอบ 1 (กำลังทำ):** ยิง 2 ตัว ฿300/วัน — A) FB 15 แพคกับข้าว ฿1,099 · B) IG เซ็ตทดลอง MP ลด 100 · ปลายทาง LINE OA + log มือ `[e]`
- [~] 🔥 **Custom Audience "ลูกค้าเก่าสด"** — S1-S3 เสร็จ (06 · 22 ก.ค.) · เหลือ S4-S6 = นัทอัพ Meta `[e]`
  - [x] S1. ไฟเขียว PII ✅ (นัทส่งไฟล์มาเอง) · S2. ไฟล์พลอย = "ลูกค้าเจ 2562-2566" (3 ลิงก์ · เปิดได้ 1 · อีก 2 not found รอ re-share)
  - [x] S3. **merge+dedupe เสร็จ** → `download/meta_custom_audience.csv` = **2,746 แถว** (DB 2,154 + เจใหม่ 592 · เจซ้ำ DB แค่ 42) · gitignore · สคริปต์ `download/build_audience.js`
  - [ ] S4. **นัทอัพ `meta_custom_audience.csv` เข้า Meta** → Custom Audience "Under360 ลูกค้าสด"
  - [ ] S5. **นัทสร้าง Lookalike 1-3%** จาก audience นั้น (cold)
  - [ ] S6. targeting: ad set 1 = Custom สด + union audience เก่าพลอย · ad set 2 = Lookalike
  - [ ] (ค้าง) 2 ลิงก์เบอร์ที่เหลือ (re-share) → รันซ้ำเติมเข้า CA + migration ได้เลย
- [ ] **Ad รอบ 2 (หลังพิสูจน์รอบ 1):** ① MP ต่อคอร์ส ลด 10% (IG retention) ② 9 ข้าวกล่อง ฿1,099 (FB) · 🎯 **สำคัญ: จัดจังหวะเทสต์ ข้าวกล่อง vs แพคกับข้าว head-to-head** — ดูว่าแต่ละตัว audience/แอดไหน target โดนคนละกลุ่มไหม `[e]`
- [ ] ⭐ (option) ร่าง template ข้อความทาบทาม influencer + ข้อเสนอ gifting/ค่าตัว ให้พลอย `[e]`
- [ ] พลอย: verify engagement ตัว 🟡 ใน influencer_master ก่อนทาบ (เปิด IG เช็คคอมเมนต์จริง) `[e]`
- [x] ชีท master พร้อมใช้: `web/eath/influencer_master.csv` (44 คน, WARM LEAD 5) + `competitor_master.csv` (42 ราย เรียงตามภัย) `[e]`
- [x] verify influencer A (Social Blade/TikTok) + B (IG via Chrome นัท) — ยอดจริง + ธง warm-lead `[e]`
- [x] FB ads audit + ad-measurement framework (utm_taxonomy/kpi_roas/digest/competitor_ad_benchmark) `[e]`
- [x] delivery fee benchmark (เคลมได้/ห้ามเคลม ค่าส่ง) — web/eath/delivery_fee_benchmark `[e]`
- [x] แก้ brand copy (ปรุงสด 10 ปี / ค่าส่ง) ส่ง U+M แล้ว · UTM taxonomy spec lock ให้ M+U `[e]`

## 🟠 Migrate-track — 🟢 **ยังไม่ handoff** (Hato 2 ปีเข้าครบ · เหลือ เมนู HS + pre-Hato)
- [x] ✅ **HATO 2 ปี = เสร็จสมบูรณ์ (verify 24 ก.ค.)** — ลูกค้า **3,217** (ผูก hato_id 1,315 · มีที่อยู่ 2,455) · ออเดอร์ **15,801** (**เลขซ้ำ 0 ตัว**) · รายเมนู **40,845** · ยอด **฿16.75M** · คงวันที่จริง · **ไม่ทับ tier/loyalty** · idempotent
  - [x] LIFF (HT-) **10,834 ออเดอร์ ครบ 25/25 เดือน** (07/2024–07/2026) — **มีรายเมนูครบ 100%** → ปลดล็อกน้องนิว
  - [x] HatoStore ช่องทางเก่า (HS-) **4,939 ออเดอร์** (23 ด. 08/2024–06/2026) — การเงิน+สมาชิก+วันสมัคร · ⚠️ **ไม่มีรายเมนู** (report ชนิดนี้ไม่มีคอลัมน์เมนู) · ขาด 07/2024+07/2026
- [~] 🆕 **เจพลอย (ลูกค้า 2562-2566) แกะแล้ว → ส่งงานให้ u** (นัทสั่ง 22 ก.ค.): `download/migrate_legacy_customers_ploy_je.csv` = **491 ราย** (มีชื่อ+ที่อยู่+เบอร์ 462 + เบอร์ล้วน 29 · 634 มือถือ unique จาก 13 แท็บ · ซ้ำ DB แค่ 42 → **592 คนใหม่**) · คอลัมน์ `display_name,phone,phone_backup,default_address,line_fb_name,source,segment` (ฟอร์แมตลูกค้าเก่า) · **ยังไม่ import ตามนัทสั่ง** → u map เข้า `customers` + **upsert idempotent by phone** (กันทับ 42 ที่ซ้ำ) + tag segment "ลูกค้าเก่ามาก" · ⚠️ รอ 2 ลิงก์ที่เหลือ (นัท re-share) ก่อนปิด batch `[u]`
  - [~] **u dry-run เสร็จ (07 · 22 ก.ค.):** 491 แถว → **454 ใหม่ / 37 ซ้ำ DB** (normalize +66→0 แล้ว dedup by phone · 0 bad) · map: `source_first=legacy` · `source_campaign=ploy_je_2562_2566` · `tier=bronze` · address→`addresses` jsonb · backup+FB→`admin_notes` · แผน: insert 454 ใหม่ + **skip 37 ซ้ำ (ไม่ทับ tier/loyalty)** · **รอ GO เขียนจริง**
- [ ] 🍽️ **เมนูของ HS- 4,939 (ช่องเก่า)** — report transaction ไม่มีคอลัมน์เมนู → 🔴 นัทลองสร้าง **"รายงานรายสินค้า" ของช่องเก่า (LineHatoStore/hatoheart) 1 เดือน** ส่งมา → Claude เช็คว่า key ผูกกับ `HS-`(transaction_id) ได้ไหมก่อนลุยทั้งชุด
- [x] ✅ **pre-Hato 2020-2022 เข้าแล้ว (25 ก.ค.)** — แกะชีทมือ 18 ไฟล์ (Google Sheets รายสัปดาห์ · parser detect ฟอร์แมตเอง ข้ามปีได้) → **2,135 ลูกค้าใหม่** ลง `customers` (source=`pre_hato`) พร้อม**โปรไฟล์ไซส์ซิ่งกำลังซื้อ**ใน `admin_notes` (`[PRE-HATO 2020-22] {ตัวใหญ่/สม่ำเสมอ/ขาจร} · สั่ง N ครั้ง · รวม X กล่อง เฉลี่ย Y/ครั้ง · ซื้อเซต/รายครั้ง · ข้าวกล่อง/กับข้าว · ล่าสุด`) → **รู้ว่าใครซื้อมาก/น้อย ซื้อแบบไหน** (นัทแก้โฟกัส: กำลังซื้อ ไม่ใช่เมนูโปรด) · 240 คน "ตามมา Hato" เก็บ `prehato_existing_240.json` merge ทีหลัง (ไม่แตะ กันชน 05) · ตัด ฿ (parser noise) + คนไม่มีเบอร์ 947 · **ไม่ลงออเดอร์ดิบ**
- [ ] 🆕 **pre-Hato ปีเก่ากว่า: 2017 · 2018 · 2019 + ก่อน 2017** — pipeline พร้อม (parser+subagent) · รอนัทสั่งลุยต่อ · ⚠️ บางไฟล์ 2020 (เม.ย.-มิ.ย.) ถูกลบเข้าถึงไม่ได้
- **ปลดล็อกแล้ว:** น้องนิว (ประวัติเมนูรายคน) · พี่เก่ง (ที่อยู่+พิกัด 2,455) · CRM/RFM win-back · Loyalty (มี data จริง — รอนัทเคาะ tier logic)
- pipeline + scripts (parser xlsx เอง/build/import/header-diff) + วิธีดึงไฟล์ (Hato→email ลิงก์ 24ชม.→Drive→curl→unzip) จดใน memory `migrate-customer-order-history`

---

## ✅ เพิ่งเสร็จ (ล่าสุด — เก็บสั้นๆ กันซ้ำ)
- `[a]` **22 ก.ค.: master (CLAUDE.md) up a0.4 แล้ว** (LINE OA/CRM deep dive · session 05 · นัทให้ permit ไม่รอปิด session) — track อื่น log ส่วนตัวเองต่อได้ **ไม่ต้องทำ LINE OA ซ้ำ** · u เหลือ log u0.4.29-36 (โค้ด u-track)
- `[m]` real-time presence + noti · blog ปก 61 · redirect plan+vercel.json · gitignore contacts/eath (กัน PII/intel หลุด)

*อัปเดตล่าสุด: 22 ก.ค. 2026 (migrate: import ออเดอร์เก่า 7,577 — LIFF 6ด. + HatoStore 23ด. · เหลือ LIFF 19ด. รอนัทสร้าง report)*

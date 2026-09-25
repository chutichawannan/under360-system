---
name: migrate-customer-order-history
description: นัทจะรวบรวมไฟล์ข้อมูลลูกค้า+ประวัติสั่งซื้อ 10 ปี (รวม pre-Hato) มา migrate เข้าระบบใหม่
metadata: 
  node_type: memory
  type: project
  originSessionId: f9cbccfe-d1ee-4a6c-b577-e7bd2b4399f9
  modified: 2026-07-28T15:42:14.979Z
---

นัทตัดสินใจ (14 ก.ค. 2026) จะ **รวบรวมไฟล์ข้อมูลลูกค้า + ประวัติการสั่งซื้อทั้งหมดตั้งแต่เปิดร้าน ~10 ปีก่อน รวมยุคก่อน Hato ด้วย** เพื่อ migrate เข้าระบบใหม่ (`customers`/`orders`/`order_items`) — เป้าหมายคือ "ให้มีประวัติลูกค้าจริง"

**สถานะ (24 ก.ค. 2026): ✅ HATO 2 ปี = เสร็จ/HANDOFF แล้ว** — verify: ลูกค้า **3,217** (hato_id 1,315 · ที่อยู่ 2,455) · ออเดอร์ **15,801 เลขซ้ำ 0 ตัว** · รายเมนู **40,845** · ฿16.75M · **เหลืออย่างเดียว: ยุคเก่ากว่า 2 ปี + pre-Hato** (นัทส่งไฟล์เมื่อไหร่ รัน pipeline เดิมซ้ำได้ idempotent)
🛑 **แก้ความเข้าใจใหญ่ (นัทเจ้าของยืนยันเอง 28 ก.ค.): `HS-` = log เก็บแต้ม/loyalty ของ Hato (บัญชีแอดมิน "สังขกร") ไม่ใช่ช่องขายจริง/ไม่ใช่ออเดอร์ขาย!** → ยอดขายจริง = **HT- (LIFF) อย่างเดียว** (ตก ~30% ค่อยเป็นค่อยไป ไม่ใช่ดิ่ง 37-49%) · P re-source HS- ใน DB เป็น `source='hato_loyalty_log'` แล้ว · **HS- 2026 ที่ขาด = ไม่ต้องดึง/ไม่ต้อง regenerate (ยกเลิก)** · บทเรียน: forensic (customer_id match → 85% distinct) บอกได้ว่า "คนละธุรกรรม" แต่บอกไม่ได้ว่า "คืออะไร" → เจ้าของตอบ · อย่าตีความ HS- เป็นยอดขายอีก
- **2 ช่องทาง (ตามที่เคยเข้าใจ — ②ผิด ดูข้างบน):** ① LIFF `HT-` (hatostore/171, "รายงานออร์เดอร์ทั้งหมด" 61 คอลัมน์ ข้อมูลครบ = **ยอดขายจริง**) = ครบ 25 เดือน 10,834 ออเดอร์ ② `HS-` (hatoheart/102 "ข้อมูลซื้อ-ขาย/transaction" 30 คอลัมน์) = **4,939 log แต้ม ไม่ใช่ยอดขาย** (key=transaction_id)
- **pre-Hato 2016-2022 (25 ก.ค.): ✅ ครบทุกปี — import 4,244 ลูกค้าเก่า** (จาก 79 ชีทมือ · 30,794 ออเดอร์) · โปรไฟล์ = **ไซส์ซิ่งกำลังซื้อ ไม่ใช่เมนูโปรด** (นัทแก้โฟกัส 25 ก.ค.: `[PRE-HATO] ระดับ·ครั้ง·กล่อง·เฉลี่ย·เซต/รายครั้ง·ข้าว/กับข้าว·ช่วงปี`) · **ยังอยู่ Hato จริง 305 (match line_uid) · หาย 4,244=win-back** · VIP ตลอดกาล=คุณฝน 5,778 กล่อง(พีค 2016,หาย) · ไฟล์ตาราง `Desktop\pre-Hato_ลูกค้าเก่า_2016-2022.csv` · scripts: `pre2018_parse.js`(detect ฟอร์แมต) `build_prehato.js`(รวม+clean+CSV) `import_prehato.js` `vip_report.js` · ⚠️ name-only+ไม่มีเบอร์ไม่ import · โปรดึงไม่ได้(ชีทไม่มีคอลัมน์) · 305 merge รอ coordinate 05
- **pre-Hato 2020-2022 (เก่า):** — แกะจาก Google Sheets รายสัปดาห์ (โน้ตแอดมินมือ, ตารางเมนู×ลูกค้า) เจ้าของ under360food.02/ploy/chutichawannan ในโฟลเดอร์ Order2018..Order2022 (ในนั้นเป็น **shortcut** — resolve ด้วย `title = 'ชื่อเป๊ะ'` search หา real fileId; read_file_content ตาม shortcut ไม่ได้) · **parser `pre2018_parse.js` detect ฟอร์แมตเอง** (หา "ราคา" อยู่คอลัมน์ไหน → เมนูหลังจากนั้น · label row หา name/addr) ครอบทุกยุค (ฟอร์แมตต่างกันข้ามปี) · flow: subagent (ปีละตัว) อ่าน+parse→JSON `scratchpad/prehato/` → `build_prehato.js` รวม+clean noise (แถวสต๊อก/ยอดรวม/qty>40 ปลอม)+dedupe เบอร์ → `import_prehato.js` ลง customers (source=`pre_hato`, โปรไฟล์เมนูโปรดใน admin_notes) · **ตัด ฿ (noise) · เฉพาะคนมีเบอร์** · 240 คนซ้ำ DB เก็บ `prehato_existing_240.json` (ไม่แตะ กันชน 05) · **เหลือ 2017/2018/2019 + ก่อน 2017** (บางไฟล์ถูกลบ)
- ✅ **[ปิดแล้ว 28 ก.ค. — ยกเลิก] HS- 2026 หายเกือบหมด:** ไม่ต้องดึงแล้ว เพราะ HS- = log แต้ม ไม่ใช่ยอดขาย (ดูบนสุด) · เก็บบันทึกไว้กันงงย้อนหลัง ↓
- 🔴 ~~HS- 2026 source-gap (f-track เจอ 27 ก.ค.):~~ ไฟล์ transaction ต้นทางที่นัทโหลด 20 ก.ค. สำหรับ ม.ค.+มี.ค.-ก.ค.2026 **ออกมาเกือบว่าง** (9KB/12แถว vs ก.พ. 61KB/410แถว) → HS- 2026 ใน DB มีแค่ ~12-13 ใบ/เดือน (ก.พ. 410) ทั้งที่นัทยืนยัน HatoStore **ยังขายปกติ** → ช่องว่าง ~฿2.1M ทำให้ข้อสรุป "ยอดตก 37-49%" **น่าจะผิด (data artifact ไม่ใช่ยอดตกจริง)** · **แก้:** นัท regenerate รายงาน HatoStore ม.ค.+มี.ค.-ก.ค.2026 (ลอง มี.ค. เดือนเดียวก่อน — ถ้ายังว่าง = ปี 2026 ย้ายไป report คนละตัว ต้องหา) → forward flidty → re-import (HS-<txn_id> idempotent) · **ก.ค.2026 ไม่มีไฟล์ในโฟลเดอร์เลย** · ส.ค./ก.ย.2025 ก็ดูต่ำ (91/148) อาจขาดด้วย
- **ยังขาด (Hato):** LIFF อีก 19 เดือน (ครบแล้ว 24 ก.ค.) · **order_items ช่องเก่า HS- (ขอ "รายงานรายสินค้า" hatoheart)** · Hato เก่ากว่า 2 ปี
- **scripts อยู่ scratchpad session นี้:** `lib_xlsx.js`(parser zip เอง) `build.js`+`import.js`(LIFF) `build_txn.js`+`import_txn.js`(HatoStore) `hdiff.js`(header validate) — idempotent ทั้งหมด (skip order_number ที่มี, ไม่ทับ tier/loyalty)

**วิธีได้ไฟล์ (สำคัญ — ทำซ้ำได้):** Hato report ส่งเป็น**อีเมลลิงก์ดาวน์โหลด** (ไม่ใช่ไฟล์แนบ) ลิงก์**อายุ 24 ชม.** → นัทสร้าง report ใน `portal.hatohub.com` (หน้ารายงาน, dropdown เลือกชนิด, ทีละเดือน ≤31วัน) → เด้งเข้าเมล chutichawannan@ → **นัทฟอเวิดเข้า flidty.c@** (บัญชี Gmail/Drive ที่ Claude connector อ่านได้) → นัทกด **"เพิ่มทั้งหมดไปยังไดรฟ์"** → Claude: Drive `download_file_content` (.eml base64) → QP-decode → ดึงลิงก์ awstrack → `curl -L` โหลด `.xlsx.zip` → แตก → parse. **htmlBody จาก Gmail get_thread ใช้ไม่ได้ (QP เพี้ยน `=`) ต้องอ่าน .eml ดิบจาก Drive.** ⚠️ automation คุม dropdown ของ Hato (antd) ผ่าน browser pane ไม่เวิร์ค — ให้นัทกดสร้าง report เอง

⚠️ **ห้ามเชื่อว่าทุกเดือนฟอร์แมตเหมือนกัน 100% (นัทเตือน 21 ก.ค.)** — Hato อาจเปลี่ยน header/version ข้ามปี (v6 vs เก่า, hatoheart vs hatostore) · transform ผม map ตาม**ชื่อ header** (ทน reorder/เพิ่มคอลัมน์) แต่ถ้าชื่อต่างจะเงียบๆ ใส่ค่าว่าง · **กติกา: ก่อน import ทุกรอบ ต้องทำ "header diff" ทุกไฟล์เทียบ 61 คอลัมน์ของ ส.ค.2024 ก่อน → เดือนไหนต่าง flag + ปรับ mapping เฉพาะฟอร์แมต ห้าม import มั่ว**

**Report ชนิด "รายงานออร์เดอร์ทั้งหมด" = 61 คอลัมน์ · 1 แถว=1 ออเดอร์ · ไม่มีรายเมนู** (order_items ต้องหา report ชนิดอื่น เช่น รายสินค้า/transaction) · วันที่เป็น Excel serial ต้องแปลง · เลขออเดอร์ = HT-xxxx

**เคาะ mapping (21 ก.ค.):** ① **order_number = HT-xxxx ตรงๆ** (กุญแจ idempotent upsert) ② **dedupe ลูกค้า = เบอร์โทร (normalize) หลัก + line_uid สำรอง** ③ **ไม่ทับ loyalty_points/tier เดิม** ④ member_id→`customers.hato_id`, ที่อยู่+พิกัด→`customers.addresses`(jsonb)/`orders.delivery_lat/lng` ⑤ source='hato' ⑥ ทำ orders+customers รอบนี้ก่อน, order_items ทีหลัง · **anon key insert customers/orders ได้ (RLS เปิด)** — import ผ่าน REST เองได้ ไม่ต้องให้นัทรัน SQL · ⚠️ batch ใหญ่แตะ DB ร่วม u-track → คุยนัทก่อนเขียนจริง
**🔔 CHASE (นัทสั่งเอง):** เวลานัทไปยุ่งแชทอื่นนานๆ ให้ **ทวงไฟล์ migrate ที่เหลือ** (Hato ปีเก่ากว่า 2 ปี + pre-Hato) เชิงรุก อย่ารอให้นัทถาม

**ย้ายมาแล้วบางส่วน:** ตาราง `customers` มี legacy `loyalty_points` (492/2,160 คน) + `tier` จากระบบเก่าอยู่แล้ว — แต่ loyalty logic นัทสั่งหยุดรอจน migrate ครบ (ดู [[business-context-and-versioning]])

**ปลดล็อก:** loyalty tier threshold · น้องนิว assign เมนูลูกค้าเก่า (ต้องมี ~10 มื้อล่าสุด) · CRM win-back · package_conditions

**Why:** เป็น source data ที่ Claude สร้างเองไม่ได้ — ต้องรอนัทส่งไฟล์ · เมื่อไฟล์มา = งานเลนโค้ด (เขียน import script วิเคราะห์ไฟล์ → Supabase ตรงๆ แบบเดียวกับ blog import / batch photo)
**How to apply:** เมื่อนัทส่งไฟล์ → ถามรูปแบบ/แหล่ง (Hato export / ชีท Excel / ฐานเดิม) → ทำ field mapping เข้า schema จริง → import แบบ upsert กันซ้ำ (key = เบอร์โทร/line_uid) · อยู่ในลำดับ "หลัง beta test" ตาม [[launch-roadmap-beta-test]] — ถ้านัทดันงานนี้ก่อน beta ให้เตือนลำดับ

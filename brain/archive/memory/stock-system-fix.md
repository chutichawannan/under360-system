---
name: stock-system-fix
description: "ระบบสต็อก menu_items เคยพังทั้งเส้นทาง 2 รอบ (คอลัมน์ผิดชื่อ แล้ว sync ผูกกับ dead code) — แก้แล้ว commit 9620cc1 + 12299a4, นิยามคอลัมน์ใหม่ต้องรู้ไว้"
metadata: 
  node_type: memory
  type: project
  originSessionId: bde8aa49-da42-434a-9109-fde3459291b7
---

**ค้นพบ 2026-07-03:** ระบบสต็อกของ `menu_items` พังทั้งเส้นทางมาตั้งแต่แรก ไม่ใช่แค่ยังไม่มีฟีเจอร์:
- LIFF/KQ เก่าอ้างคอลัมน์ `stock_quantity` ซึ่ง**ไม่มีอยู่จริงในตาราง** — คอลัมน์จริงคือ `stock_total` / `stock_reserved` / `actual_stock`
- ผลคือ LIFF กดซื้อได้ตลอดไม่ว่าสต็อกเท่าไหร่ (fallback เป็นไม่จำกัดเสมอเพราะ `undefined != null` เป็น false)
- KQ query โหลด `menu_items` **พังทั้งอัน error 400 แบบเงียบๆ** มาตลอด — แท็บ "รายสินค้า" เทียบของจริง/เหลือผิดตลอด
- หน้า DB (`main_database_v2.html`) ปุ่ม −/+ สต็อกมีอยู่แล้ว **แต่เซฟลง local (`kitchen_data.recipes`) เท่านั้น ไม่เคย sync ขึ้น `menu_items` จริงเลย** แถม `saveStockInline()` (ช่องพิมพ์ตรง) เรียกฟังก์ชันที่ไม่มีอยู่จริงด้วย

**แก้แล้ว (commit 9620cc1):**
- `liff_customer.html`: เพิ่ม `effectiveStock(item)` helper ใช้ `stock_total` จริง แทนที่ทั้ง 4 จุดที่อ้าง `stock_quantity`
- `kitchen_queue.html`: แก้ query ให้ใช้ `stock_total` แทน
- `main_database_v2.html`: เพิ่ม `syncStockDebounced(r)` (debounce 500ms) ผูกทั้งปุ่ม `chgStockFast()` และช่องพิมพ์ `saveStockInline()` (สร้างใหม่ ของเดิมไม่มี) → sync ขึ้น `menu_items.stock_total` จริงผ่าน `.update().eq('code',...)`
- แถบหมวดหน้า DB (`.cat-tab-strip`) เพิ่ม drag-to-scroll ด้วยเมาส์ (commit f599c12, pattern เดียวกับ LIFF `.ctabs`)

**นิยามคอลัมน์ `stock_total` ตั้งแต่นี้ไป (สำคัญ ต้องรู้ก่อนแตะโค้ดสต็อก):**
- `NULL` = ไม่จำกัด (**ค่าเริ่มต้น** — DROP DEFAULT แล้ว เมนูใหม่จะเป็น NULL อัตโนมัติ)
- `0` = หมดสต็อกจริง (ลูกค้ากดซื้อไม่ได้ โชว์ "หมดแล้ว")
- ตัวเลข `N > 0` = เหลือขายได้ N ชิ้น — badge "เหลือ N ชิ้นสุดท้าย" โชว์อัตโนมัติเมื่อ ≤5

**⚠️ กับดักที่เคยเกือบพัง:** ก่อน fix ทุกแถวใน DB มี `stock_total = 0` เหมือนกันหมด (ไม่เคยมีใครตั้งค่าจริง) — ถ้า deploy โค้ดที่ตีความ 0=หมดสต็อกโดยไม่รัน migration ก่อน จะทำให้**สินค้าทุกชิ้นในร้านโชว์หมดพร้อมกันทันที** รัน SQL migration (`scripts/sql_stock_fix.sql`) แปลง 0→NULL ทั้งหมดไปแล้วก่อน push — ยืนยันผ่าน REST แล้วว่าปลอดภัย

**🐛 บั๊กซ้อน พบ 2026-07-04 (แก้แล้ว commit `12299a4`):** การ fix รอบแรก (9620cc1) ผูก `syncStockDebounced()` เข้ากับ `chgStockFast()`/`saveStockInline()` ใน `renderPttCard()` — แต่ `renderPttCard()` เป็น **dead code ไม่เคยถูกเรียกที่ไหนเลยในทั้งไฟล์**! ปุ่ม +/- สต็อกจริงที่ใช้งานทุกวัน (การ์ดเมนูหลักผ่าน `renderRecipeCard()`, class `.stock-ctrl`) มี handler แยกต่างหาก (`commitStock()` ใน `attachHandlers()`) ที่**ไม่เคยเรียก sync เลยตั้งแต่แรก** — แปลว่าตลอดมาแอดมินแก้สต็อกที่หน้า DB ทางที่ใช้จริง เห็นแค่ local เปลี่ยน แต่ `menu_items.stock_total` จริงไม่เคยอัพเดทตาม ทั้งที่คิดว่า fix ไปแล้วตั้งแต่ 9620cc1 — verify ผ่าน preview+REST แล้วว่า PATCH ยิงจริง (เช็ค network request ตรงๆ ไม่ใช่แค่เช็ค local state) พร้อมเพิ่มปุ่ม "+10" เติมสต็อกทีละ 10 ในคราวเดียวกัน

**Why:** เป็นบั๊กเงียบมานาน ไม่มีใครสังเกตเพราะไม่เคยมีใครตั้งสต็อกจริงจังเลย (LIFF unlimited เสมอ = ดูเหมือนใช้งานได้ปกติ) — รอบสองเป็นเพราะไฟล์นี้มี 2 ชุด stock control คนละที่ (`renderPttCard`/`renderRecipeCard`) แต่แก้แค่ชุดที่ไม่ได้ใช้งานจริง
**How to apply:** ถ้าจะแตะโค้ดเกี่ยวกับสต็อกอีก ต้องอ้าง `stock_total`/`stock_reserved`/`actual_stock` เท่านั้น ห้ามใช้ `stock_quantity` (ไม่มีจริง) — **และต้องเช็คว่าฟังก์ชันที่แก้ถูกเรียกจาก UI path ที่ใช้งานจริง ไม่ใช่แค่ syntax ถูกแต่เป็น dead code** (บทเรียนจากบั๊กซ้อนรอบนี้ — grep หา call site ก่อนเชื่อว่า fix ทำงาน) — `stock_reserved` ยังไม่มีใคร increment อัตโนมัติตอนสั่งซื้อ (ตัดสินใจไว้แล้วว่ายังไม่ทำระบบ reserve ข้าม order ในรอบนี้ กัน over-engineer/race condition ที่ยังไม่จำเป็นสำหรับสเกลร้านตอนนี้) เกี่ยว [[response-style-concise]]

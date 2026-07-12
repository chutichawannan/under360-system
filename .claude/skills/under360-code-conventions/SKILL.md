---
name: under360-code-conventions
description: กติกาการเขียนโค้ดของ Under360 — ใช้ทุกครั้งที่จะสร้าง/แก้/รีวิวไฟล์ .html หรือ .js ใน repo under360-system (liff_customer, liff_register, liff_profile, main_database_v2, operation_hub, kitchen_queue, home_editor, report, landing, api/webhook.js). ต้องอ่านก่อนแตะโค้ดทุกครั้ง แม้จะเป็นการแก้เล็กๆ เพราะมีกฎที่ผิดบ่อยแล้วพังทั้งหน้า (sb vs getSB, single-file, duplicate style tag, syntax check).
---

# Under360 — Coding Conventions (ห้ามผิด)

## กฎโครงสร้าง
- **Single file เท่านั้น** — HTML + CSS + JS อยู่ในไฟล์เดียว **ห้ามแยก .css/.js**
- ห้ามใช้ framework/build step — vanilla เท่านั้น
- ห้ามใช้ `localStorage` เก็บ state จริง → Supabase อย่างเดียว (ยกเว้น UTM capture ที่ตั้งใจ)

## กฎ Supabase client (ผิดบ่อยที่สุด)
```
ไฟล์ LIFF (liff_*.html)  → const sb = supabase.createClient(URL, KEY) ตรงๆ  ❌ ห้ามใช้ getSB()
main_database_v2.html    → ใช้ getSB() pattern
```

## กฎอื่นๆ ที่พังบ่อย
| กฎ | รายละเอียด |
|----|-----------|
| `DEV_MODE` | ต้อง `false` บน production เสมอ |
| Order number | รูปแบบ `U-MMDD-NNN` (เช่น `U-0627-001`) |
| Supabase query | ถ้าต้องการ > 1000 rows ต้องใส่ `.limit(N)` |
| `render(true)` | = force bypass keyboard defer — อย่าลบ argument |
| เบอร์โทร | ผ่าน `fmtPhone()` → เติม 0 นำหน้าถ้าเป็น 9 หลัก |
| `</style>` ซ้ำ | grep หา duplicate ก่อน commit ทุกครั้ง |
| Parallel read | ห้าม `Promise.all()` กับ storage read → sequential เท่านั้น |
| Mobile scroll padding | ใช้ inline spacer `<div>` **ไม่ใช่** `padding-left` (มือถือไม่ยอมทำงาน) |
| Category chip / tab | ดึงจาก DB ห้าม hardcode |

## ⚠️ บั๊กประจำที่ Claude ทำเอง (เช็คทุกครั้งหลังแก้)
`str_replace` ที่แทรกโค้ดใหม่ **ก่อน** function ที่มีอยู่ → มักกินบรรทัด `function xxx(){` หายไป → ทั้งหน้าพัง
**บังคับ verify หลังแก้ทุกครั้ง:**
```bash
node scripts/check-html-js.js <file.html>
# หรือถ้าไม่มี script:
# 1) ดึง <script> block ออกเป็น temp .js  2) node --check temp.js
# 3) grep หา function declaration ว่ามีครั้งเดียว  4) grep หา duplicate element id
```
ห้ามบอกนัทว่า "เสร็จแล้ว" ถ้ายังไม่ผ่าน check

## กฎ Product Logic ที่ห้ามเข้าใจผิด
- **Stock Menu (No/S/D)** = ผลิตล่วงหน้า · มี stock · ส่งได้ทุก slot · ขายเดี่ยว/Package S-M-L
- **Meal Plan (HP/LC)** = ทำสด · **ไม่มี stock concept** · ส่งบ่ายเท่านั้น (`no_morning = true`)
  - เป็น **add-to-cart ปกติ** ❌ ไม่ใช่ subscribe flow
  - ลูกค้าเลือกแค่ HP/LC + ขนาด (7 / 21 / 84 กล่อง) → **แอดมิน assign เมนูทีหลัง**
  - ❌ เมนู HP/LC รายจาน **ห้ามขึ้นหน้าให้ลูกค้าเลือกเอง**
- HomeGrid card = entry point เดียวของทุก product type · routing อ่านจาก `item_filter.category`
  (`__pkg:{uuid}__` / `__meal_plan__` / `__anchor__` / `{category}`) — **ห้าม hardcode band**

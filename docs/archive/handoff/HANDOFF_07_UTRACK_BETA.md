# HANDOFF → 07 U-track (beta test)
> ส่งต่อจาก session u-track (22 ก.ค. 2026, จบที่ u0.4.36) เพราะ context เต็ม · session ใหม่โฟกัส **beta test + เก็บบัค + QA agent**

## อ่านก่อนเริ่ม (ตามลำดับ)
1. เรียก skill **`under360-session-start`** → อ่าน `CLAUDE.md` (single source of truth) ให้จบ
2. อ่าน **`TODO.md`** (repo root) — งานค้างทุกแทร็ค · โฟกัส section 🔵 U-track + 🔴 นัทต้องทำ `[u]`
3. ไฟล์นี้ (context เฉพาะ handoff)

## สถานะ ณ ตอนส่งต่อ
- **โค้ด = u0.4.36 live** · LIFF/DB/KQ/OH ครบ · SQL หลักรันครบ (payment_status/free_shipping/live_presence/storage menu-images)
- **รูปเมนู 70 ตัวขึ้นแล้ว** (โบรชัวร์ Drive → Supabase Storage `menu-images` · การ์ดใช้ `thumbUrl()` = image transform ย่อ + lazy · lightbox = full)
- **migrate:** 7,577 ออเดอร์เก่าเข้าแล้ว (คนละ session) · ยังขาด `order_items` รายเมนู (บล็อกน้องนิว)

## 🎯 งานหลัก session นี้ = beta test (รอนัทเทสจริง แล้วเก็บบัค)
นัท**ยังไม่เคยเทส LIFF บน iPhone** — น่าจะเจอบัค · เมื่อนัทแคปบัคมา → diagnose + fix + push ตาม loop เดิม
- 🔴 นัทต้องทำ (u): เทส iPhone/ข้ามเครื่อง · **Enable Distance Matrix API** (Google Cloud → ปักหมุดต้องขึ้น 🚗 ไม่งั้น fallback haversine) · สั่งเทส 1 ออเดอร์ (เช็ค payment badge OH/KQ) · เช็ค `mp_offer_sets` ตรง ad copy + ตั้ง `LINE_CHANNEL_ACCESS_TOKEN` ใน Vercel

## 🤖 Agent ตัวถัดไป = QA แอดมิน LINE OA (นัทเลือก 22 ก.ค.)
อ่านแชทแอดมิน↔ลูกค้าย้อนหลัง ~1 อาทิตย์ → flag ตอบผิด/ตอบไม่ครบ/ลูกค้าเงียบ → ตารางให้นัทตรวจ
- **เข้าถึงแชท = Claude-in-Chrome** (Chrome จริงนัทที่ล็อกอิน `chat.line.biz`) — ไม่มี API · **ยังไม่เคยเทสว่าอ่าน text แชทออกจริง** → เทส read_page 1 เธรดก่อน แล้วค่อยสร้าง
- ⚠️ เสี่ยง (Earth เจอกับ FB): 2FA loop · list virtualize scroll ไม่โหลด · tab crash · LINE OA อาจไม่มี export แชท
- อ่านอย่างเดียว — ห้ามตอบ/ส่งในแชทลูกค้า

## 🔧 ค้าง/gotcha ที่ต้องรู้
- **LIFF ยังไม่ publish สาธารณะ** — ส่งลิงก์ให้คนนอกเปิดไม่ได้ · นัทกำลังเข้าไป publish LINE Login channel (`chat.line.biz`/`developers.line.biz`) เอง — ถ้ายังไม่ขึ้น ช่วยดูต่อ
- **DB editor image slots อ่าน kitchen_data (คนละ store กับ menu_items)** → รูป 70 ขึ้นที่ LIFF ลูกค้า ไม่ขึ้นที่ช่องรูป DB editor (ปกติ ไม่ใช่บัค)
- เมนูไม่มีรูป 7 ตัว: BJ1-3/BJ5 (บ๊ะจ่าง)/D061/LC34 — ถ้านัทส่งรูปเพิ่มให้อัพ (mapping code→fileId + pipeline อยู่ scratchpad session เก่า / ทำซ้ำได้ผ่าน browser DOM)
- **attribution (FB) = PARK หลัง beta** — spec lock แล้ว (ดู CLAUDE.md + `web/eath/utm_taxonomy.md`) อย่าเพิ่งสร้าง (ยังไม่มี ad traffic)
- **บัญชี/expenses (เสา 2)** — ฝั่งต้นทุนไม่มีที่จด → อาจต้องสร้าง `expenses` table (รอนัทตอบจดต้นทุนไว้ที่ไหน)

## กติกา multi-session (สำคัญ)
- **TODO.md กลาง** = จดงานค้าง/ส่งต่อ/ให้นัททำ แทน ping (skill `under360-shared-todo`) · นัทดูแค่ 🔴 นัทต้องทำ
- git: **add เฉพาะไฟล์ track ตัวเอง** (u = LIFF/DB/OH/KQ/HE + CLAUDE.md · ไม่แตะ `web/*`, `eath-widget/*`, `web/eath/*`) · **pull ก่อน push** · ชนบ่อย → `git pull --rebase --autostash`
- gitignore กัน PII: `web/eath/`, contacts, `download/` (FB ads) — อย่า add
- deploy: `node scripts/check-html-js.js <file>` ก่อน commit เสมอ · commit ไทยสั้นๆ · Vercel auto-deploy
- เวอร์ชัน 4 แทร็ค (u/m/a/doc) — Claude เคาะเลขเอง (skill `under360-masternote`)

## เครื่องมือที่ใช้บ่อย session นี้
- REST ตรง (curl + anon key ใน CLAUDE.md) อ่าน/เขียน Supabase ได้ (RLS เปิดกว้าง)
- Supabase Storage upload: `POST /storage/v1/object/menu-images/{path}` + Bearer anon (policy รันแล้ว)
- browser DOM scrape (Drive/LINE OA) ผ่าน `javascript_tool` ดึง `[data-id]`
- node (v24, มี global fetch) รันสคริปต์ใน scratchpad

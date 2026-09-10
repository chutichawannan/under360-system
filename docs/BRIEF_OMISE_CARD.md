# 💳 Omise บัตรเครดิต — ใบงานปิดจ็อบ (เปิด 1 ก.ย. 2026 · นัทตั้งเป้าเสร็จวันนี้)

## ✅ สถานะบัญชี (ยืนยันจากเมล Omise ตอบ 20 ส.ค. · ticket 959767)
- **บัตรเครดิต/เดบิต: เปิดใช้งานแล้ว** (Visa · Mastercard · JCB) · ค่าธรรมเนียม **2.4% + VAT 7%/รายการ**
- PromptPay QR: เปิดแล้วเช่นกัน · 1% + VAT
- Payment Links+ (App Center): ⏳ ยังรอตรวจ — **ไม่ต้องรอ** งานนี้ไม่ใช้ตัวนั้น
- ❌ **ในโค้ดเรายังไม่มี Omise เลยสักบรรทัด** (grep แล้ว liff_customer + api/ = ว่าง)

## 🎯 Scope v1 — จ่ายบัตรที่หน้า checkout LIFF
1. **Frontend (liff_customer.html):** เพิ่มตัวเลือก "💳 บัตรเครดิต" ข้างสลิปโอน → ใช้ **Omise.js card form** (token ฝั่ง browser · เลขบัตรไม่ผ่าน server เรา · ใช้ได้แค่ public key)
2. **Backend ใหม่ `api/omise-charge.js`:** รับ token + order_id → สร้าง charge กับ Omise ด้วย secret key (env) → สำเร็จ = อัพเดท `orders.payment_status='paid'` + `payment_account='omise_card'`
3. อย่าแตะทางเดินสลิปเดิม — เพิ่มทางใหม่ข้างๆ เท่านั้น (กฎ IRON_RULES: ห้ามเปลี่ยนครึ่งทาง)
4. เทสจริง: charge ยอดเล็ก 1 รายการ → เห็นเงินใน dashboard Omise → refund

## 🔑 สิ่งที่นัทต้องทำเอง (Claude ห้ามจับ key)
- เข้า dashboard.omise.co → Keys → ก๊อป **Public key (pkey_...)** + **Secret key (skey_...)**
- ใส่ Vercel → Settings → Environment Variables: `OMISE_PUBLIC_KEY` + `OMISE_SECRET_KEY`
- ⚠️ ใช้ **live key** ไม่ใช่ test key (บัญชีเปิด live แล้ว) — หรือจะเทสด้วย test key ก่อนแล้วสลับก็ได้

## ⚠️ ระวัง
- **webhook Omise (แจ้งผล charge)** — v1 ใช้ผล charge ตรงๆ พอ · webhook ค่อยเพิ่มทีหลังถ้าเจอเคสค้าง
- ค่าธรรมเนียม 2.4%+VAT ≈ **2.57%** — ออเดอร์ ฿4,000 = เสีย ~฿103 · ห้ามบวกเพิ่มจากลูกค้าโดยไม่เคาะกับนัทก่อน
- single-file convention + syntax check ก่อน push + branch เท่านั้น (ห้าม main ตรง)

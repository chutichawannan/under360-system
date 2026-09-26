# 🔑 เปิด Google login ให้โถงหลังบ้าน — 2 หน้าจอ 7 ขั้น นัทกดเอง ~10 นาที

> **ทำไมนัทต้องกดเอง:** 2 หน้านี้อยู่หลังบัญชี Google/Supabase ของนัท เครื่องมือ AI เข้าไปกดแทนไม่ได้
> **ตรวจแล้ว 14 ก.ย.:** ระบบเรา **ยังไม่เคยเปิด Google login เลย** (`external.google = false`) → เปิดรอบนี้ครั้งเดียว ใช้ได้ตลอด
> **ฝั่งโค้ดพร้อมแล้ว** (`staff/auth.js`) — เปิดสวิตช์เสร็จเมื่อไหร่ หน้าล็อกอินขึ้นเองทันที ไม่ต้องแก้อะไรอีก

---

## หน้าจอที่ 1 — Google Cloud (สร้างกุญแจ)

1. เปิด `console.cloud.google.com` ล็อกอินด้วย **under360food@gmail.com**
2. เมนูซ้าย → **APIs & Services** → **OAuth consent screen**
   · เลือก **External** → ชื่อแอป `Under360` · อีเมลติดต่อ under360food@gmail.com → Save
3. เมนูซ้าย → **Credentials** → **+ CREATE CREDENTIALS** → **OAuth client ID**
   · Application type = **Web application** · ชื่อ `under360-staff`
   · **Authorized redirect URIs** → ADD URI → วางให้เป๊ะ:
     ```
     https://zdartbvhbvqlwzwyyiia.supabase.co/auth/v1/callback
     ```
   · CREATE → ได้ **Client ID** + **Client secret** ค้างบนจอ **อย่าเพิ่งปิด**

## หน้าจอที่ 2 — Supabase (เอากุญแจไปเสียบ)

4. เปิด `supabase.com/dashboard` → โปรเจค **zdartbvhbvqlwzwyyiia**
5. **Authentication** → **Sign In / Providers** → **Google** → เปิดสวิตช์
6. วาง **Client ID** + **Client secret** จากข้อ 3 → **Save**
7. **Authentication** → **URL Configuration** → **Redirect URLs** → Add URL:
   ```
   https://under360-system.vercel.app/staff/**
   ```
   *(ไม่ใส่ข้อนี้ = กดล็อกอินแล้ว Google เด้งกลับมาไม่ถูกหน้า)*

---

## 🔴 ข้อควรระวัง
- **ห้ามส่ง Client secret ให้ใครทางแชท** รวมทั้งส่งมาให้ผม — วางไว้ในหน้า Supabase พอ
- **ครัวไม่กระทบ** หน้าครัวยังใช้รหัส 4 ตัวเหมือนเดิม รอบนี้ทดสอบเฉพาะเจ้าของ (นัทเคาะ 14 ก.ย.)
- **ยังไม่กดก็ไม่พัง** — ถ้าสวิตช์ยังปิด หน้าโถงใหม่จะถอยไปใช้รหัส 4 ตัวเองอัตโนมัติ ไม่มีใครติดหน้าขาว

## รายชื่อที่อนุญาต (รอบแรก — ผู้บริหาร เข้าได้ทุกห้อง)
```
flidty.c@gmail.com
chutichawannan@gmail.com
under360food@gmail.com
ploy.thunyathorn@gmail.com
```
อยู่ในไฟล์ `staff/auth.js` · ของครัวเติมทีหลังเมื่อนัทขอเมลลูกน้องมาครบ

## ⚠️ สิ่งที่ด่านนี้ทำได้ / ทำไม่ได้
- **ทำได้:** กันคนที่ไม่มีสิทธิ์เปิดหน้าดู (แทนรหัส 4 ตัวที่ใครรู้ก็เข้าได้)
- **ยังทำไม่ได้:** กันคนที่รู้วิธียิงฐานข้อมูลตรง — เฟส 2 ต้องปิดที่ชั้นข้อมูล (RLS) กฎเดียวกับ `gate.js` เดิม ห้ามเคลมเกินนี้

**กดครบ 7 ข้อแล้วบอกผมคำเดียว** ผมจะเทสเข้าจริงแล้วรายงานว่าใครเข้าได้/ไม่ได้

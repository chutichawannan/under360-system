---
name: under360-deploy
description: ขั้นตอน deploy ของ Under360 — ใช้ทุกครั้งที่แก้โค้ดเสร็จแล้วจะ commit/push, ทุกครั้งที่นัทพูดว่า "push ขึ้น GitHub", "deploy", "ขึ้น Vercel", "ลองใช้จริง" หรือเมื่อจบงานหนึ่งก้อน. บังคับให้ verify syntax ก่อน push เสมอ และให้ checklist ทดสอบหลัง deploy เพราะนัททดสอบเองด้วยมือถือ.
---

# Under360 — Deploy Loop

```
แก้โค้ด → syntax check → git commit (ไทยสั้นๆ) → git push → Vercel auto-deploy → นัท test → fix
```
Repo: `github.com/chutichawannan/under360-system` · Live: `under360-system.vercel.app`

## 1. ก่อน push — บังคับทำครบ (ห้ามข้าม)
- [ ] `node scripts/check-html-js.js <file.html>` ผ่าน
- [ ] grep `</style>` — ไม่มีซ้ำ
- [ ] grep ชื่อ function ที่แก้ — ประกาศครั้งเดียว ไม่หาย
- [ ] `DEV_MODE = false`
- [ ] ไฟล์ LIFF ใช้ `sb` ตรงๆ (ไม่ใช่ `getSB()`)
- [ ] ถ้าต้องรัน SQL ก่อนโค้ดถึงจะทำงาน → **บอกนัทก่อน push** พร้อมโยน SQL ให้พร้อมวางใน Supabase SQL Editor

## 2. Commit message
ภาษาไทยสั้นๆ + เลขเวอร์ชัน เช่น `u0.4.23 KQ เพิ่มปุ่มยกเลิกส่งแล้ว`

## 3. ไฟล์ใน `api/` ต้องอยู่ในโฟลเดอร์ `api/` เท่านั้น
เคยพลาดวางไว้ root → Vercel ไม่รู้จักเป็น serverless function

## 4. หลัง deploy — ส่ง checklist ทดสอบให้นัท (ทีละข้อ)
เขียนเป็นข้อๆ ให้ "แค่ทำตาม" ไม่ต้องคิดเอง:
1. เปิด URL ไหน
2. กดอะไร
3. ควรเห็นอะไร (ถ้าไม่เห็น = แจ้ง)

⚠️ นัททำงานจากมือถือบ่อย → **ทีละขั้นตอนเดียวต่อเทิร์น** รอสกรีนช็อตยืนยันก่อนไปต่อ ห้ามยัดหลายเรื่องในเทิร์นเดียว

## 5. ยังไม่เคยเทสบน iOS/Safari เลย
ทุกฟีเจอร์ฝั่งลูกค้า (LIFF) → ต้องเตือนให้เทสบน iPhone ก่อนถือว่าเสร็จ

## 6. ห้ามลบไฟล์/เนื้อหาโดยไม่แจ้ง
กฎถาวร: **แจ้งนัทก่อนเสมอถ้าจะลบอะไรออก** — ไม่แจ้ง = ไม่มีการลบ

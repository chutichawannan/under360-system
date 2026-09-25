---
name: business-context-and-versioning
description: "เป้าหมายธุรกิจ 500K/เดือน, บทบาทพลอย (ภรรยา/co-owner), และระบบเวอร์ชัน 4 แทร็ค u/m/a/doc"
metadata:
  node_type: memory
  type: project
  originSessionId: bde8aa49-da42-434a-9109-fde3459291b7
---

**เป้าหมายโปรเจค:** กลับไปทำกำไร 500,000฿/เดือน (เคย peak ก่อนโควิดที่ 300-500K/เดือน) — ประเมินไว้ (11 ก.ค. 2026) ว่าโปรเจคหลังบ้านทั้งหมดสำเร็จไปแค่ ~27% เพราะงานฝั่งโค้ด (ที่ทำมาตลอด) เป็นแค่เสาเดียวจาก 7 เสาหลัก (ระบบ Order 70% / ปฏิบัติการ-ต้นทุน 15% / Product-Market Fit 15% / CRM 20% / Marketing 20% / AI Agents 5% / Under360 Base 2%) — ดูรายละเอียดเต็มในหัวข้อ "📊 Big-Picture Roadmap" ของ CLAUDE.md

**พลอย (Thunyathorn)** = ภรรยานัท + co-owner Under360 ตัวจริง ดูแล marketing/หน้าบ้านทั้งหมด (นัท=หลังบ้าน/ระบบ, พลอย=หน้าบ้าน/ขาย — ไม่แย่ง territory กัน) — extrovert ถนัดหน้ากล้อง/influencer organic แต่ยังไม่ไว้ใจ AI-assisted ads ต้องพิสูจน์ด้วยตัวเลขก่อน นัทกำลังพิสูจน์ให้พลอยเห็นว่า "หลังบ้านใช้ AI ได้ผลจริง" ก่อนจะดึงพลอยเข้ามาใน workflow เต็มตัว

**ระบบเวอร์ชัน 4 แทร็ค** (ตั้งแต่ 9 ก.ค. 2026 — เขียนอธิบายเต็มไว้ใน CLAUDE.md หัวบทความแล้ว):
- **u** = Under System (โค้ดหลังบ้านทั้งหมด รวม FB bot) — ปัจจุบัน u0.4.22
- **m** = Marketing (GBP/Blog/Ads/Web) — ปัจจุบัน m0.2 in progress
- **a** = Agents (นิว→เก่ง→ฟ้า→เตียง→เอิธ) — ปัจจุบัน a0.1-spec (น้องนิว spec locked ยังไม่โค้ด)
- **doc** = เอกสารกลาง (`MASTERNOTE` v6.x + `HISTORY`) — **ไฟล์เหล่านี้อยู่ในแชทของนัทเท่านั้น ไม่ push เข้า git** — เฉพาะตอนนัทกลับถึงคอมแล้วส่ง MASTERNOTE+HISTORY ทั้งคู่มาให้ Claude Code รวมเป็น `CLAUDE.md` ครั้งเดียว (ทำไปแล้วรอบหนึ่ง 12 ก.ค. 2026 — ดู commit "รวม MASTERNOTE v6.7 + HISTORY v1")

**How to apply:** ถ้านัทส่งไฟล์ `MASTERNOTE` หรือ `HISTORY` เวอร์ชันใหม่มาให้อีก (โดยเฉพาะหลังทริป/หลังคุยงานผ่านมือถือมาสักพัก) ให้เข้าใจว่านี่คือ "doc flow" ตามระบบเวอร์ชันนี้ — งานคือ merge เข้า CLAUDE.md ที่มีอยู่ (ไม่ใช่เขียนทับทิ้งของเดิม), preserve รายละเอียดเทคนิค/บั๊กในไฟล์เดิมไว้ครบ, แล้ว commit สั้นๆ ภาษาไทย + push — อย่าเข้าใจผิดว่า MASTERNOTE คือของใหม่ล้วนที่ต้องแทนที่ CLAUDE.md 100% เพราะ CLAUDE.md มีรายละเอียด per-version bug narrative ที่ MASTERNOTE มักสรุปย่อทิ้งไป

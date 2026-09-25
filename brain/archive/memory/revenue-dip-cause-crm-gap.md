---
name: revenue-dip-cause-crm-gap
description: ยอดลูกค้าใหม่ตกช่วง เม.ย.-พ.ค. 2026 = พลอยลดโปรโมท + ไม่มี CRM แข็งดึงซื้อซ้ำ (นัทระบุเอง) → ทางแก้ = retention automation agent
metadata: 
  node_type: memory
  type: project
  originSessionId: 9e0f0020-7b48-4096-8278-d1d4a1d8977c
  modified: 2026-07-30T04:41:06.661Z
---

**สาเหตุยอดตกช่วง เม.ย.-พ.ค. 2026 (นัทตอบเอง 28 ก.ค. 2026):**
1. **พลอยลดการโปรโมท** → ลูกค้าใหม่เข้าน้อยลง (ฝั่ง acquisition)
2. **ไม่มีระบบ CRM ที่แข็งแรง → ดึงลูกค้าให้ซื้อซ้ำไม่ได้** (ฝั่ง retention) — นัทมองว่านี่คือจุดอ่อนโครงสร้าง

ตรงกับข้อมูล F/เอิธ: ลูกค้าใหม่ลดทั้งจำนวน (−20% YoY) และยอด/หัว (−45%, หักหลัง พ.ค.) · ลูกค้าเก่ายังเหนียว (ยอดนิ่ง ฿285-354K)

**ทางแก้ที่เสนอนัท (mapping gap → agent):**
- **retention (CRM ดึงซื้อซ้ำ) = เอิธ** — ยกจาก "broadcast เป็นครั้งๆ" → **always-on auto-nudge**: เอิธเจอ cadence แล้ว (ลูกค้าเงียบ >23 วัน=เตือน · >64=win-back) → u-track ทำ cron เช็ครายวัน+ยิง LINE อัตโนมัติ = "CRM แข็งแรง" ที่นัทบอกว่าขาด (ทำหลัง cutover — ต้องมี LIFF 360 + LINE token)
- **acquisition (พลอยลดโปรโมท) = เตียง** (content cadence สม่ำเสมอ ไม่พึ่ง bandwidth พลอย) + **ads** (conversion objective หาคนใหม่)
- **น้องนิว** = ดึงซ้ำทางอ้อม (MP subscription = repeat by design)

**KPI ที่ควรเฝ้าแทนยอดขายดิบ (เอิธเสนอ · F ใส่ orders.mjs แล้ว):** % ลูกค้าซื้อซ้ำ (repeat rate) + new vs returning revenue

เกี่ยวข้อง: [[business-context-and-versioning]] · [[broadcast-ads-owner-nut]]

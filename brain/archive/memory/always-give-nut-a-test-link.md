---
name: always-give-nut-a-test-link
description: ทำอะไรใน branch แล้วจะให้นัทเทส ต้องแนบลิงก์ที่กดจากมือถือได้เสมอ — ห้ามบอกให้ไปหาใน Vercel เอง
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6821b562-2238-43ac-afa8-f6d638d36227
  modified: 2026-08-11T06:03:53.491Z
---

นัทสั่งเอง 11 ส.ค. 2026: **"เอาลิงค์มาเลยทุกครั้ง hook เลย ต่อไปนี้เวลาทำอะไรใน branch แล้วจะให้ฉันเทส ทุกครั้ง แนบลิ้งเสมอ"**

**Why:** ผมเคยบอกให้นัทไปเปิด vercel.com → Deployments เพื่อหา Preview URL ของ branch เอง — นัทเปิดไม่ถูก เลย**เทสไม่ได้เลยสักครั้ง** งานค้างอยู่บน branch ฟรีๆ · และผมสร้าง URL ของ Vercel เองจากเครื่องไม่ได้ (ต้อง login ถึงจะรู้ · ชื่อ host ยาวเกิน 63 ตัวก็โดน Vercel ตัด+ใส่ hash)

**How to apply:** copy ไฟล์ที่จะให้เทสไป `preview/<ชื่องาน>.html` แล้ว push เข้า main (คนละไฟล์กับของจริง ไม่กระทบแอดมิน/ครัว) + เพิ่มการ์ดใน `preview/index.html` → รอ deploy แล้ว `curl` ให้ได้ 200 ก่อน → ค่อยส่งลิงก์เต็ม
`https://under360-system.vercel.app/preview` = หน้ารวมของรอเทส

มี hook เตือนอัตโนมัติแล้ว (`scripts/cc_preview_link.ps1` + PostToolUse ใน `.claude/settings.json`) ยิงเมื่อ push ขึ้น `feature/*` หรือ `fix/*`

ต่อยอดจาก [[reduce-ping-shared-todo]] — หลักเดียวกันคือ **อย่าผลักภาระไปให้นัทซึ่งเป็นคอขวด**

---
name: migration-to-thailand-24-7
description: ย้าย Claude Code+โปรเจคทั้งหมดไปรันคอมไทย 24 ชม. — tooling PACK/RESTORE ที่ Desktop\UNDER360_MIGRATION_TOOLS
metadata: 
  node_type: memory
  type: project
  originSessionId: a99de191-0cfc-4357-b9c0-01ed2215c830
  modified: 2026-07-31T10:51:39.030Z
---

31 ก.ค. 2026 นัทกลับไทย → ย้ายทั้งระบบจากเครื่อง US มาคอมไทย (เครื่องเปล่า) ให้ "แชท+ทุกอย่างคงเดิม" แล้วรัน Claude Code 24 ชม.

**Why:** นัทต้องการรัน 24/7 บนเครื่องไทย · งานหลังบ้าน Under360 ทั้งหมดอยู่ที่นี่ (ประวัติแชท 4 โปรเจค + memory + finance/ + PII ที่ไม่มีบน GitHub)

**How to apply:**
- Tooling: `Desktop\UNDER360_MIGRATION_TOOLS\` — `PACK.bat` (เครื่องต้นทาง) สร้างกล่อง `Desktop\UNDER360_MIGRATION` (~370MB) · `RESTORE.bat` (เครื่องปลายทาง) วางกลับ + แก้ชื่อโฟลเดอร์ประวัติให้ตรง user/path ใหม่อัตโนมัติ (slug = แทน `:` `\` `/` space `.` ด้วย `-`)
- ก๊อปทั้งโฟลเดอร์เท่านั้น — ห้าม `git clone` (ของลับ finance/download/web-eath + งานที่ยังไม่ commit จะหาย)
- auth อยู่ `~/.claude.json` (นอกโฟลเดอร์ `.claude`) — ก๊อปไปด้วย = ไม่ต้อง login ใหม่
- ติดตั้งเครื่องปลายทาง: Git + Node 24 LTS + `irm https://claude.ai/install.ps1 | iex`
- ถ้าอ่านสิ่งนี้อยู่บนเครื่องไทยแล้ว = ย้ายสำเร็จ → เตือนนัทลบกล่อง UNDER360_MIGRATION บน USB/Drive ทิ้ง (มี auth + การเงิน + ไฟล์ลูกค้า)

Related: [[reduce-ping-shared-todo]] · [[business-context-and-versioning]]

---
name: eath-desktop-widget
description: Widget desktop น้องเอิธ (Electron) — พักไว้ รอ GIF สะอาด + fix preload status
metadata: 
  node_type: memory
  type: project
  originSessionId: 2498a9ba-1a6a-460f-8f1d-18a12bdeea5a
---

Desktop widget ตัวการ์ตูนน้องเอิธ (Electron, always-on-top, มุมขวาล่าง) อยู่ที่ `eath-widget/` · ช็อตคัต Desktop = `น้องเอิธ.lnk` → `start-eath.vbs`

**สถานะ (16 ก.ค. 2026): ใช้งานได้แล้ว** (commit `a2c4026`) — ปิดไว้ชั่วคราวเพื่อไปงานอื่น · เปิดใหม่ = ดับเบิลคลิก `น้องเอิธ.lnk` บน Desktop (→ `start-eath.vbs`)

**ทำงานได้จริง:** Electron frameless/transparent/always-on-top + ลากย้าย/ปิด Esc · รูป ChatGPT (`eath-sheet.png`) สไลซ์ด้วย `slice.js` (flood-fill ลบพื้นน้ำตาลไล่เฉด + min-cut → `frames/*.png`) · **preload ติดแล้ว** (ต้อง `sandbox:false` ใน main.js — ถ้าไม่มี fs อ่านไม่ได้ window.eath ไม่เกิด) อ่าน `status.json` working=เขียน/idle=หลับ · **interactive: คลิก ✎ พิมพ์สั่ง → `prompt.json`** · **ปุ่ม AUTO ● /○ ในแถบล่าง** (position:fixed คลิกไม่ติด → ต้องอยู่ในแถบ flow) → watcher เปิด/ปิด

**Watcher (auto mode):** loop ในแชท Claude เช็ค `prompt.json`/`config.json` ทุก 90 วิ (ScheduleWakeup) · auto=false → หยุดเอง (ประหยัดโทเคน) · **สั่งจาก widget รันเองได้ต่อเมื่อ AUTO ● เปิด + แชทรัน watcher ค้าง**

**ค้าง:** animation ยังกระตุกนิดๆ (เฟรมกว้างไม่เท่ากัน) → ถ้าอยากลื่นจริง ขอ **GIF (writing.gif/sleeping.gif พื้นโปร่ง) จาก ChatGPT** มาเสียบแทน (สลับ src ตาม state) · **ห้ามนั่งตัด sprite sheet มือเองอีก** (เสียเวลา) — งานอาร์ตเป็นของ **น้องเตียง** ในอนาคต
**How to apply:** สั่งเอิธจาก widget = manual (ผมรันให้ในแชท) หรือ auto (เปิด AUTO + บอก "เปิด auto") · เอิธ output ลง `web/eath/*.csv` (คู่แข่ง 42+ เจ้า, influencer_shortlist_1)

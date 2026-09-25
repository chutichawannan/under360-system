---
name: drive-photo-vault-flidty
description: flidty.c@ = Claude working Google account + คลังรูปเมนู Drive + หน้า review/vault
metadata: 
  node_type: memory
  type: project
  originSessionId: 24eb1818-96e6-45d2-940b-9084c2ba1d72
  modified: 2026-07-25T18:32:51.554Z
---

**flidty.c@gmail.com** = Google account ที่นัทสร้างแยกให้ Claude ใช้ — MCP Drive (server id `088e626c-...`) auth ผ่านตัวนี้. Claude copy/สร้างโฟลเดอร์/จัดการ Drive ได้เต็มที่ · ไฟล์ที่สร้าง/copy ไปอยู่ My Drive ของ flidty.c@ (นัท login เข้าถึงได้).

**"1.Under 360"** (folderId `0B9nm96u421IhfjVTaTQ0Yk5iSmRlMHJGdThpZWJ5c0lubUF5N3BDZ294MTVMcG5YYWFLOFU`) = ไดรฟ์ธุรกิจหลัก 10 ปี (owner chutichawannan/ploy) share ให้ flidty.c@ แบบ **read-only** (copy ออกได้ แต่เพิ่ม/เขียนไฟล์เข้าไปไม่ได้ — ทุกโฟลเดอร์ canAddChildren=false). ปนเอกสารส่วนตัว (บัตรปชช./การเงิน/HR) — สแกนต้องเจาะเฉพาะโฟลเดอร์รูปอาหาร ห้ามแตะเอกสาร.

**ข้อจำกัด MCP Drive นี้:** ไม่มี tool set-permission/share (share ไฟล์ให้ account อื่นไม่ได้) · `read_file_content` กับรูปคืนค่าว่าง + download รูปใหญ่ = context ระเบิด → **อ่านภาพเดาเมนูเองไม่ได้** ต้องพึ่งชื่อโฟลเดอร์/ไฟล์ + ให้นัทดูยืนยัน.

**คลังรูปเมนู (copy แยกออกมารวมที่เดียว 25 ก.ค.):** folder `1Uxi62dmZtnQo4k-o_ZGPU0IA2wKyU8wj` (flidty.c@) — **241 รูป 11 ชุด**: RobinhoodMart A1-19 · Menu2023 · ข้าวกล่อง2019 · Wongnai · ปลา2022 · คิมบับ · J อาหารเจ · บ๊ะจ่าง · แพคกับข้าวจาน · aw เมนูต่างๆ · Menu2020+เมนูใหม่. index CSV แต่ละชุด = `scratchpad/copy_index_*.csv`.

**หน้าเว็บ (web/, deploy Vercel):** `menu_vault.html` (catalog คลัง 241 รูป) · `review_photos.html` (17 เมนูขาดรูปใน DB — นัทกดยืนยัน→คัดลอก→ผม import). ทั้งคู่ใช้ Drive thumbnail URL (นัท login Google เห็นรูป inline · ไม่ login = ปุ่ม "เปิดรูป" fallback). สร้างจาก `scratchpad/build_catalog.js`.

**17 เมนูขาดรูป DB:** 8 เจอ (BJ1-3/S181/S095 มั่นใจ + LC34/S020/S175 ยืนยัน) · 6 ไม่มีรูปในไดรฟ์เลย = เมนูใหม่ต้องถ่าย (S060/S076/S085/S091/S170/D061) · BJ4/BJ5 ต้อง vision เลือกไส้.

เกี่ยวข้อง: [[migrate-customer-order-history]] (flidty.c@ pipeline email→Drive เดิม)

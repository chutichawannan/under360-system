---
name: hato-owns-line-messaging-channel
description: push LINE หาลูกค้าที่สั่งผ่าน LIFF ใหม่ = ใช้ได้จริงแล้ว (พิสูจน์ 18 ส.ค.) · แต่ uid ยุค Hato 10,834 ใบยังใช้ push ไม่ได้ · ห้ามย้ายแชนแนล
metadata: 
  node_type: memory
  type: project
  originSessionId: 157515df-6d30-4ef9-837d-907a1ea42515
  modified: 2026-08-18T13:17:03.983Z
---

**✅ พลิกข้อสรุปเดิม 18 ส.ค. 2026 — push ผ่านจริงแล้ว ไม่ต้องย้ายแชนแนล**

OA `@rwc2010a` (Under360 Cleanfood) · Messaging API แชนแนล `2005639534` — **นัทออก token เองได้ผ่านความลับแชนแนลจาก OA Manager** (`LINE_CHANNEL_SECRET` ใน Vercel · `api/_line_token.js`) ไม่ต้องพึ่งคอนโซลของ Hato

**หลักฐานตรงที่ปิดคำถาม:** `kitchen_data` key `order_notified` มีใบ **`U-0817-003`** (Sam Cooper · `source='line'` = สั่งผ่าน LIFF ของเรา · uid `U2b967953…` ไม่เคยโผล่ในออเดอร์ยุค Hato) — `api/notify-order-confirm.js` เขียนเลขใบลงคีย์นี้ **เฉพาะตอน LINE ตอบ `r.ok`** → **แชนแนล Messaging API รับ uid ที่ LIFF `2010442513` เก็บมา**

⛔ **ห้ามย้าย LIFF ไปแชนแนลอื่นเพื่อ "ให้ push ได้"** — 17 ส.ค. 20:32 เคยย้ายไป `2011148232` แล้ว **ลูกค้าเข้าหน้าสั่งไม่ได้ทั้งร้านข้ามคืน** ต้องคืนค่าเดิม 18 ส.ค. 10:54 · ไม่มีเหตุผลต้องย้ายอีกแล้ว

**ข้อจำกัดที่ยังเหมือนเดิม (คนละเรื่องกับข้างบน):** uid ที่ migrate มาจาก Hato **ใช้ push ไม่ได้** — คนเดียวกัน (เบอร์ตรงกัน) uid ไม่ตรงเลย **0 ตรง / 52 ไม่ตรง** = คนละ provider
→ ตอนนี้ push ได้เฉพาะคนที่**เคยเปิด LIFF ใหม่** (~103 ใบ U-) · อีก 10,834 ใบยุค Hato ต้องใช้ **broadcast จาก OA Manager** ไม่ใช่ push ด้วย uid

**⚠️ ตัวตรวจเดิมตอบกลับด้าน** — `scripts/cc_check_uid_scope.mjs` ขึ้น 🔴 มาตลอดทั้งที่ push ผ่านแล้ว เพราะมันเทียบ uid เรา vs uid ยุค Hato **ซึ่งไม่ได้แตะแชนแนล Messaging API เลย** → **แก้แล้ว 18 ส.ค. commit `7bf79fd` บน main** (วัดจากใบที่ push สำเร็จจริงแทน) · เป็นตัวอย่างชัดของ [[docs-are-snapshots-verify-first]] แบบ "เครื่องมือคืนผลลวงโดยไม่มีอะไรแดง"

เกี่ยวข้อง: [[docs-are-snapshots-verify-first]] · [[broadcast-ads-owner-nut]] · [[line-native-vs-order-audience]]

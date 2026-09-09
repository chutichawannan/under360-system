---
name: poller
description: เปิด poller ของห้องตัวเอง (ตัวเฝ้ากล่องจดหมายบนบอร์ด session_messages) — ใช้เมื่อนัทพิมพ์ "/poller" หรือ "เปิด poller" หรือหลัง relaunch แอป · ห้องดูชื่อตัวเองแล้วรัน scripts/room_watch.mjs ด้วย Monitor persistent · ห้ามถามกลับว่าห้องไหน ให้ดูจากตารางในสกิล
---

# 👂 /poller — เปิดตัวเฝ้ากล่องจดหมายของห้องนี้

**ทำ 3 ขั้น ไม่ต้องถามอะไร:**

## 1. หาว่าห้องนี้คือใคร — ดูจากชื่อ session ของตัวเอง

| ชื่อ session (ตรงหรือใกล้เคียง) | คำสั่ง |
|---|---|
| Project Manager / พี่ปืน | `node scripts/room_watch.mjs pm --me=pm,พี่ปืน` |
| Secretary / เลขา | `node scripts/room_watch.mjs secretary --me=secretary,เลขา` |
| U-maintainer | `node scripts/room_watch.mjs u-maintainer,u --me=u-maintainer,u` |
| Kapan | *(ใช้ `scripts/kapan_watch.mjs` ตัวเดิม — ดู `docs/KAPAN_CARD.md`)* |
| โปรเจค อาหารเจ 2026 | `node scripts/room_watch.mjs เจ2569 --me=เจ2569,เจ2026,J2026` |
| ครีเอทีฟ | `node scripts/room_watch.mjs ครีเอทีฟ --me=ครีเอทีฟ,creative` |
| Agent-Niw / นิว | `node scripts/room_watch.mjs niw --me=niw,นิว` |
| 05 LINE OA / CRM | `node scripts/room_watch.mjs 05 --me=05,eath` |
| 06 FB Ads-track | `node scripts/room_watch.mjs 06,06-ads --me=06,eath` |
| 02 M-track | `node scripts/room_watch.mjs m --me=m,M เว็บ` |
| Agent-Fah / ฟ้า | `node scripts/room_watch.mjs fah --me=fah,ฟ้า` |
| CC etc | `node scripts/room_watch.mjs cc --me=cc` |
| Agent-Tieang / เตียง | `node scripts/room_watch.mjs tiang --me=tiang,เตียง` |
| Agent-Earth / เอิธ | `node scripts/room_watch.mjs eath --me=eath,เอิธ` |
| ห้องรวมปัญหาครัว (k) | `node scripts/room_watch.mjs k --me=k,ครัว` |
| Agent-Keng | `node scripts/room_watch.mjs keng --me=keng,เก่ง` |
| 08 F-track | `node scripts/room_watch.mjs f --me=f,การเงิน` |
| Buyer | `node scripts/room_watch.mjs buyer --me=buyer` |
| Bug Report | `node scripts/room_watch.mjs bug --me=bug` |
| R&D 01 | `node scripts/room_watch.mjs rnd01 --me=rnd01` |

ชื่อไม่อยู่ในตาราง → ใช้ชื่อห้องที่ตัวเองใช้โพสต์บอร์ดเป็น room และ `--me=` ชื่อเดียวกัน

## 2. หยุดตัวเก่าก่อน (ถ้ามี) แล้วรัน
- มี Monitor poller ค้างอยู่ → `TaskStop` ก่อน (กันปลุกซ้ำ 2 รอบ)
- รันคำสั่งจากตารางด้วย **Monitor** · `persistent: true` · `timeout_ms: 3600000`
- ต้องเห็นบรรทัด `👂 poller ห้อง … เริ่มแล้ว` ถึงนับว่าติด

## 3. ตอบสั้นๆ แล้วรอ
`✅ poller <ห้อง> เปิดแล้ว` — ไม่ต้องรายงานใคร (หน้า /pwa/pollers.html เห็นเอง) · มีจดหมายเด้งค่อยตอบตามกฎ 4 จังหวะ

---
**ทำไมต้องมี:** ส่งข้อความปลุกข้ามห้องค้างได้โดยไม่บอก (พิสูจน์ 6 ก.ย.) · poller = วิธีเดียวที่ห้องตอบเองในวินาที · relaunch แอป = poller ตายทุกห้อง ต้อง `/poller` ใหม่ · กติกาเต็ม `docs/POLLER.md`

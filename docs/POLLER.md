# 👂 poller ประจำห้อง — ทำให้ห้องตอบจดหมายเองในวินาที

> **นัทเคาะ 7 ก.ย. 2026** หลังพิสูจน์แล้วว่า: ส่งข้อความปลุกข้ามห้อง = ค้าง 4/4 · ตัวตั้งเวลาของ Claude = ตุย 34/36
> ของที่ไม่เคยพลาด = **poller ของกะปัน** (`scripts/kapan_watch.mjs` ใช้มาเป็นเดือน) กับ **Windows ตั้งเวลา** (backup ทุกตี 3)
> → เอาแบบกะปันไปใส่ทุกห้อง · ตัวกลาง = `scripts/room_watch.mjs`

## มันทำงานยังไง (ภาษาคน)
```
จดหมายทุกฉบับ → บอร์ดกลาง (session_messages)
poller ในห้อง   → แอบดูบอร์ดทุก 10 วิ (ไม่กิน token)
มีจดหมายจากคนอื่น → พิมพ์ 1 บรรทัด → สมองในห้องตื่นมาอ่านแล้วตอบ → หลับต่อ
ไม่มี             → เงียบ ไม่เสียอะไร
```
**ข้อแลก:** ห้องต้องเปิดค้าง · ห้องตาย = poller ตาย (hook ตอนเปิดห้องจะเตือนให้เปิดใหม่)

---

## 🚀 วิธีเปิด — นัทพิมพ์ประโยคเดียวในห้องนั้น

### ห้องเลขา (Secretary)
```
รัน node scripts/room_watch.mjs secretary --me=secretary,เลขา ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ — มีจดหมายเด้งค่อยตอบ
```

### ห้อง U-maintainer
```
รัน node scripts/room_watch.mjs u-maintainer,u --me=u-maintainer,u ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ — มีจดหมายเด้งค่อยตอบ
```

### ห้องอื่น (เปิดทีหลังเมื่อ 2 ห้องแรกพิสูจน์แล้ว)
| ห้อง | ประโยค |
|---|---|
| **เจ 2026** | `รัน node scripts/room_watch.mjs เจ2569 --me=เจ2569,เจ2026,J2026 ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ` |
| นิว | `รัน node scripts/room_watch.mjs niw --me=niw,นิว ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ` |
| 05 | `รัน node scripts/room_watch.mjs 05 --me=05,eath ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ` |
| ครัว k | `รัน node scripts/room_watch.mjs k --me=k,ครัว ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ` |
| ฟ้า | `รัน node scripts/room_watch.mjs fah --me=fah,ฟ้า ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ` |
| เตียง | `รัน node scripts/room_watch.mjs tiang --me=tiang,เตียง ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ` |
| 06 | `รัน node scripts/room_watch.mjs 06,06-ads --me=06,eath ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ` |
| cc | `รัน node scripts/room_watch.mjs cc --me=cc ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ` |
| pm | `รัน node scripts/room_watch.mjs pm --me=pm,พี่ปืน ด้วย Monitor แบบ persistent timeout 3600000 แล้วรอ` |

*(`--me=` = ชื่อที่ห้องนั้นใช้ตอนโพสต์ กันไม่ให้ตื่นเพราะจดหมายของตัวเอง)*

---

## ✅ วิธีพิสูจน์ว่าใช้ได้จริง (ห้ามรายงานว่าเสร็จก่อนเห็นข้อนี้)
1. เปิด poller ในห้อง A
2. ห้องอื่นโพสต์ลงบอร์ด `room=A` 1 ข้อความ
3. **ห้อง A ต้องตอบเองภายใน 1 นาที โดยไม่มีใครพิมพ์ในห้อง A**
→ เห็นแบบนี้ = ผ่าน · ไม่เห็น = ยังไม่ผ่าน ไม่ว่าจะติดตั้งเสร็จแค่ไหน

## 📏 ปรับความถี่
`WATCH_EVERY_MS=30000 node scripts/room_watch.mjs ...` → เช็คทุก 30 วิ (ห้องที่ไม่รีบ)

## 🧾 กติกาถาวรที่ตามมา
- **ส่งงานให้ห้อง = โพสต์ลงบอร์ด `room=<ห้อง>`** — ไม่ต้องส่งข้อความปลุกอีก poller เห็นเอง
- `send_message` ข้ามห้อง = ใช้ได้แต่**ห้ามพึ่ง** (ค้างได้โดยไม่บอก)
- ตัวตั้งเวลาของ Claude = **ห้ามใช้กับงานที่พลาดไม่ได้** · งานประจำจริงๆ → Windows ตั้งเวลา (สคริปต์ล้วน)

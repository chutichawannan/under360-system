---
name: under360-masternote
description: ระเบียบการอัปเดตเอกสารกลางของ Under360 (MASTERNOTE / HISTORY.md / CLAUDE.md) + ระบบเลขเวอร์ชัน 4 แทร็ค (u/m/a/doc). ใช้ทุกครั้งที่จะปิด session, ทุกครั้งที่มี milestone หรือ decision ใหม่, และทุกครั้งที่นัทถามว่า "ตอนนี้เวอร์ชันอะไร" / "อัปเดต masternote ให้ที". Claude เป็นคนเคาะเลขเวอร์ชันเอง ไม่ต้องให้นัทคิด.
---

# Under360 — Masternote & Versioning

## ระบบเวอร์ชัน 4 แทร็ค
| แทร็ค | คืออะไร | ระบบย่อย |
|-------|---------|----------|
| **u** | Under System (โค้ดหลังบ้านทั้งหมด รวม FB bot) | LIFF · DB · OH · KQ · HE · RPT · BOT · API |
| **m** | Marketing | GBP · BLOG · ADS-G · ADS-FB · WEB · OA · SOC |
| **a** | Agents | นิว(a0.1) → เก่ง → ฟ้า → เตียง → เอิธ |
| **doc** | MASTERNOTE + HISTORY | |

- ทศนิยมกลาง = milestone ใหญ่ · ตัวท้าย = งานย่อย/patch
- หมุดใหญ่: **u0.5 = beta launch** · **u1.0 = ปิด Hato Heart**
- **Claude เป็นคนเคาะเลขเอง** ตอนปิด session แล้วจดลงไฟล์

## ทำเมื่อไหร่
ทุกครั้งที่เกิดอย่างใดอย่างหนึ่ง:
- ปิด session
- มี decision ใหม่ (architecture / positioning / กฎการทำงาน)
- ทำ milestone เสร็จ
- เจอ known issue ใหม่

## ทำอะไร (ครบทุกข้อ ห้ามตกข้อไหน)
1. **bump เลขเวอร์ชัน** ของแทร็คที่เกี่ยวข้อง
2. อัปเดต `UNDER360_HISTORY.md` — เพิ่มแถวใน timeline (เวอร์ชัน / วันที่ / สำเร็จอะไร)
3. อัปเดต **MASTERNOTE** → เวอร์ชันใหม่ (v6.6 → v6.7) พร้อมบรรทัด "ใหม่ในเวอร์ชันนี้:"
4. **ส่งไฟล์ให้นัทในแชท** ทุกครั้ง (นัทไม่ push Drive ช่วงเดินทาง)
5. ตอนกลับถึงคอม → รวม MASTERNOTE + HISTORY ส่ง Claude Code → push GitHub เป็น `CLAUDE.md`

## ⚠️ กฎเหล็ก
- **ห้ามลบเนื้อหาเดิมออกจากไฟล์ MD โดยไม่แจ้งนัทก่อน** — ไม่แจ้ง = ไม่มีการลบ
- มี MASTERNOTE **ไฟล์เดียว** เป็น single source of truth — ห้ามแตกไฟล์ย่อย
- อัปเดต = แก้ไฟล์เดิม + bump เลข ไม่ใช่สร้างไฟล์ที่ 2
- เขียนไฟล์ที่ `/home/claude/` ก่อนแล้วค่อย copy ไป outputs (กัน partial save พังไฟล์)

## รูปแบบแถว HISTORY
```
| u0.4.23 | 12 ก.ค. 2026 | KQ เพิ่มปุ่มยกเลิก + log ทุกคลิก |
```

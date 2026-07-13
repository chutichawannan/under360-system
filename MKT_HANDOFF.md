# MKT_HANDOFF — บันทึกงาน Marketing track (m-track)

> ไฟล์นี้ = สมุดบันทึกงานของ **แชท Marketing track** (แยกจากแชท Vibe/u-track)
> vibe เป็นเจ้าของ `CLAUDE.md` คนเดียว → งาน m-track จดที่นี่ก่อน แล้ว vibe merge เข้า CLAUDE.md ตอนนัทสั่งปิด session
> **13 ก.ค. 2026 เริ่มไฟล์** — 2 แชทรันขนาน แชร์โฟลเดอร์เดียวกัน (branch main)

## 🤝 ข้อตกลงแบ่งงาน 2 แชท (ยืนยันสองฝ่าย 13 ก.ค.)
| ฝั่ง | เจ้าของไฟล์ |
|---|---|
| **m-track (แชทนี้)** | `web/*`, `report.html`, blog (`web/import_blog.html`), `MKT_HANDOFF.md` |
| **u-track (vibe)** | `main_database_v2.html`, `liff_*.html`, `operation_hub.html`, `kitchen_queue.html`, `home_editor.html`, `CLAUDE.md` |
| **กฎร่วม** | add เฉพาะไฟล์ตัวเอง (ห้าม `git add -A`) · **pull ก่อน push ทุกครั้ง** · ชนไฟล์ = เตือนกันทันที · จะข้ามเลนต้องเคลมก่อน ไม่แตะเงียบ |

---

## 📋 สถานะรายการงาน m-track (จากลิสต์ 6 ข้อ 13 ก.ค.)
| # | งาน | สถานะ |
|---|-----|-------|
| 1 | รีวิว 6 บทความ draft | ✅ vibe ทำไปแล้ว (commit `f65f033` WS2 copy) — ไม่ต้องทำซ้ำ |
| 2 | localize รูป wixstatic → /web/img | 🔵 มี session แยกทำอยู่ (worktree `infallible-chatelet`) — ไม่ทำในแชทนี้ |
| 3 | `report.html` mock → Supabase จริง (วัด HP vs LC, เสา 3) | ⏳ พร้อมทำ |
| 4 | ad copy ชุด A–E (Google Ads) | ✅ ร่างเสร็จ (ดูด้านล่าง) — นัทเอาไปวางคอนโซลเอง |
| 5 | CTA เว็บ hatohub → LINE OA/LIFF | 🔴 **จอด — รอนัทเคาะ** (hatohub = ระบบ live ปัจจุบัน · ต้องมีลิงก์ OA จริง + ยืนยันระบบใหม่พร้อม) |
| 6 | blog ใหม่ ยิง keyword ที่ยังไม่มีบทความ | ⏳ พร้อมทำ — เป้าแรก "คอร์สอาหารคลีน" (keyword #1, 127 conv, ยังไม่มีบทความ) |

---

## ✅ ข้อ 4 — Ad copy ชุด A–E (ร่างเสร็จ 13 ก.ค. · self-check brand ผ่าน)
> ราคาจริง: ทดลอง 7 กล่อง LC 1,399 / HP 1,699 · Weekly 21 กล่อง LC 3,190 / HP 4,190 · Monthly LC 12,000 / HP 15,900 · ส่งฟรี
> กฎ: HP+LC คู่เสมอ · ไม่มี "เลือกเวลาส่ง" · ไม่ดิสแช่แข็ง · ไม่ใส่ under360 ในหัวทั่วไป
> (ชุดเต็มอยู่ใน transcript แชท marketing — ย้ายมาลงที่นี่ตอน finalize)

---

## 📝 Log
- **13 ก.ค.** เริ่มไฟล์ + ตกลงแบ่งงาน 2 แชท + ร่าง ad copy A–E + flag ข้อ 5 (CTA) รอนัทเคาะ

# 🧹 บันทึกการจัดระเบียบเครื่อง — 16 ก.ย. 2569

> นัทสั่งเอง: *"จัดการไฟล์หน้าเดสทอป และ จัดการไฟล์ในเรโป มันหนักเครื่อง"* + *"อย่าลบอะไรไม่จำเป็น ไปแบคอัพไว้ไดรฟ์ D นะ"*
> ทำโดยห้อง cc (เลขา) · **ของทุกชิ้นย้ายไป `D:\U360_ARCHIVE\` ไม่ได้ลบทิ้ง** — หยิบกลับได้ทุกเมื่อ

## 📊 ผลรวม
| | ก่อน | หลัง |
|---|---|---|
| หน้าเดสท็อป | 7.5 GB (38 ชิ้น) | **780 MB (10 ชิ้น)** |
| เรโป `under360-system` | 3.3 GB | **138 MB** |
| `.git` | 246 MB | **58 MB** |

---

## 🗂️ แผนที่ปลายทางใหม่ — `D:\U360_ARCHIVE\`

| โฟลเดอร์ปลายทาง | ขนาด | เดิมอยู่ที่ไหน / มีอะไร |
|---|---|---|
| `scratch\scratch_20260916\` | 2.3 GB | **`repo\.scratch\` ทั้งก้อน** — สคริปต์ `.mjs` ใช้ครั้งเดียวของทุกห้อง (post_*, msg_*, ask_*, probe_*), ชุดดีไซน์ที่แตก zip (jay/regen4/regen6/tiang/polishB), `competitor_ads`, `ADS_PACK_FINAL`, ไฟล์สถานะ poller `room_watch_*_last.txt` |
| `backups\` | 2.4 GB | `Desktop\under360_backups\` ของ **ส.ค. + 1–8 ก.ย.** (38 ชุด) · `under360-system_backup_20260802` · `under360-backup-md-20260815` |
| `download_zips\` | 655 MB | `repo\download\*.zip` — regen/regen2/regen 4/polish/polish regen 6/Under360-redesign-for-Claude/UNDER360-A-HTML-CSS/handoff-v5/three-pages/k2-mobile |
| `migration\UNDER360_MIGRATION\` | 403 MB | `Desktop\UNDER360_MIGRATION\` (ชุดย้ายเครื่องไปไทย: dot-claude 308M, สำเนาเรโป, appdata) |
| `media\` | 117 MB | `Desktop\UNDER360_BRAND_CLIPS\` · `copy_ED7BD3A3-….mov` |
| `hato_final\` | 38 MB | `repo\download\hato_final\` (CouponUsage.zip, Feedback.zip ฯลฯ) |
| `assets_img\` | 22 MB | `Desktop\` — `รูปแอด` · `รูปใส่เมนู` · `สารทจีน_รูปเมนู` · `โบรชัวร์ 17-23 ส.ค.` · C1_comeback/C2_firstorder/C3_vip/C3_thanks/C4_weekmenu/BDAY08_broadcast.png · card_sartchin_wide2.png · D148.jpg · image-1788528581520.png · 1c16e481-….png · Screenshot 2026-08-28 |
| `download_old\` | 5.0 MB | `repo\download\` ของเก่ากว่า 10 ก.ย. **86 ชิ้น** — ลิสต์ segment/audience ทั้งชุด (SEG_*, W2_*, BC*, AUDIENCE_*, BDAY*), ptrack_* ทั้งชุด, เบอร์โทรลูกค้า/ดู_audience CSV, menu_backup/stock_backup json, card_backup, JD_nong_niw_DRAFT.md |
| `snapshots_old\` | 4.1 MB | `repo\snapshots\` ทั้งหมด — hato_final_catalog_2026-08-08.json · mealplan_20260818.csv · mp_deliveries_all/since0601.json · sheet_2026-08-06.json |
| `misc\` | 3.8 MB | test.zip · hatoheart-pointmovement-v1.xlsx.zip · old2.txt · new.txt · photothumb.db · ~$เบอร์ลูกค้า.xlsx |
| `wt_leftovers\` | 16 KB | ไฟล์ที่ยังไม่ commit จาก worktree 3 ตัวที่ถอดออก (ดูข้างล่าง) |

---

## ✂️ สิ่งที่ "ลบ" จริง (ไม่ได้ย้าย) — แต่กู้คืนได้ทั้งหมด

### 1. worktree 17 โฟลเดอร์บนเดสท็อป (~760 MB)
worktree = **สำเนาโค้ดที่ git สร้างจาก branch** ไม่ใช่ไฟล์ต้นฉบับ — branch ทุกอันยังอยู่ครบใน git
เอาออก: `_wt_al` `_wt_hc` `_wt_stop` `_wt_wd` `pm-deploy-wt` `under360_wt_niw`…`niw9` `under360_wt_sd` `wt-hall-v2` `wt-sec-ledger`

**อยากได้คืน** — สั่งใน repo:
```
git worktree add ../ชื่อโฟลเดอร์ ชื่อbranch
```
ไฟล์ที่ยังไม่ได้ commit ใน 3 ตัวสุดท้าย **ก๊อปเก็บไว้ครบก่อนถอด** ที่ `D:\U360_ARCHIVE\wt_leftovers\`:
- `wt-sec-ledger\อัปเดต`
- `under360_wt_sd\ดึงสด` · `under360_wt_sd\ทำตามวิธีที่นัทวางเอง`
- `under360_wt_niw\_niw_section.tmp.md`

### 2. local branch ที่ merge เข้า main แล้ว 233 อัน (295 → 62)
คอมมิตทุกอันอยู่ใน `main` ครบแล้ว · **branch บน GitHub ไม่ได้แตะเลย** (432 อันยังอยู่ครบ) → ถ้าต้องการ branch ไหนกลับมา: `git checkout -b ชื่อ origin/ชื่อ`

### 3. ไฟล์ว่าง 0 ไบต์ `**นัทสั่งเอง` ใน repo root (พิมพ์ค้างไว้)

### 4. `git gc` บีบอัด .git ใหม่ (246 → 58 MB) — ไม่ได้รื้อประวัติ commit ครบเหมือนเดิม

---

## 🛠️ อย่างอื่นที่แก้
- เพิ่ม `.scratch/` เข้า `.gitignore` (บรรทัด 31) — กันโตกลับมาแบบไม่รู้ตัว

## ⚠️ ผลข้างเคียงที่ต้องรู้
- **สคริปต์ `.mjs` ใช้ครั้งเดียวของทุกห้องใน `.scratch/` ไม่อยู่ในเครื่องแล้ว** — อยู่ครบที่ `D:\U360_ARCHIVE\scratch\scratch_20260916\` ต้องใช้ตัวไหนก๊อปกลับมาได้เลย
- ไฟล์สถานะ poller `room_watch_*_last.txt` ย้ายไปด้วย → poller รอบแรกหลังจากนี้อาจอ่านข้อความซ้ำ 1 รอบ แล้วสร้างไฟล์ใหม่เอง
- `repo\snapshots\` ว่างแล้ว · `repo\download\` เหลือแต่ไฟล์ของสัปดาห์นี้ 14 ชิ้น

## 📌 กติกาจากนี้ไป
ไฟล์ชั่วคราว/ของดัมพ์/zip ใหญ่ → ทิ้งไว้ใน `.scratch/` หรือ `download/` ได้ แต่ **ของเกิน 7 วันจะถูกกวาดไป `D:\U360_ARCHIVE\`** — อะไรที่ต้องอยู่ถาวรให้ commit เข้า repo หรือเก็บใน `docs/`

**ของหาย/หาไม่เจอ → ทักห้อง cc (เลขา) ได้เลย เอากลับให้ หรือชี้ที่ใหม่ให้**

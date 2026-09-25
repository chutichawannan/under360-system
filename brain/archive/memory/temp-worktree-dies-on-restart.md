---
name: temp-worktree-dies-on-restart
description: worktree ใน %TEMP% หายหลังรีสตาร์ท · สคริปต์ push ต้องเช็คว่า cd เข้า worktree สำเร็จ ไม่งั้น commit ลงทรีหลักเงียบๆ
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 807d7c9a-69e9-4aa5-9f1c-37cdbc3c66fa
  modified: 2026-09-11T12:21:56.302Z
---

เกิดจริง 11 ก.ย. 2026 (ห้องครีเอทีฟ): สคริปต์ `set -e` + `cd "$WT" && git fetch && git reset --hard` — worktree ที่สร้างไว้ใน `%TEMP%\claude\wt-creative` **หายไปหลังรีสตาร์ทคอม** → `cd` ล้ม แต่ `set -e` ไม่หยุดเพราะอยู่ในสาย `&&` → คำสั่งถัดไป (`git add/commit/push`) วิ่งใน**ทรีหลัก** → commit ลง `main` ของทรีหลักที่หลายห้องใช้ร่วม + force-push ประวัติเก่าทับ branch ตัวเอง · รอดเพราะ push ขึ้น main โดน non-fast-forward ปฏิเสธ

**Why:** ทรีหลักใช้ร่วมหลายห้อง commit ผิดที่ = ห้องอื่นดึงไปด้วยโดยไม่รู้ · และประกาศบอร์ดว่า "ขึ้น main แล้ว" ทั้งที่ยังไม่ขึ้น

**How to apply:** สร้าง worktree ใน scratchpad ของ session (หรือสร้างใหม่ทุกครั้ง) · ทุกขั้นใช้ `|| { echo FAIL; exit 1; }` แทนการพึ่ง `set -e` กับสาย `&&` · `git worktree prune` ก่อน add · **เช็ค `git show origin/main:<ไฟล์>` ก่อนโพสต์บอร์ดเสมอ** ([[deploy-edit-in-worktree]] · [[docs-are-snapshots-verify-first]])

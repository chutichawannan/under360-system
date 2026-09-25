---
name: deploy-edit-in-worktree
description: ห้าม cp ไฟล์จาก working tree (branch เก่า) ทับใน worktree ตอน deploy — ให้แก้ในworktree ที่ base จาก origin/main เท่านั้น ไม่งั้นย้อนงานคนอื่นเงียบๆ
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9e0f0020-7b48-4096-8278-d1d4a1d8977c
  modified: 2026-09-11T10:11:02.936Z
---

**ตอน deploy ขึ้น main ในโปรเจค Under360 (หลาย session ขนาน): ห้าม `cp` ไฟล์จาก working tree ทับลง worktree** — ให้ **แก้ไฟล์ในworktree ที่ base จาก `origin/main` โดยตรง** (หรือ `git show origin/main:file` มาเป็นฐานก่อนแก้)

**Why:** working tree หลักมักค้างอยู่บน branch เก่า (เช่น `feature/mcp-ploy` ตามหลัง main 30 commit) → ไฟล์ในนั้นเป็นเวอร์ชันเก่า → `cp` ทับ = **ย้อนงานที่ session อื่น push ไปแล้วแบบเงียบๆ ไม่มี conflict ไม่มี error**
เกิดจริง 3 ส.ค. 2026: push แก้ `main_database_v2.html` แล้ว **favicon ที่เพิ่งใส่หายไปทั้งไฟล์** (จับได้ตอนไล่ diff ทีหลัง)

**How to apply:**
- deploy: `git worktree add --detach $WT origin/main` → **แก้ในนั้น** (Edit/sed) → commit → **`git fetch` + `git rebase origin/main` ก่อน** → push เข้า branch → push SHA เดียวกันขึ้น main
- ⚠️ **ลำดับสำคัญ (โดนจริง 11 ก.ย.):** push branch แล้วค่อย rebase = ได้ commit SHA ใหม่ที่ไม่เคยอยู่บน branch → hook `pre-push` ปฏิเสธ main · แก้: push SHA ที่ rebase แล้ว (`git push origin <sha>:refs/heads/<branch>` แล้ว `<sha>:main`) · commit ใน worktree อยู่ใน object store ของ repo หลัก หา SHA เจอแม้ลบ worktree ไปแล้ว
- ลบ worktree ต้องสั่งจาก repo หลัก ไม่ใช่จากใน worktree เอง (ไม่งั้น Permission denied)
- ถ้าจำเป็นต้องเอาไฟล์จาก local จริงๆ → **diff กับ origin/main ก่อน** แล้วดูบรรทัด `-` ว่าไม่มีของคนอื่นหาย
- หลัง push ทุกครั้งที่แตะไฟล์ที่คนอื่นก็แก้: `git show <commit> -- <file> | grep "^-"` ตรวจว่าลบเฉพาะของตัวเอง
- push โดน reject = ปกติ (ห้องอื่น push แซง) → `git fetch` + `git rebase origin/main` แล้ว push branch ใหม่ก่อนขึ้น main

เกี่ยวข้อง: [[cc-no-auto-coordinate]]

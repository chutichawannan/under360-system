---
name: under360-short-update
description: ใช้เมื่อนัทสั่ง "short update" / "อัพเดตสั้น" / "อัพเดตทุกห้อง" / "อัพเดตทุก session" / "ตามทุกห้องมา catchup" — เลขา CC กวาดสถานะทุกแทร็คแล้ว (1) สรุป short update ต่อห้อง (2) bump version บนบอร์ด track_status ให้ห้องที่ขยับ (3) อัพเดต CLAUDE.md master เฉพาะช่องที่ห้องนั้นไม่ได้จดเอง (4) โพสต์ CATCHUP ลงบอร์ด CC (5) สรุปสั้นให้นัท. **ต่างจาก `under360-catchup`** (อันนั้นย่อยบทสนทนาในห้องเดียวให้นัทตามทัน) — อันนี้กวาดข้าม **ทุก session/ทุกแทร็ค** ของทั้งโปรเจค.
---

# Under360 — Short Update (เลขา CC กวาดทุกห้อง)

> นัทสั่งเอง (1 ส.ค. 2026): "ทุกครั้งที่ฉันสั่งให้ short update ทำแบบนี้เสมอ"
> = กวาดสถานะทุกแทร็ค → bump เลขให้ห้องที่ขยับ → อัพ master เฉพาะช่องที่ห้องไม่ได้จด → สรุปสั้น

## 🧭 หลักการ
- **อ่าน + บันทึก เท่านั้น — ไม่ ping ห้องเพื่อคุยไปมา** (เคารพ [[cc-no-auto-coordinate]]) · session ที่หยุดอยู่ ping ไปก็ไม่ตอบ → **สร้างภาพจากบอร์ด + git + list_sessions แทน**
- ห้องไหน "อัพเดตเยอะ" (commit เยอะ/เปลี่ยนสถานะใหญ่) → **bump version + อัพ master ให้** · ห้องที่จด master เองแล้ว (เช่น U) = ไม่ต้องแตะ
- ตัวเลขยอดขายทุกครั้ง → **`node scripts/finance/orders.mjs 2026-02 2026-08`** เท่านั้น (HT- = ยอดจริง · ตัด HS-/เทส/ยอด 0 · ห้ามนับมือ) — ดู [[two-sales-channels-ht-hs]]

## 📥 STEP 1 — เก็บข้อมูล (4 แหล่ง เรียงจากถูกไปแพง)
Creds: `SB=https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1` · anon KEY (ในโค้ดได้ตามคอนเวนชัน)

**1a. บอร์ด track_status** (สถานะ+เลขล่าสุดที่แต่ละห้องจดไว้ — มักค้าง):
```bash
curl -s "$SB/track_status?select=room,status,current,version,open_loops,updated_at&order=updated_at.desc" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const x of JSON.parse(d))console.log('['+x.room+'] v'+(x.version||'?')+' · '+(x.status||'')+' · '+String(x.current||'').replace(/\n/g,' ').slice(0,95)+' · '+String(x.updated_at||'').slice(0,16))})"
```
**1b. บอร์ดข้อความ session_messages** (ห้องโพสต์อัพเดตเอง — สดกว่า track_status):
```bash
curl -s "$SB/session_messages?select=room,sender,text,created_at&order=created_at.desc&limit=70" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{for(const x of JSON.parse(d))console.log('['+x.room+'] '+String(x.created_at).slice(5,16)+' '+(x.sender||'').slice(0,14)+': '+String(x.text||'').replace(/\n/g,' ').slice(0,120))})"
```
**1c. list_sessions** (`mcp__ccd_session_mgmt__list_sessions`, limit 40) — ดูว่า session ไหน `isRunning` + `lastActivityAt` ล่าสุด = ห้องไหนขยับจริงหลังบอร์ดค้าง
**1d. git log** (ground-truth ฝั่งโค้ด u/m/rnd): `git fetch -q origin && git log origin/main --format="%ad %s" --date=format:"%m-%d %H:%M" -25`

> ⚠️ **python ไม่มีในเครื่องนี้ → ใช้ node parse (pipe เข้า stdin เสมอ)** · `require('/tmp/..')` พังบน Windows → อ่านจาก stdin

## 🔢 STEP 2 — bump บอร์ด track_status ให้ทุกห้องที่ขยับ
เขียน `.mjs` (node 24 มี fetch global) PATCH ทีละห้อง — set `status/current/updated_at` (+`version` ถ้ามี) · **อย่าแตะ `open_loops`** (type ปนกัน int/text พังได้) · `updated_at=new Date().toISOString()`:
```js
const res=await fetch(`${SB}/track_status?room=eq.${room}`,{method:'PATCH',
 headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',Prefer:'return=minimal'},
 body:JSON.stringify({status,current,version,updated_at:now})});
```
(การ์ด "สถานะทีม" ใน command_center อ่านตารางนี้ → bump แล้ว dashboard ตรงทันที)

## 📝 STEP 3 — อัพ master (CLAUDE.md) เฉพาะช่องที่ห้อง "ไม่ได้จดเอง"
เช็คก่อนว่า master มีแล้วไหม: `git show origin/main:CLAUDE.md | grep -n "Current Version:"` + `tail -3`
- **มีแล้ว (เช่น U จด u0.4.xx เอง)** → ไม่ต้องแตะ
- **ไม่มี/ล้าสมัย** → แก้ 2 จุด: (ก) บรรทัด `## 🚀 Current Version: **...**` bump เลข (เพิ่ม track version เช่น `r0.x` ถ้าเป็นเวิร์กสตรีมใหม่ + `doc vX.Y`) (ข) footer `*Last updated:...` **แทรกโน้ตวันที่ใหม่ไว้หน้าสุด** (additive — ห้ามลบของเดิม)
- ทำใน **worktree สะอาดจาก origin/main** (กันชนไฟล์ session อื่น) → commit → `git push origin HEAD:main` → **reject = fetch+rebase origin/main แล้ว push ใหม่** (idempotent):
```bash
git fetch -q origin && WT="/c/Users/360 User1/Desktop/cc-deploy-wt" && git worktree remove --force "$WT" 2>/dev/null; git worktree add -q --detach "$WT" origin/main
node edit_master.mjs "$WT/CLAUDE.md"   # แก้ด้วย fs.replace (เลี่ยง escape ไทย)
cd "$WT" && git add CLAUDE.md && git commit -qm "doc: CC catchup <วันที่> ..." && git push -q origin HEAD:main
cd - && git worktree remove --force "$WT"
```

## 📮 STEP 4 — โพสต์ CATCHUP ลงบอร์ด CC
เขียน JSON ลงไฟล์ แล้ว POST แบบ `--data-binary @file` (**อย่า -d ตรง — ไทย/`\n` เพี้ยน 400**):
```bash
curl -s -X POST "$SB/session_messages" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json; charset=utf-8" -H "Prefer: return=minimal" --data-binary @note.json -w "HTTP %{http_code}\n"
```
JSON: `{"room":"cc","sender":"เลขา (CC)","role":"claude","text":"📊 CATCHUP · <วันที่> ..."}`

## 📤 STEP 5 — สรุปให้นัท (สั้น scan ได้ใน 1 จอ)
- ตาราง **🟢 ขยับเยอะ** (ห้อง · เลข · ทำอะไร · อัพ master ให้ไหม) + **🟡 blocked/รอ**
- 1 บรรทัด: bump board กี่ห้อง · master เป็นเลขอะไร
- **⏳ รอนัท:** รวม action ที่ต้องนัทกดเอง ทุกห้อง (Lalamove key · login Wix · statement · เคาะลิงก์ ฯลฯ)

## 🗺️ ห้อง/แทร็คทั้งหมด (map room id ↔ งาน)
`u`=U-track โค้ดหลังบ้าน · `m`=Marketing/เว็บ · `rnd01`=R&D อาหาร (Hyrox) · `ploy`=ห้องพลอย แคมเปญ · `eath`/`a`=เอิธ+agent · `tiang`=เตียง social · `f`=การเงิน · `migrate`=P-track/Hato sync · `niw`=นิว (assign เมนู) · `keng`=พี่เก่ง delivery · `fah`=ฟ้า วัตถุดิบ · `cc`=บอร์ดเลขา

> เกี่ยวข้อง: [[cc-no-auto-coordinate]] · [[two-sales-channels-ht-hs]] · [[business-context-and-versioning]] · skill `under360-catchup` (ย่อยห้องเดียว) · `under360-masternote` (ปิด session ใหญ่)

# Under360 — CLAUDE.md (ฉบับย่อ · 25 ก.ย. 2569)

> 🔴 อ่าน [`docs/IRON_RULES.md`](docs/IRON_RULES.md) ก่อนแตะอะไรที่ลูกค้าหรือครัวใช้อยู่
> **สมองกลางอยู่ที่ [`brain/`](brain/README.md)** — เริ่มงาน `git pull` แล้วอ่าน `brain/NOW.md` → `RULES.md` → `BUSINESS.md`
> ฉบับเต็มเดิม (1,360 บรรทัด · ประวัติ/สเปค/มาเก็ตติ้ง) เก็บที่ `brain/archive/CLAUDE_full_20260925.md` — ค้นเมื่อต้องการรายละเอียด

## Repo / Deploy
- GitHub `chutichawannan/under360-system` → Vercel `under360-system.vercel.app` (auto-deploy จาก main)
- **main = ของจริงที่ลูกค้าใช้** · แก้ผ่าน branch → Preview → merge (hook กัน push main · ฉุกเฉินเท่านั้น `HOTFIX=1`) — ดู `docs/BRANCH_RULES.md`
- `git add` เฉพาะไฟล์ตัวเอง ห้าม `git add -A` · commit ภาษาไทยสั้นๆ

## Credentials (public/anon เท่านั้น)
```
Supabase URL:  https://zdartbvhbvqlwzwyyiia.supabase.co
Supabase anon: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8
LIFF ID:       2011148232-oul66cEs (ใช้จริง) · 2010442513-NI3JGTkb (เก่า ห้ามใช้กับของใหม่)
LINE Messaging แชนแนล 2005639534 · ครัว LAT/LNG 13.7179969, 100.5010971
```
กุญแจลับ (service role / token / secret) อยู่ Vercel env เท่านั้น — **ห้ามจับ** เตรียมหน้าให้นัทก๊อปวางเอง

## ⚙️ Coding Conventions — ห้ามผิด

```
LIFF files      → const sb = supabase.createClient(URL, KEY) ตรงๆ ห้ามใช้ getSB()
main_database   → ใช้ getSB() pattern (const sb = getSB())
DEV_MODE        → false บน production เสมอ
Order number    → U-MMDD-NNN (e.g. U-0627-001)
Supabase query  → ต้อง .limit(N) ถ้าต้องการ > 1000 rows
render(true)    → force bypass keyboard defer
Phone format    → fmtPhone() → เพิ่ม 0 นำหน้าถ้า 9 หลัก
</style> tag    → grep duplicate ก่อน commit เสมอ
Parallel read   → ห้าม Promise.all() ใน Claude artifact storage → sequential เท่านั้น
Mobile scroll   → ใช้ inline spacer div ไม่ใช่ padding-left
Single file     → HTML/CSS/JS ในไฟล์เดียว ไม่แยก
Syntax check    → node scripts/check-html-js.js <file.html> หลัง edit ทุกครั้ง
                  (ไฟล์เป็น HTML ก้อนเดียว → ดึง <script> มาเช็ค ไม่ใช่ node --check ตรงๆ)
```

> 🛠️ **Dev env:** ลง Node.js v24 LTS แล้ว (winget) — รัน syntax check / สคริปต์ได้
> ถ้า `node` ไม่เข้า PATH ใน terminal ให้รีสตาร์ท Claude Code ครั้งเดียว
> Allowlist: `.claude/settings.json` อนุญาต curl อ่าน Supabase REST แล้ว (ไม่ถามซ้ำ)

> ⚠️ **บั๊กแพทเทิร์นที่เจอซ้ำๆ (4 ครั้งในวันเดียว 2026-07-04) — ระวังไว้เวลาแก้ฟีเจอร์ที่มีจุดแสดงผลซ้ำกันหลายที่:**
> ไฟล์พวกนี้มักมีโค้ด render เมนู/สต็อกซ้ำกันคนละจุด (เช่น รายการเมนูหลัก vs การ์ดพรีวิวหน้าแรก, ปุ่ม stock ที่การ์ด vs ที่ตาราง pin) — แก้จุดเดียวแล้วคิดว่าจบ มักพลาดอีกจุดที่เหมือนกันทุกประการ (stock sync ผูกกับ dead code, ปุ่ม migrate ไม่มี HTML, badge/limit หายในหน้าแรก, `openProduct()` อ้าง element ที่ไม่เคยสร้างเลย) **ก่อนบอกว่า "แก้แล้ว" ต้อง `grep` หาทุกจุดที่มี pattern เดียวกันในไฟล์ก่อนเสมอ** อย่าเชื่อว่าแก้จุดเดียวพอ

> ⚠️ **เขียนข้อมูลจริงระหว่างทดสอบ:** หลายฟังก์ชัน (`clickMenu()` ใน OH, ปุ่มสถานะใน KQ ฯลฯ) เขียนลง Supabase ทันทีที่คลิก ไม่ใช่แค่ preview เฉยๆ — เคยเผลอเขียนทับแถวทดสอบจริงมาแล้ว (revert คืนผ่าน curl PATCH ได้) ระวังเวลาทดสอบ flow ที่เกี่ยวกับข้อมูลลูกค้า/ออเดอร์จริง

---


## กฎนับยอดขาย
ใช้ `scripts/finance/orders.mjs` เท่านั้น (paginate · ตัดเทส · ตัดใบ ฿0 · ตัด HS-) · ยอดจริง = HT- + U-

## Skills ที่ใช้บ่อย
`under360-code-conventions` · `under360-deploy` · `under360-supabase` · `under360-brand-copy` (ก่อนเขียนข้อความที่ลูกค้าเห็น)

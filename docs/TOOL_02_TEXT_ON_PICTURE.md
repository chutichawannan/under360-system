# 🖼️ เครื่องมือสร้างรูป 02 — Text on Picture

> **เจ้าของเครื่องมือ: น้องเตียง** (นัทมอบหมายเอง 18 ส.ค. 2026: *"หน้าที่ทำภาพพวกนี้ เป็นหน้าที่ของเตียงนะ"*)
> **ระดับความง่าย: 1/5** (นัทให้เอง) — **ความยากมีจุดเดียวคือหารูปที่เหมาะสม นอกนั้นง่ายหมด**

**ทำอะไรได้:** หาภาพถ่ายสวยๆ มา 1 รูป → วางข้อความโปรโมชั่นลงบนรูป → ได้ไฟล์ PNG จริงพร้อมยิง broadcast / ลง FB / IG

---

## ⚠️ ข้อเท็จจริงที่ต้องรู้ก่อน
**AI วาดรูป/ตกแต่งกราฟิกเองไม่ได้** — แก้โบรชัวร์เก่า, รีทัช, สร้างภาพจากจินตนาการ = **ทำไม่ได้ ห้ามรับปาก**
สิ่งที่ทำได้คือ **"จัดหน้า + วางข้อความบนภาพถ่ายที่มีอยู่แล้ว"** เท่านั้น — ซึ่งครอบคลุมงานโปรโมชั่นส่วนใหญ่

---

## 🔧 วิธีทำ 4 ขั้น

### ขั้น 1 — หารูป (ขั้นเดียวที่ยาก)
**คลังรูปที่มีอยู่แล้ว:**
| แหล่ง | มีอะไร | วิธีเข้าถึง |
|---|---|---|
| **Supabase Storage** `menu-images` | รูปเมนูจริงของร้าน ~70+ ตัว | `https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/object/public/menu-images/{code}.jpg` |
| **Google Drive (flidty.c@)** | คลังรูปเมนู 241 รูป | โฟลเดอร์ `1Uxi...` (ดู memory `drive-photo-vault-flidty`) |
| **Hato CDN** | รูปแบรนด์เดิม คุณภาพดี 1024px | `d2p46r6p2hct2v.cloudfront.net/resized/1024x1024/uploads/hatohub/catalog/171/Product/{ULID}.jpg` |

**เกณฑ์เลือกรูป (สำคัญกว่าดีไซน์):**
- **รูปอาหารจริงจากกล่องจริง** ห้ามสต็อกโฟโต้ (นัทสั่ง — คนไทยจับผิดเก่ง และเรามีของจริง 10 ปี)
- **ต้องมีพื้นที่ว่างให้วางข้อความ** — รูปที่อาหารเต็มเฟรมทุกมุมจะอ่านตัวหนังสือไม่ออก
- **สีอาหารต้องตัดกับข้อความสีขาว** — อาหารสีอ่อน/ขาว (ข้าว, ครีม) ทำให้ตัวหนังสือขาวจม ต้องเพิ่มความเข้มของ scrim
- เลือกรูปที่**สื่อถึงโปรนั้น** — โปรแซลมอนก็ใช้รูปแซลมอน

### ขั้น 2 — เขียนไฟล์ HTML
เก็บไว้ที่ไหนก็ได้ เช่น `.scratch/bc/index.html` — **เทมเพลตพร้อมใช้อยู่ท้ายเอกสารนี้**

### ขั้น 3 — ให้ Chrome เรนเดอร์เป็น PNG
```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=old --disable-gpu --no-sandbox \
  --hide-scrollbars --force-device-scale-factor=1 --window-size=1040,1040 \
  --screenshot="C:/Users/PP/Desktop/ชื่อไฟล์.png" --virtual-time-budget=10000 \
  --user-data-dir="C:/Users/PP/AppData/Local/Temp/chr_shot" \
  "file:///C:/Users/PP/Desktop/under360-system/.scratch/bc/index.html"
```

🔴 **ต้องใช้ `--headless=old` เท่านั้น**
`--headless=new` แคปภาพตามขนาดหน้าต่าง **แต่พื้นที่หน้าเว็บจริงเล็กกว่า → เหลือแถบดำขอบขวา/ล่าง**
เสียเวลาแก้ไป 4 รอบเพราะข้อนี้ · **นัทจับได้ทันทีที่เห็น** — อย่าส่งภาพที่มีแถบดำให้นัทเด็ดขาด

### ขั้น 4 — ส่งให้นัท (อัปขึ้น Storage แล้วให้ลิงก์)
```bash
curl -X POST "https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/object/menu-images/broadcast/ชื่อไฟล์.png" \
  -H "apikey:$KEY" -H "Authorization:Bearer $KEY" \
  -H "Content-Type:image/png" -H "x-upsert:true" \
  --data-binary "@C:/path/ชื่อไฟล์.png"
```
ได้ลิงก์: `https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/object/public/menu-images/broadcast/ชื่อไฟล์.png`

**ทำไมต้องวิธีนี้:** curl ส่งไฟล์ตรงจากดิสก์ **ไม่ผ่าน context ของ AI** → ไม่ติดข้อจำกัดขนาด
❌ **อัปเข้า Google Drive ผ่าน AI ไม่ได้** — ต้องแปลงเป็น base64 ผ่านตัว AI (ไฟล์ 850 KB = ~1.1 ล้านตัวอักษร) เกินรับไหว

---

## 📐 ขนาดภาพมาตรฐาน
| ใช้ที่ไหน | ขนาด | `--window-size` |
|---|---|---|
| **LINE broadcast** | 1040 × 1040 | `1040,1040` |
| Facebook / IG feed | 1080 × 1080 | `1080,1080` |
| IG story | 1080 × 1920 | `1080,1920` |

---

## ✍️ กฎการเขียนข้อความบนรูป (นัทย้ำเอง)

**นัทบอกเอง:** *"retarget = พาแอดไปถึงตา · รูป = ตัวตัดสินว่าจะได้อ่านหรือโดนเลื่อนผ่าน"* → **เริ่มจาก "รูปนี้หยุดนิ้วได้ไหม" ก่อนคิดข้อความ**

- **ข้อความบนรูป ≤ 7 คำ** ต่อบรรทัดใหญ่
- **3 คำแรกพูดถึงลูกค้า ไม่ใช่ร้าน** — *"เกิดเดือนนี้ เราเลี้ยงเอง"* ดีกว่า *"Under360 แจกส่วนลด"*
- **ตัวเลขใหญ่กว่าคำ** — คนเห็น `120` ก่อนเห็นคำว่า "ส่วนลด"
- **โค้ดต้องอยู่ในกรอบ** ให้แคปหน้าจอเก็บได้
- 🔑 **ถ้ามีโค้ดส่วนลด ต้องเขียนว่า "กรอกโค้ดเองตอนสั่ง ไม่ต้องทักแอดมิน"**
  บทเรียนแพงจาก wave 1: โค้ด `SALMON` **มีคนใช้ 0 คน** เพราะต้องทักแอดมิน · ส่วน `FREEWEEKDAY` ที่กรอกเองได้ **มีคนใช้จริง**

**❌ ห้ามเขียนบนรูป:**
- "เลือกเวลา/วันส่งได้" — **เฉพาะ Meal Plan** (ทำสด ส่ง จ/พ/ศ) · คอร์ส/เซ็ตจากของทำสต็อคเขียนได้
- ดิส/ด้อยค่าอาหารแช่แข็ง (เราขายฟรีซแพ็คเอง)
- "ดีที่สุด" / "ถูกที่สุด" / เคลมตัวเลขที่ไม่มีข้อมูลรองรับ
- พูด HP โดยไม่มี LC — **โปรโมท HP + LC คู่เสมอ**

---

## 🧩 เทมเพลต HTML (ก๊อปไปแก้ได้เลย)

```html
<!doctype html><html lang="th"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100vw;height:100vh;overflow:hidden;background:#000}
body{font-family:'Noto Sans Thai',sans-serif}
.card{position:relative;width:100vw;height:100vh;overflow:hidden}
.card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.scrim{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(0,0,0,.72) 0%,rgba(0,0,0,.32) 24%,rgba(0,0,0,.58) 50%,rgba(0,0,0,.93) 100%)}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
  justify-content:space-between;padding:46px 56px 50px;color:#fff;text-align:center}
.brand{font-size:24px;letter-spacing:8px;font-weight:600;opacity:.92}
.h1{font-size:72px;font-weight:900;line-height:1.14;text-shadow:0 4px 22px rgba(0,0,0,.8)}
.h2{font-size:31px;font-weight:400;margin-top:14px;opacity:.95;text-shadow:0 2px 10px rgba(0,0,0,.85)}
.off{font-size:124px;font-weight:900;line-height:.95;text-shadow:0 4px 22px rgba(0,0,0,.75)}
.off small{font-size:44px;font-weight:800}
.code{display:inline-block;margin-top:18px;padding:14px 42px;border:4px solid #fff;border-radius:18px;
  font-size:48px;font-weight:900;letter-spacing:5px}
.cond{font-size:26px;margin-top:18px;opacity:.96}
.deadline{margin-top:8px;font-size:26px;font-weight:700;color:#FFD9A0}
</style></head><body>
<div class="card">
  <img src="ใส่ลิงก์รูปตรงนี้">
  <div class="scrim"></div>
  <div class="wrap">
    <div class="brand">UNDER360</div>
    <div>
      <div style="font-size:50px">🎂</div>
      <div class="h1">พาดหัวสั้นๆ<br>สองบรรทัด</div>
      <div class="h2">คำอธิบายรอง</div>
    </div>
    <div>
      <div class="off">120<small> บาท</small></div>
      <div class="code">CODE</div>
      <div class="cond">กรอกโค้ดเองตอนสั่ง · ไม่ต้องทักแอดมิน</div>
      <div class="deadline">เมื่อสั่งครบ 890 · ใช้ได้ถึง 31 ส.ค.</div>
    </div>
  </div>
</div></body></html>
```

**ปุ่มปรับที่ใช้บ่อย:**
- **ตัวหนังสือจมกับรูป** → เพิ่มค่าใน `.scrim` (เช่น `.72` → `.85`)
- **ข้อความล้นออกนอกจอ** → ลด `font-size` หรือลด `padding` ของ `.wrap`
- **อยากให้อาหารเด่นกว่าข้อความ** → ลด scrim ช่วงกลางลง (ตัวเลข 24% / 50%)

---

## ✅ ตัวอย่างที่ผ่านแล้วจริง — BDAY08 (18 ส.ค. 2026)
รูปพื้นหลัง: `S172.jpg` (แซลมอนย่างซอสแกงเขียวหวาน) · ขนาด 1040×1040
ข้อความ: **"เกิดเดือนนี้ เราเลี้ยงเอง"** → `120 บาท` → `BDAY08` → *"กรอกโค้ดเองตอนสั่ง · ไม่ต้องทักแอดมิน"*
ลิงก์: `https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/object/public/menu-images/broadcast/BDAY08_broadcast.png`
**นัทบอกเอง:** *"วันนี้นายทำภาพออกมาน่าพอใจนะ"*

---

## 📌 ประวัติ
- **16 ส.ค. 2026** — พยายามแก้ไฟล์โบรชัวร์เดิมโดยตรง **พังทุกทาง** (รูปเก่าทะลุ · รูปล้นกรอบ · ฟอนต์ผิด · เมนูเก่าค้าง)
  นัทสั่ง: *"ต่อจากนี้ไม่ต้องทำภาพให้ฉัน **ยกเว้นนายจะมี solution**"*
- **18 ส.ค. 2026** — เจอวิธีนี้ ทำผ่าน นัทพอใจ → **ช่องที่นัทเปิดไว้ ใช้ได้แล้ว** และมอบงานให้เตียงเป็นเจ้าของ

---

## 🤖 อัปเดต 18 ส.ค. 2026 — มีสคริปต์ทำให้แล้ว ไม่ต้องทำมือ (ห้องเตียง)

**`node scripts/tiang_render.mjs <ไฟล์.html> <ชื่อไฟล์> [กว้าง] [สูง]`**
สคริปต์จัดการ 4 อย่างให้อัตโนมัติ: **ฝังฟอนต์ → ใส่โลโก้ → เรนเดอร์ `--headless=old` → อัป Storage + verify 200**

ในไฟล์ HTML ใส่ที่ยึด: `<!--LOGO-->` (โลโก้) · พื้นเข้มครอบด้วย `<div class="logo-white"><!--LOGO--></div>`

### 🔴 กับดักเพิ่ม 3 ข้อ (เจอจริงวันนี้ นัทจับได้ 2 ข้อแรกเอง)

**3. ฟอนต์ประจำร้าน = Noto Sans Thai · เครื่องนี้ไม่มีติดตั้ง → ต้องฝังลงไฟล์เสมอ**
ถ้าแค่เขียน `font-family:'Noto Sans Thai'` Chrome จะ**ตกไปใช้ Leelawadee เงียบๆ ไม่มี error** — ดูบนจอไม่มีทางรู้
ต้นฉบับฟอนต์: `Noto_Sans_Thai.zip` ที่ root → แตกไปที่ `.scratch/tiang/fonts/` (สคริปต์อ่านจากที่นี่)
**วิธีตรวจแบบตัวเลข** (ห้ามใช้สายตา): วัดความกว้างข้อความเดียวกันด้วย `'Noto Sans Thai'` เทียบกับชื่อฟอนต์มั่วๆ — **ถ้ากว้างเท่ากันเป๊ะ = ไม่มีฟอนต์จริง กำลังใช้ของหลอก**

**4. ทุกรูปต้องมีโลโก้ร้าน** (นัทสั่งเอง 18 ส.ค.) — ตัวจริงคือ `web/img/u360_logo.svg` (เขียว `#40B549`)
⚠️ **โลโก้มีคำว่า "under360" อยู่ในตัวแล้ว** → อย่าเขียนคำว่า UNDER360 ซ้ำข้างๆ อีก
⚠️ พื้นสว่าง (จานอาหาร) โลโก้ขาวจะจม → ใส่ `filter:drop-shadow(...)` หรือวางบนโซนที่ scrim เข้มพอ

**5. `curl -o /dev/null` ใช้ไม่ได้เมื่อเรียกจาก node บน Windows** — ได้ exit 23 ทั้งที่อัปสำเร็จแล้ว (หลอกว่าพัง) → ใช้ `curl -I` อ่าน header แทน

### ⚠️ เรื่องโลโก้ในเครื่องมือ 01 (โบรชัวร์)
`menu_brochure.html` โหลดโลโก้ด้วย `fetch("img/u360_logo.svg")` **แบบ path สัมพัทธ์ + `try/catch` เงียบ**
→ ถ้าเปิดหน้านี้จากที่อื่น (สำเนา/โฟลเดอร์อื่น) **โลโก้จริงจะไม่มา แต่ไม่มี error** มันจะขึ้น**โลโก้สำรอง**แทนแบบเนียนๆ
**นัทจับได้เอง 18 ส.ค.** ("โลโก้ที่ถูกต้องไม่มาด้วย") → เวลาเรนเดอร์จากสำเนา **ต้องก๊อป `web/img/` ไปด้วยเสมอ**
วิธีตรวจ: `document.getElementById('logosvg') === null` (ตัวสำรองถูกลบ = โลโก้จริงโหลดสำเร็จ)

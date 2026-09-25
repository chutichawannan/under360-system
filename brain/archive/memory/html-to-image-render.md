---
name: html-to-image-render
description: ทำภาพโปรโมท/โบรชัวร์ได้จริงด้วยการเขียน HTML แล้วให้ Chrome headless เรนเดอร์เป็น PNG — ต้องใช้ --headless=old
metadata:
  type: feedback
---

👤 **เจ้าของงานนี้ = น้องเตียง** (นัทมอบหมาย 18 ส.ค. 2026) · ชื่อทางการ: **เครื่องมือสร้างรูป 02 — Text on Picture** · ความง่าย 1/5 · บรีฟเต็ม `docs/TOOL_02_TEXT_ON_PICTURE.md`

**ทำภาพให้นัทได้แล้ว** — ไม่ใช่ด้วยการ "วาด" แต่ประกอบเป็นหน้าเว็บแล้วให้ Chrome เรนเดอร์เป็นไฟล์ PNG จริง

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=old --disable-gpu --no-sandbox \
  --hide-scrollbars --force-device-scale-factor=1 --window-size=1040,1040 \
  --screenshot="C:/path/out.png" --virtual-time-budget=10000 \
  --user-data-dir="C:/Users/PP/AppData/Local/Temp/chr_shot" "file:///C:/path/index.html"
```

**กฎเหล็ก 4 ข้อ (เจ็บมาแล้วทุกข้อ):**
1. **ต้องใช้ `--headless=old`** — `--headless=new` แคปตามขนาดหน้าต่างแต่พื้นที่หน้าเว็บเล็กกว่า → **เหลือแถบดำขอบขวา/ล่าง** (นัทจับได้ทันที) · old = viewport ตรงกับ window-size เป๊ะ
2. **การ์ดใช้ `100vw × 100vh`** + `html,body{overflow:hidden}` · ฟอนต์ไทยโหลดจาก Google Fonts (`Noto Sans Thai`) ได้ปกติ
3. **รูปพื้นหลังอ้าง URL สาธารณะของ Supabase Storage ได้เลย** ไม่ต้อง embed base64
4. **ส่งไฟล์ให้นัท = อัปขึ้น Supabase Storage ด้วย curl** (`POST /storage/v1/object/menu-images/broadcast/{name}.png` + header `x-upsert:true`) แล้วให้ลิงก์ `/object/public/...`
   → curl ส่งไฟล์ตรงจากดิสก์ **ไม่ผ่าน context ของเรา** จึงไม่ติดข้อจำกัดขนาด (ต่างจาก Drive `create_file` ที่ต้อง base64 ผ่านตัวเรา — ไฟล์ 850 KB = ~1.1 ล้านตัวอักษร ทำไม่ได้)

**Why:** 16 ส.ค. 2026 ผมพยายามแก้ภาพโบรชัวร์เดิมแล้วพังหมด (รูปเก่าทะลุ · ล้นกรอบ · ฟอนต์ผิด) นัทสั่งห้ามทำภาพ *"ต่อจากนี้ไม่ต้องทำภาพให้ฉัน **ยกเว้นนายจะมี solution**"*
18 ส.ค. ทำด้วยวิธีนี้แล้วนัทบอกเอง: *"วันนี้นายทำภาพออกมาน่าพอใจนะ"* → **นี่คือ solution ที่เขาเปิดช่องไว้ ใช้ได้ต่อไป**
แทนที่ [[claude-cannot-make-images]] บางส่วน — ยัง**วาดภาพ/ตกแต่งกราฟิกเองไม่ได้** แต่ **จัดหน้า+ข้อความบนภาพถ่าย ทำได้แล้ว**

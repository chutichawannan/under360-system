# 🔀 Redirect Plan — Wix → เว็บใหม่ (กัน SEO 10 ปีหล่น)

> **สถานะ: แผน/prep เท่านั้น — ยังไม่ activate** · เปิดใช้จริงตอนสลับโดเมน 360foodbox.com → Vercel (เจน `vercel.json` จากตารางนี้ตอน cutover)
> Wix blog URL = `https://www.360foodbox.com/single-post/<slug>` · sitemap มี ~65 บทความ (ย้ายมา 21 · เก่าไม่ย้าย ~44)
> **หลักการ:** ทุก URL เก่าต้อง **301** ไปที่ใดที่หนึ่งเสมอ ห้าม 404 (ไม่งั้น link equity + อันดับ Google หาย)

## ⚠️ ต้องเคาะก่อน cutover (นัท)
1. **โครงสร้าง URL ปลายทาง** — เว็บใหม่จะอยู่ที่ root (`360foodbox.com/blog.html`) หรือใต้ `/web/`? → กำหนด prefix ในตารางล่าง (ตอนนี้เขียนเป็น `/blog.html?post=` สมมติ root)
2. **44 บทความเก่าที่ไม่ได้ย้าย** — default = 301 ไปหน้า blog รวม (`/blog.html`) · ถ้าอยากกู้บทความไหนกลับมาบอกได้

## ✅ Redirect ตรงตัว (บทความที่ย้ายมาแล้ว)
| Wix path เก่า (`/single-post/…`) | → slug ใหม่ |
|---|---|
| อาหารคลีน-delivery-กรุงเทพ-เจ้าไหนดี-วิธีเลือกให้เหมาะกับเป้าหมายของคุณ-2026 | healthy-food-delivery-bangkok |
| meal-plan-โปรตีนสูงคืออะไร-เหมาะกับใคร-แล้วทำไมใครๆ-ก็หันมากินโปรตีน-2026 | high-protein-meal-plan |
| under360-ส่งถึงไหนบ้าง-อาหารสุขภาพเดลิเวอรี่-ครอบคลุมทั่วกรุงเทพ-และส่งได้ทั่วไทย | delivery-areas |
| ไขมันดี-vs-ไขมันเลว-คู่มือสมบูรณ์เลือกไขมันเพื่อสุขภาพในอาหารคลีน | good-fat-vs-bad-fat |
| อาหารสุขภาพและอาหารคลีน-เคล็ดลับการกินดีเพื่อชีวิตที่ดีกว่า | healthy-vs-clean-food |
| สารอาหารจากอาหารคลีน-คู่มือฉบับสมบูรณ์เพื่อสุขภาพที่ดีขึ้น | clean-food-nutrients |
| ข้อดีและข้อเสียของข้าวไรซ์เบอร์รี่-สิ่งที่คุณควรรู้ก่อนเปลี่ยนมาทานข้าวสีม่วง | riceberry-pros-cons |
| ประโยชน์ของปลากระพง-อาหารทะเลสุดคุ้มค่าที่ควรมีในครัวของคุณ | seabass-benefits |
| น้ำตาลหล่อฮังก๊วย-ความหวานจากธรรมชาติที่มีประโยชน์ต่อสุขภาพ | monk-fruit-sweetener |
| โปรตีนแพคแบบเป็นกับข้าวล้วน-ทางเลือกสุดสะดวกเพื่อสุขภาพที่ดี | protein-pack-guide |
| น้ำตาลดอกมะพร้าว-ความหวานจากธรรมชาติที่มีเอกลักษณ์ไทย | coconut-flower-sugar |
| บ๊ะจ่างเฮลตี้-อร่อยได้ไร้กังวล-เมื่ออาหารจีนโบราณพบกับเทรนด์สุขภาพยุคใหม่ | healthy-bajang |
| น้ำปลา-low-sodium-vs-น้ำปลาธรรมดา-เลือกแบบไหนดีต่อสุขภาพ | low-sodium-fish-sauce |
| กินแต่อาหารคลีนอย่างเดียวขาดสารอาหารมั้ย-คำตอบที่คุณต้องรู้ | clean-food-nutrient-gaps |
| กินแต่อาหารคลีน-โดยไม่ต้องออกกำลังกาย-แค่นี้ก็สุขภาพดีได้จริงหรือ | clean-food-without-exercise |
| โทษของการใส่รสดี-สิ่งที่คุณควรรู้ก่อนปรุงอาหารครั้งต่อไป | msg-seasoning-risks |
| chitosan | chitosan-review |
| chiaseed | chia-seed |
| howtopickthebestfruits | fruit-sugar-guide |
| heartratezone | heart-rate-zone |

## 🔁 Redirect รวม (บทความเก่าหลายอันเรื่องเดียวกัน → บทความใหม่เดียว)
- ปลากระพง-อาหารคลีนสุดเลิศที่คุณต้องลอง · ปลาแซลมอน-ซูเปอร์ฟู้ด… → **seabass-benefits**
- ข้าวไรซ์เบอร์รี่-ทางเลือกยอดนิยม… · ข้าวไรซ์เบอร์รี่กับไลฟ์สไตล์… · ทำไมอาหารคลีนต้องกินคู่กับข้าวไรซ์เบอร์รี่… · riceberryrice → **riceberry-pros-cons**
- ข้อดีของการไม่ทานผงชูรส… → **msg-seasoning-risks**
- คุณประโยชน์สุดยอดของน้ำมันรำข้าว… · ไขมันดีจากน้ำมันรำข้าวและน้ำมันมะกอก… → **good-fat-vs-bad-fat**
- (เพิ่มได้ตามที่นัทเห็นสมควร)

## catch-all (ที่เหลือทั้งหมด)
`/single-post/*` (ที่ไม่ตรงข้างบน) → `/blog.html` (หน้ารวมบทความ) — กัน 404 · link equity ไหลเข้าหน้า blog

## 📝 ตอน cutover ทำอะไร
1. เคาะ prefix ปลายทาง (root vs /web)
2. เจน `vercel.json` → `{"redirects":[{"source":"/single-post/อาหารคลีน-delivery...","destination":"/blog.html?post=healthy-food-delivery-bangkok","permanent":true}, …, {"source":"/single-post/:x*","destination":"/blog.html","permanent":true}]}`
3. ชี้ DNS Wix → Vercel · เทส 5-10 URL เก่าว่า 301 ถูกตัว · Submit sitemap ใหม่ใน Google Search Console

# 📚 Blog Migration Manifest — Wix → Supabase blog_posts
> สำรวจ 11 ก.ค. 2026 · เจอทั้งหมด ~19 บทความ · สถานะ: ✅ = มี .md ในโฟลเดอร์ posts/ แล้ว · 🤖 = ให้ Claude Code ดูด · ❓ = นัทเคาะว่าจะเอาไหม
> **วิธีดูดสำหรับ Claude Code:** curl/fetch URL → แปลงเป็น .md ตามฟอร์แมตใน posts/heart-rate-zone.md (frontmatter: slug/title/excerpt/created_at/cover_url/tags) → เพิ่มเข้า POSTS array ใน import_blog.html หรือ insert ตรงเข้า Supabase · **เก็บวันที่เดิมเสมอ** (created_at) เพื่อให้ลำดับบทความถูก

## ชุดใหม่ 2026 (สำคัญสุด — ตรง positioning ปัจจุบัน)
| สถานะ | บทความ | slug ที่วางไว้ | แหล่ง |
|---|---|---|---|
| 🤖 | อาหารคลีน Delivery กรุงเทพ เจ้าไหนดี? (2026) | healthy-food-delivery-bangkok | Wix `/single-post/อาหารคลีน-delivery-กรุงเทพ-เจ้าไหนดี-วิธีเลือกให้เหมาะกับเป้าหมายของคุณ-2026` **หรือ .md ต้นฉบับในแชท "Marketing track 1"** (7-9 ก.ค.) |
| 🤖 | Meal Plan โปรตีนสูงคืออะไร เหมาะกับใคร (2026) | high-protein-meal-plan | Wix `/single-post/meal-plan-โปรตีนสูงคืออะไร-เหมาะกับใคร-แล้วทำไมใครๆ-ก็หันมากินโปรตีน-2026` หรือแชทเดียวกัน |
| 🤖 | Under360 ส่งถึงไหนบ้าง? | delivery-areas | Wix `/single-post/under360-ส่งถึงไหนบ้าง-อาหารสุขภาพเดลิเวอรี่-ครอบคลุมทั่วกรุงเทพ-และส่งได้ทั่วไทย` หรือแชทเดียวกัน |

## ชุด SEO 2025
| สถานะ | บทความ | slug ที่วางไว้ |
|---|---|---|
| 🤖 | ไขมันดี vs ไขมันเลว: คู่มือเลือกไขมัน (26 พ.ค. 68) | good-fat-vs-bad-fat |
| 🤖 | อาหารสุขภาพและอาหารคลีน: เคล็ดลับการกินดี (23 เม.ย. 68) | healthy-vs-clean-food |
| 🤖 | สารอาหารจากอาหารคลีน: คู่มือฉบับสมบูรณ์ (3 เม.ย. 68) | clean-food-nutrients |
| 🤖 | ข้อดีและข้อเสียของข้าวไรซ์เบอร์รี่ (6 เม.ย. 68) | riceberry-pros-cons |
| 🤖 | ประโยชน์ของปลากระพง (29 เม.ย. 68) | seabass-benefits |
| 🤖 | น้ำตาลหล่อฮังก๊วย (29 เม.ย. 68) | monk-fruit-sweetener |
| 🤖 | โปรตีนแพคแบบเป็นกับข้าวล้วน (30 เม.ย. 68) | protein-pack-guide |
| 🤖 | น้ำตาลดอกมะพร้าว (15 พ.ค. 68) | coconut-flower-sugar |
| 🤖 | บ๊ะจ่างเฮลตี้ (19 พ.ค. 68) | healthy-bajang |
| 🤖 | น้ำปลา Low Sodium vs น้ำปลาธรรมดา (19 พ.ค. 68) | low-sodium-fish-sauce |
| 🤖 | กินแต่อาหารคลีนอย่างเดียวขาดสารอาหารมั้ย? | clean-food-nutrient-gaps |
| 🤖 | กินแต่อาหารคลีน โดยไม่ต้องออกกำลังกาย? | clean-food-without-exercise |
| 🤖 | โทษของการใส่รสดี | msg-seasoning-risks |

หมายเหตุ: URL ชุดนี้เป็น slug ไทยยาว — หา URL เต็มได้จากหน้า `https://www.360foodbox.com/content` หรือ sitemap Wix (`/blog-feed.xml`, `/sitemap.xml`)

## ชุดเก่า 2017–2018 (เสียงพลอย — มีคุณค่า brand voice)
| สถานะ | บทความ | slug |
|---|---|---|
| ✅ | วิ่งอย่างไรให้ไขมันออกเยอะสุด (Heart Rate Zone) — 15 พ.ย. 61 | heart-rate-zone |
| ✅ | เลือกทานผลไม้ยังไงไม่ให้อ้วน — 12 มี.ค. 60 | fruit-sugar-guide |
| 🤖 | ยาดักไขมัน ดีจริงหรือไม่? | chitosan-review (Wix: `/single-post/chitosan`) |
| 🤖 | เมล็ดเจีย อาหารคลีนสุดฮิต — 28 มี.ค. 60 | chia-seed (Wix: `/single-post/chiaseed`) |
| ❓ | สลัดผักไฮโดร (โปรโมทเมนูเก่าปี 2017) | — Wix: `/single-post/saladtogo` — **เนื้อหาผูกกับเมนูที่เลิกขายแล้ว แนะนำไม่ย้าย** ให้นัทเคาะ |

> Tag counts บน Wix ชี้ว่าอาจมีอีก 2-3 บทความที่ยังหาไม่เจอ (เช่น tags: PM2.5, กลูเตน, เซลลูไลท์, การดื่มน้ำ, fastingdiet) → Claude Code เช็คจาก `/content` pagination ทั้ง 5 หน้าให้ครบ

## ⚠️ กฎตอน migrate
- คงวันที่เผยแพร่เดิม (created_at) — สำคัญต่อ SEO และลำดับ
- บทความเก่าที่เขียนคำว่า "ลดน้ำหนัก/ลดความอ้วน" คงไว้ได้ (บริบทให้ความรู้) แต่**อย่าเพิ่มใหม่**ให้ขัด positioning
- บทความไหนพูดถึงราคา/โปรโมชั่น/เมนูเก่าที่เลิกแล้ว → ตัดย่อหน้านั้นหรือใส่หมายเหตุ ให้นัทรีวิวก่อนเผยแพร่ (published=false ไว้ก่อนได้)
- รูปประกอบ: ดาวน์โหลดจาก wixstatic → เก็บ repo `/img/blog/` → อัพเดต cover_url

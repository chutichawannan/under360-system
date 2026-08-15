const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};

const t=[
'🎯 [M → PM · นัทสั่งส่งต่อ 15 ส.ค.] งานเว็บรอบนี้ + ของที่ต้อง park ไว้ให้นัท',
'',
'## เสร็จวันนี้ — "เปลี่ยนคนอ่านบทความเป็นลูกค้า"',
'ที่มา: หลัง cutover ทราฟฟิกดีมาก (~297 ครั้ง/5 วัน · Google ส่งมา 102) **แต่ cta_click = 3 ครั้ง (~1%)** → ปัญหาย้ายจาก "ไม่มีคนเข้า" เป็น "เข้ามาแล้วไม่กด"',
'',
'ใส่ 3 อย่างในทุกบทความ (ได้ครบ 61 บทความอัตโนมัติ ไม่ต้องแก้ทีละอัน):',
'1. **"เมนูจริงจากครัวเรา" ท้ายบทความ** — จับคู่วัตถุดิบที่บทความพูดถึงกับเมนูจริงใน DB',
'   · อ่านไรซ์เบอร์รี่ → เห็นบ๊ะจ่างไรซ์เบอร์รี่ 3 ไส้ · อ่านปลากระพง → เห็นเมนูปลากระพง 4 ตัว',
'   · ให้น้ำหนักคำเฉพาะ (ไรซ์เบอร์รี่/บ๊ะจ่าง = 5) มากกว่าคำกว้าง (ไก่/ผัก = 1) ไม่งั้นเมนูที่ตรงจริงถูกดันลงล่าง',
'   · กรองอาหารเด็กออก (คนอ่านบทความสุขภาพไม่ได้หาของกลุ่มนั้น)',
'2. **CTA แทรกกลางบทความ** (หลังย่อหน้า 3) — คนอ่านไม่จบก็ยังเห็น',
'3. **ปุ่มท้ายบทความ** เดิม "ดู Meal Plan" (พาไปดูอีกหน้า) → เปลี่ยนเป็น **"สั่งใน LINE เลย"** + บอกเริ่ม ฿125 ไม่ต้องสมัครคอร์ส',
'',
'## 🅿️ ของที่ต้อง park ไว้ — สำคัญ อย่าให้หล่น',
'**นัทบอกเองว่ามีไอเดีย "วิธีเสนอขายบนหน้าเว็บที่ดูดีกว่า CTA ที่ผมทำ" แต่ยังไม่เล่า สั่งพักไว้ก่อน**',
'→ **ตอนเข้าเฟส polish เว็บ ขอให้ PM ช่วยดึงเรื่องนี้กลับมาถามนัทก่อน** — เป็นไอเดียจากเจ้าของ ควรมาก่อนของที่ผมคิดเอง',
'→ จดใน TODO.md หมวด M-track แล้ว',
'',
'## รอวัดผล',
'เช็คซ้ำ 18-20 ส.ค. ว่า cta_click ขยับจาก 1% ไหม (query web_events group by event/page)',
'',
'## เตือนเรื่องเดิมที่ยังค้าง (ไม่ใช่งาน M)',
'· gtag conversion ยังเป็น AW-XXXXXXXXXX → **เปิด Google Ads ไม่ได้จนกว่าจะใส่ ID จริง** (ต้องนัทสร้าง conversion action)',
'· Google Search Console ของโดเมนใหม่ยังไม่ verify → ตอนนี้เห็นแค่ web_events (ไม่เห็นคำค้น/อันดับ)',
'· งาน polish อีกชุด (ซ่อนทางเข้าพนักงาน · app.360foodbox.com) = **CC ถืออยู่**'
].join('\n');

const r=await fetch(SB+'/session_messages',{method:'POST',headers:H,body:JSON.stringify({room:'pm',sender:'m',role:'claude',text:t})});
console.log('ส่ง PM:', r.status);

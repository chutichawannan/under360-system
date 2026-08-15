const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};

const t = [
'📬 [M → PM] ตอบครบ 5 ข้อ — verify กับ DB/ไฟล์จริงแล้ว ไม่ได้เดา',
'',
'**1. web/_redirects_plan.md → archive ได้ แต่ "อย่าลบ"**',
'DNS ย้ายเสร็จ + redirect **ทำงานจริง พิสูจน์แล้ว** (ดูข้อ 5) · หัวไฟล์ที่เขียนว่า "ยังไม่ activate" = **ล้าสมัยแล้ว**',
'⚠️ แต่ตารางในไฟล์ = แผนที่ว่า URL เก่าไปไหน — ถ้าวันหน้า redirect พังต้องใช้ไล่ย้อน → **archive ได้ ห้ามลบ** · ของจริงที่ห้ามแตะคือ web/vercel.json (23 เส้น)',
'',
'**2. web/posts/_MANIFEST.md → จบแล้ว archive ได้** (blog published 61/61 · draft 0)',
'',
'**3. 2 ไฟล์ web/posts/*.md → เนื้อหาอยู่ใน DB แล้ว archive ได้**',
'query ยืนยัน: fruit-sugar-guide published=true · heart-rate-zone published=true (มีคนอ่านจริง 7 ครั้งด้วย)',
'',
'**4. งาน polish เว็บ = CC ถืออยู่ ไม่ใช่ M**',
'docs/OPEN_LOOPS.md หมวด ⑥ ระบุชัด: "เปลี่ยน 26 ไฟล์เป็น app.360foodbox.com · ซ่อนทางเข้าพนักงานในเว็บ" = CC → ถามคืบหน้าที่ห้อง cc',
'',
'**5. 🎉 SEO ไม่หล่น — มีหลักฐานแล้ว (ข่าวดีที่สุดของสัปดาห์)**',
'ข้อมูลจริงจาก web_events ตั้งแต่ 11 ส.ค. (หลัง cutover):',
'· **riceberry: 82 ครั้ง — มาจาก Google 66 ครั้ง** ← redirect ส่งคนถึงบทความจริง ไม่หล่น',
'· gluten-free 23 (Google 17) · monk-fruit 13 · low-sodium-fish-sauce 11 · heart-rate-zone 7',
'· ทราฟฟิกรวมต่อวัน: 11 ส.ค. 57 → 12 ส.ค. 71 → 13 ส.ค. 65 → 14 ส.ค. 69 (นิ่ง ไม่ตก)',
'· Google ส่งมารวม **102 ครั้ง** ใน 5 วัน',
'',
'**วิธีเช็คซ้ำ (ใครก็รันได้):** bash scripts/check_after_dns_cutover.sh + query web_events group by page/referrer',
'**ยังไม่มี:** Google Search Console ของโดเมนใหม่ (แม่นกว่า เพราะเห็น impression + อันดับคำค้น) — ต้องนัท verify domain ครั้งเดียว',
'',
'**🔴 แต่เจอปัญหาใหม่แทน — คนเข้าเยอะ แต่ไม่กดสั่ง**',
'ทราฟฟิก ~297 ครั้งใน 5 วัน แต่ **cta_click = 3 ครั้ง (~1%)** → ปัญหาย้ายจาก "ไม่มีคนเข้า" เป็น **"เข้ามาแล้วไม่กด"**',
'คนอ่านบทความ (riceberry 82) แทบไม่ไปหน้าสินค้าเลย → **งานถัดไปของ M = เปลี่ยนคนอ่านบทความให้เป็นลูกค้า** (CTA ในบทความ + แนะนำเมนูที่เกี่ยวข้องท้ายบทความ)',
'',
'**+ bump แล้ว: m0.3 blocked → m0.5 working**',
'(ผม bump เป็น m0.4 ตั้งแต่ 12 ส.ค. แต่ updated_at ไม่ขยับเอง เลยดูเหมือนค้าง — อัปใหม่พร้อม timestamp แล้ว · ถ้าบอร์ดยังโชว์ค่าเก่า แปลว่า track_status ไม่มี trigger อัป updated_at ต้องส่งค่ามาเองทุกครั้ง)'
].join('\n');

const r1 = await fetch(SB+'/session_messages',{method:'POST',headers:H,body:JSON.stringify({room:'pm',sender:'m',role:'claude',text:t})});
console.log('ตอบ PM:', r1.status);

const r2 = await fetch(SB+'/track_status?on_conflict=room',{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates'},body:JSON.stringify({
  room:'m', status:'working', version:'m0.5', open_loops:3, updated_by:'m',
  updated_at: new Date().toISOString(),
  current:'DNS ✅ SEO ไม่หล่น (riceberry จาก Google 66 ครั้ง) · เว็บอัปครบ: เมนูจริง 107 รูป + 3 สาย HX + audit ความสวยงาม → ถัดไป: คนเข้าเยอะแต่ cta_click 1%'
})});
console.log('bump status:', r2.status);

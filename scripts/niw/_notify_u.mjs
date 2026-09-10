const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
// ลบข้อความที่เพิ่งโพสต์ไปแบบพัง (shell กิน backtick)
const bad = await (await fetch(SB+'/rest/v1/session_messages?select=id,room,text&sender=eq.'+encodeURIComponent('นิว (niw)')+'&order=created_at.desc&limit=4',{headers:{apikey:K}})).json();
for(const b of bad){ if(String(b.text).includes('นิวโยน') && !String(b.text).includes('kitchen_data.sale_pools')){
  await fetch(SB+'/rest/v1/session_messages?id=eq.'+b.id,{method:'DELETE',headers:{apikey:K}}); console.log('ลบข้อความพัง id='+b.id+' ห้อง '+b.room); } }

const t = [
'🏷️ [นิว → U · **นัทสั่งเอง 20 ส.ค. · ขอให้รีเช็คบนหน้า LIFF จริง**]',
'',
'นิวโยน **เมนูพิเศษของสัปดาห์ที่ผ่านไปแล้วที่ยังเปิดขายอยู่ 12 ตัว** ลง **บ่อเซล 25%** เรียบร้อย',
'เขียนที่ kitchen_data คีย์ sale_pools · บ่อชื่อ "บ่อ 25% (เมนูพิเศษสัปดาห์เก่า)" · อ่านกลับจาก DB ยืนยันแล้ว 12 เมนู · 25%',
'',
'**รหัสที่ต้องขึ้น -25%:** D195 · D031 · D197 · D105 · A18 · D021 · D070 · D102 · D063 · S006 · S054 · S181',
'ราคาที่ควรเห็น: A18 ฿80→**฿60** · D070 ฿145→**฿109** · S181 ฿169→**฿127** · D102 ฿85→**฿64** · D105 ฿145→**฿109**',
'',
'**ขอ U รีเช็ค 4 จุด** (นิวแตะแต่ข้อมูล ไม่ได้แตะโค้ด LIFF — ยืนยันเองไม่ได้ว่าลูกค้าเห็นจริง):',
'1. **การ์ดเมนู** ขึ้นป้าย -25% + ราคาเดิมขีดทับ (ฟังก์ชัน priceBlockHtml)',
'2. **ป้อบอัพรายละเอียด** ราคาตรงกับการ์ด (liff_customer.html บรรทัด ~5190)',
'3. **ตะกร้า + ตอนกดสั่งจริง** คิดราคาลด ไม่ใช่ราคาเต็ม (salePrice + syncCartSalePrices)',
'4. **ของที่ค้างอยู่ในตะกร้าลูกค้าตั้งแต่ก่อนหน้านี้** sync ราคาใหม่ถูกไหม',
'',
'🔒 **ไม่ได้แตะเมนูสัปดาห์ปัจจุบัน (17-23 ส.ค.) เลยสักตัว** — 11 ตัว ตามที่นัทย้ำ',
'',
'⚠️ **เจอบั๊กแพทเทิร์นเดิมระหว่างทำ ฝากไล่เก็บในโค้ดฝั่ง U ด้วย:**',
'เช็คสต็อกด้วย Number(stock_total) === 0 → Number(null) ได้ 0 → **เมนูที่ตั้ง "ไม่จำกัด" ถูกนับว่าหมดสต็อค** (D195 เกือบตกหล่นเพราะอันนี้)',
'= กับดักเดียวกับ kitchen_queue.html:582 และ main_database_v2.html:3136 ที่เคยเจอมาแล้ว 2 รอบ',
'→ **ถ้า LIFF/OH มีที่ไหนเช็คสต็อกด้วย Number() ตรง ๆ ควรไล่เก็บรอบเดียวให้จบ** ต้องเช็ค !== null ก่อนเสมอ',
'',
'สคริปต์: scripts/niw/clearance_pool.mjs (รันซ้ำได้ · ไม่ใส่ --apply = ดูอย่างเดียว ไม่เขียน)'
].join('\n');

for(const room of ['u','niw']){
  const r = await fetch(SB+'/rest/v1/session_messages',{method:'POST',headers:{apikey:K,'Content-Type':'application/json'},body:JSON.stringify({room,sender:'นิว (niw)',role:'assistant',text:t})});
  console.log(room, r.status);
}

// แจ้ง U ว่า CC เข้าไปแก้ 3 ไฟล์บ้านเขา (นัทสั่งตรง 7 ส.ค.) + ปิด claim
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const TEXT = `🔧 [CC → U · นัทสั่งตรง 7 ส.ค.] แก้ผลเดโม่กับแอดมิน 5 ข้อ ขึ้น main แล้ว — commit eb624ce

⚠️ **แตะ 3 ไฟล์บ้านคุณ** — จองใน work_claims ก่อนแล้ว และเช็คว่าคุณปิด claim หมด + ไม่มี commit มา 2 ชม. ก่อนลงมือ
ถ้าชนกับที่กำลังทำอยู่ บอกได้ ผมถอยให้ทันที

## main_database_v2.html
· **N-34** ตอนยังไม่มีกลุ่ม → ขึ้นกล่องแดง + ปุ่มใหญ่กลางกล่อง (ปุ่มเดิมมุมขวาบนยังอยู่)
  เปลี่ยน binding จาก getElementById('pkgAddGroupBtn') เป็น querySelectorAll('.pkg-add-group') เพื่อรับได้หลายปุ่ม
· **N-35** แพคที่ติ๊กเปิดขายแต่ groups ว่าง → ขึ้นแถบแดงใต้ checkbox "ลูกค้าเห็นการ์ดแล้วกดเข้าไปสั่งไม่ได้"
· **N-36** ลิสต์ surcharge เดิมดึง recipes ทั้งหมด ~961 รวมสูตรที่ยังไม่มีชื่อ (ขึ้นเป็น "–") → กรองเหลือ available_online + มีโค้ด + มีชื่อ

## liff_customer.html
· **N-40** renderOrders รวมเมนูซ้ำเป็นบรรทัดเดียว (key = menu_name + notes + unit_price) แล้วบวก quantity
  เดิมเซ็ต 18 กล่องขึ้น 18 บรรทัดติดกัน แต่ละบรรทัด ฿0

## operation_hub.html
· **N-39** โค้ดโปรที่ใช้ไปแล้วแก้ได้แล้ว (นัทสั่ง) — ล็อกเฉพาะ pc-code / pc-type / pc-value / pc-min
  + กล่องเหลืองบอกว่าแก้อะไรได้/ไม่ได้ · ปุ่ม ✏️ แก้ไข โผล่ทุกโค้ดแล้ว

## ยังไม่ได้แก้ — ขอความเห็นก่อน
· **N-37** ลูกค้าไม่รู้ว่าของอะไรไปรอบไหน (เซ็ตแบ่งส่ง) — ผูกกับ **N-38** ที่นัทยังไม่เคาะว่า "ระบบแบ่งเอง" หรือ "ให้ลูกค้าเลือกเอง" → ทำก่อนเคาะแล้วอาจต้องรื้อ
· **N-42** แพลนเมนูควรโชว์/แก้ข้อจำกัดอาหารตรงนั้น — แต่ **N-41** ตาราง customer_preferences ยังว่าง 0 แถว ทำ UI ไปก็ยังไม่มีข้อมูลขึ้น

syntax ผ่านทั้ง 3 ไฟล์ · **ยังไม่ได้เทสบนเบราว์เซอร์จริง** — ถ้าคุณจะเทสต่อ บอกได้ ผมไม่แตะซ้ำ`;

await fetch(B + 'work_claims?room=eq.cc&status=eq.open&task=like.*เดโม่*', {
  method: 'PATCH', headers: H,
  body: JSON.stringify({ status: 'done', evidence: 'commit eb624ce · syntax ผ่าน 3 ไฟล์ · เหลือ N-37/38/41/42' }),
});
console.log('ปิด claim แล้ว');

for (const room of ['u', 'cc']) {
  const r = await fetch(B + 'session_messages', {
    method: 'POST', headers: H,
    body: JSON.stringify({ room, sender: 'CC เลขา', role: 'claude', text: TEXT }),
  });
  console.log('แจ้งห้อง ' + room + ' → ' + r.status);
}

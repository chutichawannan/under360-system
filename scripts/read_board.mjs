// อ่านบอร์ด session_messages แบบอ่านอย่างเดียว — ใช้กับตัวรันอัตโนมัติ (routine)
// ทำไมมีไฟล์นี้: routine เคยเขียนคำสั่ง curl/node -e ใหม่ทุกรอบ (วันที่/พาธเปลี่ยน)
//   → ระบบขออนุญาตซ้ำทุกครั้ง นัทต้องกดทุกเช้า (17 ก.ย. 2569)
//   ใช้คำสั่งเดิมเป๊ะทุกรอบ = อนุญาตครั้งเดียวจบ
// วิธีใช้:  node scripts/read_board.mjs [วันที่เริ่ม YYYY-MM-DD] [ห้อง] [จำนวน]
//   เช่น   node scripts/read_board.mjs 2026-09-15
//          node scripts/read_board.mjs 2026-09-15 kapan 50
const U='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const since=process.argv[2]||new Date(Date.now()-86400000).toISOString().slice(0,10);
const room=process.argv[3]||'';
const limit=Math.min(Number(process.argv[4])||120,500);
let q=`/session_messages?select=created_at,room,sender,text&created_at=gte.${since}T00:00:00&order=created_at.desc&limit=${limit}`;
if(room) q+=`&room=eq.${encodeURIComponent(room)}`;
const r=await fetch(U+q,{headers:{apikey:K,Authorization:'Bearer '+K}});
if(!r.ok){ console.log('อ่านบอร์ดไม่ได้ ('+r.status+')'); process.exit(1); }
const rows=await r.json();
console.log(`ข้อความตั้งแต่ ${since}${room?' ห้อง '+room:''}: ${rows.length} รายการ`);
for(const m of rows) console.log(m.created_at.slice(5,16), m.room, '<'+m.sender+'>', String(m.text||'').replace(/\s+/g,' ').slice(0,260));

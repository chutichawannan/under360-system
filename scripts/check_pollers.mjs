// เช็คว่าห้องไหนมีตัวเฝ้า (poller) ตื่นอยู่ — อ่านอย่างเดียว ใช้กับ routine poller-watchdog
// คำสั่งเดิมทุกรอบ = อนุญาตครั้งเดียวจบ (17 ก.ย. 2569)
const U='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const r=await fetch(U+'/live_presence?sid=like.poller:*&select=sid,last_seen&order=last_seen.desc&limit=60',{headers:{apikey:K,Authorization:'Bearer '+K}});
if(!r.ok){ console.log('อ่านไม่ได้ ('+r.status+')'); process.exit(1); }
const now=Date.now();
for(const x of await r.json()) console.log(String(x.sid).replace('poller:',''), Math.round((now-new Date(x.last_seen))/60000)+' นาทีที่แล้ว');

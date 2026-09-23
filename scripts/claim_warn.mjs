/* เตือนตอน push: ไฟล์ที่กำลังจะขึ้น main มีห้องอื่นจองไว้ไหม (เรียกจาก .githooks/pre-push)
   เงียบเสมอถ้าไม่มีอะไรชน · ต่อเน็ตไม่ได้ = เงียบ ไม่ขวางงาน */
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';

let buf='';
process.stdin.on('data', d => buf += d);
process.stdin.on('end', async () => {
  const files=[...new Set(buf.split('\n').map(x=>x.trim()).filter(Boolean))];
  if(!files.length) return;
  try{
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),4000);   // ช้าก็ไม่รอ
    const r=await fetch(B+'work_claims?status=eq.active&select=room,task,files&limit=200',
      { headers:{apikey:K,Authorization:'Bearer '+K}, signal:ctrl.signal });
    clearTimeout(t);
    const rows=await r.json(); if(!Array.isArray(rows)) return;
    const hit=[];
    rows.forEach(c=>files.forEach(f=>{ if(String(c.files||'').includes(f)) hit.push({f,c}); }));
    if(!hit.length) return;
    console.log('');
    console.log('🔒 ไฟล์ที่กำลังจะขึ้น main มีห้องอื่นจองไว้อยู่:');
    hit.forEach(({f,c})=>console.log('   · '+f+'  ← '+c.room+' : '+String(c.task||'').slice(0,60)));
    console.log('   ถ้าไม่ได้คุยกับห้องนั้น ให้หยุดก่อน — ของทับกันไม่มีเสียงเตือนตอนมันหาย');
    console.log('   (ปิดข้อความนี้ด้วย SKIPCLAIM=1)');
    console.log('');
  }catch(e){ /* เน็ตไม่ได้ = เงียบ */ }
});
// เฝ้ากล่องจดหมาย PM + ปรับความถี่ตามโหมด (fast 5 วิ · normal 10 วิ · quiet 60 วิ)
import fs from 'fs';
const U='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K};
const SENDER=encodeURIComponent('นัท (สั่งผ่านไลน์)');
const F='pm_inbox_last.txt';
const EVERY={fast:5000,normal:10000,quiet:60000};
let last = fs.existsSync(F) ? fs.readFileSync(F,'utf8').trim() : new Date().toISOString();
let mode='normal';
for(;;){
  try{
    const [inb,md] = await Promise.all([
      fetch(`${U}/session_messages?room=eq.pm&sender=eq.${SENDER}&created_at=gt.${encodeURIComponent(last)}&select=created_at,text&order=created_at.asc&limit=10`,{headers:H}).then(r=>r.json()),
      fetch(`${U}/session_messages?room=eq.kapan&sender=eq.mode&select=text&order=created_at.desc&limit=1`,{headers:H}).then(r=>r.json()),
    ]);
    if(Array.isArray(md)&&md.length&&EVERY[md[0].text]&&md[0].text!==mode){
      mode=md[0].text; console.log('⚙️ กะปันเปลี่ยนเป็นโหมด: '+mode+' (เช็คทุก '+(EVERY[mode]/1000)+' วิ)');
    }
    if(Array.isArray(inb)&&inb.length){
      for(const m of inb){ console.log('📲 นัทสั่งงานผ่านไลน์: ' + String(m.text).replace(/\s+/g,' ')); last=m.created_at; }
      fs.writeFileSync(F,last);
    }
  }catch(e){}
  await new Promise(r=>setTimeout(r,EVERY[mode]));
}

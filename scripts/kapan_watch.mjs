// เฝ้ากล่องจดหมายของห้องกะปัน + ปรับความถี่ตามโหมด (เร่ง 5 วิ · ปกติ 10 วิ · เงียบ 60 วิ)
//  รันค้างไว้ในเทอร์มินัลของ "ห้องกะปัน" (โมเดลเล็ก) — ไม่ใช่ห้องเลขา
//  ⚠️ เดิมตัวนี้เฝ้า room=pm (ห้องเลขา) ทั้งที่ webhook ก็ส่งเข้า pm = ห้องกะปันไม่เคยได้งานเลย
//     แก้พร้อมกับ HOME_ROOM ใน api/line-webhook.mjs (12 ส.ค. · นัทเคาะเอง)
import fs from 'fs';
const U='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K};
const ROOM='kapan';                                        // ต้องตรงกับ HOME_ROOM ใน api/line-webhook.mjs
const SENDER=encodeURIComponent('นัท (สั่งผ่านไลน์)');
const F='kapan_inbox_last.txt';
// ต้องตรงกับ PERSONAS ใน api/line-webhook.mjs — แก้ที่ไหนแก้ให้ครบทั้งสองที่
const EVERY={fast:5000,normal:10000,quiet:60000};
const LABEL={fast:'เร่ง (สั้นห้วน)',normal:'ปกติ (โทน C+)',quiet:'เงียบ (เตือนเฉพาะเรื่องเงิน/แท็กตรง)'};
let last = fs.existsSync(F) ? fs.readFileSync(F,'utf8').trim() : new Date().toISOString();
let mode='normal';
console.log('👂 เฝ้ากล่องจดหมายห้อง '+ROOM+' — เริ่มนับจาก '+last);
for(;;){
  try{
    const [inb,md] = await Promise.all([
      fetch(`${U}/session_messages?room=eq.${ROOM}&sender=eq.${SENDER}&created_at=gt.${encodeURIComponent(last)}&select=created_at,text&order=created_at.asc&limit=10`,{headers:H}).then(r=>r.json()),
      fetch(`${U}/session_messages?room=eq.${ROOM}&sender=eq.mode&select=text&order=created_at.desc&limit=1`,{headers:H}).then(r=>r.json()),
    ]);
    if(Array.isArray(md)&&md.length&&EVERY[md[0].text]&&md[0].text!==mode){
      mode=md[0].text; console.log('⚙️ กะปันเปลี่ยนเป็นโหมด '+(LABEL[mode]||mode)+' — เช็คทุก '+(EVERY[mode]/1000)+' วิ');
    }
    if(Array.isArray(inb)&&inb.length){
      for(const m of inb){ console.log('📲 นัทสั่งงานผ่านไลน์: ' + String(m.text).replace(/\s+/g,' ')); last=m.created_at; }
      fs.writeFileSync(F,last);
    }
  }catch(e){}
  await new Promise(r=>setTimeout(r,EVERY[mode]));
}

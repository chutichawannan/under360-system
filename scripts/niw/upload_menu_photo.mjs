/**
 * เปลี่ยนรูปเมนู — วางไฟล์ชื่อ "รหัสเมนู.jpg" ลงโฟลเดอร์ Desktop\รูปใส่เมนู แล้วรันตัวนี้
 * เช่น  D195.jpg → เปลี่ยนรูป D195 · S181.png → เปลี่ยนรูป S181
 * รัน: node scripts/niw/upload_menu_photo.mjs
 * อัปเข้า Storage bucket menu-images แล้วเซ็ต menu_items.image_urls[0] = URL ใหม่
 */
import { readdirSync, readFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const DIR = 'C:\Users\PP\Desktop\รูปใส่เมนู';
const DONE = join(DIR,'เสร็จแล้ว');

if(!existsSync(DIR)){ console.log('❌ ไม่มีโฟลเดอร์ '+DIR); process.exit(1); }
if(!existsSync(DONE)) mkdirSync(DONE,{recursive:true});

const files = readdirSync(DIR).filter(f=>/\.(jpe?g|png|webp)$/i.test(f));
if(!files.length){ console.log('📂 ยังไม่มีรูปในโฟลเดอร์ '+DIR+'\n   วางไฟล์ชื่อ "รหัสเมนู.jpg" (เช่น D195.jpg) แล้วรันใหม่'); process.exit(0); }

for(const f of files){
  const code = f.replace(/\.[^.]+$/,'').trim().toUpperCase();
  const buf = readFileSync(join(DIR,f));
  const ext = /\.png$/i.test(f)?'png' : /\.webp$/i.test(f)?'webp' : 'jpg';
  const mime = ext==='png'?'image/png' : ext==='webp'?'image/webp' : 'image/jpeg';

  // 1) เมนูนี้มีจริงไหม — ห้ามอัปมั่ว
  const m = await (await fetch(`${SB}/rest/v1/menu_items?select=code,name,image_urls&code=eq.${code}`,{headers:{apikey:KEY}})).json();
  if(!m.length){ console.log('⚠️  ข้าม '+f+' — ไม่มีรหัส '+code+' ใน DB'); continue; }

  // 2) อัปเข้า Storage (upsert ทับของเดิม)
  // ⚠️ ห้ามใส่ ?v= ใน URL — thumbUrl() ใน LIFF ต่อ "?width=" ท้ายดื้อๆ จะได้ "?v=1?width=400" = รูปพังทั้งหน้า
  //    ใช้เลขเวอร์ชันใน "ชื่อไฟล์" แทน → URL สะอาด ไม่มี query และ cache เก่าไม่ค้าง
  const path = `${code}_v${Date.now()}.${ext}`;
  const up = await fetch(`${SB}/storage/v1/object/menu-images/${path}`,{
    method:'POST', headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':mime,'x-upsert':'true'}, body:buf});
  if(!up.ok){ console.log('❌ อัปไม่ผ่าน '+code+' — '+up.status+' '+(await up.text()).slice(0,150)); continue; }

  // 3) ชี้ image_urls[0] ไปรูปใหม่ + ?v= กัน cache ค้าง (ลูกค้าเคยเห็นรูปเก่าเบราว์เซอร์จะไม่โหลดใหม่)
  const url = `${SB}/storage/v1/object/public/menu-images/${path}`;
  const old = Array.isArray(m[0].image_urls)?m[0].image_urls:[];
  const rmOld = new RegExp('/' + code + '(_v[0-9]+)?[.]');
  const next = [url, ...old.filter(u=>!rmOld.test(String(u)))].slice(0,4);
  const pa = await fetch(`${SB}/rest/v1/menu_items?code=eq.${code}`,{
    method:'PATCH', headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'return=representation'},
    body:JSON.stringify({image_urls: next})});
  const res = await pa.json();
  if(!pa.ok || !res.length){ console.log('❌ เซ็ต image_urls ไม่ผ่าน '+code); continue; }

  console.log('✅ '+code+'  '+m[0].name+'\n   '+url);
  renameSync(join(DIR,f), join(DONE,f));
}
console.log('\n(ไฟล์ที่ทำเสร็จย้ายไปโฟลเดอร์ "เสร็จแล้ว" · ถ้าต้องแก้ซ้ำ ลากกลับออกมา)');

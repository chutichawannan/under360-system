// ============================================================
//  🚀 go-live เมนูสัปดาห์ 7-13 ก.ย. 2026 — กดครั้งเดียวจบ 4 ขั้น
//  ------------------------------------------------------------
//  ⛔ ห้ามรันจนกว่านัท/05 จะส่งสัญญาณ — ตัวนี้เปิดขายจริงให้ลูกค้าเห็นทันที
//  ดูว่าจะทำอะไรโดยไม่แตะของจริง:  node scripts/niw/go_live_0907.mjs --dry
//
//  ทำ 4 อย่างในจังหวะเดียว (ลำดับสำคัญ — ตั้งของให้พร้อมก่อนค่อยเปิด):
//    ① ถอดชื่อเล่น S1-S8/D1-D5 ของชุดเก่า   (กันชื่อเล่นซ้ำ 2 ชุด)
//    ② ยกชื่อเล่นให้ชุดใหม่จาก weekly_subcode_plan
//    ③ ตั้ง stock_total + stock_incoming เท่ากัน (ครัวเห็นว่าต้องทำเท่าไหร่)
//    ④ เปิด is_available เป็นขั้นสุดท้าย
// ============================================================
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const WEEK='2026-09-07';
const DRY=process.argv.includes('--dry');
const STOCK={S1:9,S2:6,S3:7,S4:9,S5:9,S6:11,S7:10,S8:9,D1:4,D2:4,D3:6,D4:4,D5:5};  // 05 คำนวณจากสถิติรายช่อง 30 สัปดาห์

async function main(){
const plan=(await(await fetch(`${SB}/rest/v1/kitchen_data?key=eq.weekly_subcode_plan&select=data`,{headers:H})).json())[0]?.data?.[WEEK];
if(!plan){console.error('ไม่มีแผน subcode ของสัปดาห์นี้ — หยุด');process.exitCode=1;return;}
const codes=Object.values(plan);
if(codes.length!==13){console.error('แผนมี '+codes.length+' ช่อง ไม่ใช่ 13 — หยุด');process.exitCode=1;return;}

/* ด่านตรวจซ้ำก่อนเปิดจริง — เอกสารบอกว่าผ่านไม่พอ ต้องผ่านตอนนี้ */
const v=await(await fetch(`${SB}/rest/v1/menu_items?select=code,name,category,price,kcal,protein,image_urls,available_from&code=in.(${codes.join(',')})`,{headers:H})).json();
const bad=[];
for(const m of v){
  if(m.available_from!==WEEK)bad.push(m.code+' วันที่ผิด');
  if(!(Array.isArray(m.image_urls)&&m.image_urls.length))bad.push(m.code+' ไม่มีรูป');
  if(!(Number(m.kcal)>0&&Number(m.protein)>0))bad.push(m.code+' โภชนาการขาด');
  if(m.code[0]==='S'&&(m.category!=='no_special'||Number(m.price)<125))bad.push(m.code+' หมวด/ราคา');
  if(m.code[0]==='D'&&(m.category!=='pack_regular'||Number(m.price)<80))bad.push(m.code+' หมวด/ราคา');
}
if(bad.length){console.error('🔴 ไม่ผ่านด่านตรวจ ไม่เปิด:\n  '+bad.join('\n  '));process.exitCode=1;return;}
console.log('✅ ด่านตรวจผ่าน 13/13');

/* ① ถอดชื่อเล่นชุดเก่า — ทุกตัวที่ถือ S1-S8/D1-D5 อยู่ แต่ไม่ใช่ชุดใหม่ */
const old=await(await fetch(`${SB}/rest/v1/menu_items?select=code,subcode&subcode=not.is.null`,{headers:H})).json();
const strip=old.filter(m=>/^[SD]([1-8])$/.test(String(m.subcode).trim().toUpperCase())&&!codes.includes(m.code));
console.log('① ถอดชื่อเล่นชุดเก่า '+strip.length+' ตัว: '+strip.map(m=>m.subcode+'='+m.code).join(' '));
/* ② ③ ④ */
console.log('② ยกชื่อเล่นให้ชุดใหม่ · ③ ตั้งสต็อค · ④ เปิดขาย');
for(const [slot,code] of Object.entries(plan))
  console.log(`   ${slot.padEnd(4)}${code.padEnd(6)} สต็อค ${STOCK[slot]}`);
if(DRY){console.log('\n[dry] ไม่ได้เขียนอะไรเลย');return;}

for(const m of strip){
  const r=await fetch(`${SB}/rest/v1/menu_items?code=eq.${m.code}`,{method:'PATCH',headers:H,body:JSON.stringify({subcode:null})});
  if(!r.ok)console.error('ถอดชื่อเล่นไม่สำเร็จ',m.code,r.status);
}
const inc=(await(await fetch(`${SB}/rest/v1/kitchen_data?key=eq.stock_incoming&select=data`,{headers:H})).json())[0]?.data||{};
const ids=await(await fetch(`${SB}/rest/v1/menu_items?select=id,code&code=in.(${codes.join(',')})`,{headers:H})).json();
const idOf={};for(const x of ids)idOf[x.code]=x.id;
const at=new Date().toISOString();
for(const [slot,code] of Object.entries(plan)){
  const n=STOCK[slot];
  const r=await fetch(`${SB}/rest/v1/menu_items?code=eq.${code}`,{method:'PATCH',headers:H,
    body:JSON.stringify({subcode:slot,stock_total:n,is_available:true})});
  if(!r.ok){console.error('🔴 เปิดไม่สำเร็จ',code,r.status,await r.text());continue;}
  inc[idOf[code]]={n,by:'น้องนิว (สั่งผลิตสัปดาห์ใหม่)',at,code};
}
await fetch(`${SB}/rest/v1/kitchen_data?on_conflict=key`,{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates'},
  body:JSON.stringify({key:'stock_incoming',data:inc})});
/* ตรวจย้อนด้วยตา */
const f=await(await fetch(`${SB}/rest/v1/menu_items?select=code,subcode,is_available,stock_total,name&code=in.(${codes.join(',')})`,{headers:H})).json();
const rank=s=>(String(s)[0]==='S'?0:100)+ +String(s).slice(1);
console.log('\n=== ผลจริงหลังเปิด ===');
for(const x of f.sort((a,b)=>rank(a.subcode)-rank(b.subcode)))
  console.log(` ${String(x.subcode).padEnd(4)}${x.code.padEnd(6)}${x.is_available?'เปิด ✅':'🔴ปิด'} สต็อค ${String(x.stock_total).padEnd(4)}${x.name.slice(0,30)}`);
const dup=await(await fetch(`${SB}/rest/v1/menu_items?select=code,subcode&subcode=not.is.null`,{headers:H})).json();
const seen={},dups=[];
for(const m of dup){const s=String(m.subcode).trim().toUpperCase();if(!/^[SD][1-8]$/.test(s))continue;
  if(seen[s])dups.push(s+': '+seen[s]+' + '+m.code);seen[s]=m.code;}
console.log(dups.length?('🔴 ชื่อเล่นซ้ำ: '+dups.join(' · ')):'✅ ไม่มีชื่อเล่นซ้ำ');
}
await main();

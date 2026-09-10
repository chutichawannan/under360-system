/**
 * 🚀 เปิดเมนูสัปดาห์ใหม่ + สลับชื่อเล่น S1-S8 / D1-D5 — ทำครั้งเดียวจบ
 *
 * นัทเคาะเอง 29 ส.ค. 2026: **ห้ามทำเป็นรอบประจำทุกสัปดาห์**
 *   เพราะบางสัปดาห์เปลี่ยนเมนูไม่ทัน · บางครั้งต้องรอครัวหรือมาเก็ตติ้งคอนเฟิร์มก่อน
 *   → ตั้งเวลาใหม่ทุกครั้งที่เคาะแล้ว (one-shot) แล้วมันลบตัวเองทิ้ง
 *
 * แผนอ่านจาก kitchen_data.weekly_subcode_plan = { "2026-09-07": { "S1":"S123", ... } }
 *
 * รัน: node scripts/niw/go_live_week.mjs 2026-09-07           ← ดูอย่างเดียว
 *      node scripts/niw/go_live_week.mjs 2026-09-07 --apply   ← ทำจริง
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const WEEK=process.argv[2], APPLY=process.argv.includes('--apply');
const stamp=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
const die=m=>{console.log('['+stamp()+'] ❌ '+m);process.exit(1);};
if(!/^\d{4}-\d{2}-\d{2}$/.test(String(WEEK))) die('ใส่วันจันทร์ของสัปดาห์ เช่น 2026-09-07');
const g=async u=>(await fetch(SB+u,{headers:{apikey:KEY}})).json();
const P=async(code,body)=>{const r=await fetch(`${SB}/rest/v1/menu_items?code=eq.${code}`,{method:'PATCH',
  headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(body)});
  const j=await r.json();return r.ok&&j.length;};

console.log('['+stamp()+'] เปิดสัปดาห์ '+WEEK+(APPLY?'':'  (ดูอย่างเดียว)'));
const plan=(((await g('/rest/v1/kitchen_data?select=data&key=eq.weekly_subcode_plan'))[0]||{}).data||{})[WEEK];
if(!plan||Object.keys(plan).length===0) die('ไม่มีแผนชื่อเล่นของสัปดาห์นี้ — ยังไม่พร้อม ไม่เปิด');

const codes=Object.values(plan);
const rows=await g(`/rest/v1/menu_items?select=code,name,price,category,kcal,protein,carb,fat,image_urls&code=in.(${codes.join(',')})`);
const by=new Map(rows.map(m=>[m.code,m]));
const OKCAT={S:'no_special',D:'pack_regular'};

// ── ตรวจความพร้อมก่อน ห้ามเปิดชุดที่ยังไม่ครบ ──
const bad=[];
for(const [slot,code] of Object.entries(plan)){
  const m=by.get(code);
  if(!m){bad.push(slot+' '+code+' ไม่มีรหัสนี้');continue;}
  const miss=[];
  if(m.category!==OKCAT[code[0]]) miss.push('หมวด='+m.category);
  if(!(m.image_urls||[]).length) miss.push('ไม่มีรูป');
  if([m.kcal,m.protein,m.carb,m.fat].some(v=>v==null)) miss.push('โภชนาการไม่ครบ');
  const floor=code[0]==='S'?125:80;
  if(Number(m.price)<floor) miss.push('ราคา '+m.price+' ต่ำกว่า '+floor);
  if(miss.length) bad.push(slot+' '+code+' — '+miss.join(', '));
}
if(bad.length){ bad.forEach(b=>console.log('   🔴 '+b)); die('ชุดยังไม่พร้อม '+bad.length+' ตัว — ไม่เปิด'); }
console.log('   ✅ ตรวจก่อนเปิดผ่าน '+codes.length+' ตัว');

// ── ① ถอดชื่อเล่นเมนูเก่า แล้วยกให้ชุดใหม่ ──
const held=await g('/rest/v1/menu_items?select=code,name,subcode&subcode=not.is.null');
const incoming=new Set(codes);
for(const m of held.filter(x=>!incoming.has(x.code)))
  console.log((APPLY?(await P(m.code,{subcode:null})?'   ✅ ':'   ❌ '):'   · ')+'ถอด '+String(m.subcode).padEnd(4)+m.code+'  '+String(m.name).slice(0,28));
for(const slot of Object.keys(plan).sort())
  console.log((APPLY?(await P(plan[slot],{subcode:slot})?'   ✅ ':'   ❌ '):'   · ')+'ตั้ง '+slot.padEnd(4)+plan[slot]+'  '+String((by.get(plan[slot])||{}).name).slice(0,28));

// ── ② เปิดขาย ──
for(const code of codes)
  if(APPLY && !await P(code,{is_available:true})) console.log('   ❌ เปิดไม่ผ่าน '+code);

// ── ③ ตรวจซ้ำจาก DB จริง ──
if(APPLY){
  const back=await g(`/rest/v1/menu_items?select=code,subcode,is_available&code=in.(${codes.join(',')})`);
  const open=back.filter(m=>m.is_available).length;
  const all=await g('/rest/v1/menu_items?select=code,subcode&subcode=not.is.null');
  const d={}; all.forEach(m=>{(d[m.subcode]=d[m.subcode]||[]).push(m.code);});
  const dup=Object.entries(d).filter(([,a])=>a.length>1);
  console.log('['+stamp()+'] เปิดขาย '+open+'/'+codes.length+' · ชื่อเล่นซ้ำ '+(dup.length?('🔴 '+dup.map(([s,a])=>s+'='+a.join('/')).join(' ')):'0 ✅'));
  if(open!==codes.length||dup.length) process.exit(2);
  console.log('['+stamp()+'] ✅ เสร็จสมบูรณ์ — ยังต้องเปิดหน้าลูกค้าดูด้วยตาอีกชั้น');
}

/**
 * 🔄 สลับชื่อเล่นสัปดาห์ (S1-S8 / D1-D5) จากชุดเก่าไปชุดใหม่
 * นัทย้ำ 27 ส.ค.: "หลังจากเมนูใหม่ออน เมนูเก่าต้องเอาชื่อเล่นออกนะ"
 * แผนอ่านจาก kitchen_data คีย์ `weekly_subcode_plan`
 * รัน: node scripts/niw/week_rollover.mjs 2026-08-31 [--apply]
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const WEEK=process.argv[2], APPLY=process.argv.includes('--apply');
if(!/^\d{4}-\d{2}-\d{2}$/.test(String(WEEK))){ console.log('ใส่วันจันทร์ เช่น 2026-08-31'); process.exit(1); }
const g=async u=>(await fetch(SB+u,{headers:{apikey:KEY}})).json();
const P=async(code,body)=>{const r=await fetch(`${SB}/rest/v1/menu_items?code=eq.${code}`,{method:'PATCH',
  headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(body)});
  const j=await r.json(); return r.ok&&j.length;};
const planAll=((await g('/rest/v1/kitchen_data?select=data&key=eq.weekly_subcode_plan'))[0]||{}).data||{};
const plan=planAll[WEEK];
if(!plan){ console.log('❌ ไม่มีแผนชื่อเล่นของสัปดาห์ '+WEEK+' — ยังสลับไม่ได้'); process.exit(1); }
const held=await g('/rest/v1/menu_items?select=code,name,subcode&subcode=not.is.null');
const incoming=new Set(Object.values(plan));
const outgoing=held.filter(m=>!incoming.has(m.code));
const names=new Map((await g(`/rest/v1/menu_items?select=code,name&code=in.(${[...incoming].join(',')})`)).map(m=>[m.code,m.name]));
console.log('สัปดาห์ใหม่ '+WEEK+(APPLY?'':'  (ดูอย่างเดียว)')+'  ·  เข้า '+incoming.size+' · ออก '+outgoing.length+'\n');
console.log('── ① ถอดชื่อเล่นเมนูเก่า ──');
for(const m of outgoing) console.log((APPLY?(await P(m.code,{subcode:null})?'  ✅ ':'  ❌ '):'  · ')+String(m.subcode).padEnd(4)+m.code.padEnd(6)+String(m.name).slice(0,32));
if(!outgoing.length) console.log('  (ไม่มี)');
console.log('\n── ② ชุดใหม่รับชื่อเล่น ──');
for(const slot of Object.keys(plan).sort()){const code=plan[slot];
  console.log((APPLY?(await P(code,{subcode:slot})?'  ✅ ':'  ❌ '):'  · ')+slot.padEnd(4)+code.padEnd(6)+String(names.get(code)||'❓').slice(0,32));}
if(APPLY){const back=await g('/rest/v1/menu_items?select=code,subcode&subcode=not.is.null');
  const d={}; back.forEach(m=>{(d[m.subcode]=d[m.subcode]||[]).push(m.code);});
  const bad=Object.entries(d).filter(([,a])=>a.length>1);
  console.log('\n🔁 ชื่อเล่นซ้ำหลังสลับ: '+(bad.length?'🔴 '+bad.map(([s,a])=>s+'='+a.join('/')).join(' · '):'ไม่มีแล้ว ✅'));}

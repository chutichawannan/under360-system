/**
 * ลงมือสลับเลข D ให้ไปอยู่ใต้ S ที่ถูก — โหมด A: **เฉพาะตัวที่ไม่กระทบสัปดาห์ปัจจุบัน**
 * นัทสั่ง 18 ส.ค.: "A ก่อน อย่าเพิ่งยุ่งกับที่ลูกค้าสั่ง"
 *
 * กันไว้ 3 ชั้น — ตัวไหนเข้าข่ายข้อใดข้อหนึ่ง = ไม่แตะ
 *   1. มี subcode (เป็น D1-D5 ของสัปดาห์นี้)
 *   2. อยู่ในตารางเมนูสัปดาห์ปัจจุบัน (menu_special_weeks = จันทร์สัปดาห์นี้)
 *   3. มีออเดอร์ที่ยังไม่ถึงวันส่ง
 *
 * แก้ 3 ที่พร้อมกัน (ถ้าแก้ไม่ครบ = พังเงียบ):
 *   · menu_items.code
 *   · kitchen_data.recipes        (สูตรผูกกับ code)
 *   · kitchen_data.menu_special_weeks (ประวัติว่าเมนูขึ้นสัปดาห์ไหน)
 *
 * รัน: node scripts/niw/sd_apply.mjs --dry   (ดูก่อน)
 *      node scripts/niw/sd_apply.mjs         (ลงมือจริง)
 */
import { NUT } from './sd_decisions.mjs';

const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:KEY,Authorization:'Bearer '+KEY,'content-type':'application/json',Prefer:'return=minimal'};
const DRY=process.argv.includes('--dry');
const SURE=0.62, MARGIN=0.10;

const core=s=>String(s||'').replace(/^(ข้าว|ช้าว)/,'').replace(/แบบกับข้าว/g,'').replace(/[+\s\-·]/g,'').toLowerCase();
function sim(a,b){a=core(a);b=core(b);if(!a||!b)return 0;const s=a.length<b.length?a:b,l=a.length<b.length?b:a;let h=0;for(let i=0;i<s.length-1;i++)if(l.includes(s.substr(i,2)))h++;return h/Math.max(1,s.length-1);}
function thisWeekBkk(){const n=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Bangkok'}));n.setHours(0,0,0,0);n.setDate(n.getDate()-((n.getDay()+6)%7));return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');}
const get=async p=>(await fetch(SB+'/rest/v1/'+p,{headers:{apikey:KEY}})).json();

async function all(){const o=[];for(let f=0;;f+=1000){const r=await fetch(SB+'/rest/v1/menu_items?select=code,name,is_available,subcode&order=code',{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();o.push(...d);if(d.length<1000)break;}return o;}

async function main(){
 const week=thisWeekBkk();
 const rows=await all();
 const S=rows.filter(x=>/^S\d+$/.test(x.code)), D=rows.filter(x=>/^D\d+$/.test(x.code));
 const sByNum=new Map(S.map(s=>[s.code.slice(1),s]));
 const kd=await get('kitchen_data?select=key,data&key=in.(recipes,menu_special_weeks)');
 const recipes=(kd.find(x=>x.key==='recipes')||{}).data||[];
 const weeks=(kd.find(x=>x.key==='menu_special_weeks')||{}).data||{};
 const live=await get('order_items?select=menu_code,orders!inner(delivery_date)&orders.delivery_date=gte.'+new Date().toISOString().slice(0,10));
 const liveCodes=new Set((Array.isArray(live)?live:[]).map(x=>x.menu_code));

 // สร้างแผน (ตรรกะเดียวกับ sd_replan)
 const plan=[];
 for(const d of D){
  const cur=d.code.slice(1), curHead=sByNum.get(cur);
  let head=null;
  if(Object.prototype.hasOwnProperty.call(NUT,d.code)){
   if(NUT[d.code]===null) continue;
   head=S.find(s=>s.code===NUT[d.code]);
  }
  if(!head){
   if(curHead&&sim(d.name,curHead.name)>=0.55) continue;
   const sc=S.map(s=>({s,v:sim(d.name,s.name)})).sort((a,b)=>b.v-a.v);
   if(!(sc[0]&&sc[0].v>=SURE&&(!sc[1]||sc[0].v-sc[1].v>=MARGIN))) continue;
   head=sc[0].s;
  }
  const to='D'+head.code.slice(1);
  if(to===d.code) continue;
  plan.push({d,from:d.code,to,head});
 }
 // ชนกัน
 const cnt={}; plan.forEach(p=>cnt[p.to]=(cnt[p.to]||0)+1);
 const moving=new Set(plan.map(p=>p.from)), byCode=new Map(D.map(x=>[x.code,x]));
 const ok=plan.filter(p=>{const occ=byCode.get(p.to);return cnt[p.to]===1&&(!occ||occ.code===p.from||moving.has(occ.code));});

 // 🔒 กันสัปดาห์ปัจจุบัน
 const skip=[], go=[];
 for(const p of ok){
  const why = p.d.subcode ? 'เป็น '+p.d.subcode+' ของสัปดาห์นี้'
    : weeks[p.from]===week ? 'อยู่ในเมนูสัปดาห์นี้'
    : liveCodes.has(p.from) ? 'มีออเดอร์ที่ยังไม่ถึงวันส่ง' : null;
  (why?skip:go).push(why?{...p,why}:p);
 }

 console.log('สัปดาห์ปัจจุบัน (ไทย) = '+week);
 console.log('แผนย้ายได้ '+ok.length+' → 🔒 กันไว้ '+skip.length+' · ▶ ลงมือ '+go.length+(DRY?'  [ทดลอง ไม่เขียนจริง]':'')+'\n');
 console.log('🔒 กันไว้ ไม่แตะ:');
 skip.forEach(p=>console.log('   '+p.from+' → '+p.to+'  '+String(p.d.name).slice(0,26).padEnd(28)+'('+p.why+')'));
 console.log('\n▶ จะย้าย:');
 go.forEach(p=>console.log('   '+p.from+' → '+p.to+'  '+String(p.d.name).slice(0,28).padEnd(30)+'หัว: '+p.head.code+' '+String(p.head.name).slice(0,24)));
 if(DRY){console.log('\n[ทดลอง] ยังไม่เขียนอะไร');return;}

 // ── ลงมือ: menu_items ──
 // ⚠️ ต้องเรียงลำดับ: ย้ายได้เฉพาะตัวที่ "ปลายทางว่างแล้วจริง" ณ ตอนนั้น
 //    เช่น D164→D037 ต้องรอ D037→D180 ออกไปก่อน ไม่งั้นชนกัน
 const occupied=new Set(D.map(x=>x.code));
 const pending=[...go]; let done=0, pass=0;
 while(pending.length && pass<20){
  pass++; let movedThisPass=0;
  for(let i=pending.length-1;i>=0;i--){
   const p=pending[i];
   if(occupied.has(p.to)) continue;                       // ปลายทางยังไม่ว่าง รอรอบหน้า
   const r=await fetch(SB+'/rest/v1/menu_items?code=eq.'+p.from,{method:'PATCH',headers:H,body:JSON.stringify({code:p.to})});
   if(r.ok){ occupied.delete(p.from); occupied.add(p.to); done++; movedThisPass++; pending.splice(i,1); }
   else { console.log('   ❌ '+p.from+' → '+p.to+' : '+r.status+' '+(await r.text()).slice(0,120)); pending.splice(i,1); }
  }
  if(!movedThisPass) break;                                // วนต่อไม่ขยับ = ติดวงกลม
 }
 if(pending.length) console.log('   ⚠️ ย้ายไม่ได้ '+pending.length+' ตัว (ปลายทางไม่ว่าง/วนกลับ): '+pending.map(x=>x.from+'→'+x.to).join(', '));
 console.log('\n✅ เปลี่ยนรหัสแล้ว '+done+'/'+go.length);

 // ── สูตร ──
 const movedOk=go.filter(p=>!pending.includes(p));
 const map=new Map(movedOk.map(p=>[p.from,p.to]));   // เฉพาะที่ย้ายสำเร็จจริง
 let rc=0;
 for(const r of recipes){ if(r.code&&map.has(r.code.trim())){ r.code=map.get(r.code.trim()); rc++; } }
 if(rc){ const r=await fetch(SB+'/rest/v1/kitchen_data?on_conflict=key',{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({key:'recipes',data:recipes,updated_at:new Date().toISOString()})});
   console.log((r.ok?'✅':'❌')+' อัปเดตสูตรตามรหัสใหม่ '+rc+' รายการ'); }
 else console.log('· ไม่มีสูตรที่ต้องแก้');

 // ── ตารางเมนูสัปดาห์ ──
 let wc=0;
 for(const [from,to] of map){ if(weeks[from]!==undefined){ weeks[to]=weeks[from]; delete weeks[from]; wc++; } }
 if(wc){ const r=await fetch(SB+'/rest/v1/kitchen_data?on_conflict=key',{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({key:'menu_special_weeks',data:weeks,updated_at:new Date().toISOString()})});
   console.log((r.ok?'✅':'❌')+' อัปเดตตารางเมนูสัปดาห์ '+wc+' รายการ'); }
 else console.log('· ไม่มีตารางสัปดาห์ที่ต้องแก้');

 // ── ตรวจซ้ำ ──
 const after=await get('menu_items?select=code&code=in.('+movedOk.map(p=>p.to).join(',')+')');
 console.log('\n── ตรวจซ้ำจาก DB จริง: เจอรหัสใหม่ '+after.length+'/'+go.length+' ตัว');
}
main().catch(e=>{console.error('❌',e.message);process.exit(1);});

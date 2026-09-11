/**
 * พิสูจน์ว่าตัวเปิดขาย "หยุดจริง" — ข้อมูลจำลองล้วน ไม่แตะ DB
 * รัน: node scripts/niw/test_go_live_stops.mjs   (exit 0 = ทุกเคสได้ผลตามคาด)
 */
import { SLOTS, fingerprint, readiness, gateCheck, confirmCheck } from './go_live_decide.mjs';
const WEEK='2099-01-05';
const code=(s,i)=>s[0]+String(900+i);
const mk=(s,i)=>({code:code(s,i),subcode:s,name:(s[0]==='S'?'ข้าวทดสอบ ':'ทดสอบ ')+s,price:s[0]==='S'?125:80,kcal:300,protein:30,carb:20,fat:5,
  image_urls:['https://x/'+code(s,i)+'.jpg'],category:s[0]==='S'?'no_special':'pack_regular',available_from:WEEK,stock_total:5});
function base(){const rows=SLOTS.map(mk);const plan={},stock={};SLOTS.forEach((s,i)=>{plan[s]=rows[i].code;stock[s]=5;});return {rows,plan,stock};}
const goodGate=b=>({at:new Date().toISOString(),pass:true,visual_ok:true,fails:[],fingerprint:fingerprint(b.rows),codes:Object.values(b.plan)});
function decide(x){ // ลำดับเดียวกับ go_live_week_stock.mjs ตอนจะเปิดขาย
  const r0=confirmCheck({args:x.args||['--open-for-real','--confirm',WEEK],week:WEEK});
  const r1=readiness({week:WEEK,plan:x.plan,stock:x.stock,rows:x.rows,requireLabels:true});
  const r2=gateCheck({gateRec:x.gate,fp:fingerprint(x.rows.filter(m=>m.available_from===WEEK)),planCodes:Object.values(x.plan)});
  return r0.concat(r1,r2);
}
const cases=[
 ['ควบคุม: ชุดถูกทุกอย่าง + ยืนยันถูก → ต้องเปิดได้',true,b=>{b.gate=goodGate(b);}],
 ['① ไม่พร้อม: แผนขาดช่อง D5',false,b=>{b.gate=goodGate(b);delete b.plan.D5;}],
 ['① ไม่พร้อม: S3 ไม่มีรูป',false,b=>{b.rows[2].image_urls=[];b.gate=goodGate(b);}],
 ['① ไม่พร้อม: D2 โภชนาการว่าง',false,b=>{b.rows[9].kcal=null;b.gate=goodGate(b);}],
 ['① ไม่พร้อม: ยังไม่ติดป้าย / สต็อกว่าง',false,b=>{b.rows[0].subcode=null;b.rows[1].stock_total=null;b.gate=goodGate(b);}],
 ['② บ้ง: S1 ราคา 99',false,b=>{b.rows[0].price=99;b.gate=goodGate(b);}],
 ['② บ้ง: D1 หมวด hato_import (ลูกค้ามองไม่เห็น)',false,b=>{b.rows[8].category='hato_import';b.gate=goodGate(b);}],
 ['② บ้ง: S5 วันเริ่มขายผิดสัปดาห์',false,b=>{b.rows[4].available_from='2099-01-12';b.gate=goodGate(b);}],
 ['③ ซ้ำใน 3 เดือน: ด่าน 05 ตกข้อ ①',false,b=>{b.gate={...goodGate(b),pass:false,fails:['① S900 ขายไปเมื่อ 40 วันก่อน']};}],
 ['④ S/D ไม่ตรงจาน: ด่าน 05 ตกข้อ ② วิธีทำขัดกัน',false,b=>{b.gate={...goodGate(b),pass:false,fails:['② S4/D4 วิธีทำขัดกัน (ต้ม กับ ผัด)']};}],
 ['④ S/D ไม่ตรงจาน: สลับจาน D4 หลังผ่านด่าน (ลายนิ้วมือเปลี่ยน)',false,b=>{b.gate=goodGate(b);b.rows[11].name='กุ้งผัดไข่เค็ม';}],
 ['ด่าน: ยังไม่มีคนดูรูป',false,b=>{b.gate={...goodGate(b),visual_ok:null};}],
 ['ด่าน: ผลด่านเก่า 9 วัน',false,b=>{b.gate={...goodGate(b),at:new Date(Date.now()-9*864e5).toISOString()};}],
 ['ด่าน: ไม่มีผลด่านเลย',false,b=>{b.gate=null;}],
 ['ยืนยัน: ไม่ใส่ --confirm → ไม่เขียน',false,b=>{b.gate=goodGate(b);b.args=['--open-for-real'];}],
 ['ยืนยัน: --confirm ผิดสัปดาห์ → ไม่เขียน',false,b=>{b.gate=goodGate(b);b.args=['--open-for-real','--confirm','2099-01-12'];}],
 ['ยืนยัน: --confirm ว่าง → ไม่เขียน',false,b=>{b.gate=goodGate(b);b.args=['--open-for-real','--confirm'];}],
];
let bad=0;
for(const [name,expectOpen,mut] of cases){
  const b=base(); mut(b); const reasons=decide(b); const open=reasons.length===0; const ok=open===expectOpen;
  if(!ok) bad++;
  console.log((ok?'✅':'❌')+' '+name+' → '+(open?'เปิด':'หยุด')+(reasons.length?'  ['+reasons.slice(0,2).join(' · ')+']':''));
}
console.log('\n'+(bad?'🔴 '+bad+' เคสไม่ตรงคาด':'✅ ทุกเคสตรงคาด ('+cases.length+' เคส)'));
process.exitCode=bad?1:0;

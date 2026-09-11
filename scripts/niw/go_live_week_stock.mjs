/**
 * 🚀 เปิดเมนูสัปดาห์ใหม่ — ป้าย S1-S8/D1-D5 + สต็อก + ป้ายสัปดาห์ + เปิดขาย · อ่านทุกอย่างจาก DB
 * นัทสั่ง 11 ก.ย.: นิวเป็นคนเปิดขายเอง (ไม่ตั้งเวลา จนกว่าจะแม่น) · สต็อกใส่ช่อง "กำลังผลิต" ไม่ใช่ "มีของแล้ว"
 *
 * ค่าเริ่มต้น = ดูอย่างเดียว (ไม่ใส่ flag เขียน = ไม่เขียนอะไรเลย)
 * ทุกโหมดที่เขียน ต้องใส่ --confirm <สัปดาห์> ให้ตรง (pm 11 ก.ย. หลังนิวรัน flag ผิดเอง) · พิมพ์สรุปก่อนเขียนเสมอ
 *
 * รอบจริง 3 ขั้น:
 *   1) go_live_week_stock.mjs <จันทร์> --apply --no-open --confirm <จันทร์>   ติดป้าย+สต็อก+ป้ายสัปดาห์ ยังไม่เปิด
 *   2) check_weekly_menu.mjs <จันทร์> --visual-ok "ชื่อ"                      ด่าน 05 (หลังข้อ 1 เพราะลายนิ้วมือนับป้าย)
 *   3) go_live_week_stock.mjs <จันทร์> --open-for-real --confirm <จันทร์>     ⚠️ เปิดขายจริง เมื่อผ่านทุกด่านเท่านั้น
 * exit 0 ผ่าน · 1 ไม่พร้อม/ไม่ยืนยัน (ไม่เขียน) · 2 เขียนแล้วตรวจซ้ำไม่ผ่าน
 * ทดสอบว่าหยุดจริง: node scripts/niw/test_go_live_stops.mjs
 */
import { SLOTS, fingerprint, readiness, gateCheck, confirmCheck } from './go_live_decide.mjs';
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const A=process.argv.slice(2);
const WEEK=A[0], APPLY=A.includes('--apply'), NO_OPEN=A.includes('--no-open'), OPEN_REAL=A.includes('--open-for-real');
const WRITES=APPLY||OPEN_REAL;
const g=async u=>(await fetch(SB+'/rest/v1/'+u,{headers:H})).json();
const P=async(code,body)=>{const r=await fetch(SB+'/rest/v1/menu_items?code=eq.'+code,{method:'PATCH',headers:{...H,Prefer:'return=representation'},body:JSON.stringify(body)});const j=await r.json();return r.ok&&Array.isArray(j)&&j.length===1;};
const putKD=async(key,data)=>(await fetch(SB+'/rest/v1/kitchen_data?key=eq.'+key,{method:'PATCH',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify({data,updated_at:new Date().toISOString()})})).ok;
const COLS='id,code,name,price,category,kcal,protein,carb,fat,image_urls,available_from,is_available,subcode,stock_total,actual_stock';

// ประตูกันลูกค้าเลือกส่งก่อนวันขาย ต้องมีบนหน้าจริง (เครื่องหมายจาก scripts/u/weekly_open.mjs · เคสสารทจีนทะลุ 23 ส.ค.)
const DOORS=[
  {name:'LIFF ด่านตอนกดสั่ง',url:'https://under360-system.vercel.app/liff_customer.html',marks:['function cartDateBeforeReady(','cartDateBeforeReady(selDate)']},
  {name:'หน้าสั่งแทนลูกค้า',url:'https://under360-system.vercel.app/operation_hub.html',marks:['function obCartReadyDate(','if(obReadyAt&&date<obReadyAt)']},
  // กลับด้าน (pm 11 ก.ย.): /pack สร้างใบสั่งเองโดยไม่ดู available_from (ส่ง "พรุ่งนี้" ได้) · นัทเคาะให้ปิดระบบสั่งบน /pack · M กำลังทำ
  // หน้านี้ต้อง "ไม่มี" การสร้างใบสั่ง · ยังมี = ไม่เปิดขาย · M ปิดเสร็จ = ผ่านเอง ไม่ต้องแก้ตัวนี้
  {name:'หน้าเว็บ /pack',url:'https://360foodbox.com/pack',mustNot:/from\(\s*['"]orders['"]\s*\)\s*\.insert\(/},
];
async function doorCheck(){
  const r=[];
  for(const d of DOORS){
    try{
      const res=await fetch(d.url+'?v='+Date.now());
      if(!res.ok){ r.push(d.name+' โหลดหน้าไม่ได้ (HTTP '+res.status+')'); continue; }
      const t=await res.text();
      if(d.marks){ const miss=d.marks.filter(m=>!t.includes(m)); if(miss.length) r.push(d.name+' ไม่มีด่านวันส่ง ('+miss.join(', ')+')'); }
      if(d.mustNot&&d.mustNot.test(t)) r.push(d.name+' ยังสร้างใบสั่งเองได้ (ไม่ดูวันเริ่มขาย) — รอ M ปิดระบบสั่งบน /pack');
    }catch(e){ r.push(d.name+' โหลดหน้าไม่ได้'); }
  }
  return r;
}

async function openStep(plan,stock){
  const codes=SLOTS.map(s=>(plan||{})[s]).filter(Boolean);
  const rows=codes.length?await g('menu_items?select='+COLS+'&code=in.('+codes.join(',')+')'):[];
  const weekMenus=await g('menu_items?select=code,name,price,kcal,protein,carb,fat,image_urls,subcode&available_from=eq.'+WEEK);
  const fp=fingerprint(weekMenus);
  const gateRec=(((await g('kitchen_data?select=data&key=eq.weekly_gate'))[0]||{}).data||{})[WEEK];
  const reasons=readiness({week:WEEK,plan,stock,rows,requireLabels:true}).concat(gateCheck({gateRec,fp,planCodes:codes}));
  if(weekMenus.length!==13) reasons.push('เมนูที่ available_from='+WEEK+' มี '+weekMenus.length+' ตัว ไม่ใช่ 13');
  reasons.push(...await doorCheck());
  console.log('\nด่านก่อนเปิดขาย · ลายนิ้วมือตอนนี้ '+fp+' · ด่าน 05: '+(gateRec?gateRec.fingerprint+' pass='+gateRec.pass+' visual_ok='+gateRec.visual_ok:'ไม่มี'));
  if(reasons.length){ reasons.forEach(x=>console.log('  🔴 '+x)); console.log('⛔ ไม่เปิดขาย'); return 1; }
  console.log('  ✅ ผ่านทุกด่าน (ความพร้อม · ด่าน 05 · ลายนิ้วมือ · ประตูวันส่ง)');
  if(!OPEN_REAL&&!(APPLY&&!NO_OPEN)){ console.log('(ดูอย่างเดียว — ไม่ได้เปิด)'); return 0; }

  for(const c of codes) if(!await P(c,{is_available:true})) console.log('  ❌ เปิดไม่สำเร็จ '+c);
  const back=await g('menu_items?select=code,subcode,is_available,stock_total&code=in.('+codes.join(',')+')');
  const all=await g('menu_items?select=code,subcode&subcode=not.is.null');
  const d={}; all.forEach(m=>(d[m.subcode]=d[m.subcode]||[]).push(m.code));
  const dup=Object.entries(d).filter(([,a])=>a.length>1);
  const open=back.filter(m=>m.is_available).length, noStk=back.filter(m=>m.stock_total==null).length;
  console.log('เปิดขาย '+open+'/13 · ป้ายซ้ำ '+(dup.length?'🔴 '+dup.map(([k,a])=>k+'='+a.join('/')).join(' '):'0 ✅')+' · สต็อกว่าง '+noStk);
  if(open!==13||dup.length||noStk) return 2;
  console.log('✅ เปิดขายแล้ว — ยังต้องเปิดหน้าลูกค้าดูด้วยตาอีกชั้น');
  return 0;
}

async function main(){
  if(A.includes('--open-only')){ console.log('🔴 --open-only เลิกใช้แล้ว (ชื่อหลอกตา · นิวรันผิดเอง 11 ก.ย.) → ใช้ --open-for-real --confirm <สัปดาห์>'); return 1; }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(WEEK))){ console.log('ใส่วันจันทร์ เช่น 2026-09-21'); return 1; }
  if(APPLY&&OPEN_REAL){ console.log('🔴 ใช้ --apply กับ --open-for-real พร้อมกันไม่ได้ — แยกเป็นขั้น'); return 1; }
  const mode=OPEN_REAL?'⚠️ เปิดขายจริง':APPLY?(NO_OPEN?'⚠️ เขียนป้าย+สต็อก (ไม่เปิดขาย)':'⚠️ เขียนป้าย+สต็อก แล้วเปิดขายจริง'):'ดูอย่างเดียว';
  console.log('สัปดาห์ '+WEEK+' · '+mode);
  const kd=await g('kitchen_data?select=key,data&key=in.(weekly_subcode_plan,weekly_stock_plan,stock_incoming,menu_special_weeks)');
  const get=k=>((kd.find(x=>x.key===k)||{}).data)||{};
  const plan=get('weekly_subcode_plan')[WEEK], stock=(get('weekly_stock_plan')[WEEK]||{}).qty;
  const inc=get('stock_incoming'), msw=get('menu_special_weeks');
  const codes=plan?SLOTS.map(s=>plan[s]).filter(Boolean):[];

  // 🔒 ยืนยันก่อนเขียน — พิมพ์สรุปแล้วต้องมี --confirm <สัปดาห์> ตรงกัน ไม่ตรง = ไม่เขียนอะไรเลย
  if(WRITES){
    console.log('\n📋 จะเขียนลงของจริง: สัปดาห์ '+WEEK+' · '+codes.length+' ตัว · '+(plan?SLOTS.map(s=>s+'='+(plan[s]||'?')).join(' '):'ไม่มีแผน'));
    const cr=confirmCheck({args:A,week:WEEK});
    if(cr.length){ cr.forEach(x=>console.log('  🔴 '+x)); console.log('⛔ ไม่เขียนอะไร'); return 1; }
    console.log('  ✅ ยืนยันสัปดาห์ตรง');
  }
  if(OPEN_REAL) return openStep(plan,stock);

  const rows=codes.length?await g('menu_items?select='+COLS+'&code=in.('+codes.join(',')+')'):[];
  const r1=readiness({week:WEEK,plan,stock,rows});
  if(r1.length){ r1.forEach(x=>console.log('  🔴 '+x)); console.log('⛔ ไม่ทำอะไร'); return 1; }

  const by=new Map(rows.map(m=>[m.code,m]));
  let total=0;
  console.log('\n ช่อง รหัส   สต็อก  ตอนนี้(ขาย/นับได้/กำลังผลิต)  เมนู');
  for(const s of SLOTS){
    const m=by.get(plan[s]); const n=Number(stock[s]); total+=n;
    const cur=(inc[m.id]&&inc[m.id].n)||0;
    console.log(' '+s.padEnd(4)+' '+m.code.padEnd(6)+' '+String(n).padStart(3)+'   '+String(m.stock_total).padStart(4)+'/'+String(m.actual_stock).padStart(4)+'/'+String(cur).padStart(3)+'     '+String(m.name).slice(0,40));
  }
  console.log(' รวม '+total+' กล่อง');
  const held=await g('menu_items?select=code,subcode&subcode=not.is.null');
  const strip=held.filter(m=>/^[SD][1-8]$/.test(String(m.subcode).trim().toUpperCase())&&!codes.includes(m.code));
  console.log(' ถอดป้ายชุดเก่า '+strip.length+' ตัว: '+strip.map(m=>m.subcode+'='+m.code).join(' '));
  if(!APPLY){ console.log('(ดูอย่างเดียว — ยังไม่ได้เขียนอะไร)'); return openStep(plan,stock); }

  for(const m of strip) if(!await P(m.code,{subcode:null})) console.log('  ❌ ถอดป้ายไม่สำเร็จ '+m.code);
  const at=new Date().toISOString();
  for(const s of SLOTS){
    const m=by.get(plan[s]); const n=Number(stock[s]); const real=Math.max(0,Number(m.actual_stock)||0);
    if(!await P(m.code,{subcode:s,stock_total:real+n})){ console.log('  ❌ ตั้งป้าย/สต็อกไม่สำเร็จ '+m.code+' — หยุดก่อนเปิดขาย'); return 2; }
    const prev=inc[m.id];
    inc[m.id]={n,by:'น้องนิว (สั่งผลิตสัปดาห์ใหม่ '+WEEK+')',at,code:m.code,was:prev?{n:prev.n,by:prev.by}:undefined};
    msw[m.code]=WEEK;
  }
  if(!await putKD('stock_incoming',inc)){ console.log('  ❌ บันทึกกำลังผลิตไม่สำเร็จ — หยุด'); return 2; }
  if(!await putKD('menu_special_weeks',msw)){ console.log('  ❌ บันทึกป้ายสัปดาห์ไม่สำเร็จ — หยุด'); return 2; }

  const back=await g('menu_items?select=code,subcode,stock_total&code=in.('+codes.join(',')+')');
  const bk=new Map(back.map(m=>[m.code,m]));
  const labeled=SLOTS.filter(s=>(bk.get(plan[s])||{}).subcode===s).length;
  const noStk=back.filter(m=>m.stock_total==null).length;
  const mswBack=(((await g('kitchen_data?select=data&key=eq.menu_special_weeks'))[0]||{}).data)||{};
  const mswOk=codes.filter(c=>mswBack[c]===WEEK).length;
  console.log('ติดป้าย '+labeled+'/13 · สต็อกว่าง '+noStk+' · ป้ายสัปดาห์ '+mswOk+'/13');
  if(labeled!==13||noStk||mswOk!==13) return 2;
  if(NO_OPEN){ console.log('✅ พร้อมให้ด่าน 05 ตรวจ → check_weekly_menu.mjs --visual-ok แล้ว --open-for-real --confirm '+WEEK); return 0; }
  return openStep(plan,stock);
}
main().then(c=>{ process.exitCode=c; }).catch(e=>{ console.error('🔴 พัง (นับว่าไม่เปิด):',e&&e.message||e); process.exitCode=2; });

/**
 * 🚀 เปิดเมนูสัปดาห์ใหม่ + ป้ายช่อง S1-S8/D1-D5 + ตั้งสต็อก "กำลังผลิต" — อ่านทุกอย่างจาก DB
 *
 * ต่างจาก go_live_week.mjs: ตัวนั้นไม่ตั้งสต็อก (เปิดแล้วไม่จำกัด + ครัวไม่เห็นยอดผลิต)
 * ต่างจาก go_live_0907.mjs: ตัวนั้นฝังสัปดาห์ + ตัวเลขสต็อกในโค้ด
 *
 * อ่าน:  kitchen_data.weekly_subcode_plan[WEEK]  = { S1:"S158", ... }
 *        kitchen_data.weekly_stock_plan[WEEK].qty = { S1:5, ... }
 * เขียน: menu_items.subcode + stock_total + is_available · kitchen_data.stock_incoming (กำลังผลิต)
 *
 * ⛔ --apply เปิดขายจริงทันที — รันเมื่อนัทเคาะแล้วเท่านั้น
 * --no-open = ใส่ป้าย+สต็อกอย่างเดียว ไม่แตะ is_available (pm เคาะ 11 ก.ย.: ตัวเปิดขายมีตัวเดียว = ของ U)
 * รัน: node scripts/niw/go_live_week_stock.mjs 2026-09-14          ← ดูอย่างเดียว
 *      node scripts/niw/go_live_week_stock.mjs 2026-09-14 --apply  ← ทำจริง
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const WEEK=process.argv[2], APPLY=process.argv.includes('--apply'), NO_OPEN=process.argv.includes('--no-open');
const g=async u=>(await fetch(SB+'/rest/v1/'+u,{headers:H})).json();
const P=async(code,body)=>{const r=await fetch(SB+'/rest/v1/menu_items?code=eq.'+code,{method:'PATCH',headers:{...H,Prefer:'return=representation'},body:JSON.stringify(body)});const j=await r.json();return r.ok&&Array.isArray(j)&&j.length===1;};
const SLOTS=['S1','S2','S3','S4','S5','S6','S7','S8','D1','D2','D3','D4','D5'];

async function main(){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(WEEK))){console.log('ใส่วันจันทร์ เช่น 2026-09-14');process.exitCode=1;return;}
  console.log('สัปดาห์ '+WEEK+(APPLY?'  ⚠️ ทำจริง':'  (ดูอย่างเดียว ไม่แตะ DB)')+(NO_OPEN?'  · โหมด --no-open (ไม่เปิดขาย)':''));

  const kd=await g('kitchen_data?select=key,data&key=in.(weekly_subcode_plan,weekly_stock_plan,stock_incoming)');
  const get=k=>((kd.find(x=>x.key===k)||{}).data)||{};
  const plan=get('weekly_subcode_plan')[WEEK];
  const stock=(get('weekly_stock_plan')[WEEK]||{}).qty;
  const inc=get('stock_incoming');

  // ── ด่าน 1: แผนครบ 13 ช่อง ทั้งป้ายและสต็อก ──
  const bad=[];
  if(!plan) bad.push('ไม่มี weekly_subcode_plan ของสัปดาห์นี้');
  if(!stock) bad.push('ไม่มี weekly_stock_plan ของสัปดาห์นี้');
  if(plan&&stock) for(const s of SLOTS){
    if(!plan[s]) bad.push(s+' ไม่มีเมนูในแผนป้าย');
    if(!(Number(stock[s])>0)) bad.push(s+' ไม่มีตัวเลขสต็อก');
    if(plan[s]&&plan[s][0]!==s[0]) bad.push(s+' ใส่รหัสผิดฝั่ง '+plan[s]);
  }
  if(plan){const c=Object.values(plan);if(new Set(c).size!==c.length) bad.push('รหัสซ้ำในแผน');}
  if(bad.length){bad.forEach(b=>console.log('  🔴 '+b));console.log('⛔ ไม่ทำอะไร');process.exitCode=1;return;}

  // ── ด่าน 2: เมนูพร้อมขายจริง ──
  const codes=SLOTS.map(s=>plan[s]);
  const rows=await g('menu_items?select=id,code,name,price,category,kcal,protein,carb,image_urls,available_from,is_available,subcode,stock_total,actual_stock&code=in.('+codes.join(',')+')');
  const by=new Map(rows.map(m=>[m.code,m]));
  for(const s of SLOTS){
    const m=by.get(plan[s]); if(!m){bad.push(s+' '+plan[s]+' ไม่มีในตาราง');continue;}
    const miss=[];
    if(m.available_from!==WEEK) miss.push('available_from='+m.available_from);
    if(m.category!==(s[0]==='S'?'no_special':'pack_regular')) miss.push('หมวด='+m.category);
    if(!(m.image_urls||[]).length) miss.push('ไม่มีรูป');
    if(!(Number(m.kcal)>0&&Number(m.protein)>0&&Number(m.carb)>0)) miss.push('โภชนาการขาด');
    if(Number(m.price)<(s[0]==='S'?125:80)) miss.push('ราคาต่ำ');
    if(miss.length) bad.push(s+' '+m.code+' — '+miss.join(', '));
  }
  if(bad.length){bad.forEach(b=>console.log('  🔴 '+b));console.log('⛔ ไม่ทำอะไร');process.exitCode=1;return;}

  // ── แสดงแผน + คู่ S/D ให้ดูด้วยตา ──
  console.log('\n ช่อง รหัส   สต็อก  ตอนนี้(ขาย/นับได้/กำลังผลิต)  เมนู');
  let total=0;
  for(const s of SLOTS){
    const m=by.get(plan[s]); const n=Number(stock[s]); total+=n;
    const cur=(inc[m.id]&&inc[m.id].n)||0;
    console.log(' '+s.padEnd(4)+' '+m.code.padEnd(6)+' '+String(n).padStart(3)+'   '+String(m.stock_total).padStart(4)+'/'+String(m.actual_stock).padStart(4)+'/'+String(cur).padStart(3)+'     '+String(m.name).slice(0,40));
  }
  console.log(' รวม '+total+' กล่อง');
  console.log('\n คู่ S/D (ต้องเป็นจานเดียวกัน — ดูด้วยตา):');
  for(let i=1;i<=5;i++) console.log('  '+i+') '+by.get(plan['S'+i]).name+'  ↔  '+by.get(plan['D'+i]).name);
  const warnReal=rows.filter(m=>Number(m.actual_stock)>0);
  if(warnReal.length) console.log('\n ⚠️ มีของค้างนับได้อยู่แล้ว (actual_stock>0) — สต็อกที่ลูกค้าเห็นจะ = นับได้ + กำลังผลิต: '+warnReal.map(m=>m.code+'='+m.actual_stock).join(' '));

  // ── ป้ายเก่าที่จะถอด ──
  const held=await g('menu_items?select=code,subcode&subcode=not.is.null');
  const strip=held.filter(m=>/^[SD][1-8]$/.test(String(m.subcode).trim().toUpperCase())&&!codes.includes(m.code));
  const other=held.filter(m=>!/^[SD][1-8]$/.test(String(m.subcode).trim().toUpperCase()));
  console.log('\n ถอดป้ายชุดเก่า '+strip.length+' ตัว: '+strip.map(m=>m.subcode+'='+m.code).join(' '));
  if(other.length) console.log(' ไม่แตะป้ายแบบอื่น (เช่นค้างสัปดาห์ x): '+other.map(m=>m.subcode+'='+m.code).join(' '));
  if(!APPLY){console.log('\n(ดูอย่างเดียว — ยังไม่ได้เขียนอะไร)');return;}

  // ── ทำจริง: ถอดป้ายเก่า → ตั้งป้าย+สต็อก → บันทึกกำลังผลิต → เปิดขายเป็นขั้นสุดท้าย ──
  for(const m of strip) if(!await P(m.code,{subcode:null})) console.log('  ❌ ถอดป้ายไม่สำเร็จ '+m.code);
  const at=new Date().toISOString();
  for(const s of SLOTS){
    const m=by.get(plan[s]); const n=Number(stock[s]); const real=Math.max(0,Number(m.actual_stock)||0);
    if(!await P(m.code,{subcode:s,stock_total:real+n})){console.log('  ❌ ตั้งป้าย/สต็อกไม่สำเร็จ '+m.code+' — หยุดก่อนเปิดขาย');process.exitCode=2;return;}
    const prev=inc[m.id];
    inc[m.id]={n,by:'น้องนิว (สั่งผลิตสัปดาห์ใหม่ '+WEEK+')',at,code:m.code,was:prev?{n:prev.n,by:prev.by}:undefined};
  }
  const w=await fetch(SB+'/rest/v1/kitchen_data?key=eq.stock_incoming',{method:'PATCH',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify({data:inc})});
  if(!w.ok){console.log('  ❌ บันทึกกำลังผลิตไม่สำเร็จ '+w.status+' — หยุดก่อนเปิดขาย');process.exitCode=2;return;}
  if(!NO_OPEN) for(const s of SLOTS) if(!await P(plan[s],{is_available:true})) console.log('  ❌ เปิดขายไม่สำเร็จ '+plan[s]);

  // ── ตรวจซ้ำจาก DB จริง ──
  const back=await g('menu_items?select=code,subcode,is_available,stock_total&code=in.('+codes.join(',')+')');
  const open=back.filter(m=>m.is_available).length;
  const all=await g('menu_items?select=code,subcode&subcode=not.is.null');
  const d={};all.forEach(m=>{(d[m.subcode]=d[m.subcode]||[]).push(m.code);});
  const dup=Object.entries(d).filter(([,a])=>a.length>1);
  const noStock=back.filter(m=>m.stock_total==null);
  const dupTxt=dup.length?'🔴 '+dup.map(([k,a])=>k+'='+a.join('/')).join(' '):'0 ✅';
  const stkTxt=noStock.length?'🔴 '+noStock.map(m=>m.code).join(' '):'0 ✅';
  const labeled=back.filter(m=>m.subcode&&SLOTS.includes(m.subcode)).length;
  console.log((NO_OPEN?'ติดป้าย '+labeled+'/13 · เปิดขาย '+open+' (ไม่เปิดตามโหมด)':'เปิดขาย '+open+'/13')+' · ป้ายซ้ำ '+dupTxt+' · สต็อกว่าง '+stkTxt);
  if((NO_OPEN?labeled!==13:open!==13)||dup.length||noStock.length){process.exitCode=2;return;}
  console.log('✅ เสร็จ — ยังต้องเปิดหน้าลูกค้าดูด้วยตาอีกชั้น');
}
main();

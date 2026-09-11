/**
 * โยกรหัส D ให้ไปอยู่ใต้แม่ (S) — ใช้ซ้ำได้ ไม่ฝังรายการในโค้ด
 * นัทสั่ง 11 ก.ย.: "D ไม่ตรงกับ S ก็โยกรหัส D ออกไป แล้วใส่ D ที่ถูกต้องที่ตรงกับ S" · หาแม่ = จานเดียวกัน ไม่ใช่ "เคยขึ้นสัปดาห์เดียวกัน"
 *
 * แก้ 4 ที่: menu_items.code · kitchen_data.recipes[].code · kitchen_data.menu_special_weeks{รหัส:สัปดาห์} · order_items (ผ่าน backfill_order_codes.mjs)
 * กัน: ตัวที่เปิดขาย/มีชื่อเล่น/มีออเดอร์ค้างส่ง/อยู่ในแผนสัปดาห์ = หยุดทั้งชุด · ปลายทางต้องว่าง หรือถูกโยกออกก่อนในลำดับ
 *
 * รัน: node scripts/niw/sd_recode.mjs D029:D050 D131:D157 --dry
 *      node scripts/niw/sd_recode.mjs D029:D050 D131:D157
 */
import { execFileSync } from 'child_process';
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const DRY=process.argv.includes('--dry');
const MOVES=process.argv.slice(2).filter(a=>/^[SD]\d{3}:[SD]\d{3}$/.test(a)).map(a=>{const [from,to]=a.split(':');return {from,to};});
const page=async u=>{let o=[],f=0;for(;;){const r=await fetch(SB+'/rest/v1/'+u,{headers:{...H,Range:f+'-'+(f+999)}});const j=await r.json();if(!Array.isArray(j)||!j.length)break;o=o.concat(j);if(j.length<1000)break;f+=1000;}return o;};

async function main(){
  if(!MOVES.length){console.log('ใส่คู่ เช่น D029:D050');process.exitCode=1;return;}
  const menus=await page('menu_items?select=code,name,is_available,subcode');
  const by=new Map(menus.map(m=>[m.code,m]));
  const today=new Date().toISOString().slice(0,10);
  const live=await page('order_items?select=menu_code,orders!inner(delivery_date)&orders.delivery_date=gte.'+today+'&menu_code=in.('+MOVES.map(m=>m.from).join(',')+')');
  const liveC=new Set(live.map(x=>x.menu_code));
  const kd=await page('kitchen_data?select=key,data&key=in.(recipes,menu_special_weeks,weekly_subcode_plan)');
  const get=k=>(kd.find(x=>x.key===k)||{}).data;
  const rec=get('recipes')||[], msw=get('menu_special_weeks')||{}, wsp=get('weekly_subcode_plan')||{};
  const inPlan=new Set(Object.values(wsp).flatMap(w=>Object.values(w||{})));

  let stop=false; const moved=new Set();
  for(const m of MOVES){
    const src=by.get(m.from), occ=by.get(m.to), mom=by.get('S'+m.to.slice(1));
    const bad=[];
    if(!src) bad.push('ไม่มี '+m.from);
    else{ if(src.is_available) bad.push('เปิดขายอยู่'); if(src.subcode) bad.push('มีชื่อเล่น '+src.subcode); if(liveC.has(m.from)) bad.push('มีออเดอร์ค้างส่ง'); if(inPlan.has(m.from)) bad.push('อยู่ในแผนสัปดาห์'); }
    if(occ&&!moved.has(occ.code)) bad.push('ปลายทาง '+m.to+' มี '+occ.name+' และยังไม่ถูกโยกออกก่อน');
    if(m.from[0]!==m.to[0]) bad.push('ข้ามฝั่ง S/D');
    // สูตรต้องย้ายตามเมนูในจังหวะเดียวกัน (pm 11 ก.ย.) — ปลายทางมีสูตรจานอื่นค้างอยู่ = หยุด ไม่ข้ามเงียบๆ
    const recTo=rec.filter(x=>x&&x.code===m.to&&!(occ&&moved.has(occ.code)));
    if(recTo.length) bad.push('สูตรรหัส '+m.to+' มีของจานอื่นค้าง: '+recTo.map(x=>x.name).join('/')+' → เคลียร์สูตรก่อน');
    const note=[];
    if(msw[m.to]&&!occ) note.push('⚠️ ป้ายสัปดาห์ค้างที่ '+m.to+'='+msw[m.to]+' (ของเก่า จะถูกแทน)');
    console.log((bad.length?'🔴 ':'✅ ')+m.from+' → '+m.to+'  '+(src?src.name:'')+'  | แม่: '+(mom?mom.code+' '+mom.name:'❌ ไม่มี S เลขนี้')+(bad.length?'  | '+bad.join(' · '):'')+(note.length?'  | '+note.join(' · '):''));
    if(bad.length||!mom) stop=true;
    moved.add(m.from);
  }
  if(stop){console.log('\n⛔ ไม่ทำอะไรเลย');process.exitCode=1;return;}
  if(DRY){console.log('\n(dry run — ยังไม่แตะ DB · รันจริงจะตามด้วย backfill_order_codes.mjs อัตโนมัติ)');return;}

  for(const m of MOVES){
    const r=await fetch(SB+'/rest/v1/menu_items?code=eq.'+m.from,{method:'PATCH',headers:{...H,Prefer:'return=representation'},body:JSON.stringify({code:m.to})});
    const j=await r.json();
    if(!r.ok||!Array.isArray(j)||j.length!==1){console.log('🔴 หยุดที่ '+m.from+' '+r.status+' '+JSON.stringify(j));process.exitCode=2;return;}
    for(const x of rec) if(x&&x.code===m.from) x.code=m.to;   // ปลายทางว่างแน่นอน (ตรวจแล้วข้างบน)
    if(Object.prototype.hasOwnProperty.call(msw,m.from)){msw[m.to]=msw[m.from];delete msw[m.from];}
    console.log('  โยก '+m.from+' → '+m.to+' ✅');
  }
  for(const [key,data] of [['recipes',rec],['menu_special_weeks',msw]]){
    const w=await fetch(SB+'/rest/v1/kitchen_data?key=eq.'+key,{method:'PATCH',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify({data})});
    console.log('  บันทึก '+key+': '+w.status);
  }
  console.log('\n— แก้เลขในประวัติออเดอร์ —');
  const out=execFileSync(process.execPath,['scripts/niw/backfill_order_codes.mjs'],{encoding:'utf8',maxBuffer:32*1024*1024});
  out.split('\n').filter(l=>/จะแก้|✅ แก้แล้ว|พักไว้ ไม่แตะ/.test(l)).forEach(l=>console.log('  '+l.trim()));
  const back=await page('menu_items?select=code,name&code=in.('+MOVES.flatMap(m=>[m.from,m.to]).join(',')+')');
  console.log('\nตรวจซ้ำ: '+back.map(m=>m.code+' '+m.name).join(' | '));
}
main();

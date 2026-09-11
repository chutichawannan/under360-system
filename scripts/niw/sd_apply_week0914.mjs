/**
 * โยกรหัส D ให้ตรงกับ S ของชุดเมนูสัปดาห์ 14-20 ก.ย.
 * สเต็ปเดิมที่นัทสั่ง: "D ไม่ตรงกับ S ก็โยกรหัส D ออกไป แล้วใส่ D ที่ถูกต้องที่ตรงกับ S"
 *
 * แก้ 3 ที่พร้อมกัน (ไม่ครบ = พังเงียบ): menu_items.code · kitchen_data.recipes · menu_special_weeks
 * กันชน: ทำจากท้ายโซ่ก่อนเสมอ · ตัวไหนมีออเดอร์ยังไม่ส่ง/มี subcode = หยุดทั้งชุด
 *
 * รัน: node scripts/niw/sd_apply_week0914.mjs --dry   แล้วค่อยรันจริง
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K,'content-type':'application/json'};
const DRY=process.argv.includes('--dry');

// ลำดับต้องทำจากบนลงล่าง (ปลายโซ่ก่อน) — ปลายทางต้องว่างตอนที่ถึงคิวมัน
const MOVES=[
  {from:'D134',to:'D132',why:'มะเขือย่างซอสหมูสับพริกเต้าเจี้ยว = คู่ของ S132'},
  {from:'D101',to:'D134',why:'ไก่ย่างราดซอสต้มยำ = คู่ของ S134'},
  {from:'D145',to:'D101',why:'ไข่ต้มนึ่งสันในหมูสับ = คู่ของ S101'},
  {from:'D087',to:'D145',why:'กุ้งผัดไข่เค็ม = คู่ของ S145 (ข้าวต้มกุ้งไข่เค็ม) → D4'},
  {from:'D187',to:'D115',why:'ซอสหมูสับผัดทรงเครื่อง = คู่ของ S115'},
  {from:'D158',to:'D187',why:'อกไก่สับทรงเครื่อง = คู่ของ S187 (เส้นหมี่เมี่ยง) → D3'},
  {from:'D128',to:'D158',why:'อกไก่ผัดผงกะหรี่ = คู่ของ S158 (ข้าวอกไก่ผัดผงกะหรี่) → D1'},
];

const page=async u=>{let o=[],f=0;for(;;){const r=await fetch(SB+'/rest/v1/'+u,{headers:{...H,Range:f+'-'+(f+999)}});const j=await r.json();if(!Array.isArray(j)||!j.length)break;o=o.concat(j);if(j.length<1000)break;f+=1000;}return o;};

async function main(){
 const menus=await page('menu_items?select=code,name,is_available,subcode');
 const by=new Map(menus.map(m=>[m.code,m]));
 const today=new Date().toISOString().slice(0,10);
 const live=await page('order_items?select=menu_code,orders!inner(delivery_date)&orders.delivery_date=gte.'+today);
 const liveC=new Set(live.map(x=>x.menu_code));

 // ── ตรวจก่อนแตะอะไร ──
 let stop=false; const moved=new Set();
 for(const m of MOVES){
  const src=by.get(m.from);
  if(!src){console.log('🔴 '+m.from+' ไม่มีใน DB');stop=true;continue;}
  if(src.subcode){console.log('🔴 '+m.from+' มี subcode '+src.subcode+' = เป็นเมนูสัปดาห์ปัจจุบัน');stop=true;}
  if(liveC.has(m.from)){console.log('🔴 '+m.from+' มีออเดอร์ที่ยังไม่ถึงวันส่ง');stop=true;}
  const occ=by.get(m.to);
  if(occ&&!moved.has(occ.code)){console.log('🔴 ปลายทาง '+m.to+' ไม่ว่าง และยังไม่ถูกโยกออกก่อนหน้า: '+occ.name);stop=true;}
  moved.add(m.from);
 }
 if(stop){console.log('\n⛔ ไม่ทำอะไรเลย — แก้ที่ติดก่อน');return;}

 const kd=await page('kitchen_data?select=key,data&key=in.(recipes,menu_special_weeks)');
 const recipes=(kd.find(x=>x.key==='recipes')||{}).data;
 const weeks=(kd.find(x=>x.key==='menu_special_weeks')||{}).data;

 for(const m of MOVES){
  const src=by.get(m.from);
  console.log((DRY?'[dry] ':'')+m.from+' → '+m.to+'  '+src.name+'   ('+m.why+')');
  if(DRY) continue;
  const r=await fetch(SB+'/rest/v1/menu_items?code=eq.'+m.from,{method:'PATCH',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify({code:m.to})});
  if(!r.ok){console.log('  🔴 หยุด: '+r.status+' '+await r.text());return;}
  // ตามแก้สูตร + ประวัติสัปดาห์
  if(Array.isArray(recipes)) for(const x of recipes) if(x&&x.code===m.from) x.code=m.to;
  if(weeks&&typeof weeks==='object') for(const wk of Object.keys(weeks)){
    const v=weeks[wk]; if(Array.isArray(v)) weeks[wk]=v.map(c=>c===m.from?m.to:c);
  }
 }
 if(!DRY){
  for(const [key,data] of [['recipes',recipes],['menu_special_weeks',weeks]]){
   if(data===undefined) continue;
   const r=await fetch(SB+'/rest/v1/kitchen_data?key=eq.'+key,{method:'PATCH',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify({data})});
   console.log('  ตามแก้ '+key+': '+r.status);
  }
 }
 console.log(DRY?'\n(dry run — ยังไม่ได้แตะ DB)':'\n✅ โยกครบ');
}
main();

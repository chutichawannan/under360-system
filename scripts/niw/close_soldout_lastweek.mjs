/**
 * ปิดเมนูพิเศษ "ของสัปดาห์ที่แล้วและเก่ากว่า" ที่ขายหมดแล้ว — รันทุกวัน 4 ทุ่ม (เวลาไทย)
 * นัทสั่ง 18 ส.ค. 2026: "เมนูพิเศษประจำสัปดาห์ที่แล้ว อันไหนหมดแล้วให้ปิดไปเลย ทุก 4 ทุ่มของทุกวัน
 *                        ย้ำว่าของสัปดาห์ที่แล้วนะ สัปดาห์ปัจจุบันห้ามยุ่ง"
 *
 * เกณฑ์ปิด — ต้องเข้าครบทุกข้อ:
 *   1. ยังเปิดขายอยู่ (is_available = true)
 *   2. หมดแล้วจริง (stock_total = 0 — ไม่ใช่ null ที่แปลว่าไม่จำกัด)
 *   3. อยู่ในตารางเมนูสัปดาห์ และเป็น **สัปดาห์ก่อนหน้า** (menu_special_weeks < จันทร์สัปดาห์นี้)
 *
 * 🔒 ไม่แตะเด็ดขาด:
 *   · เมนูสัปดาห์ปัจจุบัน (menu_special_weeks = จันทร์สัปดาห์นี้ · หรือมี subcode)
 *   · เมนูประจำร้าน No* (นัทสั่ง: No3/6/7/11/15 = เมนูประจำ ไม่ปิด)
 *   · เมนูที่ไม่เคยติดแท็กสัปดาห์เลย (= ไม่ใช่เมนูพิเศษ ไม่ใช่หน้าที่ตัวนี้)
 *
 * รัน: node scripts/niw/close_soldout_lastweek.mjs [--dry]
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:KEY,Authorization:'Bearer '+KEY,'content-type':'application/json',Prefer:'return=minimal'};
const DRY=process.argv.includes('--dry');

function thisWeekBkk(){
 const n=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Bangkok'}));
 n.setHours(0,0,0,0); n.setDate(n.getDate()-((n.getDay()+6)%7));
 return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
}
const get=async p=>(await fetch(SB+'/rest/v1/'+p,{headers:{apikey:KEY}})).json();

async function main(){
 const week=thisWeekBkk();
 const stamp=new Date().toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});
 console.log('['+stamp+'] สัปดาห์ปัจจุบัน='+week+(DRY?'  [ทดลอง]':''));

 const kd=await get('kitchen_data?select=data&key=eq.menu_special_weeks');
 const weeks=(kd[0]&&kd[0].data)||{};
 const soldout=await get('menu_items?select=code,name,stock_total,subcode&is_available=eq.true&stock_total=eq.0&order=code');

 const close=[], keep=[];
 for(const m of soldout){
  const w=weeks[m.code];
  if(/^No/i.test(m.code))      keep.push([m,'เมนูประจำร้าน']);
  else if(m.subcode)           keep.push([m,'เป็น '+m.subcode+' ของสัปดาห์นี้']);
  else if(!w)                  keep.push([m,'ไม่เคยติดแท็กสัปดาห์ (ไม่ใช่เมนูพิเศษ)']);
  else if(w>=week)             keep.push([m,'เมนูสัปดาห์ปัจจุบัน ('+w+')']);
  else                         close.push([m,w]);
 }

 console.log('หมดแล้วและยังเปิดขาย '+soldout.length+' ตัว → ปิด '+close.length+' · เก็บไว้ '+keep.length);
 keep.forEach(([m,why])=>console.log('   🔒 '+m.code.padEnd(7)+String(m.name).slice(0,34).padEnd(36)+why));
 if(!close.length){ console.log('✅ ไม่มีอะไรต้องปิด'); return; }

 for(const [m,w] of close){
  if(DRY){ console.log('   [dry] ปิด '+m.code+' '+String(m.name).slice(0,34)+'  (สัปดาห์ '+w+')'); continue; }
  const r=await fetch(SB+'/rest/v1/menu_items?code=eq.'+m.code,{method:'PATCH',headers:H,body:JSON.stringify({is_available:false})});
  console.log('   '+(r.ok?'✅ ปิด ':'❌ '+r.status+' ')+m.code.padEnd(7)+String(m.name).slice(0,34)+'  (สัปดาห์ '+w+')');
 }
 if(DRY) return;
 const left=await get('menu_items?select=code&is_available=eq.true&stock_total=eq.0');
 console.log('── ตรวจซ้ำ: ยังขึ้น "หมดแล้ว" '+left.length+' ตัว ('+left.map(x=>x.code).join(', ')+')');
}
main().catch(e=>{console.error('❌',e.message);process.exit(1);});

/**
 * 🔍 ตรวจ "แบบที่ลูกค้าเห็น" ไม่ใช่แบบที่ DB เห็น
 * นัทสั่งเอง 22 ส.ค. 2026 หลังเจอว่าเปิดขายแล้วแต่ลูกค้าไม่เห็นเมนูเลย (หมวดผิด)
 *
 * รัน: node scripts/niw/check_week_live.mjs 2026-08-24
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const WEEK=process.argv[2];
if(!WEEK){ console.log('ใส่วันจันทร์ของสัปดาห์ด้วย เช่น node scripts/niw/check_week_live.mjs 2026-08-24'); process.exit(1); }

const g=async u=>{const r=await fetch(SB+u,{headers:{apikey:KEY}});return r.json();};
const weeks=(await g('/rest/v1/kitchen_data?select=data&key=eq.menu_special_weeks'))[0].data||{};
const codes=Object.keys(weeks).filter(c=>weeks[c]===WEEK);
if(!codes.length){ console.log('❌ ไม่มีเมนูไหนติดธงสัปดาห์ '+WEEK+' เลย'); process.exit(1); }
const rows=await g(`/rest/v1/menu_items?select=code,name,price,is_available,category,subcode,kcal,protein,carb,fat,image_urls&code=in.(${codes.join(',')})`);

const OK_CAT={ S:'no_special', D:'pack_regular' };
let fail=0;
console.log('ตรวจสัปดาห์ '+WEEK+' — '+rows.length+' เมนู\n');
console.log('ชื่อเล่น|รหัส  |เปิด|หมวดถูก|ธง|รูป|แคล| ปัญหา');
console.log('-'.repeat(80));
for(const m of rows.sort((a,b)=>String(a.subcode).localeCompare(String(b.subcode)))){
  const kind=m.code[0]==='D'?'D':'S';
  const bad=[];
  if(!m.is_available) bad.push('ปิดขาย');
  if(m.category!==OK_CAT[kind]) bad.push('หมวด='+m.category);
  if(!m.subcode) bad.push('ไม่มีชื่อเล่น');
  if(!(m.image_urls||[]).length) bad.push('ไม่มีรูป');
  if([m.kcal,m.protein,m.carb,m.fat].some(v=>v==null)) bad.push('โภชนาการไม่ครบ');
  if(bad.length) fail++;
  console.log(String(m.subcode||'-').padEnd(8)+'|'+m.code.padEnd(6)+'| '+(m.is_available?'Y':'N')+' |   '+(m.category===OK_CAT[kind]?'Y':'N')+'   | Y| '+((m.image_urls||[]).length?'Y':'N')+' | '+([m.kcal,m.protein,m.carb,m.fat].every(v=>v!=null)?'Y':'N')+' | '+(bad.length?'🔴 '+bad.join(', '):'✅'));
}
// ชุดสัปดาห์ก่อนต้องไม่มีชื่อเล่นค้าง
const older=Object.keys(weeks).filter(c=>weeks[c]<WEEK);
const stale=(await g(`/rest/v1/menu_items?select=code,name,subcode&code=in.(${older.join(',')})`)).filter(m=>m.subcode);
console.log('\nชุดสัปดาห์ก่อนที่ยังมีชื่อเล่นค้าง: '+(stale.length?'🔴 '+stale.map(m=>m.subcode+'='+m.code).join(', '):'✅ ไม่มี'));
console.log('\n'+(fail||stale.length?'🔴 ยังไม่พร้อม '+fail+' เมนูมีปัญหา':'✅ พร้อมทั้งหมด')+'  — แต่ยังต้องเปิดหน้าลูกค้าดูด้วยตาอีกชั้น');

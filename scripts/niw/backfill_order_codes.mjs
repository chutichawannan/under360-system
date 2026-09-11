/**
 * แก้เลขเมนูในประวัติออเดอร์ให้ตรงกับเมนูจริง
 * นัทสั่ง 11 ก.ย.: "ถ้าเลขผิดตอนเข้าด่าน ก็แก้เลขให้ถูกสิ"
 *
 * ที่มา: ทุกครั้งที่โยกรหัส D ให้ตรง S ประวัติออเดอร์ไม่ได้ตามไปด้วย
 *        → ด่านเช็ค "ซ้ำ 90 วัน" จากเลข เลยอ่านประวัติของเมนูคนเก่า
 *
 * วิธี: ยึด menu_name ที่บันทึกไว้ตอนขายเป็นความจริง → หาเลขปัจจุบันของเมนูชื่อนั้น → แก้ menu_code
 * แก้เฉพาะที่ชัวร์: ชื่อตรงเป๊ะกับเมนูปัจจุบันตัวเดียว · S→S หรือ D→D เท่านั้น · ไม่แตะรหัสท้าย -2
 *
 * รัน: node scripts/niw/backfill_order_codes.mjs --dry
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K,'content-type':'application/json',Prefer:'return=minimal'};
const DRY=process.argv.includes('--dry');
const page=async u=>{let o=[],f=0;for(;;){const r=await fetch(SB+'/rest/v1/'+u,{headers:{...H,Range:f+'-'+(f+999)}});const j=await r.json();if(!Array.isArray(j)||!j.length)break;o=o.concat(j);if(j.length<1000)break;f+=1000;}return o;};
const norm=s=>String(s||'').replace(/^X*\s*[SDC]\d+\s+/i,'').replace(/[\s+·\-()]/g,'').toLowerCase();

const menus=await page('menu_items?select=code,name');
const nameOf=new Map(menus.map(m=>[m.code,m.name]));
const hits=new Map();                       // ชื่อ → รายการรหัสที่ใช้ชื่อนี้
for(const m of menus){const k=norm(m.name);if(!hits.has(k))hits.set(k,[]);hits.get(k).push(m.code);}

const items=await page('order_items?select=id,menu_code,menu_name');
const fix=[], hold=[];
for(const x of items){
  const c=String(x.menu_code||''); if(!/^[SD]\d+$/.test(c)) continue;
  const cur=nameOf.get(c); if(!cur) continue;
  if(norm(cur)===norm(x.menu_name)) continue;
  const cands=(hits.get(norm(x.menu_name))||[]).filter(z=>/^[SD]\d+$/.test(z));
  const why=(m)=>hold.push({id:x.id,from:c,name:x.menu_name,why:m});
  if(cands.length===0){why('ไม่มีเมนูชื่อนี้ในตารางแล้ว');continue;}
  if(cands.length>1){why('ชื่อนี้มีหลายรหัส: '+cands.join('/'));continue;}
  const to=cands[0];
  if(to===c) continue;
  if(to[0]!==c[0]){why('ข้ามฝั่ง '+c+'→'+to+' (S กับ D)');continue;}
  fix.push({id:x.id,from:c,to,name:x.menu_name});
}
const agg={};for(const f of fix){const k=f.from+' → '+f.to+'  '+f.name;agg[k]=(agg[k]||0)+1;}
console.log('จะแก้ '+fix.length+' แถว ('+Object.keys(agg).length+' แบบ):');
for(const k of Object.keys(agg).sort((a,b)=>agg[b]-agg[a])) console.log('  x'+String(agg[k]).padStart(3)+'  '+k);
const hagg={};for(const h of hold){const k=h.from+'  ['+h.name+']  → '+h.why;hagg[k]=(hagg[k]||0)+1;}
console.log('\nพักไว้ ไม่แตะ '+hold.length+' แถว ('+Object.keys(hagg).length+' แบบ):');
for(const k of Object.keys(hagg).sort((a,b)=>hagg[b]-hagg[a]).slice(0,15)) console.log('  x'+String(hagg[k]).padStart(3)+'  '+k);

if(DRY){console.log('\n(dry run)');process.exit(0);}
let n=0;
for(const f of fix){
  const r=await fetch(SB+'/rest/v1/order_items?id=eq.'+f.id,{method:'PATCH',headers:H,body:JSON.stringify({menu_code:f.to})});
  if(!r.ok){console.log('🔴 หยุดที่ '+f.id+' '+r.status+' '+await r.text());break;}
  n++;
}
console.log('\n✅ แก้แล้ว '+n+'/'+fix.length+' แถว');

/**
 * ย้อน menu_code ในประวัติออเดอร์กลับตามไฟล์สำรอง
 * ไฟล์สำรองทำก่อนแก้ประวัติรอบใหญ่ 11 ก.ย. 2026 (ก่อน sd_recode D131/D156 + backfill 739+10 แถว)
 *   D:\U360\_backup\order_items_codes_backup_20260911.json  = [{id, menu_code}, ...] ทุกแถวของ order_items
 * ⚠️ ย้อนได้เฉพาะที่เปลี่ยน "หลัง" ไฟล์นี้ · การแก้ 280 แถว + 14 แถวที่ทำก่อนหน้าในวันเดียวกัน ไม่อยู่ในไฟล์นี้
 *
 * รัน: node scripts/niw/restore_order_codes.mjs <ไฟล์สำรอง>            ← ดูอย่างเดียว (นับว่าต่างกี่แถว)
 *      node scripts/niw/restore_order_codes.mjs <ไฟล์สำรอง> --apply    ← ย้อนจริง
 */
import fs from 'fs';
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const FILE=process.argv[2], APPLY=process.argv.includes('--apply');
async function main(){
  if(!FILE||!fs.existsSync(FILE)){console.log('ไม่เจอไฟล์สำรอง: '+FILE);process.exitCode=1;return;}
  const bk=JSON.parse(fs.readFileSync(FILE,'utf8'));
  if(!Array.isArray(bk)||!bk.length||!('id' in bk[0])||!('menu_code' in bk[0])){console.log('รูปแบบไฟล์ไม่ถูก');process.exitCode=1;return;}
  let cur=[];for(let f=0;;f+=1000){const r=await fetch(SB+'/rest/v1/order_items?select=id,menu_code&order=id',{headers:{...H,Range:f+'-'+(f+999)}});const j=await r.json();if(!Array.isArray(j)){console.log('อ่าน DB ไม่ได้');process.exitCode=1;return;}cur=cur.concat(j);if(j.length<1000)break;}
  const now=new Map(cur.map(x=>[x.id,x.menu_code]));
  const diff=bk.filter(x=>now.has(x.id)&&now.get(x.id)!==x.menu_code);
  const agg={};diff.forEach(x=>{const k=now.get(x.id)+' → '+x.menu_code;agg[k]=(agg[k]||0)+1;});
  console.log('ไฟล์สำรอง '+bk.length+' แถว · DB ตอนนี้ '+cur.length+' แถว · แถวที่รหัสต่างจากไฟล์สำรอง '+diff.length);
  Object.entries(agg).sort((a,b)=>b[1]-a[1]).slice(0,40).forEach(([k,v])=>console.log('  x'+String(v).padStart(3)+'  ย้อน '+k));
  if(!APPLY){console.log('(ดูอย่างเดียว)');return;}
  let n=0;for(const x of diff){const r=await fetch(SB+'/rest/v1/order_items?id=eq.'+x.id,{method:'PATCH',headers:{...H,Prefer:'return=minimal'},body:JSON.stringify({menu_code:x.menu_code})});if(r.ok)n++;}
  console.log('ย้อนแล้ว '+n+'/'+diff.length+' แถว');
}
main();

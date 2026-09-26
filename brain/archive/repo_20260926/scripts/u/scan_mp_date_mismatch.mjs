/* สแกนทั้งระบบ: รอบ Meal Plan ที่ "วันลูกค้าเห็น" กับ "วันที่ครัว/แมสใช้" ไม่ตรงกัน
   ต้นเหตุ: ปุ่มย้ายวันส่งฝั่งลูกค้าอัปเดตแค่ mp_deliveries ไม่แตะ orders */
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const H={apikey:KEY,Authorization:'Bearer '+KEY};
async function all(path){
  const out=[]; const step=1000;
  for(let from=0;;from+=step){
    const r=await fetch(SB+'/'+path,{headers:{...H,Range:`${from}-${from+step-1}`}});
    const j=await r.json();
    if(!Array.isArray(j)) throw new Error(JSON.stringify(j).slice(0,200));
    out.push(...j); if(j.length<step) break;
  }
  return out;
}

const today='2026-08-27';
// ดูรอบที่ยังไม่ถึง/เพิ่งผ่าน (ย้อน 7 วัน) — ของเก่ากว่านั้นแก้ไม่ทันแล้ว
const mp=await all(`mp_deliveries?delivery_date=gte.2026-08-20&select=id,customer_name,line_display_name,round_no,total_rounds,delivery_date,status,order_id,box_count,mp_type&order=delivery_date.asc`);
const ids=[...new Set(mp.map(r=>r.order_id).filter(Boolean))];
const ords=[];
for(let i=0;i<ids.length;i+=60){
  ords.push(...await all(`orders?id=in.(${ids.slice(i,i+60).join(',')})&select=id,order_number,delivery_date,status,customer_name,total`));
}
const byId=Object.fromEntries(ords.map(o=>[o.id,o]));

const bad=[], noOrder=[];
mp.forEach(r=>{
  if(r.status==='cancelled'||r.status==='skipped') return;
  const o=r.order_id ? byId[r.order_id] : null;
  if(!o){ noOrder.push(r); return; }
  if(o.status==='cancelled') return;
  if(o.delivery_date!==r.delivery_date) bad.push({r,o});
});

console.log('รอบ Meal Plan ที่ตรวจ (ตั้งแต่ 20 ส.ค.):', mp.length, 'รอบ');
console.log('🔴 วันไม่ตรงกัน:', bad.length, 'รอบ');
bad.forEach(({r,o})=>{
  const urgent = o.delivery_date>=today ? '⚠️ ยังไม่ถึงวันส่ง — ของจะไปผิดวัน' : '(เลยวันไปแล้ว)';
  console.log(`  ${r.customer_name||r.line_display_name} · รอบ ${r.round_no}/${r.total_rounds} · ${r.box_count} กล่อง`);
  console.log(`     ลูกค้าเห็น ${r.delivery_date}  ×  ใบ ${o.order_number} ตั้งไว้ ${o.delivery_date}   ${urgent}`);
});
console.log('\n🟡 รอบที่ไม่มีใบออเดอร์ผูกเลย:', noOrder.length);
noOrder.slice(0,10).forEach(r=>console.log(`  ${r.customer_name} · รอบ ${r.round_no}/${r.total_rounds} · ส่ง ${r.delivery_date} · ${r.status}`));

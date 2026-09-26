/* รอบ Meal Plan ที่ยังไม่มีเมนู และวันส่งกำลังจะถึง — ของที่ต้องจ่ายเมนูล่วงหน้า */
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const H={apikey:KEY,Authorization:'Bearer '+KEY};
const g=async p=>(await (await fetch(SB+'/'+p,{headers:H})).json());

const today='2026-08-27';
const rows=await g(`mp_deliveries?delivery_date=gte.${today}&select=id,customer_name,line_display_name,mp_type,round_no,total_rounds,delivery_date,status,box_count,menu_items,order_id,admin_notes&order=delivery_date.asc&limit=500`);

const noMenu=rows.filter(r=>{
  if(['cancelled','skipped'].includes(r.status)) return false;
  const m=r.menu_items;
  return !m || (Array.isArray(m) && m.length===0);
});

console.log('รอบที่วันส่งยังไม่ถึง (ตั้งแต่', today+'):', rows.length);
console.log('🔴 ยังไม่มีเมนู:', noMenu.length, 'รอบ ·', noMenu.reduce((s,r)=>s+(r.box_count||7),0), 'กล่อง\n');

const byDate={};
noMenu.forEach(r=>{ (byDate[r.delivery_date] ||= []).push(r); });
Object.keys(byDate).sort().forEach(d=>{
  const list=byDate[d];
  console.log(`📅 ${d} — ${list.length} รอบ · ${list.reduce((s,r)=>s+(r.box_count||7),0)} กล่อง`);
  list.forEach(r=>console.log(`   · ${(r.customer_name||r.line_display_name||'?').slice(0,32)} · ${String(r.mp_type||'').toUpperCase()} · รอบ ${r.round_no}/${r.total_rounds} · ${r.box_count||7} กล่อง · ${r.status}${r.order_id?'':' ⚠️ ไม่มีใบออเดอร์'}`));
});

// รอบที่มีเมนูแล้ว (เทียบให้เห็นว่าไม่ได้ว่างทั้งหมด)
const has=rows.filter(r=>Array.isArray(r.menu_items)&&r.menu_items.length>0&&!['cancelled','skipped'].includes(r.status));
console.log('\n✅ มีเมนูแล้ว:', has.length, 'รอบ');
has.slice(0,6).forEach(r=>console.log(`   · ${(r.customer_name||'?').slice(0,28)} · ${r.delivery_date} · รอบ ${r.round_no}/${r.total_rounds} · ${r.menu_items.length} เมนู`));

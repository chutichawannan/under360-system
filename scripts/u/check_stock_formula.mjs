/* 🔍 ตัวตรวจสูตรสต็อก — ISSUE 02 (10 ก.ย. 2569 · ห้อง u)
 *  เช็คว่า "ลูกค้าซื้อได้" (stock_total) ยังเท่ากับ  ครัวลง + กำลังเติม − จอง  อยู่ไหม
 *  ค่าฐานวันที่เขียน: ไม่เข้าสูตร 42 จาก 91 เมนู  →  แก้ ISSUE 02 เสร็จต้องเป็น 0
 *  รัน: node scripts/u/check_stock_formula.mjs
 */
const B='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const g=async q=>(await fetch(B+q,{headers:{apikey:K,Authorization:'Bearer '+K}})).json();
const T='2026-09-10';
const menus=await g('menu_items?select=id,code,stock_total,actual_stock&is_available=eq.true&limit=300');
const inc=(await g('kitchen_data?key=eq.stock_incoming&select=data'))[0].data||{};
// ออเดอร์ที่นับตามกฎ stkOrderedMap
let ords=[]; for(let off=0;off<3000;off+=1000){
  const r=await g(`orders?select=id,status,delivery_date,source&delivery_date=gte.${T}&limit=1000&offset=${off}`);
  ords=ords.concat(r); if(r.length<1000)break;
}
const live=ords.filter(o=>!['cancelled','ready','delivered'].includes(o.status)&&o.source!=='parallel_test');
const ids=live.map(o=>o.id);
let items=[]; for(let i=0;i<ids.length;i+=60){
  items=items.concat(await g(`order_items?order_id=in.(${ids.slice(i,i+60).join(',')})&select=menu_item_id,quantity&limit=2000`));
}
const om={}; items.forEach(i=>{ if(i.menu_item_id) om[i.menu_item_id]=(om[i.menu_item_id]||0)+(i.quantity||0); });
let bad=[],n=0;
for(const m of menus){
  if(m.stock_total==null) continue; n++;
  const i=Number((inc[m.id]||{}).n||0), o=om[m.id]||0;
  const expect=Math.max(0,Number(m.actual_stock||0)+i-o);
  if(expect!==Number(m.stock_total)) bad.push(`${m.code}: ขายได้=${m.stock_total} · ควรเป็น=${expect} (ครัวลง ${m.actual_stock}+เติม ${i}−จอง ${o})`);
}
console.log('เมนูเปิดขายที่ตั้งสต็อก:',n);
console.log('❌ ไม่เข้าสูตร:',bad.length);
bad.slice(0,12).forEach(x=>console.log('  ',x));

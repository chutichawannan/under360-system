const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
async function page(u){const o=[];for(let f=0;;f+=1000){const r=await fetch(u,{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();o.push(...d);if(d.length<1000)break;}return o;}
const med=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const monday=d=>{const t=new Date(d+'T00:00:00');const w=(t.getDay()+6)%7;t.setDate(t.getDate()-w);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');};
const orders=await page(`${SB}/rest/v1/orders?select=id,delivery_date&delivery_date=gte.2026-02-01`);
const dOf=new Map(orders.filter(o=>o.delivery_date).map(o=>[o.id,o.delivery_date]));
const items=await page(`${SB}/rest/v1/order_items?select=order_id,menu_code,quantity`);
const byWeek=new Map();
for(const it of items){const dd=dOf.get(it.order_id);if(!dd)continue;const c=String(it.menu_code||'');
  if(!/^(S\d+|D\d+|No\d+|A\d+|PL\d+)$/i.test(c))continue;
  const w=monday(dd);if(!byWeek.has(w))byWeek.set(w,new Map());const m=byWeek.get(w);m.set(c,(m.get(c)||0)+(Number(it.quantity)||0));}
const wkTot=new Map(); for(const [w,m] of byWeek) wkTot.set(w,[...m.values()].reduce((a,b)=>a+b,0));
const ser=new Map();
for(const [w,m] of byWeek){ if(wkTot.get(w)<30)continue; for(const [c,v] of m){ if(!ser.has(c))ser.set(c,[]); ser.get(c).push({w,s:v/wkTot.get(w)*100}); } }
const rel=[]; let n=0;
for(const [c,arr] of ser){
  if(arr.length<5)continue; n++; arr.sort((a,b)=>a.w.localeCompare(b.w));
  const base=med(arr.map(a=>a.s)); if(base<=0)continue;
  for(let i=1;i<arr.length;i++) rel.push(Math.abs(arr[i].s-arr[i-1].s)/base*100);
}
rel.sort((a,b)=>a-b); const p=x=>rel[Math.floor(rel.length*x)]||0;
console.log('③ (ชุดใหญ่) เมนูที่ขายต่อเนื่อง ≥5 สัปดาห์ = '+n+' เมนู · '+rel.length+' คู่สัปดาห์');
console.log('   สัดส่วนแกว่งจากค่ากลางตัวเอง: median '+med(rel).toFixed(0)+'%  ·  p75 '+p(.75).toFixed(0)+'%  ·  p90 '+p(.90).toFixed(0)+'%');

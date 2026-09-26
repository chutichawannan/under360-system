const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
async function page(u){const o=[];for(let f=0;;f+=1000){const r=await fetch(u,{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();if(!Array.isArray(d))throw new Error(JSON.stringify(d).slice(0,300));o.push(...d);if(d.length<1000)break;}return o;}
const med=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const monday=d=>{const t=new Date(d+'T00:00:00');const w=(t.getDay()+6)%7;t.setDate(t.getDate()-w);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');};

// ── ตรวจโครงสร้างสูตรจริงก่อน (ห้ามสรุปจาก key เดียว) ──
const kd=await page(`${SB}/rest/v1/kitchen_data?select=key,data`);
console.log('kitchen_data keys: '+kd.map(x=>x.key).join(', '));
const rec=(kd.find(x=>x.key==='recipes')||{}).data||{};
const ks=Object.keys(rec);
console.log('recipes: '+ks.length+' รหัส · ตัวอย่างโครงสร้าง:');
for(const k of ks.slice(0,3)) console.log('  '+k+' → '+JSON.stringify(rec[k]).slice(0,300));

// นับ field ที่เป็น array ในสูตร
const fieldCount=new Map();
for(const k of ks){const r=rec[k]; if(r&&typeof r==='object') for(const f of Object.keys(r)){ if(Array.isArray(r[f])&&r[f].length) fieldCount.set(f,(fieldCount.get(f)||0)+1);} }
console.log('field ที่เป็น array มีของ: '+[...fieldCount.entries()].map(([f,n])=>f+'='+n).join(' · '));

// ── ① ใหม่: ถ้าให้เลือกแค่ 10 เมนู สัดส่วนจะเบ้แค่ไหน (จำลองจากท็อป 10 ของแต่ละสัปดาห์) ──
const orders=await page(`${SB}/rest/v1/orders?select=id,delivery_date&delivery_date=gte.2026-02-01`);
const dOf=new Map(orders.filter(o=>o.delivery_date).map(o=>[o.id,o.delivery_date]));
const items=await page(`${SB}/rest/v1/order_items?select=order_id,menu_code,quantity`);
const byWeek=new Map();
for(const it of items){const dd=dOf.get(it.order_id);if(!dd)continue;const c=String(it.menu_code||'');
  if(!/^(S\d+|D\d+|No\d+|A\d+|PL\d+)$/i.test(c))continue;
  const w=monday(dd); if(!byWeek.has(w))byWeek.set(w,new Map());
  const m=byWeek.get(w); m.set(c,(m.get(c)||0)+(Number(it.quantity)||0));}

const rankShare=Array.from({length:10},()=>[]);
for(const [w,m] of byWeek){
  const s=[...m.values()].sort((a,b)=>b-a).slice(0,10);
  const t=s.reduce((a,b)=>a+b,0); if(t<30)continue;
  s.forEach((v,i)=>rankShare[i].push(v/t*100));
}
console.log('\n① ถ้าเลือกได้แค่ 10 เมนู — สัดส่วนแต่ละอันดับ (median, '+rankShare[0].length+' สัปดาห์)');
console.log('   '+rankShare.map((a,i)=>'#'+(i+1)+' '+med(a).toFixed(0)+'%').join(' · '));
const t3=med(rankShare[0])+med(rankShare[1])+med(rankShare[2]);
console.log('   Top3 รวม ≈ '+t3.toFixed(0)+'%  ·  #8-10 รวม ≈ '+(med(rankShare[7])+med(rankShare[8])+med(rankShare[9])).toFixed(0)+'%');

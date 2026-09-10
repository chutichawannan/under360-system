const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
async function page(u){const o=[];for(let f=0;;f+=1000){const r=await fetch(u,{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();if(!Array.isArray(d))throw new Error(JSON.stringify(d).slice(0,300));o.push(...d);if(d.length<1000)break;}return o;}
const med=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const monday=d=>{const t=new Date(d+'T00:00:00');const w=(t.getDay()+6)%7;t.setDate(t.getDate()-w);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');};

const menus=await page(`${SB}/rest/v1/menu_items?select=code,name,category&order=code`);
const nameOf=new Map(menus.map(m=>[m.code,m.name||'']));

const orders=await page(`${SB}/rest/v1/orders?select=id,delivery_date&delivery_date=gte.2026-02-01`);
const dOf=new Map(orders.filter(o=>o.delivery_date).map(o=>[o.id,o.delivery_date]));
const items=await page(`${SB}/rest/v1/order_items?select=order_id,menu_code,menu_name,quantity`);
const rows=[];
for(const it of items){const dd=dOf.get(it.order_id);if(!dd)continue;const c=String(it.menu_code||'');
  if(!/^(S\d+|D\d+|No\d+|A\d+|PL\d+)$/i.test(c))continue;
  rows.push({code:c,name:nameOf.get(c)||it.menu_name||'',q:Number(it.quantity)||0,w:monday(dd)});}

// ── ② ทะเล vs บก ──
const SEA=/(ปลา|กุ้ง|แซลมอน|ทะเล|หมึก|ปู|กระพง|ทูน่า|ซาบะ|หอย|ซีฟู|salmon)/i;
const LAND=/(ไก่|หมู|เนื้อ|วัว|เป็ด|แฮม|เบคอน|ไข่)/i;
let sea=0,land=0,other=0;
for(const r of rows){ if(SEA.test(r.name))sea+=r.q; else if(LAND.test(r.name))land+=r.q; else other+=r.q; }
const tot=sea+land+other;
console.log('② ทะเล vs บก (กล่อง '+tot+')');
console.log('   🐟 ทะเล '+sea+' = '+(sea/tot*100).toFixed(1)+'%   🍗 บก '+land+' = '+(land/tot*100).toFixed(1)+'%   อื่น/ผัก '+other+' = '+(other/tot*100).toFixed(1)+'%');
console.log('   เพดานที่นัทตั้ง: ทะเล 4/10 = 40%');

// per-week seafood share
const wk=new Map();
for(const r of rows){if(!wk.has(r.w))wk.set(r.w,{s:0,t:0});const o=wk.get(r.w);o.t+=r.q;if(SEA.test(r.name))o.s+=r.q;}
const seaW=[...wk.values()].filter(o=>o.t>=30).map(o=>o.s/o.t*100);
console.log('   ต่อสัปดาห์: median '+med(seaW).toFixed(1)+'%  (ต่ำสุด '+Math.min(...seaW).toFixed(1)+' · สูงสุด '+Math.max(...seaW).toFixed(1)+')');

// ── ③ ความแกว่งสัปดาห์ต่อสัปดาห์ ของเมนูเดียวกัน ──
const byMenuWeek=new Map();
for(const r of rows){const k=r.code+'|'+r.w;byMenuWeek.set(k,(byMenuWeek.get(k)||0)+r.q);}
const perMenu=new Map();
for(const [k,v] of byMenuWeek){const [c,w]=k.split('|');if(!perMenu.has(c))perMenu.set(c,[]);perMenu.get(c).push({w,v});}
const swings=[];
for(const [c,arr] of perMenu){
  if(arr.length<4)continue;                       // ต้องขายอย่างน้อย 4 สัปดาห์
  arr.sort((a,b)=>a.w.localeCompare(b.w));
  const m=med(arr.map(a=>a.v)); if(m<2)continue;  // เมนูที่ขายน้อยมาก ตัดทิ้ง (สัดส่วนบิดง่าย)
  for(let i=1;i<arr.length;i++) swings.push(Math.abs(arr[i].v-arr[i-1].v)/m*100);
}
swings.sort((a,b)=>a-b);
const p=(x)=>swings[Math.floor(swings.length*x)]||0;
console.log('\n③ ความแกว่งสัปดาห์→สัปดาห์ ของเมนูเดียวกัน ('+perMenu.size+' เมนู · '+swings.length+' คู่สัปดาห์)');
console.log('   median '+med(swings).toFixed(0)+'%   ·  p75 '+p(0.75).toFixed(0)+'%  ·  p90 '+p(0.90).toFixed(0)+'%');

// ── ④ สูตร: มีกี่เมนูที่คำนวณวัตถุดิบได้จริง ──
const kd=await page(`${SB}/rest/v1/kitchen_data?select=key,data`);
const rec=(kd.find(x=>x.key==='recipes')||{}).data||{};
const codes=Object.keys(rec);
let usable=0; const ingUse=new Map();
for(const c of codes){
  const r=rec[c]; const ing=(r&&(r.ingredients||r.items))||null;
  if(Array.isArray(ing)&&ing.length){usable++;for(const i of ing){const n=(i.name||i.ingredient||i.id||'').trim();if(n)ingUse.set(n,(ingUse.get(n)||0)+1);}}
}
console.log('\n④ สูตรใน kitchen_data.recipes: มี '+codes.length+' รหัส · ใช้คำนวณได้จริง '+usable);
const shared=[...ingUse.entries()].filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]);
console.log('   วัตถุดิบที่ใช้ร่วม ≥3 เมนู: '+shared.length+' อย่าง');
console.log('   ตัวอย่าง: '+shared.slice(0,12).map(([n,c])=>n+'('+c+')').join(' · '));

const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
async function page(u){const o=[];for(let f=0;;f+=1000){const r=await fetch(u,{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();o.push(...d);if(d.length<1000)break;}return o;}
const med=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const monday=d=>{const t=new Date(d+'T00:00:00');const w=(t.getDay()+6)%7;t.setDate(t.getDate()-w);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');};

// ③ ใหม่: วัด "สัดส่วน" ไม่ใช่ "จำนวน" — เพราะยอดรวมกล่องเรารู้อยู่แล้ว
const orders=await page(`${SB}/rest/v1/orders?select=id,delivery_date&delivery_date=gte.2026-02-01`);
const dOf=new Map(orders.filter(o=>o.delivery_date).map(o=>[o.id,o.delivery_date]));
const items=await page(`${SB}/rest/v1/order_items?select=order_id,menu_code,quantity`);
const byWeek=new Map();
for(const it of items){const dd=dOf.get(it.order_id);if(!dd)continue;const c=String(it.menu_code||'');
  if(!/^(S\d+|D\d+|No\d+|A\d+|PL\d+)$/i.test(c))continue;
  const w=monday(dd);if(!byWeek.has(w))byWeek.set(w,new Map());const m=byWeek.get(w);m.set(c,(m.get(c)||0)+(Number(it.quantity)||0));}

// สัดส่วนของเมนูนั้นในสัปดาห์นั้น (เฉพาะสัปดาห์ที่มันติดท็อป 10 = ชุดเลือกจำลอง)
const shareSeries=new Map();
const weeks=[...byWeek.keys()].sort();
for(const w of weeks){
  const m=byWeek.get(w); const top=[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10);
  const t=top.reduce((s,[,v])=>s+v,0); if(t<30)continue;
  for(const [c,v] of top){ if(!shareSeries.has(c))shareSeries.set(c,[]); shareSeries.get(c).push({w,s:v/t*100}); }
}
const swings=[];
for(const [c,arr] of shareSeries){
  if(arr.length<3)continue; arr.sort((a,b)=>a.w.localeCompare(b.w));
  for(let i=1;i<arr.length;i++) swings.push(Math.abs(arr[i].s-arr[i-1].s));   // ต่างกันกี่ "จุดเปอร์เซ็นต์"
}
swings.sort((a,b)=>a-b);
const p=x=>swings[Math.floor(swings.length*x)]||0;
console.log('③ ความแกว่งของ "สัดส่วน" (ยอดรวมกล่องรู้อยู่แล้ว) · '+shareSeries.size+' เมนู · '+swings.length+' คู่สัปดาห์');
console.log('   median '+med(swings).toFixed(1)+' จุด%  ·  p75 '+p(.75).toFixed(1)+'  ·  p90 '+p(.90).toFixed(1)+'  (ฐานเฉลี่ย 10 เมนู = 10% ต่อเมนู)');
console.log('   → เผื่อที่ p90: '+(p(.90)/10*100).toFixed(0)+'% ของยอดรายเมนู');

// ④ วัตถุดิบใช้ร่วม — จำลองชุด 10 เมนูจากสูตรที่มีจริง
const kd=await page(`${SB}/rest/v1/kitchen_data?select=key,data`);
const rec=(kd.find(x=>x.key==='recipes')||{}).data||{};
const recs=[];
for(const k of Object.keys(rec)){const r=rec[k];if(!r||typeof r!=='object')continue;
  const set=new Set(); for(const pt of (r.parts||[])) for(const l of (pt.lines||[])){const n=String(l.name||'').trim();if(n)set.add(n);}
  if(set.size>=3) recs.push([...set]);}
let shareSum=0,trials=300;
for(let t=0;t<trials;t++){
  const pick=[]; for(let i=0;i<10;i++) pick.push(recs[(t*7+i*97)%recs.length]);
  const cnt=new Map(); for(const s of pick) for(const n of s) cnt.set(n,(cnt.get(n)||0)+1);
  const shared=[...cnt.values()].filter(v=>v>=2).length;
  shareSum+=shared/cnt.size*100;
}
console.log('\n④ จำลองชุด 10 เมนู (จากสูตรที่กรอกจริง '+recs.length+' สูตร) '+trials+' รอบ');
console.log('   วัตถุดิบที่ใช้ร่วม ≥2 เมนู = '+(shareSum/trials).toFixed(0)+'% ของรายการของทั้งชุด');

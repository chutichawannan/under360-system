const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
async function page(u){const o=[];for(let f=0;;f+=1000){const r=await fetch(u,{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();o.push(...d);if(d.length<1000)break;}return o;}
const med=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const monday=d=>{const t=new Date(d+'T00:00:00');const w=(t.getDay()+6)%7;t.setDate(t.getDate()-w);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');};
const menus=await page(`${SB}/rest/v1/menu_items?select=code,name`);
const nm=new Map(menus.map(m=>[m.code,m.name||'']));
const P=[['กุ้ง',/กุ้ง/],['แซลมอน',/แซลมอน|salmon/i],['ปลา',/ปลา|กระพง|ทูน่า|ซาบะ|โอ๋|ดอลลี/],['หมึก/ทะเลอื่น',/หมึก|ปู|หอย|ซีฟู/],
          ['ไก่',/ไก่/],['หมู',/หมู/],['เนื้อ',/เนื้อ|วัว|สเต็ก/],['ไข่',/ไข่/],['เต้าหู้/เจ',/เต้าหู้|เห็ด|ผัก|มังสวิรัติ|เจ$/]];
const pro=n=>{for(const [k,re] of P) if(re.test(n)) return k; return 'อื่นๆ';};
const orders=await page(`${SB}/rest/v1/orders?select=id,delivery_date&delivery_date=gte.2026-02-01`);
const dOf=new Map(orders.filter(o=>o.delivery_date).map(o=>[o.id,o.delivery_date]));
const items=await page(`${SB}/rest/v1/order_items?select=order_id,menu_code,quantity`);
const wk=new Map();
for(const it of items){const dd=dOf.get(it.order_id);if(!dd)continue;const c=String(it.menu_code||'');
  if(!/^(S\d+|D\d+|No\d+|A\d+|PL\d+)$/i.test(c))continue;
  const w=monday(dd),k=pro(nm.get(c)||'');
  if(!wk.has(w))wk.set(w,new Map());const m=wk.get(w);m.set(k,(m.get(k)||0)+(Number(it.quantity)||0));}
const tot=new Map();for(const [w,m] of wk)tot.set(w,[...m.values()].reduce((a,b)=>a+b,0));
const ser=new Map();
for(const [w,m] of wk){if(tot.get(w)<30)continue;for(const [k,v] of m){if(!ser.has(k))ser.set(k,[]);ser.get(k).push({w,s:v/tot.get(w)*100});}}
console.log('③b ความแกว่งระดับ "ชนิดโปรตีน" (สั่งของจริงสั่งเป็นชนิด ไม่ใช่รายเมนู)');
console.log('ชนิด          | สัดส่วน median | แกว่ง median | แกว่ง p90');
console.log('-'.repeat(62));
const allSw=[];
for(const [k,arr] of [...ser.entries()].sort((a,b)=>med(b[1].map(x=>x.s))-med(a[1].map(x=>x.s)))){
  if(arr.length<5)continue; arr.sort((a,b)=>a.w.localeCompare(b.w));
  const base=med(arr.map(a=>a.s)); const sw=[];
  for(let i=1;i<arr.length;i++) sw.push(Math.abs(arr[i].s-arr[i-1].s)/base*100);
  sw.sort((a,b)=>a-b); allSw.push(...sw);
  console.log(k.padEnd(14)+'| '+(base.toFixed(1)+'%').padEnd(15)+'| '+(med(sw).toFixed(0)+'%').padEnd(13)+'| '+(sw[Math.floor(sw.length*.9)]||0).toFixed(0)+'%');
}
allSw.sort((a,b)=>a-b);
console.log('\nรวมทุกชนิด: median '+med(allSw).toFixed(0)+'%  ·  p75 '+(allSw[Math.floor(allSw.length*.75)]||0).toFixed(0)+'%  ·  p90 '+(allSw[Math.floor(allSw.length*.9)]||0).toFixed(0)+'%');

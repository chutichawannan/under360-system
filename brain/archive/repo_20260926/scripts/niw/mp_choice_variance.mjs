/**
 * ตอบคำถามนัท 20 ส.ค.: "ถ้าให้ลูกค้าเลือกเมนูเอง จะสั่งของมาสต็อคเท่าไหร่"
 * ใช้พฤติกรรมจริงจาก order_items — เมนูสต็อค (S/D/No) = ลูกค้าเลือกอิสระอยู่แล้ว = proxy ที่ตรงที่สุด
 * รัน: node scripts/niw/mp_choice_variance.mjs
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

async function page(url){const out=[];for(let f=0;;f+=1000){const r=await fetch(url,{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();if(!Array.isArray(d))throw new Error(JSON.stringify(d).slice(0,300));out.push(...d);if(d.length<1000)break;}return out;}
const med=a=>{if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y);const m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};

// ── ดึงออเดอร์ 6 เดือนล่าสุด ──
const SINCE='2026-02-01';
const orders=await page(`${SB}/rest/v1/orders?select=id,delivery_date,total,source&delivery_date=gte.${SINCE}&order=delivery_date`);
const okOrd=new Map();
for(const o of orders){ if(!o.delivery_date) continue; okOrd.set(o.id,o.delivery_date); }
console.log('ออเดอร์ตั้งแต่ '+SINCE+': '+okOrd.size);

const items=await page(`${SB}/rest/v1/order_items?select=order_id,menu_code,menu_name,quantity&order=order_id`);
console.log('order_items ทั้งหมด: '+items.length);

// เอาเฉพาะเมนูสต็อคที่ลูกค้าเลือกเอง (S/D/No) ในช่วงเวลานี้
const rows=[];
for(const it of items){
  const dd=okOrd.get(it.order_id); if(!dd) continue;
  const c=String(it.menu_code||'');
  if(!/^(S\d+|D\d+|No\d+|A\d+|BJ\d*|PL\d+)$/i.test(c)) continue;
  rows.push({code:c,name:it.menu_name,q:Number(it.quantity)||0,date:dd});
}
console.log('บรรทัดเมนูสต็อคที่นับได้: '+rows.length+'  (กล่องรวม '+rows.reduce((s,r)=>s+r.q,0)+')');

// สัปดาห์ (จันทร์)
const monday=d=>{const t=new Date(d+'T00:00:00');const w=(t.getDay()+6)%7;t.setDate(t.getDate()-w);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');};

// ── ① ความกระจุกตัว: ต่อสัปดาห์ อันดับ 1-3 กินกี่ % ──
const byWeek=new Map();
for(const r of rows){const w=monday(r.date);if(!byWeek.has(w))byWeek.set(w,new Map());const m=byWeek.get(w);m.set(r.code,(m.get(r.code)||0)+r.q);}
const weeks=[...byWeek.keys()].sort();
const share=[],shareTop5=[],tailShare=[],menuCount=[];
for(const w of weeks){
  const m=byWeek.get(w);const tot=[...m.values()].reduce((a,b)=>a+b,0);
  if(tot<30)continue;
  const sorted=[...m.values()].sort((a,b)=>b-a);
  share.push(sorted.slice(0,3).reduce((a,b)=>a+b,0)/tot*100);
  shareTop5.push(sorted.slice(0,5).reduce((a,b)=>a+b,0)/tot*100);
  tailShare.push(sorted.slice(10).reduce((a,b)=>a+b,0)/tot*100);
  menuCount.push(m.size);
}
console.log('\n① กระจุกตัว (ต่อสัปดาห์ · '+share.length+' สัปดาห์ที่นับได้)');
console.log('   Top3 กินสัดส่วน  median '+med(share).toFixed(1)+'%  (ต่ำสุด '+Math.min(...share).toFixed(1)+' · สูงสุด '+Math.max(...share).toFixed(1)+')');
console.log('   Top5 กินสัดส่วน  median '+med(shareTop5).toFixed(1)+'%');
console.log('   อันดับ 11 ลงไป   median '+med(tailShare).toFixed(1)+'%');
console.log('   จำนวนเมนูที่ขายได้ต่อสัปดาห์ median '+med(menuCount));

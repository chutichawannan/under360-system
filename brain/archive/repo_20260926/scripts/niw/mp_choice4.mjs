const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
async function page(u){const o=[];for(let f=0;;f+=1000){const r=await fetch(u,{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();o.push(...d);if(d.length<1000)break;}return o;}
const kd=await page(`${SB}/rest/v1/kitchen_data?select=key,data`);
const rec=(kd.find(x=>x.key==='recipes')||{}).data||{};
const menus=await page(`${SB}/rest/v1/menu_items?select=code,name,is_available`);
const online=new Set(menus.filter(m=>m.is_available).map(m=>m.code));

let withLines=0, withCode=0, onlineWithLines=0;
const ingUse=new Map(); const perRecipe=[];
for(const k of Object.keys(rec)){
  const r=rec[k]; if(!r||typeof r!=='object')continue;
  const lines=[];
  for(const p of (r.parts||[])) for(const l of (p.lines||[])) { const n=String(l.name||'').trim(); if(n) lines.push(n); }
  if(lines.length) withLines++;
  if(r.code) withCode++;
  if(lines.length && r.code && online.has(r.code)) { onlineWithLines++; perRecipe.push({code:r.code,name:r.name,lines}); }
  if(lines.length) for(const n of new Set(lines)) ingUse.set(n,(ingUse.get(n)||0)+1);
}
console.log('สูตรทั้งหมด '+Object.keys(rec).length);
console.log('  มีบรรทัดวัตถุดิบจริง       '+withLines);
console.log('  มี code ผูกกับเมนู          '+withCode);
console.log('  🔑 มีทั้งสูตร+code+เปิดขาย  '+onlineWithLines+'  (จากเมนูเปิดขาย '+online.size+')');
const shared=[...ingUse.entries()].filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]);
console.log('\nวัตถุดิบที่ใช้ร่วม ≥3 สูตร: '+shared.length+' อย่าง (จากทั้งหมด '+ingUse.size+')');
console.log('Top20: '+shared.slice(0,20).map(([n,c])=>n+'('+c+')').join(' · '));

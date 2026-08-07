const fs=require('fs'),SP=process.argv[2];
const SB="https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1";
const K="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8";
const H={apikey:K,'Content-Type':'application/json'};
const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const lbl=s=>{const a=new Date(s+'T00:00:00'),b=new Date(a);b.setDate(b.getDate()+6);return a.getDate()+'-'+b.getDate()+' '+M[b.getMonth()];};
const sheet=require(SP+'/weeks_sheet.json');
(async()=>{
 // code → สัปดาห์ล่าสุดที่โผล่ในชีท (นัทสั่ง: ไล่จากล่าสุดก่อน)
 const map={}, subMap={};
 Object.keys(sheet).sort().forEach(w=>sheet[w].items.forEach(it=>{
   if(!/^[SD][1-8]$/i.test(it.sub||'')) return;      // เอาเฉพาะช่องที่มีเลข S1-S8 / D1-D5
   map[it.code]=w; subMap[it.code]=it.sub.toUpperCase();
 }));
 // ชีทเรียกบางจานด้วยรหัสที่ DB ไม่มี — ผูกให้ตรงจาน (ชื่อเมนูเหมือนกันเป๊ะ)
 const ALIAS={D200:"A18"};
 Object.entries(ALIAS).forEach(([sheetCode,dbCode])=>{ if(map[sheetCode]&&!map[dbCode]){ map[dbCode]=map[sheetCode]; subMap[dbCode]=subMap[sheetCode]; } });
 const menus=await (await fetch(SB+'/menu_items?select=code,name,category,subcode,is_available&limit=2000',{headers:H})).json();
 const live=menus.filter(m=>m.is_available);
 const tags={}; let hit=0, missCode=0;
 live.forEach(m=>{ if(map[m.code]){ tags[m.code]=map[m.code]; hit++; } });
 // เมนูหมุนที่ขายอยู่แต่ชีทไม่มี
 const orphan=live.filter(m=>/^[SD]\d/.test(m.code)&&!map[m.code]);
 const r=await fetch(SB+'/kitchen_data',{method:'POST',headers:{...H,Prefer:'return=minimal,resolution=merge-duplicates'},
   body:JSON.stringify({key:'menu_special_weeks',data:tags,updated_at:new Date().toISOString()})});
 console.log('ชีทมี '+Object.keys(map).length+' เมนูที่เคยเป็นเมนูพิเศษ (29 สัปดาห์)');
 console.log('เขียนแท็ก: HTTP '+r.status+' → ติดให้เมนูที่ขายอยู่ '+hit+' ตัว\n');
 const byW={}; Object.entries(tags).forEach(([c,w])=>(byW[w]=byW[w]||[]).push(c));
 Object.keys(byW).sort().reverse().forEach(w=>console.log('  '+lbl(w).padEnd(12)+byW[w].length+' เมนู : '+byW[w].join(' ')));
 console.log('\nเมนูรหัส S*/D* ที่ขายอยู่แต่ไม่มีในชีทเลย '+orphan.length+' ตัว:');
 orphan.forEach(m=>console.log('  '+m.code.padEnd(6)+String(m.name).slice(0,30)));
 // ชื่อเล่นในชีท vs ใน DB ตรงกันไหม (เฉพาะสัปดาห์ปัจจุบัน)
 const cw='2026-08-03';
 console.log('\nเทียบชื่อเล่นสัปดาห์นี้ (ชีท vs DB):');
 live.filter(m=>tags[m.code]===cw).forEach(m=>{
   const s=subMap[m.code]||'-', d=(m.subcode||'-').toUpperCase();
   console.log('  '+m.code.padEnd(6)+'ชีท='+s.padEnd(4)+'DB='+d.padEnd(4)+(s===d?'✓':'⚠ ไม่ตรง'));
 });
})();

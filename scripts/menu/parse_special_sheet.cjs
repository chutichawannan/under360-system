const fs=require('fs'),SP=process.argv[2];
const txt=fs.readFileSync(SP+'/sp.csv','utf8');
// CSV parser รองรับ field ที่มี newline/comma ในเครื่องหมายคำพูด
function parseCSV(s){const rows=[];let row=[],f='',q=false;
 for(let i=0;i<s.length;i++){const c=s[i];
  if(q){ if(c==='"'){ if(s[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
  else if(c==='"') q=true;
  else if(c===','){row.push(f);f='';}
  else if(c==='\n'){row.push(f);f='';rows.push(row);row=[];}
  else if(c!=='\r') f+=c;
 } if(f||row.length){row.push(f);rows.push(row);} return rows;}
const rows=parseCSV(txt);
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
// "340.\n27-2/8/2026" → วันจันทร์ต้นสัปดาห์
function weekFromCell(v){
  const m=String(v||'').match(/(\d+)\.?\s*[\r\n]*\s*(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if(!m) return null;
  const [,no,d1,d2,mo,yr]=m.map(Number.isNaN?x=>x:x=>x);
  const endM=parseInt(m[4],10), endD=parseInt(m[3],10), y=parseInt(m[5],10), startD=parseInt(m[2],10);
  const end=new Date(y,endM-1,endD);
  const start=new Date(end); start.setDate(start.getDate()-6);
  if(start.getDate()!==startD){ /* ข้ามเดือน — ยึด end-6 อยู่แล้วถูก */ }
  return {no:m[1], start:ymd(start), end:ymd(end)};
}
let cur=null; const out={};
rows.forEach(r=>{
  const w=weekFromCell(r[0]); if(w) cur=w;
  if(!cur) return;
  const push=(code,sub)=>{ if(!code||!/^[A-Za-z]+\d/.test(code)) return;
    (out[cur.start]=out[cur.start]||{no:cur.no,items:[]}).items.push({code:code.trim().toUpperCase(),sub}); };
  push(r[4], (r[1]||'').trim());     // ฝั่งข้าวกล่อง: No.=col1  SKU=col4
  push(r[16],(r[13]||'').trim());    // ฝั่งแพ็คกับข้าว: No.=col13 SKU=col16
});
const weeks=Object.keys(out).sort().reverse();
console.log('อ่านชีท "Special 2026" ได้ '+weeks.length+' สัปดาห์ · ล่าสุด → เก่าสุด\n');
weeks.slice(0,6).forEach(w=>{
  const g=out[w];
  console.log('  สัปดาห์ '+g.no+' เริ่ม '+w+' ('+g.items.length+' เมนู): '+g.items.map(i=>(i.sub?i.sub+'=':'')+i.code).join(' · '));
});
console.log('  ... รวมทั้งหมด '+Object.values(out).reduce((s,g)=>s+g.items.length,0)+' รายการ');
fs.writeFileSync(SP+'/weeks_sheet.json',JSON.stringify(out));

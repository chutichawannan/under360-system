// แพลนเมนูรายสัปดาห์ — แหล่งกลางที่ทุกห้องใช้ร่วมกัน (นัทสั่ง 17 ก.ย. 2026)
// ดึงจาก: ① ชีท "all menu" แท็บ Special 2026 + Special2024-25 (ของนัท)  ② kitchen_data.weekly_subcode_plan (สัปดาห์ที่ชีทยังไม่มี)
// เขียนออก: doc/weekly_menu_plan/plan.json (เครื่องอ่าน) + README.md (คนอ่าน)
// รัน: node scripts/niw/build_weekly_plan.mjs
import fs from 'fs';
const OUT='doc/weekly_menu_plan';
const SHEET='16BHkCegHHTcOQkgDqPHlDRvW0fLu1nOKLBZpQ9PmNM4';
const TABS=[{name:'Special 2026',gid:'628970151',col:{week:0,slot:1,sname:2,scode:4,dslot:13,dname:14,dcode:16}},
            {name:'Special2024-25',gid:'1401685042',col:{week:0,slot:3,sname:4,scode:5,dslot:14,dname:15,dcode:16}}];
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K};
const g=async(u,r)=>{const h={...H};if(r)h.Range=r;return (await fetch(SB+'/rest/v1/'+u,{headers:h})).json();};
function csv(t){const rows=[];let r=[],f='',q=false;for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++;}else q=false;}else f+=c;}else if(c=='"')q=true;else if(c==','){r.push(f);f='';}else if(c=='\n'){r.push(f);rows.push(r);r=[];f='';}else if(c!='\r')f+=c;}if(f||r.length){r.push(f);rows.push(r);}return rows;}
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
function parseDate(label){
  const m=clean(label).match(/(\d{1,2})\s*-\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{2,4})/);
  if(!m)return null;
  let d=+m[1],mo=+m[3],y=+m[4];
  if(+m[1]>+m[2])mo-=1;                 // ข้ามเดือน เช่น 27-2/8 = 27 ก.ค.
  if(y===58)y=68;                        // พิมพ์ผิดในชีท: 58 = 68
  if(y<100)y+=1957; else if(y>2400)y-=543; // พ.ศ. 2 หลัก/4 หลัก → ค.ศ.
  if(mo<1){mo=12;y-=1;}
  return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
const rows=[];
for(const tab of TABS){
  const t=await (await fetch(`https://docs.google.com/spreadsheets/d/${SHEET}/export?format=csv&gid=${tab.gid}`)).text();
  let week=null,label=null;const c=tab.col;
  for(const r of csv(t)){
    const lab=clean(r[c.week]);const pd=lab?parseDate(lab):null;
    if(pd){week=pd;label=lab.replace(/^\d+\.\s*/,'');}
    const slot=clean(r[c.slot]);if(!week||!/^S\d$/i.test(slot))continue;
    const e={week_start:week,week_label:label,slot:slot.toUpperCase(),s_code:clean(r[c.scode])||null,s_name:clean(r[c.sname]),source:'ชีท all menu / '+tab.name};
    if(e.s_code&&!/^S\d{3}/i.test(e.s_code))e.s_code=null;
    const ds=clean(r[c.dslot]);
    if(/^D\d$/i.test(ds)){e.d_slot=ds.toUpperCase();e.d_code=clean(r[c.dcode])||null;e.d_name=clean(r[c.dname]);if(e.d_code&&!/^D\d{3}/i.test(e.d_code))e.d_code=null;}
    rows.push(e);
  }
}
let menus=[],p=0;for(;;){const b=await g('menu_items?select=code,name',`${p}-${p+999}`);menus=menus.concat(b);if(b.length<1000)break;p+=1000;}
const nz=s=>String(s||'').replace(/\(.*?\)|NEW|ใหม่/gi,'').replace(/[\s​+]/g,'').replace(/ซีอิ้ว/g,'ซีอิ๊ว');
const byName=new Map();menus.forEach(m=>{const k=nz(m.name);if(!byName.has(k))byName.set(k,[]);byName.get(k).push(m.code);});
const nameOf=new Map(menus.map(m=>[m.code,m.name]));
for(const e of rows){
  if(!e.s_code){const x=(byName.get(nz(e.s_name))||[]).find(v=>/^S/.test(v));if(x){e.s_code=x;e.s_code_by='เทียบชื่อ';}}
  if(e.d_slot&&!e.d_code){const x=(byName.get(nz(e.d_name))||[]).find(v=>/^D/.test(v));if(x){e.d_code=x;e.d_code_by='เทียบชื่อ';}}
}
const plan=((await g('kitchen_data?select=data&key=eq.weekly_subcode_plan'))[0]||{}).data||{};
const have=new Set(rows.map(e=>e.week_start));
for(const [wk,sl] of Object.entries(plan)){ if(have.has(wk))continue;
  for(let i=1;i<=8;i++){const sc=sl['S'+i];if(!sc)continue;
    const e={week_start:wk,week_label:wk,slot:'S'+i,s_code:sc,s_name:nameOf.get(sc)||'',source:'ระบบเรา / weekly_subcode_plan'};
    if(sl['D'+i]){e.d_slot='D'+i;e.d_code=sl['D'+i];e.d_name=nameOf.get(sl['D'+i])||'';}rows.push(e);} }
rows.sort((a,b)=>b.week_start.localeCompare(a.week_start)||a.slot.localeCompare(b.slot));
fs.mkdirSync(OUT,{recursive:true});
fs.writeFileSync(OUT+'/plan.json',JSON.stringify({generated_at:new Date().toISOString(),rows},null,1));
const weeks=[...new Set(rows.map(e=>e.week_start))];
const asc=[...weeks].sort();const gaps=[];for(let i=1;i<asc.length;i++){if((new Date(asc[i])-new Date(asc[i-1]))/864e5>8)gaps.push(`${asc[i-1]} → ${asc[i]}`);}
const lastUse={};[...rows].reverse().forEach(e=>{[e.s_code,e.d_code].forEach(c=>{if(c)lastUse[c]=e.week_label;});});
let md=`# 📅 แพลนเมนูรายสัปดาห์ (S1–S8 / D1–D5)\n\n`+
`> **ที่เก็บกลางที่ทุกห้องใช้ร่วมกัน · นัทใช้ดูเองด้วย** — นัทสั่ง 17 ก.ย. 2026\n`+
`> สร้างจาก \`scripts/niw/build_weekly_plan.mjs\` · อัปเดตล่าสุด ${new Date().toISOString().slice(0,10)}\n\n`+
`**แหล่งข้อมูล:** ① ชีท [all menu](https://docs.google.com/spreadsheets/d/${SHEET}) แท็บ Special 2026 + Special2024-25 (ของนัท) ② ระบบเรา \`kitchen_data.weekly_subcode_plan\` สำหรับสัปดาห์ที่ชีทยังไม่มี\n\n`+
`**ขอบเขต:** ${asc[0]} → ${asc.at(-1)} · ${weeks.length} สัปดาห์ · ${rows.length} แถว\n\n`+
`⚠️ **ช่วงที่ไม่มีข้อมูล (ไม่ได้แปลว่าไม่ได้ขาย):** ${gaps.join(' · ')}\n\n`+
`⚠️ รหัสที่เติมจาก "เทียบชื่อ" (ชีทไม่ได้ใส่รหัสไว้) มีโอกาสผิด — ดูช่อง \`s_code_by\`/\`d_code_by\` ใน plan.json · ยังไม่มีรหัส S ${rows.filter(e=>!e.s_code).length} แถว · D ${rows.filter(e=>e.d_slot&&!e.d_code).length} แถว\n\n---\n\n`;
for(const w of weeks){const r=rows.filter(e=>e.week_start===w);
  md+=`## ${r[0].week_label} (${w})\n\n| ช่อง | ข้าวกล่อง | แพคกับข้าว |\n|---|---|---|\n`;
  r.forEach(e=>md+=`| ${e.slot} | ${e.s_code||'—'} ${e.s_name} | ${e.d_slot?`${e.d_code||'—'} ${e.d_name}`:''} |\n`);
  md+=`\n`;}
fs.writeFileSync(OUT+'/README.md',md);
const idx=Object.entries(lastUse).sort((a,b)=>a[0].localeCompare(b[0],'en',{numeric:true}));
fs.writeFileSync(OUT+'/LAST_USED.md',`# 🕒 เมนูแต่ละตัวขึ้นแพลนล่าสุดสัปดาห์ไหน\n\n> ใช้ตอนคัดเมนูสัปดาห์ใหม่ · นับจากแพลน ไม่ใช่ออเดอร์จริง · สร้างจาก \`scripts/niw/build_weekly_plan.mjs\`\n\n| รหัส | เมนู | ขึ้นแพลนล่าสุด |\n|---|---|---|\n`+idx.map(([c,w])=>`| ${c} | ${nameOf.get(c)||''} | ${w} |`).join('\n')+'\n');
console.log(`✅ ${weeks.length} สัปดาห์ · ${rows.length} แถว · ${asc[0]} → ${asc.at(-1)} · เมนูที่มีประวัติ ${idx.length}`);

#!/usr/bin/env node
/**
 * นำสูตรที่นัทส่งมา (docs/RECIPES_FROM_NUT_20260915.md · กะปันถอดโครงสร้างให้) เข้าคลังสูตร
 *   node scripts/fah_import_nut_recipes.mjs            ดูอย่างเดียว
 *   node scripts/fah_import_nut_recipes.mjs --write    เขียนจริง
 *
 * 🔒 กติกาที่ยึด (กฎเดิมของบ้าน + ที่กะปันกำชับ):
 *   · ลงเป็น "สูตรใหม่ไม่ผูกรหัสเมนู" เสมอ — ห้ามทับสูตรเดิมที่มีวัตถุดิบอยู่แล้ว
 *   · ไม่เดา LC/HP · ไม่เดาจำนวนที่ · ไม่เติมตัวเลขที่ต้นฉบับไม่มี · ไม่แก้คำที่สะกดเพี้ยน
 *     (ฟ้าไม่ใช่คนรู้สูตร — คนที่รู้คือนัท/ครัว · ติดธงไว้ให้คนตัดสินทีหลัง)
 *   · สำรองคลังก่อนเขียนทุกครั้ง
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const U='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const WRITE=process.argv.includes('--write');
const SRC='docs/RECIPES_FROM_NUT_20260915.md';

const blocks=readFileSync(SRC,'utf8').split(/^## /m).slice(1);
const parsed=[];
for(const b of blocks){
  const name=b.split(/\r?\n/)[0].trim();
  if(!name||/^สรุปก่อนลงมือ/.test(name)) continue;
  const lines=[]; let serves='';
  for(const row of b.split(/\r?\n/)){
    const m=row.match(/^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/);
    if(!m) continue;
    const ing=m[1].trim(), qty=m[2].trim(), unit=m[3].trim();
    if(ing==='วัตถุดิบ'||/^-+$/.test(ing)) continue;
    const sv=ing.match(/สูตร\s*([0-9]+)\s*ที/); if(sv){ serves=sv[1]; continue; }
    const n=Number(qty.replace(/,/g,''));
    lines.push({ name: ing, qty: Number.isFinite(n)&&qty!=='—'? n : '', unit: /กรัม/.test(unit)?'g':(unit.replace(/\*|⚠️|ไม่มีตัวเลข\/อ่านไม่ออก/g,'').trim()||'') });
  }
  if(lines.length) parsed.push({name,serves,lines});
}
console.log(`อ่านจากไฟล์ได้ ${parsed.length} สูตร`);
parsed.forEach(p=>console.log(`  ${p.name.padEnd(28)} ${String(p.lines.length).padStart(2)} บรรทัด · ${p.serves?('สูตร '+p.serves+' ที่'):'⚠️ ไม่บอกจำนวนที่'} · ไม่มีตัวเลข ${p.lines.filter(l=>l.qty==='').length} บรรทัด`));

const cur=(await (await fetch(U+'/rest/v1/kitchen_data?select=data&key=eq.recipes',{headers:H})).json())[0].data;
console.log(`\nคลังตอนนี้ ${cur.length} สูตร`);
const dup=parsed.filter(p=>cur.some(x=>String(x.name||'').trim()===p.name));
if(dup.length) console.log('ชื่อซ้ำกับคลัง (ไม่ทับ · ลงเป็นตัวใหม่ไม่ผูกรหัส):',dup.map(d=>d.name).join(' · '));

if(!WRITE){ console.log('\n(ดูอย่างเดียว — ยังไม่เขียน)'); process.exit(0); }
const dir='C:/Users/PP/Desktop/under360_backups/2026-09-15_before_nut_recipes';
mkdirSync(dir,{recursive:true});
writeFileSync(dir+'/recipes_before.json',JSON.stringify(cur));
console.log('สำรองแล้ว:',dir,`(${cur.length} สูตร)`);

const now=new Date().toISOString();
const add=parsed.map((p,i)=>({
  id:'nut'+Date.now()+i,
  code:'',                                   // ไม่ผูกรหัส — รอคนยืนยันว่า LC/HP ตัวไหน
  name:p.name,
  category:'', categories:[],
  parts:[{label:p.serves?('สูตรนี้ได้ '+p.serves+' ที่'):'', lines:p.lines, instructions:''}],
  notes:'จากนัท 15 ก.ย. 2026'+(p.serves?(' · สูตร '+p.serves+' ที่'):' · ⚠️ ไม่ได้บอกจำนวนที่')+' · ⚠️ รอยืนยันว่าเป็น LC หรือ HP · คำสะกดคงตามต้นฉบับ',
  updated_at:now, updated_by:'ห้องฟ้า (นำเข้าจากนัท)'
}));
const next=cur.concat(add);
const res=await fetch(U+'/rest/v1/kitchen_data?key=eq.recipes',{method:'PATCH',headers:H,body:JSON.stringify({data:next,updated_at:now})});
console.log('เขียน:',res.status);
const back=(await (await fetch(U+'/rest/v1/kitchen_data?select=data&key=eq.recipes',{headers:H})).json())[0].data;
console.log(`อ่านกลับ: ${back.length} สูตร (เดิม ${cur.length} + ใหม่ ${add.length})`);
console.log('สูตรใหม่ที่มีวัตถุดิบจริง:',back.filter(x=>String(x.updated_by||'').includes('นำเข้าจากนัท')&&(x.parts||[]).some(q=>(q.lines||[]).length)).length);

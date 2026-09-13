#!/usr/bin/env node
/**
 * 🚫 ลูกค้าย้ายวัน = ห้ามย้ายเมนูมาด้วย (กฎนัท 13 ก.ย. 2026)
 *   node scripts/fah_strip_carried_menus.mjs            ดูอย่างเดียว
 *   node scripts/fah_strip_carried_menus.mjs --write    เขียนจริง
 *
 * เมนูของแต่ละวันต้องเป็น "ชุดของวันนั้น" เท่านั้น · ใครถือเมนูของวันอื่นติดมา = เปลี่ยนเป็นเมนูของวันนี้
 * ชุดของวันนั้น = โค้ดที่ฟ้าจัดให้ (by:'fah') — ตัวที่ลูกค้าเลือกเองจากชุดของวันนั้นถือว่าอยู่ในชุด
 */
const U='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json'};
const q=async p=>{const r=await fetch(U+'/rest/v1/'+p,{headers:H});const j=await r.json();return Array.isArray(j)?j:[]};
const WRITE=process.argv.includes('--write');
const today=new Date(Date.now()+7*3600e3).toISOString().slice(0,10);
const rows=(await q(`mp_deliveries?select=id,customer_name,mp_type,delivery_date,box_count,status,menu_items&delivery_date=gte.${today}&limit=400`))
  .filter(r=>r.status!=='cancelled'&&r.status!=='skip_requested');
const byDay={}; rows.forEach(r=>(byDay[r.delivery_date]=byDay[r.delivery_date]||[]).push(r));
let total=0;
for(const date of Object.keys(byDay).sort()){
  const list=byDay[date];
  const src={};
  list.forEach(r=>(r.menu_items||[]).forEach(i=>{const c=String(i.code||'').replace(/^(LC|HP|HX)/,'');if(!c)return;const o=src[c]=src[c]||{cust:0,fah:0,name:i.name};i.by==='customer'?o.cust++:o.fah++;}));
  const core=Object.entries(src).filter(([,v])=>v.fah>0).sort((a,b)=>(b[1].fah+b[1].cust)-(a[1].fah+a[1].cust)).map(([c])=>c);
  const carried=Object.entries(src).filter(([,v])=>v.fah===0).map(([c])=>c);
  if(!carried.length) continue;
  console.log(`\n${date} · ชุดของวัน ${core.length} เมนู · เมนูที่ถือข้ามวันมา ${carried.length}: ${carried.join(',')}`);
  for(const r of list){
    const items=(r.menu_items||[]).slice(); let changed=false;
    items.forEach((it,idx)=>{
      const c=String(it.code||'').replace(/^(LC|HP|HX)/,'');
      if(!carried.includes(c)) return;
      // 🔴 กฎนัท 13 ก.ย. 2026: ผลกระทบของงานนี้ลงที่ครัวเท่านั้น **ลูกค้าห้ามรับผลกระทบ**
      //    ลูกค้ากดเลือกเมนูเอง = ต้องได้ตามนั้น ถึงจะเป็นเมนูนอกชุดของวันก็ตาม (ครัวรับภาระทำเพิ่ม)
      //    ที่ล้างได้คือเมนูที่ "ระบบ/ฟ้า" ใส่ให้เท่านั้น — ห้ามแตะของลูกค้าเด็ดขาด
      if(it.by==="customer") { console.log(); return; }
      const have=new Set(items.map(x=>String(x.code||'').replace(/^(LC|HP|HX)/,'')));
      const pick=core.find(p=>!have.has(p));
      if(!pick){console.log(`   ⚠️ ${r.customer_name} — ไม่มีเมนูของวันเหลือให้แทน`);return;}
      const pre=r.mp_type==='lc'?'LC':'HP';
      items[idx]={code:pre+pick,name:src[pick].name||pick,qty:it.qty||1,by:'fah',note:`แทน ${c} — เมนูของวันอื่นติดมาตอนย้ายวัน`};
      console.log(`   ${String(r.customer_name).trim().padEnd(24)} ${pre} · ${c}→${pick} (${items[idx].name})`);
      changed=true; total++;
    });
    if(changed&&WRITE){
      const res=await fetch(`${U}/rest/v1/mp_deliveries?id=eq.${r.id}`,{method:'PATCH',headers:H,body:JSON.stringify({menu_items:items,admin_notes:`🤖 ฟ้าคืนเมนูให้เป็นชุดของวัน ${date} (กฎ: ย้ายวันห้ามย้ายเมนู)`,updated_at:new Date().toISOString()})});
      if(res.status>=300) console.log('      ❌',res.status);
    }
  }
}
console.log(`\n${WRITE?'✅ เขียนจริง':'(ดูอย่างเดียว)'} — แก้ ${total} กล่อง`);

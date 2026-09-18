/**
 * f-track — สร้างหน้าเว็บให้นัทไล่ตรวจ "ชนิดวัตถุดิบ" จากมือถือ (แทนการเปิด CSV)
 * นัทสั่ง 18 ก.ย. 2026: "ส่ง CSV 88KB มาให้ไล่ = ใช้ไม่ได้จริง"
 *
 * หน้าเว็บ = ไฟล์เดียวจบ (ฝังข้อมูลไว้ในไฟล์เลย ไม่ต้องรอโหลด)
 * คำตอบเก็บลง Supabase kitchen_data key `f_ingredient_kinds_review` (กดบันทึกเอง · มี localStorage กันหาย)
 */
import { readCsv } from './catalog.mjs';
import fs from 'node:fs';

const rows = readCsv('docs/INGREDIENT_KINDS_REVIEW.csv').map((c) => ({
  c: c[0], n: c[1], sku: +c[2], s: c[3], days: c[5], baht: +c[6], names: c[8].split(' | '),
}));

const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ตรวจลิสต์วัตถุดิบ · Under360</title>
<style>
:root{--bg:#0f1115;--card:#181b22;--line:#262b36;--tx:#e8eaf0;--dim:#8c94a6;--ok:#2ecc71;--bad:#ff5c5c;--warn:#ffc043}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.5 -apple-system,"Segoe UI",sans-serif;padding-bottom:88px}
header{position:sticky;top:0;background:#0f1115ee;backdrop-filter:blur(8px);padding:12px 16px;border-bottom:1px solid var(--line);z-index:5}
h1{font-size:17px;margin:0 0 8px}
.sub{color:var(--dim);font-size:13px}
.tabs{display:flex;gap:6px;overflow-x:auto;padding:10px 16px 0;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}
.tab{white-space:nowrap;padding:8px 12px;border-radius:999px;background:var(--card);border:1px solid var(--line);color:var(--dim);font-size:14px}
.tab.on{background:#2b3140;color:var(--tx);border-color:#3b4354}
main{padding:12px 16px}
.it{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px}
.it.ok{border-color:#1f6b40}.it.bad{border-color:#7a2a2a}
.nm{font-weight:600}
.meta{color:var(--dim);font-size:12.5px;margin-top:3px}
.skus{margin-top:8px;font-size:13px;color:#b9c0d0;display:none}
.it.open .skus{display:block}
.skus div{padding:3px 0;border-top:1px dashed var(--line)}
.btns{display:flex;gap:8px;margin-top:10px}
button{flex:1;padding:10px;border-radius:10px;border:1px solid var(--line);background:#20242d;color:var(--tx);font:inherit;font-size:14px}
button.y.on{background:#17482e;border-color:var(--ok)}
button.n.on{background:#4a1c1c;border-color:var(--bad)}
.save{position:fixed;left:0;right:0;bottom:0;padding:12px 16px;background:#0f1115ee;border-top:1px solid var(--line);display:flex;gap:10px;align-items:center}
.save button{background:#2563eb;border:0;font-weight:600}
.cnt{color:var(--dim);font-size:13px;white-space:nowrap}
</style></head><body>
<header>
  <h1>ตรวจลิสต์วัตถุดิบ — ผมยุบ SKU เอง ถูกไหม</h1>
  <div class="sub">แตะการ์ดเพื่อดูว่ารวมชื่ออะไรไว้บ้าง · กด <b>ไม่ใช่</b> เฉพาะก้อนที่รวมผิด · ที่ไม่แตะ = ถือว่าถูก</div>
</header>
<div class="tabs" id="tabs"></div>
<main id="list"></main>
<div class="save"><span class="cnt" id="cnt"></span><button onclick="save()">บันทึก</button></div>
<script>
const DATA = ${JSON.stringify(rows)};
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co', KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
let ans = {}; try { ans = JSON.parse(localStorage.getItem('f_ing_review')||'{}') } catch(e){}
const cats = [...new Set(DATA.map(d=>d.c))];
let cur = cats[0];
const el=(t,c,h)=>{const x=document.createElement(t);if(c)x.className=c;if(h!=null)x.innerHTML=h;return x};
function draw(){
  tabs.innerHTML='';
  for(const c of cats){const t=el('div','tab'+(c===cur?' on':''),c+' '+DATA.filter(d=>d.c===c).length);t.onclick=()=>{cur=c;draw()};tabs.appendChild(t)}
  list.innerHTML='';
  for(const d of DATA.filter(d=>d.c===cur)){
    const a=ans[d.n];
    const card=el('div','it'+(a==='y'?' ok':a==='n'?' bad':''));
    card.appendChild(el('div','nm',d.n));
    card.appendChild(el('div','meta',d.sku+' SKU · '+d.s+' · ฿'+d.baht.toLocaleString()+(d.days?' · สั่งทุก '+d.days+' วัน':'')));
    const s=el('div','skus',d.names.map(n=>'<div>'+n+'</div>').join(''));
    card.appendChild(s);
    card.onclick=e=>{if(e.target.tagName!=='BUTTON')card.classList.toggle('open')};
    const b=el('div','btns');
    const y=el('button','y'+(a==='y'?' on':''),'✔ ถูก'), n=el('button','n'+(a==='n'?' on':''),'✕ รวมผิด');
    y.onclick=()=>{ans[d.n]=ans[d.n]==='y'?null:'y';persist();draw()};
    n.onclick=()=>{ans[d.n]=ans[d.n]==='n'?null:'n';persist();draw()};
    b.append(y,n);card.appendChild(b);list.appendChild(card);
  }
  const bad=Object.values(ans).filter(v=>v==='n').length;
  cnt.textContent='รวมผิด '+bad+' ก้อน · ทั้งหมด '+DATA.length;
}
function persist(){try{localStorage.setItem('f_ing_review',JSON.stringify(ans))}catch(e){}}
async function save(){
  const body={key:'f_ingredient_kinds_review',data:{when:new Date().toISOString(),ans}};
  const r=await fetch(SB+'/rest/v1/kitchen_data?on_conflict=key',{method:'POST',
    headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},
    body:JSON.stringify(body)});
  alert(r.ok?'บันทึกแล้ว ✅':'บันทึกไม่สำเร็จ ('+r.status+') — คำตอบยังอยู่ในเครื่อง ไม่หาย');
}
draw();
</script></body></html>`;

fs.writeFileSync('pwa/ingredients_review.html', html, 'utf8');
console.log(`✅ pwa/ingredients_review.html · ${rows.length} ชนิด · ${(html.length / 1024).toFixed(0)} KB`);

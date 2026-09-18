/**
 * f-track — หน้าจัดลิสต์วัตถุดิบบนมือถือ (รอบ 2 · แก้ตามที่นัทติ 18 ก.ย. 2026)
 *
 * ที่นัทติรอบแรกและแก้แล้ว:
 *   ① รวม 2 ก้อนเป็นชนิดเดียวไม่ได้      → ติ๊กหลายก้อน แล้วกด "รวมเป็นชนิดเดียว"
 *   ② คำตอบ 8 ชุดที่เคาะไปแล้วไม่ถูกใช้   → เอา docs/INGREDIENT_CATALOG.json มารวม SKU ให้ล่วงหน้า + ติดป้าย ✅
 *   ③ ของที่ควรรวม กลับแยก              → รวมอัตโนมัติผ่านสารบัญ + รวมเองได้
 *   ④ ต้องกดการ์ดถึงเห็นชื่อ SKU         → โชว์ทุกบรรทัดตั้งแต่แรก
 *   ⑤ ของที่มี SKU เดียวต้องติ๊กถูกทำไม   → ตัดปุ่ม "ถูก" ทิ้ง ไม่ต้องยืนยันอะไรที่ไม่ต้องตัดสินใจ
 */
import { readCsv, load, similar } from './catalog.mjs';
import fs from 'node:fs';

const rows = readCsv('docs/INGREDIENT_KINDS_REVIEW.csv').map((c) => ({
  c: c[0], n: c[1], s: c[3], days: c[5], baht: +c[6], names: c[8].split(' | '),
}));

// ── ① เอาสารบัญที่นัทเคาะแล้ว 58 ชื่อ มารวมก้อนให้ล่วงหน้า ──────────────
const cat = load();
const skuToOurs = new Map();           // "GO: ชื่อ SKU" → ชื่อที่เราใช้
for (const [ours, it] of Object.entries(cat.items || {})) {
  for (const [shop, list] of Object.entries(it.ร้าน || {}))
    for (const p of list) skuToOurs.set(`${shop === 'go' ? 'GO' : 'Freshket'}: ${p.ชื่อ}`, ours);
}
const merged = new Map();
for (const r of rows) {
  const ours = r.names.map((n) => skuToOurs.get(n)).find(Boolean);
  const kk = ours || `__${r.n}`;
  const e = merged.get(kk) || { c: r.c, n: ours || r.n, ours: !!ours, baht: 0, names: [], days: r.days, s: new Set() };
  e.baht += r.baht; e.names.push(...r.names); r.s.split('+').forEach((x) => e.s.add(x));
  merged.set(kk, e);
}
const out = [...merged.values()].map((e, i) => ({ id: i, c: e.c, n: e.n, ours: e.ours, baht: e.baht, s: [...e.s].join('+'), days: e.days, names: e.names }))
  .sort((a, b) => a.c.localeCompare(b.c, 'th') || b.baht - a.baht);

// ── คู่ที่น่าจะเป็นตัวเดียวกัน — ถามทีละคู่ ไม่ต้องให้นัทไล่ดูเองทั้ง 310 ──
const PAIRS = [];
for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
  if (out[i].c !== out[j].c) continue;
  const s = similar(out[i].n, out[j].n);
  if (s >= 55) PAIRS.push({ a: out[i].id, b: out[j].id, s });
}
PAIRS.sort((x, y) => y.s - x.s);

const html = `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>จัดลิสต์วัตถุดิบ · Under360</title>
<style>
:root{--bg:#0f1115;--card:#181b22;--line:#262b36;--tx:#e8eaf0;--dim:#8c94a6;--sel:#2563eb;--ok:#2ecc71}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.5 -apple-system,"Segoe UI",sans-serif;padding-bottom:96px}
header{position:sticky;top:0;background:#0f1115f2;backdrop-filter:blur(8px);padding:10px 14px 0;border-bottom:1px solid var(--line);z-index:5}
h1{font-size:16px;margin:0}
.sub{color:var(--dim);font-size:12.5px;margin:4px 0 8px}
.tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}
.tab{white-space:nowrap;padding:7px 11px;border-radius:999px;background:var(--card);border:1px solid var(--line);color:var(--dim);font-size:13.5px}
.tab.on{background:#2b3140;color:var(--tx);border-color:#3b4354}
main{padding:12px 14px}
.it{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:11px 12px;margin-bottom:9px;display:flex;gap:10px}
.it.sel{border-color:var(--sel);background:#182136}
.box{width:22px;height:22px;border-radius:6px;border:2px solid #3b4354;flex:0 0 auto;margin-top:2px;display:flex;align-items:center;justify-content:center;font-size:13px}
.it.sel .box{background:var(--sel);border-color:var(--sel)}
.nm{font-weight:600;font-size:15px}
.badge{font-size:11px;color:var(--ok);border:1px solid #1f6b40;border-radius:6px;padding:1px 5px;margin-left:6px;vertical-align:1px}
.meta{color:var(--dim);font-size:12px;margin:2px 0 6px}
.sku{font-size:12.5px;color:#aab2c4;padding:2px 0 2px 8px;border-left:2px solid var(--line)}
.sku b{color:#7f8aa3;font-weight:500}
.bar{position:fixed;left:0;right:0;bottom:0;padding:10px 14px;background:#0f1115f2;border-top:1px solid var(--line);display:flex;gap:9px;align-items:center}
button{padding:11px 14px;border-radius:11px;border:0;background:#2b3140;color:var(--tx);font:inherit;font-size:14px;font-weight:600}
button.go{background:var(--sel);flex:1}button.flag{background:#3a3320;color:#ffc043}button:disabled{opacity:.35}
.cnt{color:var(--dim);font-size:12.5px;white-space:nowrap}
.mid{text-align:center;color:var(--dim);font-size:13px;margin:-2px 0 7px}
.btns2{display:flex;gap:9px;margin-top:14px}.btns2 button{flex:1;padding:14px}
</style></head><body>
<header>
  <h1>จัดลิสต์วัตถุดิบ</h1>
  <div class="sub">ของที่นัทเคาะชื่อไว้แล้ว = ป้าย <span style="color:var(--ok)">✅ สารบัญ</span> (รวมให้แล้ว) · ที่เหลือถ้าเห็นว่าอันไหน<b>เป็นของชนิดเดียวกัน</b> → ติ๊กทั้งคู่ แล้วกดปุ่มล่าง · <b>บันทึกให้อัตโนมัติ</b> เปิดคนละเครื่องก็ทำต่อกันได้</div>
  <div class="tabs" id="modes"><div class="tab on" onclick="setMode(0)" id="m0">❓ คู่ที่ต้องเคาะ</div><div class="tab" onclick="setMode(1)" id="m1">📋 ดูทั้งลิสต์</div></div>
  <div class="tabs" id="tabs"></div>
</header>
<main id="list"></main>
<div class="bar" id="bar">
  <span class="cnt" id="cnt"></span><span class="cnt" id="st" style="color:#2ecc71"></span>
  <button class="go" id="mg" disabled onclick="doMerge()">รวมเป็นชนิดเดียว</button>
  <button id="mv" disabled onclick="doMove()">ย้ายหมวด</button>
  
</div>
<script>
const BASE = ${JSON.stringify(out)};
const PAIRS = ${JSON.stringify(PAIRS)};
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co', KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
let MERGES = [], MOVES = {};
try { MERGES = JSON.parse(localStorage.getItem('f_ing_merges')||'[]') } catch(e){}
try { MOVES = JSON.parse(localStorage.getItem('f_ing_moves')||'{}') } catch(e){}
let cur, sel = new Set(), view = [], MODE = 0, DONE = {}, FLAG = {};
try { FLAG = JSON.parse(localStorage.getItem('f_ing_flag')||'{}') } catch(e){}
try { DONE = JSON.parse(localStorage.getItem('f_ing_done')||'{}') } catch(e){}
function setMode(m){ MODE=m; m0.className='tab'+(m?'':' on'); m1.className='tab'+(m?' on':''); draw() }

function build(){
  const byId = new Map(BASE.map(x=>[x.id,{...x,names:[...x.names],ids:[x.id]}]));
  for (const grp of MERGES) {                     // grp = [id,id,...] ที่นัทสั่งรวม
    const live = grp.filter(i=>byId.has(i)); if (live.length<2) continue;
    const head = byId.get(live[0]);
    for (const i of live.slice(1)) { const o=byId.get(i); head.names.push(...o.names); head.baht+=o.baht;
      head.s=[...new Set((head.s+'+'+o.s).split('+'))].join('+'); head.ids.push(i); byId.delete(i); }
  }
  for (const v of byId.values()) if (MOVES[v.id]) v.c = MOVES[v.id];
  view = [...byId.values()].sort((a,b)=>a.c.localeCompare(b.c,'th')||b.baht-a.baht);
  cur = cur || view[0].c;
  draw();
}
const el=(t,c,h)=>{const x=document.createElement(t);if(c)x.className=c;if(h!=null)x.innerHTML=h;return x};
function draw(){ MODE ? drawList() : drawPairs(); }

/** โหมดถามทีละคู่ — จำเองว่าเคาะถึงไหน ไม่ต้องไล่ดู 310 การ์ด */
function drawPairs(){
  tabs.style.display='none';
  const live = PAIRS.filter(p=>!DONE[p.a+'-'+p.b] && idOf(p.a)!==idOf(p.b));
  bar.style.display='none';
  if(!live.length){ list.innerHTML='<div class="it"><div><div class="nm">เคาะครบแล้ว ✅</div><div class="meta">ไม่เหลือคู่ที่ต้องตัดสินใจ · กดแท็บ "ดูทั้งลิสต์" เพื่อไล่ดูทั้งหมดได้</div></div></div>'; return }
  const p = live[0], A = byIdView(p.a), B = byIdView(p.b);
  const done = PAIRS.length - live.length;
  const card = (d)=>{ const c=el('div','it'); const b=el('div');
    b.appendChild(el('div','nm',d.n)); b.appendChild(el('div','meta',d.names.length+' SKU · '+d.s+' · ฿'+d.baht.toLocaleString()));
    for(const n of d.names){const i=n.indexOf(': ');b.appendChild(el('div','sku','<b>'+n.slice(0,i)+'</b> '+n.slice(i+2)))}
    c.appendChild(b); return c };
  list.innerHTML='';
  list.appendChild(el('div','meta','เคาะแล้ว '+done+' / '+PAIRS.length+' คู่ · เหลือ '+live.length));
  list.appendChild(card(A));
  list.appendChild(el('div','mid','↕ ตัวเดียวกันไหม'));
  list.appendChild(card(B));
  const bs=el('div','btns2');
  const y=el('button','go','✔ ตัวเดียวกัน — รวมเลย'), n=el('button',null,'✕ คนละอย่าง'), fl=el('button','flag','🔖 ติดธงไว้รวมทีหลัง');
  fl.onclick=()=>{ FLAG[p.a]=1; FLAG[p.b]=1; DONE[p.a+'-'+p.b]=1; persist(); build() };
  y.onclick=()=>{ MERGES.push([p.a,p.b]); DONE[p.a+'-'+p.b]=1; persist(); build() };
  n.onclick=()=>{ DONE[p.a+'-'+p.b]=1; persist(); build() };
  bs.append(y,n); list.appendChild(bs);
  const bs2=el('div','btns2'); bs2.appendChild(fl); list.appendChild(bs2);
}
function idOf(id){ return (view.find(v=>v.ids.includes(id))||{}).id }
function byIdView(id){ return view.find(v=>v.ids.includes(id)) || BASE.find(b=>b.id===id) }

function drawList(){
  tabs.style.display='flex'; bar.style.display='flex';
  const flagged = view.filter(v=>v.ids.some(i=>FLAG[i]));
  const cats=[...new Set(view.map(v=>v.c))];
  tabs.innerHTML='';
  if(flagged.length){const t=el('div','tab'+(cur==='__flag'?' on':''),'🔖 ติดธงไว้ '+flagged.length);t.onclick=()=>{cur='__flag';draw()};tabs.appendChild(t)}
  for(const c of cats){const t=el('div','tab'+(c===cur?' on':''),c+' '+view.filter(v=>v.c===c).length);t.onclick=()=>{cur=c;draw()};tabs.appendChild(t)}
  list.innerHTML='';
  const show = cur==='__flag' ? flagged : view.filter(v=>v.c===cur);
  for(const d of show){
    const card=el('div','it'+(sel.has(d.id)?' sel':''));
    card.appendChild(el('div','box',sel.has(d.id)?'✓':''));
    const body=el('div');
    body.appendChild(el('div','nm',d.n+(d.ours?'<span class="badge">✅ สารบัญ</span>':'')+(d.ids.some(i=>FLAG[i])?' 🔖':'')));
    body.appendChild(el('div','meta',d.names.length+' SKU · '+d.s+' · ฿'+d.baht.toLocaleString()+(d.days?' · สั่งทุก '+d.days+' วัน':'')));
    for(const n of d.names){const i=n.indexOf(': ');body.appendChild(el('div','sku','<b>'+n.slice(0,i)+'</b> '+n.slice(i+2)))}
    card.appendChild(body);
    card.onclick=()=>{sel.has(d.id)?sel.delete(d.id):sel.add(d.id);draw()};
    list.appendChild(card);
  }
  cnt.textContent='เลือก '+sel.size+' · '+view.length+' ชนิด';
  mg.disabled = sel.size<2; mv.disabled = sel.size<1;
}
function doMove(){
  const cats=[...new Set(BASE.map(b=>b.c).concat(Object.values(MOVES)))];
  const menu=cats.map((c,i)=>(i+1)+') '+c).join('\\n');
  const pick=prompt('ย้าย '+sel.size+' รายการไปหมวดไหน — พิมพ์เลข\\n'+menu);
  const c=cats[+pick-1]; if(!c) return;
  for(const id of sel) MOVES[id]=c;
  sel=new Set(); persist(); build();
}
function doMerge(){ MERGES.push([...sel]); for(const id of sel) delete FLAG[id]; sel=new Set(); persist(); build(); }
/** เก็บในเครื่อง + ส่งขึ้นระบบอัตโนมัติ (หน่วง 1 วิ กันยิงถี่) → เปิดคนละเครื่องก็ต่องานกันได้ */
let t;
function persist(){
  try{localStorage.setItem('f_ing_merges',JSON.stringify(MERGES));localStorage.setItem('f_ing_moves',JSON.stringify(MOVES));localStorage.setItem('f_ing_done',JSON.stringify(DONE));localStorage.setItem('f_ing_flag',JSON.stringify(FLAG))}catch(e){}
  clearTimeout(t); t=setTimeout(()=>save(true),1000);
}
async function save(auto){
  const data={when:new Date().toISOString(),merges:MERGES,moves:MOVES,done:DONE,flag:FLAG,
    kinds:view.map(v=>({ชื่อ:v.n,หมวด:v.c,จากสารบัญ:!!v.ours,sku:v.names}))};
  const r=await fetch(SB+'/rest/v1/kitchen_data?on_conflict=key',{method:'POST',
    headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},
    body:JSON.stringify({key:'f_ingredient_kinds_review',data})});
  st.textContent = r.ok ? ('💾 บันทึกแล้ว ' + new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})) : '⚠️ บันทึกไม่ขึ้นระบบ (ยังอยู่ในเครื่อง)';
  if(!auto&&!r.ok) alert('บันทึกไม่สำเร็จ '+r.status);
}
(async () => {
  try {
    const r = await fetch(SB+'/rest/v1/kitchen_data?select=data&key=eq.f_ingredient_kinds_review',{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});
    const j = await r.json(); const d = j[0] && j[0].data;
    if (d && (d.merges||d.moves)) {
      const localN = MERGES.length + Object.keys(MOVES).length;
      const remoteN = (d.merges||[]).length + Object.keys(d.moves||{}).length;
      if (remoteN >= localN) { MERGES = d.merges||[]; MOVES = d.moves||{}; DONE = d.done||DONE; FLAG = d.flag||FLAG; }
      st.textContent = '☁️ ต่อจากที่ทำไว้ล่าสุด';
    }
  } catch(e) { st.textContent = 'ออฟไลน์ — ทำต่อได้ เดี๋ยวบันทึกให้เมื่อเน็ตมา'; }
  build();
})();
</script></body></html>`;

fs.writeFileSync('pwa/ingredients_review.html', html, 'utf8');
console.log(`✅ pwa/ingredients_review.html · ${out.length} ชนิด (รวมจากสารบัญแล้ว ${out.filter((x) => x.ours).length} ชื่อ) · ${(html.length / 1024).toFixed(0)} KB`);

import {saveRound,loadRounds} from './sync.js';
import {latestCounts,ordered,countItems,validateAssignments} from './counting.js';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Keep the existing storage namespace and old rounds/draft for compatibility.
const prefix='under360-phase2-239-v1-';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(prefix+k))??f;}catch{return f;}};
function write(k,v){try{localStorage.setItem(prefix+k,JSON.stringify(v));return true;}catch{toast('เก็บข้อมูลในเครื่องไม่สำเร็จ กรุณาอย่าปิดหน้านี้');return false;}}
const unit=v=>({g:'กรัม',kg:'กก.'}[v]||v),fmt=v=>Number(v).toLocaleString('th-TH',{maximumFractionDigits:3});
const stamp=at=>new Date(at).toLocaleString('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
let items=[],staff=[],rounds=read('rounds',[]),values={},selected='',filter='all',page=0,latest=new Map(),startedAt=null,activeMs=0,running=false,tick=0,ready=false,reviewScope=[];
const dataset='phase2-243',unitRevision='2026-09-24-count-units';
if(!Array.isArray(rounds))rounds=[];
const person=()=>staff.find(s=>s.id===selected);
const scope=()=>selected==='legacy'?items:items.filter(i=>person()?.item_keys.includes(i.key));
const counted=i=>Object.hasOwn(values,i.key)&&Number.isFinite(values[i.key])&&values[i.key]>=0;
const validValues=v=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).filter(([k,n])=>items.some(i=>i.key===k)&&typeof n==='number'&&Number.isFinite(n)&&n>=0)):{};
const draftKey=()=>selected==='legacy'?'draft':'staff-draft-v1-'+selected;
function toast(s){$('toast').textContent=s;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,6000);}
function accrue(){const now=Date.now();if(running&&tick&&!document.hidden)activeMs+=Math.min(now-tick,2000);tick=now;}
function draftStatus(message,failed=false){document.querySelectorAll('[data-draft-status]').forEach(el=>{el.textContent=message;el.style.color=failed?'#b42318':'';});}
function saveDraft(){
 if(!selected)return true;accrue();const savedAt=new Date().toISOString();
 const ok=write(draftKey(),selected==='legacy'?values:{values,startedAt,activeMs,savedAt,unitRevision});
 if(ok&&selected==='legacy')write('legacy-unit-revision',unitRevision);
 draftStatus(ok?'✓ บันทึกร่างในเครื่องแล้ว '+new Date(savedAt).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'บันทึกร่างไม่สำเร็จ — อย่าปิดหน้านี้',!ok);
 return ok;
}
function setRunning(){running=false;}
window.addEventListener('pagehide',saveDraft);
function invalidEntry(){const bad=document.querySelector('.counter input:invalid');if(bad){bad.reportValidity();return true;}return false;}
function selectStaff(id){
 if(invalidEntry()){$('staffSelect').value=selected;return;}
 if(!saveDraft()){$('staffSelect').value=selected;return;}
 setRunning(false);selected=id;const d=read(draftKey(),{});
 values=validValues(selected==='legacy'?d:d.values);
 const oldUnits=selected==='legacy'?read('legacy-unit-revision',''):d.unitRevision;
 const changed=items.filter(i=>i.unit_revision&&oldUnits!==unitRevision&&Object.hasOwn(values,i.key));
 if(changed.length){
  if(!write('unit-migration-backup-'+selected+'-'+Date.now(),d)){values={};selected='';$('staffSelect').value='';render();return;}
  changed.forEach(i=>delete values[i.key]);
  toast('หน่วยเปลี่ยนแล้ว กรุณากรอกใหม่: '+changed.map(i=>i.name).join(', ')+' · เก็บร่างเดิมสำรองไว้แล้ว');
 }
 startedAt=selected==='legacy'?null:d.startedAt||null;activeMs=selected==='legacy'?0:Math.max(0,Number(d.activeMs)||0);
 $('note').value='';$('category').value='all';$('query').value='';$('showAll').checked=false;filter='all';page=0;
 document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b.dataset.filter===filter));
 fillCategories();render();
 draftStatus(!selected?'เลือกชื่อเพื่อเริ่มนับ':Object.keys(values).length?'กู้ร่างในเครื่องแล้ว '+Object.keys(values).length+' รายการ':'กรอกแล้วบันทึกร่างในเครื่องอัตโนมัติ');
}
$('staffSelect').onchange=()=>selectStaff($('staffSelect').value);
$('showAll').onchange=()=>{fillCategories();resetPage();};$('sortOrder').onchange=resetPage;
function visibleItems(){return !selected||$('showAll').checked?items:scope();}
function update(){
 const assigned=scope(),done=assigned.filter(counted),zero=done.filter(i=>values[i.key]===0).length;
 $('personalProgress').hidden=!selected;$('personalProgress').textContent='รอบที่กำลังกรอก: '+done.length+' จาก '+assigned.length+' รายการที่รับผิดชอบ';
 $('remainingN').textContent=visibleItems().filter(i=>latest.get(i.key)?.qty>0).length;
 document.querySelectorAll('[data-filter="pending"],[data-filter="done"]').forEach(b=>b.hidden=!selected);
 $('allN').textContent=visibleItems().length;$('pendingN').textContent=assigned.length-done.length;$('doneN').textContent=done.length;
 $('countN').innerHTML=done.length+' <small>รายการ</small>';$('remain').textContent='รับผิดชอบทั้งหมด '+assigned.length+' รายการ';$('progress').max=assigned.length||1;$('progress').value=done.length;
 $('hasN').textContent=done.length-zero;$('zeroN').textContent=zero;
 $('mobileN').textContent=selected?(person()?.name||'ร่างเดิม')+' · '+done.length+'/'+assigned.length:'เลือกชื่อก่อนเริ่มนับ';
 $('staffHint').textContent=selected==='legacy'?'ร่างจากเวอร์ชันเดิมยังอยู่ บันทึกเฉพาะรายการที่กรอกได้':person()?person().name+' รับผิดชอบ '+assigned.length+' รายการ · กรอกเฉพาะของที่พบ แล้วตรวจรายการว่างก่อนยืนยันครบ':'เลือกชื่อของคุณเพื่อเปิดงานที่ได้รับมอบหมาย (ไม่ต้องล็อกอิน)';
 document.querySelectorAll('.finish').forEach(b=>{b.disabled=!ready||!selected||selected==='legacy'&&!done.length||!!document.querySelector('.counter input:invalid');b.innerHTML='ตรวจและจบรอบ →';});
}
function row(i){
 const editable=scope().some(s=>s.key===i.key),done=editable&&counted(i),last=latest.get(i.key),owner=staff.find(s=>s.item_keys.includes(i.key));
 const previous=last?'นับล่าสุด '+fmt(last.qty)+' '+unit(last.unit)+' · '+stamp(last.at)+' · '+last.by:'';
 const state=last?(last.qty>0?'positive':'zero'):'unknown';
 const badge=last?(last.qty>0?'มีของเหลือ':'หมด · 0'):'ยังไม่มีผลนับ';
 return `<article class="product stock-${state} ${done?'done':''} ${editable?'':'readonly'}" data-key="${esc(i.key)}"><div class="photo">${$('viewMode').value!=='table'&&i.img?`<img src="${esc(i.img)}" alt="${esc(i.name)}" loading="lazy" decoding="async" width="160" height="160">`:'<span class="no-photo">ยังไม่มีรูป</span>'}</div><div class="product-info"><h3>${esc(i.name)}</h3><div class="meta">${esc(unit(i.unit))}</div><small class="stock-last"><span class="stock-badge">${badge}</span> ${esc(previous)}${last&&last.unit!==i.unit?' · หน่วยเดิม; รอบใหม่ใช้ '+esc(unit(i.unit)):''}</small></div><div class="entry">${editable?`<div class="counter"><button data-step="-1" aria-label="ลดจำนวน ${esc(i.name)}">−</button><input aria-label="จำนวน ${esc(i.name)}" type="number" min="0" step="any" inputmode="decimal" placeholder="แตะเพื่อกรอก" value="${done?values[i.key]:''}"><button data-step="1" aria-label="เพิ่มจำนวน ${esc(i.name)}">+</button></div><div class="counter-meta"><button class="clear" data-clear aria-label="ล้างจำนวน ${esc(i.name)}">ล้าง</button></div>`:'ผู้รับผิดชอบ: '+esc(owner?.name||'ยังไม่ระบุ')}</div><span class="check" aria-label="นับแล้ว">✓</span></article>`;
}
function render(){
 if(invalidEntry())return;
 latest=latestCounts(rounds);const q=$('query').value.trim().toLocaleLowerCase(),cat=$('category').value;
 const list=ordered(visibleItems().filter(i=>(cat==='all'||i.group===cat)&&(!q||i.name.toLocaleLowerCase().includes(q))&&(filter==='all'||filter==='remaining'&&latest.get(i.key)?.qty>0||filter==='done'&&scope().some(s=>s.key===i.key)&&counted(i)||filter==='pending'&&scope().some(s=>s.key===i.key)&&!counted(i))),latest,$('sortOrder').value);
 $('products').classList.toggle('table-view',$('viewMode').value==='table');
 $('products').innerHTML=list.map(row).join('')||'<p class="empty">ไม่พบรายการ ลองเปลี่ยนคำค้นหรือหมวด</p>';
 $('products').querySelectorAll('img').forEach(img=>img.onerror=()=>{img.parentElement.innerHTML='<span class="no-photo">ยังไม่มีรูป</span>';});
 $('listCount').textContent='แสดง '+list.length+' รายการ · เลื่อนดูได้ต่อเนื่อง';update();
}
function persist(k){if(!startedAt)startedAt=new Date().toISOString();saveDraft();const el=[...$('products').children].find(a=>a.dataset.key===k);el?.classList.toggle('done',counted({key:k}));update();}
$('products').addEventListener('input',e=>{if(!e.target.matches('input'))return;const input=e.target,k=input.closest('.product').dataset.key;if(!scope().some(i=>i.key===k))return;if(input.validity.badInput||input.value!==''&&(!Number.isFinite(Number(input.value))||Number(input.value)<0)){input.setCustomValidity('กรอกจำนวนตั้งแต่ 0 ขึ้นไป');update();return;}input.setCustomValidity('');if(input.value==='')delete values[k];else values[k]=Number(input.value);persist(k);});
$('products').addEventListener('click',e=>{const b=e.target.closest('button'),a=b?.closest('.product');if(!a||b.disabled)return;const k=a.dataset.key,i=scope().find(x=>x.key===k);if(!i)return;const input=a.querySelector('input');if(b.hasAttribute('data-clear'))delete values[k];else values[k]=Math.max(0,Math.round(((values[k]||0)+Number(b.dataset.step)*(i.unit==='g'?100:1))*1000)/1000);input.value=values[k]??'';input.setCustomValidity('');persist(k);});
function resetPage(){page=0;render();}
$('query').oninput=resetPage;$('category').onchange=resetPage;
document.querySelector('.filters').onclick=e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));resetPage();};
$('viewMode').value=read('view-mode','cards')==='table'?'table':'cards';
$('viewMode').onchange=()=>{write('view-mode',$('viewMode').value);render();};
function fillCategories(){const groups=[...new Set(visibleItems().map(i=>i.group))];const current=$('category').value;$('category').innerHTML='<option value="all">ทุกหมวด</option>'+groups.map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join('');$('category').value=groups.includes(current)?current:'all';$('categoryTabs').innerHTML=[['all','ทั้งหมด'],...groups.map(g=>[g,g])].map(([v,l])=>`<button data-category="${esc(v)}" class="${v===$('category').value?'selected':''}">${esc(l)}</button>`).join('');}
$('categoryTabs').onclick=e=>{const b=e.target.closest('[data-category]');if(!b)return;$('category').value=b.dataset.category;fillCategories();resetPage();};
function show(view){if(invalidEntry())return;if(view==='history'){setRunning(false);saveDraft();}$('countView').hidden=view!=='count';$('historyView').hidden=view!=='history';$('footer').hidden=view!=='count';$('countNav').classList.toggle('active',view==='count');$('historyNav').classList.toggle('active',view==='history');$('crumb').textContent=view==='count'?'นับสต็อก':'รอบที่ผ่านมา';if(view==='history'){renderHistory();syncRounds();}}
$('countNav').onclick=()=>show('count');$('historyNav').onclick=()=>show('history');
const reviewRow=i=>`<div class="review-row"><span>${esc(i.name)}</span><b>${fmt(i.qty)} ${esc(unit(i.unit))}</b></div>`;
document.querySelectorAll('.finish').forEach(b=>b.onclick=()=>{
 if(!selected)return;const invalid=document.querySelector('.counter input:invalid');if(invalid){invalid.reportValidity();return;}
 setRunning(false);saveDraft();reviewScope=scope();const done=reviewScope.filter(counted),missing=reviewScope.filter(i=>!counted(i));
 $('reviewTotal').textContent='กรอกแล้ว '+done.length+' · เว้นว่าง '+missing.length+' · รวมงานทั้งหมด '+reviewScope.length+' รายการ';
 $('reviewRows').innerHTML=done.map(i=>reviewRow({...i,qty:values[i.key]})).join('');$('blankNames').innerHTML=missing.length?'<summary>ตรวจรายการว่าง '+missing.length+' รายการ</summary>'+missing.map(i=>'<div>'+esc(i.name)+'</div>').join(''):'';
 $('completeAll').checked=false;$('completeChoice').hidden=selected==='legacy';$('completeText').textContent='ตรวจของที่รับผิดชอบครบแล้ว รายการที่เว้นว่าง '+missing.length+' รายการไม่มีของ (บันทึกเป็น 0)';
 $('who').value=person()?.name||read('who','');$('who').readOnly=selected!=='legacy';reviewButton();$('review').showModal();
});
function reviewButton(){const done=reviewScope.filter(counted);$('submitRound').disabled=!done.length&&!$('completeAll').checked;$('submitRound').textContent=$('completeAll').checked?'ยืนยันตรวจครบ '+reviewScope.length+' รายการ':'บันทึกเฉพาะ '+done.length+' รายการที่กรอก';}
$('completeAll').onchange=reviewButton;
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$('finishForm').onsubmit=e=>{
 e.preventDefault();if(!selected)return;const who=$('who').value.trim();if(!who)return;
 const complete=selected!=='legacy'&&$('completeAll').checked,rows=countItems(reviewScope,values,complete);if(!rows.length)return;
 const r={id:crypto.randomUUID(),at:new Date().toISOString(),by:who,note:$('note').value.trim(),dataset,items:rows,sync:'pending'};
 if(selected!=='legacy')r.counting={staffId:selected,assignmentVersion:'v1',scopeKeys:reviewScope.map(i=>i.key),complete,enteredKeys:reviewScope.filter(counted).map(i=>i.key),startedAt:startedAt||r.at};
 // Save the completed round before clearing its draft. Never erase another person's draft.
 if(!write('rounds',[r,...rounds]))return;rounds.unshift(r);write('who',who);values={};startedAt=null;activeMs=0;saveDraft();$('note').value='';$('review').close();render();show('history');toast('เก็บรอบในเครื่องแล้ว กำลังส่งเข้าระบบ');
};
function renderHistory(){let old=[];try{old=JSON.parse(localStorage.getItem('kruaprom-fresh-v1-rounds'))||[];}catch{}if(!Array.isArray(old))old=[];
 const historyRounds=[...rounds,...old.map(r=>({...r,legacy:true}))];
 $('history').innerHTML=historyRounds.length?historyRounds.map((r,n)=>`<details class="history-round" ${n===0?'open':''}><summary><div><h2>${esc(stamp(r.at))}</h2><p>ตรวจนับโดย ${esc(r.by)} · ${r.sync==='synced'?'บันทึกส่วนกลางแล้ว':r.sync==='pending'?'รอส่งเข้าระบบ':'เก็บในเครื่อง'}</p>${r.counting?`<p>${r.counting.complete?'ตรวจครบ':'นับบางส่วน'} · กรอกเอง ${r.counting.enteredKeys.length} · ยืนยันศูนย์จากช่องว่าง ${r.counting.complete?r.items.length-r.counting.enteredKeys.length:0}</p>`:''}</div><b>${r.items.length} รายการ　⌄</b></summary><div class="history-content">${r.note?`<p>${esc(r.note)}</p>`:''}${r.items.map(reviewRow).join('')}</div></details>`).join(''):'<div class="history-round empty">ยังไม่มีรอบที่เสร็จแล้ว</div>';
}
let syncing=false,syncAgain=false;
async function syncRounds(){if(syncing){syncAgain=true;return;}syncing=true;$('syncRetry').disabled=true;
 const status=s=>{$('syncStatus').textContent=s;$('countSync').textContent=s;};status('กำลังอัปเดตผลนับจากส่วนกลาง…');
 try{for(const r of rounds.filter(r=>r.sync==='pending')){await saveRound(r);r.sync='synced';write('rounds',rounds);}const remote=await loadRounds();const merged=new Map(rounds.map(r=>[r.id,r]));for(const r of remote)merged.set(r.id,{...r,sync:'synced'});rounds=[...merged.values()].sort((a,b)=>b.at.localeCompare(a.at));write('rounds',rounds);renderHistory();latest=latestCounts(rounds);
 // Do not move rows or replace a field while someone is entering a count.
 if(ready&&!document.querySelector('.counter input:focus')&&!$('review').open)render();
 status('อัปเดตผลนับล่าสุดแล้ว · ยอดที่บันทึกแสดงพร้อมเวลาและผู้ตรวจนับ');
 }catch{status('เชื่อมต่อส่วนกลางไม่สำเร็จ · ใช้ข้อมูลที่มีในเครื่อง · รอบที่รอส่งยังเก็บไว้');renderHistory();}finally{syncing=false;$('syncRetry').disabled=false;if(syncAgain){syncAgain=false;queueMicrotask(syncRounds);}}}
$('syncRetry').onclick=syncRounds;window.addEventListener('online',syncRounds);
async function init(){const date=new Date().toLocaleDateString('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'long',year:'numeric'});$('date').textContent=date;$('shortDate').textContent=date;
 try{const responses=await Promise.all([fetch('/pwa/ing_assets/catalogue.json',{cache:'no-cache'}),fetch('/pwa/ing_assets/assignments.json',{cache:'no-cache'})]);if(responses.some(r=>!r.ok))throw Error();const [data,allocation]=await Promise.all(responses.map(r=>r.json()));const units=read('units',{});items=data.groups.flatMap(g=>g.items.map(i=>({...i,unit:i.unit_revision?i.unit:typeof units?.[i.key]==='string'?units[i.key]:i.unit,group:g.name})));staff=allocation.staff;validateAssignments(staff,items);
 const legacy=Object.keys(validValues(read('draft',{}))).length;$('staffSelect').innerHTML='<option value="">เลือกชื่อผู้ตรวจนับ</option>'+staff.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} (${esc(s.id)}) · ${s.item_keys.length} รายการ</option>`).join('')+(legacy?'<option value="legacy">ร่างเดิมที่ยังไม่ได้บันทึก</option>':'');ready=true;fillCategories();render();await syncRounds();
 }catch{$('products').innerHTML='<p class="empty">โหลดรายการหรือการแบ่งงานไม่สำเร็จ กรุณารีเฟรชก่อนเริ่มนับ</p>';}}
init();

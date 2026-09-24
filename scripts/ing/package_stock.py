"""Copy reviewed local stock app into deployable, isolated static assets."""
import json, shutil
from pathlib import Path
root=Path(__file__).resolve().parents[2]
source=root.parent/'chat gpt stock work/brief from claude/chat-gpt-stock-work-2026-09-22/workspace/stock-count-redesign'
out=root/'pwa/ing_assets';out.mkdir(parents=True,exist_ok=True)
for name in ['fresh.css','photo-list.css','fresh.js']:shutil.copy2(source/name,out/name)
shutil.copytree(source/'fonts',out/'fonts',dirs_exist_ok=True)
cat=json.loads((source/'reference/phase2/catalogue.json').read_text())
assert sum(len(g['items']) for g in cat['groups'])==242
for g in cat['groups']:
 for i in g['items']:
  if not i['img']: continue
  target=out/i['img'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source/i['img'],target)
  i['img']='/pwa/ing_assets/'+i['img']
(out/'catalogue.json').write_text(json.dumps(cat,ensure_ascii=False,indent=2))
html=(source/'index.html').read_text().replace('<title>','<meta name="robots" content="noindex,nofollow"><title>',1)
for name in ['fresh.css','photo-list.css','fresh.js']:html=html.replace('"'+name+'"','"/pwa/ing_assets/'+name+'"')
html=html.replace('href="./"','href="/staff/v2/home"').replace('ทดลองใช้งานในเครื่อง','วัตถุดิบคงเหลือ').replace('● พื้นที่ทดลอง','● นับวัตถุดิบ').replace('บันทึกรอบใหม่ในเครื่องนี้ ไม่แก้ฐานข้อมูลจริง','เมื่อยืนยัน ระบบจะส่งรอบนับเข้าฐานข้อมูลกลาง').replace('<div id="history"></div>','<p id="syncStatus" role="status"></p><button id="syncRetry" class="outline" type="button">โหลดประวัติ / ส่งซ้ำ</button><div id="history"></div>')
(root/'pwa/ing_stock.html').write_text(html)
f=out/'fresh.js';js=f.read_text().replace("const phase2=!new URLSearchParams(location.search).has('legacy');","const phase2=true;")
js="import {saveRound, loadRounds} from './sync.js';\n"+js
js=js.replace("fetch(phase2?'reference/phase2/catalogue.json':'reference/catalogue.json')","fetch('/pwa/ing_assets/catalogue.json')")
js=js.replace("if(!write('rounds',[r,...rounds]))return;rounds.unshift(r);","r.sync='pending';if(!write('rounds',[r,...rounds]))return;rounds.unshift(r);")
js=js.replace("toast('จบรอบแล้ว เก็บไว้ในรอบที่ผ่านมา');","toast('เก็บรอบในเครื่องแล้ว กำลังส่งเข้าระบบ');syncRounds();")
js=js.replace("if(view==='history')renderHistory();","if(view==='history'){renderHistory();syncRounds();}")
js=js.replace("ตรวจนับโดย ${esc(r.by)}</p>","ตรวจนับโดย ${esc(r.by)} · ${r.sync==='synced'?'บันทึกส่วนกลางแล้ว':r.sync==='pending'?'รอส่งเข้าระบบ':'เก็บในเครื่อง'}</p>")
a=js.index("const notice=document.createElement('div');")
js=js[:a]+"const notice=document.createElement('div');notice.className='phase-notice';notice.innerHTML='กรอกจำนวนได้เลย<br><small>หน่วยเริ่มต้น: กรัม · เว้นว่าง = ยังไม่นับ · 0 = ของหมด</small> <a href=\"/staff/v2/home\">กลับหน้าทีม</a>';document.querySelector('.heading').after(notice);\n"
js+='''
let syncing=false;
async function syncRounds(){
 if(syncing)return;syncing=true;$('syncRetry').disabled=true;
 $('syncStatus').textContent='กำลังเชื่อมต่อฐานข้อมูลกลาง…';
 try{
  for(const r of rounds.filter(r=>r.sync==='pending')){
   await saveRound(r);
   r.sync='synced';write('rounds',rounds);
  }
  const remote=await loadRounds();
  const merged=new Map(rounds.map(r=>[r.id,r]));
  for(const r of remote)merged.set(r.id,{...r,sync:'synced'});
  rounds=[...merged.values()].sort((a,b)=>b.at.localeCompare(a.at));
  write('rounds',rounds);renderHistory();
  $('syncStatus').textContent='อัปเดตประวัติจากส่วนกลางแล้ว';
 }catch(e){
  $('syncStatus').textContent='เชื่อมต่อส่วนกลางไม่สำเร็จ รอบที่ยังไม่ส่งเก็บในเครื่องนี้แล้ว กดส่งซ้ำได้';
  renderHistory();
 }finally{syncing=false;$('syncRetry').disabled=false;}
}
$('syncRetry').onclick=syncRounds;
window.addEventListener('online',syncRounds);
syncRounds();
'''
f.write_text(js)
print('Packaged 242 items with local images')

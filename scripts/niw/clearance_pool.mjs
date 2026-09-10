/**
 * โยนเมนูพิเศษของสัปดาห์ที่ "ผ่านไปแล้ว" ที่ยังเปิดขายอยู่ ลงบ่อเซล 25%
 * นัทสั่งเอง 20 ส.ค. 2026 — ⚠️ ห้ามแตะเมนูของสัปดาห์ปัจจุบัน
 * รัน:  node scripts/niw/clearance_pool.mjs         → ดูอย่างเดียว
 *       node scripts/niw/clearance_pool.mjs --apply → เขียนจริง
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const APPLY = process.argv.includes('--apply');
const PCT = 25;

async function page(u){const o=[];for(let f=0;;f+=1000){const r=await fetch(u,{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();if(!Array.isArray(d))throw new Error(JSON.stringify(d).slice(0,300));o.push(...d);if(d.length<1000)break;}return o;}
async function getKey(k){const r=await fetch(`${SB}/rest/v1/kitchen_data?select=key,data&key=eq.${k}`,{headers:{apikey:KEY}});const d=await r.json();return (d[0]||{}).data;}
async function setKey(k,data){
  const r=await fetch(`${SB}/rest/v1/kitchen_data?key=eq.${k}`,{method:'PATCH',headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({data})});
  if(r.status===200){const j=await r.json(); if(j.length) return true;}
  const r2=await fetch(`${SB}/rest/v1/kitchen_data`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify({key:k,data})});
  return r2.ok;
}

// สัปดาห์ปัจจุบัน (จันทร์ เวลาไทยเสมอ — นัทอยู่ PST คำนวณจากเครื่องจะเพี้ยน)
const now = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Bangkok'}));
const mon = new Date(now); mon.setDate(mon.getDate()-((mon.getDay()+6)%7));
const thisMon = mon.getFullYear()+'-'+String(mon.getMonth()+1).padStart(2,'0')+'-'+String(mon.getDate()).padStart(2,'0');

const weeks = (await getKey('menu_special_weeks')) || {};
const menus = await page(`${SB}/rest/v1/menu_items?select=code,name,price,is_available,stock_total,subcode&order=code`);
const byCode = new Map(menus.map(m=>[m.code,m]));

const target=[], skipCur=[], skipOut=[];
for(const [code,wk] of Object.entries(weeks)){
  const m = byCode.get(code); if(!m || !m.is_available) continue;
  if(String(wk) >= thisMon){ skipCur.push(code); continue; }          // 🔒 สัปดาห์ปัจจุบัน/อนาคต — ห้ามแตะ
  if(m.stock_total!==null && Number(m.stock_total)===0){ skipOut.push(code); continue; }
  // ⚠️ ต้องเช็ค !==null ก่อน — Number(null)===0 จะทำให้เมนู "ไม่จำกัด" ถูกนับว่าหมดสต็อค (กับดักเดียวกับ kitchen_queue.html:582)
  target.push({...m, wk});
}
target.sort((a,b)=>a.wk.localeCompare(b.wk)||a.code.localeCompare(b.code));

console.log('สัปดาห์ปัจจุบัน (จันทร์ เวลาไทย) = '+thisMon+'   ลด '+PCT+'%');
console.log('🔒 ไม่แตะ: สัปดาห์ปัจจุบัน '+skipCur.length+' เมนู · หมดสต็อคแล้ว '+skipOut.length+' เมนู\n');
console.log('รหัส  | สัปดาห์      | เหลือ | ราคาเดิม → ใหม่ | ชื่อ');
console.log('-'.repeat(88));
for(const t of target)
  console.log(t.code.padEnd(6)+'| '+t.wk.padEnd(13)+'| '+String(t.stock_total??'∞').padStart(5)+' | ฿'+String(t.price).padStart(4)+' → ฿'+String(Math.round(t.price*(100-PCT)/100)).padStart(4)+'   | '+t.name);
console.log('\nรวม '+target.length+' เมนู');

if(!APPLY){ console.log('\n(ดูอย่างเดียว — ใส่ --apply เพื่อเขียนจริง)'); process.exit(0); }

const sp = (await getKey('sale_pools')) || {pools:[]};
sp.pools = Array.isArray(sp.pools)?sp.pools:[];
let pool = sp.pools.find(p=>Number(p.percent)===PCT);
if(!pool){ pool={id:'sp'+Date.now()+'clr', name:'บ่อ '+PCT+'% (เมนูพิเศษสัปดาห์เก่า)', percent:PCT, codes:[]}; sp.pools.push(pool); console.log('\n➕ สร้างบ่อใหม่: '+pool.name); }
const codes = target.map(t=>t.code);
// เมนูอยู่ได้บ่อเดียว — ถอดออกจากบ่ออื่นก่อน (ตรงกับกติกาหน้า DB)
for(const p of sp.pools) if(p!==pool) p.codes=(p.codes||[]).filter(c=>!codes.includes(String(c).trim().toUpperCase()));
pool.codes = [...new Set([...(pool.codes||[]).map(c=>String(c).trim().toUpperCase()), ...codes])];

const ok = await setKey('sale_pools', sp);
console.log(ok ? '\n✅ เขียนแล้ว — บ่อ "'+pool.name+'" มี '+pool.codes.length+' เมนู' : '\n❌ เขียนไม่สำเร็จ');
const back = await getKey('sale_pools');
const vp = (back.pools||[]).find(p=>p.id===pool.id);
console.log('🔁 อ่านกลับจาก DB: '+(vp?vp.codes.length+' เมนู · '+vp.percent+'%':'ไม่เจอบ่อ'));

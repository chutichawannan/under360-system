/**
 * แพลนเมนูพิเศษล่วงหน้า 2 สัปดาห์ — **เสนออย่างเดียว ไม่เขียน DB**
 * นัทสั่ง 18 ส.ค. 2026: "ช่วยแพลนเมนูสัปดาห์หน้าล่วงหน้าซัก 2 อาทิตย์
 *                        เลือกเมนูที่ไม่ซ้ำอย่างน้อย 4-6 เดือน · เสนอก่อน"
 *
 * โครงสัปดาห์ (ตามของจริงสัปดาห์นี้): ข้าวกล่อง S1-S8 = 8 ตัว · กับข้าว D1-D5 = 5 ตัว
 * D1-D5 ต้องเป็นคู่ของ S1-S5 (จับคู่จาก sd_decisions + เลขที่ตรงกันหลังสลับรหัสแล้ว)
 *
 * เกณฑ์คัด:
 *   · ไม่เคยขึ้นเป็นเมนูพิเศษมาแล้วอย่างน้อย 4 เดือน (ตั้งได้ที่ MIN_MONTHS)
 *   · ไม่มียอดขายในช่วงเดียวกัน (กันเมนูที่ขายอยู่เงียบๆ)
 *   · ต้องมีรูป (ลูกค้าเห็นการ์ดเปล่าแล้วไม่กด)
 *   · บาลานซ์โปรตีน: ทะเล 2-3 · ไก่ 3-4 · หมู 2-3 ต่อสัปดาห์
 *
 * รัน: node scripts/niw/plan_next_weeks.mjs
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const MIN_MONTHS=4;

const SEA=/แซลมอน|กระพง|กุ้ง|ปลา|ทูน่า|ซาบะ|ทะเล|หอย|ปู/;
const PORK=/หมู|บะช่อ|กุนเชียง|เบคอน|คอหมู|สันใน/;
const CHICK=/ไก่/;
const kind=n=>SEA.test(n)?'ทะเล':PORK.test(n)?'หมู':CHICK.test(n)?'ไก่':'อื่นๆ';

const fmt=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function thisWeekBkk(){const n=new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Bangkok'}));n.setHours(0,0,0,0);n.setDate(n.getDate()-((n.getDay()+6)%7));return fmt(n);}
const addDays=(s,n)=>{const d=new Date(s+'T00:00:00');d.setDate(d.getDate()+n);return fmt(d);};
const label=s=>{const a=new Date(s+'T00:00:00'),b=new Date(addDays(s,6)+'T00:00:00');const M=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];return a.getDate()+'-'+b.getDate()+' '+M[b.getMonth()];};
const get=async p=>(await fetch(SB+'/rest/v1/'+p,{headers:{apikey:KEY}})).json();

/* ─────────────────────────────────────────────────────────────
   🔴 FLAVOUR_CLASH — กฎที่นัทเคาะเอง 21 ส.ค. 2026
   เมนูพิเศษประจำสัปดาห์ **ห้ามชนรสชาติกับเมนูประจำร้าน**
   เพราะเมนูประจำร้านขายทุกเดือนอยู่แล้ว → ขึ้นซ้ำ = ไปแย่งยอดตัวเอง ไม่ได้ลูกค้าใหม่
   นิยาม "เมนูประจำร้าน" = ขายได้ ≥10 เดือนคนละเดือน และยังขายอยู่ในรอบ 2 เดือนล่าสุด
   ⚠️ ต้องเทียบที่ "คำบอกรสชาติ/วิธีทำ" ไม่ใช่เทียบชื่อทั้งสตริง —
      ไม่งั้นจะฟ้องผิดเพราะทุกเมนูมีคำว่า "อกไก่" เหมือนกันหมด
   ───────────────────────────────────────────────────────────── */
const FLAVOUR_CLASH = ['พริกเหลือง','พริกเกลือ','พริกแห้ง','พริกขิง','เสฉวน','แกงเขียวหวาน','ผัดกระเทียม',
  'ซีอิ๊ว','ซีอิ้ว','บาบีคิว','นิวออลีน','แมกซิกัน','น้ำผึ้ง','ลาบ','น้ำตก','ยำมะนาว','ซอสเกาหลี',
  'บ๊วย','ทอดมัน','มะระ','เครื่องแกง','พันผักกาด','กุนเชียง','ราดหน้า','ผงกะหรี่','คั่ว'];
const flavWords = (n) => FLAVOUR_CLASH.filter(f => String(n||'').includes(f));
/** คืนเมนูประจำร้านที่ชนรส ถ้าไม่ชนคืน null */
function flavourClash(name, permanentMenus){
  const f = flavWords(name); if(!f.length) return null;
  for(const p of permanentMenus){ if(flavWords(p.name).some(x=>f.includes(x))) return p; }
  return null;
}

async function main(){
 const week=thisWeekBkk(), w1=addDays(week,7), w2=addDays(week,14);
 const cutoff=addDays(week,-30*MIN_MONTHS);

 const rows=[];
 for(let f=0;;f+=1000){const r=await fetch(SB+'/rest/v1/menu_items?select=code,name,price,is_available,image_urls,stock_total&order=code',{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();rows.push(...d);if(d.length<1000)break;}
 const kd=await get('kitchen_data?select=data&key=eq.menu_special_weeks');
 const weeks=(kd[0]&&kd[0].data)||{};

 // ยอดขายล่าสุดต่อเมนู
 const sales=[];
 for(let f=0;;f+=1000){const r=await fetch(SB+'/rest/v1/order_items?select=menu_code,orders!inner(delivery_date)&orders.delivery_date=gte.'+cutoff,{headers:{apikey:KEY,Range:f+'-'+(f+999)}});const d=await r.json();if(!Array.isArray(d))break;sales.push(...d);if(d.length<1000)break;}
 const lastSold={};
 for(const s of sales){const d=s.orders.delivery_date;if(!lastSold[s.menu_code]||d>lastSold[s.menu_code])lastSold[s.menu_code]=d;}

 const S=rows.filter(x=>/^S\d+$/.test(x.code)), D=rows.filter(x=>/^D\d+$/.test(x.code));
 const dByNum=new Map(D.map(d=>[d.code.slice(1),d]));
 const hasImg=m=>Array.isArray(m.image_urls)&&m.image_urls.length>0;
 // ⚠️ เลขตรงกัน ≠ เป็นคู่กันจริง — ต้องเช็คชื่อด้วย (ยังสลับรหัสไม่ครบ เหลือ 9 คู่ที่ชนกันอยู่)
 const core=t=>String(t||'').replace(/^(ข้าว|ช้าว)/,'').replace(/แบบกับข้าว/g,'').replace(/[+s-·]/g,'').toLowerCase();
 const sim=(a,b)=>{a=core(a);b=core(b);if(!a||!b)return 0;const x=a.length<b.length?a:b,y=a.length<b.length?b:a;let h=0;for(let i=0;i<x.length-1;i++)if(y.includes(x.substr(i,2)))h++;return h/Math.max(1,x.length-1);};
 const realPair=s0=>{const d=dByNum.get(s0.code.slice(1));return d&&sim(s0.name,d.name)>=0.55?d:null;};

 // ผู้สมัคร: ไม่ขึ้นเมนูพิเศษ ≥ MIN_MONTHS · ไม่มียอดขายในช่วงนั้น · มีรูป
 const cand=S.filter(s=>{
  const w=weeks[s.code];
  if(w&&w>=cutoff) return false;
  if(lastSold[s.code]) return false;
  return hasImg(s);
 }).map(s=>({...s,kind:kind(s.name),pair:realPair(s),lastWeek:weeks[s.code]||null}));

 console.log('เมนูพิเศษสัปดาห์นี้ = '+label(week)+'  ·  จะแพลนให้ '+label(w1)+' และ '+label(w2));
 console.log('เกณฑ์: ไม่ขึ้นเมนูพิเศษ + ไม่มียอดขาย ตั้งแต่ '+cutoff+' (≥'+MIN_MONTHS+' เดือน) + ต้องมีรูป');
 console.log('ผู้สมัครที่ผ่านเกณฑ์: '+cand.length+' เมนู  (มีคู่ D พร้อม '+cand.filter(c=>c.pair).length+')\n');

 // เลือก: 5 ตัวแรกต้องมีคู่ D · อีก 3 ตัวไม่ต้องมีก็ได้ · คุมโปรตีน
 const pick=(pool,used)=>{
  const out=[], quota={'ทะเล':3,'ไก่':4,'หมู':3,'อื่นๆ':2};
  const withPair=pool.filter(c=>c.pair&&!used.has(c.code));
  const noPair=pool.filter(c=>!c.pair&&!used.has(c.code));
  const take=(arr,n)=>{for(const c of arr){if(out.length>=n)break;if(out.includes(c))continue;if((quota[c.kind]||0)<=0)continue;out.push(c);quota[c.kind]--;}};
  take(withPair,5);
  if(out.length<5) for(const c of withPair){if(out.length>=5)break;if(!out.includes(c)){out.push(c);}}
  take([...noPair,...withPair],8);
  if(out.length<8) for(const c of [...noPair,...withPair]){if(out.length>=8)break;if(!out.includes(c))out.push(c);}
  return out.slice(0,8);
 };

 const used=new Set();
 for(const [wk,name] of [[w1,'สัปดาห์หน้า'],[w2,'สัปดาห์ถัดไป']]){
  const sel=pick(cand,used);
  sel.forEach(c=>used.add(c.code));
  console.log('\n════════ '+name+'  '+label(wk)+'  ('+wk+') ════════');
  console.log('【ข้าวกล่อง S1-S8】');
  sel.forEach((c,i)=>console.log('  S'+(i+1)+'  '+c.code.padEnd(6)+String(c.name).slice(0,36).padEnd(38)+'฿'+String(c.price).padStart(4)+'  ['+c.kind+']'+(c.lastWeek?'  ขึ้นล่าสุด '+c.lastWeek:'  ไม่เคยขึ้นเลย')));
  const withPair=sel.filter(c=>c.pair);
  console.log('【กับข้าว D1-D5】 (คู่ของ S1-S5)');
  if(!withPair.length) console.log('  ⚠️ ไม่มีตัวไหนมีคู่ D — ต้องสร้างเพิ่ม');
  withPair.slice(0,5).forEach((c,i)=>console.log('  D'+(i+1)+'  '+c.pair.code.padEnd(6)+String(c.pair.name).slice(0,36).padEnd(38)+'฿'+String(c.pair.price).padStart(4)+'  (คู่ '+c.code+')'));
  const miss=sel.slice(0,5).filter(c=>!c.pair);
  if(miss.length) console.log('  ⚠️ S ที่ยังไม่มีคู่ D: '+miss.map(m=>m.code+' '+m.name.slice(0,20)).join(' · '));
  const b={}; sel.forEach(c=>b[c.kind]=(b[c.kind]||0)+1);
  console.log('  โปรตีน: '+Object.entries(b).map(([k,v])=>k+' '+v).join(' · '));
 }
}
main().catch(e=>{console.error('❌',e.message);process.exit(1);});

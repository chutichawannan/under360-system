/* เทสแบ่งกล่องต่อรอบ — ดึงฟังก์ชันจริงจากไฟล์มารัน */
import fs from 'node:fs';
const src=fs.readFileSync(process.argv[2],'utf8');
const grab=n=>{const i=src.indexOf('function '+n+'(');let d=0;for(let k=src.indexOf('{',i);k<src.length;k++){if(src[k]==='{')d++;else if(src[k]==='}'){d--;if(!d)return src.slice(i,k+1);}}};
const split=new Function(grab('splitSetItems')+'; return splitSetItems;')();
const boxes=new Function('pkgFixedDates',grab('pkgFixedRaw')+'\n'+grab('pkgFixedBoxes')+'; return pkgFixedBoxes;');
const items=Array.from({length:30},(_,i)=>({sku:'J'+String(i+1).padStart(2,'0')}));
const T=[
 ['คอร์สเจ ล็อก [9,12,9]', split(items,3,[9,12,9]), [9,12,9]],
 ['ไม่ล็อก → หารเท่ากัน',   split(items,3,null),     [10,10,10]],
 ['ล็อกผิดรวมไม่ครบ → ตกกลับหารเท่า', split(items,3,[9,12,8]), [10,10,10]],
 ['ล็อกจำนวนรอบไม่ตรง → ตกกลับ', split(items,3,[15,15]), [10,10,10]],
];
let bad=0;
T.forEach(([why,got,want])=>{
  const g=got.map(a=>a.length), ok=JSON.stringify(g)===JSON.stringify(want);
  if(!ok)bad++;
  console.log(ok?'✅':'🔴', why.padEnd(36), JSON.stringify(g));
});
// เมนูตกรอบถูกไหม
const c=split(items,3,[9,12,9]);
const r1=c[0].map(x=>x.sku), r2=c[1].map(x=>x.sku), r3=c[2].map(x=>x.sku);
const okR = r1[0]==='J01'&&r1[8]==='J09' && r2[0]==='J10'&&r2[11]==='J21' && r3[0]==='J22'&&r3[8]==='J30';
if(!okR)bad++;
console.log(okR?'✅':'🔴','เมนูตกรอบถูก'.padEnd(36), 'รอบ1 '+r1[0]+'-'+r1[8]+' · รอบ2 '+r2[0]+'-'+r2[11]+' · รอบ3 '+r3[0]+'-'+r3[8]);
// ตัวอ่านจำนวนกล่องจากค่าที่แอดมินตั้ง
const f=boxes({A:[{d:'2026-10-08',n:9},{d:'2026-10-11',n:12},{d:'2026-10-15',n:9}], B:['2026-10-08','2026-10-11'], C:'2026-08-11'});
[['A',[9,12,9]],['B',null],['C',null]].forEach(([k,want])=>{
  const g=f(k), ok=JSON.stringify(g)===JSON.stringify(want);
  if(!ok)bad++;
  console.log(ok?'✅':'🔴',('อ่านค่าแบบ '+k).padEnd(36), JSON.stringify(g));
});
console.log('\n'+(bad?('🔴 ผิด '+bad+' เคส'):'✅ ผ่านหมด · ของเดิม (หารเท่ากัน) ยังทำงานเหมือนเดิม'));

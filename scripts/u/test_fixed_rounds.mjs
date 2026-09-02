/* เทสตรรกะล็อกวัน — ดึงฟังก์ชันจริงจากไฟล์มารัน ไม่เขียนตรรกะใหม่มาเทสเอง */
import fs from 'node:fs';
const src=fs.readFileSync(process.argv[2],'utf8');
const grab=n=>{const i=src.indexOf('function '+n+'(');let d=0;for(let k=src.indexOf('{',i);k<src.length;k++){if(src[k]==='{')d++;else if(src[k]==='}'){d--;if(!d)return src.slice(i,k+1);}}};
const body=grab('pkgFixedList')+'\n'+grab('cartFixedDate')+'\n'+grab('cartFixedRounds');
const mk=(cart,pkgFixedDates)=>new Function('cart','pkgFixedDates',body+'; return {cartFixedDate,cartFixedRounds};')(cart,pkgFixedDates);
const JAY='jay-id', HYX='hyrox-id';
const T=[
 ['คอร์สเจ (ล็อก 3 วัน)', [{type:'package',package_id:JAY,delivery_rounds:3}],
   {[JAY]:['2026-10-08','2026-10-11','2026-10-15']}, '2026-10-08', ['2026-10-08','2026-10-11','2026-10-15']],
 ['เซ็ต Hyrox แบบเดิม (ล็อกวันเดียว)', [{type:'package',package_id:HYX,delivery_rounds:1}],
   {[HYX]:'2026-08-11'}, '2026-08-11', null],
 ['เซ็ตปกติ ไม่ล็อก', [{type:'package',package_id:'x',delivery_rounds:3}], {}, null, null],
 ['ตะกร้าว่าง', [], {}, null, null],
 ['เมนูเดี่ยว ไม่ใช่แพค', [{type:'item',id:'m1'}], {[JAY]:['2026-10-08']}, null, null],
];
let bad=0;
T.forEach(([why,cart,fixed,wantFirst,wantRounds])=>{
  const api=mk(cart,fixed);
  const f=api.cartFixedDate(), r=api.cartFixedRounds();
  const ok = f===wantFirst && JSON.stringify(r)===JSON.stringify(wantRounds);
  if(!ok) bad++;
  console.log(ok?'✅':'🔴', why.padEnd(34), '→ วันรอบแรก', String(f), '· รอบที่ล็อก', JSON.stringify(r));
});
console.log('\n'+(bad?('🔴 ผิด '+bad+' เคส'):'✅ ผ่านทั้ง '+T.length+' เคส · ของเดิม (ล็อกวันเดียว) ยังทำงานเหมือนเดิม'));

/* เทสตรรกะใหม่ รวมตัวเติมวันของโค้ดเดิม (จ/พ/ศ) */
const isMWF=d=>[1,3,5].includes(d.getDay());
const ymd=d=>d.toISOString().slice(0,10);
function build(date, mpDays, rounds, keepOrderDate){
  let chosen=(mpDays&&mpDays.length)?mpDays.slice(0,rounds):[];
  let fixOrder=null;
  if(chosen.length && String(chosen[0])!==String(date)){
    if(keepOrderDate){
      chosen=chosen.filter(x=>String(x)>=String(date));
      if(!chosen.length||String(chosen[0])!==String(date)) chosen.unshift(date);
      chosen=chosen.filter((x,i,a)=>a.indexOf(x)===i).slice(0,rounds);
    } else fixOrder=chosen[0];
  }
  if(chosen.length){                       // ตัวเติมของโค้ดเดิม
    let nd=new Date(chosen[chosen.length-1]+'T00:00:00');
    while(chosen.length<rounds){ nd.setDate(nd.getDate()+1); while(!isMWF(nd)) nd.setDate(nd.getDate()+1); chosen.push(ymd(nd)); }
  }
  const out=[]; let d=new Date(date+'T00:00:00');
  for(let i=1;i<=rounds;i++){
    out.push(chosen.length? chosen[i-1] : (i===1? date : ymd(d)));
    do { d.setDate(d.getDate()+1); } while(rounds>1 && !isMWF(d));   // ตรงกับโค้ดจริงบรรทัด 7087
  }
  return {rounds:out, orderDate:fixOrder||date};
}
const chk=(name,r,expectFirst)=>{
  const dup=r.rounds.length!==new Set(r.rounds).size;
  const ok=!dup && r.rounds[0]===expectFirst && r.rounds[0]===r.orderDate;
  console.log((ok?'✅':'🔴')+' '+name);
  console.log('    รอบ: '+r.rounds.join(' · ')+'  | ใบ: '+r.orderDate+(dup?'   🔴 มีวันซ้อนกัน':''));
  return ok;
};
let bad=0;
console.log('เคสกวาง (ใบ 28 · ติ๊กเมนู 26/28/31)\n');
if(!chk('ยึดวันบนใบ → ต้องไม่มีวันซ้อน', build('2026-08-28',['2026-08-26','2026-08-28','2026-08-31'],3,true), '2026-08-28')) bad++;
if(!chk('ยึดวันเมนู → ใบย้ายตาม',      build('2026-08-28',['2026-08-26','2026-08-28','2026-08-31'],3,false),'2026-08-26')) bad++;
console.log('\nเคสอื่น');
if(!chk('ติ๊กตรงกับใบอยู่แล้ว',          build('2026-08-28',['2026-08-28','2026-08-31'],2,true), '2026-08-28')) bad++;
if(!chk('ไม่ได้ติ๊กเลย',                 build('2026-08-28',[],3,true), '2026-08-28')) bad++;
if(!chk('ติ๊กวันอดีตล้วน (ใบ 31)',       build('2026-08-31',['2026-08-24','2026-08-26'],3,true), '2026-08-31')) bad++;
console.log(bad? '\n🔴 ไม่ผ่าน '+bad : '\n✅ ผ่านครบ');
process.exit(bad?1:0);

/* เทสเกณฑ์ใหม่กับเคสจริง 3 เคสที่เจอวันนี้ */
function pick(rows, orderDate){
  const byDate={}; rows.forEach(r=>(byDate[r.d]=byDate[r.d]||[]).push(r));
  const need=[];
  Object.keys(byDate).sort().forEach(d=>{ if(orderDate && d===orderDate) return; need.push(byDate[d]); });
  return need;
}
const T=(name, rows, orderDate, expectDates)=>{
  const got=pick(rows,orderDate).map(g=>g[0].d);
  const ok=JSON.stringify(got)===JSON.stringify(expectDates);
  console.log((ok?'✅':'🔴')+' '+name);
  console.log('    ใบลงวัน '+orderDate+' · รอบ: '+rows.map(r=>r.d).join(', '));
  console.log('    → เปิดใบใหม่ให้วัน: '+(got.join(', ')||'(ไม่ต้องเปิด)')+(ok?'':'   คาดว่า: '+expectDates.join(', ')));
  return ok;
};
let bad=0;
console.log('เกณฑ์ใหม่: รอบที่ "วันไม่ตรงกับใบ" เท่านั้นที่ต้องมีใบใหม่ · 1 ใบต่อ 1 วัน\n');
if(!T('Peachyz — 2 คอร์ส (HP+LC) ส่งวันเดียวกัน ใบตรงวัน',
   [{d:'2026-08-31'},{d:'2026-08-31'}], '2026-08-31', [])) bad++;
if(!T('fongfong — ใบลง 2 ก.ย. แต่รอบ 1 อยู่ 31 ส.ค.',
   [{d:'2026-08-31'},{d:'2026-09-02'}], '2026-09-02', ['2026-08-31'])) bad++;
if(!T('อัญชลี — คอร์ส 3 รอบ ใบตรงรอบแรก',
   [{d:'2026-09-02'},{d:'2026-09-04'},{d:'2026-09-07'}], '2026-09-02', ['2026-09-04','2026-09-07'])) bad++;
if(!T('โอ๋ — 7 รอบ ใบอยู่ในอดีต (ไม่ตรงรอบไหนเลย)',
   [{d:'2026-09-02'},{d:'2026-09-04'},{d:'2026-09-07'}], '2026-08-21', ['2026-09-02','2026-09-04','2026-09-07'])) bad++;
console.log(bad?('\n🔴 ไม่ผ่าน '+bad):'\n✅ ผ่านครบ — เกณฑ์เก่าจะพลาด 2 เคสแรก');
process.exit(bad?1:0);

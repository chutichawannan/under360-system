/* เทสส่วนลดตามระดับ — ดึงบล็อกจริงจากไฟล์มารัน */
import fs from 'node:fs';
const src=fs.readFileSync(process.argv[2],'utf8');
const i=src.indexOf('function autoPromos(sub){');
const body=src.slice(i, src.indexOf('\n}', src.indexOf('return list;', i))+2);
const mk=(tier,vip)=>{
  const fn=new Function('customer','isVipFriend','isNewMemberCustomer','activeCampaignTag',
    body+'; return autoPromos;');
  return fn({tier}, ()=>vip, ()=>false, ()=>null);
};
const T=[
 ['Fit&Fabulous',      false, 10, 'ระดับสูงสุด'],
 ['Wellness Warriors', false,  5, 'ระดับกลาง'],
 ['Healthy Habits',    false,  0, 'ระดับเริ่มต้น ไม่มีสิทธิ์'],
 ['bronze',            false,  0, 'ค่าค้างในข้อมูล = ไม่มีสิทธิ์'],
 ['',                  false,  0, 'ไม่มีระดับ'],
 ['Healthy Habits',    true,  10, 'เพื่อนนัท — ได้ 10% ไม่ว่าระดับไหน'],
 ['Fit&Fabulous',      true,  10, 'เพื่อนนัท + ระดับสูงสุด = 10% ไม่ทบกัน'],
];
let bad=0;
T.forEach(([tier,vip,want,why])=>{
  const list=mk(tier,vip)(1000);
  const pct=list.length? (list[0].type==='percent'? list[0].value : 0) : 0;
  const ok=pct===want; if(!ok)bad++;
  console.log(ok?'✅':'🔴', (tier||'(ว่าง)').padEnd(20), (vip?'เพื่อนนัท':'ลูกค้าทั่วไป').padEnd(12),
    '→ ลด', String(pct).padStart(2)+'%', '(ควรได้ '+want+'%)  '+why);
});
console.log('\n'+(bad?('🔴 ผิด '+bad+' เคส'):'✅ ผ่านทั้ง '+T.length+' เคส'));

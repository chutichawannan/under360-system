/* เทสตรรกะค่าส่งเหมาจ่าย — ดึงบรรทัดจริงจากไฟล์มารัน ไม่ก๊อปตรรกะมาเขียนใหม่
   (เคยพลาดมาแล้ว: เทสผ่านเพราะเทสของที่ตัวเองเขียนขึ้นใหม่ ไม่ใช่ของที่จะขึ้น production) */
import fs from 'node:fs';
const src=fs.readFileSync(process.argv[2],'utf8');
const m=src.match(/else if\(p\.discount_type==='flat_shipping'\) shipDisc = ([^;]+);/);
if(!m){ console.error('🔴 ไม่เจอบรรทัด flat_shipping ในไฟล์จริง'); process.exit(1); }
console.log('บรรทัดที่ดึงมาจากไฟล์จริง:\n  shipDisc =', m[1], '\n');
const calc=new Function('shipDisc','fee','p','return '+m[1]+';');

const T=[
 // [ค่าส่งจริง, เพดานโค้ด, shipDisc เดิม, ลูกค้าควรจ่าย, คำอธิบาย]
 [200, 50, 0,  50, 'ตจว. ฿200 → จ่าย ฿50 (เคสหลักที่นัทยกมา)'],
 [120, 50, 0,  50, 'ค่าส่ง ฿120 → จ่าย ฿50'],
 [ 30, 50, 0,  30, '🔑 ถูกกว่าเพดานอยู่แล้ว → จ่ายตามจริง ฿30 ห้ามบวกขึ้นเป็น 50'],
 [ 50, 50, 0,  50, 'เท่าเพดานพอดี → จ่าย ฿50'],
 [  0, 50, 0,   0, 'ค่าส่งฟรีอยู่แล้ว → 0'],
 [200, 89, 0,  89, 'โปร ตจว. ฿89 ที่ห้องแอดขอ'],
 [200, 50,200,  0, 'ซ้อนกับโค้ดส่งฟรี → ลูกค้าได้ตัวที่ดีกว่า (ฟรี) ไม่ใช่ตัวที่มาทีหลัง'],
 [200,300, 0, 200, 'เพดานสูงกว่าค่าส่งจริง → ไม่ลดอะไร'],
];
let bad=0;
T.forEach(([fee,cap,prev,want,why])=>{
  const sd=calc(prev,fee,{discount_value:cap});
  const pay=Math.max(0,fee-sd);
  const ok=pay===want && sd>=0 && sd<=fee;
  if(!ok)bad++;
  console.log(ok?'✅':'🔴', `ค่าส่ง ฿${String(fee).padStart(3)} · เพดาน ฿${String(cap).padStart(3)} → ลูกค้าจ่าย ฿${String(pay).padStart(3)} (ควรได้ ฿${want})  ${why}`);
});
console.log('\n'+(bad?('🔴 ผิด '+bad+' เคส'):'✅ ผ่านทั้ง '+T.length+' เคส'));
process.exit(bad?1:0);

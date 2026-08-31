/* เทสป้าย "เริ่มส่ง" — ดึงฟังก์ชันจริงจากไฟล์มารัน */
import fs from 'node:fs';
const src=fs.readFileSync(process.argv[2],'utf8');
const grab=n=>{const i=src.indexOf('function '+n+'(');let d=0;for(let k=src.indexOf('{',i);k<src.length;k++){if(src[k]==='{')d++;else if(src[k]==='}'){d--;if(!d)return src.slice(i,k+1);}}};
const fn=new Function(grab('bkkToday')+'\n'+grab('isNextWeekItem')+'; return {bkkToday,isNextWeekItem};')();
const today=fn.bkkToday();
console.log('วันนี้ (เวลาไทย) =',today,'\n');
const d=(o)=>{const x=new Date(Date.now()+7*3600e3+o*86400e3);return x.toISOString().slice(0,10);};
const T=[
 [d(0),  false,'ถึงวันขายวันนี้ → ต้องขายได้เลย ป้ายต้องหาย (เคส S5 ที่นัทเจอ)'],
 [d(-1), false,'เลยวันมาแล้ว 1 วัน → ขายได้'],
 [d(-7), false,'เลยมาแล้ว 1 สัปดาห์ → ขายได้'],
 [d(1),  true ,'พรุ่งนี้ → ยังพรีออเดอร์ ป้ายต้องขึ้น'],
 [d(7),  true ,'อีก 7 วัน → ยังพรีออเดอร์'],
 [null,  false,'ไม่ได้ตั้งวันไว้ → ขายได้ปกติ'],
];
let bad=0;
T.forEach(([v,want,why])=>{
  const got=fn.isNextWeekItem(v?{available_from:v}:{});
  const ok=got===want; if(!ok)bad++;
  console.log(ok?'✅':'🔴', String(v||'(ว่าง)').padEnd(12),'→ ยังไม่ถึงวัน:',String(got).padEnd(5),' ',why);
});
console.log('\n'+(bad?('🔴 ผิด '+bad+' เคส'):'✅ ผ่านทั้ง '+T.length+' เคส'));

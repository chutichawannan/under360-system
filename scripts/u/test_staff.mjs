/* เทสโถงพนักงาน /staff + ห้องนัท (นัทเคาะ 9 ก.ย.)
   หัวใจ: ห้ามแตะของครัว · ต้องมีด่านรหัส · ห้ามเพิ่มบล็อกเอง */
import fs from 'node:fs';
const NL=String.fromCharCode(10);
const read=p=>fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const lobby=read('staff/index.html'), nut=read('staff/nut.html');
const vercel=JSON.parse(read('vercel.json')), robots=read('robots.txt');
let ok=0,fail=0;
const t=(n,got,want)=>{const g=JSON.stringify(got),w=JSON.stringify(want);
  if(g===w){ok++;console.log('  ✅',n);}else{fail++;console.log('  ❌',n,NL+'     ได้  '+g+NL+'     ควร  '+w);}};

console.log(NL+'① ประตูต้องล็อก');
t('โถงมีด่านรหัส', lobby.includes('src="/gate.js"'), true);
t('ห้องนัทมีด่านรหัส', nut.includes('src="/gate.js"'), true);
t('ทั้งคู่กัน Google', lobby.includes('noindex')&&nut.includes('noindex'), true);
t('robots ปิด /staff', /^Disallow: \/staff$/m.test(robots), true);
t('ไม่มีรหัสจริงในไฟล์', /['"]0360['"]/.test(lobby+nut), false);

console.log(NL+'② 🔴 ห้ามแตะของครัว (นัทสั่งเพิ่มระหว่างทาง)');
t('ไม่มี /staff/kitchen', /staff\/kitchen/.test(lobby+nut+JSON.stringify(vercel)), false);
t('ไม่ได้เพิ่ม rewrite ของครัว', vercel.rewrites.filter(r=>['/k','/kq','/o'].includes(r.source)).length, 3);
{
  const k=vercel.rewrites.find(r=>r.source==='/k');
  t('/k ยังชี้ที่เดิม', k&&k.destination, '/pwa/app-k.html');
  const kq=vercel.rewrites.find(r=>r.source==='/kq');
  t('/kq ยังชี้ที่เดิม', kq&&kq.destination, '/kitchen_queue.html');
  const o=vercel.rewrites.find(r=>r.source==='/o');
  t('/o ยังชี้ที่เดิม', o&&o.destination, '/pwa/orders_upcoming.html');
}
t('โถงลิงก์ครัวไปทางเดิม ไม่ใช่ห้องใหม่', lobby.includes('href="/k"'), true);

console.log(NL+'③ ลิงก์เดิมต้องไม่หาย');
['/hq','/oh','/money','/cc','/db','/watchdog'].forEach(s=>
  t('ยังมี '+s, vercel.rewrites.some(r=>r.source===s), true));

console.log(NL+'④ ทางเข้าใหม่');
t('/staff ชี้โถง', vercel.rewrites.find(r=>r.source==='/staff').destination, '/staff/index.html');
t('/staff/nut ชี้ห้องนัท', vercel.rewrites.find(r=>r.source==='/staff/nut').destination, '/staff/nut.html');
t('โถงมีทางไปห้องนัท', lobby.includes('href="/staff/nut"'), true);
t('ห้องนัทมีทางกลับโถง', nut.includes('href="/staff"'), true);

console.log(NL+'⑤ 6 บล็อกตามที่นัทเคาะ — ห้ามขาด ห้ามเกิน');
['เคาะ','ยอดขาย','ยามเฝ้าเจออะไร','แอด','ห้องไหนเปิดอยู่','ส่งรูป / ไฟล์เข้าห้อง']
  .forEach((b,i)=>t('บล็อก '+(i+1)+' '+b, nut.includes('>'+b+'<'), true));
t('มี 6 บล็อกพอดี ไม่เพิ่มเอง', (nut.match(/<section>/g)||[]).length, 6);

console.log(NL+'⑥ อ่านอย่างเดียว · ไม่โกหกตัวเลข');
t('ไม่มีการเขียนลงฐานข้อมูล', /method:\s*['"](POST|PATCH|DELETE|PUT)['"]/.test(nut), false);
t('อ่านไม่ได้ = บอกว่าอ่านไม่ได้ ไม่โชว์ 0', nut.includes('อ่านไม่ได้ — '), true);
t('ยอดขายตัดใบยอด 0 ออก (ไม่ใช่การขาย)', nut.includes('Number(o.total)>0'), true);
t('ยามเฝ้าไม่นับยุค Hato (ของที่ย้ายเข้ามา)', nut.includes('/^U-/i.test(o.order_number'), true);
t('ใช้เวลาไทยเสมอ', nut.includes('Date.now()+7*3600000'), true);
t('บล็อกแอดไม่ดึงตัวเลข Meta มาโชว์เอง', /graph\.facebook|ads-insights/.test(nut), false);

console.log(NL+'⑦ โหลดเสร็จแล้วต้องไม่ดูเหมือนยังโหลดอยู่');
t('เอาคลาส load ออกตอนใส่เนื้อหา', nut.includes("e.classList.remove('load')"), true);
/* นับด้วยการแยกข้อความ ไม่ใช้ regex — backslash หายทุกครั้งที่ส่งผ่าน shell (โดนมาหลายรอบ) */
t('ทุกบล็อกใช้ put() ไม่ใช่ innerHTML ตรง ๆ', nut.split("put('b").length - 1, 5);

console.log(NL+(fail?'❌':'✅')+' ผ่าน '+ok+' · ตก '+fail);
process.exitCode=fail?1:0;

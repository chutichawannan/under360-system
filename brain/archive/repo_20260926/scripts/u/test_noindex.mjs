/* เทสชั้นกัน Google — นัทสั่ง 8 ก.ย. (บ้านสองชั้น เฟส 1)
   หัวใจ: หน้าหลังบ้านต้องมี noindex ครบ · หน้าลูกค้าต้องไม่มีเด็ดขาด */
import fs from 'node:fs';
import path from 'node:path';
const root = path.join(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/,'$1'), '..', '..');
const NL = String.fromCharCode(10);
let ok=0, fail=0;
const t=(n,got,want)=>{ const g=JSON.stringify(got),w=JSON.stringify(want);
  if(g===w){ok++;console.log('  ✅',n);}else{fail++;console.log('  ❌',n,NL+'     ได้  '+g+NL+'     ควร  '+w);} };
const read = f => fs.readFileSync(path.join(root,f),'utf8');
const hasNoindex = f => /name=["']robots["'][^>]*noindex/i.test(read(f));

console.log(NL+'① หน้าลูกค้า — ห้ามซ่อนจาก Google เด็ดขาด');
t('liff_customer.html ไม่มี noindex', hasNoindex('liff_customer.html'), false);
t('landing.html ไม่มี noindex', hasNoindex('landing.html'), false);

console.log(NL+'② หน้าหลังบ้าน — ต้องมีครบ');
['operation_hub.html','main_database_v2.html','kitchen_queue.html','command_center.html',
 'report.html','customer.html','home_editor.html','print_pickslip.html',
 'pwa/cash_due.html','pwa/dispatch.html','pwa/orders_upcoming.html','pwa/jay_orders.html','pwa/nut.html']
  .forEach(f => t(f, hasNoindex(f), true));

console.log(NL+'③ robots.txt');
const rb = read('robots.txt');
t('มีไฟล์และไม่ว่าง', rb.length > 100, true);
t('ปิดหลังบ้าน', rb.includes('Disallow: /operation_hub.html'), true);
t('ปิดทั้งโฟลเดอร์ pwa', rb.includes('Disallow: /pwa/'), true);
t('ปิดลิงก์สั้น /oh', rb.includes('Disallow: /oh'), true);
t('เปิดหน้าลูกค้าไว้', rb.includes('Allow: /liff_customer.html'), true);
t('ไม่เผลอปิดหน้าลูกค้า', /Disallow: \/liff_customer/.test(rb), false);

console.log(NL+'④ ของเดิมต้องไม่พัง');
t('noindex อยู่หลัง charset (ไม่ทับ tag อื่น)',
  /<meta\s+charset=[^>]*>\s*<meta name="robots"/i.test(read('operation_hub.html').split(String.fromCharCode(13)).join('')), true);
t('ไม่ใส่ซ้ำ 2 ครั้ง',
  (read('operation_hub.html').match(/name="robots"/g)||[]).length, 1);

console.log(NL+(fail?'❌':'✅')+' ผ่าน '+ok+' · ตก '+fail);
process.exit(fail?1:0);

/* เทสด่านรหัสหน้าหลังบ้าน — นัทสั่ง 8 ก.ย. (บ้านสองชั้น เฟส 1)
   หัวใจ 3 ข้อ: หน้าลูกค้าห้ามโดนล็อก · ครัวต้องไม่สะดุด · ไม่รับรหัสทาง URL */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.join(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/,'$1'),'..','..');
const NL = String.fromCharCode(10);
let ok=0, fail=0;
const t=(n,got,want)=>{ const g=JSON.stringify(got),w=JSON.stringify(want);
  if(g===w){ok++;console.log('  ✅',n);}else{fail++;console.log('  ❌',n,NL+'     ได้  '+g+NL+'     ควร  '+w);} };
const read = f => fs.readFileSync(path.join(root,f),'utf8');
const locked = f => read(f).includes('/gate.js');

console.log(NL+'① 🔴 หน้าลูกค้า — ห้ามล็อกเด็ดขาด');
['liff_customer.html','landing.html','liff_register.html','liff_profile.html','checkout.html','payment.html']
  .forEach(f => t(f+' ไม่โดนล็อก', locked(f), false));

console.log(NL+'② หน้าหลังบ้าน — ต้องมีด่าน');
['operation_hub.html','main_database_v2.html','kitchen_queue.html','command_center.html','report.html',
 'customer.html','pwa/cash_due.html','pwa/dispatch.html','pwa/jay_orders.html']
  .forEach(f => t(f, locked(f), true));

console.log(NL+'③ ตัวตรวจฝั่งเซิร์ฟเวอร์');
const calls=[];
global.fetch = async () => ({ ok:true, json: async()=>({}) });
const handler = require(path.join(root,'api','gate.js'));
const call = async (headers, query) => {
  let code=200, out='';
  const res={ setHeader(){}, set statusCode(c){ code=c; }, get statusCode(){ return code; }, end(x){ out=x; return this; } };
  await handler({ headers, query, url:'/api/gate' }, res);
  return { code, json: JSON.parse(out||'{}') };
};
t('รหัสถูก → ผ่าน', (await call({'x-u360-gate':'0360'})).json.ok, true);
t('รหัสผิด → 401', (await call({'x-u360-gate':'9999'})).code, 401);
t('ไม่ส่งรหัส → 401', (await call({})).code, 401);
t('🔒 ส่งทาง URL ไม่ได้ผล', (await call({}, {pin:'0360'})).code, 401);
t('ส่งทาง URL แล้วไม่ได้สิทธิ์', (await call({}, {pin:'0360'})).json.ok === true, false);

console.log(NL+'④ ฝั่งหน้าเว็บ — เงื่อนไขที่ห้ามพลาด');
const g = read('gate.js');
t('ซ่อนหน้าไว้ก่อนตรวจ (กันเนื้อหาแวบ)', g.includes('visibility:hidden'), true);
t('จำรหัสไว้ ไม่ถามซ้ำ', g.includes('localStorage.setItem'), true);
t('รับรหัสเดิมของหน้า pwa ด้วย (แอดมินไม่ต้องกรอกใหม่)', g.includes('u360_orders_pin'), true);
t('ส่งรหัสทาง header ไม่ใช่ URL', g.includes("headers: { 'x-u360-gate': pin }"), true);
t('ไม่มีการต่อรหัสเข้า URL', /gate\?[^'"]*pin=/.test(g), false);
t('เน็ตล่ม = ปล่อยผ่าน ไม่ล็อกครัวออก', g.includes('ok === true || ok === null'), true);
t('รหัสผิดจริงถึงล้างของที่จำไว้', g.includes('localStorage.removeItem(KEY)'), true);
t('ไม่มีรหัสจริงอยู่ในไฟล์หน้าเว็บ', /['"]0360['"]/.test(g), false);

console.log(NL+'⑤ API พัง ต้องไม่ล็อกทั้งบ้านออก (รันโค้ดจริง)');
{
  /* ยก check() ตัวจริงออกจาก gate.js มารัน — ไม่เขียนเลียนแบบ ไม่งั้นเทสผ่านแต่ของจริงพัง */
  const i = g.indexOf('function check(');
  let d = 0, st = false, body = '';
  for (let j = i; j < g.length; j++) {
    if (g[j] === '{') { d++; st = true; }
    else if (g[j] === '}') { d--; if (st && d === 0) { body = g.slice(i, j + 1); break; } }
  }
  const run = (resp) => new Function('fetch', body + '; return check("0360");')(
    resp === 'ล่ม' ? () => Promise.reject(new Error('เน็ตล่ม'))
                   : () => Promise.resolve({ ok: resp === 200, status: resp }));
  t('รหัสถูก (200) = ผ่าน', await run(200), true);
  t('รหัสผิด (401) = ไม่ผ่าน', await run(401), false);
  t('API หาย (404) = ไม่ตัดสิน ปล่อยผ่าน', await run(404), null);
  t('เซิร์ฟพัง (500) = ไม่ตัดสิน ปล่อยผ่าน', await run(500), null);
  t('ตัวกลางล่ม (502) = ไม่ตัดสิน ปล่อยผ่าน', await run(502), null);
  t('เน็ตล่ม = ไม่ตัดสิน ปล่อยผ่าน', await run('ล่ม'), null);
}

console.log(NL+'⑥ 🖤 ห้ามจอดำค้าง — เคสที่ทำครัวยืนงงหน้าจอเปล่า');
t('ด่านพังเอง = เปิดหน้าให้ใช้ต่อ', g.includes('catch (e) { reveal(); }'), true);
t('มีตาข่ายเวลา กันคำขอค้างไม่ตอบ', g.includes('}, 6000);'), true);
t('ตาข่ายไม่ไปลบจอกรอกรหัสทิ้ง', g.includes("!document.getElementById('u360-gate')"), true);

console.log(NL+(fail?'❌':'✅')+' ผ่าน '+ok+' · ตก '+fail);
process.exit(fail?1:0);

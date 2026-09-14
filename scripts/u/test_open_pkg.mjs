/* เทส ?pkg= — พาลูกค้าเข้าป๊อปแพคเกจตรง ๆ (06 ขอ · นัทสั่ง 9 ก.ย.)
   หัวใจ: เปิดถูกใบ · id ผิดต้องไม่ค้างจอ · โควตาเต็มลิงก์ต้องไม่ตาย */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');
const grab = (n) => { const i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) { if (src[j]==='{'){d++;st=true;} else if (src[j]==='}'){d--; if(st&&d===0) return src.slice(i,j+1);} } };

let ok=0, fail=0;
const t=(n,got,want)=>{ const g=JSON.stringify(got),w=JSON.stringify(want);
  if(g===w){ok++;console.log('  ✅',n);}else{fail++;console.log('  ❌',n,NL+'     ได้  '+g+NL+'     ควร  '+w);} };

const EB='26347b55-d28a-4ee1-980c-b4266b89b3d2', FULL='b36dcfb3-63b4-4e51-948f-7b23d1675b56';
/* u360qs = ตัวอ่าน query ตัวจริงจากไฟล์ (เก็บค่าข้ามหน้าล็อกอิน LINE)
   ดึงของจริงมาใช้ ไม่เขียนใหม่ — ไม่งั้นเทสผ่านแต่ของจริงพัง */
const mkQs = (location, store = {}) => new Function('location','sessionStorage','URLSearchParams',
  grab('u360qs') + '; return u360qs;')(location,
  { getItem: k => (k in store ? store[k] : null), setItem: (k,v)=>{store[k]=v;}, removeItem: k=>{delete store[k];} },
  URLSearchParams);
const run = (url, pkgs, resolve) => {
  const opened = [];
  const loc = { search: url };
  new Function('location','u360qs','packages','pkgResolveId','openPackage','console',
    grab('openPkgFromUrl') + '; openPkgFromUrl();')(
      loc, mkQs(loc), pkgs, resolve || (x=>x), (id)=>opened.push(id),
      { warn(){}, log(){} });
  return opened;
};
const LIVE = [{id:EB},{id:FULL}];

console.log(NL+'① เปิดถูกใบ');
t('?pkg=คอร์สเจ → เปิดป๊อปคอร์สเจ', run('?pkg='+EB, LIVE), [EB]);
t('มี utm ต่อท้ายด้วย ก็ยังเปิดได้', run('?pkg='+EB+'&utm_source=fb&utm_campaign=jay2026', LIVE), [EB]);
t('utm มาก่อน pkg ก็ได้', run('?utm_source=fb&pkg='+EB, LIVE), [EB]);

console.log(NL+'② 🔴 ห้ามค้างจอเปล่า');
t('ไม่มี ?pkg= เลย → ไม่เปิดอะไร อยู่หน้าเมนู', run('?utm_source=fb', LIVE), []);
t('id ไม่มีอยู่จริง → ไม่เปิด ไม่ throw', run('?pkg=ไม่มีใบนี้', LIVE), []);
t('id ของแพคที่ปิดขาย (ไม่อยู่ในลิสต์) → ไม่เปิด', run('?pkg='+FULL, [{id:EB}]), []);
t('?pkg= ว่าง → ไม่เปิด', run('?pkg=', LIVE), []);
t('?pkg= มีแต่ช่องว่าง → ไม่เปิด', run('?pkg=%20%20', LIVE), []);
t('packages ยังโหลดไม่เสร็จ (ลิสต์ว่าง) → ไม่เปิด ไม่พัง', run('?pkg='+EB, []), []);

console.log(NL+'③ โควตา Early Bird เต็ม — ลิงก์ในแอดต้องไม่ตาย');
{
  /* เต็มแล้ว pkgResolveId สลับเป็นราคาปกติ · ต้องยังเปิดป๊อปให้ ไม่ใช่เงียบ */
  const swap = (id) => id === EB ? FULL : id;
  t('Early Bird เต็ม → ยังเปิดป๊อปได้ (openPackage สลับใบเอง)', run('?pkg='+EB, [{id:FULL}], swap), [EB]);
}

console.log(NL+'④ ต่อเข้า init ถูกจังหวะ');
t('รอ packages โหลดเสร็จก่อนค่อยเปิด (ทั้ง ?pkgset= และ ?pkg=)',
  src.includes('loadPackagesIfNeeded().then(() => {') &&
  src.includes('if(!pkgSetFromUrl()) openPkgFromUrl();'), true);
/* ค่าที่เก็บไว้ข้ามหน้าล็อกอินต้องถูกล้างหลังใช้ — ไม่งั้นเปิดแอปเฉย ๆ วันหลังป๊อปเด้งเอง */
t('ใช้แล้วล้างทิ้ง กันป๊อปเด้งซ้ำรอบหน้า', src.includes('sessionStorage.removeItem(U360_QS_KEY)'), true);
t('loadPackagesIfNeeded เป็น async (คืน promise ให้ .then ได้)', src.includes('async function loadPackagesIfNeeded()'), true);
t('ห่อ try ทั้งก้อน — พังแล้วไม่ลากหน้าตาย', grab('openPkgFromUrl').includes('}catch(e){'), true);

console.log(NL+(fail?'❌':'✅')+' ผ่าน '+ok+' · ตก '+fail);
process.exitCode = fail?1:0;

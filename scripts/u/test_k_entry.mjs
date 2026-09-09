/* เทสทางเข้าครัว /k — ฟ้าเจอ 9 ก.ย. ว่าเข้าจากโดเมนหลักแล้วเปิดใบงานไม่ได้เลย
   🔴 ห้ามแตะไฟล์ของห้องครัว — แก้ที่ตัวเปลี่ยนทางของเราจุดเดียว */
import fs from 'node:fs';
const NL=String.fromCharCode(10);
const src=fs.readFileSync(new URL('../../pwa/app-k.html',import.meta.url),'utf8');
let ok=0,fail=0;
const t=(n,got,want)=>{const g=JSON.stringify(got),w=JSON.stringify(want);
  if(g===w){ok++;console.log('  ✅',n);}else{fail++;console.log('  ❌',n,NL+'     ได้  '+g+NL+'     ควร  '+w);}};

const HOST='https://under360-system.vercel.app';
console.log(NL+'① เด้งไปโดเมนที่มีไฟล์ครัวอยู่จริง');
t('ระบุโดเมนชัด ไม่ใช่ทางลัด', src.includes("location.replace('"+HOST+"/kitchen/index.html')"), true);
t('ไม่เหลือการเด้งแบบไม่ระบุโดเมน', src.includes("location.replace('/kitchen"), false);
t('ทางสำรองตอนปิด JS ก็ระบุโดเมนเหมือนกัน', src.includes('href="'+HOST+'/kitchen/index.html"'), true);

console.log(NL+'② ไม่แตะของห้องครัว');
{
  const files=fs.readdirSync(new URL('../../kitchen/',import.meta.url));
  t('ไฟล์ห้องครัวยังอยู่ครบ ไม่ได้ถูกลบ', files.length>0, true);
  t('index.html ของห้องครัวยังอยู่', files.includes('index.html'), true);
}

console.log(NL+'③ ของเดิมต้องไม่หาย');
t('ยังมีด่านรหัส', src.includes('src="/gate.js"'), true);
t('ยังเป็น PWA ติดหน้าโฮมได้ (manifest)', src.includes('manifest-k.webmanifest'), true);
t('ยังมีไอคอน', src.includes('/pwa/icon-192.png'), true);
t('ยังกัน Google', src.includes('noindex'), true);

console.log(NL+(fail?'❌':'✅')+' ผ่าน '+ok+' · ตก '+fail);
process.exitCode=fail?1:0;

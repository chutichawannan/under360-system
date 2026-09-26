/* เทสแบนเนอร์หัวป๊อปคอร์สเจ (นัทเลือกแบบ ข เอง 9 ก.ย.)
   🔴 ข้อที่สำคัญที่สุด: แถบล่างต้องอ่านจากของจริง ไม่ฮาร์ดโค้ด
      Early Bird เต็ม → ระบบสลับเป็นราคาปกติให้เอง
      ถ้าแบนเนอร์ยังโชว์ ฿4,190 อยู่ = โกหกเรื่องเงิน แย่กว่าไม่มีแบนเนอร์ */
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
const IDLINE = (src.match(/const JAY_PKG_IDS = \[[^\]]*\];/) || [''])[0];

const draw = (pkg, opts) => {
  const o = opts || {};
  let html = '';
  const box = { set innerHTML(v){ html = v; }, get innerHTML(){ return html; } };
  new Function('document','currentPkg','pkgGiftsOf','giftLineText','pkgQuotaOf','pkgQuotaLeft','h',
    IDLINE + NL + grab('renderPkgBanner') + '; renderPkgBanner();')(
      { getElementById: (id) => (id === 'pkg-banner' ? box : null) },
      pkg,
      () => o.gifts || [],
      (l) => (l||[]).map(g => g.name + (g.qty>1?' ×'+g.qty:'')).join(' · '),
      () => o.quota || null,
      () => (o.left === undefined ? null : o.left),
      (x) => String(x == null ? '' : x));
  return html;
};

const EBPKG = { id: EB, name: 'คอร์สเจ 2569 — Early Bird (50 คนแรก)', base_price: 4190 };
const FULLPKG = { id: FULL, name: 'คอร์สเจ 2569 — ราคาปกติ', base_price: 4490 };
const QUOTA = { limit: 50, label: 'Early Bird 50 คอร์สแรก' };

console.log(NL + '① โชว์เฉพาะคอร์สเจ');
t('Early Bird → มีแบนเนอร์', draw(EBPKG, {quota:QUOTA,left:42}).length > 0, true);
t('ราคาปกติ → มีแบนเนอร์', draw(FULLPKG, {}).length > 0, true);
t('แพคอื่น (Diet Set) → ไม่มีแบนเนอร์', draw({id:'อื่น',name:'Diet Set A',base_price:1350}, {}), '');
t('ไม่มีแพคเปิดอยู่ → ไม่มีแบนเนอร์', draw(null, {}), '');

console.log(NL + '② 🔴 ราคาต้องมาจาก DB ไม่ใช่ฮาร์ดโค้ด');
t('Early Bird โชว์ ฿4,190', /฿4,190/.test(draw(EBPKG,{quota:QUOTA,left:42})), true);
t('ราคาปกติโชว์ ฿4,490', /฿4,490/.test(draw(FULLPKG,{})), true);
t('เปลี่ยนราคาใน DB แบนเนอร์เปลี่ยนตาม',
  /฿3,900/.test(draw({id:EB,name:'x',base_price:3900},{quota:QUOTA,left:5})), true);
t('ไม่มีเลข 4,190 ฝังตายในโค้ด', /['"]?4,?190['"]?/.test(grab('renderPkgBanner')), false);

console.log(NL + '③ 🔴 Early Bird เต็ม — ป้ายต้องไม่ค้าง');
t('ยังเหลือสิทธิ์ → โชว์ป้าย Early Bird',
  /Early Bird 50 คอร์สแรก/.test(draw(EBPKG,{quota:QUOTA,left:8})), true);
t('เหลือ 0 → ไม่โชว์ป้าย Early Bird แล้ว',
  /Early Bird 50 คอร์สแรก/.test(draw(EBPKG,{quota:QUOTA,left:0})), false);
t('เหลือ 0 → โชว์ชื่อแพคแทน',
  /คอร์สเจ 2569/.test(draw(EBPKG,{quota:QUOTA,left:0})), true);
t('แพคราคาปกติ (ไม่มีโควตา) → โชว์ชื่อแพค',
  /คอร์สเจ 2569 — ราคาปกติ/.test(draw(FULLPKG,{})), true);

console.log(NL + '④ ของแถมอ่านจาก pkg_gifts');
t('มีของแถม → ต่อท้ายป้าย',
  /แก้วสลัด/.test(draw(EBPKG,{quota:QUOTA,left:10,gifts:[{code:'G1',name:'แก้วสลัด',qty:1}]})), true);
t('ไม่มีของแถม → ไม่มีคำว่า "ฟรี" ลอย ๆ',
  /ฟรี/.test(draw(EBPKG,{quota:QUOTA,left:10})), false);
t('ของแถม 2 ชิ้น → โชว์จำนวน',
  /×2/.test(draw(EBPKG,{quota:QUOTA,left:10,gifts:[{code:'G1',name:'แก้วสลัด',qty:2}]})), true);

console.log(NL + '⑤ หน้าตาตามบรีฟ');
{
  const b = draw(EBPKG,{quota:QUOTA,left:20});
  t('แถบแดง #993C1D', b.includes('#993C1D'), true);
  t('แถบครีม #FAEEDA', b.includes('#FAEEDA'), true);
  t('ป้ายวันที่ 9–18 ตุลาคม', b.includes('9–18 ตุลาคม'), true);
  t('หัวใหญ่ 2 บรรทัด', b.includes('กินเจให้ครบ 10 วัน<br>โดยไม่ต้องคิดเมนูเอง'), true);
  t('บรรทัดรอง 30 เมนู', b.includes('30 เมนูไม่ซ้ำ · ส่งถึงบ้าน 3 รอบ'), true);
}

console.log(NL + '⑥ เปิดป๊อปมาต้องอยู่บนสุด (นัทเจอเองตอนเทส)');
t('เด้ง scrollTop = 0 ตอนเปิด', src.includes("_sc.scrollTop = 0"), true);
t('กล่องเลื่อนมี id ให้จับได้', src.includes('class="scroll pb-btn" id="pkg-scroll"'), true);
t('วาดแบนเนอร์ก่อนเปิดป๊อป', src.indexOf('renderPkgBanner();') < src.indexOf("document.getElementById('pkg-backdrop').classList.add('on')"), true);

console.log(NL + (fail?'❌':'✅') + ' ผ่าน ' + ok + ' · ตก ' + fail);
process.exitCode = fail ? 1 : 0;

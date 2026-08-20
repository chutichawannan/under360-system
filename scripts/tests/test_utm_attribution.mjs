/* เทส UTM Attribution — รันซ้ำได้ ไม่ต้องเปิดเบราว์เซอร์
   ข้อที่สำคัญที่สุดที่ PM เน้น: **ไม่มี UTM ต้องสั่งได้เหมือนเดิม**
   รัน: node scripts/tests/test_utm_attribution.mjs                                */
import fs from 'fs';

const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8');
function grab(name){
  const i = src.indexOf('function '+name+'(');
  if(i<0) throw new Error('ไม่เจอฟังก์ชัน '+name);
  let d=0, started=false;
  for(let j=i;j<src.length;j++){
    if(src[j]==='{'){d++;started=true;}
    else if(src[j]==='}'){d--; if(started&&d===0) return src.slice(i,j+1);}
  }
}
const UTM_MAX_AGE_DAYS = 30;

// จำลอง browser เท่าที่ฟังก์ชันใช้
function makeCtx({ query='', stored=null, cookie='' }){
  const store = { u360_utm: stored===null ? null : JSON.stringify(stored) };
  return {
    document:{ cookie },
    location:{ search: query },
    localStorage:{
      getItem:k=>store[k],
      setItem:(k,v)=>{ store[k]=v; },
    },
    URLSearchParams,
    _store: store,
  };
}
function run(ctx){
  const fn = new Function('location','localStorage','URLSearchParams','UTM_MAX_AGE_DAYS','document', `
    ${grab('fbCookies')}
    ${grab('utmRead')}
    ${grab('utmTag')}
    return utmTag();
  `);
  return fn(ctx.location, ctx.localStorage, ctx.URLSearchParams, UTM_MAX_AGE_DAYS, ctx.document);
}

const DAY = 86400000;
const cases = [
  ['ไม่มีอะไรเลย (คนสั่งปกติ)          ', { query:'', stored:null }, null],
  ['localStorage ว่างเปล่า             ', { query:'', stored:{} }, null],
  ['ข้อมูลพัง (ไม่มี source)           ', { query:'', stored:{medium:'cpc'} }, null],
  ['จาก URL ของ LIFF เอง               ', { query:'?utm_source=fb&utm_medium=cpc&utm_campaign=mealplan-aug' }, 'fb/cpc/mealplan-aug'],
  ['จาก localStorage (เว็บเขียนไว้)     ', { query:'', stored:{source:'ig',medium:'paid',campaign:'hyrox',ts:Date.now()} }, 'ig/paid/hyrox'],
  ['URL ต้องชนะ localStorage           ', { query:'?utm_source=google', stored:{source:'fb',ts:Date.now()} }, 'google'],
  ['มีแค่ source                       ', { query:'?utm_source=line' }, 'line'],
  ['เก่าเกิน 30 วัน = ไม่นับ            ', { query:'', stored:{source:'fb',ts:Date.now()-31*DAY} }, null],
  ['29 วัน = ยังนับ                     ', { query:'', stored:{source:'fb',ts:Date.now()-29*DAY} }, 'fb'],
  ['อักขระแปลกปลอม ถูกตัดออก           ', { query:'?utm_source=fb%3Cscript%3E&utm_campaign=a%20b' }, 'fbscript/ab'],
  /* ── fbclid: รหัสคลิกโฆษณาของ Meta (เลขาสั่งเพิ่ม 20 ส.ค.) ── */
  ['มีแต่ fbclid ไม่มี utm เลย         ', { query:'?fbclid=ABC123' }, 'fb/paid | fbclid:ABC123'],
  ['fbclid มาคู่กับ utm ครบ            ', { query:'?utm_source=fb&utm_medium=cpc&utm_campaign=aug&fbclid=XYZ' }, 'fb/cpc/aug | fbclid:XYZ'],
  ['fbclid ต้องไม่ทับ utm_source       ', { query:'?utm_source=ig&fbclid=Q1' }, 'ig | fbclid:Q1'],
  ['คุกกี้ fbp/fbc ถูกเก็บด้วย          ', { query:'?utm_source=fb', cookie:'_fbp=fb.1.99; _fbc=fb.1.88' }, 'fb | fbp:fb.1.99 fbc:fb.1.88'],
  ['ไม่มีคุกกี้ = ไม่ต่ออะไรเพิ่ม        ', { query:'?utm_source=fb' }, 'fb'],
  /* ── utm_content: ห้อง M ส่งมาด้วย ต้องรับให้ตรงกัน (20 ส.ค.) ── */
  ['รับ utm_content ที่ M ส่งมา        ', { query:'?utm_source=fb&utm_medium=cpc&utm_campaign=aug&utm_content=vid1' }, 'fb/cpc/aug/vid1'],
  ['utm_content + fbclid พร้อมกัน      ', { query:'?utm_source=fb&utm_content=a1&fbclid=Z9' }, 'fb/a1 | fbclid:Z9'],
];

let pass=0, fail=0;
console.log('=== utmTag() ===');
cases.forEach(([name, cfg, want])=>{
  let got;
  try{ got = run(makeCtx(cfg)); }catch(e){ got = 'ERROR: '+e.message; }
  const ok = got === want;
  console.log((ok?'  ✅ ':'  ❌ ')+name+' → '+JSON.stringify(got)+(ok?'':'   (ควรได้ '+JSON.stringify(want)+')'));
  ok?pass++:fail++;
});

// ── ข้อที่สำคัญที่สุด: payload ต้องไม่มีฟิลด์นี้เลยเมื่อไม่มี UTM ──
console.log('\n=== ห้ามพังเมื่อไม่มี UTM (ข้อที่ PM เน้น) ===');
const guard = src.includes('if(_utm) orderPayload.source_campaign = _utm;');
console.log((guard?'  ✅ ':'  ❌ ')+'ใส่ฟิลด์เฉพาะตอนมีค่า ไม่ส่ง null ไปทับ');
guard?pass++:fail++;

const wrapped = /try\{\s*\n\s*const _utm = utmTag\(\);[\s\S]{0,120}?\}catch\(e\)\{/.test(src);
console.log((wrapped?'  ✅ ':'  ❌ ')+'ครอบ try/catch — utmTag พังก็สั่งของได้');
wrapped?pass++:fail++;

const untouched = !/orderPayload\.source\s*=/.test(src);
console.log((untouched?'  ✅ ':'  ❌ ')+'ไม่แตะ orders.source (finance/orders.mjs ใช้กรองยอดขาย)');
untouched?pass++:fail++;

console.log('\n'+(fail?('❌ ไม่ผ่าน '+fail+' ข้อ'):('✅ ผ่านทั้งหมด '+pass+' ข้อ')));
process.exit(fail?1:0);

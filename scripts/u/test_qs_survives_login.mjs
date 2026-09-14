/* เทส "ลิงก์แอดต้องรอดข้ามหน้าล็อกอิน LINE" — นัทเทสเจอเอง 14 ก.ย. 2569

   อาการที่นัทเจอบนมือถือจริง:
     กดลิงก์ ?pkgset=... → LINE ให้ล็อกอิน → กลับมาแล้ว **ป๊อปไม่เด้ง หน้าเมนูเปล่า**
     กดลิงก์เดิมซ้ำ (ตอนนี้ล็อกอินแล้ว) → เด้งปกติ

   ทำไมเรื่องนี้ใหญ่ (06 ชี้เอง): คนที่ต้องล็อกอิน = ลูกค้าใหม่
   = คนทั้งหมดที่เราจ่ายค่าแอดพามา → จ่ายเงินพาคนมาเจอหน้าเปล่า 100%
   และไม่ใช่แค่ ?pkgset= — ?pkg= (แคมเปญเจ) กับ utm_* (ตัววัดผลแอด) หายด้วยกันหมด

   เทสนี้จำลอง 2 หน้าจอ: หน้าแรก (มี query) → เด้งล็อกอิน → หน้าใหม่ (query ว่าง)
   ถ้า u360qs ไม่กู้ค่าคืน เทสนี้จะตกทันที */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');
const grab = (n) => { const i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) { if (src[j]==='{'){d++;st=true;} else if (src[j]==='}'){d--; if(st&&d===0) return src.slice(i,j+1);} } };

/* ชื่อคีย์เอามาจากไฟล์จริง — ถ้ามีคนเปลี่ยนชื่อ เทสจะพังให้รู้ ไม่ใช่ผ่านไปเงียบ ๆ */
const KEYLINE = (src.split(NL).find(l => l.indexOf('const U360_QS_KEY') === 0) || '');
if (!KEYLINE) { console.log('❌ หา const U360_QS_KEY ในไฟล์ไม่เจอ'); process.exit(1); }

let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL+'     ได้  '+g+NL+'     ควร  '+w); } };

/* กล่องเก็บของฝั่งเบราว์เซอร์ — อยู่รอดข้ามการโหลดหน้า เหมือน sessionStorage จริง */
const mkBrowser = () => {
  const store = {};
  const ss = { getItem: k => (k in store ? store[k] : null),
               setItem: (k, v) => { store[k] = String(v); },
               removeItem: k => { delete store[k]; } };
  /* 1 "หน้า" = โหลดฟังก์ชันใหม่ แต่ยังใช้กล่องเก็บของใบเดิม */
  const openPage = (search, now) => new Function('location','sessionStorage','URLSearchParams','Date',
    KEYLINE + NL + grab('u360StashQs') + NL + grab('u360qs') + NL +
    'return { stash: u360StashQs, qs: u360qs };')(
      { search }, ss, URLSearchParams,
      now ? Object.assign(Object.create(Date), { now: () => now }) : Date);
  return { store, openPage };
};

console.log(NL + '① เคสที่นัทเจอจริง — ลูกค้าใหม่กดลิงก์แอดแล้วต้องล็อกอินก่อน');
{
  const b = mkBrowser();
  const first = b.openPage('?pkgset=protein&utm_source=fb&utm_campaign=pack');
  first.stash();                                  // โค้ดจริงเก็บค่าไว้ก่อน liff.login() เด้งออก
  const after = b.openPage('');                   // กลับจาก LINE — query ว่างเปล่า
  t('ยังรู้ว่าลูกค้ามาจากลิงก์กลุ่มไหน', after.qs().get('pkgset'), 'protein');
  t('ที่มาแอด (utm) ไม่หายไปด้วย', after.qs().get('utm_source'), 'fb');
  t('ชื่อแคมเปญยังอยู่ครบ', after.qs().get('utm_campaign'), 'pack');
}

console.log(NL + '② ?pkg= ของแคมเปญเจ — บั๊กเดียวกัน ต้องรอดด้วย');
{
  const b = mkBrowser();
  b.openPage('?pkg=abc-123').stash();
  t('แคมเปญเจก็ไม่เสียคนใหม่แล้ว', b.openPage('').qs().get('pkg'), 'abc-123');
}

console.log(NL + '③ ของสดใน URL ต้องมาก่อนของที่เก็บไว้เสมอ');
{
  const b = mkBrowser();
  b.openPage('?pkgset=protein').stash();
  const next = b.openPage('?pkgset=jay');          // ลูกค้ากดลิงก์ใหม่ในเซสชันเดียวกัน
  t('กดลิงก์ใหม่ = ได้ของใหม่ ไม่ใช่ของค้าง', next.qs().get('pkgset'), 'jay');
}

console.log(NL + '④ ห้ามค้างจนป๊อปเด้งเองตอนลูกค้าเปิดแอปเฉย ๆ');
{
  const b = mkBrowser();
  b.openPage('?pkgset=protein').stash();
  /* 11 นาทีผ่านไป = คนละครั้งที่เข้ามาแล้ว ไม่ใช่ขากลับจากล็อกอิน */
  const late = b.openPage('', Date.now() + 11 * 60000);
  t('เกิน 10 นาที = ลืมทิ้ง', late.qs().get('pkgset'), null);
  t('ลบของที่หมดอายุออกจากเครื่องด้วย', b.store.u360_qs === undefined, true);
}

console.log(NL + '⑤ เครื่องที่ปิด sessionStorage (โหมดส่วนตัว) ต้องไม่พัง');
{
  const dead = { getItem(){ throw new Error('blocked'); }, setItem(){ throw new Error('blocked'); }, removeItem(){ throw new Error('blocked'); } };
  const page = (search) => new Function('location','sessionStorage','URLSearchParams',
    KEYLINE + NL + grab('u360StashQs') + NL + grab('u360qs') + NL + 'return { stash: u360StashQs, qs: u360qs };')(
      { search }, dead, URLSearchParams);
  const p1 = page('?pkgset=protein');
  let threw = false;
  try { p1.stash(); } catch (e) { threw = true; }
  t('เก็บไม่ได้ก็ไม่โยน error', threw, false);
  t('ยังอ่านของสดใน URL ได้ตามปกติ', p1.qs().get('pkgset'), 'protein');
  t('ขากลับไม่มีของ = ตกไปหน้าเมนูปกติ ไม่ค้างจอ', page('').qs().get('pkgset'), null);
}

console.log(NL + '⑥ โค้ดจริงต้องเก็บค่า "ก่อน" เด้งไปล็อกอิน ไม่ใช่หลัง');
{
  const i = src.indexOf('u360StashQs();'), j = src.indexOf('liff.login();');
  t('u360StashQs() อยู่ก่อน liff.login()', i > 0 && j > 0 && i < j, true);
  t('ไม่มีใครแอบอ่าน query ตรง ๆ เหลืออยู่', src.indexOf('new URLSearchParams(location.search)') , -1);
}

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + ok) : ('✅ ผ่านทั้งหมด ' + ok + ' ข้อ'));
process.exitCode = fail ? 1 : 0;

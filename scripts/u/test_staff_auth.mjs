/* ล็อกอินหลังบ้านค้างไว้ได้นานแค่ไหน — นัทเจอเอง 23 ก.ย. 2569 ว่า "ต้องล็อกอินใหม่บ่อยเกินไป"
   ต้นเหตุ: เดิมเก็บอายุ session = อายุโทเคนของ Google (~1 ชม.)
            ทั้งที่เราใช้โทเคนแค่ครั้งเดียวตอนถามว่าอีเมลอะไร แล้วไม่ได้ใช้อีกเลย */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const A = fs.readFileSync(new URL('../../staff/auth.js', import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL + '     ได้  ' + g + NL + '     ควร  ' + w); } };

/* ดึง remember()+saved() ตัวจริงออกมารันกับ localStorage ปลอม */
const a = A.indexOf('  var STAY_MS'), b = A.indexOf('  function ok(email)');
const src = A.slice(a, b);
const sandbox = (store) => new Function('localStorage', 'STORE',
  src + '; return { remember: remember, saved: saved };')(
  { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } },
  'u360_staff');
const days = (exp) => Math.round((exp - Date.now()) / 86400000);

console.log(NL + '① ล็อกอินครั้งเดียวอยู่ได้นาน');
{
  const store = {}, s = sandbox(store);
  s.remember('nut@example.com');
  t('จำไว้ 60 วัน (ไม่ใช่ 1 ชม. ตามอายุโทเคน)', days(JSON.parse(store['u360_staff']).exp), 60);
  t('อ่านกลับได้ ไม่ต้องล็อกอินใหม่', s.saved().email, 'nut@example.com');
}

console.log(NL + '② เปิดหน้าอีกครั้ง = ต่ออายุให้เอง');
{
  const store = { 'u360_staff': JSON.stringify({ email: 'nut@example.com', exp: Date.now() + 2 * 86400000 }) };
  sandbox(store).saved();
  t('เหลือ 2 วัน → เปิดหน้าแล้วกลับเป็น 60 วัน', days(JSON.parse(store['u360_staff']).exp), 60);
}

console.log(NL + '③ หมดอายุจริงต้องยังถามล็อกอิน (ไม่ใช่ผ่านตลอดกาล)');
t('หมดอายุแล้ว = ไม่ผ่าน', sandbox({ 'u360_staff': JSON.stringify({ email: 'x@e.com', exp: Date.now() - 1000 }) }).saved(), null);
t('ไม่เคยล็อกอิน = ไม่ผ่าน', sandbox({}).saved(), null);
t('ข้อมูลเสีย = ไม่ผ่าน ไม่พัง', sandbox({ 'u360_staff': 'ขยะ' }).saved(), null);

console.log(NL + '④ ไม่เหลือทางเก่าที่ผูกกับอายุโทเคน');
t('เลิกใช้ expires_at ของโทเคนแล้ว', A.indexOf("p.get('expires_at')") < 0, true);
t('มีทางเขียน session ทางเดียว (remember)', A.split('localStorage.setItem(STORE').length - 1, 1);
t('ด่านตรวจอีเมลยังอยู่ครบ', A.indexOf('function ok(email)') >= 0 && A.indexOf('อีเมลนี้ยังไม่ได้รับอนุญาต') >= 0, true);

console.log(NL + 'ผ่าน ' + ok + ' · ตก ' + fail);
if (fail) process.exit(1);

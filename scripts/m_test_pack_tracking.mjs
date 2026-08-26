/* เทสว่าหน้า pack.html ส่งป้ายที่มาครบไหม — ดึงฟังก์ชันจริงจากไฟล์มารัน
   (เทสในเบราว์เซอร์โดนบล็อกเพราะเกี่ยวกับ query string เลยเทสฝั่ง node แทน) */
import fs from 'fs';

const h = fs.readFileSync('web/pack.html', 'utf8').replace(/\r\n/g, '\n');
const m = h.match(/function u360Tracked\(base\)\{[\s\S]*?\n\}/);
if (!m) { console.error('❌ ดึง u360Tracked ไม่ได้'); process.exit(1); }

/* ES module: eval สร้างตัวแปรใน scope ไม่ได้ → ประกอบเป็นฟังก์ชันแล้วคืนออกมา */
const store = {};
let search = '';
const u360Tracked = new Function('localStorage', 'getSearch', `
  const location = { get search(){ return getSearch(); } };
  ${m[0]}
  return u360Tracked;`)(
  { getItem: k => store[k] || null, setItem: (k, v) => store[k] = v },
  () => search
);

const BASE = (h.match(/const ORDER_URL = '([^']+)'/) || [])[1];
console.log('ปุ่มชี้ไป: ' + BASE + '\n');

let bad = 0;
const T = [
  ['มาจากแอด FB ติดแท็กครบ', '?utm_source=fb&utm_medium=paid&utm_campaign=pack-aug&utm_content=imgA&fbclid=IwARx', {}],
  ['จำค่าจากครั้งก่อน (เข้าตรง)', '', { source: 'fb', medium: 'paid', campaign: 'pack-aug', content: 'imgB', fbclid: 'IwARy' }],
  ['ไม่มีอะไรเลย', '', {}],
];
for (const [name, q, st] of T) {
  search = q; store['u360_utm'] = JSON.stringify(st);
  const url = u360Tracked(BASE);
  const has = k => url.includes(k);
  const full = has('utm_source=') && has('utm_medium=') && has('utm_campaign=') && has('utm_content=') && has('fbclid=');
  const lid = /[?&]lid=2011148232/.test(url);
  const oneQ = (url.match(/\?/g) || []).length === 1;
  const expectFull = Object.keys(st).length > 0 || q.length > 0;
  const ok = lid && oneQ && (expectFull ? full : url === BASE);
  if (!ok) bad++;
  console.log(`${ok ? '✅' : '❌'} ${name}`);
  console.log(`   ${url}`);
  if (expectFull) console.log(`   ป้ายครบ 5 ตัว: ${full ? 'ใช่' : 'ไม่ครบ'} · lid ยังอยู่: ${lid ? 'ใช่' : 'หาย'} · มี ? ตัวเดียว: ${oneQ ? 'ใช่' : 'ไม่'}`);
  console.log('');
}
console.log(bad ? `❌ ตก ${bad}` : '✅ ผ่านหมด — utm_content ไม่ตกหล่น (ตัวที่ 06 กำชับว่าใช้แยกว่ารูปไหนทำเงิน)');
process.exit(bad ? 1 : 0);

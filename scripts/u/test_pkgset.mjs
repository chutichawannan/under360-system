/* เทส ?pkgset= — ป๊อป "เลือกไซส์" จากลิงก์แอด (นัทเคาะ · 06 Ads ขอ 14 ก.ย. 2569)

   โจทย์ข้อเดียว: คนกดแอดเข้ามาต้องเจอของที่จะซื้อทันที ไม่ต้องหาเอง

   ที่มา: รอบแอด ส.ค. ฿467 · คนกด 105 · เข้าเว็บ 264 · กดสั่ง 20 → ออเดอร์ ฿76 ใบเดียว
   06 ไล่เจอว่าแพคเปิดขายใน packages แต่การ์ดหน้าโฮมปิด → ลูกค้าเข้ามาแล้วหาแพคไม่เจอ

   🔴 กฎเดิมของไฟล์นี้ที่ห้ามหลุด (06 ย้ำเอง):
      id ผิด / ปิดขาย / โหลดไม่ทัน = ตกไปหน้าเมนูปกติ **ห้ามค้างจอเปล่า** */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const url = (p) => new URL(p, import.meta.url);
const L = fs.readFileSync(url('../../liff_customer.html'), 'utf8').split(String.fromCharCode(13)).join('');

let pass = 0, fail = 0;
const ok = (name, got) => {
  if (got === true) { pass++; console.log('  ✅', name); }
  else { fail++; console.log('  ❌', name); }
};
const has = (s) => L.indexOf(s) >= 0;
function grab(src, head) {
  let i = src.indexOf(head);
  if (i < 0) return null;
  let d = 0, started = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; started = true; }
    else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
  }
  return null;
}

console.log(NL + '1) กลุ่มแพคมาจากฐานข้อมูล ไม่ฮาร์ดโค้ด (06 ขอให้ใช้ซ้ำกับคอร์สเจ/แคมเปญอื่นได้)');
ok('อ่านกลุ่มจาก kitchen_data คีย์ pkg_sets', has("const PKGSET_KEY = 'pkg_sets'"));
ok('โหลดมาพร้อมคีย์อื่น ไม่เพิ่ม query ใหม่', has('MAKE_KEY, PKGSET_KEY,'));
ok('อ่านพลาดแล้วไม่พัง ถือว่าไม่มีกลุ่ม', has('catch (e) { pkgSets = {}; }'));
ok('ไม่มีรหัสแพคฮาร์ดโค้ดในโค้ด', !has('c092c6d7-c300-44f6-b26a-28d4946dce41'));
ok('ไม่มีราคาฮาร์ดโค้ด — อ่านจาก base_price', has('Number(pk.base_price || 0).toLocaleString()'));

console.log(NL + '2) 🔴 ห้ามค้างจอเปล่าไม่ว่ากรณีไหน');
{
  const fn = grab(L, 'function pkgSetFromUrl(){');
  ok('ดึง pkgSetFromUrl ออกมาได้', !!fn);
  ok('ไม่มีกลุ่มนี้ → คืน false ให้ตกไปหน้าเมนูปกติ',
    !!fn && fn.indexOf("console.warn('?pkgset= ไม่มีกลุ่มนี้ในระบบ:'") >= 0);
  ok('แพคในกลุ่มปิดขายหมด → คืน false เหมือนกัน',
    !!fn && fn.indexOf('แพคในกลุ่มปิดขายหมดแล้ว') >= 0);
  ok('พังกลางทางก็ยังกลืน error แล้วปล่อยไปหน้าเมนู',
    !!fn && fn.indexOf('อยู่หน้าเมนูปกติแทน') >= 0);
  ok('เอาเฉพาะแพคที่เปิดขายจริงตอนนี้ (ปิดแล้วต้องไม่โผล่ให้กด)',
    !!fn && fn.indexOf('.map(id => (packages || []).find(x => x.id === id))') >= 0 &&
    fn.indexOf('.filter(Boolean)') >= 0);
  ok('เหลือใบเดียวไม่ต้องให้เลือก เข้าแพคเลย',
    !!fn && fn.indexOf('if(list.length === 1){ openPackage(list[0].id); return true; }') >= 0);
}

console.log(NL + '3) ของเดิมต้องไม่พัง');
ok('?pkg= เดิมยังอยู่', has('function openPkgFromUrl(){'));
ok('?pkgset= มาก่อน ไม่มีค่อยใช้ ?pkg= เดิม',
  has('if(!pkgSetFromUrl()) openPkgFromUrl();'));
ok('กดเลือกไซส์แล้วเข้าทางเดิม (openPackage) ไม่ได้เขียนทางใหม่',
  has('function pickPkgSet(id){ closePkgSet(true); openPackage(id); }'));

console.log(NL + '4) หน้าตา — เจอจริงตอนเทส 14 ก.ย.');
/* ป๊อปโดนแถบหมวด/แถบตะกร้าลอยทับครึ่งใบ เพราะของเดิมในไฟล์นี้ลอยสูงถึง 999 */
ok('ป๊อปอยู่เหนือทุกอย่างในหน้า', has('z-index:10001') && has('z-index:10000'));
ok('ชื่อแพคยาวถูกตัดที่ขีด ไม่ตกบรรทัดที่ 3', has("const cut = full.indexOf('—');"));
ok('ใส่ชื่อผ่าน textContent ไม่ต่อสตริง html (ไฟล์นี้ไม่มี esc ให้ใช้)',
  has('n.textContent = (cut > 0 ? full.slice(0, cut) : full).trim();'));
ok('มีทางออกให้คนที่ยังไม่อยากเลือก', has('ดูเมนูทั้งหมดก่อน'));

console.log(NL + '5) ⬅️ ปุ่มย้อนกลับต้องพากลับไปหน้าเลือกไซส์ (นัทเจอเอง 14 ก.ย.)');
/* คนที่กดย้อนกลับคือคนที่กำลังเทียบ S กับ M = คนที่สนใจที่สุด
   เดิมหลุดไปหน้าเมนูรวม ต้องกดลิงก์แอดใหม่ซึ่งลูกค้าไม่รู้ = เสียคนที่เราจ่ายค่าคลิกไปแล้ว */
ok('ปุ่มย้อนกลับเรียก pkgBack ไม่ใช่ปิดทิ้ง', has('class="hdr-back" onclick="pkgBack()"'));
ok('ไม่เหลือปุ่มย้อนกลับตัวเก่าที่ปิดทิ้ง', !has('class="hdr-back" onclick="closePkgSheet()"'));
{
  const fn = grab(L, 'function pkgBack(){');
  ok('ดึง pkgBack ออกมาได้', !!fn);
  ok('จำที่มาไว้ก่อนปิด (closePkgSheet ล้างทิ้ง)', !!fn && fn.indexOf('const back = pkgSetBack;') >= 0);
  ok('มีที่มาจริง และมีให้เลือกเกิน 1 ใบ ถึงจะเด้งกลับ', !!fn && fn.indexOf('back.list.length > 1') >= 0);
  ok('เด้งกลับไม่สำเร็จก็ไม่ค้างจอ ตกไปหน้าเมนูปกติ', !!fn && fn.indexOf('อยู่หน้าเมนูปกติแทน') >= 0);
}
ok('กดเลือกไซส์ = ยังอยู่ในเส้นทาง ไม่ลืมที่มา', has('function pickPkgSet(id){ closePkgSet(true);'));
ok('กด ✕ / แตะนอกป๊อป = ตั้งใจออก ลืมที่มา', has('if(!keepBack) pkgSetBack = null;'));
ok('ออกจากหน้าเลือกเมนูเมื่อไหร่ = จบเส้นทาง', has('pkgSetBack = null;            // ออกจากหน้าเลือกเมนูแล้ว'));

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + pass) : ('✅ ผ่านทั้งหมด ' + pass + ' ข้อ'));
process.exit(fail ? 1 : 0);

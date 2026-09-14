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
ok('ไม่มีราคาฮาร์ดโค้ด — อ่านจาก base_price', has('_b.toLocaleString()') && has('Number(pk.base_price || 0)'));

console.log(NL + '2) 🔴 ห้ามค้างจอเปล่าไม่ว่ากรณีไหน');
{
  /* ตรรกะกันจอเปล่าย้ายมาอยู่ตัวกลาง openPkgSetByKey แล้ว
     (ลิงก์แอดกับการ์ดหน้าแรกใช้ทางเดียวกัน จะได้ไม่หลุดกันเอง) */
  const fn = grab(L, 'function openPkgSetByKey(want){');
  ok('ดึงตัวกลาง openPkgSetByKey ออกมาได้', !!fn);
  ok('ไม่มีกลุ่มนี้ → คืน false ให้ตกไปหน้าเมนูปกติ',
    !!fn && fn.indexOf('ไม่มีกลุ่มแพคนี้ในระบบ') >= 0);
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

console.log(NL + '6) 🎨 ป๊อปต้องขายของ ไม่ใช่แค่ลิสต์ (นัทสั่ง 14 ก.ย. · คำขายจาก 06)');
ok('มีแบนเนอร์', has('.pkgset-banner{') && has('pkgset-banner'));
ok('มีคำอธิบายว่าคืออะไร', has('กับข้าวปรุงสุกจากครัวเรา'));
ok('มีข้อดีเป็นข้อ ๆ', has('bullets: ['));
ok('มีป้ายบอกว่าใครควรเอาไซส์ไหน', has('tags: ['));
ok('บรรทัดค่าส่งตามที่นัทยืนยัน 14 ก.ย.', has('กรุงเทพฯ ส่งฟรีทุกไซส์'));
/* 🔴 ราคาต้องคำนวณสดจาก DB — ฮาร์ดโค้ดเมื่อไหร่ = โกหกลูกค้าเรื่องเงินตอนแอดมินแก้ราคา */
ok('ตกแพคละ คำนวณจาก base_price ÷ qty', has('Math.ceil(_b / _q)'));
ok('ไม่มีตัวเลขราคาพิมพ์ไว้ในคำขาย', !has('1,400') && !has('2,650') && !has('4,900') && !has('฿67') && !has('฿64') && !has('฿59'));
ok('ป้ายไซส์ไล่ตามจำนวนแพค ไม่ผูกกับ id แพค', has('list.slice().sort((a,b) => Number(a.qty||0)'));
/* ⛔ กฎแบรนด์ที่ 06 ย้ำ — ผิดข้อเดียวคือต้องถอดแอด */
ok('ไม่มีคำว่าดีที่สุด/ถูกที่สุด', !has('ดีที่สุด') && !has('ถูกที่สุด') && !has('ถูกกว่าเจ้า'));
ok('ไม่พูดแง่ลบกับของแช่แข็ง (เราขายเอง)', !has('ไม่เหมือนแช่แข็ง') && !has('ไม่ใช่ของแช่แข็ง'));
ok('แก้คำได้จากฐานข้อมูลโดยไม่ต้องแตะโค้ด', has('Object.assign({}, PKGSET_COPY[set.key] || {}, set)'));
ok('จอเตี้ยตัดข้อดีเหลือ 2 ข้อ ไม่ดันปุ่มตกจอ', has('window.innerHeight || 800) < 700 ? 2 : 3'));

console.log(NL + '7) ดีไซน์ที่นัทเคาะ 14 ก.ย. (ม็อค docs/MOCK_PKGSET_POPUP.html)');
ok('แบนเนอร์รูปเต็มผืน + ฟิล์มดำ', has('pkgset-shade') && has('object-fit:cover'));
/* 🔴 รูปนัทเลือกเอง อัปทาง /pwa/inbox.html — ครอปผิดแล้วมือกับแพคที่เป็นพระเอกโดนตัด */
ok('ครอปตามที่ 06 กำชับ', has("crop: 'center 16%'"));
ok('รูปพัง = พื้นเขียว ไม่ใช่กล่องขาวว่าง', has('img.onerror = noImg;'));
ok('ฟอนต์ Sarabun ที่นัทเลือก', has('family=Sarabun'));
ok('ป้ายเริ่มต้นที่นี่อยู่บนใบเล็กสุดเท่านั้น', has('rank === 0 && cp.bestTag'));
ok('รูปประจำไซส์ไล่ตามใบเล็กไปใหญ่ ไม่ผูก id', has('cp.thumbs[rank]'));
ok('รูปไซส์หาย = การ์ดยังใช้ได้ ไม่ค้างกรอบเปล่า', has('im.onerror = () => { im.remove(); }'));
/* ④ ของ 06: L ตั้ง delivery_rounds = 2 จริงใน DB — ต้องอ่านจาก DB ไม่ใช่เขียนว่าใบไหน */
ok('แบ่งรอบส่งอ่านจาก DB', has('Number(pk.delivery_rounds || 0)') && has('แบ่งส่งได้ '));
ok('ไม่ฮาร์ดโค้ดว่าใบไหนแบ่งส่งได้', !has("'Protein Pack L'"));
/* ⚠️ 06 เตือน: ปุ่ม S คือปุ่มที่คนส่วนใหญ่กด ห้ามตกจอบน iPhone SE */
ok('จอเตี้ยลดความสูงแบนเนอร์เอง', has('@media (max-height:700px){ .pkgset-head{height:186px} }'));

console.log(NL + '8) 🃏 การ์ดสไลด์หน้าแรกเปิดป๊อปได้ (นัทสั่ง 14 ก.ย.)');
/* เดิมป๊อปเข้าได้ทางเดียวคือลิงก์แอด — คนที่เปิดแอปเองไม่มีทางเจอแพคเลย */
ok('การ์ดที่ตั้ง __pkgset:<กลุ่ม>__ เปิดป๊อป', has("cat.startsWith('__pkgset:')") && has('openPkgSetByKey(setKey)'));
ok('ตัดชื่อกลุ่มออกจาก data-cat ถูกตำแหน่ง', has('cat.slice(9, -2)'));
ok('ลิงก์แอดกับการ์ดใช้ทางเดียวกัน ไม่เขียนซ้ำ', has('return openPkgSetByKey(want);'));
{
  /* หน้าจัดการ์ดต้องเลือกจากลิสต์ได้ ไม่ใช่ให้นัทพิมพ์รหัสกลุ่มเอง */
  const HE = fs.readFileSync(url('../../home_editor.html'), 'utf8').split(String.fromCharCode(13)).join('');
  ok('หน้าจัดการ์ดมีตัวเลือกกลุ่มแพคใน dropdown', HE.indexOf('__pkgset:') >= 0);
  ok('อ่านกลุ่มจาก kitchen_data ไม่ฮาร์ดโค้ด', HE.indexOf("eq('key','pkg_sets')") >= 0);
  ok('ยังไม่มีกลุ่มก็ไม่พัง แค่ไม่มีตัวเลือก', HE.indexOf('catch(e){ hePkgSets=[]; }') >= 0);
}

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + pass) : ('✅ ผ่านทั้งหมด ' + pass + ' ข้อ'));
process.exit(fail ? 1 : 0);

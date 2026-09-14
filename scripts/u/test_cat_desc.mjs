/* เทสคำอธิบายใต้แถบหมวด (นัทสั่ง 14 ก.ย. 2569)
   "ตรงหมวดแพ็คกับข้าวก็ต้องมีคำอธิบายเพิ่มนิดนึง แต่ก็ไม่ต้องยาว ๆ"

   หัวใจ: หมวดที่ไม่มีคำอธิบาย ต้องไม่มีอะไรเปลี่ยนเลย (ไม่เหลือช่องว่างค้าง)
          และคำต้องแก้ได้จากฐานข้อมูล ไม่ต้องรอห้อง u แก้โค้ด */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const L = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');
let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL+'     ได้  '+g+NL+'     ควร  '+w); } };
const has = (x) => L.indexOf(x) >= 0;

console.log(NL + '① มีที่ให้คำอธิบายอยู่ใต้แถบหมวด');
t('มีช่องในหน้า', has('id="catDesc"'), true);
t('อยู่ใต้แถบหมวดพอดี', has('<div class="ctabs" id="ctabsInner"></div>' + NL + '    <div class="cat-desc hide" id="catDesc"></div>'), true);
t('ใส่ข้อความผ่าน textContent ไม่ต่อ html', has('dsc.textContent = txt;'), true);

console.log(NL + '② หมวดที่ไม่มีคำอธิบาย ต้องไม่เหลือช่องว่างค้าง');
t('ไม่มีคำ = ซ่อนทิ้ง', has("dsc.classList.toggle('hide', !txt);"), true);
t('มีกฎซ่อนจริง', has('.cat-desc.hide{display:none}'), true);
t('หมวดโปรโมชั่นไม่ต้องมีคำอธิบาย', has("activeCat !== PROMO_CAT"), true);

console.log(NL + '③ แก้คำได้จากฐานข้อมูล ไม่ต้องแก้โค้ด');
t('อ่าน desc จาก appConfig ที่เดียวกับชื่อหมวด', has('c.desc) customCatDesc[c.key] = String(c.desc);'), true);
t('ของใน DB ชนะค่าตั้งต้นในโค้ด', has("return customCatDesc[cat] || CAT_DESC[cat] || ''"), true);

console.log(NL + '④ คำที่ใช้ตอนนี้ — ตามตัวอย่างที่นัทให้ + กฎแบรนด์');
t('หมวดแพคมีคำอธิบาย', has('pack_special:') && has('pack_regular:'), true);
t('พูดถึงแช่ฟรีซและเก็บได้นาน', has('แช่ฟรีซ') && has('เก็บได้นาน'), true);
t('บอกว่าส่งต่างจังหวัดได้ (จุดต่างจริงของฟรีซแพ็ค)', has('ต่างจังหวัด'), true);
/* ⛔ กฎแบรนด์: เราขายของแช่แข็งเอง ห้ามพูดแง่ลบ · ห้ามเคลมเทียบคู่แข่ง */
t('ไม่พูดแง่ลบกับของแช่แข็ง', !has('ไม่เหมือนแช่แข็ง') && !has('ไม่ใช่ของแช่แข็ง'), true);
t('ไม่เคลมดีที่สุด/ถูกที่สุด', !has('ดีที่สุด') && !has('ถูกที่สุด'), true);
{
  /* "ไม่ต้องยาว ๆ" — นัทขอเอง · ยาวเกินสองบรรทัดบนมือถือคือผิดโจทย์ */
  const i = L.indexOf('pack_special:');
  const line = L.slice(i, L.indexOf(NL, i));
  t('สั้นพอ ไม่เกิน 2 บรรทัดบนมือถือ', line.length < 160, true);
}

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + ok) : ('✅ ผ่านทั้งหมด ' + ok + ' ข้อ'));
process.exitCode = fail ? 1 : 0;

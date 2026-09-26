/* เทส scope คูปอง Meal Plan แยก HP/LC — ดึงฟังก์ชันจริงจากไฟล์มารัน
   เคสจริง 4 ก.ย.: นัทใส่ HP ฿1,699 แล้วใช้โค้ด MP99 (ของ LC) ได้ ลดแค่ 99 */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');
const grab = (n) => {
  const i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; st = true; }
    else if (src[j] === '}') { d--; if (st && d === 0) return src.slice(i, j + 1); }
  }
};
const body = [grab('mpScopeHit'), grab('cartMatchesPromoScope')].join('\n');
let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};
const check = (promo, cart) => new Function('cart', body + '\n; return cartMatchesPromoScope(' + JSON.stringify(promo) + ');')(cart);

/* ของในตะกร้าจริง */
const HP    = { type:'meal_plan', mp_type:'hp', mp_set:'trial', price:1699 };
const LC    = { type:'meal_plan', mp_type:'lc', mp_set:'trial', price:1399 };
const HPwk  = { type:'meal_plan', mp_type:'hp', mp_set:'weekly', price:4190 };
const BOX   = { code:'S051', price:165 };
const P = (v) => ({ scope_type:'mp_offer', scope_value:v });

console.log('\n① 🔴 เคสที่นัทเจอ — โค้ด LC ต้องใช้กับ HP ไม่ได้');
t('MP99 (trial:lc) กับตะกร้า HP', check(P(['trial:lc']), [HP]), false);
t('MP99 (trial:lc) กับตะกร้า LC', check(P(['trial:lc']), [LC]), true);
t('MP119 (trial:hp) กับตะกร้า HP', check(P(['trial:hp']), [HP]), true);
t('MP119 (trial:hp) กับตะกร้า LC', check(P(['trial:hp']), [LC]), false);

console.log('\n② ค่าเดิมต้องทำงานเหมือนเดิม');
t("'trial' กับ HP", check(P(['trial']), [HP]), true);
t("'trial' กับ LC", check(P(['trial']), [LC]), true);
t("'trial' ไม่กินชุด weekly", check(P(['trial']), [HPwk]), false);
t("'weekly' กับชุด weekly", check(P(['weekly']), [HPwk]), true);

console.log('\n③ ตะกร้าผสม');
t('มีทั้ง HP และ LC → โค้ด LC ใช้ได้', check(P(['trial:lc']), [HP, LC]), true);
t('มีแต่ข้าวกล่อง → ใช้ไม่ได้', check(P(['trial:lc']), [BOX]), false);
t('HP + ข้าวกล่อง → โค้ด LC ใช้ไม่ได้', check(P(['trial:lc']), [HP, BOX]), false);
t('ระบุ 2 ชนิดพร้อมกัน', check(P(['trial:hp','trial:lc']), [LC]), true);

console.log('\n④ ตัวพิมพ์ใหญ่เล็ก / ของแปลก');
t('TRIAL:HP ตัวใหญ่ก็ได้', check(P(['TRIAL:HP']), [HP]), true);
t('scope ว่าง = ใช้ไม่ได้', check(P([]), [HP]), false);
t('ชุดไม่ตรงเลย', check(P(['monthly:hp']), [HP]), false);

console.log('\n⑤ scope แบบยกเว้น (ของเดิม ห้ามพัง)');
t('ยกเว้น trial:lc — ตะกร้ามี HP อย่างเดียว = ใช้ได้',
  check({ scope_type:'mp_offer', scope_mode:'exclude', scope_value:['trial:lc'] }, [HP]), true);
t('ยกเว้น trial:lc — ตะกร้ามี LC = ใช้ไม่ได้',
  check({ scope_type:'mp_offer', scope_mode:'exclude', scope_value:['trial:lc'] }, [LC]), false);

console.log('\n⑥ scope ชนิดอื่นต้องไม่กระทบ');
t('scope all', check({ scope_type:'all' }, [HP]), true);
t('scope sku', check({ scope_type:'sku', scope_value:['S051'] }, [BOX]), true);
t('scope sku ไม่ตรง', check({ scope_type:'sku', scope_value:['S999'] }, [BOX]), false);

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

/* เทสราคาเต็มขีดฆ่า — ดึงฟังก์ชันจริงจากไฟล์มารัน */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8');
const grab = (n) => {
  const i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; st = true; }
    else if (src[j] === '}') { d--; if (st && d === 0) return src.slice(i, j + 1); }
  }
};
const body = ['pkgQuotaOf','pkgListPrice','pkgStrikeHtml'].map(grab).join('\n');
let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};
const EB = 'eb', FULL = 'full';
const env = (packages, quota) => new Function('packages','pkgQuota',
  body + '\n; return {pkgListPrice,pkgStrikeHtml};')(packages, quota);
const P = [{ id:EB, base_price:4190 }, { id:FULL, base_price:4490 }];
const Q = { [EB]: { limit:50, fallback:FULL, label:'Early Bird' } };

console.log('\n① คอร์สเจ Early Bird');
{
  const e = env(P, Q);
  t('ราคาเต็ม = 4490', e.pkgListPrice(EB), 4490);
  t('ป้ายมีขีดฆ่า', e.pkgStrikeHtml(EB).includes('line-through'), true);
  t('ป้ายโชว์ ฿4,490', e.pkgStrikeHtml(EB).includes('฿4,490'), true);
  t('แพคราคาปกติไม่มีอะไรให้ขีด', e.pkgListPrice(FULL), null);
  t('ไม่มีของเทียบ = ป้ายว่าง', e.pkgStrikeHtml(FULL), '');
}

console.log('\n② ตั้งค่าเพี้ยน — ห้ามโชว์ส่วนลดทิพย์');
t('fallback ถูกกว่า = ไม่ขีด', env([{id:EB,base_price:4190},{id:FULL,base_price:3990}], Q).pkgListPrice(EB), null);
t('ราคาเท่ากัน = ไม่ขีด', env([{id:EB,base_price:4190},{id:FULL,base_price:4190}], Q).pkgListPrice(EB), null);
t('fallback ชี้แพคที่ไม่มี = ไม่ขีด', env([{id:EB,base_price:4190}], Q).pkgListPrice(EB), null);
t('ไม่ได้ตั้งโควตา = ไม่ขีด', env(P, {}).pkgListPrice(EB), null);
t('ตั้งโควตาแต่ไม่มี fallback = ไม่ขีด', env(P, {[EB]:{limit:50}}).pkgListPrice(EB), null);

console.log('\n③ จุดที่ต้องโชว์บนหน้าจอ');
t('ตะกร้าเรียกใช้', src.includes('${pkgStrikeHtml(c.package_id)}฿${c.price.toLocaleString()}'), true);
t('ตะกร้ามีป้ายประหยัดเท่าไหร่', src.includes('ประหยัด ฿'), true);
t('หัวป๊อปอัพเรียกใช้', src.includes(':pkgStrikeHtml(currentPkg.id)}฿${pkgGroupedPrice()'), true);
t('ปุ่มยืนยันบอกราคาเดิม', src.includes('(จาก ฿${_full.toLocaleString()})'), true);

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

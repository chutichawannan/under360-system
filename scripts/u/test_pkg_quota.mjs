/* เทสโควตา Early Bird — ดึงฟังก์ชันจริงจากไฟล์ที่ deploy มารัน */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8');
const grab = (name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + name);
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; st = true; }
    else if (src[j] === '}') { d--; if (st && d === 0) return src.slice(i, j + 1); }
  }
};
const body = ['pkgQuotaOf','pkgQuotaLeft','pkgQuotaFull','pkgResolveId'].map(grab).join('\n');

let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); }
  else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};
const EB = 'eb-id', FULL = 'full-id';
const env = (sold, quota) => {
  const ctx = {
    pkgQuota: quota !== undefined ? quota : { [EB]: { limit:50, fallback:FULL, label:'Early Bird' } },
    pkgSold: sold,
    packages: [{ id:EB, base_price:4190 }, { id:FULL, base_price:4490 }]
  };
  return new Function(...Object.keys(ctx), body + '\n; return {pkgQuotaOf,pkgQuotaLeft,pkgQuotaFull,pkgResolveId};')(...Object.values(ctx));
};

console.log('\n① นับสิทธิ์');
{
  const e = env({});
  t('ยังไม่มีใครจอง = เหลือ 50', e.pkgQuotaLeft(EB), 50);
  t('แพคที่ไม่จำกัด = null', e.pkgQuotaLeft(FULL), null);
  t('ยังไม่เต็ม', e.pkgQuotaFull(EB), false);
  t('ใช้ EB ตามเดิม', e.pkgResolveId(EB), EB);
}
{
  const e = env({ [EB]: 49 });
  t('จองแล้ว 49 = เหลือ 1', e.pkgQuotaLeft(EB), 1);
  t('คนที่ 50 ยังได้ EB', e.pkgResolveId(EB), EB);
}

console.log('\n② เต็มแล้วสลับเป็นราคาปกติ');
{
  const e = env({ [EB]: 50 });
  t('เหลือ 0', e.pkgQuotaLeft(EB), 0);
  t('เต็ม', e.pkgQuotaFull(EB), true);
  t('คนที่ 51 ได้ราคาปกติ', e.pkgResolveId(EB), FULL);
}
{
  const e = env({ [EB]: 73 });
  t('เกินโควตาก็ไม่ติดลบ', e.pkgQuotaLeft(EB), 0);
  t('ยังสลับถูก', e.pkgResolveId(EB), FULL);
}

console.log('\n③ ตั้งค่าพัง = ต้องขายต่อได้ ห้ามล็อกร้าน');
{
  const e = env({ [EB]: 99 }, { [EB]: { limit:50, fallback:'ไม่มีแพคนี้', label:'EB' } });
  t('fallback ชี้แพคที่ไม่มี = อยู่ที่เดิม', e.pkgResolveId(EB), EB);
}
{
  const e = env({ [EB]: 99 }, { [EB]: { limit:0, fallback:FULL } });
  t('limit=0 = ไม่จำกัด', e.pkgQuotaLeft(EB), null);
  t('ไม่สลับ', e.pkgResolveId(EB), EB);
}
{
  const e = env({}, {});
  t('ไม่ได้ตั้ง quota เลย = ทุกแพคปกติ', e.pkgResolveId(EB), EB);
}

console.log('\n④ ป้ายกำกับที่นัทสั่งแก้');
{
  const cart = src.includes('· <b style="color:#1F4D3A;font-family:monospace;">${h(subCode(it.sku||\'\'))}</b> ${h(it.name)}');
  t('ตะกร้ามีรหัสนำหน้าชื่อเมนู', cart, true);
  const rounds = /const roundMenuHtml[\s\S]{0,600}?subCode\(\(it&&it\.sku\)/.test(src);
  t('รอบส่งโชว์รหัส ไม่ใช่ชื่อยาว', rounds, true);
  t('รอบส่งไม่พ่นชื่อเมนูแล้ว', /const roundMenuHtml[\s\S]{0,600}?it\.name\|\|it\.code/.test(src), false);
}

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

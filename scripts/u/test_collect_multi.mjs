/* เทส ?collect=A,B — ดึงตัวจัดการลิงก์จริงจากไฟล์มารัน (ห้ามเขียน logic ใหม่มาเทส)
   เคสใช้งานจริง: แคมเปญ 9.9 ยิงลิงก์ ?collect=MP99,MP119 เช้า 5 ก.ย. */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');

/* ตัดบล็อกที่จัดการ ?collect ออกมาทั้งก้อน แล้วห่อเป็นฟังก์ชันรัน */
const start = src.indexOf("const raw = (new URLSearchParams(location.search).get('collect')");
const endMark = "goWallet();\n      }";
const scan = src.indexOf('// menu + สร้างลำดับหมวด', start);
const end = src.lastIndexOf(endMark, scan);
if (start < 0 || end < 0) { console.log('❌ หาบล็อก ?collect ไม่เจอ'); process.exit(1); }
const block = src.slice(start, end + endMark.length).replace(/\r/g, '');

let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};

/* จำลอง cwCollect ให้เขียนลง "กระเป๋า" จริง ๆ เพื่อจับเคสเขียนทับกันเอง */
async function run(query, live, already = []) {
  const wallet = already.slice();
  const toasts = [], calls = [];
  let inFlight = 0, sawParallel = false;
  const cwCollect = async (code, src2, quiet) => {
    inFlight++; if (inFlight > 1) sawParallel = true;
    calls.push({ code, src: src2, quiet: !!quiet });
    await new Promise(r => setTimeout(r, 1));         // จำลองรอ network
    let res = false;
    if (wallet.includes(code)) { if (!quiet) toasts.push('คูปองนี้อยู่ในกระเป๋าอยู่แล้ว'); }
    else if (!live.includes(code)) { if (!quiet) toasts.push('คูปองนี้หมดเวลาแจกแล้ว'); }
    else { wallet.push(code); if (!quiet) toasts.push('เก็บคูปองแล้ว'); res = true; }
    inFlight--;
    return res;
  };
  let wallets = 0;
  const fn = new Function('location', 'cwCollect', 'goWallet', 'toast', 'URLSearchParams',
    '"use strict"; return (async () => {' + block + '})();');
  await fn({ search: query }, cwCollect, () => { wallets++; }, m => toasts.push(m), URLSearchParams);
  return { wallet, toasts, calls, wallets, sawParallel };
}

console.log('\n① แบบเดิม ใบเดียว — ต้องไม่เปลี่ยนพฤติกรรม');
{
  const r = await run('?collect=MP99', ['MP99', 'MP119']);
  t('เก็บได้', r.wallet, ['MP99']);
  t('toast เดิม', r.toasts, ['เก็บคูปองแล้ว']);
  t('ไม่ส่งโหมดเงียบ', r.calls[0].quiet, false);
  t('พาไปกระเป๋า 1 ครั้ง', r.wallets, 1);
}

console.log('\n② แคมเปญ 9.9 — สองใบในลิงก์เดียว');
{
  const r = await run('?collect=MP99,MP119', ['MP99', 'MP119']);
  t('ได้ครบ 2 ใบ', r.wallet, ['MP99', 'MP119']);
  t('เก็บทีละใบ ไม่ยิงพร้อมกัน', r.sawParallel, false);
  t('toast รวมทีเดียว', r.toasts, ['เก็บคูปองแล้ว 2 ใบ']);
  t('พาไปกระเป๋า 1 ครั้ง', r.wallets, 1);
}
{
  const r = await run('?collect= mp99 , mp119 ', ['MP99', 'MP119']);
  t('มีช่องว่าง/ตัวพิมพ์เล็ก ก็ได้ครบ', r.wallet, ['MP99', 'MP119']);
}

console.log('\n③ ใบนึงพลาด ต้องไม่ทำให้ใบอื่นหยุด');
{
  const r = await run('?collect=MP99,หมดแล้ว,MP119', ['MP99', 'MP119']);
  t('ได้ 2 ใบที่ยังแจกอยู่', r.wallet, ['MP99', 'MP119']);
  t('บอกจำนวนที่เก็บได้จริง', r.toasts, ['เก็บคูปองแล้ว 2 ใบ']);
}
{
  const r = await run('?collect=MP99,MP119', ['MP99', 'MP119'], ['MP99']);
  t('มีใบนึงอยู่แล้ว = เก็บเพิ่มใบเดียว', r.wallet, ['MP99', 'MP119']);
  t('นับเฉพาะใบที่เพิ่งได้', r.toasts, ['เก็บคูปองแล้ว 1 ใบ']);
}
{
  const r = await run('?collect=MP99,MP119', ['MP99', 'MP119'], ['MP99', 'MP119']);
  t('มีครบอยู่แล้ว = ไม่หลอกว่าเก็บได้', r.toasts, ['คูปองอยู่ในกระเป๋าอยู่แล้ว']);
}

console.log('\n④ ของแปลกในลิงก์');
{
  t('ไม่มี collect = ไม่ทำอะไร', (await run('?x=1', ['MP99'])).calls.length, 0);
  t('collect ว่าง = ไม่ทำอะไร', (await run('?collect=', ['MP99'])).calls.length, 0);
  t('จุลภาคล้วน = ไม่ทำอะไร', (await run('?collect=,,,', ['MP99'])).calls.length, 0);
  const many = await run('?collect=A,B,C,D,E,F,G,H', ['A','B','C','D','E','F','G','H']);
  t('ยัดมาเยอะ = ตัดที่ 5 ใบ', many.calls.length, 5);
}

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

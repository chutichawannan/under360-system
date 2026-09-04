/* เทส ?collect=A,B — ดึงบล็อกจริงจากไฟล์มารัน (ห้ามเขียน logic ใหม่มาเทส)
   เคสใช้งานจริง: แคมเปญ 9.9 ลิงก์ ?collect=MP99,MP119
   ⚠️ เคสสำคัญที่สุดอยู่หมวด ③.5 — ข้อความที่ลูกค้าเห็นต้องตรงกับสิ่งที่เกิดจริง
      (4 ก.ย. นัทเทสแล้วระบบบอก "อยู่ในกระเป๋าแล้ว" ทั้งที่ยังไม่มีคูปองให้เก็บ) */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');
const start = src.indexOf("const raw = (new URLSearchParams(location.search).get('collect')");
const endMark = "goWallet();\n      }";
const scan = src.indexOf('// menu + สร้างลำดับหมวด', start);
const end = src.lastIndexOf(endMark, scan);
if (start < 0 || end < 0) { console.log('❌ หาบล็อก ?collect ไม่เจอ'); process.exit(1); }
const block = src.slice(start, end + endMark.length);

let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};

/* จำลองกระเป๋าคูปองจริง — จับได้ทั้งเรื่องเขียนทับกันเอง และเหตุผลที่เก็บไม่ได้ */
async function run(query, live, already = []) {
  const wallet = already.slice(), toasts = [], calls = [];
  const st = { reason: '' };
  let inFlight = 0, sawParallel = false, wallets = 0;

  const cwCollect = async (code, src2, quiet) => {
    inFlight++; if (inFlight > 1) sawParallel = true;
    calls.push({ code, src: src2, quiet: !!quiet });
    await new Promise(r => setTimeout(r, 1));
    let res = false;
    if (wallet.includes(code)) { st.reason = 'have'; if (!quiet) toasts.push('คูปองนี้อยู่ในกระเป๋าอยู่แล้ว'); }
    else if (!live.includes(code)) { st.reason = 'gone'; if (!quiet) toasts.push('คูปองนี้หมดเวลาแจกแล้ว'); }
    else { wallet.push(code); st.reason = 'ok'; if (!quiet) toasts.push('เก็บคูปองแล้ว'); res = true; }
    inFlight--;
    return res;
  };

  /* cwLastReason ในโค้ดจริงเป็นตัวแปรระดับไฟล์ — ผูกเข้ากับ st.reason ผ่าน getter */
  const code = 'return (async () => {' + block.split('cwLastReason').join('__st.reason') + '})();';
  const fn = new Function('location', 'cwCollect', 'goWallet', 'toast', 'URLSearchParams', '__st', code);
  await fn({ search: query }, cwCollect, () => { wallets++; }, m => toasts.push(m), URLSearchParams, st);
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
t('มีช่องว่าง/ตัวพิมพ์เล็ก ก็ได้ครบ', (await run('?collect= mp99 , mp119 ', ['MP99','MP119'])).wallet, ['MP99','MP119']);

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

console.log('\n③.5 🔴 ข้อความต้องตรงความจริง — เคสที่นัทเจอ 4 ก.ย.');
{
  /* ตอนนั้นคูปองยังไม่อยู่ในลิสต์แจก (show_suggested ปิด) → เก็บไม่ได้สักใบ
     ระบบเคยบอกว่า "อยู่ในกระเป๋าอยู่แล้ว" → นัทเปิดกระเป๋าไปหาแล้วไม่เจอ */
  const r = await run('?collect=MP99,MP119', []);
  t('ไม่มีคูปองให้เก็บ = ห้ามบอกว่ามีอยู่แล้ว', r.toasts, ['คูปองนี้หมดเวลาแจกแล้ว']);
  t('กระเป๋ายังว่างจริง', r.wallet, []);
}
t('มีครบอยู่แล้วจริง = บอกว่าอยู่ในกระเป๋าแล้ว',
  (await run('?collect=MP99,MP119', ['MP99','MP119'], ['MP99','MP119'])).toasts, ['คูปองอยู่ในกระเป๋าอยู่แล้ว']);
t('ใบนึงมีอยู่แล้ว อีกใบหมดเวลา = ยึดว่ามีอยู่แล้ว',
  (await run('?collect=MP99,MP119', ['MP119'], ['MP119'])).toasts, ['คูปองอยู่ในกระเป๋าอยู่แล้ว']);

console.log('\n④ ของแปลกในลิงก์');
t('ไม่มี collect = ไม่ทำอะไร', (await run('?x=1', ['MP99'])).calls.length, 0);
t('collect ว่าง = ไม่ทำอะไร', (await run('?collect=', ['MP99'])).calls.length, 0);
t('จุลภาคล้วน = ไม่ทำอะไร', (await run('?collect=,,,', ['MP99'])).calls.length, 0);
t('ยัดมาเยอะ = ตัดที่ 5 ใบ', (await run('?collect=A,B,C,D,E,F,G,H', ['A','B','C','D','E','F','G','H'])).calls.length, 5);

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

/* เทส: คอร์สที่ล็อกวันส่ง ต้องรับรวดเดียวไม่ได้ · เซ็ตอื่นต้องยังติ๊กได้เหมือนเดิม */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8');
let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};

/* ① ตัวฟังก์ชัน toggle — ดึงของจริงมารัน */
const i = src.indexOf('function toggleSetDeliverOnce(');
let d = 0, st = false, body = '';
for (let j = i; j < src.length; j++) {
  if (src[j] === '{') { d++; st = true; }
  else if (src[j] === '}') { d--; if (st && d === 0) { body = src.slice(i, j + 1); break; } }
}
const run = (locked) => {
  const state = { setDeliverOnce: false };
  const ctx = {
    cartFixedRounds: () => locked ? ['2026-10-08','2026-10-11','2026-10-15'] : null,
    renderRoundSplit: () => {},
    get setDeliverOnce(){ return state.setDeliverOnce; },
  };
  /* ให้ฟังก์ชันเขียนค่ากลับได้จริง */
  const fn = new Function('cartFixedRounds','renderRoundSplit','__s',
    'let setDeliverOnce=__s.v;' + body + ';return function(v){toggleSetDeliverOnce(v);__s.v=setDeliverOnce;}');
  const s = { v: false };
  const call = fn(ctx.cartFixedRounds, ctx.renderRoundSplit, s);
  call(true);
  return s.v;
};

console.log('\n① กดติ๊ก "รับรวดเดียว"');
t('คอร์สล็อกวัน = ติ๊กไม่ติด', run(true), false);
t('เซ็ตปกติ = ติ๊กได้เหมือนเดิม', run(false), true);

console.log('\n② หน้าจอ');
t('ล็อกวันแล้วไม่มีช่องติ๊ก', /lockedRounds\s*\n?\s*\?\s*`<div[^`]*รับรวดเดียวไม่ได้/.test(src.replace(/\r/g,'')), true);
t('เซ็ตปกติยังมีช่องติ๊กอยู่', src.includes('รับทั้งหมดรวดเดียว (ส่งครั้งเดียว'), true);
t('บังคับปิดก่อนคำนวณรอบ', src.includes('if(lockedRounds && setDeliverOnce) setDeliverOnce = false;'), true);

console.log('\n③ ผลต่อการสร้างออเดอร์ (ของเดิม ห้ามพัง)');
t('doSplit ยังอ่าน setDeliverOnce', src.includes('const doSplit    = roundCount > 1 && !setDeliverOnce;'), true);

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

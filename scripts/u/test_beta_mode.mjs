/* เทสตรรกะโหมดทดสอบ — ดึงฟังก์ชันจริงจากไฟล์ที่ deploy อยู่มารัน ไม่เขียนตรรกะใหม่มาเทสเอง */
const src = await (await fetch('https://under360-system.vercel.app/liff_customer.html')).text();
const grab = (name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('ไม่เจอฟังก์ชัน ' + name);
  let d = 0, j = src.indexOf('{', i);
  for (let k = j; k < src.length; k++) {
    if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
  throw new Error('อ่าน ' + name + ' ไม่จบ');
};
const body = grab('isBetaTester') + '\n' + grab('betaOn');
const mk = (betaLocal, uid, cfg) => {
  const fn = new Function('betaLocal','lineProfile','betaCfg', body + '; return {isBetaTester, betaOn};');
  return fn(betaLocal, uid ? {userId:uid} : null, cfg);
};
const NUT='Ucc982b971a6676e02ecac6d668723003', OTHER='Uffff0000ffff0000ffff0000ffff0000';
const cfg={uids:[NUT],features:{}};
const T=[
  ['ลูกค้าทั่วไป (ไม่อยู่ในรายชื่อ ไม่มีลิงก์)', mk(false,OTHER,cfg), false, false],
  ['นัท (uid อยู่ในรายชื่อ)',                    mk(false,NUT,cfg),   true,  true ],
  ['เครื่องที่เปิดลิงก์ ?beta=u360',              mk(true,OTHER,cfg),  true,  true ],
  ['ยังไม่มีคีย์ beta_testers เลย',               mk(false,NUT,null),  false, false],
  ['นัท แต่สั่งปิดคูปองไว้',                      mk(false,NUT,{uids:[NUT],features:{coupon_wallet:false}}), true, false],
];
let bad=0;
T.forEach(([why,api,wantTester,wantFeat])=>{
  const a=api.isBetaTester(), b=api.betaOn('coupon_wallet');
  const ok = a===wantTester && b===wantFeat;
  if(!ok)bad++;
  console.log(ok?'✅':'🔴', why.padEnd(38), '→ อยู่ในโหมด:', String(a).padEnd(5), '· เห็นคูปอง:', b);
});
console.log('\n'+(bad? '🔴 ผิด '+bad+' เคส' : '✅ ผ่านทั้ง '+T.length+' เคส (ตรรกะจากไฟล์ production จริง)'));
process.exit(bad?1:0);

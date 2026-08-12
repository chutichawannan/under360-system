// เทสตรรกะล้วนของกะปัน (ไม่ยิง LINE ไม่ยิง Anthropic) — รัน: node scripts/kapan_selftest.mjs
// มีไว้เพราะ regex ตัวนี้เคยพังเงียบมาแล้ว (แบ็กสแลชหายตอนแพตช์) แล้วไม่มีอะไรฟ้อง
const ROOMS = ['pm','cc','u','k','f','m','bug','keng','niw','eath','tiang','rnd01','ploy','fah'];
const ROOM_ALIAS = { เลขา:'pm', pm:'pm', cc:'cc', ยู:'u', u:'u', ครัว:'k', k:'k', ฟ้า:'fah', fah:'fah',
  เงิน:'f', f:'f', เว็บ:'m', m:'m', บั๊ก:'bug', bug:'bug', เก่ง:'keng', keng:'keng',
  นิว:'niw', niw:'niw', เอิธ:'eath', eath:'eath', เตียง:'tiang', tiang:'tiang', พลอย:'ploy', ploy:'ploy', rnd:'rnd01', rnd01:'rnd01' };

function routeRoom(text) {
  const m = String(text).match(/^\s*@?([A-Za-z0-9]+|[ก-๙]+)(?:\s*[:：]\s*|\s+)([\s\S]+)$/);
  if (!m) return { room: 'pm', body: text };
  const key = m[1].toLowerCase();
  const room = ROOM_ALIAS[key] || (ROOMS.includes(key) ? key : null);
  return room ? { room, body: m[2].trim() } : { room: 'pm', body: text };
}

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log((ok ? '✅' : '❌') + ' ' + name + (ok ? '' : `\n   ได้: ${JSON.stringify(got)}\n   ควรได้: ${JSON.stringify(want)}`));
};

// ── ส่งงานข้ามห้อง (เคสที่เคยพังทั้งหมด) ──
eq('cc + เว้นวรรค',      routeRoom('cc เช็คสต็อกให้ที'),        { room:'cc',  body:'เช็คสต็อกให้ที' });
eq('ชื่อไทย + โคลอน',    routeRoom('ครัว: พรุ่งนี้ทำอะไร'),      { room:'k',   body:'พรุ่งนี้ทำอะไร' });
eq('u ตอบยัง',           routeRoom('u ตอบยัง'),                 { room:'u',   body:'ตอบยัง' });
eq('@ นำหน้า',           routeRoom('@เงิน ยอดเดือนนี้เท่าไหร่'), { room:'f',   body:'ยอดเดือนนี้เท่าไหร่' });
eq('โคลอนตัวไทย',        routeRoom('เอิธ：ยิง broadcast ยัง'),   { room:'eath',body:'ยิง broadcast ยัง' });
eq('หลายบรรทัด',         routeRoom('u แก้หน้าครัว\nบรรทัดสอง'),  { room:'u',   body:'แก้หน้าครัว\nบรรทัดสอง' });

// ── ไม่ได้ระบุห้อง = ตกไป pm (ห้ามเดา) ──
eq('ไม่มีชื่อห้อง',       routeRoom('วันนี้เหนื่อยจัง'),          { room:'pm',  body:'วันนี้เหนื่อยจัง' });
eq('คำแรกไม่ใช่ห้อง',    routeRoom('ช่วยเช็คสต็อกให้ที'),        { room:'pm',  body:'ช่วยเช็คสต็อกให้ที' });
eq('คำเดียวโดดๆ',        routeRoom('cc'),                       { room:'pm',  body:'cc' });

// ── โหมด ──
const PERSONAS = { normal:{poll:10000}, fast:{poll:5000}, quiet:{poll:60000} };
const MODE_WORD = { 'เร่ง':'fast', 'ปกติ':'normal', 'เงียบ':'quiet' };
for (const [word, key] of Object.entries(MODE_WORD)) {
  const mm = ('โหมด' + word).match(/^โหมด\s*(เร่ง|ปกติ|เงียบ)/);
  eq('สลับโหมด' + word, mm && MODE_WORD[mm[1]], key);
}
eq('ถามโหมดเปล่าๆ',  /^โหมด\s*[?？]?$/.test('โหมด'),   true);
eq('ถามโหมดมี ?',    /^โหมด\s*[?？]?$/.test('โหมด?'),  true);
eq('สั่งสลับ ≠ ถาม', /^โหมด\s*[?？]?$/.test('โหมดเร่ง'), false);
eq('เร่งเช็คถี่สุด',  PERSONAS[MODE_WORD['เร่ง']].poll < PERSONAS.normal.poll, true);

console.log(`\n${pass} ผ่าน · ${fail} ไม่ผ่าน`);
process.exit(fail ? 1 : 0);

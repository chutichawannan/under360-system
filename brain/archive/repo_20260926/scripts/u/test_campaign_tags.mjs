/* เทสตรรกะส่วนลดแท็กแคมเปญ — ดึงฟังก์ชันจริงออกจากไฟล์ HTML มารันกับข้อมูลสมมติ
   เรื่องเงิน: ห้ามเดาว่าถูก ต้องเห็นตัวเลขทุกเคส */
import fs from 'node:fs';
const html = fs.readFileSync(process.argv[2], 'utf8');

function grab(name){
  const i = html.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('ไม่เจอฟังก์ชัน ' + name);
  let depth = 0, started = false, j = i;
  for (; j < html.length; j++) {
    const c = html[j];
    if (c === '{') { depth++; started = true; }
    else if (c === '}') { depth--; if (started && depth === 0) { j++; break; } }
  }
  return html.slice(i, j);
}

const src = grab('activeCampaignTag') + '\n' + grab('autoPromos');

// mock ของที่โค้ดอ้างถึง
let lineProfile, campaignTags, customer, _isVip, _isNew;
const localYMD = d => d.toISOString().slice(0,10);
const isVipFriend = () => _isVip;
const isNewMemberCustomer = () => _isNew;
const ctx = { get lineProfile(){return lineProfile}, get campaignTags(){return campaignTags} };

const fn = new Function('lineProfile','campaignTags','customer','isVipFriend','isNewMemberCustomer','localYMD',
  src + '; return { activeCampaignTag, autoPromos };');

const UID = 'Uabcdef0123456789abcdef0123456789';
const today = new Date();
const plus = n => { const d=new Date(today); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };

function run(label, opts){
  lineProfile = { userId: opts.uid ?? UID };
  campaignTags = opts.tags ?? {};
  customer = opts.customer ?? { tier:'' };
  _isVip = !!opts.vip; _isNew = !!opts.newMember;
  const api = fn(lineProfile, campaignTags, customer, isVipFriend, isNewMemberCustomer, localYMD);
  const list = api.autoPromos(opts.sub ?? 1000);
  const total = list.reduce((s,a)=> s + (a.type==='fixed'? a.value : Math.round((opts.sub??1000)*a.value/100)), 0);
  const names = list.map(a=>a.code).join(' + ') || '(ไม่มี)';
  const pass = opts.expect === undefined ? null : (total === opts.expect && (!opts.expectCodes || names === opts.expectCodes));
  console.log(`${pass===null?'  ':(pass?'✅':'🔴')} ${label}`);
  console.log(`     ได้: ${names} = ฿${total}` + (opts.expect!==undefined ? `  · คาดไว้ ฿${opts.expect}${opts.expectCodes?' ('+opts.expectCodes+')':''}` : ''));
  return pass;
}

const TAG = (over={}) => ({ wk0829: Object.assign({
  label:'ส่วนลดลูกค้าที่ได้รับข้อความ',
  discount:{ type:'fixed', value:50, min_order:500 },
  expires_at: plus(7),
  uids:[UID]
}, over) });

console.log('══ เทสตรรกะแท็กแคมเปญ ══\n');
const results = [];
results.push(run('1. ไม่มีคีย์ campaign_tags เลย → ทุกอย่างเหมือนเดิม', { tags:{}, expect:0 }));
results.push(run('2. อยู่ในลิสต์ + ยังไม่หมดอายุ → ได้ ฿50', { tags:TAG(), expect:50, expectCodes:'CAMP-WK0829' }));
results.push(run('3. หมดอายุเมื่อวาน → ไม่ได้ (หลุดเอง)', { tags:TAG({expires_at:plus(-1)}), expect:0 }));
results.push(run('4. หมดอายุ "วันนี้" → ยังได้อยู่ (นับถึงสิ้นวัน)', { tags:TAG({expires_at:plus(0)}), expect:50 }));
results.push(run('5. ยอดไม่ถึงขั้นต่ำ 500 (สั่ง 400) → ไม่ได้', { tags:TAG(), sub:400, expect:0 }));
results.push(run('6. ไม่ได้อยู่ในลิสต์ → ไม่ได้', { tags:TAG({uids:['Uzzzz9999zzzz9999zzzz9999zzzz9999']}), expect:0 }));
results.push(run('7. เก็บเป็นเลขท้าย 12 ตัว → จับคู่ได้', { tags:TAG({uids:[UID.slice(-12)]}), expect:50 }));
results.push(run('8. เลขท้ายสั้นไป 6 ตัว → ไม่จับ (กันชนกันโดยบังเอิญ)', { tags:TAG({uids:[UID.slice(-6)]}), expect:0 }));
results.push(run('9. เพื่อนนัท (10% ของ 1000 = 100) + แคมเปญ 50 → ได้ตัวมากกว่าตัวเดียว',
  { tags:TAG(), vip:true, expect:100, expectCodes:'VIPFRIEND' }));
results.push(run('10. เพื่อนนัท แต่ยอดน้อย (10% ของ 400 = 40) vs แคมเปญ 50 → ลูกค้าได้ตัวมากกว่า',
  { tags:TAG({discount:{type:'fixed',value:50}}), vip:true, sub:400, expect:50, expectCodes:'CAMP-WK0829' }));
results.push(run('11. Wellness Warriors 5% (50) vs แคมเปญ 50 → ไม่ทบ ได้ตัวเดียว',
  { tags:TAG(), customer:{tier:'Wellness Warriors'}, sub:1000, expect:50 }));
results.push(run('12. สมาชิกใหม่ + แคมเปญ → ทบได้ (คงพฤติกรรมเดิมของ WELCOME50)',
  { tags:TAG(), newMember:true, sub:1000, expect:100, expectCodes:'WELCOME50 + CAMP-WK0829' }));
results.push(run('13. แคมเปญแบบเปอร์เซ็นต์ 15% ของ 1000', { tags:TAG({discount:{type:'percent',value:15}}), expect:150 }));
results.push(run('14. ตั้งเริ่มวันพรุ่งนี้ (starts_at) → วันนี้ยังไม่ได้', { tags:TAG({starts_at:plus(1)}), expect:0 }));
results.push(run('15. ข้อมูลพัง (uids ไม่ใช่ array) → ไม่ล้ม ไม่ให้ส่วนลด', { tags:{ x:{ uids:'ไม่ใช่ลิสต์', discount:{type:'fixed',value:50} } }, expect:0 }));

const bad = results.filter(r=>r===false).length;
console.log(`\n${bad? '🔴 ไม่ผ่าน '+bad+' เคส' : '✅ ผ่านครบ '+results.length+' เคส'}`);
process.exit(bad?1:0);

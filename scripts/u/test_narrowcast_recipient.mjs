/* เทส narrowcast แบบยกเว้นกลุ่ม — โหลด handler จริงมารัน ดักตัวยิงออก
   🔴 เคสสำคัญสุด: recipient ผิดรูป ต้องไม่ยิงอะไรเลย (ยิงเกินแก้ไม่ได้) */
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.join(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..', '..');

let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};

const calls = [];
global.fetch = async (url, opt) => {
  const u = String(url);
  calls.push({ url: u, body: opt && opt.body ? JSON.parse(opt.body) : null });
  if (u.includes('kitchen_data')) return { json: async () => [{ data: { secret: 'ก.กุญแจ' } }] };
  if (u.includes('/audienceGroup/')) return { status:200, ok:true, text: async () =>
    JSON.stringify({ audienceGroup: { audienceCount: 100, description: 'กลุ่มทดสอบ' } }) };
  return { status: 200, ok: true, text: async () => JSON.stringify({ requestId: 'req-1' }) };
};
require(path.join(root, 'api', '_line_token.js'));
require.cache[require.resolve(path.join(root, 'api', '_line_token.js'))].exports = { getLineToken: async () => 'token-ปลอม' };
const handler = require(path.join(root, 'api', 'line-campaign.js'));

const run = async (body) => {
  calls.length = 0;
  let code = 0, out = '';
  const res = { setHeader(){}, status(c){ code = c; return this; }, end(x){ out = x; return this; } };
  await handler({ method:'POST', headers:{ 'x-u360-key':'ก.กุญแจ' }, body }, res);
  return { code, json: JSON.parse(out || '{}'), casts: calls.filter(c => c.url.includes('/message/narrowcast')) };
};
const MSG = [{ type:'text', text:'สวัสดี' }];
const AUD = (id) => ({ type:'audience', audienceGroupId:id });
const NOT = (id) => ({ type:'operator', not: AUD(id) });

console.log('\n① แบบเดิม กลุ่มเดียว — ต้องไม่เปลี่ยนพฤติกรรม');
{
  const r = await run({ action:'narrowcast', audienceGroupId:'1747835419843', messages:MSG });
  t('ยิงออก', r.casts.length, 1);
  t('recipient เป็นกลุ่มเดียว', r.casts[0].body.recipient, { type:'audience', audienceGroupId:1747835419843 });
}
t('ไม่มีทั้ง audienceGroupId และ recipient = ไม่ยิง', (await run({ action:'narrowcast', messages:MSG })).code, 400);
t('ไม่มี messages = ไม่ยิง', (await run({ action:'narrowcast', audienceGroupId:'1', messages:[] })).code, 400);

console.log('\n② แผนที่ห้อง 05 จะยิง — กลุ่ม ③ ยกเว้น ① และ ②');
{
  const rec = { type:'operator', and:[ AUD(1747835419843), NOT(5163997704211), NOT(2897926388295) ] };
  const r = await run({ action:'narrowcast', recipient:rec, messages:MSG });
  t('ยิงออก', r.casts.length, 1);
  t('ส่ง recipient ไปตรง ๆ ไม่แปลงอะไร', r.casts[0].body.recipient, rec);
  t('คืนจำนวนคนของทุกกลุ่มที่อ้างถึง', r.json.groups.map(g => g.audienceGroupId),
    [1747835419843, 5163997704211, 2897926388295]);
  t('มีเลขคนต่อกลุ่ม', r.json.groups[0].count, 100);
  t('บอกว่ายอดจริงดูที่ไหน', typeof r.json.note, 'string');
}

console.log('\n③ 🔴 recipient ผิดรูป — ต้องไม่ยิงอะไรเลย ห้ามถอยไปยิงทั้งกลุ่ม');
const badCases = [
  ['ไม่ใช่ object', 'กลุ่มเอ'],
  ['type แปลก', { type:'ทุกคน' }],
  ['audience ไม่มี id', { type:'audience' }],
  ['audience id ไม่ใช่ตัวเลข', { type:'audience', audienceGroupId:'กลุ่มหลัก' }],
  ['operator ว่าง', { type:'operator' }],
  ['operator มีทั้ง and และ not', { type:'operator', and:[AUD(1)], not:AUD(2) }],
  ['and ว่าง', { type:'operator', and:[] }],
  ['and ไม่ใช่ array', { type:'operator', and:AUD(1) }],
  ['ลูกในชั้นลึกผิด', { type:'operator', and:[ AUD(1), { type:'operator', not:{ type:'audience' } } ] }],
  ['null', null],
];
for (const [name, rec] of badCases) {
  const r = await run({ action:'narrowcast', recipient:rec, messages:MSG, audienceGroupId:'999' });
  t(name + ' → ไม่ยิง', [r.code, r.casts.length], [400, 0]);
}

console.log('\n④ โครงซ้อนหลายชั้นที่ถูกต้อง');
{
  const rec = { type:'operator', and:[
    { type:'operator', or:[ AUD(11), AUD(12) ] },
    NOT(13),
  ]};
  const r = await run({ action:'narrowcast', recipient:rec, messages:MSG });
  t('ยิงออก', r.casts.length, 1);
  t('เก็บ id ครบทุกชั้น', r.json.groups.map(g => g.audienceGroupId), [11, 12, 13]);
}

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

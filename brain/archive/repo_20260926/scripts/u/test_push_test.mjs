/* เทส action push_test — โหลด handler จริงมารัน โดยดักตัวที่ยิงออกนอก
   หัวใจ: ต่อให้ส่ง uid มาเอง ต้องไม่มีทางไปถึงลูกค้า */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.join(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..', '..');

let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};

/* ดัก fetch: ไม่ให้มีอะไรวิ่งออกจริง + จับว่าเรียกอะไรไปบ้าง */
const calls = [];
global.fetch = async (url, opt) => {
  const u = String(url);
  calls.push({ url: u, body: opt && opt.body ? JSON.parse(opt.body) : null });
  if (u.includes('kitchen_data')) return { json: async () => [{ data: { secret: 'ก.กุญแจ' } }] };
  return { status: 200, ok: true, text: async () => JSON.stringify({ sent: true }) };
};
require(path.join(root, 'api', '_line_token.js'));            // ให้ module cache มีตัวจริงก่อน
require.cache[require.resolve(path.join(root, 'api', '_line_token.js'))].exports =
  { getLineToken: async () => 'token-ปลอม' };
const handler = require(path.join(root, 'api', 'line-campaign.js'));

const run = async (body, key) => {
  calls.length = 0;
  let code = 0, out = '';
  const res = { setHeader(){}, status(c){ code = c; return this; }, end(x){ out = x; return this; } };
  await handler({ method:'POST', headers:{ 'x-u360-key': key === undefined ? 'ก.กุญแจ' : key }, body }, res);
  return { code, json: JSON.parse(out || '{}'), pushes: calls.filter(c => c.url.includes('/message/push')) };
};

const MSG = [{ type:'text', text:'ทดสอบ' }];

console.log('\n① ยิงทดสอบหาเจ้าของ');
{
  const r = await run({ action:'push_test', messages: MSG });
  t('สำเร็จ', r.json.ok, true);
  t('ยิงเข้า push API', r.pushes.length, 1);
  t('ปลายทาง = uid ของนัท', r.pushes[0].body.to, 'U1e6056034671878fcb8d536c7ef7333e');
  t('ส่งข้อความที่ให้มาจริง', r.pushes[0].body.messages, MSG);
}

console.log('\n② 🔒 ส่ง uid มาเอง ต้องไม่มีผล — นี่คือข้อที่สำคัญที่สุด');
{
  const r = await run({ action:'push_test', messages: MSG, to:'Uลูกค้าคนอื่น1234567890' });
  t('ไม่ยอมยิง', r.code, 400);
  t('บอกว่าไม่อยู่ในลิสต์', r.json.error, 'ปลายทางนี้ไม่ได้อยู่ในลิสต์ทดสอบ');
  t('ไม่มีอะไรวิ่งออกเลย', r.pushes.length, 0);
}
{
  const r = await run({ action:'push_test', messages: MSG, uid:'Uลูกค้าคนอื่น', recipient:'Uอีกคน' });
  t('ยัดฟิลด์ชื่ออื่นก็ไม่ได้ ยังไปหาเจ้าของ', r.pushes[0].body.to, 'U1e6056034671878fcb8d536c7ef7333e');
}

console.log('\n③ ด่านกุญแจ + ของว่าง');
{
  const r = await run({ action:'push_test', messages: MSG }, 'กุญแจผิด');
  t('กุญแจผิด = ไม่ผ่าน', r.code, 401);
  t('ไม่ยิงอะไร', r.pushes.length, 0);
}
t('ไม่มี messages = ไม่ยิง', (await run({ action:'push_test' })).code, 400);
t('messages ว่าง = ไม่ยิง', (await run({ action:'push_test', messages:[] })).code, 400);
t('เกิน 5 ข้อความ = ไม่ยิง', (await run({ action:'push_test', messages:Array(6).fill(MSG[0]) })).code, 400);

console.log('\n④ ของเดิมต้องไม่พัง');
t('action มั่ว = ยังตอบ 400 เหมือนเดิม', (await run({ action:'ไม่มีจริง' })).code, 400);

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

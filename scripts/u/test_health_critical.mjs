/* 🧪 เทสตัวเฝ้าร้าน (api/health-critical.js) — ข้อ "ปฏิทินเมนู Meal Plan"
 *
 * ที่มา: 12 ก.ย. 2569 06:30 ตัวเฝ้าปลุก 4 ห้องว่า "ไม่มีวันให้ลูกค้าเลือกเลย — สั่ง Meal Plan ไม่ได้"
 *        06:33 ตัวเฝ้าเองรายงานว่าปกติ "13 วัน ถึง 2026-10-19" · ข้อมูลใน DB ไม่ได้เปลี่ยนเลย
 *        = รอบนั้นอ่าน DB ไม่สำเร็จ แล้วถูกนับเป็น "ไม่มีวัน" → แดงปลอม
 * พี่ปืนขอ: อ่านไม่ได้/ไม่เจอแถว = เหลือง "เช็คไม่ได้" · แดงเหลือเฉพาะแพลนว่างจริง · อ่านพลาดลองซ้ำ 1 ครั้ง
 *
 * 🔒 เทสนี้ไม่แตะเน็ตและไม่เขียนอะไรลง DB เลย — แทน fetch ทั้งตัวด้วยของจำลอง
 *    (ถ้าไม่แทน ตัวเฝ้าจะโพสต์บอร์ด 4 ห้อง + เขียนสถานะจริง)
 *
 * รัน: node scripts/u/test_health_critical.mjs
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const handler = require('../../api/health-critical.js');
const NL = String.fromCharCode(10);

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  🔴 ' + name + (extra ? NL + '     ได้: ' + extra : '')); }
};

const LIFF_TEXT = "liff.init({liffId}) ... LIFF_ID: '2010442513-NI3JGTkb' ...";
const resp = (body, { status = 200, headers = {} } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  headers: { get: (k) => headers[String(k).toLowerCase()] || null },
});

/* planRows = ฟังก์ชันคืนผลของการอ่าน mp_menu_plan ทีละครั้ง (ให้จำลอง "พลาดครั้งแรก" ได้) */
async function run(planRows) {
  const state = { planCalls: 0, posts: 0, stateWrites: 0 };
  globalThis.fetch = async (url, init) => {
    const u = String(url), method = String((init && init.method) || 'GET').toUpperCase();
    if (u.indexOf('/session_messages') >= 0) { state.posts++; return resp([]); }
    if (u.indexOf('/kitchen_data') >= 0 && method === 'POST') { state.stateWrites++; return resp([]); }
    if (u.indexOf('key=eq.mp_menu_plan') >= 0) { state.planCalls++; return planRows(state.planCalls); }
    if (u.indexOf('key=eq.health_critical_state') >= 0) return resp([{ data: { ok: true } }]);
    if (u.indexOf('/menu_items') >= 0) return resp([], { headers: { 'content-range': '0-0/139' } });
    if (u.indexOf('/orders') >= 0) return resp([], { headers: { 'content-range': '0-0/13' } });
    if (u.indexOf('liff_customer.html') >= 0) return resp(LIFF_TEXT);
    return resp('');                                  // หน้าครัว · ใบจัดของ
  };
  let out = null;
  const res = { status: () => res, json: (o) => { out = o; return res; } };
  await handler({ query: {} }, res);
  const mp = (out['รายการตรวจ'] || []).find((c) => c['ชื่อ'] === 'ปฏิทินเมนู Meal Plan') || {};
  return { out, mp, state };
}

const day = (n) => new Date(Date.now() + 7 * 3600e3 + n * 86400e3).toISOString().slice(0, 10);
const menus = [{ no: '41', name: 'แซลมอนโปเกะโบล', protein: 'ทะเล' }];

/* เกณฑ์เดิมของตัวเฝ้า (ไม่ได้แก้รอบนี้): เหลือ ≤3 วัน = แดง · วันสุดท้ายห่าง ≤14 วัน = ยังไม่ผ่าน
   ข้อมูลจำลองของ "ปกติ" จึงต้องมีมากกว่า 3 วัน และวันสุดท้ายห่างเกิน 14 วัน */
console.log(NL + '1) ปกติ — อ่านได้ มีวันข้างหน้าเพียงพอ');
{
  const { mp, out, state } = await run(() => resp([{ data: { [day(2)]: menus, [day(5)]: menus, [day(9)]: menus, [day(20)]: menus, [day(30)]: menus } }]));
  ok('ผ่าน', mp['ผ่าน'] === true, JSON.stringify(mp));
  ok('บอกจำนวนวัน', String(mp['รายละเอียด'] || '').indexOf('5 วัน') === 0, mp['รายละเอียด']);
  ok('สรุปคือร้านปกติ', String(out['สรุป']).indexOf('ปกติ') >= 0, out['สรุป']);
  ok('อ่านครั้งเดียวพอ (ไม่ลองซ้ำเมื่อสำเร็จ)', state.planCalls === 1, 'อ่าน ' + state.planCalls + ' ครั้ง');
}

console.log(NL + '2) 🔴 เคสที่ทำให้เกิดเรื่อง — อ่าน DB ไม่สำเร็จ 2 ครั้งติด');
{
  const { mp, out, state } = await run(() => resp({ message: 'boom' }, { status: 500 }));
  ok('ไม่ผ่าน แต่เป็นเหลือง ไม่ใช่แดง', mp['ผ่าน'] === false && mp['ระดับ'] === 'เหลือง', JSON.stringify(mp));
  ok('บอกตรง ๆ ว่า "เช็คไม่ได้" ไม่ใช่ "ลูกค้าสั่งไม่ได้"',
     String(mp['รายละเอียด'] || '').indexOf('เช็คไม่ได้') >= 0 && String(mp['รายละเอียด'] || '').indexOf('ไม่มีวันให้ลูกค้าเลือก') < 0, mp['รายละเอียด']);
  ok('ร้านยังถูกนับว่าปกติ (ไม่ปลุกทุกห้องว่าร้านล้ม)', String(out['สรุป']).indexOf('ปกติ') >= 0, out['สรุป']);
  ok('ลองซ้ำ 1 ครั้งก่อนสรุป (อ่าน 2 ครั้ง)', state.planCalls === 2, 'อ่าน ' + state.planCalls + ' ครั้ง');
  ok('ไม่โพสต์บอร์ด เพราะสถานะไม่เปลี่ยน', state.posts === 0, 'โพสต์ ' + state.posts + ' ครั้ง');
}

console.log(NL + '3) อ่านได้ แต่ไม่เจอแถวในฐานข้อมูล');
{
  const { mp, out } = await run(() => resp([]));
  ok('เหลือง "เช็คไม่ได้" ไม่ใช่แดง', mp['ผ่าน'] === false && mp['ระดับ'] === 'เหลือง', JSON.stringify(mp));
  ok('บอกว่าไม่เจอแถว', String(mp['รายละเอียด'] || '').indexOf('ไม่เจอแถว') >= 0, mp['รายละเอียด']);
  ok('ร้านยังถูกนับว่าปกติ', String(out['สรุป']).indexOf('ปกติ') >= 0, out['สรุป']);
}

console.log(NL + '4) แพลนว่างจริง (มีแถว แต่ไม่มีวันข้างหน้า) — อันนี้ต้องแดง');
{
  const { mp, out } = await run(() => resp([{ data: { '2026-08-21': menus, '2026-08-24': menus } }]));
  ok('แดง (ระดับเริ่มต้น)', mp['ผ่าน'] === false && mp['ระดับ'] === 'แดง', JSON.stringify(mp));
  ok('ข้อความเดิมที่ทวงห้องฟ้า', String(mp['รายละเอียด'] || '').indexOf('ไม่มีวันให้ลูกค้าเลือกเลย') >= 0, mp['รายละเอียด']);
  ok('สรุปว่าร้านพัง', String(out['สรุป']).indexOf('พัง') >= 0, out['สรุป']);
}

console.log(NL + '5) เน็ตสะดุดชั่ววูบ — พลาดครั้งแรก สำเร็จครั้งที่สอง');
{
  const { mp, state } = await run((n) => (n === 1 ? resp({}, { status: 503 })
    : resp([{ data: { [day(3)]: menus, [day(10)]: menus, [day(17)]: menus, [day(24)]: menus } }])));
  ok('ผ่าน ไม่ต้องเตือนใครเลย', mp['ผ่าน'] === true, JSON.stringify(mp));
  ok('อ่าน 2 ครั้ง (ครั้งที่ 2 ได้ของ)', state.planCalls === 2, 'อ่าน ' + state.planCalls + ' ครั้ง');
}

console.log(NL + '────────────────────────────');
console.log(fail ? '🔴 ตก ' + fail + ' ข้อ · ผ่าน ' + pass : '✅ ผ่านทั้งหมด ' + pass + ' ข้อ');
process.exitCode = fail ? 1 : 0;

/* บรอดแคสรายสัปดาห์ 7–13 ก.ย. (wk0907)
 *   พรีวิว: node scripts/bc_fire_wk0907.mjs
 *   ยิงจริง: node scripts/bc_fire_wk0907.mjs --go     ⛔ เมื่อนัทสั่งเท่านั้น
 */
import fs from 'fs';
import { read, write } from './bc_log.mjs';

const SEC = fs.readFileSync('.scratch/campaign_secret.txt', 'utf8').trim();
const EP  = 'https://under360-system.vercel.app/api/line-campaign';
const IMG = 'https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/object/public/menu-images/broadcast/';
const LIFF = 'https://liff.line.me/2011148232-oul66cEs';
const COLLECT = LIFF + '?collect=MP99,MP119';

const A = { mp:5163997704211, buyer:2897926388295, read30:1747835419843, rich:9517436067868 };
const aud = id => ({ type:'audience', audienceGroupId:id });
const not = id => ({ type:'operator', not: aud(id) });
const only = (id, ...ex) => ex.length ? { type:'operator', and:[aud(id), ...ex.map(not)] } : aud(id);

const card = (file, alt, ratio, uri) => ({ type:'flex', altText:alt, contents:{ type:'bubble', size:'giga',
  hero:{ type:'image', url:IMG+file+'?width=1040', size:'full', aspectRatio:ratio, aspectMode:'cover',
         action:{ type:'uri', uri } } } });
const brochure = card('broch_week_0907.png','เมนูใหม่ 7–13 ก.ย.','1040:1540', LIFF);
const promo    = card('promo_99_ploy.png','9.9 ซื้อเยอะยิ่งคุ้ม','1040:1300', COLLECT);

const MENU = `เมนูใหม่ประจำสัปดาห์มาแล้วค่ะ 🍱
7 – 13 กันยายน

ข้าวกล่อง 8 เมนู เริ่ม 125 บาท
ปลากระพงทอดยำมะม่วง · ผัดไทยวุ้นเส้นกุ้งสด
อกไก่ผัดพริกเผาเต้าหู้ · คั่วกลิ้งอกไก่แครนเบอร์รี่
ยำไข่เจียวฝอยอกไก่สับ · ไก่ซูวีซอสพริกเต้าเจี้ยว
ผัดผักรวมมิตรหมู · ข้าวผัดน้ำพริกหมูหวาน

แพคกับข้าว 5 เมนู เริ่ม 80 บาท
สำหรับบ้านที่หุงข้าวเองอยู่แล้ว

ทุกกล่องคุมโซเดียม น้ำมันที่เติมเพิ่มไม่เกิน 5 กรัม
เริ่มส่งวันจันทร์ที่ 7 ก.ย. สั่งล่วงหน้าได้ตั้งแต่วันนี้`;

const NINE = `🎁 9.9 แตะที่รูปเพื่อรับคูปอง
Meal Plan ทดลอง 7 กล่อง
  Low Carb 1,399 → 1,300
  High Protein 1,699 → 1,580
ซื้อครบ 1,999 รับฟรีโบนบรอธ 1 กระปุก (เลือกไก่/หมูได้)
จำกัด 20 สิทธิ์ · ถึง 9 ก.ย. เท่านั้น

กดลิงก์นี้รับคูปองได้เลย
https://liff.line.me/2011148232-oul66cEs?collect=MP99,MP119`;

const plan = [
  { key:'mp',     name:'① ลูกค้ามีลแพลน',        r:only(A.mp),
    msgs:[ promo, { type:'text', text:
`Meal Plan รอบใหม่เปิดจองแล้วค่ะ 🥗

เลือกเมนูเองได้ ดูล่วงหน้าได้ทุกรอบส่ง
ไม่สะดวกวันไหน เลื่อนรอบได้
แพ้อะไรบอกครั้งเดียว ระบบจำให้ตลอด

` + NINE } ] },
  { key:'buyer',  name:'② เคยซื้อ',              r:only(A.buyer, A.mp),
    msgs:[ brochure, promo, { type:'text', text: MENU + '\n\n' + NINE } ] },
  { key:'read30', name:'③ คนอ่านไลน์ 30 วัน',     r:only(A.read30, A.mp, A.buyer),
    msgs:[ brochure, promo, { type:'text', text: MENU + '\n\n' + NINE } ] },
  { key:'rich',   name:'④ คนกดริชเมนู',           r:only(A.rich, A.mp, A.buyer, A.read30),
    msgs:[ brochure, promo, { type:'text', text: MENU + '\n\n' + NINE } ] },
];

const GO = process.argv.includes('--go');
const call = async b => {
  const r = await fetch(EP, { method:'POST', headers:{'x-u360-key':SEC,'Content-Type':'application/json'}, body:JSON.stringify(b) });
  return { status:r.status, json: await r.json().catch(()=>null) };
};

console.log('\n══ บรอดแคสรายสัปดาห์ 7–13 ก.ย. ' + (GO ? '· 🔴 ยิงจริง' : '· 👀 พรีวิว') + ' ══\n');
const log = (await read('wk0907')) || { id:'wk0907', name:'บรอดแคสรายสัปดาห์ 7–13 ก.ย.', events:[] };
log.fired = log.fired || [];

for (const p of plan) {
  console.log(p.name + '  ·  ' + p.msgs.length + ' บับเบิล');
  if (!GO) { console.log('   (พรีวิว — ยังไม่ส่ง)\n'); continue; }
  if (log.fired.includes(p.key)) { console.log('   ⏭ ยิงไปแล้ว ข้าม\n'); continue; }
  const res = await call({ action:'narrowcast', recipient:p.r, messages:p.msgs });
  const ok = res.status === 200 && res.json && res.json.ok !== false;
  console.log('   ' + (ok ? '✅ ส่งเข้าคิว LINE แล้ว' : '🔴 ไม่สำเร็จ') + '  HTTP ' + res.status);
  if (res.json?.groups) res.json.groups.forEach(g => console.log('      ' + g.name + ' ~' + g.count + ' คน'));
  if (!ok) { console.log('   ' + JSON.stringify(res.json).slice(0,300) + '\n   ⛔ หยุด ไม่ยิงใบถัดไป'); break; }
  log.fired.push(p.key);
  log.events.push({ ts:new Date().toISOString(), type:'fired', group:p.name,
                    requestId: res.json?.requestId || null, groups: res.json?.groups || null });
  await write('wk0907', log);
  console.log('');
  await new Promise(r => setTimeout(r, 1500));
}
if (GO) { log.sentAt = log.sentAt || new Date().toISOString(); await write('wk0907', log); console.log('บันทึกลง event log แล้ว'); }
else console.log('เติม --go เมื่อนัทสั่งยิง');

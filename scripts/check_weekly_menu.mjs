/* ด่านตรวจเมนูประจำสัปดาห์ — กฎ 4 ข้อที่นัทเคาะเอง 4 ก.ย. 2569
 *
 *   node scripts/check_weekly_menu.mjs 2026-09-07
 *   node scripts/check_weekly_menu.mjs 2026-09-07 --days 90
 *
 * กฎ (นัท: "กฎของเมนูประจำสัปดาห์ คือเราต้องวนเมนูไม่ซ้ำเท่านั้น hook ไว้
 *           ยังไงก็ต้องได้เมนูใหม่ ถ้าไม่ได้ต้องทวง")
 *   1. ห้ามซ้ำ — ทุกรหัสต้องไม่ถูกขายเลยภายใน N วัน (ค่าเริ่มต้น 90)
 *      ⛔ ตกข้อนี้ = หาเมนูใหม่ ไม่ใช่เลื่อนสัปดาห์ (นัท: "เราไม่มีเลื่อน")
 *   2. มีรูปทุกตัว
 *   3. โภชนาการครบ (kcal + protein + carb)
 *   4. D1–D5 ต้องเป็นเมนูเดียวกับ S1–S5 (เลขรหัสตรงกัน)
 *   + ราคาขั้นต่ำ: S ≥ 125 · D ≥ 80
 *
 * ⛔ ตกข้อ 1 = ห้ามเปิดขาย ห้ามยิงบรอดแคสต์ ให้ทวงเมนูใหม่ ไม่ใช่ผ่อนกฎ
 * exit code 0 = ผ่าน · 1 = ไม่ผ่าน (เอาไปต่อท้ายคำสั่งอื่นได้)
 */
import fs from 'fs';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = (fs.readFileSync('CLAUDE.md', 'utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/) || [])[0];
if (!KEY) { console.error('หา anon key ใน CLAUDE.md ไม่เจอ'); process.exit(1); }
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const week = process.argv[2];
const di = process.argv.indexOf('--days');
const DAYS = di > 0 ? Number(process.argv[di + 1]) : 90;
if (!/^\d{4}-\d{2}-\d{2}$/.test(week || '')) {
  console.error('ใช้: node scripts/check_weekly_menu.mjs 2026-09-07 [--days 90]');
  process.exit(1);
}

async function all(path) {
  let out = [], from = 0;
  for (;;) {
    const r = await fetch(SB + '/rest/v1/' + path + '&limit=1000&offset=' + from, { headers: H });
    if (!r.ok) return out;
    const j = await r.json();
    if (!Array.isArray(j)) return out;
    out = out.concat(j);
    if (j.length < 1000) break;
    from += 1000;
  }
  return out;
}

const menus = await all(`menu_items?select=code,name,price,kcal,protein,carb,image_urls,subcode&available_from=eq.${week}`);
if (!menus.length) { console.error('🔴 ไม่มีเมนูที่ available_from = ' + week + ' เลย'); process.exit(1); }

const since = new Date(Date.now() - DAYS * 864e5).toISOString().slice(0, 10);
const orders = await all(`orders?select=id&created_at=gte.${since}`);
const oid = new Set(orders.map(o => o.id));
const items = await all('order_items?select=menu_code,order_id');
const sold = new Set(items.filter(x => oid.has(x.order_id)).map(x => x.menu_code));

const num = c => String(c).replace(/\D/g, '');
const S = menus.filter(m => /^S/i.test(m.code)).sort((a, b) => a.code.localeCompare(b.code));
const D = menus.filter(m => /^D/i.test(m.code));
const dByNum = {}; D.forEach(m => dByNum[num(m.code)] = m);

let fail = 0;
const bad = (msg) => { fail++; console.log('  🔴 ' + msg); };

console.log('\n══ ด่านตรวจเมนูประจำสัปดาห์ ' + week + ' ══');
console.log('เมนูในชุด: ' + menus.length + ' ตัว (S ' + S.length + ' · D ' + D.length + ')\n');

console.log('① ห้ามซ้ำภายใน ' + DAYS + ' วัน');
const repeats = menus.filter(m => sold.has(m.code));
if (!repeats.length) console.log('  ✅ ไม่มีตัวไหนถูกขายเลยตั้งแต่ ' + since);
else repeats.forEach(m => bad(m.code + ' ถูกขายภายใน ' + DAYS + ' วัน — ' + m.name));

console.log('\n② ทุกตัวต้องมีรูป');
const noImg = menus.filter(m => !(Array.isArray(m.image_urls) && m.image_urls.length));
if (!noImg.length) console.log('  ✅ มีรูปครบ ' + menus.length + '/' + menus.length);
else noImg.forEach(m => bad(m.code + ' ไม่มีรูป — ' + m.name));
// ⚠️ 11 ก.ย.: ด่านเดิมผ่าน ✅ ทั้งที่รูป D076 มีราคา 70.- ฝัง และแพคกับข้าว 4/5 รูปมีข้าว
const warn = []; const w = (msg) => warn.push(msg);
const fileOf = m => String((m.image_urls||[])[0]||'').split('/').pop();
menus.forEach(m => { const f = fileOf(m); if (f && !f.toUpperCase().startsWith(String(m.code).toUpperCase())) w(m.code + ' ใช้ไฟล์รูปของรหัสอื่น (' + f + ') — เปิดดูว่าตรงจานไหม'); });

console.log('\n③ โภชนาการครบ (kcal + protein + carb)');
const noNut = menus.filter(m => !(Number(m.kcal) > 0 && Number(m.protein) > 0 && Number(m.carb) > 0));
if (!noNut.length) console.log('  ✅ ครบ ' + menus.length + '/' + menus.length);
else noNut.forEach(m => bad(m.code + ' โภชนาการไม่ครบ (kcal=' + m.kcal + ' P=' + m.protein + ' C=' + m.carb + ') — ' + m.name));

console.log('\n④ D ต้องจับคู่กับ S (เลขรหัสตรงกัน)');
const unpaired = D.filter(d => !menus.some(s => /^S/i.test(s.code) && num(s.code) === num(d.code)));
if (!unpaired.length) console.log('  ✅ D ทุกตัวมีคู่ S · ' + D.length + ' คู่');
else unpaired.forEach(d => bad(d.code + ' ไม่มีคู่ S เลขเดียวกัน — ' + d.name));
// ⚠️ 11 ก.ย.: เลขตรงไม่ได้แปลว่าจานตรง — S145 ข้าวต้มกุ้งไข่เค็ม คู่กับ D145 กุ้งผัดไข่เค็ม ผ่านด่านไปได้
const METHOD = ['ต้ม','ผัด','ทอด','ย่าง','นึ่ง','อบ','ตุ๋น','แกง','ยำ','ปิ้ง','ลวก'];
const core = x => String(x).split('+')[0].replace(/^ข้าว(?!โพด)/, '');
const methods = x => METHOD.filter(k => core(x).includes(k));
console.log('  คู่ที่ต้องมีคนยืนยันว่าเป็นจานเดียวกัน:');
D.forEach(d => { const s2 = menus.find(x => /^S/i.test(x.code) && num(x.code) === num(d.code)); if (!s2) return;
  console.log('    ' + s2.code + ' ' + s2.name + '   <->   ' + d.code + ' ' + d.name);
  const ms = methods(s2.name), md = methods(d.name);
  if (ms.length && md.length && !ms.some(k => md.includes(k))) w(s2.code + '/' + d.code + ' เลขตรงแต่วิธีทำต่างกัน (' + ms.join(',') + ' กับ ' + md.join(',') + ') — น่าจะคนละจาน');
  if (fileOf(s2) && fileOf(s2) === fileOf(d)) w(d.code + ' ใช้รูปไฟล์เดียวกับ ' + s2.code + ' — แพคกับข้าวอาจมีข้าวในรูป');
});

console.log('\n⑤ ราคาขั้นต่ำ (S ≥ 125 · D ≥ 80)');
const cheap = menus.filter(m => /^S/i.test(m.code) ? Number(m.price) < 125 : Number(m.price) < 80);
if (!cheap.length) console.log('  ✅ ผ่านทุกตัว');
else cheap.forEach(m => bad(m.code + ' ราคา ฿' + m.price + ' ต่ำกว่าขั้นต่ำ — ' + m.name));

/* ⚠️ สิ่งที่ตัวนี้ตรวจ "ไม่ได้" — เขียนไว้กันคนอ่านผลว่า ✅ แล้วนึกว่าปลอดภัย 100%
   · รูปตรงกับจานจริงไหม (เคยเจอ: แพคกับข้าวใช้รูปที่มีข้าว)
   · ตัวเลขโภชนาการถูกไหม (เคยเจอ: S104/D104 ก๊อปกันมาทั้งแถว)
   · ครัวทำไหวไหม · สต็อคตั้งหรือยัง
   สามข้อนี้ต้องใช้คนดู */
console.log('\n' + '─'.repeat(52));
if (fail) {
  console.log('🔴 ไม่ผ่าน ' + fail + ' ข้อ — ห้ามเปิดขาย ห้ามยิงบรอดแคสต์');
  console.log('   นัทเคาะเอง 4 ก.ย.: "ต้องวนเมนูไม่ซ้ำเท่านั้น ยังไงก็ต้องได้เมนูใหม่ ถ้าไม่ได้ต้องทวง"');
  console.log('   🔴 นัทย้ำอีกครั้ง: "เราไม่มีเลื่อน เราต้องได้เมนูใหม่สัปดาห์หน้า!"');
  console.log('   → ทางออกมีทางเดียว: ทวงเมนูใหม่จนได้');
  console.log('     ⛔ ห้ามผ่อนกฎ  ⛔ ห้ามเลื่อนสัปดาห์  ⛔ ห้ามใช้ชุดเดิมซ้ำ');
  process.exit(1);
}
if (warn.length) { console.log('⚠️ ธงที่เครื่องจับได้แต่ตัดสินเองไม่ได้ (' + warn.length + '):'); warn.forEach(x => console.log('   · ' + x)); }
console.log('✅ ผ่านด่านเครื่อง 5 ข้อ — แต่ **ยังยิงไม่ได้** จนกว่าจะมีคนเปิดโบรชัวร์ดูด้วยตา');
console.log('   ต้องดูด้วยตาทุกครั้ง: ราคา/ข้อความฝังในรูป · แพคกับข้าวห้ามมีข้าวในรูป · คู่ S/D เป็นจานเดียวกันจริง · รูปตรงจาน');
console.log('⚠️ ยังต้องใช้คนดู: รูปตรงจานไหม · ตัวเลขโภชนาการถูกไหม · ครัวทำไหวไหม · ตั้งสต็อคยัง');
process.exit(0);

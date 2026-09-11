/* ด่านตรวจเมนูประจำสัปดาห์ — แบบ fail-closed ตามวงจรใหม่ที่นัทเคาะ 11 ก.ย. 2569
 *
 *   node scripts/check_weekly_menu.mjs 2026-09-21              ตรวจ + บันทึกผลลง kitchen_data.weekly_gate
 *   node scripts/check_weekly_menu.mjs 2026-09-21 --no-save    ตรวจเฉยๆ ไม่บันทึก
 *   node scripts/check_weekly_menu.mjs 2026-09-21 --visual-ok "ชื่อคนดู"
 *        บันทึกว่ามีคนเปิดดูรูปทุกตัวแล้ว (ใช้ได้เฉพาะชุดที่ผ่านด่านเครื่อง และลายนิ้วมือชุดยังตรงกัน)
 *
 * นัทพูดเอง 11 ก.ย.: approve แค่ 2 อย่าง ① เมนูไม่ซ้ำอย่างน้อย 3 เดือน
 *   ② รูปตรงกับชื่อเมนู · S1–S8 กับ D1–D5 รูปตรงกัน ข้อมูลตรงกัน · มีแคลอรี่ครบ · ราคาถูกต้อง
 *   "หากเมนูถูกทุกอย่าง ฉันไม่ต้องการการ approve เลยด้วยซ้ำ"
 * นัทเคาะเพิ่ม 11 ก.ย. (ผ่านนิว): รูปแพคกับข้าว "ติดข้าวมาบ้าง ... ไม่มีปัญหา" → D ใช้รูปของ S คู่ตัวเอง = ใช้ได้
 *
 * 5 ข้อ — ตก 1 ข้อ = ไม่ผ่านทั้งชุด
 *   ① ไม่ซ้ำ ≥ 90 วัน — ทั้งที่ขายจริง และที่เคยขึ้นช่องใน weekly_slot_history
 *   ② รูป — ทุกตัวมีรูป · คู่ S/D วิธีทำต้องไม่ขัดกัน (เคส S145 ข้าวต้ม ↔ D145 ผัด 11 ก.ย.)
 *   ③ ชื่อเล่น — S 8 ตัว D 5 ตัว · subcode S1–S8 / D1–D5 ครบ ไม่ซ้ำ · Dn ต้องเลขรหัสตรงกับ Sn
 *   ④ โภชนาการ — kcal + protein + carb + fat ครบทุกตัว
 *   ⑤ ราคา — S ≥ 125 · D ≥ 80
 *
 * ⚠️ ธง (ไม่ตก แต่คนดูรูปต้องเช็คตามลิสต์ก่อนกด --visual-ok):
 *   · ไฟล์รูปชื่อเป็นรหัสอื่น — อาจแค่ชื่อไฟล์ค้างจากการโยกรหัส (รูปถูกจาน) หรือยืมรูปผิดจาน · เครื่องแยกไม่ออก
 *   · D ใช้รูปเดียวกับ S คู่ตัวเอง — ใช้ได้ตามที่นัทเคาะ แค่แจ้งไว้
 *
 * ผลที่บันทึก (U อ่านก่อนเปิดขายอัตโนมัติศุกร์ 18:00):
 *   kitchen_data.weekly_gate = { "2026-09-21": { at, pass, fails[], warns[], fingerprint, codes[], visual_ok, visual_by, visual_at } }
 *   เปิดขายได้ก็ต่อเมื่อ pass === true && visual_ok === true && fingerprint ตรงกับชุดใน DB ตอนจะเปิด
 *   ไม่มีบันทึก / ลายนิ้วมือไม่ตรง (มีคนแก้ชุดหลังผ่านด่าน) = ห้ามเปิด
 *
 * ⚠️ exit code: ไม่ใช้ process.exit() — บน Windows แครช UV_HANDLE_CLOSING คืน 127 (เจอจริง 11 ก.ย.)
 */
import fs from 'fs';
import crypto from 'crypto';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = (fs.readFileSync('CLAUDE.md', 'utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/) || [])[0];
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const GATE = 'weekly_gate';
const S_SLOTS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
const D_SLOTS = ['D1', 'D2', 'D3', 'D4', 'D5'];
const METHOD = ['ต้ม', 'ผัด', 'ทอด', 'ย่าง', 'นึ่ง', 'อบ', 'ตุ๋น', 'แกง', 'ยำ', 'ปิ้ง', 'ลวก'];

async function all(path) {
  let out = [], from = 0;
  for (;;) {
    const r = await fetch(SB + '/rest/v1/' + path + '&limit=1000&offset=' + from, { headers: H });
    const j = await r.json().catch(() => null);
    if (!Array.isArray(j)) throw new Error('query ไม่สำเร็จ: ' + path.split('?')[0] + ' ' + JSON.stringify(j).slice(0, 120));
    out = out.concat(j);
    if (j.length < 1000) break;
    from += 1000;
  }
  return out;
}
async function getKey(key) {
  const j = await all(`kitchen_data?select=data&key=eq.${key}`);
  return (j[0] && j[0].data) || {};
}
async function putKey(key, data) {
  const r = await fetch(SB + '/rest/v1/kitchen_data', {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ key, data }),
  });
  if (!r.ok) throw new Error('บันทึกไม่สำเร็จ ' + r.status + ' ' + (await r.text()).slice(0, 120));
  return await getKey(key); // อ่านกลับยืนยัน
}

const num = c => String(c).replace(/\D/g, '');
const fileOf = m => String((m.image_urls || [])[0] || '').split('/').pop().split('?')[0];
const fileCode = f => (String(f).match(/^([A-Za-z]+\d+)/) || [])[1] || '';
const core = x => String(x).split('+')[0].replace(/^ข้าว(?!โพด)/, '');
const methods = x => METHOD.filter(k => core(x).includes(k));
function fingerprint(menus) {
  const rows = menus.map(m => [m.code, m.subcode, m.name, m.price, m.kcal, m.protein, m.carb, m.fat, fileOf(m)].join('|')).sort();
  return crypto.createHash('sha1').update(rows.join('\n')).digest('hex').slice(0, 16);
}

async function main() {
  const args = process.argv.slice(2);
  const week = args[0];
  const noSave = args.includes('--no-save');
  const vi = args.indexOf('--visual-ok');
  const visualBy = vi > 0 ? args[vi + 1] : null;
  const di = args.indexOf('--days');
  const DAYS = di > 0 ? Number(args[di + 1]) : 90;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week || '')) { console.error('ใช้: node scripts/check_weekly_menu.mjs 2026-09-21 [--no-save] [--visual-ok "ชื่อ"]'); return 1; }
  if (vi > 0 && !visualBy) { console.error('--visual-ok ต้องตามด้วยชื่อคนที่เปิดดูรูป'); return 1; }

  const menus = await all(`menu_items?select=code,name,price,kcal,protein,carb,fat,image_urls,subcode&available_from=eq.${week}`);
  const fails = [], warns = [];
  const bad = (group, msg) => { fails.push(group + ' ' + msg); console.log('  🔴 ' + msg); };
  const flag = msg => { warns.push(msg); console.log('  ⚠️ ' + msg); };

  console.log('\n══ ด่านตรวจเมนูประจำสัปดาห์ ' + week + ' (fail-closed) ══');
  if (!menus.length) { console.log('🔴 ไม่มีเมนูที่ available_from = ' + week + ' เลย'); fails.push('ไม่มีเมนู'); }
  const S = menus.filter(m => /^S/i.test(m.code));
  const D = menus.filter(m => /^D/i.test(m.code));
  const other = menus.filter(m => !/^[SD]/i.test(m.code));
  console.log('เมนูในชุด: ' + menus.length + ' ตัว (S ' + S.length + ' · D ' + D.length + (other.length ? ' · อื่นๆ ' + other.length : '') + ')\n');

  // ① ไม่ซ้ำ
  console.log('① ไม่ซ้ำภายใน ' + DAYS + ' วัน');
  const since = new Date(new Date(week + 'T00:00:00Z').getTime() - DAYS * 864e5).toISOString().slice(0, 10);
  const codes = menus.map(m => m.code);
  const b1 = fails.length;
  if (codes.length) {
    const orders = await all(`orders?select=id,total&created_at=gte.${since}&created_at=lt.${week}`);
    const oid = new Set(orders.filter(o => Number(o.total) > 0).map(o => o.id));
    const items = await all(`order_items?select=menu_code,order_id&menu_code=in.(${codes.join(',')})`);
    const sold = new Set(items.filter(x => oid.has(x.order_id)).map(x => x.menu_code));
    const hist = await getKey('weekly_slot_history');
    const shown = {};
    Object.entries(hist).forEach(([w, h]) => {
      if (w >= week || w < since) return;
      Object.values(h.slots || {}).forEach(v => { (shown[v.code] = shown[v.code] || []).push(w); });
    });
    menus.forEach(m => {
      if (sold.has(m.code)) bad('①', m.code + ' ถูกขายภายใน ' + DAYS + ' วันก่อน ' + week + ' — ' + m.name);
      else if (shown[m.code]) bad('①', m.code + ' เคยขึ้นเมนูสัปดาห์ ' + shown[m.code].join(',') + ' — ' + m.name);
    });
  }
  if (fails.length === b1) console.log('  ✅ ไม่ซ้ำตั้งแต่ ' + since);

  // ③ ชื่อเล่น + จำนวน
  console.log('\n③ ชื่อเล่น S1–S8 / D1–D5');
  const b3 = fails.length;
  if (S.length !== 8) bad('③', 'ข้าวกล่องมี ' + S.length + ' ตัว ต้องเป็น 8');
  if (D.length !== 5) bad('③', 'แพคกับข้าวมี ' + D.length + ' ตัว ต้องเป็น 5');
  other.forEach(m => bad('③', m.code + ' ไม่ใช่ S/D แต่อยู่ในชุดสัปดาห์นี้ — ' + m.name));
  const bySub = {};
  menus.forEach(m => {
    if (!m.subcode) return bad('③', m.code + ' ยังไม่มีชื่อเล่น — ' + m.name);
    const want = /^S/i.test(m.code) ? S_SLOTS : D_SLOTS;
    if (!want.includes(m.subcode)) bad('③', m.code + ' ชื่อเล่น "' + m.subcode + '" ไม่ใช่ ' + want[0] + '–' + want[want.length - 1]);
    if (bySub[m.subcode]) bad('③', 'ชื่อเล่น ' + m.subcode + ' ซ้ำกัน: ' + bySub[m.subcode].code + ' กับ ' + m.code);
    bySub[m.subcode] = m;
  });
  if (menus.length) [...S_SLOTS, ...D_SLOTS].forEach(s => { if (!bySub[s]) bad('③', 'ช่อง ' + s + ' ว่าง'); });
  if (fails.length === b3) console.log('  ✅ ครบ 13 ช่อง ไม่ซ้ำ');

  // ② รูป + คู่ S/D
  console.log('\n② รูปและคู่ S/D');
  const b2 = fails.length;
  const pairOf = {};
  D_SLOTS.forEach((ds, i) => { if (bySub[ds] && bySub[S_SLOTS[i]]) pairOf[bySub[ds].code] = bySub[S_SLOTS[i]]; });
  menus.forEach(m => {
    const f = fileOf(m);
    if (!f) return bad('②', m.code + ' ไม่มีรูป — ' + m.name);
    const fc = fileCode(f).toUpperCase(), own = String(m.code).toUpperCase();
    if (!fc || fc === own) return;
    const pair = pairOf[m.code];
    if (pair && (fc === String(pair.code).toUpperCase() || f === fileOf(pair))) return flag(m.code + ' ใช้รูปของคู่ ' + pair.code + ' (ใช้ได้ตามที่นัทเคาะ)');
    flag(m.code + ' ไฟล์รูปชื่อ ' + f + ' — ชื่อไฟล์ค้างจากโยกรหัส หรือยืมรูปผิดจาน? ต้องเปิดดู — ' + m.name);
  });
  console.log('  คู่ S/D:');
  D_SLOTS.forEach((ds, i) => {
    const d = bySub[ds], s = bySub[S_SLOTS[i]];
    if (!d || !s) return;
    console.log('    ' + S_SLOTS[i] + ' ' + s.code + ' ' + s.name + '   <->   ' + ds + ' ' + d.code + ' ' + d.name);
    if (num(s.code) !== num(d.code)) bad('③', ds + ' ' + d.code + ' เลขรหัสไม่ตรงกับ ' + S_SLOTS[i] + ' ' + s.code);
    const ms = methods(s.name), md = methods(d.name);
    if (ms.length && md.length && !ms.some(k => md.includes(k))) bad('②', S_SLOTS[i] + '/' + ds + ' วิธีทำขัดกัน (' + ms.join(',') + ' กับ ' + md.join(',') + ') = คนละจาน');
  });
  if (fails.length === b2) console.log('  ✅ ผ่านส่วนที่เครื่องตรวจได้');

  // ④ โภชนาการ
  console.log('\n④ โภชนาการครบ (kcal + protein + carb + fat)');
  const b4 = fails.length;
  const has = v => v != null && v !== '' && Number(v) >= 0;
  menus.forEach(m => {
    if (!(Number(m.kcal) > 0 && Number(m.protein) > 0 && has(m.carb) && has(m.fat)))
      bad('④', m.code + ' โภชนาการไม่ครบ (kcal=' + m.kcal + ' P=' + m.protein + ' C=' + m.carb + ' F=' + m.fat + ') — ' + m.name);
  });
  D_SLOTS.forEach((ds, i) => {
    const d = bySub[ds], s = bySub[S_SLOTS[i]];
    if (d && s && Number(d.kcal) > 0 && Number(d.kcal) >= Number(s.kcal))
      flag(ds + ' ' + d.code + ' แคลอรี่ ' + d.kcal + ' ไม่น้อยกว่าคู่ข้าวกล่อง ' + s.kcal + ' — ตัวเลขอาจก๊อปมา');
  });
  if (fails.length === b4) console.log('  ✅ ครบ');

  // ⑤ ราคา
  console.log('\n⑤ ราคา (S ≥ 125 · D ≥ 80)');
  const b5 = fails.length;
  menus.forEach(m => {
    const min = /^S/i.test(m.code) ? 125 : 80;
    if (!(Number(m.price) >= min)) bad('⑤', m.code + ' ราคา ฿' + m.price + ' ต่ำกว่า ' + min + ' — ' + m.name);
  });
  if (fails.length === b5) console.log('  ✅ ผ่าน');

  const pass = fails.length === 0;
  const fp = fingerprint(menus);
  console.log('\n' + '─'.repeat(52));
  console.log('ลายนิ้วมือชุด: ' + fp);

  const gate = await getKey(GATE);
  const prev = gate[week];
  const base = { at: new Date().toISOString(), by: '05', pass, fails, warns, fingerprint: fp, codes: codes.slice().sort() };

  if (visualBy) {
    if (!pass) { console.log('🔴 บันทึก "ดูรูปแล้ว" ไม่ได้ — ชุดนี้ยังไม่ผ่านด่านเครื่อง'); return 1; }
    gate[week] = { ...base, visual_ok: true, visual_by: visualBy, visual_at: new Date().toISOString() };
    const back = await putKey(GATE, gate);
    const ok = back[week] && back[week].visual_ok === true && back[week].fingerprint === fp;
    console.log(ok ? '✅ บันทึกแล้ว: ' + visualBy + ' ดูรูปทุกตัว · ชุดนี้พร้อมเปิดขาย' : '🔴 อ่านกลับแล้วไม่พบบันทึก');
    return ok ? 0 : 1;
  }

  if (!pass) {
    console.log('🔴 ไม่ผ่าน ' + fails.length + ' ข้อ — ห้ามเปิดขาย ห้ามยิงบรอดแคสต์ · แจ้งนัท + นิวทันที');
    console.log('   ⛔ ห้ามผ่อนกฎให้ทันเวลา · ไม่ทัน = ตกด่าน');
  } else {
    console.log('✅ ผ่านด่านเครื่อง 5 ข้อ — ยังขาดคนเปิดดูรูปทุกตัว (--visual-ok) ก่อนเปิดขายได้');
  }
  if (warns.length) console.log('⚠️ ธง ' + warns.length + ' ข้อ — คนดูรูปต้องเช็คตามนี้ก่อนกด --visual-ok');

  if (!noSave) {
    // ชุดเปลี่ยน = ล้างผลดูรูปเดิมทิ้ง (ดูชุดเก่า ไม่ได้แปลว่าชุดใหม่ถูก)
    const keepVisual = !!(prev && prev.fingerprint === fp && prev.visual_ok === true);
    gate[week] = { ...base, visual_ok: keepVisual ? true : null, visual_by: keepVisual ? prev.visual_by : null, visual_at: keepVisual ? prev.visual_at : null };
    const back = await putKey(GATE, gate);
    const ok = back[week] && back[week].fingerprint === fp && back[week].pass === pass;
    console.log(ok ? '📝 บันทึกผลลง kitchen_data.weekly_gate แล้ว' + (prev && prev.visual_ok && !keepVisual ? ' (ชุดเปลี่ยน → ผลดูรูปเดิมถูกล้าง)' : '') : '🔴 บันทึกผลไม่ติด');
    if (!ok) return 1;
  }
  return pass ? 0 : 1;
}

main().then(code => { process.exitCode = code; })
  .catch(e => { console.error('🔴 ด่านตรวจพัง (นับเป็นไม่ผ่าน):', e && e.message || e); process.exitCode = 2; });

/* 🟢 ตัวเปิดขายเมนูสัปดาห์หน้า — ศุกร์ 18:00 (นัทเคาะวงจรเมนูใหม่ 11 ก.ย. 2569 · พี่ปืนเคาะให้ U เป็นตัวเปิดตัวเดียว)
 *
 *   node scripts/u/weekly_open.mjs                      ดูอย่างเดียว (สัปดาห์ = จันทร์ถัดไป เวลาไทย) ไม่เขียนอะไรเลย
 *   node scripts/u/weekly_open.mjs 2026-09-21           ดูอย่างเดียว ระบุสัปดาห์
 *   node scripts/u/weekly_open.mjs 2026-09-21 --apply   ทำจริง (Windows ตั้งเวลาเรียกตัวนี้)
 *   node scripts/u/weekly_open.mjs --check              ตัวเช็คว่ารอบศุกร์นี้รันจริงและสำเร็จ (ตั้งเวลา 18:30) — ไม่ผ่าน = เด้งบอร์ด
 *
 * 🔴 กติกาเหล็ก: ตกข้อไหน = ไม่เปิดขาย (fail-closed) · ห้ามผ่อนกฎให้ทันเวลา · เปิดขายเป็นขั้นสุดท้ายเสมอ
 *
 * ลำดับ:
 *   ① ผลด่านพุธของ 05   kitchen_data.weekly_gate[สัปดาห์] — pass:true · visual_ok:true · ไม่เก่ากว่า 7 วัน · รหัสตรงแผนครบ 13
 *   ② แผนของนิว         weekly_subcode_plan[สัปดาห์] 13 ช่อง · weekly_stock_plan[สัปดาห์].qty > 0 ทุกช่อง
 *   ③ ประตูกันสั่งส่งก่อนวันขาย ต้องมีบนหน้าจริง: LIFF (ด่านตอนกดสั่ง) · หน้าสั่งแทนลูกค้า · หน้าเว็บ /pack
 *   ④ เมนูทุกตัว available_from = วันจันทร์นั้น (ด่านวันส่งทั้ง 3 ประตูอ่านค่านี้)
 *   ⑤ เรียกของนิว: go_live_week_stock.mjs --apply --no-open (ถอดป้ายเก่า → ป้าย+สต็อก → กำลังผลิต ไม่เปิดขาย)
 *   ⑥ ติดป้ายสัปดาห์ menu_special_weeks (LIFF ขึ้น "สัปดาห์หน้า 21-27 Sep")
 *   ⑦ ตรวจจาก DB ก่อนเปิด → ⑧ เปิดขาย → ⑨ ตรวจจาก DB หลังเปิด
 *   ⑩ บันทึกหัวใจ kitchen_data.weekly_open_last + โพสต์บอร์ดห้อง u (poller ปลุกให้เปิดหน้าลูกค้าดูด้วยตา) และ pm
 *
 * ⚠️ ที่ตัวนี้ "ไม่ได้ตรวจ": fingerprint ของ 05 (แก้ราคา/รูป/โภชนาการหลังพุธโดยไม่เปลี่ยนรหัส จะไม่ถูกจับ)
 * ⚠️ exit code: ห้าม process.exit() ตรง ๆ บน Windows (fetch ค้าง → แครช 127 · เจอจริงที่ bc_weekly_kick 11 ก.ย.) ใช้ process.exitCode
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const NL = String.fromCharCode(10);
const SLOTS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'D1', 'D2', 'D3', 'D4', 'D5'];
const HB = 'weekly_open_last';
const DOORS = [
  { name: 'LIFF ด่านตอนกดสั่ง', url: 'https://under360-system.vercel.app/liff_customer.html', marks: ['function cartDateBeforeReady(', 'cartDateBeforeReady(selDate)'] },
  { name: 'หน้าสั่งแทนลูกค้า', url: 'https://under360-system.vercel.app/operation_hub.html', marks: ['function obCartReadyDate(', 'if(obReadyAt&&date<obReadyAt)'] },
  /* ⚠️ ของ M — ยังไม่รู้ว่า M แก้แบบไหน ตัวบ่งชี้ขั้นต่ำคือหน้านั้นต้องอ่าน available_from · M ยืนยันแล้วค่อยเปลี่ยนเป็นเครื่องหมายที่เจาะจงกว่า */
  { name: 'หน้าเว็บ /pack (ของ M)', url: 'https://360foodbox.com/pack', marks: ['available_from'] },
];

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const CHECK = args.includes('--check');
const ymd = (d) => d.toISOString().slice(0, 10);
function nextMonday() {
  const d = new Date(Date.now() + 7 * 3600e3);            // เวลาไทย
  const dow = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (((8 - dow) % 7) || 7));  // ศุกร์ → +3 · จันทร์ → +7
  return ymd(d);
}
const WEEK = args.find((a) => /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(a)) || nextMonday();

async function get(p) {
  const r = await fetch(SB + '/rest/v1/' + p, { headers: H });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error('อ่าน ' + p.split('?')[0] + ' ไม่ได้ ' + r.status);
  return j;
}
async function patch(p, body) {
  const r = await fetch(SB + '/rest/v1/' + p, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => null);
  return r.ok && Array.isArray(j) ? j : null;
}
async function upsertKD(key, data) {
  const r = await fetch(SB + '/rest/v1/kitchen_data?on_conflict=key', { method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ key, data }) });
  return r.ok;
}
async function kd(key) {
  const j = await get('kitchen_data?select=data&key=eq.' + key);
  return (j[0] && j[0].data) || null;
}
async function post(room, text) {
  try {
    await fetch(SB + '/rest/v1/session_messages', { method: 'POST', headers: H, body: JSON.stringify({ room, sender: 'u-maintainer', role: 'u-maintainer', text }) });
  } catch (e) { console.log('โพสต์บอร์ด ' + room + ' ไม่สำเร็จ: ' + e.message); }
}

/* ── ตัวเช็ค 18:30 — รอบ 18:00 ต้องทิ้งหัวใจไว้ภายใน 2 ชม. และสำเร็จ ── */
async function runCheck() {
  const hb = await kd(HB);
  const age = hb && hb.at ? (Date.now() - new Date(hb.at).getTime()) / 36e5 : null;
  const good = !!(hb && hb.apply && hb.ok && age !== null && age <= 2);
  console.log(good ? '✅ รอบล่าสุดรันจริงและเปิดสำเร็จ ' + hb.week + ' (' + age.toFixed(1) + ' ชม. ที่แล้ว)' : '🔴 ไม่พบรอบที่สำเร็จภายใน 2 ชม.');
  if (good) return;
  let why;
  if (!hb) why = 'ไม่เคยมีหัวใจเลย = ตัวเปิดไม่เคยรัน';
  else if (age === null) why = 'หัวใจไม่มีเวลา';
  else if (age > 2) why = 'รอบล่าสุด ' + age.toFixed(1) + ' ชม. ที่แล้ว = รอบ 18:00 วันนี้ไม่ได้รัน';
  else if (!hb.apply) why = 'รอบล่าสุดเป็นแค่ดูอย่างเดียว';
  else why = 'รันแล้วแต่ไม่เปิด: ' + (hb.stopped_at || '') + ' · ' + (hb.reasons || []).slice(0, 3).join(' | ');
  const t = '🔴 [u ตัวเช็ค 18:30] ตัวเปิดขายเมนูสัปดาห์หน้าไม่สำเร็จ — ' + why + NL + 'เมนูชุดใหม่ยังไม่เปิดขาย (fail-closed) · ดู kitchen_data.' + HB;
  await post('u-maintainer', t);
  await post('pm', t);
  process.exitCode = 1;
}

async function main() {
  if (CHECK) return runCheck();
  const bad = [];
  let stoppedAt = '';
  const stop = (step, reasons) => { if (!stoppedAt) stoppedAt = step; reasons.forEach((x) => bad.push(step + ': ' + x)); };
  console.log('เปิดขายสัปดาห์ ' + WEEK + (APPLY ? '  ⚠️ ทำจริง' : '  (ดูอย่างเดียว ไม่เขียนอะไร)'));
  if (new Date(WEEK + 'T00:00:00Z').getUTCDay() !== 1) stop('สัปดาห์', [WEEK + ' ไม่ใช่วันจันทร์']);

  // ② แผนของนิว
  const plan = ((await kd('weekly_subcode_plan')) || {})[WEEK];
  const stock = (((await kd('weekly_stock_plan')) || {})[WEEK] || {}).qty;
  const r2 = [];
  if (!plan) r2.push('ไม่มี weekly_subcode_plan');
  else SLOTS.forEach((s) => { if (!plan[s]) r2.push(s + ' ไม่มีรหัส'); });
  if (!stock) r2.push('ไม่มี weekly_stock_plan');
  else SLOTS.forEach((s) => { if (!(Number(stock[s]) > 0)) r2.push(s + ' ไม่มียอดสต็อก'); });
  const codes = plan ? SLOTS.map((s) => plan[s]).filter(Boolean) : [];

  // ① ผลด่านพุธของ 05
  const gate = ((await kd('weekly_gate')) || {})[WEEK];
  const r1 = [];
  if (!gate) r1.push('ไม่มีผลด่านของสัปดาห์นี้ (ไม่ได้รัน หรือพังกลางทาง)');
  else {
    if (gate.pass !== true) r1.push('ด่านเครื่องไม่ผ่าน' + (gate.fails && gate.fails.length ? ' — ' + gate.fails.slice(0, 3).join(' | ') : ''));
    /* pass = ผ่านส่วนที่เครื่องตรวจได้เท่านั้น · รูปคนละจานเครื่องแยกไม่ออก ต้องมีคนดูรูปแล้ว (05 ขอ 11 ก.ย.) */
    if (gate.visual_ok !== true) r1.push('ยังไม่มีคนดูรูปยืนยัน (visual_ok)');
    const age = gate.at ? (Date.now() - new Date(gate.at).getTime()) / 864e5 : Infinity;
    if (!(age <= 7)) r1.push('ผลด่านเก่ากว่า 7 วัน/ไม่มีเวลา');
    const a = [...(gate.codes || [])].sort().join(',');
    const b = [...codes].sort().join(',');
    if (codes.length !== 13 || a !== b) r1.push('รหัสที่ตรวจไม่ตรงแผน (ตรวจ ' + (gate.codes || []).length + ' · แผน ' + codes.length + ')');
  }
  if (r1.length) stop('① ด่านพุธ 05', r1);
  if (r2.length) stop('② แผนนิว', r2);

  // ③ ประตูกันสั่งส่งก่อนวันขาย บนหน้าจริง
  const r3 = [];
  for (const d of DOORS) {
    try {
      const res = await fetch(d.url + (d.url.includes('?') ? '&' : '?') + 'v=' + Date.now());
      const html = await res.text();
      const miss = d.marks.filter((m) => !html.includes(m));
      if (!res.ok) r3.push(d.name + ' เปิดไม่ได้ ' + res.status);
      else if (miss.length) r3.push(d.name + ' ไม่มีด่าน (' + miss.join(', ') + ')');
    } catch (e) { r3.push(d.name + ' เปิดไม่ได้ ' + e.message); }
  }
  if (r3.length) stop('③ ประตูกันวันส่ง', r3);

  // ④ เมนูพร้อม
  if (codes.length) {
    const rows = await get('menu_items?select=code,available_from,is_available&code=in.(' + codes.join(',') + ')');
    const r4 = [];
    codes.forEach((c) => {
      const m = rows.find((x) => x.code === c);
      if (!m) r4.push(c + ' ไม่มีในตาราง');
      else if (String(m.available_from || '').slice(0, 10) !== WEEK) r4.push(c + ' available_from=' + m.available_from);
    });
    const early = rows.filter((m) => m.is_available);
    if (early.length) console.log('  ⚠️ เปิดขายอยู่ก่อนแล้ว: ' + early.map((m) => m.code).join(' '));
    if (r4.length) stop('④ เมนู', r4);
  }

  if (bad.length) {
    console.log(NL + '🔴 ไม่เปิดขาย (' + bad.length + ' ข้อ):');
    bad.forEach((x) => console.log('   · ' + x));
    if (APPLY) await finish(false, stoppedAt, bad);
    else process.exitCode = 1;
    return;
  }
  console.log('✅ ด่าน ①–④ ผ่าน');

  // ⑤ ของนิว: ป้าย + สต็อก + กำลังผลิต (ไม่เปิดขาย)
  const niw = path.join(ROOT, 'scripts', 'niw', 'go_live_week_stock.mjs');
  const r = spawnSync(process.execPath, [niw, WEEK, ...(APPLY ? ['--apply', '--no-open'] : [])], { cwd: ROOT, encoding: 'utf8' });
  console.log(NL + '── ⑤ go_live_week_stock ' + (APPLY ? '--apply --no-open' : '(ดูอย่างเดียว)') + ' → exit ' + r.status);
  console.log(((r.stdout || '') + (r.stderr || '')).trim().split(NL).map((l) => '   │ ' + l).join(NL));
  if (r.status !== 0) {
    if (APPLY) await finish(false, '⑤ สคริปต์นิว', ['exit ' + r.status]);
    else process.exitCode = 1;
    return;
  }
  if (!APPLY) { console.log(NL + '(ดูอย่างเดียว — ⑥–⑩ ไม่ได้ทำ · ถ้า --apply จะติดป้ายสัปดาห์ ' + codes.length + ' ตัว แล้วเปิดขาย)'); return; }

  // ⑥ ป้ายสัปดาห์
  const weeks = (await kd('menu_special_weeks')) || {};
  codes.forEach((c) => { weeks[c] = WEEK; });
  if (!(await upsertKD('menu_special_weeks', weeks))) return finish(false, '⑥ ป้ายสัปดาห์', ['บันทึก menu_special_weeks ไม่สำเร็จ']);

  // ⑦ ตรวจก่อนเปิด
  const pre = await get('menu_items?select=code,subcode,stock_total&code=in.(' + codes.join(',') + ')');
  const tags = (await kd('menu_special_weeks')) || {};
  const r7 = [];
  SLOTS.forEach((s) => {
    const m = pre.find((x) => x.code === plan[s]);
    if (!m) { r7.push(s + ' หาไม่เจอ'); return; }
    if (String(m.subcode || '').toUpperCase() !== s) r7.push(s + ' ป้าย=' + m.subcode);
    if (!(Number(m.stock_total) > 0)) r7.push(s + ' stock_total=' + m.stock_total);
    if (tags[m.code] !== WEEK) r7.push(s + ' ป้ายสัปดาห์=' + tags[m.code]);
  });
  if (r7.length) return finish(false, '⑦ ตรวจก่อนเปิด', r7);

  // ⑧ เปิดขาย — ขั้นสุดท้าย
  const r8 = [];
  for (const c of codes) {
    const j = await patch('menu_items?code=eq.' + c, { is_available: true });
    if (!j || j.length !== 1) r8.push(c + ' เปิดไม่สำเร็จ');
  }

  // ⑨ ตรวจหลังเปิด
  const back = await get('menu_items?select=code,is_available&code=in.(' + codes.join(',') + ')');
  const open = back.filter((m) => m.is_available).length;
  const all = await get('menu_items?select=code,subcode&subcode=not.is.null');
  const seen = {};
  all.forEach((m) => { const k = String(m.subcode).toUpperCase(); (seen[k] = seen[k] || []).push(m.code); });
  const dup = Object.entries(seen).filter(([k, a]) => SLOTS.includes(k) && a.length > 1);
  if (open !== 13) r8.push('เปิดขาย ' + open + '/13');
  if (dup.length) r8.push('ป้ายซ้ำ ' + dup.map(([k, a]) => k + '=' + a.join('/')).join(' '));
  return finish(!r8.length, r8.length ? '⑨ หลังเปิด' : '', r8, { open, codes });
}

async function finish(ok, stoppedAt, reasons, extra = {}) {
  const hb = { week: WEEK, at: new Date().toISOString(), apply: true, ok, stopped_at: stoppedAt || null, reasons, ...extra };
  const saved = await upsertKD(HB, hb);
  const head = ok
    ? '🟢 [u ตัวเปิดศุกร์] เปิดขายเมนูสัปดาห์ ' + WEEK + ' แล้ว ' + (extra.open || 0) + '/13 · ป้ายสัปดาห์+สต็อกครบ'
    : '🔴 [u ตัวเปิดศุกร์] ไม่เปิดขายเมนูสัปดาห์ ' + WEEK + ' — ตกที่ ' + stoppedAt;
  const body = ok
    ? NL + '→ ห้อง u: เปิดหน้าลูกค้าดูด้วยตา + ลองเลือกวันส่งเสาร์/อาทิตย์ต้องไม่ได้'
    : NL + reasons.slice(0, 8).map((x) => '· ' + x).join(NL) + NL + 'เมนูชุดใหม่ยังปิดอยู่ (fail-closed) · ห้ามเปิดมือจนกว่าเจ้าของข้อที่ตกจะแก้';
  await post('u-maintainer', head + body + (saved ? '' : NL + '⚠️ บันทึกหัวใจไม่สำเร็จ'));
  await post('pm', head + (ok ? '' : body));
  console.log(NL + head + body);
  process.exitCode = ok ? 0 : 1;
}

main().catch(async (e) => {
  console.log('💥 ' + e.message);
  if (APPLY) await finish(false, 'ข้อผิดพลาดไม่คาดคิด', [e.message]);
  else process.exitCode = 1;
});

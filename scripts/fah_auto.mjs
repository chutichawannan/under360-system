#!/usr/bin/env node
/**
 * 🤖 ตัวรันอัตโนมัติของห้องฟ้า — ทำใบงานครัวเองทั้งกระบวนการ ไม่ต้องมีคนสั่ง
 *
 *   node scripts/fah_auto.mjs              ทำวันผลิตถัดไป
 *   node scripts/fah_auto.mjs 2026-09-07   ระบุวันเอง
 *   node scripts/fah_auto.mjs --dry        ดูอย่างเดียว ไม่เขียน ไม่ push
 *
 * นัทสั่งเอง 3 ก.ย. 2026:
 *   *"ตอนนี้เราไม่ประสบความสำเร็จในการทำออโตเมชั่นเลย
 *     ฉันอยากได้เซอร์ไพรส์แบบ วันอาทิตย์ตอนบ่าย 3 ฉันเห็นรายการแล้วว่าจะทำอะไรเท่าไหร่โดยประมาณ"*
 *
 * 🔑 ทำไมตัวนี้ถึงต่างจากของเดิม: **ไม่ต้องใช้ AI เลย** — เป็นสคริปต์ล้วน
 *    เลยเอาไปตั้งกับ Task Scheduler ของ Windows ได้ (ตัวที่รันแม้ไม่ได้เปิด Claude)
 *    ตัวตั้งเวลาฝั่ง Claude ไม่ยิงมา 8 วันแล้ว — ตัวนี้ไม่พึ่งมัน
 *
 * ลำดับงาน: จ่ายเมนูรอบที่ว่าง → บังคับจำนวนเมนู/วัน → sync order_items
 *          → ทำใบครัว+ใบจัดของ → ตรวจ 7 ข้อ → push ขึ้น main → เขียนสรุป
 * ⛔ ตรวจไม่ผ่าน = ไม่ push (ใบเก่ายังอยู่ ดีกว่าใบใหม่ที่ผิด)
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const argDate = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a));
const ROOT = 'C:/Users/PP/Desktop/under360-system';
// ⚠️ ต้องใช้พาธแบบ Windows — Node บน Windows อ่าน '/tmp' เป็น C:\tmp ซึ่งไม่มีอยู่จริง
const WT = 'C:/Users/PP/AppData/Local/Temp/wt-fah';
const log = [];
const say = m => { console.log(m); log.push(m); };
const run = (cmd, cmdArgs, opts = {}) => {
  try { return execFileSync(cmd, cmdArgs, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 24, ...opts }); }
  catch (e) { return (e.stdout || '') + (e.stderr || ''); }
};
const node = (file, extra = []) => run('node', [file, ...extra]);

// ---------- หาวันผลิตถัดไป (Meal Plan = จ/พ/ศ) ----------
const nowTH = new Date(Date.now() + 7 * 3600 * 1000);
let DATE = argDate;
if (!DATE) {
  // ⚠️ nowTH เป็น timestamp ที่บวก 7 ชม.ไว้แล้ว — ห้ามใช้ getDay() กับมัน (จะบวกโซนซ้ำ วันเพี้ยน 1 วัน)
  //    ต้องอ่านวันในสัปดาห์จากสตริงวันที่ด้วย getUTCDay() แทน
  const dow = ds => new Date(ds + 'T00:00:00Z').getUTCDay();   // จ=1 พ=3 ศ=5
  let cur = nowTH.toISOString().slice(0, 10);
  for (let i = 1; i <= 8; i++) {
    const t = new Date(nowTH.getTime() + i * 86400000).toISOString().slice(0, 10);
    if ([1, 3, 5].includes(dow(t))) { cur = t; break; }
  }
  DATE = cur;
}
const stamp = nowTH.toISOString().slice(0, 16).replace('T', ' ');
say(`🤖 ห้องฟ้า — รันอัตโนมัติ ${stamp} (เวลาไทย)${DRY ? '  [ดูอย่างเดียว]' : ''}`);
say(`🎯 วันผลิตเป้าหมาย: ${DATE}`);

// ---------- 1-3 เตรียมข้อมูล ----------
const w = DRY ? [] : ['--write'];
say('\n① จ่ายเมนูรอบที่ยังว่าง');       say(node('scripts/fah_assign_menus.mjs', w).trim().split('\n').slice(-1)[0]);
say('\n② บังคับจำนวนเมนูต่อวัน');        say(node('scripts/fah_enforce_nine.mjs', w).trim().split('\n').slice(-1)[0]);
say('\n③ sync เมนูเข้าหน้าครัว');       say(node('scripts/fah_sync_order_items.mjs', w).trim().split('\n').slice(-1)[0]);

// ---------- 4 ทำใบ ----------
say('\n④ ทำใบงานครัว');
const built = node('scripts/fah_build_sheet.mjs', [DATE]);
say(built.trim().split('\n').filter(Boolean).slice(-3).join('\n'));
if (/ไม่มีรอบส่งเลย/.test(built)) { say('\n⏹️ วันนี้ไม่มีคิว — จบ ไม่ต้องทำใบ'); process.exit(0); }

say(node('scripts/fah_update_kitchen_index.mjs', [DATE]).trim());

// ---------- 5 ตรวจ ----------
say('\n⑤ ด่านตรวจ');
const chk = node('scripts/fah_check_sheet.mjs', [DATE]);
const passed = /ผ่านครบ 7 ข้อ/.test(chk);
say(chk.split('\n').filter(l => /🔴|❌|✅ ผ่าน|เมนูที่ต้องผลิต|ในใบจัดของ/.test(l)).join('\n'));
const syn = node('scripts/check-html-js.js', [`kitchen/${DATE}.html`]) + node('scripts/check-html-js.js', [`kitchen/${DATE}_pack.html`]);
const synOk = (syn.match(/syntax ผ่าน/g) || []).length === 2;
if (!passed || !synOk) {
  say(`\n🔴 ไม่ผ่าน — ไม่ push (ใบเก่ายังอยู่บนเว็บ ปลอดภัยกว่าใบใหม่ที่ผิด)`);
  writeFileSync(`${ROOT}/kitchen/_auto_last_run.txt`, log.join('\n'));
  process.exit(1);
}

// ---------- 6 วัตถุดิบล่วงหน้า ----------
say('\n⑥ วัตถุดิบที่ต้องหาล่วงหน้า');
const ing = node('scripts/fah_check_special_ingredients.mjs', ['10']);
say(ing.split('\n').filter(l => /📅|🥑|🌯|🍠|🧺|✅ ไม่มี/.test(l)).join('\n'));

// ---------- 7 push ----------
node('scripts/fah_build_web_plan.mjs');
if (DRY) { say('\n[ดูอย่างเดียว] ไม่ push'); }
else {
  say('\n⑦ push ขึ้น main');
  run('git', ['fetch', '-q', 'origin'], { cwd: WT });
  run('git', ['reset', '-q', '--hard', 'origin/main'], { cwd: WT });
  for (const f of [`kitchen/${DATE}.html`, `kitchen/${DATE}_pack.html`, 'kitchen/index.html', 'docs/FAH_MENU_PLAN_FOR_WEB.md'])
    if (existsSync(`${ROOT}/${f}`)) copyFileSync(`${ROOT}/${f}`, `${WT}/${f}`);
  run('git', ['add', '-A'], { cwd: WT });
  const msg = `ใบครัว ${DATE} (อัตโนมัติ ${stamp})\n\nCo-Authored-By: Claude Opus 5 <noreply@anthropic.com>`;
  const c = run('git', ['commit', '-q', '-m', msg], { cwd: WT });
  if (/nothing to commit/.test(c)) say('   ไม่มีอะไรเปลี่ยน — ใบเดิมถูกต้องอยู่แล้ว');
  else { run('git', ['push', '-q', 'origin', 'HEAD:main'], { cwd: WT, env: { ...process.env, HOTFIX: '1' } }); say('   ✅ ขึ้น main แล้ว'); }
}

// ---------- 8 สรุป ----------
if (!existsSync(`${ROOT}/kitchen`)) mkdirSync(`${ROOT}/kitchen`);
writeFileSync(`${ROOT}/kitchen/_auto_last_run.txt`, log.join('\n'));
say(`\n✅ จบ — ดูใบได้ที่ 360foodbox.com/k`);

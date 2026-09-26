/**
 * แผนสลับเลข D ให้ไปอยู่ใต้ S ที่ถูก — **ทำแผนอย่างเดียว ไม่แก้ DB**
 *
 * วิธีที่นัทวางไว้เอง (17 ส.ค. 2026):
 *   1. D ตัวไหนที่ "S หัวเดียวกัน" ชื่อไม่เหมือน → ถอนออกมาก่อน
 *   2. หา S ที่ถูกของมัน (ชื่อตรงกัน) แล้วให้เลขนั้น
 *      เช่น D029 มีทบอลอกไก่ → หัวจริงคือ S050 เพนเน่ฯ มีทบอลอกไก่ → ต้องเป็น D050
 *   3. ก่อนเสียบ เช็คว่าเลขปลายทางมีใครจองอยู่ไหม
 *      · ว่าง → เสียบได้
 *      · ไม่ว่าง → ถอนตัวที่จองออกมาด้วย แล้ววนหาที่ให้มันต่อ (ทำเป็นทอด)
 *   4. 🔴 **หาหัวไม่เจอ = ห้ามเดา** → เก็บเข้าตารางให้นัทไกด์เอง
 *
 * รัน: node scripts/niw/sd_replan.mjs
 */
import { writeFileSync } from 'node:fs';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

const SURE = 0.62;   // ต่ำกว่านี้ = ไม่มั่นใจ ห้ามเดา
const MARGIN = 0.10; // ต้องชนะอันดับ 2 อย่างน้อยเท่านี้ ไม่งั้นถือว่าเลือกไม่ขาด

import { NUT } from './sd_decisions.mjs';   // คำตัดสินของนัท — คนเคาะ ชนะเครื่องเสมอ

const core = (s) => String(s || '')
  .replace(/^(ข้าว|ช้าว)/, '').replace(/แบบกับข้าว/g, '')
  .replace(/[+\s\-·]/g, '').toLowerCase();

function sim(a, b) {
  a = core(a); b = core(b);
  if (!a || !b) return 0;
  const short = a.length < b.length ? a : b, long = a.length < b.length ? b : a;
  let hit = 0;
  for (let i = 0; i < short.length - 1; i++) if (long.includes(short.substr(i, 2))) hit++;
  return hit / Math.max(1, short.length - 1);
}

async function all() {
  const out = [];
  for (let f = 0; ; f += 1000) {
    const r = await fetch(SB + '/rest/v1/menu_items?select=code,name,price,is_available,subcode&order=code', { headers: { apikey: KEY, Range: f + '-' + (f + 999) } });
    const d = await r.json(); if (!Array.isArray(d)) throw new Error(JSON.stringify(d).slice(0, 200));
    out.push(...d); if (d.length < 1000) break;
  }
  return out;
}

async function main() {
  const rows = await all();
  const S = rows.filter(x => /^S\d+$/.test(x.code));
  const D = rows.filter(x => /^D\d+$/.test(x.code));
  const sByNum = new Map(S.map(s => [s.code.slice(1), s]));

  // ── ขั้น 1-2: หา "หัวที่ถูก" ของ D ทุกตัว ──
  const plan = [], noHead = [], already = [];
  for (const d of D) {
    const scored = S.map(s => ({ s, sc: sim(d.name, s.name) })).sort((a, b) => b.sc - a.sc);
    const top = scored[0], second = scored[1];
    const confident = top && top.sc >= SURE && (!second || top.sc - second.sc >= MARGIN);
    const curNum = d.code.slice(1);
    const curHead = sByNum.get(curNum);
    const curOK = curHead && sim(d.name, curHead.name) >= 0.55;

    // คำตัดสินของนัทมาก่อนเครื่องเสมอ
    if (Object.prototype.hasOwnProperty.call(NUT, d.code)) {
      const verdict = NUT[d.code];
      if (verdict === null) {                                           // นัทบอก "คนละเมนู"
        noHead.push({ d, curHead, best: null, sc: 0, byNut: true });
        continue;
      }
      const head = S.find(s => s.code === verdict);
      if (head) {
        if (head.code.slice(1) === curNum) { already.push({ d, s: head }); continue; }
        plan.push({ d, from: d.code, to: 'D' + head.code.slice(1), head, sc: 1, byNut: true });
        continue;
      }
    }

    if (curOK) { already.push({ d, s: curHead }); continue; }          // อยู่ถูกที่แล้ว
    if (!confident) {                                                   // 🔴 หาหัวไม่เจอ — ห้ามเดา
      noHead.push({ d, curHead, best: top ? top.s : null, sc: top ? top.sc : 0, runnerUp: second ? second.s : null, sc2: second ? second.sc : 0 });
      continue;
    }
    plan.push({ d, from: d.code, to: 'D' + top.s.code.slice(1), head: top.s, sc: top.sc });
  }

  // ── ขั้น 3: ตรวจการชนกัน ──
  const movingFrom = new Set(plan.map(p => p.from));
  const targetCount = new Map();
  for (const p of plan) targetCount.set(p.to, (targetCount.get(p.to) || 0) + 1);
  const dByCode = new Map(D.map(x => [x.code, x]));

  for (const p of plan) {
    const occupant = dByCode.get(p.to);
    if (targetCount.get(p.to) > 1) p.conflict = 'ชนกันเอง (มี D หลายตัวจะไปเลขนี้)';
    else if (!occupant) p.conflict = null;                                  // ว่าง
    else if (occupant.code === p.from) p.conflict = null;                   // ตัวเอง
    else if (movingFrom.has(occupant.code)) p.conflict = null;              // เจ้าของเดิมย้ายออกอยู่แล้ว = ทอดต่อได้
    else p.conflict = 'ปลายทางมี ' + occupant.code + ' ' + occupant.name + ' จองอยู่ (ตัวนี้ไม่ได้ย้าย)';
  }

  const clean = plan.filter(p => !p.conflict);
  const blocked = plan.filter(p => p.conflict);
  const mk = (x) => x && x.is_available ? '🟢' : '⚪';

  // ── รายงาน ──
  const L = [];
  L.push('# 🔀 แผนสลับเลข D ให้ไปอยู่ใต้ S ที่ถูก');
  L.push('');
  L.push('> ดึงสด ' + new Date().toISOString().slice(0, 10) + ' · **แผนอย่างเดียว ยังไม่ได้แก้อะไรใน DB**');
  L.push('> ทำตามวิธีที่นัทวางเอง · เกณฑ์มั่นใจ: คะแนนชื่อ ≥ ' + SURE + ' และต้องชนะอันดับ 2 อย่างน้อย ' + MARGIN);
  L.push('');
  L.push('| | จำนวน |');
  L.push('|---|---|');
  L.push(`| D ทั้งหมด | ${D.length} |`);
  L.push(`| ✅ อยู่ถูกที่แล้ว | ${already.length} |`);
  L.push(`| 🟩 ย้ายได้เลย (ปลายทางว่าง/เจ้าของเดิมย้ายออก) | ${clean.length} |`);
  L.push(`| 🟨 ติดชน ต้องแก้ก่อน | ${blocked.length} |`);
  L.push(`| 🔴 **หาหัวไม่เจอ — รอนัทไกด์** | ${noHead.length} |`);
  L.push('');

  L.push(`## 🟩 ย้ายได้เลย (${clean.length})`);
  L.push('');
  L.push('| ย้าย | เมนู D | ไปอยู่ใต้ S | ชื่อ S |');
  L.push('|---|---|---|---|');
  clean.sort((a, b) => a.to.localeCompare(b.to)).forEach(p =>
    L.push(`| ${mk(p.d)} \`${p.from}\` → \`${p.to}\` | ${p.d.name} | ${mk(p.head)} ${p.head.code} | ${p.head.name} |`));
  L.push('');

  if (blocked.length) {
    L.push(`## 🟨 ติดชน (${blocked.length})`);
    L.push('');
    L.push('| ย้าย | เมนู D | ติดตรงไหน |');
    L.push('|---|---|---|');
    blocked.forEach(p => L.push(`| ${mk(p.d)} \`${p.from}\` → \`${p.to}\` | ${p.d.name} | ${p.conflict} |`));
    L.push('');
  }

  L.push(`## 🔴 หาหัวไม่เจอ — ไม่เดา รอนัทไกด์ (${noHead.length})`);
  L.push('');
  L.push('| เมนู D | S เลขเดียวกันตอนนี้ (คนละจาน) | ตัวที่ใกล้สุด (ไม่มั่นใจ) |');
  L.push('|---|---|---|');
  noHead.sort((a, b) => (b.d.is_available - a.d.is_available) || a.d.code.localeCompare(b.d.code)).forEach(n =>
    L.push(`| ${mk(n.d)} \`${n.d.code}\` ${n.d.name} | ${n.curHead ? mk(n.curHead) + ' ' + n.curHead.code + ' ' + n.curHead.name : '— ไม่มี S เลขนี้'} | ${n.best ? n.best.code + ' ' + n.best.name + ' (' + Math.round(n.sc * 100) + '%)' : '—'} |`));

  writeFileSync('docs/SD_REPLAN.md', L.join('\n'), 'utf8');

  console.log('เขียนแล้ว: docs/SD_REPLAN.md\n');
  console.log('D ทั้งหมด ' + D.length + ' → อยู่ถูกที่แล้ว ' + already.length + ' · ย้ายได้เลย ' + clean.length + ' · ติดชน ' + blocked.length + ' · 🔴 หาหัวไม่เจอ ' + noHead.length);
  console.log('\n🟩 ย้ายได้เลย:');
  clean.forEach(p => console.log('  ' + mk(p.d) + p.from + ' → ' + p.to + '  ' + String(p.d.name).slice(0, 28).padEnd(30) + '(หัว: ' + p.head.code + ' ' + String(p.head.name).slice(0, 26) + ')'));
  if (blocked.length) { console.log('\n🟨 ติดชน:'); blocked.forEach(p => console.log('  ' + p.from + ' → ' + p.to + '  ' + String(p.d.name).slice(0, 26) + ' — ' + p.conflict)); }
  console.log('\n🔴 หาหัวไม่เจอ ' + noHead.length + ' ตัว (เปิดขาย ' + noHead.filter(n => n.d.is_available).length + ')');
  console.log('เมนู D (ที่ต้องหาหัว)                     | S เลขเดียวกันตอนนี้ (คนละจาน)        | ใกล้สุด (ไม่มั่นใจ)');
  console.log('-'.repeat(112));
  noHead.sort((a, b) => (b.d.is_available - a.d.is_available) || a.d.code.localeCompare(b.d.code)).forEach(n => {
    const c1 = (mk(n.d) + n.d.code + ' ' + n.d.name).slice(0, 40).padEnd(41);
    const c2 = (n.curHead ? mk(n.curHead) + n.curHead.code + ' ' + n.curHead.name : '— ไม่มี S เลขนี้').slice(0, 36).padEnd(37);
    const c3 = n.byNut ? 'นัทเคาะแล้ว: คนละเมนู' : (n.best ? n.best.code + ' ' + n.best.name + ' (' + Math.round(n.sc * 100) + '%)' : '—');
    console.log(c1 + '| ' + c2 + '| ' + c3);
  });
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

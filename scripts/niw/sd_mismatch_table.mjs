/**
 * ตารางคู่ S###/D### ที่ "เลขเดียวกัน แต่คนละจาน" — ทำให้นัทดูอย่างเดียว ไม่แก้อะไร
 * นัทสั่ง 17 ส.ค.: "ขอดูเป็นตารางก่อน แล้วฉันจะค่อยๆ ไกด์ · ไม่อยากให้นายทำเลย"
 *
 * เขียนออกเป็น docs/SD_MISMATCH_TABLE.md (เปิดดูบนมือถือได้)
 * รัน: node scripts/niw/sd_mismatch_table.mjs
 */
import { writeFileSync } from 'node:fs';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

const core = (s) => String(s || '').replace(/^(ข้าว|ช้าว)/, '').replace(/แบบกับข้าว/g, '').replace(/[+\s\-·]/g, '').toLowerCase();
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
  const dByNum = new Map(D.map(d => [d.code.slice(1), d]));

  const pairs = [];
  for (const s of S) {
    const d = dByNum.get(s.code.slice(1));
    if (!d) continue;                                  // ไม่มี D เลขนี้ = คนละปัญหา ไม่เอามาปนตารางนี้
    const sc = sim(s.name, d.name);
    if (sc >= 0.55) continue;                          // ชื่อตรงกันแล้ว
    pairs.push({ num: s.code.slice(1), s, d, sc, live: !!(s.is_available || d.is_available) });
  }
  pairs.sort((a, b) => (b.live - a.live) || a.num.localeCompare(b.num));

  const live = pairs.filter(p => p.live), dead = pairs.filter(p => !p.live);
  const mark = (x) => x.is_available ? '🟢' : '⚪';
  const row = (p) => `| **${p.num}** | ${mark(p.s)} ${p.s.code} ${p.s.name} | ${mark(p.d)} ${p.d.code} ${p.d.name} |`;

  const L = [];
  L.push('# 📋 คู่ S/D ที่ "เลขเดียวกัน แต่คนละจาน"');
  L.push('');
  L.push('> ดึงสดจาก DB ' + new Date().toISOString().slice(0, 10) + ' · **ตารางดูอย่างเดียว ยังไม่ได้แก้อะไร**');
  L.push('> นัทสั่ง: *"ขอดูเป็นตารางก่อน แล้วฉันจะค่อยๆ ไกด์ ไม่อยากให้นายทำเลย"*');
  L.push('');
  L.push('🟢 = เปิดขายอยู่ · ⚪ = ปิดขาย');
  L.push('');
  L.push('| | จำนวน |');
  L.push('|---|---|');
  L.push(`| S ทั้งหมด | ${S.length} |`);
  L.push(`| D ทั้งหมด | ${D.length} |`);
  L.push(`| **คู่ที่เลขตรงกัน แต่คนละจาน** | **${pairs.length}** |`);
  L.push(`| ในนั้น มีฝั่งเปิดขายอยู่ | ${live.length} |`);
  L.push(`| ปิดขายทั้งคู่ | ${dead.length} |`);
  L.push('');
  L.push(`## 🔴 มีฝั่งเปิดขายอยู่ (${live.length}) — กระทบลูกค้าตอนนี้`);
  L.push('');
  L.push('| เลข | ฝั่ง S (ข้าวกล่อง) | ฝั่ง D (กับข้าว) |');
  L.push('|---|---|---|');
  live.forEach(p => L.push(row(p)));
  L.push('');
  L.push(`## ⚪ ปิดขายทั้งคู่ (${dead.length}) — ไม่รีบ`);
  L.push('');
  L.push('| เลข | ฝั่ง S (ข้าวกล่อง) | ฝั่ง D (กับข้าว) |');
  L.push('|---|---|---|');
  dead.forEach(p => L.push(row(p)));
  L.push('');
  L.push('---');
  L.push('*หมายเหตุ: คู่ที่ "ไม่มี D เลขนั้นเลย" ไม่ได้อยู่ในตารางนี้ (คนละปัญหา) — ดู `docs/WORKSHEET_SD_PAIRING.md`*');

  writeFileSync('docs/SD_MISMATCH_TABLE.md', L.join('\n'), 'utf8');
  console.log('เขียนแล้ว: docs/SD_MISMATCH_TABLE.md');
  console.log('คู่ที่เลขตรงแต่คนละจาน = ' + pairs.length + ' (เปิดขาย ' + live.length + ' · ปิด ' + dead.length + ')\n');
  console.log('เลข | ฝั่ง S                              | ฝั่ง D');
  console.log('-'.repeat(92));
  live.forEach(p => console.log(p.num.padEnd(5) + '| ' + (mark(p.s) + p.s.code + ' ' + p.s.name).slice(0, 36).padEnd(37) + '| ' + (mark(p.d) + p.d.code + ' ' + p.d.name).slice(0, 36)));
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// tiang_photo_check.mjs — ตรวจรูปครัวรายวัน (ห้องเตียง) · "ดูก่อน ค่อยเฉลย"
//
// ── ทำไมต้องมีคนตรวจ ──────────────────────────────────────────
// จับคู่ชื่อ↔รูปในดัชนี **ผิด 4 วันจาก 5 วันที่ตรวจจริง**
//   20 ถูก · 23 ชื่อเลื่อนขึ้น · 24 หัวกอง=เมนูก่อนหน้า · 25 เลื่อน+ข้ามวัน · 26 หางกอง=เมนูถัดไป
// ทิศไม่คงที่ → แก้ด้วยตัวแยกกองอัตโนมัติไม่ได้ → ต้องมีคนเปิดรูปดู
//
// ── ทำไมไม่อ่าน KITCHEN_PHOTO_INDEX.md ──────────────────────
// (กะปันชี้ 26 ส.ค. · เลขาเคาะ — สคริปต์ 2 เวอร์ชันแรกพลาดข้อนี้)
// ดัชนีคือ **ผลลัพธ์ของการเดา** ที่พิสูจน์แล้วว่าผิด 4/5 วัน
// เอามาให้คนตรวจอ่าน *ก่อน* ดูรูป = วางสมอความคิดผิดให้คนตรวจ
//   → ตัวนี้อ่าน **สตรีมแชทดิบจาก `kapan-read`** แทน = ของจริงตามลำดับที่เกิด
//   → ได้ 2 อย่างที่ดัชนีให้ไม่ได้:
//       ① ไม่มีใครจับคู่มาก่อน — ไม่มีสมอ
//       ② **เห็นครบ** — ดัชนีเคยเก็บรูปไม่ครบ (25 ส.ค. ดิบมี 18 ดัชนีมี 16)
//   → ดัชนีกลายเป็น "ปลายทาง" เขียนหลัง verify ไม่ใช่ "ต้นทาง"
//
// 🔑 หลักที่ใช้ได้กับทุกงานตรวจ: **คนตรวจต้องไม่เห็นคำตอบก่อนตรวจ**
//
// ── ใช้ ───────────────────────────────────────────────────────
//   node scripts/tiang_photo_check.mjs 2026-08-27            ดูก่อน (ไม่มีชื่อ ไม่มีขอบกอง)
//   node scripts/tiang_photo_check.mjs 2026-08-27 --reveal   เฉลย = สตรีมแชทจริง
//   node scripts/tiang_photo_check.mjs --days                วันไหนมีรูปบ้าง
//   เติม --clean เพื่อโหลดใหม่หมด
//
// ได้: .scratch/tiang/<yyyymmdd>/strip01.png … รูปเรียงตามเวลา 6 ใบ/แผ่น ติดป้าย #NN
//      .scratch/tiang/<yyyymmdd>/manifest.json  #NN → path + เวลา (ใช้ตอนเขียนตารางซ่อม)
//
// 🪤 กับดักที่ฝังกันไว้แล้ว (เสียเวลากับทุกอันมาแล้ว):
//   1. `kapan-read?file=` **คืน JSON ไม่ใช่รูป** — ต้องอ่านคีย์ "ลิงก์" แล้วโหลดต่อ
//      (ได้ไฟล์ ~494 ไบต์ = ยังไม่ได้แลก ไม่ใช่รูปเสีย)
//   2. `curl -o /dev/null` บนวินโดวส์ **คืน exit 23 ทั้งที่สำเร็จ** → ห้ามใช้
//   3. Chrome ต้อง `--headless=old` (=new ได้แถบดำ)
//   4. เซลล์ต้องสูงตายตัว + object-fit:contain ไม่งั้นแถวล่างโดนตัด
//      (เคยดูแผ่นที่ตัดแล้วเกือบสรุปว่ารูปหาย)
//   5. API คืนได้สูงสุด ~200 แถว = ย้อนได้ ~4 วัน · ถ้าจะตรวจย้อนไกลกว่านั้นต้องขอกะปัน
// ═══════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const API   = 'https://under360-system.vercel.app/api/kapan-read?key=kapan-pm-2026';
const GROUP = 'C4b28600aa9f4c7a1a6f9746ae413a0e9';        // กลุ่ม "ห้องสร้างรูป" ที่พี่อูส่งรูปเข้า
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BS = String.fromCharCode(92);
const PER = 6, COLS = 3, CH = 300, CW = 400;

const args   = process.argv.slice(2);
const day    = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a));
const CLEAN  = args.includes('--clean');
const REVEAL = args.includes('--reveal');
const DAYS   = args.includes('--days');
if (!day && !DAYS) {
  console.error('ใช้: node scripts/tiang_photo_check.mjs YYYY-MM-DD [--reveal] [--clean]');
  console.error('     node scripts/tiang_photo_check.mjs --days     (ดูว่ามีวันไหนบ้าง)');
  process.exit(1);
}

// ---------- ดึงสตรีมดิบ ----------
let rows;
try {
  const body = execFileSync('curl', ['-s', API + '&group=' + GROUP + '&limit=1000'], { maxBuffer: 5e7 }).toString();
  rows = JSON.parse(body).rows || [];
} catch (e) { console.error('ดึงสตรีมดิบไม่ได้ — เช็คเน็ต/endpoint'); process.exit(1); }
if (!rows.length) { console.error('สตรีมว่าง'); process.exit(1); }
rows.sort((a, b) => String(a.line_ts || a.created_at).localeCompare(String(b.line_ts || b.created_at)));

// แถวรูปหน้าตา:  [image] image <id> -> line-files/<gid>/<yyyy-mm-dd>/<id>.jpg (NNN ไบต์)
const IMG = /^\[image\]\s+image\s+(\d+)\s+->\s+(line-files\/\S+\/(\d{4}-\d{2}-\d{2})\/\d+\.jpg)/;
const parsed = rows.map(r => {
  const m = IMG.exec(r.text || '');
  return {
    ts: r.line_ts || r.created_at,
    who: r.display_name || '?',
    text: r.text || '',
    isImg: !!m,
    id: m ? m[1] : null,
    file: m ? m[2] : null,
    fday: m ? m[3] : null,                 // วันจากโฟลเดอร์จริง — ไม่ใช่คำนวณโซนเวลาเอง
  };
});

if (DAYS) {
  const tally = {};
  for (const p of parsed) if (p.isImg) tally[p.fday] = (tally[p.fday] || 0) + 1;
  console.log('');
  console.log('📅 วันที่ดึงย้อนได้ตอนนี้ (API คืนสูงสุด ~200 แถว):');
  Object.keys(tally).sort().forEach(d => console.log('   ' + d + '  —  ' + tally[d] + ' รูป'));
  console.log('');
  process.exit(0);
}

const shots = parsed.filter(p => p.isImg && p.fday === day);
if (!shots.length) {
  console.error('ไม่มีรูปของวันที่ ' + day + ' ในสตรีมที่ดึงได้');
  console.error('ลอง: node scripts/tiang_photo_check.mjs --days');
  process.exit(1);
}
shots.forEach((s, i) => { s.n = i + 1; });

// ---------- โหมดเฉลย: โชว์สตรีมจริง ไม่ใช่การเดาของใคร ----------
if (REVEAL) {
  const lo = shots[0].ts, hi = shots[shots.length - 1].ts;
  const win = parsed.filter(p => p.ts >= lo && p.ts <= hi);
  console.log('');
  console.log('🔓 เฉลย — **สตรีมแชทจริง** ของ ' + day + ' (ไม่ใช่ตารางที่ใครจับคู่ไว้)');
  console.log('   ชื่อที่พี่อูพิมพ์ จะโผล่ตรงตำแหน่งเวลาที่พิมพ์จริง — คุณดูเองว่ามันครอบรูปไหน');
  console.log('');
  for (const p of win) {
    const t = String(p.ts).slice(11, 16);
    if (p.isImg) console.log('   ' + t + '   📷 #' + String(p.n).padStart(2, '0'));
    else         console.log('   ' + t + '   💬 [' + p.who + '] ' + p.text.replace(/\s+/g, ' ').slice(0, 70));
  }
  console.log('');
  console.log('⚠️ "ชื่อมาก่อน/หลังรูป" ไม่คงที่ และมีรูปตกค้างส่งตามมาทีหลัง');
  console.log('   → ใช้สตรีมนี้ประกอบ **แต่ยึดสิ่งที่เห็นในรูปเป็นหลัก**');
  process.exit(0);
}

// ---------- โหลดรูป ----------
const dirRel = '.scratch/tiang/' + day.replace(/-/g, '');
const dirAbs = path.resolve(dirRel).split(BS).join('/');
if (CLEAN && fs.existsSync(dirRel)) fs.rmSync(dirRel, { recursive: true, force: true });
fs.mkdirSync(dirRel, { recursive: true });

let ok = 0, bad = 0, cached = 0;
for (const s of shots) {
  const f = dirRel + '/' + String(s.n).padStart(2, '0') + '.jpg';
  if (fs.existsSync(f) && fs.statSync(f).size > 20000) { cached++; ok++; continue; }
  try {
    const url = API + '&file=' + encodeURIComponent(s.file.replace(/^line-files\//, ''));
    const j = JSON.parse(execFileSync('curl', ['-s', url], { maxBuffer: 1e7 }).toString());
    const signed = j['ลิงก์'] || j.link || j.url;
    if (!signed) { bad++; console.log('  ⚠️ ไม่มีลิงก์ใน JSON: #' + s.n); continue; }
    execFileSync('curl', ['-s', '-o', f, signed], { maxBuffer: 1e8 });
    if (fs.statSync(f).size > 20000) ok++;
    else { bad++; console.log('  ⚠️ ไฟล์เล็กผิดปกติ (ยังไม่ได้แลกลิงก์?): #' + s.n + ' ' + fs.statSync(f).size + ' ไบต์'); }
  } catch (e) { bad++; console.log('  ⚠️ โหลดไม่ได้: #' + s.n); }
}
fs.writeFileSync(dirRel + '/manifest.json',
  JSON.stringify(shots.map(s => ({ n: s.n, ts: s.ts, id: s.id, file: s.file })), null, 1), 'utf8');

// ---------- แผ่นรวมเรียงตามเวลา — ไม่มีชื่อ ไม่มีขอบกอง ----------
const sheets = [];
for (let p = 0; p * PER < shots.length; p++) {
  const chunk = shots.slice(p * PER, (p + 1) * PER);
  const cells = chunk.map(function (s) {
    return '<div class=c><img src="file:///' + dirAbs + '/' + String(s.n).padStart(2, '0') + '.jpg">'
         + '<span>#' + String(s.n).padStart(2, '0') + '</span></div>';
  }).join('');
  const html = '<style>body{margin:0;background:#111;font:16px sans-serif}'
    + '.w{display:grid;grid-template-columns:repeat(' + COLS + ',1fr);gap:4px;padding:4px}'
    + '.c{position:relative;height:' + CH + 'px;background:#222}'
    + '.c img{width:100%;height:100%;object-fit:contain}'
    + '.c span{position:absolute;left:0;top:0;background:#000c;color:#0f0;padding:2px 9px;font-weight:700}'
    + '</style><div class=w>' + cells + '</div>';
  const name = 'strip' + String(p + 1).padStart(2, '0');
  fs.writeFileSync(dirAbs + '/' + name + '.html', html, 'utf8');
  execFileSync(CHROME, ['--headless=old', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--window-size=' + (COLS * CW + 12) + ',' + (Math.ceil(chunk.length / COLS) * (CH + 4) + 8),
    '--screenshot=' + dirAbs + '/' + name + '.png', '--virtual-time-budget=8000',
    '--user-data-dir=C:/Users/PP/AppData/Local/Temp/chr_tiangchk',
    'file:///' + dirAbs + '/' + name + '.html'], { stdio: 'pipe' });
  sheets.push({ name: name, from: chunk[0].n, to: chunk[chunk.length - 1].n });
}

// ---------- สรุป — บอกจำนวน ไม่บอกชื่อ ----------
console.log('');
console.log('📅 ' + day + '  ·  ' + shots.length + ' รูป  ·  เรียงตามเวลาจริง #01–#' + shots.length);
console.log('   โหลดสำเร็จ ' + ok + (cached ? ' (มีอยู่แล้ว ' + cached + ')' : '') + (bad ? '   ❌ พลาด ' + bad : ''));
console.log('   แหล่ง: สตรีมแชทดิบ (ไม่ได้อ่านดัชนี — กันสมอ + กันรูปตกหล่น)');
console.log('');
console.log('🙈 ไม่บอกชื่อเมนู ไม่บอกขอบกอง — ตั้งใจ · ดูรูปแล้วขีดเส้นเอง');
console.log('');
for (const s of sheets) {
  console.log('   ' + dirRel + '/' + s.name + '.png   (#' + String(s.from).padStart(2, '0')
            + '–#' + String(s.to).padStart(2, '0') + ')');
}
console.log('');
console.log('📖 จุดที่พลาดบ่อย:');
console.log('   · จานเปลี่ยนกลางแผ่นได้ — อย่ายึดว่า 1 แผ่น = 1 จาน');
console.log('   · #01 อาจเป็นของ "เมื่อวาน" (เจอจริง 25 ส.ค.)');
console.log('   · จานหน้าตาใกล้กัน: แกงจืด vs จับฉ่าย (ฟองเต้าหู้แผ่นยาว = จับฉ่าย)');
console.log('                       แรปแซลมอน vs แรปไก่ (แป้งโฮลวีตน้ำตาล + ไส้ส้ม = แซลมอน)');
console.log('   · จานเดียวถ่าย 2 รอบได้ ไม่ติดกันก็มี (จับฉ่าย 23 ส.ค. = 14 ใบ 2 ช่วง)');
console.log('   · ไม่ชัวร์ = ติดป้าย "ไม่แน่ใจ" ห้ามฝืนเคลม');
console.log('');
console.log('👉 ดูจบแล้วค่อยสั่ง:  node scripts/tiang_photo_check.mjs ' + day + ' --reveal');

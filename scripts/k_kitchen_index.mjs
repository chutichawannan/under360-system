// สร้างหน้ารวมลิงก์ใบงานครัว (kitchen/index.html) จาก "ไฟล์ที่มีอยู่จริงบนดิสก์"
// ทำไมต้องมี: หน้ารวมเดิมแก้มือ → เคยมีลิงก์ 12 ส.ค. ทั้งที่ไฟล์ไม่มี (ครัวกดแล้ว 404)
//             และ 11 ส.ค. ขึ้นป้าย "ผ่านมาแล้ว" ทั้งที่เป็นวันนั้นเอง
// ยึดเวลาไทย (Asia/Bangkok) เสมอ — นัทอยู่ PST ถ้าใช้เวลาเครื่องจะเพี้ยนไป 1 วัน
//
// รัน:  node scripts/k_kitchen_index.mjs          (เขียนไฟล์)
//       node scripts/k_kitchen_index.mjs --check  (ไม่เขียน แค่บอกว่ามีใบไหนขาด — ใช้ตอนตรวจ)

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = 'kitchen';
const FILE = DIR + '/index.html';
const CHECK_ONLY = process.argv.includes('--check');

// ── วันไทยวันนี้ (ไม่ใช่วันของเครื่อง) ──
const todayTH = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const DOW = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const label = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${DOW[dt.getUTCDay()]} ${d} ${MON[m - 1]}`;
};
const diffDays = (iso) => Math.round((Date.UTC(...iso.split('-').map((n, i) => i === 1 ? +n - 1 : +n)) - Date.UTC(...todayTH.split('-').map((n, i) => i === 1 ? +n - 1 : +n))) / 86400000);

// ── กวาดไฟล์จริง ──
const files = readdirSync(DIR).filter((f) => /^\d{4}-\d{2}-\d{2}(_pack)?\.html$/.test(f));
const days = {};
for (const f of files) {
  const iso = f.slice(0, 10);
  days[iso] = days[iso] || { prod: false, pack: false };
  if (f.endsWith('_pack.html')) days[iso].pack = true; else days[iso].prod = true;
}
const isos = Object.keys(days).sort().reverse(); // วันใหม่อยู่บนสุด

// ── รายงานใบที่ขาด (นี่คือหัวใจ: ใบหายต้องฟ้อง ไม่หายเงียบ) ──
const missing = [];
for (const iso of isos) {
  if (!days[iso].prod) missing.push(`${iso} — ขาด 🍳 ใบผลิต`);
  if (!days[iso].pack) missing.push(`${iso} — ขาด 📦 ใบจัดของ (คนแพ็คไม่มีใบว่าลูกค้าคนไหนได้เมนูอะไร)`);
}

console.log(`วันไทยวันนี้ = ${todayTH} · เจอ ${isos.length} วัน (${files.length} ไฟล์)`);
if (missing.length) {
  console.log('\n⚠️  ใบที่ขาด:');
  for (const m of missing) console.log('   · ' + m);
} else {
  console.log('✅ ทุกวันมีครบทั้ง 2 ใบ');
}

if (CHECK_ONLY) { process.exit(missing.length ? 1 : 0); }

// ── ประกอบบล็อกลิงก์ ──
const rows = [];
for (const iso of isos) {
  const dd = diffDays(iso);
  const when = dd === 0 ? ['', 'วันนี้ →'] : dd === 1 ? ['', 'พรุ่งนี้ →'] : dd > 1 ? ['', 'เปิด →'] : [' past', 'ผ่านมาแล้ว'];
  const tag = dd === 0 ? ' 🔴 วันนี้' : '';
  if (days[iso].prod) rows.push(`<a class="day${when[0]}" href="${iso}.html"><span class="d">${label(iso)} — 🍳 ใบผลิต (ครัว)${tag}</span><span class="go">${when[1]}</span></a>`);
  if (days[iso].pack) rows.push(`<a class="day${when[0]}" href="${iso}_pack.html"><span class="d">${label(iso)} — 📦 ใบจัดของ (รายชื่อ)${tag}</span><span class="go">${when[1]}</span></a>`);
  if (!days[iso].pack && dd >= 0) rows.push(`<div class="day past" style="opacity:.75"><span class="d">${label(iso)} — 📦 ใบจัดของ <b style="color:#B91C1C">ยังไม่มี</b></span><span class="go">—</span></div>`);
}

const START = '<div class="sec">■ ใบงานรายวัน</div>';
const END = '<!-- เพิ่มวันใหม่ที่นี่ (บนสุด) -->';
const html = readFileSync(FILE, 'utf8');
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < 0) { console.error('❌ หาหมุดในไฟล์ไม่เจอ — ไม่เขียนทับ'); process.exit(1); }

const block = START + '\n' + rows.join('\n') + '\n' + END;
writeFileSync(FILE, html.slice(0, a) + block + html.slice(b + END.length), 'utf8');
console.log(`\n✅ เขียน ${FILE} ใหม่แล้ว — ${rows.length} บรรทัด (สร้างจากไฟล์จริง ไม่ใช่แก้มือ)`);

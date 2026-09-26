#!/usr/bin/env node
/**
 * sheet_snapshot.mjs — ถ่ายภาพชีทแอดมิน + เทียบกับเมื่อวาน
 *
 * ปัญหาที่แก้: แอดมินแก้ชีทเงียบๆ (เพิ่มลูกค้า / เปลี่ยนวันส่ง / แก้เมนู)
 * ไม่มีใครรู้ → ครัวทำผิด หรือเราสรุปผิด
 *
 * ใช้:
 *   node scripts/fah/sheet_snapshot.mjs <path-to-csv>     # เก็บ snapshot วันนี้ + เทียบเมื่อวาน
 *   node scripts/fah/sheet_snapshot.mjs <csv> --date "7 Aug 2026"   # เทียบเฉพาะวันส่งนั้น
 *
 * CSV มาจาก: Drive download_file_content (exportMimeType text/csv) แล้ว decode base64
 * เก็บที่: finance/../snapshots/sheet_YYYY-MM-DD.json (gitignore)
 */
import fs from 'fs';
import path from 'path';

const SNAP_DIR = path.join(process.cwd(), 'snapshots');
const args = process.argv.slice(2);
const csvPath = args[0];
const dateFilter = args.includes('--date') ? args[args.indexOf('--date') + 1] : null;

if (!csvPath || !fs.existsSync(csvPath)) {
  console.error('ใช้: node scripts/fah/sheet_snapshot.mjs <path-to-csv> [--date "7 Aug 2026"]');
  process.exit(1);
}

// ── อ่าน CSV (รองรับ quoted field + newline ในเซลล์) ──
function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// ── แปลง CSV เป็น record ต่อออเดอร์ (key = วันส่ง|ลูกค้า) ──
function extract(rows) {
  // หาแถวหัวตาราง (มี "Delivery Date")
  const headIdx = rows.findIndex(r => r.some(c => (c || '').includes('Delivery Date')));
  if (headIdx < 0) return { head: [], recs: {} };
  const head = rows[headIdx].map(c => (c || '').trim().replace(/\s+/g, ' '));
  const recs = {};
  for (let i = headIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const date = (r[0] || '').trim();
    const cust = (r[1] || '').trim();
    if (!date || !cust || cust === 'Customer Name') continue;
    if (dateFilter && date !== dateFilter) continue;
    const menus = {};
    for (let j = 8; j < r.length; j++) {
      const v = (r[j] || '').trim();
      if (v && head[j]) menus[head[j]] = v;
    }
    recs[`${date}|${cust}`] = {
      date, cust,
      order: (r[2] || '').trim(),
      course: (r[3] || '').trim(),
      box: (r[4] || '').trim(),
      note: (r[5] || '').trim().replace(/\s+/g, ' '),
      menus
    };
  }
  return { head, recs };
}

// ── เทียบ 2 snapshot ──
function diff(oldR, newR) {
  const added = [], removed = [], changed = [];
  for (const k of Object.keys(newR)) {
    if (!oldR[k]) { added.push(newR[k]); continue; }
    const a = oldR[k], b = newR[k], ch = [];
    for (const f of ['order', 'course', 'box', 'note']) {
      if ((a[f] || '') !== (b[f] || '')) ch.push({ field: f, from: a[f] || '(ว่าง)', to: b[f] || '(ว่าง)' });
    }
    const keys = new Set([...Object.keys(a.menus), ...Object.keys(b.menus)]);
    for (const m of keys) {
      const av = a.menus[m] || '', bv = b.menus[m] || '';
      if (av !== bv) ch.push({ field: 'เมนู: ' + m.slice(0, 40), from: av || '(ไม่ติ๊ก)', to: bv || '(ไม่ติ๊ก)' });
    }
    if (ch.length) changed.push({ key: k, cust: b.cust, date: b.date, changes: ch });
  }
  for (const k of Object.keys(oldR)) if (!newR[k]) removed.push(oldR[k]);
  return { added, removed, changed };
}

// ── main ──
const text = fs.readFileSync(csvPath, 'utf8');
const { recs } = extract(parseCSV(text));
const today = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(SNAP_DIR)) fs.mkdirSync(SNAP_DIR, { recursive: true });
const files = fs.readdirSync(SNAP_DIR).filter(f => /^sheet_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
const prevFile = files.filter(f => f !== `sheet_${today}.json`).pop();

console.log(`📸 snapshot วันนี้ (${today}) — ${Object.keys(recs).length} ออเดอร์${dateFilter ? ` (กรอง: ${dateFilter})` : ''}`);

if (!prevFile) {
  console.log('   (ยังไม่มี snapshot เก่า — วันนี้เป็นครั้งแรก พรุ่งนี้จะเทียบให้)');
} else {
  const prev = JSON.parse(fs.readFileSync(path.join(SNAP_DIR, prevFile), 'utf8'));
  const d = diff(prev.recs, recs);
  const prevDate = prevFile.replace('sheet_', '').replace('.json', '');
  console.log(`\n🔍 เทียบกับ ${prevDate}:`);
  if (!d.added.length && !d.removed.length && !d.changed.length) {
    console.log('   ✅ ไม่มีอะไรเปลี่ยน');
  } else {
    if (d.added.length) {
      console.log(`\n   ➕ เพิ่มใหม่ ${d.added.length} ออเดอร์:`);
      d.added.forEach(r => console.log(`      • [${r.date}] ${r.cust} · ${r.box} กล่อง · ${r.order || '(ไม่มีเลข)'}`));
    }
    if (d.removed.length) {
      console.log(`\n   ➖ หายไป ${d.removed.length} ออเดอร์:`);
      d.removed.forEach(r => console.log(`      • [${r.date}] ${r.cust} · ${r.box} กล่อง`));
    }
    if (d.changed.length) {
      console.log(`\n   ✏️ แก้ไข ${d.changed.length} ออเดอร์:`);
      d.changed.forEach(c => {
        console.log(`      • [${c.date}] ${c.cust}`);
        c.changes.forEach(x => console.log(`          ${x.field}: ${x.from} → ${x.to}`));
      });
    }
  }
}

fs.writeFileSync(path.join(SNAP_DIR, `sheet_${today}.json`), JSON.stringify({ date: today, recs }, null, 1), 'utf8');
console.log(`\n💾 บันทึกแล้ว: snapshots/sheet_${today}.json`);

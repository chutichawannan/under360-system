// ═══════════════════════════════════════════════════════════════════
// 📥 นำประวัติ Meal Plan จากชีทของพลอย เข้าตาราง mp_deliveries
//    (นัทสั่งเอง 15 ส.ค. 2026: "เก็บสิ ส่งประวัติให้ต้องเก็บ สำคัญมากๆ
//     เพราะฉันจะถามเรื่อยๆ ว่าขอลิสต์ท็อป 10 ลูกค้ามีลแพลน")
//
// ทำไมต้องทำ:
//   ชีทของพลอยเก็บสิ่งที่ระบบเราไม่มีเลย = **"กล่องนี้ใส่เมนูอะไร"** ย้อนหลัง 10 เดือน
//   · ชีท        1,656 รอบส่ง · 16 ต.ค. 2025 → 4 ส.ค. 2026 · ลูกค้า 372 คน
//   · ระบบเรา    เริ่มเก็บ 5 ส.ค. 2026 (100 แถว)
//   ถ้าไฟล์ชีทหาย = ประวัติ 10 เดือนหายทั้งก้อน · ตอนนี้พึ่งไฟล์เดียวอยู่
//
// 🔑 จับคู่ด้วย "เลขออเดอร์ Hato" ไม่ใช่ชื่อ:
//   ชื่อ  → จับคู่ได้ 59% (ชีทเขียนชื่อหลายแบบ "โอ๋ (LINE: Oh thanaporn )")
//   เลขใบ → จับคู่ได้ 99%  ← ใช้อันนี้ · ชื่อเป็นทางสำรองเท่านั้น
//
// 🛡️ รันซ้ำได้ไม่ซ้ำข้อมูล: ทุกแถวติดกุญแจ `sheet:<เลขใบ>#<วันที่>` ไว้ใน admin_notes
//    รอบถัดไปเจอกุญแจเดิม = ข้าม
// ⛔ ไม่แตะแถวที่ระบบสร้างเอง (5 ส.ค. เป็นต้นมา) — import เฉพาะ delivery_date < 2026-08-05
//
// วิธีใช้:
//   1) โหลดชีทเป็น CSV ไว้ก่อน แล้วชี้ path ด้วย --csv=...
//   2) node scripts/import_mp_sheet.mjs --csv=mp.csv           → ดูอย่างเดียว ไม่เขียน
//      node scripts/import_mp_sheet.mjs --csv=mp.csv --apply   → เขียนจริง
// ═══════════════════════════════════════════════════════════════════
import fs from 'node:fs';

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B   = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H   = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const APPLY  = process.argv.includes('--apply');
const CSVARG = (process.argv.find(a => a.startsWith('--csv=')) || '').slice(6);
const CUTOFF = '2026-08-05';                 // ระบบเราเริ่มเก็บเองวันนี้
const MARK   = 'sheet:';                     // กุญแจกันซ้ำ

if (!CSVARG || !fs.existsSync(CSVARG)) {
  console.error('❌ ต้องระบุไฟล์ CSV: --csv=path/to/mp.csv');
  process.exit(1);
}

// ── อ่าน CSV แบบรองรับ quote/คอมมาในเซลล์ ──
function parseCSV(t) {
  const rows = []; let f = '', r = [], q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n') { r.push(f); rows.push(r); r = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  return rows;
}

const R = parseCSV(fs.readFileSync(CSVARG, 'utf8'));
const MENU = R[0].slice(8).map(s => s.replace(/\s+/g, ' ').trim());   // 8 คอลัมน์แรกเป็นข้อมูลรอบส่ง
const dataRows = R.slice(1).filter(r => r.length > 50 && ((r[0] || '').trim() || (r[1] || '').trim()));

const toISO = (s) => { s = (s || '').trim(); if (!s) return null; const d = Date.parse(s); return isNaN(d) ? null : new Date(d).toISOString().slice(0, 10); };
const mpTypeOf = (course) => /high\s*protein|(^|[^a-z])hp([^a-z]|$)/i.test(course) ? 'hp'
                        : (/low\s*carb|(^|[^a-z])lc([^a-z]|$)/i.test(course) ? 'lc' : null);
const mpTypeFromMenus = (menus) => {
  let hp = 0, lc = 0;
  for (const m of menus || []) { if (/^HP|^HC/i.test(m.menu)) hp += m.qty; else if (/^LC/i.test(m.menu)) lc += m.qty; }
  return hp === 0 && lc === 0 ? null : (hp >= lc ? 'hp' : 'lc');
};
const roundNo = (s) => { const m = String(s || '').match(/(\d+)/); return m ? parseInt(m[1]) : null; };

// ── แปลงชีทเป็นแถวที่จะเขียน ──
const parsed = [];
let skipNoDate = 0, skipNoName = 0, skipAfterCutoff = 0;
for (const r of dataRows) {
  const date = toISO(r[0]); const name = (r[1] || '').trim();
  if (!date) { skipNoDate++; continue; }
  if (!name) { skipNoName++; continue; }
  if (date >= CUTOFF) { skipAfterCutoff++; continue; }

  const menus = [];
  for (let j = 0; j < MENU.length; j++) {
    const v = (r[8 + j] || '').trim();
    if (v && v !== '0' && !/^[✅❌-]/.test(v)) menus.push({ menu: MENU[j], qty: parseInt(v) || 1 });
  }
  const hato = (String(r[2] || '').match(/HT-\d+/) || [])[0] || null;
  parsed.push({
    date, name, hato,
    course : (r[3] || '').trim(),
    boxes  : parseInt(r[4]) || (menus.reduce((s, m) => s + m.qty, 0) || null),
    note   : (r[5] || '').trim(),
    round  : roundNo(r[6]),
    menus,
    key    : MARK + (hato || ('noorder:' + name)) + '#' + date,
  });
}

// ── โหลดของที่มีอยู่ในระบบ ──
async function all(path) {
  let out = [], off = 0;
  while (true) {
    const j = await (await fetch(`${B}${path}&limit=1000&offset=${off}`, { headers: H })).json();
    if (!Array.isArray(j) || !j.length) break;
    out = out.concat(j); if (j.length < 1000) break; off += 1000;
  }
  return out;
}

const orders = await all('orders?select=id,order_number,customer_id,line_uid,customer_name,delivery_address&order_number=like.HT-*&order=created_at');
const byNo   = new Map(orders.map(o => [String(o.order_number).trim(), o]));

const existing = await all('mp_deliveries?select=id,admin_notes&order=created_at');
const haveKey  = new Set(existing.map(e => String(e.admin_notes || '')).filter(s => s.includes(MARK)).map(s => (s.match(/sheet:[^\s|]+/) || [])[0]));

// ── ประกอบแถวสำหรับเขียน ──
const toInsert = []; let dup = 0, noOrder = 0;
for (const p of parsed) {
  if (haveKey.has(p.key)) { dup++; continue; }
  const o = p.hato ? byNo.get(p.hato) : null;
  if (!o) noOrder++;
  toInsert.push({
    order_id      : o ? o.id : null,
    customer_id   : o ? o.customer_id : null,
    line_uid      : o ? o.line_uid : null,
    customer_name : p.name,
    // คอลัมน์นี้ห้ามว่าง (NOT NULL) · บางแถวในชีทเขียนคอร์สไม่ชัด
    // → เดาจากรหัสเมนูที่ลูกค้าได้รับแทน (HPxx / LCxx) · ไม่ได้จริงๆ ค่อยใส่ 'other'
    mp_type       : mpTypeOf(p.course) || mpTypeFromMenus(p.menus) || 'other',
    mp_set        : p.course || "(ชีทไม่ได้ระบุคอร์ส)",   // NOT NULL — ชีทบางแถวเว้นว่าง
    round_no      : p.round || 1,
    // ⚠️ ชีทบอกแค่ "รอบที่เท่าไหร่" ไม่ได้บอกว่าคอร์สนั้นมีทั้งหมดกี่รอบ
    //    แต่คอลัมน์นี้ห้ามว่าง (NOT NULL) → ใส่เท่ากับรอบปัจจุบันไว้ก่อน
    //    ⛔ อย่าเอา total_rounds ของแถวที่นำเข้ามาไปคำนวณอะไร มันไม่ใช่ของจริง
    total_rounds  : p.round || 1,
    delivery_date : p.date,
    delivery_address: o ? o.delivery_address : null,
    box_count     : p.boxes,
    status        : 'delivered',              // เป็นประวัติ = ส่งไปแล้วทั้งหมด
    menu_items    : p.menus.length ? p.menus : null,
    customer_note : p.note || null,
    admin_notes   : p.key + ' | นำเข้าจากชีท Meal Plan ของพลอย (15 ส.ค. 2026)',
  });
}

const withMenu = toInsert.filter(x => x.menu_items).length;
console.log('\n═══ สรุปก่อนเขียน ═══');
console.log('แถวในชีททั้งหมด        ' + dataRows.length);
console.log('  ข้าม: ไม่มีวันที่ ' + skipNoDate + ' · ไม่มีชื่อ ' + skipNoName + ' · เป็นของหลัง ' + CUTOFF + ' ' + skipAfterCutoff);
console.log('พร้อมนำเข้า            ' + parsed.length);
console.log('  มีอยู่แล้ว (ข้าม)    ' + dup);
console.log('  จะเขียนใหม่          ' + toInsert.length);
console.log('    · ผูกกับใบ Hato ได้  ' + (toInsert.length - noOrder) + '  (' + Math.round((toInsert.length - noOrder) / (toInsert.length || 1) * 100) + '%)');
console.log('    · ไม่มีใบให้ผูก      ' + noOrder + '  (เก็บชื่อไว้ ยังค้นได้)');
console.log('    · มีรายเมนูจริง      ' + withMenu + '  ← ของที่ระบบเราไม่เคยมี');
if (toInsert[0]) console.log('\nตัวอย่างแถวแรก:\n' + JSON.stringify(toInsert[0]).slice(0, 320));

if (!APPLY) { console.log('\n(ยังไม่เขียนอะไร — เติม --apply ถ้าจะลงจริง)'); process.exit(0); }

// ── เขียนจริง ทีละก้อน 200 แถว ──
let ok = 0, fail = 0;
for (let i = 0; i < toInsert.length; i += 200) {
  const chunk = toInsert.slice(i, i + 200);
  const r = await fetch(B + 'mp_deliveries', { method: 'POST', headers: H, body: JSON.stringify(chunk) });
  if (r.ok) { ok += chunk.length; process.stdout.write('.'); }
  else { fail += chunk.length; console.log('\n❌ ก้อน ' + i + ' → ' + r.status + ' ' + (await r.text()).slice(0, 200)); }
}
console.log('\n\n✅ เขียนสำเร็จ ' + ok + ' แถว · ล้มเหลว ' + fail);
const after = await all('mp_deliveries?select=id&order=created_at');
console.log('ตอนนี้ mp_deliveries มีทั้งหมด ' + after.length + ' แถว');

/**
 * Under360 — Data Backup (นัทสั่ง 3 ส.ค. 2026)
 * ปรัชญา: "ดาต้าลูกค้าสำคัญกว่าระบบ — ถ้าข้อมูลอยู่ ต่อให้ระบบพังก็ถอยไปจดมือได้"
 *
 * ดัมพ์ตารางสำคัญทั้งหมดเป็น JSON (paginate ข้ามเพดาน 1000 แถวของ PostgREST)
 * ไม่พึ่ง Supabase paid backup · รันมือ หรือตั้ง scheduled task รายสัปดาห์
 *
 * ใช้:  node scripts/backup_data.mjs [outdir]
 *   default outdir = ../under360_backups/YYYY-MM-DD  (นอก repo · ไม่เข้า git)
 */
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

// ตารางสำคัญ เรียงตามความสำคัญ (ลูกค้า+ออเดอร์ = crown jewel)
const TABLES = [
  'customers', 'orders', 'order_items', 'mp_deliveries',
  'menu_items', 'packages', 'package_items', 'mp_offer_sets',
  'promo_codes', 'home_layout', 'daily_menu_assignments',
  // ── เติม 25 ส.ค. 2026 (PM สั่งหลังนัทเคาะ "ใครเสนออะไรแบ็คอัพมาฉันเอาหมด") ──
  // 🔴 kitchen_data สำคัญที่สุดในกลุ่มที่ขาด — เก็บสูตรอาหาร/แผนผลิต/ค่าตั้งของครัว
  //    สูตรอาหารคือฐานของทั้งระบบ (เมนู→วัตถุดิบ→สั่งของ→ต้นทุน) และไม่เคยมี backup เลย
  'kitchen_data',
  'customer_preferences',   // ของแพ้/ไม่กิน — หายแล้วเสี่ยงส่งของแพ้ให้ลูกค้า
  'blog_posts',             // บทความ 61 ชิ้น = SEO 10 ปี
  'activity_log',           // ใครแก้อะไรเมื่อไหร่ — ใช้สืบตอนของเพี้ยน
  'work_claims',            // ใครจองงานอะไรไว้
  'session_messages',       // บอร์ดคุยงานข้ามห้อง
];

async function fetchAll(table) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${SB}/${table}?select=*&limit=1000&offset=${offset}`, { headers: H });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error(`${table}: ${JSON.stringify(rows).slice(0,120)}`);
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

const date = new Date().toISOString().slice(0, 10);
const outdir = process.argv[2] || `../under360_backups/${date}`;
fs.mkdirSync(outdir, { recursive: true });

console.log(`📦 Backup → ${outdir}`);
const manifest = { date, generated_at: new Date().toISOString(), tables: {} };
let totalRows = 0, fail = 0;
for (const t of TABLES) {
  try {
    const rows = await fetchAll(t);
    fs.writeFileSync(`${outdir}/${t}.json`, JSON.stringify(rows));
    manifest.tables[t] = rows.length;
    totalRows += rows.length;
    console.log(`  ✓ ${t.padEnd(22)} ${rows.length} แถว`);
  } catch (e) {
    manifest.tables[t] = 'ERROR: ' + e.message;
    fail++;
    console.log(`  ✗ ${t.padEnd(22)} ${e.message}`);
  }
}

/* ── สำรองไฟล์ที่ไม่ได้อยู่ใน git (เติม 25 ส.ค. 2026) ────────────────────────
   ของพวกนี้ gitignore ไว้เพราะมี PII/ข้อมูลอ่อนไหว → **ไม่มีสำเนาที่อื่นเลย**
   เครื่องพัง = หายเกลี้ยง (web/eath = องค์ความรู้เอิธ · HISTORY = ประวัติโปรเจค)
   🔒 zip อยู่ในเครื่องเท่านั้น — โฟลเดอร์ backup อยู่นอก repo ไม่เข้า git อยู่แล้ว */
// อ้างจากรากโปรเจคเสมอ ไม่ใช่จากที่ที่รันคำสั่ง — cron/worktree รันจากคนละที่ได้
const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..') + path.sep;
const FILES = ['web/eath', 'docs/UNDER360_HISTORY.md', 'docs/UNDER360_MASTERNOTE_v6_7.md', 'finance', 'kitchen', 'docs/gpt'].map(f => ROOT + f);
const present = FILES.filter(f => fs.existsSync(f));
manifest.files = {};
if (present.length) {
  const { execFileSync } = await import('node:child_process');
  const zip = outdir + '/files.zip';
  try {
    execFileSync('powershell', ['-NoProfile', '-Command',
      "Compress-Archive -Path " + present.map(f => "'" + f + "'").join(',') + " -DestinationPath '" + zip + "' -Force"],
      { stdio: 'pipe' });
    const mb = (fs.statSync(zip).size / 1048576).toFixed(1);
    manifest.files = { zip: 'files.zip', size_mb: Number(mb), items: present.map(f => f.replace(ROOT, '')) };
    console.log('  ✓ ไฟล์นอก git ' + present.length + ' รายการ → files.zip (' + mb + ' MB)');
  } catch (e) {
    manifest.files = { error: String(e.message).slice(0, 200) };
    console.log('  ✗ zip ไม่สำเร็จ: ' + String(e.message).slice(0, 120));
  }
}

/* ── ลบ backup เก่าเกิน N วัน (เติม 25 ส.ค. 2026) ──────────────────────────
   56 MB/วัน · ไม่ลบเลยจะโตไปเรื่อยๆ (ตอนนี้ 1.3 GB)
   🛡️ กันลบผิด 3 ชั้น:
     ① ชื่อโฟลเดอร์ต้องเป็น YYYY-MM-DD เป๊ะ → ตัวที่ตั้งชื่อพิเศษ เช่น "2026-08-05_pre-cutover" ไม่โดนแตะ
     ② ต้องมี _manifest.json ข้างใน = ยืนยันว่าเป็นของสคริปต์นี้
     ③ ต้องเก่ากว่า KEEP_DAYS จริง */
const KEEP_DAYS = 30;
try {
  const root = outdir.replace(/[\/][^\/]+$/, '');
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000).toISOString().slice(0, 10);
  const removed = [];
  for (const name of fs.readdirSync(root)) {
    if (!/^d{4}-d{2}-d{2}$/.test(name)) continue;
    if (name >= cutoff) continue;
    const dir = root + '/' + name;
    if (!fs.existsSync(dir + '/_manifest.json')) continue;
    fs.rmSync(dir, { recursive: true, force: true });
    removed.push(name);
  }
  manifest.pruned = { keep_days: KEEP_DAYS, removed };
  console.log(removed.length ? '  🗑️ ลบเก่ากว่า ' + KEEP_DAYS + ' วัน: ' + removed.join(', ') : '  · ไม่มีของเก่ากว่า ' + KEEP_DAYS + ' วันให้ลบ');
} catch (e) { console.log('  ✗ ลบของเก่าไม่สำเร็จ: ' + e.message); }

fs.writeFileSync(`${outdir}/_manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`\n✅ เสร็จ · ${TABLES.length - fail}/${TABLES.length} ตาราง · รวม ${totalRows.toLocaleString()} แถว` + (fail ? ` · ⚠️ พลาด ${fail}` : ''));

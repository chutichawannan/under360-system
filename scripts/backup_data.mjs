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

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

// ตารางสำคัญ เรียงตามความสำคัญ (ลูกค้า+ออเดอร์ = crown jewel)
const TABLES = [
  'customers', 'orders', 'order_items', 'mp_deliveries',
  'menu_items', 'packages', 'package_items', 'mp_offer_sets',
  'promo_codes', 'home_layout', 'daily_menu_assignments',
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
fs.writeFileSync(`${outdir}/_manifest.json`, JSON.stringify(manifest, null, 2));
console.log(`\n✅ เสร็จ · ${TABLES.length - fail}/${TABLES.length} ตาราง · รวม ${totalRows.toLocaleString()} แถว` + (fail ? ` · ⚠️ พลาด ${fail}` : ''));

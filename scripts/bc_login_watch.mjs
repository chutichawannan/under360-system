/* ตัวเฝ้าล็อกอิน LINE OA — Windows ตั้งเวลาเรียกทุกเช้า (นัทอนุญาต 15 ก.ย. 2569)
 *
 *   node scripts/bc_login_watch.mjs          โพสต์ใบเตือนลงบอร์ดห้อง 05 + เขียนหัวใจ
 *   node scripts/bc_login_watch.mjs --dry    ดูข้อความเฉยๆ
 *   node scripts/bc_login_watch.mjs --check  รอบล่าสุดรันจริงไหม (exit 1 ถ้าเกิน 2 วัน)
 *
 * 🔴 ข้อจำกัดที่ต้องพูดตรงๆ — ตัวนี้ "เช็คเองไม่ได้"
 *   หน้า LINE OA เปิดได้เฉพาะผ่าน Chrome ที่นัทล็อกอินไว้ (ส่วนขยาย Claude) · สคริปต์ล้วนเข้าไม่ถึงคุกกี้นั้น
 *   และห้ามให้สคริปต์กรอกรหัสผ่านแทนคนเด็ดขาด (นัทเคาะผ่าน pm 11 ก.ย.)
 *   -> ตัวนี้จึงเป็น "ตัวปลุก" ไม่ใช่ "ตัวเช็ค": โพสต์บอร์ด -> poller ปลุกห้อง 05 -> ห้อง 05 เปิดหน้าจริงดูด้วยตา แล้วบอกนัท
 *   เจอหน้าเข้าสู่ระบบ = **สงสัยว่าต่อผิดเครื่องก่อน** (Claude pc deviceId 4a2c501e… เท่านั้น) ไม่ใช่รีบบอกว่าหลุด
 *
 * ทำไมต้องมี: 24 ก.ค.–9 ก.ย. เจอหน้าเข้าสู่ระบบ 15 วัน · ทุกครั้งไปรู้ตอนจะยิงแล้วงานค้างทั้งวัน
 * ⚠️ exit code: ห้ามใช้ process.exit() (Windows คืน 127)
 */
import fs from 'fs';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = (fs.readFileSync('CLAUDE.md', 'utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/) || [])[0];
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const HB = 'line_login_watch_last';

async function main() {
  const dry = process.argv.includes('--dry');

  if (process.argv.includes('--check')) {
    const r = await fetch(SB + `/rest/v1/kitchen_data?select=data&key=eq.${HB}`, { headers: H });
    const j = await r.json().catch(() => []);
    const at = j[0] && j[0].data && j[0].data.at;
    if (!at) { console.log('🔴 ตัวเฝ้าล็อกอินไม่เคยรันเลย'); return 1; }
    const days = (Date.now() - new Date(at).getTime()) / 864e5;
    console.log((days <= 2 ? '✅' : '🔴') + ` รันล่าสุด ${at} (${days.toFixed(1)} วันก่อน)`);
    return days <= 2 ? 0 : 1;
  }

  const text = [
    '🔑 [ตัวเฝ้าล็อกอิน → 05] เช็ค LINE OA วันนี้ยังเข้าได้ไหม',
    '',
    'ขั้นตอน (ห้าม 05 ข้าม):',
    '1. `list_connected_browsers` → `select_browser` **4a2c501e-e3a5-4c18-a364-ea6f4cff7b40** (Claude pc) — ตัวอื่นไม่ได้ล็อกอิน',
    '2. เปิด `manager.line.biz/account/@rwc2010a/insight/message` แล้วอ่านหน้า',
    '3. เข้าได้ = เงียบ ไม่ต้องบอกนัท · **เด้งหน้าเข้าสู่ระบบ = บอกนัทวันนี้เลย** (นัทกดเองแค่คลิกเดียว Chrome จำรหัสไว้)',
    '⛔ ห้ามกดเข้าสู่ระบบ/กรอกรหัสแทนนัท ต่อให้ Chrome เติมให้แล้วก็ตาม',
    '',
    'เป้า: หลุดวันจันทร์ นัทรู้วันจันทร์ — ไม่ใช่มารู้ตอนจะยิงแล้วงานค้างทั้งเสาร์-จันทร์ (เกิดมาแล้ว 3 รอบ)',
  ].join('\n');

  if (dry) { console.log(text); return 0; }

  const post = await fetch(SB + '/rest/v1/session_messages', {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ room: '05', sender: 'ตัวเฝ้าล็อกอิน', role: 'assistant', text }),
  });
  const hb = await fetch(SB + '/rest/v1/kitchen_data', {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ key: HB, data: { at: new Date().toISOString(), posted: post.status } }),
  });
  console.log(`โพสต์บอร์ด: ${post.status} · บันทึกหัวใจ: ${hb.status}`);
  return post.ok && hb.ok ? 0 : 1;
}

main().then(code => { process.exitCode = code; })
  .catch(e => { console.error('🔴 ตัวเฝ้าล็อกอินพัง:', e && e.message || e); process.exitCode = 2; });

/* ตัวรันด่านตรวจเมนูวันพุธ — Windows ตั้งเวลาเรียกทุกพุธ (นัทอนุญาต 15 ก.ย. 2569)
 *
 *   node scripts/bc_wed_gate.mjs           รันจริง: ตรวจชุดเมนูจันทร์ถัดไป + บันทึกผล + โพสต์บอร์ดห้อง 05
 *   node scripts/bc_wed_gate.mjs --dry     ดูผลเฉยๆ ไม่บันทึก ไม่โพสต์
 *   node scripts/bc_wed_gate.mjs --check   ตัวเช็คว่ารอบล่าสุดรันจริงไหม (exit 1 ถ้าเกิน 8 วัน)
 *
 * ทำไมต้องมี — วงจรเมนูใหม่ที่นัทเคาะ 11 ก.ย.: พุธ = ด่านตรวจ · ศุกร์ 18:00 = U เปิดขายอัตโนมัติ
 *   ถ้าไม่มีตัวนี้ ด่านพุธต้องรอคนนึกได้เอง — 3 รอบที่ผ่านมา 05 ไม่เคยรายงานก่อนนัทถามเลยสักรอบ
 *   ตัวตั้งเวลาของ Claude เคยรันแล้วเงียบ (13:02 ศุกร์ 11 ก.ย. ไม่มีผลลัพธ์) จึงใช้ Windows ตั้งเวลา + สคริปต์ล้วน
 *
 * ทำอะไร:
 *   1. หาวันจันทร์ถัดไป (เวลาไทย)
 *   2. รัน scripts/check_weekly_menu.mjs <จันทร์> → เขียนผลลง kitchen_data.weekly_gate ให้ U อ่านตอนศุกร์
 *   3. โพสต์สรุปลงบอร์ดห้อง 05 → poller ปลุกห้อง 05 มาทำต่อ (ดูรูป · โบรชัวร์ · ทวงเมนูถ้าตก)
 *   4. เขียนหัวใจ kitchen_data.wed_gate_last = พิสูจน์ได้ว่ารันจริง ไม่ต้องเชื่อคำบอกเล่า
 *
 * ⚠️ exit code: ห้ามใช้ process.exit() — Windows แครช UV_HANDLE_CLOSING คืน 127 (เจอจริง 11 ก.ย.)
 */
import fs from 'fs';
import { execFileSync } from 'child_process';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = (fs.readFileSync('CLAUDE.md', 'utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/) || [])[0];
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const HB = 'wed_gate_last';

async function getJSON(path) {
  const r = await fetch(SB + '/rest/v1/' + path, { headers: H });
  const j = await r.json().catch(() => null);
  return Array.isArray(j) ? j : [];
}

async function main() {
  const dry = process.argv.includes('--dry');

  if (process.argv.includes('--check')) {
    const row = (await getJSON(`kitchen_data?select=data&key=eq.${HB}`))[0];
    const at = row && row.data && row.data.at;
    if (!at) { console.log('🔴 ด่านพุธไม่เคยรันเลยสักครั้ง'); return 1; }
    const days = (Date.now() - new Date(at).getTime()) / 864e5;
    const ok = days <= 8;
    console.log((ok ? '✅' : '🔴') + ` รันล่าสุด ${at} (${days.toFixed(1)} วันก่อน) · ผล: ${row.data.summary || '-'}`);
    return ok ? 0 : 1;
  }

  // วันจันทร์ถัดไปตามเวลาไทย
  const nowTH = new Date(Date.now() + 7 * 3600e3);
  const add = ((8 - nowTH.getUTCDay()) % 7) || 7;
  const monday = new Date(Date.UTC(nowTH.getUTCFullYear(), nowTH.getUTCMonth(), nowTH.getUTCDate() + add)).toISOString().slice(0, 10);

  let out = '', pass = false;
  try {
    out = execFileSync(process.execPath, ['scripts/check_weekly_menu.mjs', monday, ...(dry ? ['--no-save'] : [])], { encoding: 'utf8' });
    pass = true;
  } catch (e) {
    out = (e.stdout || '') + (e.stderr || '');
    pass = false; // ด่านตก หรือสคริปต์พัง = ไม่ผ่านทั้งคู่ (fail-closed)
  }
  console.log(out);

  const fails = (out.match(/🔴/g) || []).length;
  const warns = (out.match(/⚠️/g) || []).length;
  const summary = pass ? `ผ่านด่านเครื่อง · ธง ${warns}` : `ไม่ผ่าน · ตก ${fails} จุด`;

  const text = [
    `🧪 [ด่านตรวจพุธ → 05] ชุดเมนูเริ่มส่งจันทร์ ${monday} · ${pass ? '✅ ผ่านด่านเครื่อง' : '🔴 ไม่ผ่าน'}`,
    '',
    '```',
    out.split('\n').slice(-22).join('\n').trim(),
    '```',
    '',
    pass
      ? '**เหลือขั้นคน:** เปิดดูรูปทุกตัวด้วยตา → `node scripts/check_weekly_menu.mjs ' + monday + ' --visual-ok "ชื่อคนดู"` → ทำโบรชัวร์ → ส่งนัทดูก่อนยิง'
      : '**ตกด่าน = ห้ามเปิดขาย** ทวงเมนูใหม่จากห้องนิวทันที ห้ามผ่อนกฎให้ทันเวลา · แจ้งนัทว่าติดอะไร ใครถือ',
    'ศุกร์ 18:00 ตัวเปิดขายของ U จะอ่านผลนี้ — ไม่ผ่าน หรือยังไม่มีคนดูรูป = ไม่เปิดขาย',
  ].join('\n');

  if (dry) { console.log('\n(--dry ไม่โพสต์ ไม่บันทึก)\n' + text.slice(0, 300)); return pass ? 0 : 1; }

  const post = await fetch(SB + '/rest/v1/session_messages', {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ room: '05', sender: 'ด่านตรวจพุธ', role: 'assistant', text }),
  });
  const hb = await fetch(SB + '/rest/v1/kitchen_data', {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ key: HB, data: { at: new Date().toISOString(), monday, pass, summary, posted: post.status } }),
  });
  console.log(`\nโพสต์บอร์ด: ${post.status} · บันทึกหัวใจ: ${hb.status}`);
  return post.ok && hb.ok ? (pass ? 0 : 1) : 2;
}

main().then(code => { process.exitCode = code; })
  .catch(e => { console.error('🔴 ด่านพุธพัง:', e && e.message || e); process.exitCode = 2; });

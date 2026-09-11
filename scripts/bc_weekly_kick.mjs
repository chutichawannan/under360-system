/* ตัวจุดชนวนงานประจำสัปดาห์ของห้อง 05 — สคริปต์ล้วน ไม่พึ่งตัวตั้งเวลาของ Claude (11 ก.ย. 2569)
 *
 *   node scripts/bc_weekly_kick.mjs            รันจริง: เช็คของ + โพสต์บอร์ดห้อง 05 + บันทึกหัวใจ
 *   node scripts/bc_weekly_kick.mjs --dry      ดูผลเฉยๆ ไม่โพสต์ ไม่บันทึก
 *   node scripts/bc_weekly_kick.mjs --check    ตัวเช็คว่า "รอบล่าสุดรันจริงไหม" (exit 1 ถ้าเกิน 8 วัน)
 *
 * ทำไมต้องมี — เจอจริง 11 ก.ย.:
 *   ตัวตั้งเวลาของ Claude (weekly-broadcast-autopilot) รัน 13:02 แต่ออกผลเป็นศูนย์ ไม่มีใครรู้
 *   docs/POLLER.md: ตัวตั้งเวลาของ Claude ตาย 34/36 · ที่ไม่เคยพลาด = poller + Windows ตั้งเวลา (สคริปต์ล้วน)
 *   -> สคริปต์นี้ให้ Windows ตั้งเวลาเรียกทุกศุกร์ · โพสต์ลงบอร์ด room=05 · poller ของห้อง 05 ปลุกสมองให้ลงมือ
 *   -> และเขียนหัวใจลง kitchen_data.weekly_kick_last ทุกครั้ง = พิสูจน์ได้ว่ารันจริง ไม่ต้องเชื่อคำบอกเล่า
 *
 * ⚠️ ข้อจำกัดที่ต้องรู้: poller อยู่ในห้อง 05 ที่เปิดค้าง · ห้องปิด = ข้อความยังรออยู่บนบอร์ด แต่ไม่มีใครตื่นมาทำ
 *
 * ⚠️ exit code: ห้ามใช้ process.exit() ตรงๆ — บน Windows ถ้ายังมีการเชื่อมต่อ fetch ปิดไม่เสร็จ
 *    Node จะแครช "Assertion failed: UV_HANDLE_CLOSING" แล้วคืน 127 แทนเลขที่ตั้งใจ (เจอจริง 11 ก.ย.)
 *    ตัวตั้งเวลาอ่าน exit code ผิด = รายงานว่าพังทั้งที่ทำงานสำเร็จ · เลยตั้ง process.exitCode แล้วปล่อยให้จบเอง
 */
import fs from 'fs';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = (fs.readFileSync('CLAUDE.md', 'utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/) || [])[0];
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const HB = 'weekly_kick_last';

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
    if (!at) { console.log('🔴 ตัวจุดชนวนไม่เคยรันเลยสักครั้ง'); return 1; }
    const days = (Date.now() - new Date(at).getTime()) / 864e5;
    const ok = days <= 8;
    console.log((ok ? '✅' : '🔴') + ` รันล่าสุด ${at} (${days.toFixed(1)} วันก่อน) · ผล: ${row.data.summary || '-'}`);
    return ok ? 0 : 1;
  }

  // วันจันทร์ถัดไปตามเวลาไทย
  const nowTH = new Date(Date.now() + 7 * 3600e3);
  const add = ((8 - nowTH.getUTCDay()) % 7) || 7;
  const monday = new Date(Date.UTC(nowTH.getUTCFullYear(), nowTH.getUTCMonth(), nowTH.getUTCDate() + add)).toISOString().slice(0, 10);

  const menus = await getJSON(`menu_items?select=code,subcode,is_available&available_from=eq.${monday}&limit=100`);
  const S = menus.filter(m => /^S/i.test(m.code)).length;
  const D = menus.filter(m => /^D/i.test(m.code)).length;
  const withSub = menus.filter(m => m.subcode).length;
  const open = menus.filter(m => m.is_available).length;
  const hist = (await getJSON(`kitchen_data?select=data&key=eq.weekly_slot_history`))[0];
  const hasSlotPlan = !!(hist && hist.data && hist.data[monday]);

  const text = [
    `⏰ [ตัวจุดชนวนศุกร์ → 05] ถึงเวลางานประจำสัปดาห์ · เมนูเริ่มส่งจันทร์ ${monday}`,
    '',
    '```',
    `เมนูใน DB (available_from = ${monday})   S ${S} ตัว · D ${D} ตัว   ${S === 8 && D === 5 ? '✅' : '🔴 ยังไม่ครบ 8+5'}`,
    `ติดชื่อเล่น S1-S8/D1-D5 แล้ว              ${withSub} ตัว`,
    `บันทึกลำดับช่องลงประวัติแล้ว               ${hasSlotPlan ? '✅' : '🔴 ยังไม่มี'}`,
    `เปิดขายแล้ว (is_available)                 ${open} ตัว  (นัทเป็นคนเคาะ)`,
    '```',
    '',
    'ห้อง 05 เดินเช็คลิสต์ §9 ของคัมภีร์ต่อ: ทวงเมนู (ถ้ายังไม่ครบ) · ด่านตรวจ · โบรชัวร์ + เปิดดูด้วยตา · ยอดสต็อค · ดราฟ',
    '**รายงานนัทก่อนนัทถาม** — ถ้าติดอะไร บอกว่าติดอะไร ใครถือ',
  ].join('\n');
  const summary = `S${S}/D${D} · ชื่อเล่น ${withSub} · ช่อง ${hasSlotPlan ? 'มี' : 'ไม่มี'} · เปิดขาย ${open}`;

  console.log(text);
  if (dry) { console.log('\n(--dry ไม่โพสต์ ไม่บันทึก)'); return 0; }

  const post = await fetch(SB + '/rest/v1/session_messages', {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
    body: JSON.stringify({ room: '05', sender: 'ตัวจุดชนวนศุกร์', role: 'assistant', text }),
  });
  const hb = await fetch(SB + '/rest/v1/kitchen_data', {
    method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ key: HB, data: { at: new Date().toISOString(), monday, summary, posted: post.status } }),
  });
  console.log(`\nโพสต์บอร์ด: ${post.status} · บันทึกหัวใจ: ${hb.status}`);
  return post.ok && hb.ok ? 0 : 1;
}

main().then(code => { process.exitCode = code; })
      .catch(e => { console.error('🔴 ตัวจุดชนวนพัง:', e && e.message || e); process.exitCode = 2; });

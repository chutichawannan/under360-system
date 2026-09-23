/* 🔒 จองไฟล์ก่อนแก้ — กันสองห้องแก้ไฟล์เดียวกันแล้วทับกันเงียบ ๆ
   นัทสั่งเอง 23 ก.ย. 2569: "ทุกครั้งที่จะจับงานไหน รีเช็คก่อนหลายขั้นตอนทุกครั้ง
                              เพื่อที่จะได้ไม่เผลอ develop แยกกันแล้วเผลอทับกัน"

   ทำไมต้องมี: repo เดียว มีหลายห้อง (คน + AI) ทำงานพร้อมกัน · การทับกันไม่ส่งเสียงเตือน
   ของหาย = รู้ตัวตอนลูกค้าหรือครัวเจอของพังแล้ว

   ใช้ 3 คำสั่งพอ:
     node scripts/claim.mjs check <ไฟล์...>              ← ก่อนเริ่มทุกครั้ง
     node scripts/claim.mjs take <ห้อง> "<งาน>" <ไฟล์...>  ← จองไว้ระหว่างทำ
     node scripts/claim.mjs done <ห้อง> <ไฟล์...>          ← ทำเสร็จแล้วปล่อย

   check บอก 4 อย่าง: ใครจองอยู่ · ใครแก้ล่าสุด · ของในเครื่องเก่ากว่า main ไหม · ไฟล์นี้ใครเป็นเจ้าของ */
import { execSync } from 'node:child_process';

const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };

/* เจ้าของไฟล์ — ตรงกับ docs/BRIEF_REPO_MAP.md · แก้ที่นี่ที่เดียวเวลาห้องเปลี่ยนมือ */
const OWNER = [
  [/^(liff_customer|operation_hub|main_database_v2|db2|kitchen_queue|home_editor|print_pickslip)\.html$/, 'u', '🔴 ไฟล์แกน — ลูกค้า/ครัว/แอดมินใช้อยู่'],
  [/^pwa\/k2\.html$/, 'u', '🔴 ไฟล์แกน — ครัวใช้ทุกวัน'],
  [/^(gate\.js|vercel\.json)$/, 'u', '🔴 ไฟล์แกน — คุมทุกหน้า'],
  [/^api\//, 'u · k', '🔴 ข้อความที่วิ่งไปหาลูกค้าจริง'],
  [/^scripts\/u\//, 'u', '🔴 ชุดทดสอบที่เฝ้าไม่ให้ของพังซ้ำ'],
  [/^scripts\/finance\/|^finance\/|^docs\/INGREDIENT_/, 'f', '🔴 ตัวเลขเงิน + สารบัญวัตถุดิบ'],
  [/^staff\//, 'pm', '🟡 แอปพนักงาน — บอกห้อง pm ก่อน'],
  [/^web\//, 'm', '🟡 เว็บสาธารณะ — บอกห้อง m ก่อน'],
  [/^kitchen\//, 'k · ฟ้า', '🟡 ใบงานครัว'],
  [/^(pwa\/ing_|scripts\/ing\/)/, 'ทีมวัตถุดิบ', '🟢 เขตทีมวัตถุดิบ'],
  [/^preview\//, 'ใครก็ได้', '🟢 พื้นที่ทดลอง ของจริงไม่ขยับ'],
  [/^docs\//, 'ทุกห้อง', '🟢 เอกสาร'],
  [/^pwa\//, 'u', '🟡 เครื่องมือย่อย — บอกห้อง u ก่อน'],
];
const ownerOf = (f) => (OWNER.find(([re]) => re.test(f)) || [null, 'ไม่ระบุ', '🟡 ไม่อยู่ในตาราง = ถามก่อน'])
  .slice(1);

const get = async (q) => (await fetch(B + q, { headers: H })).json();
const git = (cmd) => { try { return execSync('git ' + cmd, { encoding: 'utf8' }).trim(); } catch { return ''; } };

async function activeClaims() {
  return await get('work_claims?status=eq.active&select=id,room,task,files,created_at&order=created_at.desc&limit=200');
}

async function check(files) {
  const claims = await activeClaims();
  git('fetch -q origin');
  const behind = git('rev-list --count HEAD..origin/main');
  console.log('');
  if (behind && behind !== '0') {
    console.log('⚠️  ของในเครื่องเก่ากว่า main อยู่ ' + behind + ' คอมมิต — ดึงของใหม่ก่อนเริ่มแก้');
    console.log('    git fetch origin && git reset --hard origin/main   (หรือแตก branch ใหม่จาก origin/main)');
    console.log('');
  }
  for (const f of files) {
    const [own, note] = ownerOf(f);
    console.log('📄 ' + f);
    console.log('   เจ้าของ: ' + own + '  ' + note);
    const hit = claims.filter(c => String(c.files || '').includes(f));
    if (hit.length) {
      hit.forEach(c => console.log('   🔒 จองอยู่โดย ' + c.room + ' ตั้งแต่ ' + String(c.created_at).slice(0, 16).replace('T', ' ') +
        '\n      งาน: ' + String(c.task || '').slice(0, 90)));
      console.log('   → อย่าเพิ่งแก้ ถามห้องนั้นก่อน');
    } else {
      console.log('   ✅ ไม่มีใครจองอยู่');
    }
    const log = git('log -3 --format="%h · %ad · %s" --date=short origin/main -- "' + f + '"');
    console.log(log ? '   แก้ล่าสุด:\n' + log.split('\n').map(l => '      ' + l).join('\n') : '   (ยังไม่มีในประวัติ = ไฟล์ใหม่)');
    console.log('');
  }
  if (!claims.length) console.log('(ตอนนี้ทั้งระบบไม่มีใครจองงานไว้เลย)');
}

async function take(room, task, files) {
  const claims = await activeClaims();
  const clash = claims.filter(c => files.some(f => String(c.files || '').includes(f)) && c.room !== room);
  if (clash.length) {
    console.log('🔴 จองไม่ได้ — มีห้องอื่นจองไฟล์นี้อยู่:');
    clash.forEach(c => console.log('   · ' + c.room + ' — ' + String(c.task || '').slice(0, 80)));
    console.log('   คุยกับห้องนั้นก่อน (งานซ้ำ 2 ชั่วโมง ถูกกว่าของพังตอนครัวกำลังใช้)');
    process.exit(1);
  }
  const r = await fetch(B + 'work_claims', {
    method: 'POST', headers: { ...H, Prefer: 'return=representation' },
    body: JSON.stringify([{ room, task, files: files.join(' · '), status: 'active' }])
  });
  const j = await r.json();
  console.log(r.ok ? '🔒 จองแล้ว: ' + files.join(' · ') + '  (id ' + (j[0] && j[0].id ? String(j[0].id).slice(0, 8) : '?') + ')'
    : '❌ จองไม่สำเร็จ: ' + JSON.stringify(j));
}

async function done(room, files) {
  const claims = await activeClaims();
  const mine = claims.filter(c => c.room === room && files.some(f => String(c.files || '').includes(f)));
  if (!mine.length) { console.log('(ไม่มีรายการจองของห้อง ' + room + ' กับไฟล์นี้)'); return; }
  for (const c of mine) {
    await fetch(B + 'work_claims?id=eq.' + c.id, {
      method: 'PATCH', headers: H,
      body: JSON.stringify({ status: 'done', updated_at: new Date().toISOString() })
    });
    console.log('✅ ปล่อยแล้ว: ' + String(c.files).slice(0, 70));
  }
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'check' && rest.length) await check(rest);
else if (cmd === 'take' && rest.length >= 3) await take(rest[0], rest[1], rest.slice(2));
else if (cmd === 'done' && rest.length >= 2) await done(rest[0], rest.slice(1));
else {
  console.log([
    'จองไฟล์ก่อนแก้ — กันสองห้องแก้ทับกัน',
    '',
    '  node scripts/claim.mjs check liff_customer.html pwa/k2.html',
    '  node scripts/claim.mjs take gpt "ทำหน้าวัตถุดิบคงเหลือ" pwa/ing_stock.html',
    '  node scripts/claim.mjs done gpt pwa/ing_stock.html',
  ].join('\n'));
}

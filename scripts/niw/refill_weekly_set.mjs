// ============================================================
//  เติมสต็อกเมนูประจำสัปดาห์ S1-S8 / D1-D5  ·  1 ก.ย. 2026
//  ------------------------------------------------------------
//  นัทสั่งเอง: "ช่วง จันทร์-พุธ ขอให้เติมให้เลย s1-8 D1-5 ... เติมทีละ 5
//               และเมื่อไหร่ที่เติม แจ้งด้วยว่าเติมอะไรเท่าไหร่"
//
//  🖐️ เขียนช่องเดียวกับที่ "คนกดในหน้า DB" เขียน = menu_items.stock_total
//     (ช่องสต็อกในแถวเมนู -> syncStockDebounced เขียนช่องนี้ช่องเดียว)
//
//  🔴 นัทสั่ง 1 ก.ย.: "ใส่ไว้ในช่องกำลังจะผลิตนะ ไม่ใช่ช่องมีของสต็อกแล้ว"
//     สูตรของระบบ:  ลูกค้าสั่งได้(stock_total) = มีจริง + กำลังเติม − สั่งแล้ว
//     -> การ "สั่งผลิตเพิ่ม 5" ที่ถูกต้อง = บวก 5 เข้าทั้ง stock_total และ กำลังเติม
//        ผลคือ "มีจริง" ไม่ขยับ (เพราะยังไม่ได้ทำ) แต่ลูกค้าสั่งล่วงหน้าได้ ✓
//     ถ้าบวกแต่ stock_total เฉยๆ = ระบบเข้าใจว่าของอยู่ในมือแล้ว = โกหกครัว (ผมพลาดมาแล้ว 1 ก.ย.)
//
//  ⛔ ไม่แตะ actual_stock = ช่องของครัว แปลว่า "ครัวทำได้จริงเท่าไหร่"
//  ⛔ ไม่แตะ is_available = กฎนัท "ถ้าฉันยังไม่คอนเฟิร์มอย่าเปิด"
//  ⛔ ไม่ล้างของครัวที่ค้างอยู่ใน stock_incoming — บวกทับเข้าไป ไม่เขียนทับ
//
//  ทดลองดูเฉยๆ ไม่เขียนจริง:  node scripts/niw/refill_weekly_set.mjs --dry
// ============================================================
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H  = { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' };
const DRY  = process.argv.includes('--dry');
const STEP = 5;                       // เติมทีละ 5 (นัทกำหนดเอง)
const BASE = 'https://under360-system.vercel.app';
const SAYKEY = process.env.KAPAN_SAY_KEY || 'kapan-pm-2026';

/* เวลาไทยต้องคำนวณเอง — เชลล์เครื่องนี้ TZ=Asia/Bangkok คืน UTC เงียบๆ (เคยหลอกมาแล้ว 7 ชม.) */
const thai = new Date(Date.now() + 7 * 3600 * 1000);
const dow  = thai.getUTCDay();
const DAYS = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์'];        // 0=อา 1=จ 2=อ 3=พ
const inWindow = (dow === 1 || dow === 2 || dow === 3);

/* ห่อเป็น main() แล้ว return แทน process.exit()
   — process.exit กลางงาน async ทำให้ Node บน Windows โยน assertion แล้วคืน exit code 127
     ตัวตั้งเวลาจะอ่านว่า "ล้มเหลว" ทั้งที่เติมสำเร็จไปแล้ว */
async function main() {
if (!DRY && !inWindow) { console.log('ไม่ใช่ จันทร์-พุธ (dow=' + dow + ') — ไม่เติม'); return; }

/* ชื่อเล่นที่รับ: S ตามด้วยเลข 1-8 · D ตามด้วยเลข 1-5
   ไม่ใช้ regex ตั้งใจ — heredoc เคยกินแบ็กสแลชจน \d กลายเป็น d มาแล้ว 3 ครั้ง */
function slot(sc) {
  const s = String(sc || '').trim().toUpperCase();
  const head = s.charAt(0);
  if (head !== 'S' && head !== 'D') return null;
  const rest = s.slice(1);
  const n = parseInt(rest, 10);
  if (!(n > 0) || String(n) !== rest) return null;
  if (head === 'S' && n > 8) return null;
  if (head === 'D' && n > 5) return null;
  return { head, n, label: s, rank: (head === 'S' ? 0 : 100) + n };
}

const rows = await (await fetch(
  SB + '/rest/v1/menu_items?select=id,code,subcode,name,is_available,stock_total&subcode=not.is.null',
  { headers: H })).json();

const targets = [];
for (const m of rows) {
  const s = slot(m.subcode);
  if (!s) continue;
  if (m.is_available !== true) continue;              // ปิดขายอยู่ = ไม่ยุ่ง ไม่เปิดคืนเอง
  if (m.stock_total === null) continue;               // "ไม่จำกัด" ไม่มีอะไรให้เติม
  if (Number(m.stock_total) > 0) continue;            // ยังมีของ ไม่ต้องเติม
  targets.push({ m, s, from: Number(m.stock_total), to: STEP });
}
targets.sort((a, b) => a.s.rank - b.s.rank);

if (!targets.length) { console.log('ของยังไม่ขาด — ไม่ต้องเติม'); return; }

const lines = targets.map(t => t.s.label + ' ' + t.m.name + ' : ' + t.from + ' -> ' + t.to);
console.log(lines.join('\n'));
if (DRY) { console.log('[dry] ไม่ได้เขียนจริง'); return; }

/* กำลังเติมที่ค้างอยู่ — ต้องอ่านก่อน แล้วบวกทับ ไม่ใช่เขียนทับ (ของครัวจะหาย) */
let inc = {};
try {
  const hd = await (await fetch(SB + '/rest/v1/kitchen_data?key=eq.stock_incoming&select=data', { headers: H })).json();
  inc = (hd && hd[0] && hd[0].data) || {};
} catch (e) { console.error('อ่าน stock_incoming ไม่ได้ — หยุดไว้ก่อน ดีกว่าเขียนทับของครัว'); process.exitCode = 1; }

const done = [];
const at = new Date().toISOString();
for (const t of targets) {
  const newTotal = t.from + STEP;                       // ลูกค้าสั่งได้เพิ่มอีก 5
  const r = await fetch(SB + '/rest/v1/menu_items?id=eq.' + t.m.id, {
    method: 'PATCH', headers: H, body: JSON.stringify({ stock_total: newTotal }),
  });
  if (!r.ok) { console.error('เติมไม่สำเร็จ', t.s.label, r.status, await r.text()); continue; }
  /* ⚠️ บั๊กที่เคยทำ (1 ก.ย.): เขียนทับ by เป็น "น้องนิว" ทั้งที่ครัวกรอกไว้ก่อน
     -> ตามย้อนไม่ได้ว่าใครใส่เท่าไหร่ (เคส D3 = 10 อธิบายไม่ได้เลย)
     ตอนนี้เก็บทั้งชื่อเดิมและยอดเดิมไว้ */
  const prev   = inc[t.m.id];
  const had    = (prev && Number(prev.n)) || 0;
  const prevBy = (prev && prev.by) ? String(prev.by) : '';
  inc[t.m.id] = {
    n: had + STEP,
    by: (prevBy && prevBy.indexOf('น้องนิว') < 0) ? (prevBy + ' + น้องนิว') : 'น้องนิว (สั่งผลิต)',
    at, code: t.m.code,
    was: had ? { n: had, by: prevBy } : undefined,   // ของเดิมก่อนบวก — ไว้ตรวจย้อน
  };
  t.to = newTotal;
  done.push(t);
}
if (done.length) {
  const w = await fetch(SB + '/rest/v1/kitchen_data?on_conflict=key', {
    method: 'POST', headers: { ...H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ key: 'stock_incoming', data: inc }),
  });
  if (!w.ok) console.error('⚠️ เขียน "กำลังเติม" ไม่สำเร็จ — ครัวจะไม่เห็นว่าต้องทำ', w.status);
}
if (!done.length) { console.error('เติมไม่สำเร็จสักเมนู'); process.exitCode = 1; return; }

/* ลง activity_log ให้แอดมินเห็นในแถบ "ประวัติ" ของหน้า DB เหมือนคนกดเอง
   actor บอกตรงๆ ว่าเป็นตัวอัตโนมัติ — ใส่ชื่อคนจะกลายเป็นปลอมลายเซ็น */
const items = {};
for (const t of done) items[t.s.label + ' ' + t.m.code] = t.to - t.from;
await fetch(SB + '/rest/v1/activity_log', {
  method: 'POST', headers: H,
  body: JSON.stringify({
    session_id: 'niw-refill-' + thai.toISOString().slice(0, 10),
    actor: 'น้องนิว (เติมอัตโนมัติ จ-พ)', source: 'db', action_type: 'stock',
    summary: done.map(t => t.s.label + ' +' + (t.to - t.from)).join(', '),
    detail: { items, count: done.length },
  }),
});

const hhmm = String(thai.getUTCHours()).padStart(2, '0') + ':' + String(thai.getUTCMinutes()).padStart(2, '0');
const text = ['🧺 เติมสต็อกให้แล้ว ' + hhmm + ' น.', '']
  .concat(done.map(t => '· ' + t.s.label + ' ' + t.m.name + '  ' + t.from + ' -> ' + t.to + ' กล่อง'))
  .concat(['', 'เขียนช่องเดียวกับที่แอดมินกดในหน้า DB · ไม่ได้แตะเลขของครัว',
           'ไม่อยากให้เติมตัวไหน บอกได้ เดี๋ยวถอดออกจากรายการ']).join('\n');
const sent = await fetch(BASE + '/api/kapan-say', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: SAYKEY, text }),
});
console.log('เติมแล้ว ' + done.length + ' เมนู · แจ้งไลน์:', sent.status);
}
await main();

// poller ประจำห้อง — เฝ้ากล่องจดหมายของห้องตัวเองบนบอร์ด session_messages
//  ใช้แบบเดียวกับ scripts/kapan_watch.mjs (ตัวที่พิสูจน์แล้วว่าไม่เคยหลับ) แต่ใช้ได้ทุกห้อง
//
//  รันใน "ห้องนั้น" ด้วย Monitor tool (persistent: true · timeout_ms: 3600000):
//     node scripts/room_watch.mjs <ห้อง>[,ห้องสำรอง...] [--me=ชื่อผู้ส่งของตัวเอง,ชื่ออื่น]
//  ตัวอย่าง:
//     node scripts/room_watch.mjs secretary --me=secretary,เลขา
//     node scripts/room_watch.mjs u-maintainer,u --me=u-maintainer,u
//
//  ทำอะไร: ทุก 10 วิ ถามบอร์ด 1 ครั้ง (ไม่กิน token) · เจอจดหมายที่ "คนอื่น" ส่งเข้าห้องเรา → พิมพ์ 1 บรรทัด
//  → Monitor ปลุกสมองในห้องให้ตื่นมาอ่านแล้วตอบ · ไม่มีจดหมาย = เงียบ
//  ⚠️ ห้องปิด = poller ตาย (เหมือนกะปัน) — hook ตอนเปิดห้องจะเตือนให้เปิดใหม่
import fs from 'fs';
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: K, Authorization: 'Bearer ' + K };

const args = process.argv.slice(2);
const rooms = (args.find(a => !a.startsWith('--')) || '').split(',').map(s => s.trim()).filter(Boolean);
const me = ((args.find(a => a.startsWith('--me=')) || '--me=').slice(5)).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
if (!rooms.length) { console.error('ใช้: node scripts/room_watch.mjs <ห้อง> [--me=ชื่อตัวเอง]'); process.exit(1); }

// ⚡ 14 ก.ย. 2569 — poller คือตัวกินโควตา Supabase ตัวจริง (ตรวจของจริงแล้ว 2 ชั้น)
//    95% ของ egress = อ่าน DB · เกิน 2 ใน 3 ของคำขอทั้งหมดมาจาก poller ทุกห้องรวมกัน
//    องค์กรใช้ไป 9.6/5 GB = 192% → ถูกขู่กั้นการใช้งาน 1 ต.ค. 2569 (คำขอตอบ 402 = ร้านล่ม)
//    เขาผ่อนผันครั้งเดียว — เกินอีกครั้งตัดทันที ห้ามพลาดซ้ำ
//
// 🕐 นัทเคาะเอง 14 ก.ย.: "ความถี่ไม่เท่ากัน" — ห้องที่งานวิ่งทุกวันเร็ว · ห้องที่งานเป็นรอบช้าได้
//    คิดเป็นคำขอ/วัน: 45 วิ = 1,920 · 5 นาที = 288 · 10 นาที = 144   (+ เต้นหัวใจอีก 288/วัน ทุกห้อง)
//    ชุดนี้รวมทุกห้อง ≈ 14,700 คำขอ/วัน ≈ 1.8 GB/เดือน (เพดานฟรี 5 GB)
//    ⛔ จะเร่งห้องไหนให้เร็วขึ้น ต้องเปิดหน้า usage ของ Supabase ดูก่อน ห้ามแก้เพราะรู้สึกว่าช้า
const ROOM_EVERY_MS = {
  // งานวิ่งจริงทุกวัน — ต้องตอบไว
  pm: 45000, secretary: 45000, 'u-maintainer': 45000, u: 45000,
  niw: 45000, '05': 45000, m: 45000,
  // งานเป็นรอบ — ช้าได้ ไม่มีใครรอคำตอบเป็นวินาที
  fah: 300000,                       // 5 นาที (นัทระบุเอง)
  'คลังภาพ': 600000, 'ครีเอทีฟ': 600000,   // 10 นาที (นัทระบุเอง)
  'เจ2569': 300000, '06': 300000,     // เปิดเฉพาะช่วงงาน จบแคมเปญแล้วปิด
};
// ลำดับความสำคัญ: env (ชั่วคราว) > ตารางต่อห้อง > ค่ากลาง 45 วิ
const EVERY_MS = Number(process.env.WATCH_EVERY_MS || ROOM_EVERY_MS[rooms[0]] || 45000);
const F = `.scratch/room_watch_${rooms[0]}_last.txt`;
fs.mkdirSync('.scratch', { recursive: true });
// เปิดครั้งแรก (ยังไม่มีไฟล์จำตำแหน่ง) → ย้อนดู 60 นาที กันจดหมายที่มาก่อน poller เกิดหล่นหาย
let last = fs.existsSync(F) ? fs.readFileSync(F, 'utf8').trim() : new Date(Date.now() - 60 * 60000).toISOString();

const isMe = s => me.some(m => (s || '').toLowerCase().includes(m));
const roomFilter = rooms.length === 1 ? `room=eq.${encodeURIComponent(rooms[0])}` : `room=in.(${rooms.map(encodeURIComponent).join(',')})`;

// เต้นหัวใจลง live_presence (sid=poller:<ห้อง>) ทุก 30 วิ → หน้า /pwa/pollers.html โชว์ว่าห้องไหนยังหายใจ
// จังหวะหัวใจมีหน้าที่เดียว: บอกหน้า /pwa/pollers.html ว่าห้องนี้ยังตื่นอยู่ ไม่เกี่ยวกับการรับจดหมาย
// นัทเคาะเอง 14 ก.ย. 2569: ทุก 5 นาทีพอ (เดิม 30 วิ)
const HB_MS = Number(process.env.WATCH_HB_MS || 300000);
let lastHb = 0;
async function heartbeat() {
  if (Date.now() - lastHb < HB_MS) return;
  lastHb = Date.now();
  try {
    await fetch(`${U}/live_presence?on_conflict=sid`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ sid: `poller:${rooms[0]}`, area: 'poller', page: rooms[0], last_seen: new Date().toISOString() }),
    });
  } catch (e) {}
}

console.log(`👂 poller ห้อง ${rooms.join('/')} เริ่มแล้ว · เช็คทุก ${EVERY_MS / 1000} วิ · นับจาก ${last}`);
for (;;) {
  await heartbeat();
  try {
    const q = `${U}/session_messages?${roomFilter}&created_at=gt.${encodeURIComponent(last)}&select=created_at,sender,text&order=created_at.asc&limit=10`;
    const rows = await fetch(q, { headers: H }).then(r => r.json());
    if (Array.isArray(rows) && rows.length) {
      for (const r of rows) {
        last = r.created_at;
        if (isMe(r.sender)) continue;
        const head = (r.text || '').replace(/\s+/g, ' ').slice(0, 160);
        console.log(`📬 จดหมายใหม่ห้อง ${rooms[0]} จาก ${r.sender}: ${head}`);
        console.log(`   → อ่านเต็ม: session_messages room=${rooms[0]} created_at=${r.created_at} แล้วตอบกลับตามกฎ 4 จังหวะ`);
      }
      fs.writeFileSync(F, last);
    }
  } catch (e) { /* เงียบ — รอบหน้าลองใหม่ */ }
  await new Promise(r => setTimeout(r, EVERY_MS));
}

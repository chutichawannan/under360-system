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

const EVERY_MS = Number(process.env.WATCH_EVERY_MS || 10000);
const F = `.scratch/room_watch_${rooms[0]}_last.txt`;
fs.mkdirSync('.scratch', { recursive: true });
let last = fs.existsSync(F) ? fs.readFileSync(F, 'utf8').trim() : new Date().toISOString();

const isMe = s => me.some(m => (s || '').toLowerCase().includes(m));
const roomFilter = rooms.length === 1 ? `room=eq.${encodeURIComponent(rooms[0])}` : `room=in.(${rooms.map(encodeURIComponent).join(',')})`;

// เต้นหัวใจลง live_presence (sid=poller:<ห้อง>) ทุก 30 วิ → หน้า /pwa/pollers.html โชว์ว่าห้องไหนยังหายใจ
const HB_MS = 30000;
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

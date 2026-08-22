#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════════
   📬 กล่องจดหมายของห้อง — เปิดเอง ไม่ต้องรอใครปลุก
   นัทเคาะเอง 22 ส.ค. 2569: "หลายคนบอกจะปลุกให้ หลายครั้งพบว่ามันยากไม่ทันใจ
                             12 ชั่วโมง เป็นตัวเลขที่ไม่ทันใจฉันซะเลย"
   → เพิ่มคนกลาง = ช้าลง · ห้องเปิดเอง = เร็วที่สุดเท่าที่ทำได้

   วิธีใช้:  node scripts/room_inbox.mjs <ชื่อห้อง> [ชั่วโมงย้อนหลัง]
   ตัวอย่าง: node scripts/room_inbox.mjs u 24

   ⚠️ ตั้งใจให้เป็น "คำสั่งที่ห้องรันเอง" ไม่ใช่ตัวเฝ้าอัตโนมัติ
      เพราะห้อง = เซสชันที่มีคนคุยอยู่ ไม่ใช่ process ที่รันค้าง
      ตัวเฝ้าอัตโนมัติจะเด้งใส่ตอนกำลังคุยเรื่องอื่นอยู่ = ตรงกับที่นัทบ่นพอดี
      ("ห้องอื่นส่งมาแทรก ยังอ่านที่คนอื่นคุยกันไม่จบอีก")
   ══════════════════════════════════════════════════════════════════════════════ */
const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const room  = (process.argv[2] || '').trim();
const hours = Number(process.argv[3] || 24);
if (!room) { console.log('ใช้: node scripts/room_inbox.mjs <ห้อง> [ชั่วโมง]'); process.exit(1); }

const since = new Date(Date.now() - hours * 3600e3).toISOString();

/* ตัดข้อความของห้องตัวเองออก — ไม่งั้นเปิดมาเจอแต่ของที่ตัวเองเพิ่งส่ง
   (เจอจริง: ห้อง U ส่งรายงานออก 6 ใบใน 1 วัน กลบจดหมายเข้าจนหาไม่เจอ) */
const mine = /^(U |u-track|U \(u-track\))/i;

const rows = await (await fetch(
  `${SB}/session_messages?room=eq.${encodeURIComponent(room)}&created_at=gte.${since}&order=created_at.desc&limit=60`,
  { headers: H })).json();

if (!Array.isArray(rows)) { console.log('อ่านบอร์ดไม่ได้:', rows); process.exit(1); }

const inbox = rows.filter(m => !mine.test(String(m.sender || '')));
console.log(`\n📬 ห้อง "${room}" · ย้อนหลัง ${hours} ชม. · จดหมายเข้า ${inbox.length} ใบ (จากทั้งหมด ${rows.length})\n`);

if (!inbox.length) { console.log('   ว่าง — ไม่มีใครส่งอะไรมา\n'); process.exit(0); }

/* เรียงเก่า→ใหม่ ตอนอ่าน เพราะเรื่องเดียวกันมักส่งต่อกันหลายใบ อ่านย้อนแล้วงง */
inbox.reverse().forEach(m => {
  const t = String(m.text || '').replace(/\s+/g, ' ').trim();
  const head = t.slice(0, 160);
  console.log(`── ${m.created_at.slice(5, 16).replace('T', ' ')}  [${m.sender}]`);
  console.log(`   ${head}${t.length > 160 ? '…' : ''}\n`);
});
console.log(`อ่านฉบับเต็ม: เปลี่ยน limit/กรอง sender ในสคริปต์ หรือ query ตรง\n`);

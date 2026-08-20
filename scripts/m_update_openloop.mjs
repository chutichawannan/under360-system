import fs from 'fs';
const F = 'docs/OPEN_LOOPS.md';
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');

const OLD = '| **เทสลิงก์ LIFF ว่าค่า utm/fbclid ถึงหน้าสั่งของจริงไหม** | 20 ส.ค. | M ทำเองไม่ได้ — เบราว์เซอร์ทั้ง 2 ตัวบล็อก `liff.line.me` · **branch พร้อม merge ทันทีที่ยืนยัน** | **นัท** (กดลิงก์ในแอป LINE 30 วิ) |';
const NEW = '| **พิสูจน์ว่า "ที่มาลูกค้า" ไปถึงใบสั่งซื้อจริง** | 20 ส.ค. | ✅ นัทเทสเปิดหน้าจากลิงก์ติดแท็กแล้ว **หน้าไม่พัง** · merge ขึ้น main แล้ว · ⏳ **แต่ยังไม่เห็นแถวจริง** — `orders.source_campaign` ยังมี **0 ใบ** · เช็คซ้ำได้ `node scripts/m_watch_attribution.mjs` | **ออเดอร์จริงใบแรกจากลิงก์ติดแท็ก** — ยังไม่ปิด |';

if (!h.includes(OLD)) { console.error('❌ ไม่เจอบรรทัดเดิมใน OPEN_LOOPS'); process.exit(1); }
h = h.replace(OLD, NEW);
fs.writeFileSync(F, h);
console.log('✅ อัปเดตเรื่องค้าง: เทส LIFF ผ่านครึ่งทาง (หน้าไม่พัง) แต่ยังไม่ปิดจนกว่าจะเห็นแถวจริง');

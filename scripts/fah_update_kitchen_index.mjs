#!/usr/bin/env node
/**
 * เพิ่มลิงก์ใบงานวันใหม่เข้าหน้ารวมของครัว (kitchen/index.html → 360foodbox.com/k)
 *
 *   node scripts/fah_update_kitchen_index.mjs 2026-09-07
 *
 * ที่มา: 30 ส.ค. 2026 แอดมินทวงเอง *"พี่นัท ใบงานครัวยังไม่อัปเดตของวันจันทร์ที่ 31 ค่ะ"*
 * — ใบมีอยู่จริงแล้ว แต่ **ไม่มีลิงก์ในหน้ารวม ครัวเลยหาไม่เจอ**
 * → ทำใบเสร็จต้องขึ้นลิงก์เองทุกครั้ง ไม่ใช่ขั้นตอนที่คนต้องจำ
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DATE = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE || '')) {
  console.error('ใช้: node scripts/fah_update_kitchen_index.mjs YYYY-MM-DD');
  process.exit(2);
}
const IP = 'kitchen/index.html';
let idx = readFileSync(IP, 'utf8');
if (idx.includes(DATE)) { console.log(`   มีลิงก์ ${DATE} อยู่แล้ว`); process.exit(0); }

// หาลิงก์ของ "วันก่อนหน้าที่ใกล้ที่สุด" มาเป็นแม่แบบ
const days = readdirSync('kitchen').filter(f => /^\d{4}-\d{2}-\d{2}\.html$/.test(f))
  .map(f => f.slice(0, 10)).filter(d => d < DATE).sort();
let done = false;
for (const key of days.reverse()) {
  const re = new RegExp(`([ \\t]*<a[^>]*${key}\\.html[\\s\\S]*?${key}_pack\\.html[\\s\\S]*?<\\/a>)`);
  const m = idx.match(re) || idx.match(new RegExp(`([ \\t]*<a[^>]*${key}\\.html[\\s\\S]{0,400}?<\\/a>)`));
  if (!m) continue;
  const block = m[0];
  const fresh = block.split(key).join(DATE);
  writeFileSync(IP, idx.replace(block, fresh + '\n' + block));
  console.log(`   ✅ เพิ่มลิงก์ ${DATE} ในหน้ารวมครัวแล้ว (ใช้ ${key} เป็นแม่แบบ)`);
  done = true;
  break;
}
if (!done) {
  console.log(`   ⚠️ เพิ่มลิงก์อัตโนมัติไม่ได้ — โครง kitchen/index.html เปลี่ยน ต้องเติมมือสำหรับ ${DATE}`);
  process.exitCode = 1;
}

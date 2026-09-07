#!/usr/bin/env node
/**
 * สร้างรายการลิงก์ใบงานในหน้ารวมของครัวใหม่ทั้งบล็อก (kitchen/index.html → 360foodbox.com/k)
 *
 *   node scripts/fah_update_kitchen_index.mjs
 *   node scripts/fah_update_kitchen_index.mjs 2026-09-07   (ระบุวันได้ แต่ไม่จำเป็น — มันไล่จากไฟล์จริง)
 *
 * ที่มา 2 รอบ:
 *  · 30 ส.ค. 2026 แอดมินทวง *"ใบงานครัวยังไม่อัปเดตของวันจันทร์ที่ 31 ค่ะ"* — ใบมีจริงแต่ไม่มีลิงก์
 *  · 7 ก.ย. 2026 นัทจับได้ว่าหน้า /k **ขึ้น "ศุกร์ 4 ก.ย." ซ้ำ 3 คู่** และไม่มี 7/9 ก.ย.
 *    ต้นเหตุ: เวอร์ชันแรกก๊อปบล็อกเดิมมาแล้วแทนแค่ "วันที่ในลิงก์" — **ลืมแทนชื่อวันภาษาไทยที่คนอ่าน**
 *    → เลิกก๊อป เปลี่ยนเป็น **สร้างรายการใหม่ทั้งบล็อกจากไฟล์จริงใน kitchen/** ทุกครั้ง
 *      (ก๊อปแล้วแก้บางส่วน = ที่เกิดบั๊กประจำ · สร้างใหม่ทั้งก้อนไม่มีทางเหลือของเก่าค้าง)
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const IP = 'kitchen/index.html';
const DOW = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const thaiDate = ds => {
  const d = new Date(ds + 'T00:00:00Z');
  return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
};

const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
const days = [...new Set(readdirSync('kitchen')
  .filter(f => /^\d{4}-\d{2}-\d{2}\.html$/.test(f))
  .map(f => f.slice(0, 10)))].sort().reverse();

const rowsHtml = days.flatMap(d => {
  const past = d < today;
  const cls = past ? 'day past' : 'day';
  const go = past ? 'ผ่านมาแล้ว' : 'เปิด →';
  const tag = past ? '' : ' ✅ ตัวจริง';
  const th = thaiDate(d);
  return [
    `<a class="${cls}" href="${d}.html"><span class="d">${th} — 🍳 ใบผลิต (ครัว)${tag}</span><span class="go">${go}</span></a>`,
    `<a class="${cls}" href="${d}_pack.html"><span class="d">${th} — 📦 ใบจัดของ (รายชื่อ)${tag}</span><span class="go">${go}</span></a>`,
  ];
}).join('\n');

let html = readFileSync(IP, 'utf8');
const startMark = '<div class="sec">■ ใบงานรายวัน</div>';
const start = html.indexOf(startMark);
if (start < 0) { console.error('❌ หาหัวข้อ "ใบงานรายวัน" ใน kitchen/index.html ไม่เจอ'); process.exit(1); }
const from = start + startMark.length;
// บล็อกลิงก์จบตรงที่ไม่ใช่ <a class="day"...> แล้ว
const rest = html.slice(from);
const m = rest.match(/^(\s*(?:<a class="day[^>]*>[\s\S]*?<\/a>\s*)*)/);
const oldBlock = m ? m[1] : '\n';
const before = (oldBlock.match(/<a class="day/g) || []).length;

html = html.slice(0, from) + '\n' + rowsHtml + '\n' + html.slice(from + oldBlock.length);
writeFileSync(IP, html);
console.log(`   ✅ หน้ารวมครัว /k — เขียนรายการใหม่ ${days.length} วัน (${days.length * 2} ลิงก์) · ของเดิม ${before} ลิงก์`);
console.log(`      ล่าสุด: ${days.slice(0, 3).map(thaiDate).join(' · ')}`);

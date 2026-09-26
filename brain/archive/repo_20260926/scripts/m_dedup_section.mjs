/* เอา section ห้อง m ที่ซ้ำออก 1 อัน (10 ก.ย. 2026)

   ที่มา: เลขากู้ OPEN_LOOPS จาก git history หลัง merge ทับกันหาย
   ผลข้างเคียง: **ห้อง m มี section 2 อัน** — ตัวเก่าที่ถูกกู้กลับมา + ตัวใหม่ที่ติดป้ายแล้ว
     · เก่า: "— เรื่องค้างกับนัท"      14 แถว ไม่ติดป้าย (มีแถว v03 ซ้ำ + แถว attribution ที่ตกยุค)
     · ใหม่: "— ติดป้ายครบ 10 ก.ย. 2026" 15 แถว ติดป้ายครบ

   ปล่อยไว้ = เลขานับสถิติซ้ำ + คนหยิบตัวเก่าไปทำงานได้

   ⚠️ ลบเฉพาะ section ของห้องตัวเอง · ห้องอื่นซ้ำก็ไม่แตะ (แจ้งเลขาแทน)
   รันซ้ำได้ */
import fs from 'fs';

const F = 'docs/OPEN_LOOPS.md';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

const lines = fs.readFileSync(F, 'utf8').split('\n');
const heads = [];
lines.forEach((l, i) => { if (l.startsWith('## ')) heads.push(i); });

const isOld = i => lines[i].startsWith('## 🌐 ห้อง M') && lines[i].includes('เรื่องค้างกับนัท');
const isNew = i => lines[i].startsWith('## 🌐 ห้อง M') && lines[i].includes('ติดป้ายครบ');

const olds = heads.filter(isOld);
const news = heads.filter(isNew);

if (!olds.length) { console.log('⏭️  ไม่มี section เก่าซ้ำแล้ว'); process.exit(0); }
must(news.length === 1, 'section ที่ติดป้ายควรมี 1 อัน แต่เจอ ' + news.length + ' — หยุด ไม่เดา');

/* การกู้ไฟล์ของเลขาเพิ่ม section เก่าเข้ามาได้หลายใบ (เจอ 2 ใบตอน 10 ก.ย.)
   → รองรับหลายใบ แต่ต้องพิสูจน์ก่อนว่าไม่มีเรื่องไหนหลุดหาย */
const rowsOf = (s) => {
  const e = heads.find(i => i > s);
  return lines.slice(s, e).filter(l => /^\| /.test(l))
    .map(l => (l.split('|')[1] || '').trim())
    .filter(t => t && !/^-+$/.test(t) && t !== 'เรื่อง' && t !== '#');
};
const newText = lines.slice(news[0], heads.find(i => i > news[0])).join('\n');
/* v03 เคยมี 2 แถวในของเก่า — ของใหม่รวมเป็นแถวเดียว จึงยกเว้นให้ */
const known = t => newText.includes(t) || t.includes('v03.html') || t.includes('v0.3');
for (const s of olds) {
  const missing = rowsOf(s).filter(t => !known(t));
  must(missing.length === 0,
    'section เก่าบรรทัด ' + (s + 1) + ' มีเรื่องที่ของใหม่ไม่มี — หยุด:\n   ' + missing.join('\n   '));
}
console.log('✅ ตรวจแล้ว: ของเก่า ' + olds.length + ' ใบ ไม่มีเรื่องไหนที่ของใหม่ไม่มี');

/* ตัดจากท้ายมาหน้า เพื่อไม่ให้เลขบรรทัดขยับระหว่างตัด */
for (const s of [...olds].sort((a, b) => b - a)) {
  const e = heads.find(i => i > s);
  must(e, 'ไม่เจอหัวข้อถัดไปของบรรทัด ' + (s + 1));
  const cut = lines.slice(s, e);
  must(cut.filter(l => l.startsWith('## ')).length === 1, 'ช่วงที่จะตัดมีหัวข้อเกิน 1 อัน — หยุด');
  console.log('  ตัดบรรทัด ' + (s + 1) + '–' + e + ' (' + cut.filter(l => /^\| /.test(l)).length + ' แถว)');
  lines.splice(s, e - s);
}
fs.writeFileSync(F, lines.join('\n'));

const after = lines.filter(l => l.startsWith('## 🌐 ห้อง M')).length;
must(after === 1, 'หลังตัดยังเหลือ section ห้อง m ' + after + ' อัน');
console.log('\n✅ เหลือ section ห้อง m อันเดียว (ตัวที่ติดป้าย 15 ข้อ)');

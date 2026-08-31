/* แปลงตารางเมนู Meal Plan ของห้องฟ้า (markdown) → JSON ให้เว็บใช้ (m-track 31 ส.ค. 2026)

   ที่มา: docs/FAH_MENU_PLAN_FOR_WEB.md (ห้องฟ้าทำ · 21 ส.ค. – 5 ต.ค. 2026)
   ปลายทาง: web/mp_plan.json

   ⚠️ ห้องฟ้ากำชับ: "อย่าก๊อปมาแปะนิ่ง แพลนขยับได้"
   → หน้าเว็บจะอ่าน **kitchen_data.mp_menu_plan (ของสด แหล่งเดียวกับ LIFF) ก่อนเสมอ**
     ไฟล์นี้เป็นแค่ตัวสำรองตอนของสดยังว่าง (ตอนนี้ว่างจริง — เช็คแล้ว 31 ส.ค.)
   ⚠️ รูปแบบต้องตรงกับที่ LIFF ใช้: { "YYYY-MM-DD": [ {no,name,protein}, ... ] }
     (LIFF ประกอบโค้ดเองเป็น 'LC'+no และ 'HP'+no)

   🔴 ตัดเมนูที่ห้องฟ้าสั่งระงับออก: LC53/HP53 (Baked Salmon Butter Lemon) ระงับตั้งแต่ 21 ส.ค.
   รันซ้ำได้ */
import fs from 'fs';

const SRC = 'docs/FAH_MENU_PLAN_FOR_WEB.md';
const OUT = 'web/mp_plan.json';
const BANNED = new Set(['53']);          /* ห้องฟ้าสั่งระงับ — ห้ามโผล่บนเว็บ */

const TH_MONTH = { 'ม.ค.':1,'ก.พ.':2,'มี.ค.':3,'เม.ย.':4,'พ.ค.':5,'มิ.ย.':6,
                   'ก.ค.':7,'ส.ค.':8,'ก.ย.':9,'ต.ค.':10,'พ.ย.':11,'ธ.ค.':12 };

/* ชื่อเมนูในชีทครัวมีร่องรอยการพิมพ์ในครัวติดมา — ลูกค้าไม่ควรเห็น
   (ไม่ได้แก้ความหมาย แค่เก็บกวาดตอนแสดงผล · ของที่เจอแจ้งห้องฟ้าให้แก้ต้นทางแล้ว) */
function tidy(s) {
  return String(s)
    .replace(/^\s*\(\s*[A-Za-z]\d+\s*\)\s*/, '')      /* รหัสภายในหลุดมา เช่น "(Z2) " "( Z1) " */
    .replace(/^[ัิ-ฺ็-๎]+/, '') /* สระ/วรรณยุกต์ลอยหน้าคำ เช่น "ฺFull Breakfast" */
    .replace(/([A-Za-z0-9)])([฀-๿])/g, '$1 $2') /* อังกฤษติดไทย เช่น "Wrapทูน่า" */
    .replace(/([฀-๿])([A-Za-z(])/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const md = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const plan = {};
let rows = 0, skipped = 0;

for (const line of md.split('\n')) {
  if (!line.startsWith('|')) continue;
  const c = line.split('|').map(s => s.trim());
  if (c.length < 6) continue;
  const [, dateTh, dow, code, name, protein] = c;
  if (!dateTh || dateTh === 'วันที่' || /^-+$/.test(dateTh)) continue;

  const m = dateTh.match(/^(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)$/);
  if (!m) continue;
  const day = +m[1], mon = TH_MONTH[m[2]];
  /* ไฟล์ครอบคลุม ส.ค.–ต.ค. 2026 — เดือน 1-7 จะเป็นปีถัดไป (กันพลาดถ้าแพลนข้ามปี) */
  const year = mon >= 8 ? 2026 : 2027;
  const iso = `${year}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  const no = (String(code).match(/(?:LC|HP)(\d+)/) || [])[1];
  if (!no) continue;
  if (BANNED.has(no)) { skipped++; continue; }

  (plan[iso] ||= []);
  if (plan[iso].some(x => x.no === no)) continue;
  plan[iso].push({ no, name: tidy(name), protein: String(protein || '').trim() });
  rows++;
}

const days = Object.keys(plan).sort();
if (!days.length) { console.error('❌ แปลงไม่ได้สักวัน — รูปแบบไฟล์ต้นทางเปลี่ยนไปหรือเปล่า'); process.exit(1); }

const sorted = {};
for (const d of days) sorted[d] = plan[d];
fs.writeFileSync(OUT, JSON.stringify({ _source: SRC, _built: '2026-08-31', plan: sorted }, null, 1));

console.log(`✅ ${OUT}`);
console.log(`   ${days.length} วัน · ${rows} เมนู · ตัดเมนูที่ระงับออก ${skipped} รายการ`);
console.log(`   ตั้งแต่ ${days[0]} ถึง ${days[days.length-1]}`);
const dowTh = ['อา','จ','อ','พ','พฤ','ศ','ส'];
const byDow = {};
days.forEach(d => { const w = dowTh[new Date(d+'T00:00:00').getDay()]; byDow[w] = (byDow[w]||0)+1; });
console.log(`   วันในสัปดาห์: ${Object.entries(byDow).map(([k,v])=>k+':'+v).join(' · ')}`);

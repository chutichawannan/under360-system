/* คอลลาจเมนูเจชุดใหม่ + ย่อรูปของแถม (ห้องเจส่งของมา 7 ก.ย. 2026)

   ห้องเจคัดรูปแต่งฉากขาวมาให้ 14 เมนู (.scratch/jay/regen/mapped/)
   สว่างและเป็นชุดเดียวกันกว่าคอลลาจเดิมมาก → เปลี่ยนรูปหัวเรื่อง /jay

   ⚠️ รูปต้นฉบับใหญ่มาก (gift 1.5MB · เมนูใบละ ~1-2MB)
   เอาขึ้นเว็บดิบๆ ไม่ได้ ลูกค้าส่วนใหญ่เปิดจากมือถือ
   → เรนเดอร์ผ่าน Chrome ให้เหลือขนาดที่ใช้จริงบนหน้า
   รันซ้ำได้ */
import fs from 'fs';
import { execFileSync } from 'child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SP = 'C:/Users/PP/AppData/Local/Temp/claude/C--Users-PP-Desktop-under360-system/e0ce4fa5-b4d0-43db-9182-f632f69d694a/scratchpad';
const SRC = '.scratch/jay/regen/mapped/';

/* 6 เมนู เลือกให้หน้าตาไม่ซ้ำแนวกัน (กล่องเบนโตะ · เส้น · ข้าว · พาสต้า · ทอด · ผัด) */
const PICKS = [
  'J05_เบนโตะเจผักรวม_a.png',
  'J16_หมี่คลุกลูกชิ้นแคะเจ_a.png',
  'J21_ข้าวผัดต้มยำหมูสับเจเต้าหู้ย่าง_a.png',
  'J12_พาสต้าครีมซอสเห็ดแชมปิญอง_a.png',
  'J23_เฟรนฟราย+เบอร์เกอร์แพลนท์เบส_a.png',
  'J29_ผัดมันฝรั่งเส้นบุกฟองเต้าหู้_a.png',
];

const b64 = p => {
  const b = fs.readFileSync(p);
  if (!(b[0] === 0x89 && b[1] === 0x50) && !(b[0] === 0xFF && b[1] === 0xD8)) {
    console.error('🔴 ไม่ใช่รูป: ' + p); process.exit(1);
  }
  return 'data:image/' + (b[0] === 0x89 ? 'png' : 'jpeg') + ';base64,' + b.toString('base64');
};

const shoot = (html, out, w, h) => {
  fs.mkdirSync(SP, { recursive: true });
  fs.writeFileSync(SP + '/shot.html', html);
  execFileSync(CHROME, ['--headless=old', '--disable-gpu', '--hide-scrollbars',
    '--window-size=' + w + ',' + h, '--screenshot=' + SP + '/shot.png',
    'file:///' + SP + '/shot.html'], { stdio: 'ignore' });
  fs.copyFileSync(SP + '/shot.png', out);
  return (fs.statSync(out).size / 1024) | 0;
};

/* ── ① คอลลาจเมนู 3x2 ── */
for (const f of PICKS) if (!fs.existsSync(SRC + f)) { console.error('🔴 ไม่เจอ ' + f); process.exit(1); }
const cells = PICKS.map(f => '<div class="c"><img src="' + b64(SRC + f) + '"></div>').join('');
const kb1 = shoot(
  '<!doctype html><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box}'
  + 'body{width:900px;height:600px;background:#fff}'
  + '.g{width:900px;height:600px;display:grid;grid-template-columns:repeat(3,1fr);'
  + 'grid-template-rows:repeat(2,1fr);gap:5px;background:#fff}'
  + '.c{overflow:hidden}.c img{width:100%;height:100%;object-fit:cover;display:block}</style>'
  + '<div class="g">' + cells + '</div>',
  'web/img/jay/collage.png', 900, 600);
console.log('✅ คอลลาจเมนูชุดใหม่ 6 รูป (ฉากขาว) — ' + kb1 + 'KB');

/* ── ② รูปของแถม ย่อให้พอใช้บนหน้า ── */
const kb2 = shoot(
  '<!doctype html><meta charset="utf-8"><style>*{margin:0;padding:0}'
  + 'body{width:760px;height:560px;background:#fff;display:flex;align-items:center;justify-content:center}'
  + 'img{width:100%;height:100%;object-fit:cover;object-position:center 46%;display:block}</style>'
  + '<img src="' + b64('web/img/jay/gift_1.png') + '">',
  'web/img/jay/gift.png', 760, 560);
console.log('✅ รูปของแถมย่อแล้ว — ' + kb2 + 'KB (ต้นฉบับ 1,469KB)');

console.log('\n✅ เสร็จ');

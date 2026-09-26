/* ติดตั้งหน้าสักการะ /prayer จากชุดที่ ChatGPT ส่งมา (นัทสั่ง 9 ก.ย. 2026)
   ต้นทาง: download/UNDER360-A-HTML-CSS.zip → โฟลเดอร์ site/

   ⚠️ ต่างจากงาน /jay ที่ผ่านมา: อันนี้ไม่ใช่ HTML ไฟล์เดียว แต่เป็นเว็บ Next.js ทั้งชุด
      บรีฟเขาเขียนชัดว่า **ห้ามออกแบบใหม่ ห้ามเปลี่ยนเลย์เอาต์/สี/ฟอนต์/รูป**
      → ผมไม่แตะดีไซน์เลย แก้แค่ 2 อย่างที่ *จำเป็นต้องแก้ ไม่งั้นหน้าไม่ทำงาน*

   ① ที่อยู่ไฟล์อ้างจากรากเว็บ (/_next/, /altar.png, /worship)
      ของเรามีเว็บอยู่ที่รากแล้ว ถ้าปล่อยไว้จะชนกัน (และ /worship จะทับเส้นทางเรา)
      → เติม /prayer/ นำหน้าทุกจุด · ต้องแก้ทั้ง .html .rsc **และไฟล์ .js ด้วย**
        (เช็คแล้วว่า 4 ไฟล์ js มีที่อยู่ฝังอยู่จริง — ถ้าลืมจะพังเฉพาะตอนกดปุ่ม ไม่พังตอนเปิดหน้า)

   ② รูป 4 ใบรวม 8.3MB (altar 2MB + guide 3 ใบ ~6.3MB)
      หน้านี้จะถูกใช้ในแอด/ไลน์ = คนเปิดจากมือถือ · ปล่อยไว้คือคนกดออกก่อนเห็น
      → ย่อด้วย Chrome ให้เหลือขนาดที่ใช้จริง **ไม่แตะสัดส่วน ไม่ครอป** ภาพเหมือนเดิมทุกประการ

   รันซ้ำได้ */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SP = 'C:/Users/PP/AppData/Local/Temp/claude/C--Users-PP-Desktop-under360-system/e0ce4fa5-b4d0-43db-9182-f632f69d694a/scratchpad';
const SRC = SP + '/prayer/UNDER360-A-HANDOFF/site';
const DST = 'web/prayer';

const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
must(fs.existsSync(SRC), 'ไม่เจอโฟลเดอร์ต้นทาง — แตกไฟล์ zip ก่อน');

/* ═══ ① ก๊อปทั้งชุด ═══ */
fs.rmSync(DST, { recursive: true, force: true });
fs.cpSync(SRC, DST, { recursive: true });
const count = d => fs.readdirSync(d, { recursive: true }).filter(f => fs.statSync(path.join(d, f)).isFile()).length;
console.log('① ก๊อปมา ' + count(DST) + ' ไฟล์');

/* ═══ ② เติม /prayer/ นำหน้าที่อยู่ที่อ้างจากรากเว็บ ═══ */
{
  /* เขียนเป็นคู่ตรงๆ ไม่ใช้ regex — เคยโดน backslash หายมาแล้ว 3 รอบวันนี้ */
  const PAIRS = [
    ['"/_next/',          '"/prayer/_next/'],
    ["'/_next/",          "'/prayer/_next/"],
    ['(/_next/',          '(/prayer/_next/'],
    ['"/altar.png',       '"/prayer/altar.png'],
    ['"/under360-logo',   '"/prayer/under360-logo'],
    ['"/guide/',          '"/prayer/guide/'],
    ["'/guide/",          "'/prayer/guide/"],
    ['"/favicon.svg',     '"/prayer/favicon.svg'],
    ['"/icon.svg',        '"/prayer/icon.svg'],
    ['"/worship"',        '"/prayer/worship"'],
    ["'/worship'",        "'/prayer/worship'"],
    ['"/worship.rsc',     '"/prayer/worship.rsc'],
    ['"/index.rsc',       '"/prayer/index.rsc'],
  ];
  const exts = ['.html', '.rsc', '.js', '.json', '.css'];
  let files = 0, hits = 0;
  for (const rel of fs.readdirSync(DST, { recursive: true })) {
    const p = path.join(DST, rel);
    if (!fs.statSync(p).isFile() || !exts.includes(path.extname(p))) continue;
    let t = fs.readFileSync(p, 'utf8'); const before = t;
    for (const [a, b] of PAIRS) {
      if (t.includes(b)) continue;           /* กันเติมซ้ำถ้ารันอีกรอบ */
      const n = t.split(a).length - 1;
      if (n) { t = t.split(a).join(b); hits += n; }
    }
    if (t !== before) { fs.writeFileSync(p, t); files++; }
  }
  console.log('② เติม /prayer/ นำหน้า ' + hits + ' จุด ใน ' + files + ' ไฟล์');
  must(hits > 30, 'แก้ที่อยู่ได้น้อยผิดปกติ (' + hits + ') — โครงอาจไม่ตรงที่คาด');
}

/* ═══ ③ ย่อรูป — ไม่ครอป ไม่เปลี่ยนสัดส่วน ═══ */
{
  const png = p => { const b = fs.readFileSync(p); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), kb: b.length / 1024 }; };
  const b64 = p => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
  const shrink = (file, maxW) => {
    const p = path.join(DST, file);
    if (!fs.existsSync(p)) { console.log('   ⏭️  ไม่มี ' + file); return; }
    const o = png(p);
    if (o.w <= maxW) { console.log('   ⏭️  ' + file + ' เล็กพออยู่แล้ว'); return; }
    const w = maxW, h = Math.round(o.h * maxW / o.w);   /* สัดส่วนเดิมเป๊ะ */
    fs.writeFileSync(SP + '/shot.html',
      '<!doctype html><meta charset="utf-8"><style>*{margin:0;padding:0}'
      + 'body{width:' + w + 'px;height:' + h + 'px;overflow:hidden}'
      + 'img{width:' + w + 'px;height:' + h + 'px;display:block}</style><img src="' + b64(p) + '">');
    execFileSync(CHROME, ['--headless=old', '--disable-gpu', '--hide-scrollbars',
      '--window-size=' + w + ',' + h, '--screenshot=' + SP + '/shot.png',
      'file:///' + SP + '/shot.html'], { stdio: 'ignore' });
    fs.copyFileSync(SP + '/shot.png', p);
    const n = png(p);
    console.log('   ✅ ' + file.padEnd(18) + Math.round(o.kb) + 'KB (' + o.w + 'x' + o.h + ') → '
              + Math.round(n.kb) + 'KB (' + n.w + 'x' + n.h + ')');
  };
  console.log('③ ย่อรูป (สัดส่วนเดิม ไม่ครอป)');
  shrink('altar.png', 1100);
  for (const s of ['guide/step-1.png', 'guide/step-2.png', 'guide/step-3.png']) shrink(s, 900);
}

const total = fs.readdirSync(DST, { recursive: true })
  .filter(f => fs.statSync(path.join(DST, f)).isFile())
  .reduce((s, f) => s + fs.statSync(path.join(DST, f)).size, 0);
console.log('\n✅ ' + DST + ' — ' + count(DST) + ' ไฟล์ · รวม ' + Math.round(total / 1024) + 'KB');

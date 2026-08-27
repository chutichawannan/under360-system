#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// tiang_brochure_card.mjs — โบรชัวร์เมนูสัปดาห์ "แบบการ์ดกริด พื้นเข้ม" (ธีมเทศกาล)
//
// ต่างจาก tiang_brochure.mjs (ตัวลิสต์ซ้าย-รูปขวา พื้นครีม):
//   ตัวนี้เป็น **การ์ดกริด รูปใหญ่ ข้อความใต้รูป พื้นเข้มทอง** — ดีไซน์ที่นัทเลือก 22 ส.ค.
//
// ทำให้อัตโนมัติ: ดึงเมนูจาก DB จริง · ฝังฟอนต์ Noto · โลโก้ตัวจริง · เรนเดอร์ · อัป Storage
// ⚠️ ไม่ hardcode ราคา/ชื่อ — ดึงจาก `menu_items` ทุกครั้ง (ราคาเปลี่ยน ภาพเปลี่ยนตาม)
//
// วิธีใช้:
//   node scripts/tiang_brochure_card.mjs <ชื่อไฟล์> "<รหัส D>" "<รหัส S>" "<รหัสของเพิ่มเติม>" "<หัวเรื่อง>" "<วันไหว้>" "<ช่วงสั่ง>"
//
// ตัวอย่าง:
//   node scripts/tiang_brochure_card.mjs broch_sc_card "D099,D159,D149,D071,D104" \
//     "S099,S159,S149,S071,S104,S133,S183,S051" "BJ1,MC1" \
//     "เมนูสารทจีน" "วันไหว้ พฤหัสบดีที่ 27 สิงหาคม 2569" "สั่งได้ 24 – 30 สิงหาคม"
// ═══════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const [name, dCodes = '', sCodes = '', xCodes = '', title = 'เมนูพิเศษประจำสัปดาห์', sub1 = '', sub2 = '', hArg = '3000', labelsArg = ''] = process.argv.slice(2);

// ── ข้อความหัวหมวด/ท้ายภาพ ──────────────────────────────────────────
// 🔴 27 ส.ค.: เดิมฝัง **ข้อความสารทจีนไว้ตายตัว** ("โต๊ะไหว้ครบชุด" · "ไหว้เสร็จ ยกลงมา…")
//    พอเอามาใช้สัปดาห์ธรรมดา ภาพขึ้นคำว่า "โต๊ะไหว้" ทั้งที่เทศกาลจบไปแล้ว
//    → ย้ายมาเป็นค่าตั้งต้นแบบกลาง ๆ + override ได้ด้วย JSON อาร์กิวเมนต์ที่ 9
//    ตัวอย่างธีมเทศกาล:
//      '{"dTitle":"โต๊ะไหว้ครบชุด · กับข้าว","f1":"ไหว้เสร็จ ยกลงมาเป็นมื้อของครอบครัวได้จริง"}'
const DEFAULT_LABELS = {
  dTitle: 'กับข้าว (ไม่มีข้าว)',
  dSub:   'สำหรับบ้านที่หุงข้าวเองอยู่แล้ว',
  sTitle: 'ข้าวกล่อง',
  sSub:   'คุมโซเดียมและไขมันตามมาตรฐานที่เราทำทุกกล่อง',
  xTitle: 'เพิ่มเติม',
  xSub:   '',
  f1:     'ทำสดวันต่อวัน ส่งถึงบ้าน',
  f2:     'คุมน้ำมันที่เติมเพิ่มไม่เกิน 5 กรัมต่อเมนู ใช้น้ำมันรำข้าว<br>อร่อยพอที่จะกินได้ทุกวันจริง',
  f3:     'สั่งผ่าน LINE @under360 · ส่งทั่วกรุงเทพและปริมณฑล',
};
let L = { ...DEFAULT_LABELS };
if (labelsArg) {
  try { L = { ...L, ...JSON.parse(labelsArg) }; }
  catch (e) { console.error('⚠️ อาร์กิวเมนต์ที่ 9 ไม่ใช่ JSON ที่อ่านได้ — ใช้ข้อความตั้งต้นแทน'); }
}
if (!name) { console.error('ใช้: node scripts/tiang_brochure_card.mjs <ชื่อไฟล์> "<D>" "<S>" "<เพิ่มเติม>" "<หัวเรื่อง>" "<วันไหว้>" "<ช่วงสั่ง>"'); process.exit(1); }

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FONT_DIR = '.scratch/tiang/fonts/static/';
const WORK = '.scratch/tiang/brochure_card';

const face = (f, w) => fs.existsSync(FONT_DIR + f)
  ? `@font-face{font-family:'Noto Sans Thai';font-weight:${w};src:url(data:font/ttf;base64,${fs.readFileSync(FONT_DIR + f).toString('base64')}) format('truetype');}` : '';
const FONT = [face('NotoSansThai-Regular.ttf', 400), face('NotoSansThai-SemiBold.ttf', 600), face('NotoSansThai-Bold.ttf', 700)].filter(Boolean).join('\n');

const LOGO = fs.readFileSync('web/img/u360_logo.svg', 'utf8')
  .replace(/<\?xml[\s\S]*?\?>/, '').replace(/<!--[\s\S]*?-->/g, '').trim()
  .replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, '');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

(async () => {
  // ---------- ดึงเมนูจริงจาก DB ----------
  const all = [dCodes, sCodes, xCodes].filter(Boolean).join(',').split(',').map(c => c.trim()).filter(Boolean);
  const r = await fetch(`${SB}/rest/v1/menu_items?select=code,subcode,name,price,kcal,protein,carb,fat,image_urls,is_available,stock_total&code=in.(${all.join(',')})`,
    { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
  const rows = await r.json();
  const byCode = Object.fromEntries(rows.map(x => [x.code, x]));

  const missing = all.filter(c => !byCode[c]);
  if (missing.length) console.warn('⚠️  ไม่เจอในระบบ:', missing.join(', '));
  const noimg = all.filter(c => byCode[c] && !(byCode[c].image_urls || []).length);
  if (noimg.length) console.warn('⚠️  ไม่มีรูป:', noimg.join(', '));

  const card = (code, i, prefix) => {
    const m = byCode[code]; if (!m) return '';
    const img = (m.image_urls || [])[0] || '';
    const tag = m.subcode || (prefix ? prefix + (i + 1) : m.code);
    return `<div class="c">
      <div class="ph">${img ? `<img src="${img}">` : ''}<span class="tag">${esc(tag)}</span></div>
      <div class="tx">
        <div class="cd">${esc(m.code)}</div>
        <div class="nm">${esc(m.name)}</div>
        ${m.kcal!=null?`<div class="nu">${m.kcal} KCAL · P${m.protein??"-"} · C${m.carb??"-"} · F${m.fat??"-"}</div>`:""}
        <div class="pr">฿${Number(m.price)}</div>
      </div>
    </div>`;
  };

  const sec = (heading, note, codes, cols, prefix) => {
    const list = codes.split(',').map(c => c.trim()).filter(Boolean);
    if (!list.length) return '';
    return `<div class="sec">
      <div class="hd">${esc(heading)}</div>
      ${note ? `<div class="hn">${esc(note)}</div>` : ''}
      <div class="grid g${cols}">${list.map((c, i) => card(c, i, prefix)).join('')}</div>
    </div>`;
  };

  const html = `<meta charset="utf-8"><style>
${FONT}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1040px;font-family:'Noto Sans Thai',sans-serif;
  background:linear-gradient(178deg,#4A1A14 0%,#3A120F 45%,#2C0C0A 100%);
  color:#F6E4C4;padding:46px 40px 40px}
.top{text-align:center;margin-bottom:30px}
.top .lg{width:150px;margin:0 auto 14px}
.top .lg svg{width:100%;height:auto;display:block}
.top .lg svg *{fill:#E7C67C!important}
.t1{font-size:64px;font-weight:700;color:#F3D48A;letter-spacing:-.5px;line-height:1.1}
.t2{font-size:25px;color:#E3C79A;margin-top:8px;opacity:.95}
.pill{display:inline-block;margin-top:16px;border:1.5px solid #C9922F;border-radius:999px;
  background:rgba(201,146,47,.16);padding:9px 30px;font-size:24px;font-weight:600;color:#F3D48A}
.divider{height:1px;background:linear-gradient(90deg,transparent,rgba(201,146,47,.55),transparent);margin:30px 0 24px}

.sec{margin-bottom:34px}
.hd{font-size:31px;font-weight:700;color:#F3D48A;margin-bottom:3px}
.hn{font-size:19px;color:#C9A87C;margin-bottom:16px;opacity:.9}
.grid{display:grid;gap:14px}
.g5{grid-template-columns:repeat(5,1fr)}
.g4{grid-template-columns:repeat(4,1fr)}
.g2{grid-template-columns:repeat(4,1fr)}

.c{background:rgba(255,255,255,.05);border:1px solid rgba(201,146,47,.30);
   border-radius:13px;overflow:hidden;display:flex;flex-direction:column}
.ph{position:relative;aspect-ratio:4/3;background:#2A0C0A;overflow:hidden}
.ph img{width:100%;height:100%;object-fit:cover;object-position:center 48%;display:block}
.tag{position:absolute;left:9px;top:9px;background:rgba(20,6,5,.82);border:1px solid rgba(201,146,47,.6);
  color:#F3D48A;font-size:17px;font-weight:700;border-radius:7px;padding:2px 10px}
.tx{padding:11px 12px 13px;display:flex;flex-direction:column;gap:3px;flex:1}
.cd{font-size:14px;color:#B08A5E;letter-spacing:.5px}
.nm{font-size:19px;font-weight:600;line-height:1.28;color:#F6E4C4;flex:1}
.nu{font-size:15px;color:#C9A87C;letter-spacing:.2px;margin-top:3px}
.pr{font-size:26px;font-weight:700;color:#F3D48A;margin-top:4px}

.foot{margin-top:8px;border-top:1px solid rgba(201,146,47,.4);padding-top:24px;text-align:center}
.f1{font-size:30px;font-weight:700;color:#F3D48A}
.f2{font-size:20px;color:#DCC199;margin-top:8px;line-height:1.5}
.f3{font-size:18px;color:#B99A6E;margin-top:12px}
</style>

<div class="top">
  <div class="lg">${LOGO}</div>
  <div class="t1">${esc(title)}</div>
  ${sub1 ? `<div class="t2">${esc(sub1)}</div>` : ''}
  ${sub2 ? `<div class="pill">${esc(sub2)}</div>` : ''}
</div>
<div class="divider"></div>

${sec(L.dTitle, L.dSub, dCodes, 5, 'D')}
${sec(L.sTitle, L.sSub, sCodes, 4, 'S')}
${sec(L.xTitle, L.xSub, xCodes, 2, '')}

<div class="foot">
  <div class="f1">${esc(L.f1)}</div>
  <div class="f2">${L.f2}</div>
  <div class="f3">${esc(L.f3)}</div>
</div>`;

  fs.mkdirSync(WORK, { recursive: true });
  const built = WORK + '/index.html';
  fs.writeFileSync(built, html, 'utf8');

  // ---------- เรนเดอร์: วัดความสูงจริงก่อน แล้วแคปพอดี (ไม่เหลือขาวท้ายกระดาษ) ----------
  const probe = path.resolve(WORK, '_probe.png');
  execFileSync(CHROME, ['--headless=old', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1', `--window-size=1040,${+hArg}`, `--screenshot=${probe}`,
    '--virtual-time-budget=25000', '--user-data-dir=C:/Users/PP/AppData/Local/Temp/chr_tiang_bc',
    '--dump-dom', 'file:///' + path.resolve(built).replace(/\\/g, '/')], { stdio: 'pipe' });

  const out = path.resolve(WORK, name + '.png');
  execFileSync(CHROME, ['--headless=old', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--force-device-scale-factor=1', `--window-size=1040,${+hArg}`, `--screenshot=${out}`,
    '--virtual-time-budget=25000', '--user-data-dir=C:/Users/PP/AppData/Local/Temp/chr_tiang_bc',
    'file:///' + path.resolve(built).replace(/\\/g, '/')], { stdio: 'pipe' });

  console.log(`🖼️  เรนเดอร์แล้ว · ${(fs.statSync(out).size / 1024).toFixed(0)} KB · เมนู ${rows.length}/${all.length} ตัว`);

  // ⬅ อัปด้วย node fetch ไม่ใช่ curl (27 ส.ค.)
  //    curl บนวินโดวส์ใช้ schannel แล้ว TLS handshake กับ Supabase ล้ม (exit 35 · HTTP 000)
  //    ทั้งที่ DNS/TCP ปกติ และ Chrome กับ node fetch (undici) ต่อได้ตามปกติ
  //    → เลิกใช้ curl กับ Supabase ทั้งหมด
  const dest = `menu-images/broadcast/${name}.png`;
  const pub = `${SB}/storage/v1/object/public/${dest}`;
  try {
    const up = await fetch(`${SB}/storage/v1/object/${dest}`, {
      method: 'POST',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
      body: fs.readFileSync(out),
    });
    const chk = await fetch(pub, { method: 'HEAD' });
    console.log(chk.ok ? `✅ ${pub}` : `❌ อัปแล้วแต่เปิดไม่ได้ · upload ${up.status} · verify ${chk.status}`);
  } catch (e) {
    console.log(`❌ อัปไม่สำเร็จ: ${e.message}`);
    console.log(`   ไฟล์อยู่ที่ ${out} — ฝากห้องอื่นอัปแทนได้`);
  }
  console.log(`📄 ${out}`);
})();

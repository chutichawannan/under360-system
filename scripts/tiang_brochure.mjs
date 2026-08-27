#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// tiang_brochure.mjs — ออกโบรชัวร์เมนูสัปดาห์เป็นไฟล์ PNG (เครื่องมือ 01 แบบสั่งครั้งเดียวจบ)
//
// ทำให้อัตโนมัติ 5 อย่างที่เคยพลาดมาแล้วทุกอัน:
//   1. ก๊อป `web/img/` ไปด้วย → **โลโก้ตัวจริงถึงจะโหลดติด**
//      (หน้าโบรชัวร์ fetch แบบ path สัมพัทธ์ + try/catch เงียบ → เปิดจากที่อื่นจะได้โลโก้สำรองแบบเนียนๆ · นัทจับได้เอง 18 ส.ค.)
//   2. ฝังฟอนต์ Noto Sans Thai ลงไฟล์ (เครื่องไม่มีฟอนต์ → Chrome ตกไป Leelawadee เงียบๆ)
//   3. ซ่อนแถบเครื่องมือ + ซ่อนหัวข้อ "แพคกับข้าว" ถ้าไม่มีรายการ
//   4. เรนเดอร์ `--headless=old` (ห้าม =new → แถบดำ)
//   5. อัป Supabase Storage + verify
//
// วิธีใช้:
//   node scripts/tiang_brochure.mjs <ชื่อไฟล์> [ธีม] [รหัสข้าวกล่อง] [รหัสแพคกับข้าว] [ช่วงวันที่]
//
//   ธีม: default | sartchin
//   เว้นรหัสเป็น "" = ดึงเมนูที่มี subcode อัตโนมัติ (S*/D*)
//
//   ตัวอย่าง:
//     node scripts/tiang_brochure.mjs broch_week default
//     node scripts/tiang_brochure.mjs broch_sartchin sartchin "" "" "24-30 AUGUST 2026"
// ═══════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const [nameArg, themeArg = 'default', sArg = '', dArg = '', subArg = '', hArg = '1700'] = process.argv.slice(2);
if (!nameArg) {
  console.error('ใช้: node scripts/tiang_brochure.mjs <ชื่อไฟล์> [default|sartchin] [รหัส S] [รหัส D] [ช่วงวันที่]');
  process.exit(1);
}

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FONT_DIR = '.scratch/tiang/fonts/static/';
const WORK = '.scratch/tiang/brochure';

// ---------- ฟอนต์ฝังไฟล์ ----------
const face = (f, w) => fs.existsSync(FONT_DIR + f)
  ? `@font-face{font-family:'Noto Sans Thai';font-style:normal;font-weight:${w};src:url(data:font/ttf;base64,${fs.readFileSync(FONT_DIR + f).toString('base64')}) format('truetype');}` : '';
const fontCss = [face('NotoSansThai-Regular.ttf', 400), face('NotoSansThai-SemiBold.ttf', 600), face('NotoSansThai-Bold.ttf', 700)].filter(Boolean).join('\n');

// ---------- ธีม ----------
// 🧧 สารทจีน = เทศกาลไหว้บรรพบุรุษ ไม่ใช่เทศกาลสนุก
//    โทน: ให้เกียรติ อบอุ่น นึกถึงครอบครัว
//    ใช้: เบอร์กันดี + ทองด้าน + ครีม · ลายเมฆจีนบางๆ
//    ❌ ห้าม: แดงสดแบบตรุษจีน · ทองวิบวับ · โคมไฟ/มังกร/ประทัด/อั่งเปา · มุกผี
const THEMES = {
  default: '',
  sartchin: `
    :root{--ink:#4A2418;--red:#7E2F2A;--gold:#B08D3F;--cream:#FBF4E9;--brand:#2B8A3E;}
    #page{background:
      radial-gradient(circle at 12% 0%, rgba(176,141,63,.10) 0 22%, transparent 60%),
      radial-gradient(circle at 88% 100%, rgba(126,47,42,.07) 0 22%, transparent 60%),
      var(--cream)!important;
      border-top:9px solid var(--red);border-bottom:5px solid var(--gold);position:relative;}
    #page::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;
      background:linear-gradient(90deg,transparent,var(--gold) 12%,var(--gold) 88%,transparent);opacity:.55}

    /* ⬅ โลโก้ขึ้นหัวบนสุด กลางหน้า (นัทสั่ง 21 ส.ค.) — แถวเดิมเหลือแค่วันที่ */
    .sc-top{display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:14px}
    .sc-top .sc-logo{width:210px}
    .sc-top .sc-logo svg{width:100%!important;height:auto!important;display:block}
    .top .brand{display:none!important}
    .top{justify-content:center!important;margin-bottom:18px!important}
    .when{text-align:center!important}

    .when .t1{color:var(--ink)!important;opacity:.85}
    .when .t2{color:var(--red)!important}
    .sec h2{color:var(--red)!important}
    .rule{background:linear-gradient(90deg,var(--red),var(--gold) 55%,rgba(176,141,63,.25))!important;opacity:1!important;height:3px!important}
    .foot{color:var(--ink)!important;opacity:.9}
    .foot b{color:var(--red)!important}

    /* ⬅ แก้รูปตกขอบ: เดิม aspect 1/1 + cover ครอปอาหารหลุด → ให้สูงขึ้นและซูมออก */
    .pic{aspect-ratio:4/3!important;background:#fff!important}
    .pic img{object-fit:cover!important;object-position:center 45%!important;transform:scale(1.02)}

    .sc-note{margin:0 0 20px;padding:12px 18px;border-radius:10px;
      background:rgba(126,47,42,.06);border-left:5px solid var(--gold);
      color:var(--ink);font-size:21px;line-height:1.45}
    .sc-note b{color:var(--red)}
    .sc-note em{font-style:normal;color:var(--brand);font-weight:600}  /* ⬅ เขียวแบรนด์ นิดเดียว */
  `,
};
if (!(themeArg in THEMES)) { console.error('ธีมไม่รู้จัก:', themeArg, '· มีให้เลือก:', Object.keys(THEMES).join(' / ')); process.exit(1); }

// ---------- ประกอบไฟล์ ----------
fs.mkdirSync(WORK + '/img', { recursive: true });
fs.copyFileSync('web/img/u360_logo.svg', WORK + '/img/u360_logo.svg');   // ⬅ ข้อ 1: โลโก้ตัวจริง

let html = fs.readFileSync('web/menu_brochure.html', 'utf8');
// ⬅ ตัด filter is_available ออก — เมนูสัปดาห์หน้ายังไม่เปิดขายตอนทำภาพ (นิวเปิดตอนขึ้นเว็บ)
html = html.replace('is_available=eq.true&', '');
html = html.replace('<style>', '<style>\n' + fontCss +
  `\n.bar{display:none!important}body{margin:0;background:#fff}#page{margin:0!important}.sec.hideme{display:none!important}\n` +
  THEMES[themeArg] + '\n');

// ⬅ โลโก้: ฉีด SVG ตรงเข้า HTML เลย ไม่พึ่ง fetch/JS ในหน้า
//    (เดิมก๊อปจาก #logobox แต่เราซ่อน .top .brand ไว้ → getBBox() ได้ 0 → โลโก้ขนาด 0 ไม่ขึ้น)
if (themeArg === 'sartchin') {
  const logo = fs.readFileSync('web/img/u360_logo.svg', 'utf8')
    .replace(/<\?xml[\s\S]*?\?>/, '').replace(/<!--[\s\S]*?-->/g, '').trim()
    .replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, '');
  html = html.replace('<div id="page">',
    '<div id="page"><div class="sc-top"><div class="sc-logo">' + logo + '</div></div>');
}

// ซ่อนหัวข้อแพคกับข้าวถ้าไม่มีรายการ + แทรกแถบธีม
const note = themeArg === 'sartchin'
  ? `const n=document.createElement("div");n.className="sc-note";
     n.innerHTML="<b>เมนูพิเศษประจำสัปดาห์ 24 – 30 สิงหาคม</b> มาใน<em>ธีมสารทจีน</em> — เมนูสำหรับมื้อที่ครอบครัวได้กินพร้อมหน้ากัน";
     const sec=document.querySelector("#page .sec"); if(sec) sec.parentNode.insertBefore(n,sec);`
  : '';
html = html.replace('</script>',
  `  setTimeout(()=>{const d=document.getElementById("listD");
     if(d&&!d.children.length){document.querySelectorAll(".sec")[1].classList.add("hideme");}
     ${note}},3000);\n</script>`);

const built = WORK + '/index.html';
fs.writeFileSync(built, html, 'utf8');

// ---------- ตรวจก่อนเรนเดอร์ (27 ส.ค.) ----------
// 🔴 ที่มา: รอบ 31 ส.ค. ราคาใน DB ถูกแก้ "ระหว่าง" ที่กำลังเรนเดอร์
//    → ภาพ 2 ใบของสัปดาห์เดียวกันพิมพ์ราคาคนละอย่าง (115/120/70/70 vs 125/125/80/80)
//    เกือบส่งราคาผิดถึงลูกค้า 9,800 คน จับได้ตอนเปิดดูภาพเทียบ DB ด้วยตา
// 🔒 กฎราคาขั้นต่ำ (นัทสั่งเอง 27 ส.ค. 18:26):
//    "D ไม่มีอันไหนต่ำกว่า 80 · S ไม่มีอันไหนต่ำกว่า 125 ถ้ามีต่ำกว่านั้นให้ปรับขึ้นมา"
//    ตัวนี้แค่ "เตือน" ไม่แก้ DB ให้ — คนต้องไปแก้เองแล้วรันใหม่
const FLOOR = { S: 125, D: 80 };
{
  const codes = [sArg, dArg].filter(Boolean).join(',').split(',').map(s => s.trim()).filter(Boolean);
  if (codes.length) {
    try {
      const r = await fetch(`${SB}/rest/v1/menu_items?select=code,subcode,name,price,image_urls,stock_total`
        + `&code=in.(${codes.join(',')})&limit=100`, { headers: { apikey: KEY } });
      const rows = await r.json();
      const warn = [];
      for (const c of codes) {
        const m = rows.find(x => x.code === c);
        if (!m) { warn.push(`${c} — ไม่มีในตาราง menu_items`); continue; }
        const kind = c[0].toUpperCase();
        if (FLOOR[kind] && m.price < FLOOR[kind]) warn.push(`${c} ฿${m.price} — ต่ำกว่าขั้นต่ำ ${kind} ฿${FLOOR[kind]} (${m.name})`);
        if (!(Array.isArray(m.image_urls) && m.image_urls[0])) warn.push(`${c} — ไม่มีรูป (${m.name})`);
        if (m.stock_total === 0) warn.push(`${c} — สต็อก 0 (${m.name})`);
      }
      console.log(`🔍 ตรวจก่อนเรนเดอร์: ${rows.length}/${codes.length} เมนู`);
      if (warn.length) {
        console.log('⚠️  เจอที่ต้องดูก่อนส่งภาพออก:');
        warn.forEach(w => console.log('    · ' + w));
        console.log('    (ยังเรนเดอร์ต่อให้ — แต่อย่าเพิ่งยิงจนกว่าจะเคลียร์)');
      } else {
        console.log('   ✅ ราคาผ่านขั้นต่ำ · มีรูปครบ · ไม่มีตัวไหนสต็อก 0');
      }
      console.log('   ราคาที่จะขึ้นภาพ: ' + codes.map(c => {
        const m = rows.find(x => x.code === c); return m ? `${m.subcode || c} ฿${m.price}` : `${c} ?`;
      }).join(' · '));
    } catch (e) { console.log('⚠️ ตรวจก่อนเรนเดอร์ไม่ได้ (' + e.message + ') — เรนเดอร์ต่อ แต่ยังไม่ verify ราคา'); }
  }
}

// ---------- เรนเดอร์ ----------
const qs = new URLSearchParams();
if (sArg) qs.set('s', sArg);
if (dArg) qs.set('d', dArg);
if (subArg) qs.set('sub', subArg);
const url = 'file:///' + path.resolve(built).replace(/\\/g, '/') + (qs.toString() ? '?' + qs : '');
const out = path.resolve(WORK, nameArg + '.png');

execFileSync(CHROME, ['--headless=old', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--force-device-scale-factor=1', `--window-size=1040,${+hArg}`,
  `--screenshot=${out}`, '--virtual-time-budget=25000',
  '--user-data-dir=C:/Users/PP/AppData/Local/Temp/chr_tiang_broch', url], { stdio: 'pipe' });

console.log(`🖼️  เรนเดอร์แล้ว · ธีม ${themeArg} · ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);

// ---------- อัป + verify ----------
// ⬅ อัปด้วย node fetch ไม่ใช่ curl (27 ส.ค.)
//    curl บนวินโดวส์ (schannel) TLS handshake กับ Supabase ล้ม — exit 35 / HTTP 000
//    ทั้งที่ DNS+TCP ปกติ · Chrome และ node fetch (undici) ต่อได้ → เลิกใช้ curl กับ Supabase
const dest = `menu-images/broadcast/${nameArg}.png`;
const pub = `${SB}/storage/v1/object/public/${dest}`;
try {
  const up = await fetch(`${SB}/storage/v1/object/${dest}`, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'image/png', 'x-upsert': 'true' },
    body: fs.readFileSync(out),
  });
  const chk = await fetch(pub, { method: 'HEAD' });
  console.log(chk.ok ? `✅ ${pub}` : `❌ อัปแล้วเปิดไม่ได้ · upload ${up.status} · verify ${chk.status}`);
} catch (e) {
  console.log(`❌ อัปไม่สำเร็จ: ${e.message}`);
  console.log(`   ไฟล์อยู่ที่ ${out} — ฝากห้องอื่นอัปแทนได้`);
}
console.log(`📄 ไฟล์: ${out}`);

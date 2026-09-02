/* คอร์สเจ 2569 รอบแก้ตามที่นัทสั่ง (2 ก.ย. 2026 · นัทส่งภาพมาชี้จุด)

   ① แบนเนอร์หน้าโฮม → ธีมเจ (เหลือง + ตัว 齋 แดง) + ราคาเต็มขีดฆ่า + บอกว่าลดไปเท่าไหร่
   ② หน้า /jay → เอาแถบเขียว (8 ปี / 30 เมนู / 3 ปี) ออก แล้วใส่ "เมนูแยกตามรอบส่ง" แทน

   📌 การแบ่งเมนูลงรอบ = ของจริงจาก docs/J2026_MENU_DATA.csv (ห้องเจส่งมา 2 ก.ย.)
      ตรวจแล้ว: 30 เมนู · รอบ 9/12/9 · T2 กระจาย 5/6/5 · วันส่งตรงกับ J2026_CALENDAR.md
      (ตอนทำรอบแรกไฟล์นี้ยังไม่มา เลยยังแยกรอบไม่ได้)

   ⚠️ ราคาที่เอามาขีดฆ่า = ฿4,490 (ราคาคอร์สปกติ) ไม่ใช่ ฿4,970
      เพราะ ฿4,970 คือ "ถ้าซื้อแยกทีละกล่อง" — เอามาโชว์เป็นราคาเต็มบนแบนเนอร์จะทำให้เข้าใจผิด
      ส่วนต่าง ฿780 ยังโชว์อยู่ในหัวข้อราคาบนหน้า ซึ่งมีคำอธิบายกำกับ
   รันซ้ำได้ */
import fs from 'fs';

/* ── แปลง CSV เป็นข้อมูลที่หน้าเว็บใช้ ── */
function parseCsv(txt) {
  const rows = [];
  let row = [], cell = '', q = false;
  txt = txt.replace(/\r/g, '');
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) {
      if (c === '"' && txt[i+1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.length > 1 && r.join('').trim());
}

const csv = parseCsv(fs.readFileSync('docs/J2026_MENU_DATA.csv', 'utf8'));
const head = csv[0].map(s => s.trim());
const ix = k => head.indexOf(k);
const items = csv.slice(1).map(r => ({
  code: r[ix('code')].trim(),
  name: r[ix('name')].trim(),
  round: Number(r[ix('round')]),
  star: /⭐/.test(r[ix('note')] || '')
}));

if (items.length !== 30) { console.error('❌ ได้ ' + items.length + ' เมนู ควรเป็น 30'); process.exit(1); }
const ROUNDS = [1, 2, 3].map(n => ({
  n,
  ship: { 1:'พฤหัส 8 ต.ค.', 2:'อาทิตย์ 11 ต.ค.', 3:'พฤหัส 15 ต.ค.' }[n],
  eat:  { 1:'ทานวัน ศ 9 – อา 11 ต.ค.', 2:'ทานวัน จ 12 – พฤ 15 ต.ค.', 3:'ทานวัน ศ 16 – อา 18 ต.ค.' }[n],
  items: items.filter(x => x.round === n)
}));
const counts = ROUNDS.map(r => r.items.length).join('/');
if (counts !== '9/12/9') { console.error('❌ จำนวนต่อรอบ ' + counts + ' ควรเป็น 9/12/9'); process.exit(1); }
console.log('  ✅ อ่าน CSV: 30 เมนู · รอบ ' + counts);

/* ═══════════ ② หน้า /jay ═══════════ */
{
  const F = 'web/jay.html';
  const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
  let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
  const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

  /* ── เอาแถบเขียว 8/30/3ปี ออก (นัทกากบาททิ้งในภาพ) ── */
  if (h.includes('class="proof"')) {
    const S = h.indexOf('<!-- ═══ ตัวเลขที่พิสูจน์แล้ว ═══ -->');
    const E = h.indexOf('</section>', S) + '</section>'.length;
    must(S > 0 && E > S, 'ตัดแถบเขียวไม่ได้');
    h = h.slice(0, S) + h.slice(E).replace(/^\n+/, '\n');
    h = h.replace(/\/\* ── ตัวเลขความน่าเชื่อถือ ── \*\/[\s\S]*?\.proof span\{[^}]*\}\n/, '');
    h = h.replace(/\.proof \.g\{grid-template-columns:1fr;gap:22px\}\n?\s*/, '');
    console.log('  ✅ เอาแถบเขียว 8/30/3ปี ออก');
  } else console.log('  ⏭️  เอาแถบเขียวออกแล้ว');

  /* ── เมนูแยกตามรอบส่ง ── */
  if (!h.includes('u360-jay-rounds')) {
    const OLD_S = h.indexOf('<!-- ═══ เมนู ═══ -->');
    const OLD_E = h.indexOf('</section>', OLD_S) + '</section>'.length;
    must(OLD_S > 0, 'ไม่เจอ section เมนู');

    const NEW = `<!-- ═══ เมนู แยกตามรอบส่ง (u360-jay-rounds) ═══ -->
<section id="menus" style="background:var(--soft);border-top:1px solid var(--hair);border-bottom:1px solid var(--hair)">
  <div class="wrap">
    <span class="eyebrow">เมนูทั้งหมด</span>
    <h2 class="sec">30 เมนู ไม่ซ้ำสักมื้อ — รู้ล่วงหน้าว่าได้กินอะไร</h2>
    <p class="lead">แต่ละรอบส่งมาเป็นชุด พร้อมบอกว่าทานวันไหน — ไม่ต้องเดา ไม่ต้องรอลุ้น</p>
    <div id="roundList"></div>
    <p class="foot">⭐ = เมนูที่ครัวตั้งใจให้เป็นตัวชูโรงของคอร์สปีนี้ ·
      ลำดับเมนูภายในรอบครัวอาจสลับได้ตามวัตถุดิบที่ได้ในวันนั้น แต่ <b>ได้ครบทุกเมนูตามรอบแน่นอน</b></p>
  </div>
</section>`;
    h = h.slice(0, OLD_S) + NEW + h.slice(OLD_E);
    console.log('  ✅ เปลี่ยนเป็นเมนูแยกตามรอบส่ง');

    /* CSS */
    h = h.replace('</style>', `/* ── u360-jay-rounds ── */
.rblock{margin-top:26px;background:var(--paper);border:1px solid var(--hair);border-radius:16px;overflow:hidden}
.rhead{background:var(--deep);color:#fff;padding:16px 20px;display:flex;flex-wrap:wrap;
  align-items:baseline;gap:6px 14px}
.rhead .n{font-family:'Prompt';font-weight:700;font-size:1.15rem}
.rhead .s{font-family:'Prompt';font-weight:600;font-size:1rem;opacity:.95}
.rhead .e{font-size:.92rem;opacity:.82}
.rhead .q{margin-left:auto;background:rgba(255,255,255,.18);border-radius:999px;
  padding:4px 13px;font-family:'Prompt';font-weight:600;font-size:.88rem}
.rlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:0}
.rlist .m{display:flex;gap:11px;align-items:flex-start;padding:13px 18px;border-top:1px solid var(--hair);border-radius:0}
.rlist .m .i{font-family:'Prompt';font-weight:600;font-size:.8rem;color:var(--green);
  background:#EDF7EE;border-radius:6px;padding:2px 8px;flex:none;margin-top:3px}
.rlist .m .t{font-size:.97rem;line-height:1.5}
@media(max-width:640px){.rhead .q{margin-left:0}}
</style>`);

    /* JS render */
    const ANCH = "document.getElementById('menuGrid').innerHTML";
    const oldBlock = h.slice(h.indexOf(ANCH), h.indexOf('}).join(\'\');', h.indexOf(ANCH)) + 12);
    must(oldBlock.length > 20, 'ไม่เจอโค้ด render เมนูเดิม');
    h = h.replace(oldBlock, `document.getElementById('roundList').innerHTML = JAY_ROUNDS.map(function(r){
  return '<div class="rblock">'
    + '<div class="rhead"><span class="n">รอบ ' + r.n + '</span>'
    + '<span class="s">ส่ง ' + jEsc(r.ship) + '</span>'
    + '<span class="e">' + jEsc(r.eat) + '</span>'
    + '<span class="q">' + r.items.length + ' กล่อง</span></div>'
    + '<div class="rlist">' + r.items.map(function(m, i){
        return '<div class="m"><div class="i">' + (i+1) + '</div><div class="t">'
             + jEsc(m.name) + (m.star ? ' <span style="color:var(--gold)">⭐</span>' : '')
             + '</div></div>';
      }).join('') + '</div></div>';
}).join('');`);

    /* ข้อมูล */
    const dataJs = 'const JAY_ROUNDS = ' + JSON.stringify(ROUNDS.map(r => ({
      n: r.n, ship: r.ship, eat: r.eat,
      items: r.items.map(x => x.star ? { name: x.name, star: 1 } : { name: x.name })
    })), null, 1) + ';\n';
    const S2 = h.indexOf('const JAY_MENUS = [');
    const E2 = h.indexOf('];', S2) + 3;
    must(S2 > 0, 'ไม่เจอ JAY_MENUS');
    h = h.slice(0, S2) + dataJs + h.slice(E2);
    h = h.replace(/\/\* ═══ เมนู 30 ตัว[\s\S]*?═══ \*\/\n/,
      `/* ═══ เมนู 30 ตัว แยกตามรอบส่ง — ล็อกแล้ว (docs/J2026_MENU_DATA.csv จากห้องเจ)
   สร้างด้วย: node scripts/m_jay_v2.mjs  ← แพลนเปลี่ยนเมื่อไหร่ แก้ CSV แล้วรันใหม่ อย่าแก้มือตรงนี้ ═══ */\n`);
    console.log('  ✅ ฝังข้อมูล 3 รอบ (9/12/9)');
  } else console.log('  ⏭️  มีเมนูรายรอบแล้ว');

  fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
}

/* ═══════════ ① แบนเนอร์หน้าโฮม — ธีมเจ ═══════════ */
{
  const F = 'web/index.html';
  const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
  let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');

  const S = h.indexOf('<!-- ═══ u360-jay-banner');
  const E = h.indexOf('</script>', h.indexOf('<script>', h.indexOf('</style>', S))) + '</script>'.length;
  if (S < 0) { console.error('❌ ไม่เจอแบนเนอร์เดิม'); process.exit(1); }

  const NEW = `<!-- ═══ u360-jay-banner v2 (m · 2 ก.ย. 2026 · นัทสั่งให้เป็นธีมเจ + โชว์ส่วนลด) ═══
     ลบทั้งก้อนนี้เมื่อครบ 50 คอร์ส · หายเองหลัง 18 ต.ค. 2026 (กันลืมถอด) -->
<a class="jaybar" id="jayBar" href="/jay?utm_source=web&utm_medium=banner&utm_campaign=jay2026" hidden>
  <span class="seal">齋</span>
  <span class="txt">
    <b>เปิดจองคอร์สอาหารเจ 2569</b>
    <small>30 กล่อง · 30 เมนูไม่ซ้ำ · ส่งถึงบ้าน 3 รอบ</small>
  </span>
  <span class="price">
    <s>฿4,490</s>
    <em>฿4,190</em>
    <i>ประหยัด ฿300</i>
  </span>
  <span class="go">จองเลย →</span>
</a>
<style>
/* ธีมเทศกาลเจ: เหลือง-แดง — ให้ต่างจากสีเขียวของแบรนด์ จะได้สะดุดตาว่าเป็นของพิเศษตามเทศกาล */
.jaybar{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;
  background:linear-gradient(90deg,#FFD400,#FFC400 55%,#FFB800);color:#3A2A00;
  text-decoration:none;padding:11px 20px;border-bottom:2px solid #E0A800;line-height:1.35}
.jaybar .seal{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;
  background:#D32F2F;color:#fff;border-radius:9px;font-size:1.35rem;font-weight:700;flex:none;
  box-shadow:0 2px 0 rgba(0,0,0,.18)}
.jaybar .txt b{display:block;font-family:'Prompt',sans-serif;font-weight:700;font-size:1.03rem}
.jaybar .txt small{display:block;font-size:.85rem;opacity:.78}
.jaybar .price{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap}
.jaybar .price s{color:#8A6A00;opacity:.75;font-size:1rem}
.jaybar .price em{font-family:'Prompt',sans-serif;font-style:normal;font-weight:700;
  font-size:1.6rem;color:#B71C1C;letter-spacing:-.01em}
.jaybar .price i{font-style:normal;background:#D32F2F;color:#fff;border-radius:999px;
  padding:3px 11px;font-family:'Prompt',sans-serif;font-weight:600;font-size:.82rem}
.jaybar .go{font-family:'Prompt',sans-serif;font-weight:700;font-size:.95rem;
  background:#3A2A00;color:#FFD400;border-radius:999px;padding:8px 18px}
.jaybar:hover{filter:brightness(1.04)}
@media(max-width:760px){
  /* มือถือ: ห้ามสูงจนดันเนื้อหาหลักตกจอ — เคยวัดได้ 114px แล้วสูงเกินไป */
  .jaybar{gap:10px;padding:9px 14px}
  .jaybar .seal{width:32px;height:32px;font-size:1.15rem;border-radius:8px}
  .jaybar .txt b{font-size:.94rem}
  .jaybar .txt small{display:none}
  .jaybar .price em{font-size:1.3rem}
  .jaybar .go{display:none}   /* ทั้งแถบกดได้อยู่แล้ว */
}
@media(max-width:400px){.jaybar .price s{display:none}}
</style>
<script>
/* โชว์เฉพาะช่วงที่ยังขายอยู่ — ผ่าน 18 ต.ค. 2026 แล้วหายเอง ไม่ต้องรอใครมาถอด */
(function(){
  var JAY_BANNER = true;                 /* ครบ 50 คอร์สก่อนกำหนด → ตั้ง false */
  var END = new Date('2026-10-19T00:00:00+07:00').getTime();
  if(JAY_BANNER && Date.now() < END){
    var b = document.getElementById('jayBar'); if(b) b.hidden = false;
  }
})();
</script>`;
  h = h.slice(0, S) + NEW + h.slice(E);
  fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log('  ✅ แบนเนอร์ธีมเจ (齋 แดง + ฿4,490 ขีดฆ่า → ฿4,190 + ประหยัด ฿300)');
}

console.log('\n✅ เสร็จ');

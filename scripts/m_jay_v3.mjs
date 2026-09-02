/* คอร์สเจ รอบ polish ตามที่นัทชี้เป็นข้อๆ จากหน้าพรีวิวมือถือ (2 ก.ย. 2026)

   1-2 โลโก้ร้านยังเล็ก           → ขยายอีกทุกหน้า
   2   แบนเนอร์: ตัด "ประหยัด ฿300" ออก · ราคาเต็มใช้ ฿4,970 · ปุ่มเป็น "สั่งจองคอร์สเจเลย"
   3   หน้า /jay: โลโก้ใหญ่ขึ้น · เลิกตีกรอบวันที่ จัด typography คู่โลโก้
   4   ช่องว่างเปล่าเหนือโลโก้    → ตัดออก
   5   แท็ก 30 กล่อง/3 มื้อ...    → เปลี่ยนเป็น bullet · ปุ่มจองเป็นสีเหลืองเข้าธีมเจ
   6   ปุ่มแถบล่าง                → สีเหลือง
   7   หน้าแรก                    → แทรก section ปฏิทินเมนูรายรอบส่ง

   ⚠️ เรื่องราคา ฿4,970 (นัทใช้คำว่า "หลอกลูกค้า" — ขอทำให้ถูกต้องแทน):
   ฿4,970 เป็นตัวเลขจริงจากตารางราคาของเราเอง = ราคาถ้าซื้อแยกทีละกล่อง 30 กล่อง
   แต่ "ราคาเต็มของคอร์ส" จริงๆ คือ ฿4,490 → ถ้าขีดฆ่า ฿4,970 ลอยๆ ลูกค้าจะเข้าใจว่า
   คอร์สนี้ปกติขาย 4,970 ซึ่งไม่จริง เลยติดป้ายกำกับ "ซื้อแยกรายกล่อง" ไว้ข้างหน้าเสมอ
   → ได้เอฟเฟกต์ส่วนต่างที่ใหญ่ขึ้นตามที่นัทต้องการ โดยไม่ต้องพูดสิ่งที่ไม่จริง
   รันซ้ำได้ */
import fs from 'fs';

const PAGES = ['web/index.html', 'web/mealplan.html', 'web/blog.html', 'web/pack.html', 'web/jay.html'];
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const rd = f => ({ crlf: fs.readFileSync(f, 'utf8').includes('\r\n'), h: fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n') });
const wr = (f, o) => fs.writeFileSync(f, o.crlf ? o.h.replace(/\n/g, '\r\n') : o.h);

/* ═══ 1. โลโก้ร้านใหญ่ขึ้นอีก (นัทบอกยังเล็กอยู่) ═══ */
for (const F of PAGES) {
  const o = rd(F);
  if (!o.h.includes('height:38px!important')) { console.log('⏭️  ' + F + ' ขยายแล้ว'); continue; }
  o.h = o.h.replace('width:auto!important;height:38px!important;', 'width:auto!important;height:48px!important;');
  o.h = o.h.replace('header .logo img,.nav .logo img{height:30px!important}', 'header .logo img,.nav .logo img{height:38px!important}');
  wr(F, o);
  console.log('✅ โลโก้ร้าน ' + F.replace('web/', '') + ' 38 → 48px (มือถือ 30 → 38px)');
}

/* ═══ 2. แบนเนอร์หน้าโฮม ═══ */
{
  const F = 'web/index.html'; const o = rd(F);
  const OLD_PRICE = /<span class="price">[\s\S]*?<\/span>\s*<span class="go"[^>]*>[\s\S]*?<\/span>/;
  must(OLD_PRICE.test(o.h), 'ไม่เจอบล็อกราคาในแบนเนอร์');
  o.h = o.h.replace(OLD_PRICE, `<span class="price">
    <span class="was"><small>ซื้อแยกรายกล่อง</small><s style="font-size:1.05rem!important">฿4,970</s></span>
    <em style="font-size:2rem!important">฿4,190</em>
  </span>
  <span class="go" style="font-size:.95rem!important">สั่งจองคอร์สเจเลย →</span>`);

  /* ป้าย "ประหยัด" ไม่ใช้แล้ว + จัดกลุ่มราคาใหม่ */
  o.h = o.h.replace(/\.jaybar \.price i\{[^}]*\}\n?/, '');
  o.h = o.h.replace(/\.jaybar \.price\{[^}]*\}/,
    `.jaybar .price{display:flex;align-items:center;gap:10px;flex-wrap:nowrap}
.jaybar .price .was{display:flex;flex-direction:column;line-height:1.1}
.jaybar .price .was small{font-size:.66rem!important;opacity:.7;letter-spacing:.02em}
.jaybar .price s{color:#8A6A00;opacity:.8;text-decoration-thickness:2px}`);
  o.h = o.h.replace(/\.jaybar \.price i\{padding:2px 8px;font-size:\.72rem!important\}\n?/, '');
  o.h = o.h.replace('.jaybar .price s{display:none}          /* จอแคบ โชว์ราคาลดพอ ไม่งั้นเบียดจนอ่านไม่ออก */',
                    '.jaybar .price .was small{display:none}   /* จอแคบ เหลือแค่ตัวเลขขีดฆ่า */');
  wr(F, o);
  console.log('✅ แบนเนอร์: ตัดป้ายประหยัดออก · ราคาเต็ม ฿4,970 (มีป้ายกำกับ "ซื้อแยกรายกล่อง") · ปุ่ม "สั่งจองคอร์สเจเลย"');
}

/* ═══ 3-6. หน้า /jay ═══ */
{
  const F = 'web/jay.html'; const o = rd(F);

  /* ③④ หัวเรื่อง: โลโก้ใหญ่ + วันที่ไม่ตีกรอบ + ตัดช่องว่างบน */
  const OLD = `    <div class="jayhead">
      <img src="/img/jay/jay-logo.svg" alt="ธงเจ" class="jaylogo" width="76" height="119">
      <span class="tag">เทศกาลกินเจ 10 – 18 ตุลาคม 2569</span>
    </div>`;
  must(o.h.includes(OLD), 'ไม่เจอหัวเรื่อง /jay');
  o.h = o.h.replace(OLD, `    <div class="jayhead">
      <img src="/img/jay/jay-logo.svg" alt="ธงเจ" class="jaylogo" width="104" height="163">
      <div class="jaydate">
        <span class="k">เทศกาลกินเจ</span>
        <strong>10 – 18 ตุลาคม</strong>
        <span class="y">2569</span>
      </div>
    </div>`);
  o.h = o.h.replace(/\.jayhead\{[^}]*\}/, '.jayhead{display:flex;align-items:center;gap:18px;margin-bottom:22px}');
  o.h = o.h.replace(/\.jaylogo\{width:76px;[^}]*\}/, '.jaylogo{width:104px;height:auto;flex:none;filter:drop-shadow(0 3px 10px rgba(0,0,0,.16))}');
  o.h = o.h.replace('.jayhead .tag{margin-bottom:0}', `.jaydate{line-height:1.2}
.jaydate .k{display:block;font-family:'Prompt';font-weight:600;font-size:.8rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--muted)}
.jaydate strong{display:block;font-family:'Prompt';font-weight:700;font-size:1.7rem;
  color:var(--deep);letter-spacing:-.02em;margin-top:2px}
.jaydate .y{display:block;font-family:'Prompt';font-weight:600;font-size:1rem;color:var(--green)}`);
  o.h = o.h.replace('@media(max-width:600px){.jaylogo{width:58px}}',
    `@media(max-width:600px){
  .jaylogo{width:76px}
  .jayhead{gap:14px;margin-bottom:18px}
  .jaydate strong{font-size:1.32rem}
}`);
  /* ④ ช่องว่างเปล่าเหนือโลโก้ */
  o.h = o.h.replace('.hero{background:linear-gradient(160deg,#F2F9F3,#FFFFFF 62%);border-bottom:1px solid var(--hair);\n  padding:56px 0 60px}',
    `.hero{background:linear-gradient(160deg,#F2F9F3,#FFFFFF 62%);border-bottom:1px solid var(--hair);
  padding:30px 0 52px}
@media(max-width:600px){.hero{padding:20px 0 40px}}`);
  console.log('✅ /jay หัวเรื่อง: โลโก้ 76 → 104px · วันที่เลิกตีกรอบ ใช้ typography แทน · ตัดช่องว่างบน');

  /* ⑤ แท็ก → bullet */
  const OLDF = `    <div class="facts">
      <span>30 กล่อง</span>
      <span>3 มื้อต่อวัน</span>
      <span>ส่งถึงบ้าน 3 รอบ</span>
      <span>โปรตีน 25g* ต่อกล่อง</span>
      <span>ส่งทั่วไทย</span>
    </div>`;
  must(o.h.includes(OLDF), 'ไม่เจอแท็ก facts');
  o.h = o.h.replace(OLDF, `    <ul class="facts">
      <li><b>30 กล่อง</b> ครบทั้งเทศกาล</li>
      <li><b>3 มื้อต่อวัน</b> เช้า กลางวัน เย็น</li>
      <li><b>ส่งถึงบ้าน 3 รอบ</b> ไม่ต้องรอรับทุกวัน</li>
      <li><b>โปรตีน 25g*</b> ต่อกล่อง</li>
      <li><b>ส่งทั่วไทย</b> ต่างจังหวัดราคาเดียวกัน</li>
    </ul>`);
  o.h = o.h.replace(/\.facts\{[^}]*\}\n\.facts span\{[^}]*\}/,
    `.facts{list-style:none;margin-top:24px;display:grid;gap:9px;max-width:44ch}
.facts li{position:relative;padding-left:26px;font-size:1rem;color:var(--muted)}
.facts li b{color:var(--ink);font-family:'Prompt';font-weight:600}
.facts li::before{content:'';position:absolute;left:6px;top:.62em;width:8px;height:8px;
  border-radius:50%;background:var(--green)}`);
  console.log('✅ /jay: แท็ก → bullet');

  /* ⑤⑥ ปุ่มจองเป็นสีเหลืองเข้าธีมเจ */
  o.h = o.h.replace(/class="btn-line" onclick="return jayOrder/g, 'class="btn-line btn-jay" onclick="return jayOrder');
  o.h = o.h.replace('</style>', `/* ปุ่มจองคอร์สเจ — สีเหลืองเข้าธีมเทศกาล (นัทสั่ง) ไม่ใช่เขียว LINE เหมือนหน้าอื่น */
.btn-jay{background:linear-gradient(180deg,#FFD400,#FFC000)!important;color:#3A2A00!important;
  box-shadow:0 4px 14px rgba(224,168,0,.42)}
.btn-jay:hover{background:linear-gradient(180deg,#FFDE33,#FFCA1A)!important;color:#3A2A00!important}
.sticky .btn-jay{box-shadow:none}
</style>`);
  wr(F, o);
  console.log('✅ /jay: ปุ่มจองทุกจุด (รวมแถบล่าง) เป็นสีเหลือง');
}

/* ═══ 7. หน้าแรก — แทรก section ปฏิทินเมนูรายรอบส่ง ═══ */
{
  /* ดึงข้อมูลรอบจากไฟล์เดียวกับหน้า /jay — ห้ามพิมพ์ซ้ำ ไม่งั้นวันหลังแก้ที่เดียวไม่ครบ */
  const jay = fs.readFileSync('web/jay.html', 'utf8').replace(/\r\n/g, '\n');
  const S = jay.indexOf('const JAY_ROUNDS = ');
  const E = jay.indexOf('\n];', S) + 3;
  must(S > 0, 'ไม่เจอ JAY_ROUNDS ใน jay.html');
  const DATA = jay.slice(S, E);

  const F = 'web/index.html'; const o = rd(F);
  if (o.h.includes('u360-jay-calendar')) { console.log('⏭️  หน้าแรกมี section ปฏิทินแล้ว'); }
  else {
    const A = '<footer';
    must(o.h.includes(A), 'ไม่เจอ footer หน้าแรก');
    o.h = o.h.replace(A, `<!-- ═══ u360-jay-calendar — ปฏิทินเมนูคอร์สเจรายรอบส่ง (นัทสั่งแทรก 2 ก.ย.)
     หายเองหลัง 18 ต.ค. 2569 พร้อมแบนเนอร์ · ลบทั้งก้อนได้เมื่อจบเทศกาล ═══ -->
<section id="jaycal" hidden>
  <div class="wrap">
    <div class="jc-head">
      <img src="/img/jay/jay-logo.svg" alt="ธงเจ" width="64" height="100">
      <div>
        <h2 class="sec">คอร์สเจ 2569 — ได้กินอะไรบ้าง</h2>
        <p>30 กล่อง ไม่ซ้ำสักมื้อ ส่งถึงบ้าน 3 รอบ · เทศกาล 10 – 18 ตุลาคม</p>
      </div>
    </div>
    <div class="jc-rounds" id="jcRounds"></div>
    <div style="text-align:center;margin-top:26px">
      <a class="jc-btn" href="/jay?utm_source=web&utm_medium=homesection&utm_campaign=jay2026">ดูรายละเอียดคอร์สเจ →</a>
    </div>
  </div>
</section>
<style>
#jaycal{padding:52px 0;background:linear-gradient(180deg,#FFFBE8,#FFF7D6)}
.jc-head{display:flex;align-items:center;gap:18px;margin-bottom:24px}
.jc-head img{width:64px;height:auto;flex:none}
.jc-head p{color:var(--muted,#6B7280);margin-top:4px}
.jc-rounds{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
.jc-r{background:#fff;border:1px solid #EDE3BD;border-radius:14px;overflow:hidden}
.jc-r summary{list-style:none;cursor:pointer;padding:14px 16px;background:#FFF3C4;
  display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.jc-r summary::-webkit-details-marker{display:none}
.jc-r summary .n{font-family:'Prompt',sans-serif;font-weight:700;font-size:1.02rem!important;color:#7A5A00}
.jc-r summary .d{font-size:.9rem!important;color:#8A6A00}
.jc-r summary .q{margin-left:auto;font-family:'Prompt',sans-serif;font-weight:600;font-size:.84rem!important;
  background:#7A5A00;color:#FFD400;border-radius:999px;padding:3px 11px}
.jc-r ol{margin:0;padding:10px 16px 14px 34px}
.jc-r li{font-size:.94rem!important;line-height:1.5;margin-top:5px;color:#3A3A33}
.jc-btn{display:inline-block;background:#7A5A00;color:#FFD400!important;text-decoration:none;
  font-family:'Prompt',sans-serif;font-weight:700;font-size:1rem!important;padding:14px 30px;border-radius:999px}
.jc-btn:hover{background:#5E4600}
@media(max-width:600px){.jc-head img{width:52px}.jc-head{gap:14px}}
</style>
<script>
(function(){
  var END = new Date('2026-10-19T00:00:00+07:00').getTime();
  if(Date.now() >= END) return;              /* จบเทศกาลแล้ว ไม่ต้องโชว์ */
  ${DATA}
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  document.getElementById('jcRounds').innerHTML = JAY_ROUNDS.map(function(r, i){
    return '<details class="jc-r"' + (i===0 ? ' open' : '') + '>'
      + '<summary><span class="n">รอบ ' + r.n + '</span>'
      + '<span class="d">ส่ง ' + esc(r.ship) + '</span>'
      + '<span class="q">' + r.items.length + ' กล่อง</span></summary>'
      + '<ol>' + r.items.map(function(m){
          return '<li>' + esc(m.name) + (m.star ? ' ⭐' : '') + '</li>'; }).join('') + '</ol>'
      + '</details>';
  }).join('');
  document.getElementById('jaycal').hidden = false;
})();
</script>

` + A);
    wr(F, o);
    console.log('✅ หน้าแรก: แทรก section ปฏิทินเมนูคอร์สเจรายรอบส่ง (หายเองหลัง 18 ต.ค.)');
  }
}

console.log('\n✅ เสร็จ');

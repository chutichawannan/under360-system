/* Polish เว็บสาธารณะ (m-track 20 ส.ค. 2026) — นัทสั่ง "เว็บยังไม่ได้ polish"
   ทำกับ web/index.html ตัวจริง (v0.3 เป็นแค่ร่างทดลอง — เอาของดีมาใช้ + แก้ตัวเลขให้ถูก)

   🔴 ตัวเลขแก้ตามที่นัทยืนยันเอง 20 ส.ค.:
      ลูกค้า 8,000 → 80,000 (เลขใน DB = เท่าที่ migrate ไม่ใช่เท่าที่ขายจริง)
      เพิ่ม "105 เมนูให้เลือกวันนี้" + "คลัง 600+ สูตร" = ตัวเลขที่คู่แข่งอ้างตามไม่ได้
      (CK ให้ลูกค้าเลือกได้ 3 จาน/วัน และเขียนเองว่า "ไม่สามารถเปลี่ยนรายวันได้")
   รันซ้ำได้ — ถ้า patch แล้วจะข้าม */
import fs from 'fs';

const F = 'web/index.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
const before = h.length;
const must = (c, m) => { if (!c) { console.error('❌ patch พลาด:', m); process.exit(1); } };
let n = 0;
const did = m => { console.log('  ✅', m); n++; };

if (h.includes('u360-polish-v04')) { console.log('⏭️  polish แล้ว ไม่ทำซ้ำ'); process.exit(0); }

/* ═══ 1) CSS ที่ของใหม่ต้องใช้ ═══ */
const CSS_ANCHOR = '/* ── trust strip (hero) ── */';
must(h.includes(CSS_ANCHOR), 'ไม่เจอ anchor CSS');
h = h.replace(CSS_ANCHOR, `/* ══ u360-polish-v04 ══ */
.benefits{display:flex;flex-direction:column;gap:11px;margin:20px 0 22px}
.benefit{display:flex;gap:12px;align-items:flex-start}
.benefit .ic{flex:none;width:34px;height:34px;border-radius:10px;background:rgba(159,227,174,.15);display:flex;align-items:center;justify-content:center;font-size:1.05rem}
.benefit b{font-family:'Prompt';font-weight:600;color:#fff;font-size:.98rem;display:block;line-height:1.4}
.benefit span{font-size:.88rem;color:rgba(250,246,236,.7)}
.pricetag{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;background:var(--chili);color:#fff;border-radius:50%;width:104px;height:104px;text-align:center;box-shadow:0 8px 24px rgba(214,75,42,.4);transform:rotate(-6deg);flex:none}
.pricetag small{font-size:.72rem;opacity:.92;font-family:'Prompt'}
.pricetag b{font-family:'Prompt';font-weight:700;font-size:1.5rem;line-height:1.1}
.pricetag i{font-style:normal;font-size:.7rem;opacity:.92}
.hero-price{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
.proof{background:var(--deep);color:var(--cream);padding:34px 0}
.proof .wrap{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;text-align:center}
.proof b{display:block;font-family:'Prompt';font-weight:700;font-size:1.9rem;color:#9FE3AE;line-height:1.2}
.proof span{font-size:.9rem;color:rgba(250,246,236,.75)}
@media(max-width:760px){.proof .wrap{grid-template-columns:repeat(2,1fr);gap:24px 14px}.proof b{font-size:1.6rem}}
.ship{width:100%;border-collapse:collapse;margin-top:22px;background:var(--paper);border-radius:var(--radius);overflow:hidden;font-size:.95rem}
.ship th,.ship td{padding:13px 16px;text-align:left;border-bottom:1px solid rgba(20,56,35,.08)}
.ship th{background:rgba(46,125,67,.09);font-family:'Prompt';color:var(--deep)}
.ship td b{font-family:'Prompt';color:var(--deep)}
.ship tr:last-child td{border-bottom:0}
.ship .free{color:var(--green);font-family:'Prompt';font-weight:700}
.sticky-cta{position:fixed;left:0;right:0;bottom:0;z-index:80;background:var(--deep);padding:10px 14px;display:none;gap:10px;align-items:center;box-shadow:0 -6px 20px rgba(0,0,0,.28)}
.sticky-cta p{flex:1;color:var(--cream);font-size:.84rem;line-height:1.35;margin:0}
.sticky-cta p b{font-family:'Prompt';color:#9FE3AE}
.sticky-cta a{white-space:nowrap;background:var(--line);color:#fff;text-decoration:none;font-family:'Prompt';font-weight:600;font-size:.92rem;padding:12px 18px;border-radius:999px;min-height:44px;display:flex;align-items:center}
@media(max-width:760px){.sticky-cta{display:flex}body{padding-bottom:70px}}
/* นิ้วกดง่ายขึ้น — ปุ่ม/ลิงก์สำคัญสูงอย่างน้อย 44px ตามมาตรฐานมือถือ */
@media(max-width:760px){.btn,.cta,a.btn-line,.hero-cta a{min-height:44px;display:inline-flex;align-items:center;justify-content:center}}

${CSS_ANCHOR}`);
did('CSS ของใหม่');

/* ═══ 2) hero: แถบตัวเลข → ลิสต์ประโยชน์ (ตัวเลขย้ายลงไปแถบ proof ที่แก้เลขถูกแล้ว) ═══ */
const TRUST = `      <div class="trust">
        <span><b>10 ปี</b> ทำครัวเอง</span>
        <span><b>8,000+</b> ลูกค้าที่เคยสั่ง</span>
        <span><b>13,000+</b> ครั้งที่ส่งถึงบ้าน</span>
      </div>`;
must(h.includes(TRUST), 'ไม่เจอ trust strip');
h = h.replace(TRUST, `      <div class="benefits">
        <div class="benefit"><div class="ic">🍱</div><div><b>เลือกเมนูเองได้ทุกกล่อง</b><span>ไม่ใช่เมนูที่ร้านจัดมาให้ — วันนี้มีให้เลือกกว่า 100 เมนู</span></div></div>
        <div class="benefit"><div class="ic">🥩</div><div><b>โปรตีนแน่นทุกกล่อง 120–170 g</b><span>อิ่มจริง ไม่ใช่ผักล้วนโรยไก่</span></div></div>
        <div class="benefit"><div class="ic">🚫</div><div><b>ตัดของแพ้ให้อัตโนมัติ</b><span>แจ้งครั้งเดียว ระบบจำไว้ตลอด</span></div></div>
        <div class="benefit"><div class="ic">📱</div><div><b>สั่งเองได้ 24 ชม. จบในแอป</b><span>เห็นเมนู ราคา ค่าส่ง ก่อนจ่าย — ไม่ต้องรอแอดมินตอบ</span></div></div>
        <div class="benefit"><div class="ic">🚚</div><div><b>เซ็ตและ Meal Plan ส่งฟรี ไม่มีขั้นต่ำ</b><span>สั่งทีละกล่องก็ส่ง ร้านช่วยออกค่าส่งให้ส่วนหนึ่งเสมอ</span></div></div>
      </div>`);
did('hero → ลิสต์ประโยชน์ 5 ข้อ');

/* ═══ 3) ป้ายราคาเริ่มต้น ═══ */
must(h.includes('      <div class="hero-cta">'), 'ไม่เจอ hero-cta');
h = h.replace('      <div class="hero-cta">', `      <div class="hero-price">
        <div class="pricetag"><small>เริ่มเพียง</small><b>฿125</b><i>ต่อกล่อง</i></div>
        <div style="color:rgba(250,246,236,.8);font-size:.95rem;max-width:22em">สั่งทีละกล่องก็ได้ <b style="color:#fff">ไม่ต้องสมัครคอร์ส</b><br>อยากลองยาว → <b style="color:#9FE3AE">เซ็ตเริ่ม ฿1,350 ส่งฟรี</b></div>
      </div>
      <div class="hero-cta">`);
did('ป้ายราคา ฿125');

/* ═══ 4) แถบตัวเลข — ใช้เลขจริงที่นัทยืนยัน + เลขที่คู่แข่งอ้างตามไม่ได้ ═══ */
must(h.includes('<!-- FACTS -->'), 'ไม่เจอ FACTS');
h = h.replace('<!-- FACTS -->', `<!-- SOCIAL PROOF (u360-polish-v04) -->
<div class="proof">
  <div class="wrap">
    <div><b>80,000+</b><span>ลูกค้าสะสมตลอด 10 ปี</span></div>
    <div><b>100+</b><span>เมนูให้เลือกวันนี้</span></div>
    <div><b>600+</b><span>สูตรในคลังครัวเรา</span></div>
    <div><b>24 ชม.</b><span>สั่งเองได้ ไม่ต้องรอใครตอบ</span></div>
  </div>
</div>

<!-- FACTS -->`);
did('แถบตัวเลข (80,000+ / 100+ / 600+ / 24 ชม.)');

/* ═══ 5) ค่าส่ง — ตารางชัด ไม่ต้องทักถาม ═══ */
const dm = h.match(/<!-- DELIVERY -->[\s\S]*?<\/section>/);
must(dm, 'ไม่เจอ section DELIVERY');
h = h.replace(dm[0], `<!-- DELIVERY (u360-polish-v04) -->
<section id="delivery" class="deliv">
  <div class="wrap">
    <p class="eyebrow">Delivery</p>
    <h2 class="sec">ค่าส่งเท่าไหร่? ดูได้เลย ไม่ต้องทักถาม</h2>
    <p style="color:var(--muted);margin-top:10px;max-width:680px">เราคิดค่าส่งจาก<b>ระยะขับจริงจากครัว</b> ไม่ใช่เหมาเป็นโซน — ยิ่งใกล้ยิ่งถูก และ<b>ร้านช่วยออกส่วนที่เกินให้เสมอ</b></p>
    <div class="sets-wrap">
      <table class="ship">
        <thead><tr><th>แบบที่สั่ง</th><th>ค่าส่ง</th><th>หมายเหตุ</th></tr></thead>
        <tbody>
          <tr><td><b>Meal Plan ทุกแพ็ค</b></td><td class="free">ส่งฟรี</td><td>ไม่มีขั้นต่ำ · ฟรีทุกรอบส่ง</td></tr>
          <tr><td><b>เซ็ต / คอร์ส ทุกตัว</b></td><td class="free">ส่งฟรี</td><td>Diet Set · Protein Pack · โบนบรอธ</td></tr>
          <tr><td>สั่งทีละกล่อง — ไม่เกิน 5 กม. จากครัว</td><td><b>฿22–30</b></td><td>คลองสาน ธนบุรี สาทร ฯลฯ</td></tr>
          <tr><td>สั่งทีละกล่อง — 5–10 กม.</td><td><b>฿30–55</b></td><td>สีลม พระราม 3 ปิ่นเกล้า</td></tr>
          <tr><td>สั่งทีละกล่อง — 10–15 กม.</td><td><b>฿55–90</b></td><td>สุขุมวิทตอนต้น ลาดพร้าว</td></tr>
          <tr><td>สั่งทีละกล่อง — ไกลกว่านั้น</td><td><b>สูงสุด ฿200</b></td><td>ไกลแค่ไหนก็ไม่เกินนี้ ส่วนเกินร้านออกให้</td></tr>
          <tr><td>ต่างจังหวัด (ฟรีซแพ็ค)</td><td><b>~฿200</b></td><td>ส่งทั่วไทย รถควบคุมอุณหภูมิ</td></tr>
        </tbody>
      </table>
    </div>
    <p style="color:var(--muted);font-size:.9rem;margin-top:12px">💡 เลือก <b>"รับได้ตลอดวัน"</b> ลดค่าส่งอีก ฿10 · ตัวเลขจริงคำนวณให้เห็นตอนปักหมุดที่อยู่ <b>ก่อนจ่ายเงิน</b> — ไม่มีบวกทีหลัง</p>
    <div class="dcards" style="margin-top:26px">
      <div><h3>🛵 กรุงเทพ + ปริมณฑล — ปรุงสดรายวัน</h3><p>ส่งด้วยแมสเซนเจอร์ของร้าน จันทร์–เสาร์ · สั่งล่วงหน้า 1 วัน · แจ้งช่วงเวลาที่สะดวกรับได้ · Meal Plan ทำสดส่งช่วงบ่าย จันทร์ พุธ ศุกร์</p></div>
      <div><h3>🚚 ทั่วประเทศ — ฟรีซแพ็ค</h3><p>แพ็คกับข้าวปรุงเสร็จแช่แข็งทันที ส่งด้วยรถควบคุมอุณหภูมิถึงหน้าบ้าน · อยู่ไกลหรืออยากตุนไว้ทาน เลือกแบบนี้</p></div>
    </div>
  </div>
</section>`);
did('ตารางค่าส่งทุกระยะ');

/* ═══ 6) แถบสั่งซื้อติดล่างจอมือถือ ═══ */
must(h.includes('</body>'), 'ไม่เจอ </body>');
h = h.replace('</body>', `<div class="sticky-cta">
  <p><b>ข้าวกล่องเริ่ม ฿125</b> · สั่งเองได้ 24 ชม.</p>
  <a href="#" onclick="return orderNow(this)">สั่งใน LINE</a>
</div>
</body>`);
did('แถบสั่งซื้อติดล่างจอ (มือถือ)');

/* ═══ 7) alt รูป — Google อ่านรูปอาหารไม่ออกถ้าไม่มี alt (เสียโอกาส image search) ═══ */
let altSet = 0;
h = h.replace(/(<td class="sthumb"><img src="[^"]+" alt=)""([^>]*><\/td><td><b>)([^<]+)(<\/b>)/g,
  (_, a, b, name, c) => { altSet++; return `${a}"${name.trim()} — Under360"${b}${name}${c}`; });
must(altSet >= 5, `เติม alt เซ็ตได้แค่ ${altSet} รูป`);
did(`alt รูปเซ็ต ${altSet} รูป`);

const BCOVER = `<div class="bcover"><img src="\${p.cover}" alt="" loading="lazy"`;
must(h.includes(BCOVER), 'ไม่เจอ template ปกบทความ');
h = h.replace(BCOVER, `<div class="bcover"><img src="\${p.cover}" alt="\${String(p.title||'').replace(/"/g,'')}" loading="lazy"`);
did('alt ปกบทความ (ใช้ชื่อบทความ)');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log(`\n✅ polish เสร็จ ${n} จุด — ${before} → ${h.length} ตัวอักษร (+${h.length - before})`);

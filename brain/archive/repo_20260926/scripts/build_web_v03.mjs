/* สร้างเว็บ v0.3 จาก index.html — ไม่ทับของเดิม (นัทขอดูก่อน)
   เรฟ: Calories Killer (คู่แข่ง) + Recipe Tour Guide (ฝรั่ง) + ของเราเอง
   รันซ้ำได้: cp ใหม่จาก index.html ทุกครั้งแล้ว patch */
import fs from 'fs';
const SRC='web/index.html', OUT='web/v03.html';
fs.copyFileSync(SRC,OUT);
/* ไฟล์ในเครื่องเป็น CRLF (Windows) — ต้อง normalize ก่อน ไม่งั้น match ไม่เจอเงียบๆ */
let h=fs.readFileSync(OUT,'utf8').replace(/\r\n/g,'\n'); const before=h.length;
const must=(cond,msg)=>{ if(!cond){ console.error('❌ patch พลาด:',msg); process.exit(1);} };

/* 1) CSS ใหม่ */
const cssAnchor='/* ── trust strip (hero) ── */';
must(h.includes(cssAnchor),'ไม่เจอ anchor CSS');
h=h.replace(cssAnchor,`/* ══ v0.3 ══ benefit list มีไอคอน (เรฟฝรั่ง — อ่าน 3 วิเข้าใจ) */
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
.sticky-cta a{white-space:nowrap;background:var(--line);color:#fff;text-decoration:none;font-family:'Prompt';font-weight:600;font-size:.92rem;padding:11px 18px;border-radius:999px}
@media(max-width:760px){.sticky-cta{display:flex}body{padding-bottom:66px}}

${cssAnchor}`);

/* 2) hero: trust strip เดิม → benefit list */
const trustOld=`      <div class="trust">
        <span><b>10 ปี</b> ทำครัวเอง</span>
        <span><b>8,000+</b> ลูกค้าที่เคยสั่ง</span>
        <span><b>13,000+</b> ครั้งที่ส่งถึงบ้าน</span>
      </div>`;
must(h.includes(trustOld),'ไม่เจอ trust strip');
h=h.replace(trustOld,`      <div class="benefits">
        <div class="benefit"><div class="ic">🧠</div><div><b>ไม่ต้องคิดเมนูเอง ไม่ต้องทำเอง</b><span>ครัวจัดให้ตามเป้าหมาย เมนูหมุนเวียนไม่ซ้ำจำเจ</span></div></div>
        <div class="benefit"><div class="ic">🥩</div><div><b>โปรตีนแน่นทุกกล่อง 120–170 g</b><span>อิ่มจริง ไม่ใช่ผักล้วนโรยไก่</span></div></div>
        <div class="benefit"><div class="ic">🚫</div><div><b>ตัดของแพ้ให้อัตโนมัติ</b><span>แจ้งครั้งเดียว ระบบจำไว้ตลอด</span></div></div>
        <div class="benefit"><div class="ic">📱</div><div><b>สั่งเองได้ 24 ชม. จบในแอป</b><span>เห็นเมนู ราคา ค่าส่ง ก่อนจ่าย — ไม่ต้องรอแอดมินตอบ</span></div></div>
        <div class="benefit"><div class="ic">🚚</div><div><b>เซ็ตและ Meal Plan ส่งฟรี ไม่มีขั้นต่ำ</b><span>สั่งทีละกล่องก็ส่ง ร้านช่วยออกค่าส่งให้ส่วนหนึ่งเสมอ</span></div></div>
      </div>`);

/* 3) ป้ายราคาเด่นเหนือปุ่ม */
must(h.includes('      <div class="hero-cta">'),'ไม่เจอ hero-cta');
h=h.replace('      <div class="hero-cta">',`      <div class="hero-price">
        <div class="pricetag"><small>เริ่มเพียง</small><b>฿125</b><i>ต่อกล่อง</i></div>
        <div style="color:rgba(250,246,236,.8);font-size:.95rem;max-width:22em">สั่งทีละกล่องก็ได้ <b style="color:#fff">ไม่ต้องสมัครคอร์ส</b><br>อยากลองยาว → <b style="color:#9FE3AE">เซ็ตเริ่ม ฿1,350 ส่งฟรี</b></div>
      </div>
      <div class="hero-cta">`);

/* 4) แถบ social proof */
must(h.includes('<!-- FACTS -->'),'ไม่เจอ FACTS');
h=h.replace('<!-- FACTS -->',`<!-- SOCIAL PROOF (v0.3) -->
<div class="proof">
  <div class="wrap">
    <div><b>10 ปี</b><span>ทำครัวเอง ส่งเอง</span></div>
    <div><b>8,000+</b><span>ลูกค้าที่เคยสั่ง</span></div>
    <div><b>13,000+</b><span>ครั้งที่ส่งถึงบ้าน</span></div>
    <div><b>115</b><span>เมนูหมุนเวียน</span></div>
  </div>
</div>

<!-- FACTS -->`);

/* 5) section ค่าส่งใหม่ — แทนของเดิมทั้งก้อน */
const dm=h.match(/<!-- DELIVERY -->[\s\S]*?<\/section>/);
must(dm,'ไม่เจอ section DELIVERY');
h=h.replace(dm[0],`<!-- DELIVERY (v0.3 — ตารางชัด ไม่ต้องทักถาม) -->
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

/* 6) sticky bar มือถือ */
must(h.includes('</body>'),'ไม่เจอ </body>');
h=h.replace('</body>',`<div class="sticky-cta">
  <p><b>ข้าวกล่องเริ่ม ฿125</b> · สั่งเองได้ 24 ชม.</p>
  <a href="#" onclick="return orderNow(this)">สั่งใน LINE</a>
</div>
</body>`);

/* 7) กัน Google เก็บหน้าทดลองซ้ำกับหน้าจริง */
h=h.replace('<link rel="canonical"','<meta name="robots" content="noindex">\n<link rel="canonical"');

fs.writeFileSync(OUT,h);
console.log('✅ สร้าง web/v03.html แล้ว:', before, '→', h.length, '(+'+(h.length-before)+' ตัวอักษร)');

/* แก้ข้อความหน้าแรกตามที่พลอยส่งมา 6 ข้อ (m-track 21 ส.ค. 2026)
   นี่คือ copy ของเจ้าของร้าน — **ยึดตามที่พลอยเขียน ไม่เกลาใหม่**
   ยกเว้นข้อ ⑤ ที่เลขาแก้ให้แล้วเพราะผิดกฎแบรนด์:
     พลอยเขียน "พร้อมระบุเวลาจัดส่งได้ตามสะดวก" → เราไม่ให้ลูกค้าเลือกเวลาส่ง (แมสจัดรอบเอง)
     ใช้ "แจ้งช่วงเวลาที่สะดวกรับได้" แทน — เป็นเรื่องจริงและพูดได้

   ⛔ ห้ามทำหลุด: Meta Pixel · Lead · web_events · UTM+fbclid · GTM
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/index.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('Why Us UNDER360?')) { console.log('⏭️  แก้แล้ว'); process.exit(0); }
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
let n = 0; const ok = m => { console.log('  ✅ ' + m); n++; };

/* ① หัวเรื่องใหญ่ */
const H1 = '<h1>เราไม่ได้ขายอาหารคลีน<br>เราขายอาหารที่<em>เข้ากับเป้าหมายของคุณ</em></h1>';
must(h.includes(H1), 'ไม่เจอ h1');
h = h.replace(H1, '<h1>เราไม่ได้ขายอาหารคลีน<br>แต่เราทำอาหาร <em>Balanced Diet food</em><br>ให้ตรงกับเป้าหมายของคุณ</h1>');
ok('① หัวเรื่องใหญ่');

/* ② ข้อความรอง */
const LEDE = '<p class="lede">โปรตีนเป็นแกน รสชาติกินได้ทุกวันจริง — บอกเป้าหมายมา แล้วให้ครัวเราจัดเมนูให้ ตัดของแพ้ให้อัตโนมัติ ส่งถึงหน้าบ้านทั่วกรุงเทพ</p>';
must(h.includes(LEDE), 'ไม่เจอ lede');
h = h.replace(LEDE, '<p class="lede">เลือกอาหารให้ตรงกับเป้าหมายและ Lifestyle ได้เลย ไม่ว่าจะเป็นลดไขมัน เพิ่มกล้ามเนื้อ หรือคุมอาหาร ร้านเราพร้อมจัดเมนูให้ตอบโจทย์กับความต้องการ สารอาหารครบ รสชาติอร่อย ส่งตรงถึงบ้าน</p>');
ok('② ข้อความรอง');

/* ③ ปุ่มเป้าหมาย — ตัด "ซ้อม/เตรียมแข่ง" (พลอยระบุว่าไม่ได้ขายแล้ว) + เปลี่ยน "กินดีทุกวัน" → "Stay Healthy" */
must(h.includes('<button data-goal="athlete" onclick="pickGoal(this)">ซ้อม/เตรียมแข่ง</button>\n'), 'ไม่เจอปุ่ม athlete');
h = h.replace('        <button data-goal="athlete" onclick="pickGoal(this)">ซ้อม/เตรียมแข่ง</button>\n', '');
h = h.replace('<button data-goal="daily" onclick="pickGoal(this)">กินดีทุกวัน</button>', '<button data-goal="daily" onclick="pickGoal(this)">Stay Healthy</button>');
/* เนื้อหาที่ผูกกับปุ่มที่ตัดออก ต้องไม่ค้าง */
const ATH = h.match(/,\n  athlete:'[^']*'\n\};/);
must(ATH, 'ไม่เจอเนื้อหา athlete ใน GOALS');
h = h.replace(ATH[0], '\n};');
h = h.replace(">กินดีทุกวัน →</strong>", ">Stay Healthy →</strong>");
must(!/athlete/.test(h), 'ยังเหลือ athlete ค้างอยู่');
ok('③ ปุ่มเป้าหมาย → 3 ปุ่ม (ตัดซ้อม/เตรียมแข่ง + กินดีทุกวัน → Stay Healthy) · เนื้อหาที่ผูกกันลบครบ');

/* ④ บล็อกราคา → ตารางเทียบ 2 ฝั่ง */
const PRICE = `      <div class="hero-price">
        <div class="pricetag"><small>เริ่มเพียง</small><b>฿125</b><i>ต่อกล่อง</i></div>
        <div style="color:rgba(250,246,236,.8);font-size:.95rem;max-width:22em">สั่งทีละกล่องก็ได้ <b style="color:#fff">ไม่ต้องสมัครคอร์ส</b><br>อยากลองยาว → <b style="color:#9FE3AE">เซ็ตเริ่ม ฿1,350 ส่งฟรี</b></div>
      </div>`;
must(h.includes(PRICE), 'ไม่เจอบล็อกราคา');
h = h.replace(PRICE, `      <div class="price2">
        <div class="p2col">
          <p class="p2head">สั่งรายกล่อง</p>
          <p class="p2num">เริ่มต้น <b>฿125</b> <span>/ กล่อง</span></p>
          <p class="p2note">ไม่มีขั้นต่ำ กี่กล่องก็สั่งได้</p>
        </div>
        <div class="p2col best">
          <p class="p2head">สั่งเป็นแพ็กเกจ <span class="p2tag">คุ้มกว่า</span></p>
          <p class="p2num">เริ่มต้น <b>฿1,350</b></p>
          <p class="p2note">ส่งฟรี · คุ้มค่ากว่าระยะยาว</p>
        </div>
      </div>`);
ok('④ บล็อกราคา → ตารางเทียบ 2 ฝั่ง');

/* ⑤ บรรทัด 24 ชม. */
const NOTE = '<p class="note">🕐 <b>สั่งเองได้ตลอด 24 ชม.</b> — เลือกเมนู ดูราคา จ่ายจบในแอป ไม่ต้องรอแอดมินตอบ · แจ้งช่วงเวลาที่สะดวกรับได้</p>';
must(h.includes(NOTE), 'ไม่เจอบรรทัด 24 ชม.');
h = h.replace(NOTE, '<p class="note">🕐 <b>สั่งสะดวกด้วยตัวเอง 24 ชม.</b> : เลือกเมนู คำนวณราคาค่าอาหาร ค่าส่ง และชำระเงินได้ทันทีค่ะ ไม่ต้องรอแอดมิน พร้อมแจ้งช่วงเวลาที่สะดวกรับได้</p>');
ok('⑤ บรรทัด 24 ชม.');

/* ⑥ หัวเรื่อง "Why Us UNDER360?" เหนือบล็อก 5 ข้อ */
must(h.includes('      <div class="benefits">'), 'ไม่เจอบล็อก benefits');
h = h.replace('      <div class="benefits">', '      <p class="whyus">Why Us UNDER360?</p>\n      <div class="benefits">');
ok('⑥ หัวเรื่อง Why Us UNDER360?');

/* CSS ของใหม่ */
const CSS = `/* ── copy พลอย 21 ส.ค. — ตารางราคา 2 ฝั่ง + หัวเรื่อง Why Us ── */
.price2{display:grid;grid-template-columns:1fr 1fr;gap:0;margin:26px 0;border:1px solid var(--hair);border-radius:var(--radius);overflow:hidden}
.p2col{padding:20px 22px}
.p2col+.p2col{border-left:1px solid var(--hair)}
.p2col.best{background:var(--bg-soft)}
.p2head{font-family:'Prompt';font-weight:600;color:var(--muted);margin:0 0 8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.p2tag{background:var(--green);color:#fff;font-size:.72rem!important;padding:3px 10px;border-radius:999px;font-weight:600}
.p2num{margin:0 0 6px;font-family:'Prompt';color:var(--ink)}
.p2num b{font-size:1.9rem;font-weight:700;letter-spacing:-.02em}
.p2num span{color:var(--muted)}
.p2note{margin:0;color:var(--muted);font-size:.9375rem!important}
.whyus{font-family:'Prompt';font-weight:700;color:var(--ink);margin:30px 0 4px;letter-spacing:-.01em;font-size:1.25rem!important}
@media(max-width:560px){.price2{grid-template-columns:1fr}.p2col+.p2col{border-left:0;border-top:1px solid var(--hair)}}
`;
h = h.replace('</style>', CSS + '</style>');
ok('CSS ของใหม่');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log(`\n✅ แก้ครบ ${n} จุด`);

/* เติมโค้ดเมนูในหน้า /mealplan (ห้องฟ้าขอไว้ในใบ 27 ส.ค. 11:38 — ผมทำตกไป)

   ทำไมต้องมีโค้ด: คนในร้านคุยกันด้วยโค้ด ไม่ใช่ชื่อเมนู
   เคสจริงที่ห้องฟ้ายกมา — กิ๊ฟต้องถามในไลน์ว่า
     "06,07,22,24,04,10,72 เป็นเมนูของวันศุกร์นี้ใช่ไหมคะ"  เพราะไม่มีที่เปิดดู
   → หน้านี้ต้องตอบคำถามนั้นได้ในหน้าเดียว ไม่ต้องถามใคร

   เพิ่ม 2 อย่าง:
     ① ป้ายโค้ดบนการ์ดเมนูแต่ละใบ (LC/HP + เลข)
     ② แถวรวมโค้ดของทั้งวัน + ปุ่มคัดลอก — แอดมินก๊อปไปวางในไลน์ได้เลย
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/mealplan.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-mp-codes')) { console.log('⏭️  มีแล้ว'); process.exit(0); }
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

/* ── ① ป้ายโค้ดบนการ์ด ── */
const OLD_ITEM = `            return '<div class="mpitem"><div class="n">' + mpEsc(m.name) + '</div>'
                 + (m.protein ? '<div class="p">' + mpEsc(m.protein) + '</div>' : '') + '</div>';`;
must(h.includes(OLD_ITEM), 'ไม่เจอการ์ดเมนู');
h = h.replace(OLD_ITEM, `            return '<div class="mpitem"><div class="c">' + mpEsc(m.no) + '</div>'
                 + '<div class="n">' + mpEsc(m.name) + '</div>'
                 + (m.protein ? '<div class="p">' + mpEsc(m.protein) + '</div>' : '') + '</div>';`);
console.log('  ✅ ป้ายโค้ดบนการ์ดเมนู');

/* ── ② แถวรวมโค้ดทั้งวัน + ปุ่มคัดลอก ── */
const OLD_HEAD = `    '<div class="mphead"><h3>' + f.dow + ' ' + f.date + '</h3><span>' + when
      + ' · ครัวทำ ' + list.length + ' เมนู</span></div>'`;
must(h.includes(OLD_HEAD), 'ไม่เจอหัวข้อวัน');
h = h.replace(OLD_HEAD, `    '<div class="mphead"><h3>' + f.dow + ' ' + f.date + '</h3><span>' + when
      + ' · ครัวทำ ' + list.length + ' เมนู</span></div>'
    /* u360-mp-codes — แถวโค้ดของทั้งวัน สำหรับคนในร้านที่คุยกันด้วยโค้ด ไม่ใช่ชื่อเมนู */
    + (list.length ? '<div class="mpcodes"><span class="lb">โค้ดเมนูวันนี้</span>'
        + '<code id="mpCodeStr">' + list.map(function(m){return mpEsc(m.no);}).join(', ') + '</code>'
        + '<button type="button" class="cp" onclick="mpCopyCodes(this)">คัดลอก</button></div>' : '')`);

/* ฟังก์ชันคัดลอก */
must(h.includes('function mpRenderDay(){'), 'ไม่เจอ mpRenderDay');
h = h.replace('function mpRenderDay(){', `function mpCopyCodes(btn){
  var el = document.getElementById('mpCodeStr'); if(!el) return;
  var txt = MPCAL_DAY + ' — ' + el.textContent;
  var done = function(){ btn.textContent = 'คัดลอกแล้ว'; setTimeout(function(){ btn.textContent = 'คัดลอก'; }, 1600); };
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(done, function(){}); return; }
  /* เครื่องเก่า/หน้าที่ไม่ใช่ https — ยังต้องคัดลอกได้ ไม่งั้นแอดมินใช้ไม่ได้ */
  var t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t);
  t.select(); try{ document.execCommand('copy'); done(); }catch(e){} document.body.removeChild(t);
}

function mpRenderDay(){`);
console.log('  ✅ แถวรวมโค้ด + ปุ่มคัดลอก');

/* ── CSS ── */
must(h.includes('.mpitem .n{'), 'ไม่เจอ CSS การ์ด');
h = h.replace('</style>', `/* u360-mp-codes */
.mpitem{position:relative;padding-top:34px}
.mpitem .c{position:absolute;top:12px;left:16px;font-family:'Prompt';font-weight:600;font-size:.76rem;
  letter-spacing:.06em;color:var(--green);background:#EDF6EF;border-radius:6px;padding:3px 8px}
.mpcodes{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:-6px 0 16px;
  background:var(--cream);border:1px solid #E8ECE5;border-radius:10px;padding:10px 14px}
.mpcodes .lb{font-size:.84rem;color:var(--muted)}
.mpcodes code{font-family:'Prompt';font-weight:500;font-size:.95rem;color:var(--ink);letter-spacing:.03em}
.mpcodes .cp{border:1px solid #D7DED3;background:var(--paper);border-radius:8px;padding:5px 12px;
  font-family:'Sarabun';font-size:.85rem;color:var(--ink);cursor:pointer}
.mpcodes .cp:hover{border-color:var(--green);color:var(--green)}
</style>`);
console.log('  ✅ CSS');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F);

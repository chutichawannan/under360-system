/* เร่ง 3 อย่างบนหน้า /pack ตามที่ 06 Ads ขอ (นัทสั่งเอง 27 ส.ค. — แอดรอยิงอยู่)

   ⚠️ เช็คของจริงใน DB ก่อนแล้ว ไม่เชื่อตัวเลขในใบสั่งงานอย่างเดียว:
     FBPACK  → มีจริง · is_active=true · ลด ฿120 · ขั้นต่ำ ฿1,000 · ผูกเฉพาะ Pack S · stackable=false
     Pack S  → ฿1,400 · 21 แพ็ค  → 1400−120 = ฿1,280 · เฉลี่ย 1280/21 = ฿61  ✅ ตรงกับที่ 06 แจ้ง
   (รอบ ก.ค. เผาเงิน ฿1,047 ได้ 0 ออเดอร์ เพราะโค้ดที่โฆษณา "ไม่มีอยู่จริง" — รอบนี้เช็คก่อน)

   ทำ: ② ราคาโปรขีดฆ่าบนการ์ด Pack S   ③ เตือนโค้ดก่อนพาออกไป LINE
   (① merge ขึ้นโดเมนจริง = ทำหลังเทสเสร็จ)
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/pack.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-pack-promo')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

/* ── เปิดกล่องโค้ดในตะกร้า (เดิมตั้ง null ไว้เพราะยังไม่มีโค้ดจริง — ตอนนี้มีแล้ว) ── */
must(h.includes('const LINE_PROMO_CODE = null;'), 'ไม่เจอ LINE_PROMO_CODE');
h = h.replace('const LINE_PROMO_CODE = null;', "const LINE_PROMO_CODE = 'FBPACK';");
console.log('  ✅ เปิดกล่องโค้ด FBPACK ในตะกร้า');

/* ── ตั้งค่าโปรของแพ็ค (u360-pack-promo) ── */
must(h.includes("const FEE_UPCOUNTRY = 200;"), 'ไม่เจอจุดตั้งค่า');
h = h.replace("const FEE_UPCOUNTRY = 200;", `/* u360-pack-promo — โปรที่แอด Facebook โฆษณาอยู่ (ตรวจกับ promo_codes ในระบบแล้วว่ามีจริง)
   ⚠️ ถ้าโปรจบ: ตั้ง PACK_PROMO = null พอ — ราคาจะกลับเป็นปกติทั้งหน้าเอง ไม่ต้องไล่แก้หลายจุด */
const PACK_PROMO = { match:/Protein Pack S/i, code:'FBPACK', off:120, min:1000 };
const FEE_UPCOUNTRY = 200;`);
console.log('  ✅ ตั้งค่าโปร (ปิดได้ด้วยการตั้ง null)');

/* ── ② การ์ดแพ็ค: ราคาเดิมขีดฆ่า + ราคาโปร + โค้ด ── */
const OLD = `      <div class="pack">
        <div class="nm">\${esc(String(p.name).replace(/—.*$/,'').trim())}</div>
        <div class="pr">฿\${Number(p.base_price).toLocaleString('th-TH')}</div>
        <div class="pe">\${p.qty} แพ็ค · เฉลี่ยแพ็คละ ฿\${Math.round(p.base_price/p.qty)}</div>
        \${p.free_shipping ? '<div class="ff">ส่งฟรี</div>' : ''}
      </div>`;
must(h.includes(OLD), 'ไม่เจอการ์ดแพ็ค');
h = h.replace(OLD, `      \${(function(){
        const promo = (PACK_PROMO && PACK_PROMO.match.test(p.name||'') && Number(p.base_price) >= PACK_PROMO.min) ? PACK_PROMO : null;
        const now = promo ? Number(p.base_price) - promo.off : Number(p.base_price);
        return \`<div class="pack\${promo?' hot':''}">
        <div class="nm">\${esc(String(p.name).replace(/—.*$/,'').trim())}</div>
        \${promo ? \`<div class="was">฿\${Number(p.base_price).toLocaleString('th-TH')}</div>\` : ''}
        <div class="pr">฿\${now.toLocaleString('th-TH')}</div>
        <div class="pe">\${p.qty} แพ็ค · เฉลี่ยแพ็คละ ฿\${Math.round(now/p.qty)}</div>
        \${promo ? \`<div class="promo">ใส่โค้ด <b>\${promo.code}</b> ตอนสั่ง — ลด ฿\${promo.off}</div>\` : ''}
        \${p.free_shipping ? '<div class="ff">ส่งฟรี</div>' : ''}
      </div>\`;})()}`);
console.log('  ✅ การ์ด Pack S: ขีดฆ่า ฿1,400 → ฿1,280 + โค้ด');

/* ── ③ เตือนโค้ดก่อนพาออกไป LINE ── */
const G = `function goLine(){`;
must(h.includes(G), 'ไม่เจอ goLine');
h = h.replace(G, `/* ③ เตือนโค้ดก่อนพาออก — ลูกค้าจำโค้ดจากแอดไม่ได้ ต้องเตือนตอนกำลังจะกด */
function remindCode(next){
  if(!LINE_PROMO_CODE){ next(); return; }
  const el = document.getElementById('sheetBox');
  if(!el){ next(); return; }
  el.innerHTML = \`<div class="ok">
      <h3>อย่าลืมแจ้งโค้ดนะคะ</h3>
      <p style="color:var(--muted);margin-top:4px">พิมพ์โค้ดนี้ตอนสั่งในไลน์ เพื่อรับส่วนลด</p>
      <div class="codebox"><div class="cd">\${LINE_PROMO_CODE}</div>
        <div style="font-size:.9rem;color:#8A6D00;margin-top:4px">ลด ฿\${PACK_PROMO?PACK_PROMO.off:0} · ใช้กับแพ็ค 21 แพ็คขึ้นไป</div></div>
      <button class="btn btn-line" style="width:100%" id="goOn">เข้าใจแล้ว ไปสั่งเลย →</button>
      <p style="margin-top:12px"><a href="#" onclick="renderCart();return false" style="color:var(--muted);font-size:.92rem">ย้อนกลับ</a></p>
    </div>\`;
  document.getElementById('goOn').onclick = next;
}
function goLineNow(){`);
h = h.replace(/function goLineNow\(\)\{([\s\S]*?)\n\}\n\nasync function submitWeb/, (m0, body) =>
  `function goLineNow(){${body}\n}\nfunction goLine(){ remindCode(goLineNow); }\n\nasync function submitWeb`);
must(h.includes('function goLine(){ remindCode(goLineNow); }'), 'ต่อ goLine ไม่สำเร็จ');
console.log('  ✅ เตือนโค้ดก่อนออกไป LINE');

/* ── CSS ── */
h = h.replace('</style>', `.pack.hot{border-color:var(--green);box-shadow:0 0 0 1px var(--green) inset}
.pack .was{color:var(--muted);text-decoration:line-through;font-family:'Prompt';font-size:1.05rem;margin-top:6px}
.pack .was+.pr{margin-top:0}
.pack .promo{margin-top:8px;background:#FFF8E1;border:1px dashed #E6B800;border-radius:8px;padding:7px 10px;font-size:.9rem;color:#8A6D00}
.pack .promo b{font-family:'Prompt';letter-spacing:.04em}
</style>`);
console.log('  ✅ CSS ราคาขีดฆ่า + กล่องโค้ด');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ เสร็จ — เหลือ merge ขึ้นโดเมนจริง');

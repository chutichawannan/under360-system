/* ของแถม Early Bird = แก้วสลัดพกพา (ห้องเจเคาะแล้ว ส่งมา 7 ก.ย. 2026)

   ① หน้า /jay — เพิ่มบล็อกของแถมใต้ส่วนราคา
   ② แบนเนอร์หน้าโฮม — เติมว่าแถมแก้วสลัดพกพา

   ⚠️ ของแถมผูกกับ Early Bird เท่านั้น เขียนให้ชัดว่าเงื่อนไขคืออะไร
      ไม่ใช่ปล่อยให้เข้าใจว่าซื้อแบบไหนก็ได้ของ
   รันซ้ำได้ */
import fs from 'fs';

const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const rd = f => ({ crlf: fs.readFileSync(f, 'utf8').includes('\r\n'), h: fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n') });
const wr = (f, o) => fs.writeFileSync(f, o.crlf ? o.h.replace(/\n/g, '\r\n') : o.h);

/* ═══ ① หน้า /jay ═══ */
{
  const F = 'web/jay.html'; const o = rd(F);
  if (o.h.includes('u360-jay-gift')) { console.log('⏭️  หน้า /jay มีบล็อกของแถมแล้ว'); }
  else {
    const A = '<!-- ═══ รอบส่ง ═══ -->';
    must(o.h.includes(A), 'ไม่เจอจุดแทรก (section รอบส่ง)');

    o.h = o.h.replace(A, `<!-- ═══ u360-jay-gift — ของแถม Early Bird (ห้องเจเคาะ 7 ก.ย.) ═══
     ผูกกับ Early Bird เท่านั้น · ครบ 50 คอร์สแรกแล้วต้องมาลบบล็อกนี้ด้วย -->
<section id="gift">
  <div class="wrap giftgrid">
    <div class="gifttxt">
      <h2 class="sec">จองล็อตแรก ได้แก้วสลัดพกพาไปด้วย</h2>
      <p class="lead">แก้วมีตะกร้าในตัวสำหรับแยกน้ำสลัด พร้อมส้อมเก็บในฝา
        พกไปกินที่ทำงานได้เลย ไม่ต้องหาภาชนะเพิ่ม</p>
      <ul class="giftwhy">
        <li>แยกน้ำสลัดออกจากผัก ผักไม่แฉะระหว่างทาง</li>
        <li>ส้อมเก็บในฝา ไม่ต้องพกแยก</li>
        <li>ล้างง่าย ถอดออกจากกันได้ทุกชิ้น</li>
      </ul>
      <p class="giftrule">ได้เฉพาะคนที่จองราคา Early Bird — จำกัด 50 คอร์สแรก</p>
    </div>
    <div class="giftpic">
      <img src="/img/jay/gift.png" alt="แก้วสลัดพกพา ของแถมสำหรับคนจองคอร์สเจล็อตแรก"
           width="760" height="560" loading="lazy">
    </div>
  </div>
</section>

` + A);
    console.log('  ✅ แทรกบล็อกของแถมใต้ส่วนราคา');

    must(o.h.includes('</style>'), 'ไม่เจอ </style>');
    o.h = o.h.replace('</style>', `/* ── u360-jay-gift ── */
#gift{background:var(--soft);border-top:1px solid var(--hair);border-bottom:1px solid var(--hair)}
.giftgrid{display:grid;gap:24px;align-items:center}
@media(min-width:860px){.giftgrid{grid-template-columns:1.05fr .95fr;gap:44px}}
.giftpic img{width:100%;height:auto;border-radius:14px;border:1px solid var(--hair);display:block}
.giftwhy{list-style:none;margin-top:16px;display:grid;gap:8px}
.giftwhy li{position:relative;padding-left:24px;color:var(--muted);font-size:1rem}
.giftwhy li::before{content:'';position:absolute;left:5px;top:.62em;width:7px;height:7px;
  border-radius:50%;background:var(--gold)}
.giftrule{margin-top:16px;display:inline-block;background:var(--goldbg);color:#8A6A00;
  border:1px solid #F0DFA8;border-radius:999px;padding:7px 16px;font-size:.92rem}
@media(max-width:600px){.giftgrid{gap:20px}}
</style>`);
    console.log('  ✅ CSS');
    wr(F, o);
  }
}

/* ═══ ② แบนเนอร์หน้าโฮม ═══ */
{
  const F = 'web/index.html'; const o = rd(F);
  const OLD = '<small style="font-size:.86rem!important">30 กล่อง · 30 เมนูไม่ซ้ำ · ส่งถึงบ้าน 3 รอบ</small>';
  if (!o.h.includes(OLD)) { console.log('⏭️  แบนเนอร์แก้แล้ว หรือข้อความเปลี่ยนไป'); }
  else {
    o.h = o.h.replace(OLD,
      '<small style="font-size:.86rem!important">30 กล่อง · 30 เมนูไม่ซ้ำ · แถมแก้วสลัดพกพา</small>');
    wr(F, o);
    console.log('  ✅ แบนเนอร์หน้าโฮม: เติม "แถมแก้วสลัดพกพา"');
    console.log('     (สลับกับ "ส่งถึงบ้าน 3 รอบ" เพราะบรรทัดเดียวใส่ 3 อย่างแล้วยาวเกินบนมือถือ)');
  }
}

console.log('\n✅ เสร็จ');

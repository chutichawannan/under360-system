/* เอาบล็อกของแถมกลับเข้าหน้า /jay (8 ก.ย. 2026)

   🔴 ทำไมต้องมีสคริปต์นี้: การสลับ /jay ไปใช้ดีไซน์ของ ChatGPT เขียนทับทั้งไฟล์
      → บล็อก "ของแถมแก้วสลัดพกพา" ที่ห้องเจเคาะไว้ 7 ก.ย. หายไปเงียบๆ
      (ตัวเฝ้าไม่จับ เพราะกฎเดิมเช็คแค่รายชื่อเมนู) — ของแถมคือเงื่อนไขการขายจริง หายไม่ได้

   เขียนใหม่ให้เข้ากับดีไซน์ใหม่ (ใช้ตัวแปรสีชุดเดิมของหน้า --green/--muted/--line/--soft)
   ไม่ยกของเก่ามาทั้งดุ้น เพราะของเก่าอ้างสีที่ดีไซน์ใหม่ไม่มี (--gold/--hair) แล้วจะเพี้ยน

   ⚠️ ของแถมผูกกับ Early Bird 50 คอร์สแรก — ครบแล้วต้องมาลบบล็อกนี้ด้วย
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-jay-gift')) { console.log('⏭️  มีบล็อกของแถมอยู่แล้ว'); process.exit(0); }

/* ═══ ① บล็อกของแถม — วางคั่นระหว่างตารางเมนูกับคำถามที่พบบ่อย ═══
      เหตุผลตำแหน่ง: คนอ่านเมนูจบแล้วกำลังชั่งใจ = จังหวะที่ของแถมมีน้ำหนักที่สุด */
{
  const A = '      <section class="faq" aria-labelledby="faq-title">';
  must(h.includes(A), 'ไม่เจอ section คำถามที่พบบ่อย (จุดแทรก)');
  h = h.replace(A, `      <!-- ═══ u360-jay-gift — ของแถม Early Bird (ห้องเจเคาะ 7 ก.ย.) ═══
           ผูกกับ Early Bird เท่านั้น · ครบ 50 คอร์สแรกแล้วต้องมาลบบล็อกนี้ -->
      <section id="gift" aria-labelledby="gift-title">
        <div class="gift-txt">
          <h2 id="gift-title">จองล็อตแรก ได้แก้วสลัดพกพาไปด้วย</h2>
          <p class="section-note">แก้วมีตะกร้าในตัวสำหรับแยกน้ำสลัด พร้อมส้อมเก็บในฝา พกไปกินที่ทำงานได้เลย</p>
          <ul class="gift-why">
            <li>แยกน้ำสลัดออกจากผัก ผักไม่แฉะระหว่างทาง</li>
            <li>ส้อมเก็บในฝา ไม่ต้องพกแยก</li>
            <li>ถอดล้างได้ทุกชิ้น</li>
          </ul>
          <p class="gift-rule">ได้เฉพาะคนที่จองราคา Early Bird — จำกัด 50 คอร์สแรก</p>
        </div>
        <figure class="gift-pic">
          <img src="/img/jay/gift.png" width="760" height="560" loading="lazy" decoding="async"
               alt="แก้วสลัดพกพา ของแถมสำหรับคนจองคอร์สเจล็อตแรก">
        </figure>
      </section>

${A}`);
  console.log('  ✅ แทรกบล็อกของแถม (ระหว่างตารางเมนู ↔ คำถามที่พบบ่อย)');
}

/* ═══ ② CSS — ยืมชุดตัวแปรและขนาดตัวอักษรของดีไซน์ใหม่ ไม่ตั้งค่าใหม่เอง ═══ */
{
  must(h.includes('</style>'), 'ไม่เจอ </style>');
  h = h.replace('</style>', `    /* ── u360-jay-gift ── */
    #gift { border-top:1px solid var(--line); padding:44px 0 48px; display:grid; gap:32px;
            grid-template-columns:1.05fr .95fr; align-items:center; }
    .gift-why { list-style:none; margin:18px 0 0; padding:0; display:grid; gap:9px; }
    .gift-why li { position:relative; padding-left:22px; color:var(--muted); font-size:15px; }
    .gift-why li::before { content:""; position:absolute; left:3px; top:.62em; width:6px; height:6px;
                           border-radius:50%; background:var(--green); }
    .gift-rule { margin:20px 0 0; display:inline-block; background:var(--soft); color:var(--ink);
                 border:1px solid var(--line); border-radius:999px; padding:8px 16px; font-size:14px; }
    .gift-pic { margin:0; }
    .gift-pic img { width:100%; height:auto; display:block; border-radius:14px; border:1px solid var(--line); }
    @media (max-width:700px) { #gift { grid-template-columns:1fr; gap:22px; padding:32px 0 36px; } }
</style>`);
  console.log('  ✅ CSS (ใช้ --green/--muted/--line/--soft ของหน้าเดิม ไม่เพิ่มสีใหม่)');
}

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F + '  (' + (fs.statSync(F).size / 1024 | 0) + 'KB)');

/* หน้าตาเว็บใหม่: "อินเตอร์ + มินิมอล" (นัทสั่งเอง 20 ส.ค. 2026)
   หลักการเดียว: **ตัดออก ไม่ใช่เพิ่มเข้า**

   ⛔ ห้ามแตะ: คำโฆษณา · positioning · ราคา · Meta Pixel · web_events · UTM
   วิธีทำ: แทรก <style> ทับท้าย <head> — ชนะด้วย cascade ไม่ต้องผ่าโค้ดเดิม ถอดออกได้ในบรรทัดเดียว

   สิ่งที่ตัดทิ้ง (= หัวใจของงานนี้)
   1. ขนาดฟอนต์ 20 ขนาด → เหลือ 6
   2. เงา (box-shadow) 9 จุด → เหลือ 0 บนเนื้อหา
   3. ไล่สี (gradient) 1 จุด → 0
   4. ป้ายราคาวงกลมแดงเอียง -6° → ตัวเลขเรียบๆ
   5. อีโมจิในหัวเรื่อง + ไอคอนอีโมจิในกล่องสี → ตัดทิ้ง เหลือตัวหนังสือล้วน
   6. มุมโค้งหลายค่า → เหลือ 2 ค่า
   7. สีในหน้า → ขาว/ดำ/เทา + เขียวแบรนด์จุดเดียวที่อยากให้กด
*/
import fs from 'fs';

const FILES = ['web/index.html', 'web/mealplan.html', 'web/blog.html'];

const CSS = `<style id="u360-minimal">
/* ══════ Under360 — minimal restyle (20 ส.ค. 2026) ══════ */
:root{
  /* สีตามแบรนด์ไบเบิล — ของเดิมใน CSS ไม่ตรง (#2E7D43) */
  --green:#40B549;
  --deep:#1F7A4D;
  --ink:#14171A;
  --muted:#6B7280;
  --paper:#FFFFFF;
  --cream:#FFFFFF;
  --bg-soft:#F7F7F5;
  --hair:#E8E8E4;
  --radius:10px;
}
body{background:var(--paper);color:var(--ink);font-size:17px;line-height:1.68;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}

/* ── ① สเกลตัวหนังสือ: 20 ขนาด → 6 ── */
h1,.hero h1{font-size:clamp(2.15rem,5.6vw,3.35rem);line-height:1.12;letter-spacing:-.022em;font-weight:700}
h2,.sec{font-size:clamp(1.6rem,3.6vw,2.3rem)!important;line-height:1.2;letter-spacing:-.018em;font-weight:700;margin-top:0}
h3{font-size:1.12rem!important;line-height:1.4;letter-spacing:-.008em;font-weight:600}
p,li,td,th,.benefit span,.dcards p,.bex{font-size:1.0625rem!important;line-height:1.68}
.eyebrow,.micro,footer,footer *,.proof span,.ship td,.ship th,.sets td,.sets th{font-size:.9375rem!important}
.eyebrow{letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--muted);font-size:.75rem!important}

/* ── ② พื้นที่ว่างเป็นพระเอก ── */
section{padding:108px 0!important}
@media(max-width:760px){section{padding:64px 0!important}}
.wrap{max-width:1080px;padding-left:24px;padding-right:24px}
.sec+p,h2+p{margin-top:14px;max-width:62ch}

/* ── ③ ตัดเงา / ไล่สี / กรอบประดับ ── */
*{text-shadow:none!important}
.card,.mcard,.bpost,.dcards>div,.sets-wrap,.ship,.pricetag,.benefit .ic,.ig-grid a,.proof{box-shadow:none!important;background-image:none!important}
.card,.bpost,.dcards>div{border:1px solid var(--hair)!important;border-radius:var(--radius)!important}
img{border-radius:var(--radius)}
.hero-img img,.soul img{border-radius:0!important}

/* ── ④ ป้ายราคา: วงกลมแดงเอียง → ตัวเลขเรียบ ── */
.pricetag{background:none!important;color:inherit!important;border-radius:0!important;width:auto!important;height:auto!important;transform:none!important;display:block!important;text-align:left!important;padding:0!important}
.pricetag small{display:block;font-size:.75rem!important;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.pricetag b{font-size:2.6rem!important;font-weight:700;letter-spacing:-.03em;color:#fff}
.pricetag i{font-size:.9375rem!important;color:rgba(255,255,255,.6);margin-left:6px}
.hero-price{gap:28px;align-items:baseline;margin-bottom:26px}

/* ── ⑤ ลิสต์ประโยชน์: ตัดกล่องไอคอนสีทิ้ง เหลือตัวหนังสือ ── */
.benefit .ic{display:none!important}
.benefits{gap:0;margin:26px 0 6px;border-top:1px solid rgba(255,255,255,.14)}
.benefit{padding:15px 0;border-bottom:1px solid rgba(255,255,255,.14)}
.benefit b{font-size:1.02rem!important;font-weight:600;margin-bottom:2px}
.benefit span{color:rgba(255,255,255,.62);font-size:.9375rem!important}

/* ── ⑥ ตัวเลขพิสูจน์: เอาสีเขียวสดออก ใช้ขาวล้วน ── */
.proof{background:var(--ink)!important;padding:74px 0!important}
.proof b{color:#fff!important;font-size:clamp(2rem,4.4vw,2.9rem)!important;font-weight:700;letter-spacing:-.03em}
.proof span{color:rgba(255,255,255,.55)!important;margin-top:6px;display:block}
.proof .wrap{gap:34px}

/* ── ⑦ ตาราง: ตัดพื้นสี เหลือเส้นบางเส้นเดียว ── */
.ship,.sets{background:none!important;border-radius:0!important}
.ship th,.sets th{background:none!important;border-bottom:1px solid var(--ink)!important;font-weight:600;color:var(--muted)!important;font-size:.8125rem!important;letter-spacing:.08em;text-transform:uppercase;padding:12px 14px 12px 0!important}
.ship td,.sets td{border-bottom:1px solid var(--hair)!important;padding:17px 14px 17px 0!important}
.ship .free{color:var(--green)!important}

/* ── ⑧ ปุ่ม: เหลือ 2 แบบ — ทึบ(หลัก) / เส้นขอบ(รอง) ── */
.btn,.hero-cta a,a.btn-line{border-radius:999px!important;font-weight:600;padding:15px 30px!important;font-size:1.0625rem!important;box-shadow:none!important;letter-spacing:.01em;transition:opacity .18s}
.btn:hover,.hero-cta a:hover{opacity:.86}
.sticky-cta{background:var(--ink)!important;box-shadow:none!important;border-top:1px solid rgba(255,255,255,.12);padding:12px 18px}
.sticky-cta a{background:var(--green)!important;border-radius:999px!important}
.sticky-cta p b{color:#fff!important}

/* ── ⑨ รูปอาหารใหญ่ขึ้น ปล่อยให้รูปพูด ── */
.mcard{aspect-ratio:1/1}
.mcard img{transform:none!important}
.mcard:hover img{transform:scale(1.03)!important}
.card img{height:280px!important}
.bpost .bcover{aspect-ratio:3/2}

/* ── ⑩ นำทาง/ท้ายเว็บ: บางลง เงียบลง ── */
nav,.nav{border-bottom:1px solid var(--hair)!important;background:rgba(255,255,255,.9)!important;backdrop-filter:saturate(1.4) blur(8px)}
nav a,footer a{color:var(--muted)!important;text-decoration:none}
nav a:hover,footer a:hover{color:var(--ink)!important}
footer{background:var(--bg-soft)!important;color:var(--muted)!important;border-top:1px solid var(--hair)}

/* ── ⑪ พื้นหลังสลับ: ตัดสีครีม ใช้เทาอ่อนแทน ── */
.deliv,.facts,.alt-bg{background:var(--bg-soft)!important}
</style>
`;

/* อีโมจิประดับในหัวเรื่อง — ตัดทิ้ง (เก็บความหมายไว้ครบ ไม่แตะคำ) */
const STRIP_EMOJI = [
  ['<h3>🛵 กรุงเทพ', '<h3>กรุงเทพ'],
  ['<h3>🚚 ทั่วประเทศ', '<h3>ทั่วประเทศ'],
  ['💡 เลือก <b>"รับได้ตลอดวัน"</b>', 'เลือก <b>"รับได้ตลอดวัน"</b>'],
  ['📷 @under360', '@under360'],
];

let total = 0;
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.error('❌ ไม่เจอ', f); process.exit(1); }
  const crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
  let h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes('u360-minimal')) { console.log('⏭️  ทำแล้ว:', f); continue; }
  if (!h.includes('</head>')) { console.error('❌ ไม่เจอ </head> ใน', f); process.exit(1); }

  let cut = 0;
  for (const [a, b] of STRIP_EMOJI) if (h.includes(a)) { h = h.split(a).join(b); cut++; }
  h = h.replace('</head>', CSS + '</head>');

  fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log(`✅ ${f} — ใส่สไตล์มินิมอล + ตัดอีโมจิประดับ ${cut} จุด`);
  total++;
}
console.log(`\nเสร็จ ${total} ไฟล์`);

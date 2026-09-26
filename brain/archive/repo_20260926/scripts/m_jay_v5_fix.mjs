/* /jay-v5 — แก้ 2 เรื่องที่นัทสั่ง 8 ก.ย. 2026

   🔴 ① "ดูเมนูทั้ง 30 เมนู" กดแล้วไม่ขึ้นอะไร — **ผมเสียบลิงก์ผิดเอง ไม่ใช่ของ ChatGPT**
        ชี้ไป #menu-title ซึ่งเป็นหัวข้อ "อร่อยหลากหลาย ทุกวัน" = section รูปอาหาร มีรายชื่อเมนู 0 รายการ
        รายชื่อเมนูจริงอยู่ใน .round-panel ใต้ #plan-title
        (ตรวจแล้วแท็บสลับรอบของ ChatGPT ทำงานปกติ เป็น CSS ล้วน ไม่ได้พัง)

   ⚖️ ② ทำให้เบาลง
        · รูป: โหลด 1000px แต่แสดงจริง 335px = ใหญ่เกิน 3 เท่า
          → ใส่ srcset ให้เบราว์เซอร์เลือกขนาดตามจอ (ตัวย่อของ Supabase ทำ WebP ให้อยู่แล้ว)
        · ฟอนต์: โหลด 5 น้ำหนัก แต่หน้าใช้จริง 400/500/600 เท่านั้น
          ฟอนต์ไทยไฟล์ใหญ่ ตัดน้ำหนักที่ไม่ใช้ = ลดจริง
        · รูปใบแรกอยู่ครึ่งบนจอ ไม่ควร lazy (ทำให้ภาพหลักมาช้า)
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay_v5.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-v5-fix')) { console.log('⏭️  ทำแล้ว'); process.exit(0); }

/* ═══ ① ลิงก์เมนูชี้ผิดที่ ═══ */
{
  const before = (h.match(/href="#menu-title"/g) || []).length;
  must(before >= 3, 'ไม่เจอลิงก์ที่ชี้ #menu-title');
  /* ทั้ง 3 จุด (เมนูอาหาร · ดูเมนู · ดูเมนูทั้ง 30 เมนู) ควรพาไปที่รายชื่อเมนูจริง */
  h = h.replace(/href="#menu-title"/g, 'href="#plan-title"');
  console.log('  ✅ แก้ลิงก์ ' + before + ' จุด: #menu-title → #plan-title (ที่รายชื่อเมนูอยู่จริง)');
}

/* ═══ ② ก. รูป — ให้เบราว์เซอร์เลือกขนาดเอง ═══ */
{
  const T = 'https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/render/image/public/menu-images/jay-v5/';
  let n = 0;
  for (const f of ['food-1', 'food-2', 'food-3', 'food-4']) {
    const re = new RegExp('src="' + T.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + f + '\\.png\\?width=1000&quality=72"( loading="lazy")?', 'g');
    must(re.test(h), 'ไม่เจอรูป ' + f);
    const eager = (f === 'food-1');   /* ใบแรกอยู่ครึ่งบนจอ ต้องมาก่อน ไม่ lazy */
    h = h.replace(re,
      'src="' + T + f + '.png?width=760&quality=70"'
      + ' srcset="' + T + f + '.png?width=420&quality=70 420w, '
      + T + f + '.png?width=760&quality=70 760w, '
      + T + f + '.png?width=1100&quality=70 1100w"'
      + ' sizes="(max-width: 700px) 92vw, 520px"'
      + (eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'));
    n++;
  }
  console.log('  ✅ รูป ' + n + ' ใบใส่ srcset — จอมือถือได้ 420px แทน 1000px · ใบแรกโหลดก่อน ไม่ lazy');
}

/* ═══ ② ข. ฟอนต์ — ตัดน้ำหนักที่ไม่ได้ใช้ ═══ */
{
  const OLD = 'family=Kanit:wght@300;400;500;600;700';
  must(h.includes(OLD), 'ไม่เจอลิงก์ฟอนต์');
  h = h.replace(OLD, 'family=Kanit:wght@400;500;600');
  /* 650 ไม่มีใน Kanit อยู่แล้ว เบราว์เซอร์จะไปหยิบตัวใกล้เคียง เขียนให้ตรงกับที่โหลดจริง */
  const w650 = (h.match(/font-weight:\s*650/g) || []).length;
  h = h.replace(/font-weight:\s*650/g, 'font-weight:600');
  console.log('  ✅ ฟอนต์ 5 น้ำหนัก → 3 (400/500/600) · แก้ font-weight:650 ที่ไม่มีจริง ' + w650 + ' จุด');
}

/* ═══ ป้ายบอกว่าแก้แล้ว ═══ */
h = h.replace('<title>', '<!-- u360-v5-fix (8 ก.ย.) — แก้ลิงก์เมนู + ทำให้เบาลง -->\n  <title>');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F + '  (' + (fs.statSync(F).size / 1024 | 0) + 'KB)');

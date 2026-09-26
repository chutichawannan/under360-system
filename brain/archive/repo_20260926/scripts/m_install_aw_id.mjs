/* ใส่ Google Ads Conversion ID ตัวจริง (06 Ads ส่งมา 26 ส.ค. · ทวงมา 4 รอบ ค้าง 6 วัน)

   ค่าจาก 06:
     Conversion ID : AW-872118373
     Label         : Qp5GCO_i_uQcEOXw7Z8D
     send_to       : AW-872118373/Qp5GCO_i_uQcEOXw7Z8D

   ⚠️ ของเดิม**ถูกคอมเมนต์ทิ้งทั้งก้อน** (<!-- ... -->) ไม่ใช่แค่ค่า placeholder
      → ต้องปลดคอมเมนต์ด้วย ไม่งั้นใส่เลขจริงไปก็ไม่ทำงาน
   ✅ อยู่ร่วมกับ GTM ได้ — คนละ container คนละหน้าที่ ทั้งคู่ push เข้า dataLayer เดียวกันตามมาตรฐาน
   ⛔ ไม่แตะ Meta Pixel / Lead / web_events / UTM+fbclid
   รันซ้ำได้ */
import fs from 'fs';

const AW = 'AW-872118373';
const LABEL = 'Qp5GCO_i_uQcEOXw7Z8D';
const FILES = ['web/index.html', 'web/mealplan.html', 'web/v03.html'];

const BLOCK = `<!-- ═══ Google Ads tag (06 Ads ส่งค่าจริงมา 26 ส.ค. 2026) ═══ -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${AW}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${AW}');
</script>`;

let n = 0;
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.error('❌ ไม่เจอ', f); process.exit(1); }
  const crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
  let h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes(AW)) { console.log('⏭️  ใส่แล้ว:', f); continue; }

  /* ① ปลดคอมเมนต์ + ใส่เลขจริง — จับตั้งแต่เปิดคอมเมนต์ยันปิด */
  const m = h.match(/<!-- ═══ Google Ads tag ═══[\s\S]*?═══════════════════ -->/);
  if (!m) { console.error('❌ ไม่เจอบล็อก Google Ads ใน', f); process.exit(1); }
  h = h.replace(m[0], BLOCK);

  /* ② label ในปุ่มสั่งซื้อ */
  const before = h;
  h = h.replace(/\s*\/\/ TODO \(Claude Code\): แทน CONVERSION_LABEL[^\n]*\n/g, '\n');
  h = h.replace(/'send_to':'AW-XXXXXXXXXX\/CONVERSION_LABEL'/g, `'send_to':'${AW}/${LABEL}'`);
  if (h === before) { console.error('❌ ไม่เจอ send_to ใน', f); process.exit(1); }

  if (h.includes('AW-XXXXXXXXXX') || h.includes('CONVERSION_LABEL')) {
    console.error('❌ ยังเหลือค่าปลอมใน', f); process.exit(1);
  }
  fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log('✅', f);
  n++;
}
console.log(`\n✅ ใส่ ${AW} แล้ว ${n} ไฟล์ — ปลดคอมเมนต์ + ใส่ label ครบ`);

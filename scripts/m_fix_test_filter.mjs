/* อุดตัวกรองออเดอร์เทสในการ์ด "แอดตัวไหนทำเงิน" (m-track 20 ส.ค. 2026)

   เจอตอนเทสกับข้อมูลจริง: ตัวกรองเดิมเทียบชื่อ "ตรงเป๊ะ" → ใบ "Nut เทสสสส" หลุด
   วัดผลกระทบแล้ว (scripts/m_probe_test_filter.mjs): **ปี 2026 หลุด 24 ใบ ฿32,475**
   ทุกชื่อที่หลุดเป็นเทสชัดเจน ไม่มีลูกค้าจริงปน (ตรวจด้วยตาแล้ว)

   ⚠️ ตัวกรองแบบเดียวกันอยู่ใน scripts/finance/orders.mjs ด้วย (ของ f-track) — แจ้งให้แก้แล้ว
      ห้ามแก้ไฟล์ห้องอื่นเอง */
import fs from 'fs';

const F = 'web/web_dashboard.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('adLooseTest')) { console.log('⏭️  อุดแล้ว'); process.exit(0); }

const OLD = `function adIsTest(o){
  if(o.source === 'parallel_test') return true;
  if(o.created_by === '[TEST-P] Claude') return true;
  if(String(o.notes||'').startsWith('[PARALLEL]')) return true;
  return AD_TEST_NAMES.indexOf(String(o.customer_name||'').trim().toLowerCase()) >= 0;
}`;

const NEW = `function adLooseTest(name){
  const s = String(name||'').trim().toLowerCase();
  if(!s) return false;
  if(AD_TEST_NAMES.indexOf(s) >= 0) return true;
  /* "Nut เทสสสส" ต้องโดนด้วย — เดิมเทียบตรงเป๊ะเลยหลุด (ปี 2026 หลุด 24 ใบ ฿32,475) */
  for(var i=0;i<AD_TEST_NAMES.length;i++){ if(s.indexOf(AD_TEST_NAMES[i]) === 0) return true; }
  return /เทส|ทดสอบ|ทดลอบ|test/.test(s);
}
function adIsTest(o){
  if(o.source === 'parallel_test') return true;
  if(o.created_by === '[TEST-P] Claude') return true;
  if(String(o.notes||'').startsWith('[PARALLEL]')) return true;
  return adLooseTest(o.customer_name);
}`;

if (!h.includes(OLD)) { console.error('❌ ไม่เจอฟังก์ชันเดิม'); process.exit(1); }
h = h.replace(OLD, NEW);
fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('✅ อุดตัวกรองเทสในการ์ดแล้ว');

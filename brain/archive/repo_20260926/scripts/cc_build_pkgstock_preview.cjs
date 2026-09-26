/* สร้าง preview/pkgstock_preview.html จาก liff_customer.html
   ไว้ให้นัทกดเทส "เซ็ต/คอร์สเช็คสต็อกแล้ว" จากมือถือ โดยไม่กระทบของจริง
   - ตัด LIFF login (DEV_MODE=true) → เปิดตรงๆ ไม่เด้งไป LINE
   - ปิดปุ่มสั่งซื้อจริง (กันเผลอสร้างออเดอร์ระหว่างเทส)
   - ปิด heartbeat live_presence
   รัน: node scripts/cc_build_pkgstock_preview.cjs */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
let s = fs.readFileSync(path.join(root, 'liff_customer.html'), 'utf8');
function must(from, to) {
  if (!s.includes(from)) { console.error('❌ ไม่เจอข้อความที่ต้องแทน:', from.slice(0, 60)); process.exit(1); }
  s = s.split(from).join(to);
}
must('DEV_MODE:      false,', 'DEV_MODE:      true,   /* preview: ไม่ใช้ LINE login */');
must('  startPresence();', '  /* preview: ปิด presence */');
must('async function submitOrder(', 'async function submitOrder(){ toast("🧪 หน้านี้เป็นตัวอย่างเทส — ยังไม่สั่งจริง"); return; }\nasync function _submitOrderDisabled(');
s = s.replace('<body>', `<body>
<div style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#FEF3C7;color:#713F12;
     font-size:12px;font-weight:700;text-align:center;padding:5px 8px;border-bottom:1px solid #FDE68A;">
  🧪 เทส: เซ็ต/คอร์สเช็คสต็อกแล้ว — กดสั่งจริงไม่ได้
</div>
<div style="height:26px"></div>`);
fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
fs.writeFileSync(path.join(root, 'preview', 'pkgstock_preview.html'), s, 'utf8');
console.log('✅ เขียน preview/pkgstock_preview.html แล้ว (' + Math.round(s.length / 1024) + ' KB)');

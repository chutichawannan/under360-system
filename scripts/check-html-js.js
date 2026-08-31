// ตรวจ syntax ของ JS ที่ฝังใน <script> ของไฟล์ HTML ก้อนเดียว (single-file page)
// เพราะไฟล์เราเป็น HTML ก้อนเดียว ใช้ `node --check file.js` ตรงๆ ไม่ได้
//
// ใช้:  node scripts/check-html-js.js <file.html> [file2.html ...]
// เช่น: node scripts/check-html-js.js main_database_v2.html liff_customer.html
//
// คืนค่า exit 0 = ผ่านหมด, 1 = มี syntax error (ดูบรรทัดที่รายงาน)

const fs = require('fs');
const vm = require('vm');

const files = process.argv.slice(2);
if (!files.length) {
  console.error('ใส่ path ของไฟล์ HTML อย่างน้อย 1 ไฟล์');
  process.exit(2);
}

let totalErrors = 0;
for (const file of files) {
  let html;
  try { html = fs.readFileSync(file, 'utf8'); }
  catch (e) { console.error(`❌ อ่านไฟล์ไม่ได้: ${file} — ${e.message}`); totalErrors++; continue; }

  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m, idx = 0, errors = 0, checked = 0;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;   // ข้าม external <script src="...">
    // ข้าม <script type="..."> ที่ไม่ใช่ JS — เช่น application/ld+json (schema.org), text/template, importmap
    // (แก้ 31 ส.ค. 2026 · m-track: เดิมตรวจ JSON-LD เป็น JS แล้วขึ้น ❌ ทุกหน้าที่มี schema
    //  → ทุกห้องเริ่มชินกับ ❌ แล้วมองข้าม = ของพังจริงจะไม่มีใครเห็น)
    const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    if (type && !/^(module|text\/javascript|application\/javascript)$/i.test(type)) continue;
    const code = m[2];
    if (!code.trim()) continue;
    idx++;
    const startLine = html.slice(0, m.index).split('\n').length;
    try {
      new vm.Script(code, { filename: `${file}#script${idx}` });
      checked++;
    } catch (e) {
      errors++; totalErrors++;
      console.error(`❌ ${file} <script> #${idx} (เริ่มบรรทัด ~${startLine}): ${e.message}`);
    }
  }
  if (errors === 0) console.log(`✅ ${file} — syntax ผ่าน (ตรวจ ${checked} script block)`);
}

process.exit(totalErrors ? 1 : 0);

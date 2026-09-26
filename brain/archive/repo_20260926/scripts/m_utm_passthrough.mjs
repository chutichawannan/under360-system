/* ส่งต่อ "ที่มาของลูกค้า" จากเว็บ → ปลายทาง LINE/LIFF (m-track 20 ส.ค. 2026)
   งานที่เลขาส่งมา: ปุ่ม CTA ชี้ลิงก์ตายตัว ไม่มี UTM ต่อท้าย → ข้อมูลหายกลางทาง

   ⚠️ ตรวจแล้วพบว่ามี **2 รูรั่ว ไม่ใช่รูเดียว**:
   ① ปุ่มไม่ต่อ UTM (ตามที่เลขาแจ้ง)
   ② **ตัวเก็บ UTM เดิมมีเงื่อนไข `if(p.get('utm_source'))`** → คลิกจากแอด Facebook ที่ไม่ได้ติดแท็ก UTM
      จะมาแค่ `?fbclid=...` เพียงอย่างเดียว = **ไม่ถูกเก็บเลยสักตัว** (รูนี้ใหญ่กว่ารูแรก)

   กฎที่ยึด:
   - ไม่มี UTM ต้องกดปุ่มแล้วไป LINE ได้เหมือนเดิม → try/catch ทุกชั้น + คืนลิงก์เดิมเสมอเมื่อพลาด
   - ไม่ใส่ข้อมูลส่วนตัวลูกค้าลง URL — เก็บแค่ที่มาของทราฟฟิก
   - ไม่แตะ Meta Pixel / Lead / web_events / ดีไซน์
   รันซ้ำได้ */
import fs from 'fs';

const FILES = ['web/index.html', 'web/mealplan.html', 'web/blog.html', 'web/v03.html'];

/* วางต่อท้ายบล็อกเก็บ UTM เดิม */
const HELPER = `
/* ═══ ที่มาของลูกค้า: เก็บให้ครบ + ส่งต่อไปปลายทาง (m-track 20 ส.ค. 2026) ═══
   ชื่อพารามิเตอร์ใช้ "ชื่อมาตรฐาน" ทั้งหมด (utm_source/utm_medium/utm_campaign/utm_content/fbclid)
   เพื่อให้ฝั่ง LIFF อ่านได้โดยไม่ต้องตกลงชื่อกันใหม่ */
(function(){
  try{
    var p = new URLSearchParams(location.search);
    var old = {};
    try{ old = JSON.parse(localStorage.getItem('u360_utm')||'{}') || {}; }catch(e){}
    var fbclid = p.get('fbclid') || '';
    var src = p.get('utm_source') || '';
    /* มาจากแอด Facebook แต่ไม่ได้ติดแท็ก UTM → ยังต้องนับได้ ไม่ปล่อยหลุด */
    if(!src && fbclid) src = 'fb';
    if(src){
      var u = {
        source:   src,
        medium:   p.get('utm_medium')   || (fbclid ? 'paid' : '') || old.medium || '',
        campaign: p.get('utm_campaign') || old.campaign || '',
        content:  p.get('utm_content')  || old.content  || '',
        fbclid:   fbclid || old.fbclid || '',
        ts: Date.now()
      };
      try{ localStorage.setItem('u360_utm', JSON.stringify(u)); }catch(e){}
    }
  }catch(e){}
})();

/* ต่อที่มาท้ายลิงก์ ณ ตอนที่ลูกค้ากด — ไม่มีค่า = คืนลิงก์เดิม ปุ่มต้องไม่พัง */
function u360Tracked(base){
  try{
    var q = new URLSearchParams(location.search);
    var st = {};
    try{ st = JSON.parse(localStorage.getItem('u360_utm')||'{}') || {}; }catch(e){}
    var out = new URLSearchParams();
    var put = function(k,v){ v = String(v==null?'':v).trim(); if(v) out.set(k, v.slice(0,80)); };
    put('utm_source',   q.get('utm_source')   || st.source);
    put('utm_medium',   q.get('utm_medium')   || st.medium);
    put('utm_campaign', q.get('utm_campaign') || st.campaign);
    put('utm_content',  q.get('utm_content')  || st.content);
    put('fbclid',       q.get('fbclid')       || st.fbclid);
    var s = out.toString();
    if(!s) return base;
    return base + (String(base).indexOf('?') >= 0 ? '&' : '?') + s;
  }catch(e){ return base; }
}
`;

let n = 0;
for (const f of FILES) {
  if (!fs.existsSync(f)) { console.error('❌ ไม่เจอ', f); process.exit(1); }
  const crlf = fs.readFileSync(f, 'utf8').includes('\r\n');
  let h = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes('u360Tracked')) { console.log('⏭️  ทำแล้ว:', f); continue; }

  /* ① แทรก helper ต่อจากบล็อกเก็บ UTM เดิม */
  /* บล็อกเก็บ UTM เดิมมี 2 หน้าตาในเว็บ (index/v03 อย่างหนึ่ง · mealplan/blog อีกอย่าง)
     → จับตั้งแต่คอมเมนต์ "UTM capture" ยาวไปจนปิด IIFE แทนการจับข้อความเป๊ะ */
  const m = h.match(/\/\*[^*]*UTM capture[\s\S]*?\}\)\(\);\n/);
  if (!m) { console.error('❌ ไม่เจอบล็อกเก็บ UTM เดิมใน', f); process.exit(1); }
  h = h.replace(m[0], m[0] + HELPER);

  /* ② ปุ่มพาไป LINE — ต่อที่มาก่อนพาไป */
  const before = h;
  h = h.replace(/window\.location\.href = ORDER_URL;/g, 'window.location.href = u360Tracked(ORDER_URL);');
  if (h === before) { console.error('❌ ไม่เจอจุดพาไป LINE ใน', f); process.exit(1); }

  fs.writeFileSync(f, crlf ? h.replace(/\n/g, '\r\n') : h);
  console.log('✅', f);
  n++;
}
console.log(`\nเสร็จ ${n} ไฟล์`);

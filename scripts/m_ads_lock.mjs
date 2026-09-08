/* ใส่ล็อกให้หน้า /ads ก่อนที่โทเค็นจริงจะเข้าระบบ (06 ขอ 8 ก.ย. 2026)

   ทำไมต้องทำก่อนใส่โทเค็น: ตอนนี้ noindex = **ซ่อน ไม่ใช่ล็อก**
   ใครได้ลิงก์ไปก็เปิดดูตัวเลขค่าโฆษณาได้หมด · พอใส่โทเค็นแล้วข้อมูลจริงจะไหลเข้าทันที
   → ใส่ล็อกตอนหน้ายังว่างง่ายกว่าตามใส่ทีหลังตอนของสำคัญอยู่ในนั้นแล้ว

   ใช้รหัสชุดเดียวกับหน้า pwa ของบ้านเรา (PIN 4 หลัก) — ไม่คิดแบบใหม่ให้มี 2 มาตรฐาน
   แต่ต่างตรงที่ **ตรวจรหัสฝั่ง server** ไม่ใช่ฝั่งหน้าเว็บ
   ของเดิมใน pwa เก็บรหัสไว้ในโค้ดหน้าเว็บ = เปิด view-source ก็เห็น กันได้แค่คนหลงเข้า
   อันนี้ข้อมูลเป็นค่าโฆษณาจริง เลยให้ server เทียบกับ env แทน หน้าเว็บไม่รู้รหัสเลย

   ⚠️ ยังไม่ใช่ระบบล็อกอินจริง — เป็นรหัสร่วมชุดเดียว
      ตัวจริง (Google login + รายชื่ออีเมล) ต้องให้ u + พี่ปืนเคาะว่าทั้งบ้านใช้อะไร
   รันซ้ำได้ */
import fs from 'fs';

const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

/* ═══ ① ฝั่ง server — ตรวจรหัสก่อนคืนข้อมูล ═══ */
{
  const F = 'web/api/ads-insights.js';
  const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
  let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes('u360-ads-gate')) { console.log('⏭️  server มีล็อกแล้ว'); }
  else {
    const A = "  res.setHeader('X-Robots-Tag', 'noindex, nofollow');";
    must(h.includes(A), 'ไม่เจอจุดแทรกฝั่ง server');
    h = h.replace(A, A + `

  /* ═══ u360-ads-gate — ตรวจรหัสก่อนคืนข้อมูล (06 ขอ 8 ก.ย.) ═══
     รหัสอยู่ใน env ฝั่ง server เท่านั้น หน้าเว็บไม่เคยรู้ค่าจริง
     ADS_PIN ไม่ได้ตั้ง → ใช้รหัสประจำบ้านเดียวกับหน้า pwa เพื่อให้ใช้งานได้ทันที */
  const PIN = process.env.ADS_PIN || '0360';
  const given = (req.headers && (req.headers['x-ads-pin'] || req.headers['X-Ads-Pin']))
             || (req.query && req.query.pin) || '';
  if (String(given) !== String(PIN)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'locked', note: 'ต้องใส่รหัสก่อนดูข้อมูล' }));
  }`);
    fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
    console.log('  ✅ server: ไม่มีรหัสถูกต้อง = คืน 401 ไม่คืนข้อมูลเลย');
  }
}

/* ═══ ② ฝั่งหน้าเว็บ — ถามรหัส แล้วแนบไปกับทุกคำขอ ═══ */
{
  const F = 'web/ads.html';
  const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
  let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
  if (h.includes('u360-ads-gate')) { console.log('⏭️  หน้าเว็บมีล็อกแล้ว'); }
  else {
    /* แนบรหัสไปกับทุกคำขอที่ยิงไป /api/ads-insights */
    const n = (h.match(/fetch\((['"`])\/api\/ads-insights/g) || []).length;
    must(n > 0, 'ไม่เจอจุดที่หน้าเว็บเรียก API');
    h = h.replace(/fetch\((['"`])\/api\/ads-insights([^)]*)\)/g,
      (all, q, rest) => 'fetch(' + q + '/api/ads-insights' + rest + ', {headers:{"x-ads-pin": u360pin()}})');

    must(h.includes('</style>'), 'ไม่เจอ </style>');
    h = h.replace('</style>', `  /* ── u360-ads-gate ── */
  #adsgate { position:fixed; inset:0; z-index:200; display:grid; place-items:center;
             background:#10221A; color:#fff; text-align:center; padding:24px;
             font-family:inherit; }
  #adsgate h2 { font-size:20px; margin:0 0 6px; font-weight:600; }
  #adsgate p { color:#9DB3A8; font-size:14px; margin:0 0 18px; }
  #adsgate input { width:190px; font-size:26px; text-align:center; letter-spacing:8px;
                   padding:12px; border-radius:12px; border:1px solid #2B4238;
                   background:#16281F; color:#fff; font-family:inherit; }
  #adsgate .err { color:#F0A08F; font-size:13px; margin-top:10px; min-height:18px; }
</style>`);

    /* ประตูต้องมาก่อนสคริปต์ที่ยิง API ไม่งั้นจะยิงไปตั้งแต่ยังไม่ปลดล็อก */
    const B = h.indexOf('<script>');
    must(B > 0, 'ไม่เจอสคริปต์ในหน้า');
    h = h.slice(0, B) + `<div id="adsgate">
  <div>
    <h2>ใส่รหัสเพื่อดูตัวเลขโฆษณา</h2>
    <p>หน้านี้มีค่าใช้จ่ายโฆษณาจริง</p>
    <input id="adspin" type="tel" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="รหัสผ่าน">
    <div class="err" id="adspinerr"></div>
  </div>
</div>
<script>
/* u360-ads-gate — หน้าเว็บไม่รู้ค่ารหัสจริง แค่ส่งไปให้ server ตรวจ
   จำไว้ในเครื่องเพื่อไม่ต้องพิมพ์ซ้ำทุกครั้ง */
var U360PIN = '';
function u360pin(){ return U360PIN; }
(function(){
  try{ U360PIN = localStorage.getItem('u360_ads_pin') || ''; }catch(e){}
  var gate=document.getElementById('adsgate'), inp=document.getElementById('adspin'), err=document.getElementById('adspinerr');
  function tryPin(p){
    return fetch('/api/ads-insights?days=1', {headers:{'x-ads-pin':p}}).then(function(r){ return r.status !== 401; });
  }
  function unlock(){ gate.remove(); document.dispatchEvent(new Event('u360-unlocked')); }
  if (U360PIN) { tryPin(U360PIN).then(function(ok){ if(ok) unlock(); else { U360PIN=''; inp.focus(); } }); }
  else setTimeout(function(){ inp.focus(); }, 100);
  inp.addEventListener('input', function(){
    if (inp.value.length < 4) { err.textContent=''; return; }
    var p = inp.value;
    tryPin(p).then(function(ok){
      if (ok) { U360PIN = p; try{ localStorage.setItem('u360_ads_pin', p); }catch(e){} unlock(); }
      else { err.textContent = 'รหัสไม่ถูก'; inp.value=''; }
    });
  });
})();
</script>
` + h.slice(B);
    fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
    console.log('  ✅ หน้าเว็บ: ประตูรหัส + แนบรหัสไปกับคำขอ ' + n + ' จุด');
  }
}
console.log('\n✅ เสร็จ — รหัสเริ่มต้นคือรหัสประจำบ้านเดียวกับหน้า pwa · เปลี่ยนได้ด้วย env ADS_PIN');

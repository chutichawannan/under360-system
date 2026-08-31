/* เพิ่มส่วน "เมนูตามวันส่ง" ลงหน้า /mealplan (ห้องฟ้าสั่ง · นัทย้ำเอง 3 รอบ 27/28/31 ส.ค. 2026)

   ห้องฟ้ากำชับ: "แหล่งข้อมูลอย่าก๊อปมาแปะนิ่ง — แพลนขยับได้
                  คุยกับ u-maintainer ว่า LIFF ดึงเมนูรายวันจากไหน แล้วใช้ทางเดียวกัน"
   → ตามรอยแล้ว: liff_customer.html:1685 อ่าน kitchen_data key 'mp_menu_plan'
   → หน้านี้อ่าน "ลำดับเดียวกับ LIFF เป๊ะ": ① kitchen_data.mp_menu_plan  ② ไฟล์สำรอง
     (เช็ค 31 ส.ค.: ①ว่างจริง · LIFF เองก็ตกไปใช้สำรองอยู่ตอนนี้ — ต้องแจ้ง u-maintainer)

   🔴 กฎแบรนด์ที่ห้ามพลาดในส่วนนี้:
     · ห้ามเขียน "เลือกวันส่งได้" — Meal Plan ทำสด ครัวจัดรอบ จ/พ/ศ เท่านั้น
     · เมนูที่โชว์ = ของที่ครัวทำทั้งวัน ≠ กล่องของลูกค้าคนเดียว (ได้บางส่วนจากนี้)
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/mealplan.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-menu-calendar')) { console.log('⏭️  มีแล้ว'); process.exit(0); }
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

/* ── ① หา section "เริ่มยังไง" แล้วแทรกก่อนหน้า ── */
const ANCHOR = '<section style="background:var(--paper)">';
must(h.includes(ANCHOR), 'ไม่เจอจุดแทรก (section เริ่มยังไง)');

const SECTION = `<!-- ═══ u360-menu-calendar — เมนูตามวันส่ง (ห้องฟ้าส่งข้อมูล · m ทำหน้า 31 ส.ค. 2026) ═══ -->
<section id="menu-calendar">
  <div class="wrap">
    <span class="eyebrow">เมนูจริง ไม่ใช่ภาพตัวอย่าง</span>
    <h2 class="sec">ครัวทำอะไรบ้าง ในแต่ละวันส่ง</h2>
    <p>Meal Plan ปรุงสดใหม่เช้าวันส่ง — ครัวเดินรอบ <b>จันทร์ · พุธ · ศุกร์</b> เปิดดูได้ทั้งที่ผ่านมาแล้วและที่กำลังจะถึง</p>

    <div class="mpcal">
      <div class="mpbar" id="mpBar"><div class="mpload">กำลังโหลดแพลนเมนู…</div></div>
      <div id="mpBody"></div>
    </div>

    <div class="mpnote">
      <b>อ่านตารางนี้ยังไง</b>
      <ul>
        <li>รายการข้างบน = เมนูทั้งหมดที่ครัวทำในวันนั้น — <b>กล่องของคุณจะได้บางส่วนจากนี้</b> ครัวจัดให้ตามเป้าหมายของคุณ และตัดวัตถุดิบที่คุณแพ้ออกให้อัตโนมัติ</li>
        <li>ทุกเมนูทำได้ทั้ง <b>โปรตีนสูง (HP · เนื้อ 170g)</b> และ <b>Low Carb (LC · เนื้อ 120g)</b> — เลือกสายที่ตรงกับเป้าหมาย</li>
        <li>แพลนล่วงหน้าปรับได้ตามของสดที่เข้าครัวจริง หน้านี้จะอัปเดตตาม</li>
      </ul>
    </div>

    <div style="text-align:center;margin-top:34px">
      <a href="#" class="btn-line" onclick="return u360Order(this)">เริ่มทดลอง 7 กล่อง →</a>
    </div>
  </div>
</section>

`;

h = h.replace(ANCHOR, SECTION + ANCHOR);
console.log('  ✅ แทรก section เมนูตามวันส่ง');

/* ── ② CSS ── */
must(h.includes('</style>'), 'ไม่เจอ </style>');
const CSS = `/* ── u360-menu-calendar ── */
.mpcal{margin-top:26px}
.mpbar{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 14px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.mpbar::-webkit-scrollbar{height:5px}
.mpbar::-webkit-scrollbar-thumb{background:#D8DED4;border-radius:99px}
.mpload{color:var(--muted);font-size:.95rem;padding:8px 2px}
.mpday{flex:none;border:1px solid #E2E7DE;background:var(--paper);border-radius:12px;padding:9px 14px;cursor:pointer;
  font-family:'Prompt';font-weight:500;font-size:.92rem;color:var(--ink);line-height:1.35;text-align:center;transition:.15s;white-space:nowrap}
.mpday small{display:block;font-family:'Sarabun';font-weight:400;font-size:.76rem;color:var(--muted)}
.mpday:hover{border-color:var(--green)}
.mpday.on{background:var(--green);border-color:var(--green);color:#fff}
.mpday.on small{color:rgba(255,255,255,.85)}
.mpday.past{opacity:.55}
.mpgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.mpitem{background:var(--paper);border:1px solid #E8ECE5;border-radius:12px;padding:14px 16px}
.mpitem .n{font-family:'Prompt';font-weight:500;font-size:1rem;line-height:1.45}
.mpitem .p{font-size:.84rem;color:var(--muted);margin-top:5px}
.mphead{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin:6px 0 16px}
.mphead h3{font-family:'Prompt';font-weight:600;font-size:1.25rem}
.mphead span{color:var(--muted);font-size:.92rem}
.mpempty{color:var(--muted);padding:18px 0}
.mpnote{margin-top:26px;background:var(--cream);border:1px solid #E8ECE5;border-radius:14px;padding:20px 22px;font-size:.95rem}
.mpnote b{font-family:'Prompt';font-weight:600}
.mpnote ul{margin:10px 0 0;padding-left:20px}
.mpnote li{margin-top:8px;color:var(--muted)}
.mpnote li b{color:var(--ink)}
@media(max-width:600px){.mpgrid{grid-template-columns:1fr}.mpnote{padding:18px}}
`;
h = h.replace('</style>', CSS + '</style>');
console.log('  ✅ CSS');

/* ── ③ JS ── */
const CLIENT = 'const sb = supabase.createClient(SB_URL, SB_KEY);';
must(h.includes(CLIENT), 'ไม่เจอ supabase client');
const JS = `
/* ═══ u360-menu-calendar — โหลดแพลนเมนูรายวัน ═══
   ลำดับแหล่งข้อมูล = เหมือน liff_customer.html เป๊ะ (ห้องฟ้าสั่งให้ใช้ทางเดียวกัน)
   ① kitchen_data.mp_menu_plan (ของสด แอดมินแก้แล้วเปลี่ยนทันทีทั้ง LIFF และเว็บ)
   ② ไฟล์สำรองที่ deploy ไปด้วย — แปลงจากตารางห้องฟ้า (scripts/m_build_mp_plan_json.mjs)
   หาไม่เจอทั้งคู่ = ซ่อนส่วนนี้ทิ้งเงียบๆ ไม่ทำให้หน้าพัง */
var MPCAL = {}, MPCAL_DAY = null;
var MP_DOW = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
var MP_MON = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function mpEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

/* วันนี้ตามเวลาไทยเสมอ — คนดูอาจอยู่คนละโซนเวลากับครัว */
function mpTodayTH(){
  var d = new Date(Date.now() + (new Date().getTimezoneOffset()*60000) + 7*3600000);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function mpFmt(iso){
  var p = iso.split('-'), d = new Date(+p[0], +p[1]-1, +p[2]);
  return { dow: MP_DOW[d.getDay()], date: (+p[2]) + ' ' + MP_MON[+p[1]-1] };
}

async function mpLoadPlan(){
  try{
    var r = await sb.from('kitchen_data').select('data').eq('key','mp_menu_plan').maybeSingle();
    if(r && r.data && r.data.data && Object.keys(r.data.data).length) return r.data.data;
  }catch(e){}
  var urls = ['mp_plan.json','/mp_plan.json'];
  for(var i=0;i<urls.length;i++){
    try{
      var j = await fetch(urls[i]).then(function(x){ return x.ok ? x.json() : null; });
      if(j && j.plan && Object.keys(j.plan).length) return j.plan;
    }catch(e){}
  }
  return {};
}

function mpRenderBar(){
  var days = Object.keys(MPCAL).sort(), today = mpTodayTH();
  document.getElementById('mpBar').innerHTML = days.map(function(k){
    var f = mpFmt(k);
    return '<button class="mpday'+(k===MPCAL_DAY?' on':'')+(k<today?' past':'')+'" data-d="'+k+'">'
         + f.dow + '<small>' + f.date + '</small></button>';
  }).join('');
  Array.prototype.forEach.call(document.querySelectorAll('.mpday'), function(b){
    b.onclick = function(){ MPCAL_DAY = b.dataset.d; mpRenderBar(); mpRenderDay();
      b.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'}); };
  });
  var on = document.querySelector('.mpday.on');
  if(on) on.scrollIntoView({block:'nearest', inline:'center'});
}

function mpRenderDay(){
  var list = MPCAL[MPCAL_DAY] || [], f = mpFmt(MPCAL_DAY), today = mpTodayTH();
  var when = MPCAL_DAY === today ? 'ส่งวันนี้' : (MPCAL_DAY > today ? 'กำลังจะถึง' : 'ผ่านมาแล้ว');
  document.getElementById('mpBody').innerHTML =
    '<div class="mphead"><h3>' + f.dow + ' ' + f.date + '</h3><span>' + when
      + ' · ครัวทำ ' + list.length + ' เมนู</span></div>'
    + (list.length
        ? '<div class="mpgrid">' + list.map(function(m){
            return '<div class="mpitem"><div class="n">' + mpEsc(m.name) + '</div>'
                 + (m.protein ? '<div class="p">' + mpEsc(m.protein) + '</div>' : '') + '</div>';
          }).join('') + '</div>'
        : '<div class="mpempty">วันนี้ยังไม่ได้ลงแพลนเมนู</div>');
}

(async function mpInit(){
  MPCAL = await mpLoadPlan();
  var days = Object.keys(MPCAL).sort();
  var sec = document.getElementById('menu-calendar');
  if(!days.length){ if(sec) sec.style.display = 'none'; return; }
  var today = mpTodayTH();
  MPCAL_DAY = days.filter(function(k){ return k >= today; })[0] || days[days.length-1];
  mpRenderBar(); mpRenderDay();
})();
`;
h = h.replace(CLIENT, CLIENT + '\n' + JS);
console.log('  ✅ JS โหลดแพลน (ของสดก่อน → สำรอง)');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F);

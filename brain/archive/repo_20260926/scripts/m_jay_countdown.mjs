/* งานนัท 9 ก.ย. 2026 (ผ่าน 06) — 2 อย่างในหน้า /jay
   ① นับถอยหลังถึงวันเริ่มเทศกาลกินเจ (10 ต.ค. 2569)
      ⛔ นัทสั่งเองว่า **ห้ามนับ "เหลือ N คอร์ส"** — เลขคอร์สถ้าไม่ตรงของจริงคือโกหกลูกค้า
         จำนวนวันเป็นของจริงที่ตรวจสอบได้ ไม่มีทางผิด
   ② เก็บรหัสชิ้นงานโฆษณาลงสถิติเว็บด้วย
      ตาราง web_events ไม่มีคอลัมน์ utm_content (เช็คแล้ว · เพิ่มคอลัมน์ต้องขออนุญาตก่อน)
      → พับเข้า utm_campaign แบบเดียวกับที่ทำกับ LIFF: jay2026 → jay2026-a1
      ได้อะไร: รู้ว่า "รูปไหนพาคนมาถึงหน้าแล้วอ่านต่อ" ไม่ใช่แค่ "รูปไหนคนกด"
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/jay.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');

/* ═══ ① นับถอยหลัง ═══ */
if (h.includes('u360-countdown')) console.log('  ⏭️  มีตัวนับถอยหลังแล้ว');
else {
  const A = '<p class="dates muted">9–18 ตุลาคม 2569 รวมวันล้างท้อง</p>';
  must(h.includes(A), 'ไม่เจอบรรทัดวันที่');
  h = h.replace(A, A + '\n          <p class="countdown" id="countdown" hidden><!-- u360-countdown --></p>');

  must(h.includes('</style>'), 'ไม่เจอ </style>');
  h = h.replace('</style>', `    /* ── u360-countdown ── */
    .countdown { display:inline-flex; align-items:center; gap:8px; margin:12px 0 0;
                 background:var(--soft); border:1px solid var(--line); border-radius:999px;
                 padding:6px 14px; font-size:14px; font-weight:500; color:var(--green); }
    .countdown b { font-weight:600; }
    @media (max-width:700px) { .countdown { font-size:min(13px,2.9vw); padding:5px 11px; margin-top:9px; } }
</style>`);

  const B = '\n</script>\n</body>';
  must(h.includes(B), 'ไม่เจอท้ายสคริปต์');
  h = h.replace(B, `
/* u360-countdown — นับวันถึงวันเริ่มเทศกาล (10 ต.ค. 2569)
   คิดตามเวลาไทยเสมอ เพราะคนดูอยู่ไทย แต่เครื่องที่รันอาจอยู่คนละโซน
   ⛔ ไม่นับ "เหลือกี่คอร์ส" — นัทตัดออกเอง เลขที่ไม่ตรงของจริง = โกหกลูกค้า */
(function(){
  var el=document.getElementById('countdown'); if(!el) return;
  function thaiToday(){
    var n=new Date();
    var t=new Date(n.getTime()+(n.getTimezoneOffset()*60000)+7*3600000);
    return new Date(t.getFullYear(),t.getMonth(),t.getDate());
  }
  var START=new Date(2026,9,10);              /* 10 ต.ค. 2026 = 2569 */
  var d=Math.round((START-thaiToday())/864e5);
  if(d>1)       el.innerHTML='🗓️ เหลืออีก <b>'+d+' วัน</b> ถึงเทศกาลกินเจ';
  else if(d===1)el.innerHTML='🗓️ <b>พรุ่งนี้</b> เริ่มเทศกาลกินเจแล้ว';
  else if(d===0)el.innerHTML='🗓️ <b>วันนี้</b> เริ่มเทศกาลกินเจแล้ว';
  else return;                                 /* เลยวันเริ่มแล้ว ไม่ต้องโชว์ */
  el.removeAttribute('hidden');
})();
` + B);
  console.log('  ✅ ① นับถอยหลังถึง 10 ต.ค. (ไม่นับจำนวนคอร์ส ตามที่นัทสั่ง)');
}

/* ═══ ② พับรหัสชิ้นงานเข้า campaign ของสถิติเว็บ ═══ */
if (h.includes('u360-track-content')) console.log('  ⏭️  พับแล้ว');
else {
  const C = "        utm_source:u.source||null, utm_medium:u.medium||null, utm_campaign:u.campaign||null,\n        referrer:document.referrer||null, ua:(navigator.userAgent||'').slice(0,200)})";
  must(h.includes(C), 'ไม่เจอจุดส่งสถิติ');
  h = h.replace(C, `        utm_source:u.source||null, utm_medium:u.medium||null,
        /* u360-track-content — ตาราง web_events ไม่มีคอลัมน์ utm_content
           พับรหัสชิ้นงานเข้า campaign แทน (jay2026 → jay2026-a1) จะได้แยกออกว่ามาจากรูปไหน
           ตัวคั่นใช้ - ให้ตรงกับที่พับฝั่ง LIFF จะได้เทียบกันได้ */
        utm_campaign:(function(){ var c=u.campaign||null, ct=(u.content||'').replace(/[^A-Za-z0-9._-]/g,'').slice(0,24);
                                  return c && ct ? c+'-'+ct : c; })(),
        referrer:document.referrer||null, ua:(navigator.userAgent||'').slice(0,200)})`);
  console.log('  ✅ ② สถิติเว็บแยกรายชิ้นงานได้ (พับเข้า campaign · ไม่ต้องเพิ่มคอลัมน์)');
}

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('\n✅ ' + F);

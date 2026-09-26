/* หน้า /ads: เพิ่มส่วน Google Ads (นัทสั่ง 9 ก.ย. 2026 ผ่าน 06)

   นัทเปิดหน้าแล้วเห็นแต่ Meta = ไม่รู้ว่าเงินที่ไป Google ได้อะไรกลับมา
   คำถามที่หน้านี้ต้องตอบ: "วันนี้เงินไป Meta เท่าไหร่ ไป Google เท่าไหร่ แต่ละทางได้ออเดอร์กี่ใบ"

   ⚖️ ทำได้แค่ครึ่งเดียว และต้องบอกให้ชัดว่าครึ่งไหน
     ✅ ฝั่งผลลัพธ์ (คนเข้าเว็บ · กดไป LINE · ออเดอร์ · ยอดเงิน) — เราวัดเองได้ ไม่ต้องพึ่งใคร
     ❌ ฝั่งค่าใช้จ่าย — ต้องต่อ Google Ads API ซึ่งรอ developer token อนุมัติ
     → โชว์เท่าที่วัดได้จริง **และเขียนบอกตรงๆ ว่าช่องค่าใช้จ่ายยังไม่มี**
       ห้ามเว้นว่างเฉยๆ เพราะคนอ่านจะนึกว่า "ใช้เงิน 0 บาท"

   ยืนยันกับข้อมูลจริงก่อนเขียน: มี google/cpc/jay2026-g1 เข้ามาแล้ว 10 ครั้ง · ออเดอร์ 0
   รันซ้ำได้ */
import fs from 'fs';

const A = 'web/api/ads-insights.js';
const H = 'web/ads.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const rd = f => ({ crlf: fs.readFileSync(f, 'utf8').includes('\r\n'), h: fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n') });
const wr = (f, o) => fs.writeFileSync(f, o.crlf ? o.h.replace(/\n/g, '\r\n') : o.h);

/* ═══ ฝั่ง server ═══ */
{
  const o = rd(A);
  if (o.h.includes('u360-google')) { console.log('⏭️  server ทำแล้ว'); }
  else {
    const ANCH = '  /* ── ③ ธงเตือน ── */';
    must(o.h.includes(ANCH), 'ไม่เจอจุดแทรก');
    o.h = o.h.replace(ANCH, `  /* ── u360-google — ฝั่ง Google Ads ──
     ค่าใช้จ่ายยังดึงไม่ได้ (ต้องต่อ Google Ads API รอ developer token)
     แต่ผลลัพธ์ฝั่งเราวัดเองได้ทั้งหมด จาก utm ที่ติดมากับลิงก์แอด */
  try {
    const gv = SB + '/rest/v1/web_events?select=event&utm_source=eq.google'
             + '&created_at=gte.' + since + 'T00:00:00&limit=5000';
    const go = SB + '/rest/v1/orders?select=total,source_campaign'
             + '&source_campaign=like.google/*&total=gt.0'
             + '&created_at=gte.' + since + 'T00:00:00&limit=2000';
    const [rv, ro] = await Promise.all([
      fetch(gv, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } }),
      fetch(go, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } }),
    ]);
    const evs = rv.ok ? await rv.json() : [];
    const ods = ro.ok ? await ro.json() : [];
    out.google = {
      visits:  evs.filter(x => x.event === 'pageview').length,
      toLine:  evs.filter(x => x.event === 'cta_click').length,
      orders:  ods.length,
      revenue: +ods.reduce((s, x) => s + (+x.total || 0), 0).toFixed(2),
      spend:   null,   /* ยังดึงไม่ได้ — หน้าเว็บต้องเขียนบอก ไม่ใช่โชว์ 0 */
      spendNote: 'ยังต่อ Google Ads API ไม่ได้ (รอ developer token) — ดูค่าใช้จ่ายในคอนโซล Google ก่อน'
    };
  } catch (e) { /* ไม่มีฝั่ง Google ก็ยังดู Meta ได้ */ }

${ANCH}`);
    wr(A, o);
    console.log('  ✅ server: นับผลลัพธ์ฝั่ง Google (คนเข้า · กดไป LINE · ออเดอร์ · ยอดเงิน)');
  }
}

/* ═══ ฝั่งหน้าเว็บ ═══ */
{
  const o = rd(H);
  if (o.h.includes('u360-google-ui')) { console.log('⏭️  หน้าเว็บทำแล้ว'); }
  else {
    /* กล่องแยกใต้ตาราง Meta */
    const CARDS = '  <div class="funnel" id="funnel" hidden></div>';
    must(o.h.includes(CARDS), 'ไม่เจอกล่องแถวสรุป');
    o.h = o.h.replace(CARDS, CARDS + '\n  <div class="gsec" id="gsec" hidden></div>');

    const ANCH = '\n</script>\n</body>';
    must(o.h.includes(ANCH), 'ไม่เจอท้ายสคริปต์');
    o.h = o.h.replace(ANCH, `
/* u360-google-ui — ฝั่ง Google Ads
   ช่องค่าใช้จ่ายเขียนบอกตรงๆ ว่ายังดึงไม่ได้ **ห้ามโชว์ 0** เดี๋ยวอ่านว่าไม่ได้ใช้เงิน */
function renderGoogle(g){
  var box = document.getElementById('gsec'); if (!box || !g) return;
  var cells = [
    ['ใช้ไป', g.spend == null ? '<span class="na">ยังดึงไม่ได้</span>' : baht(g.spend)],
    ['คนเข้าหน้าเจ', Number(g.visits || 0).toLocaleString('th-TH')],
    ['กดไป LINE', Number(g.toLine || 0).toLocaleString('th-TH')],
    ['ออเดอร์จริง', Number(g.orders || 0).toLocaleString('th-TH')],
    ['ยอดขาย', g.revenue ? baht(g.revenue) : '—']
  ];
  box.innerHTML = '<h2 class="gh">🔍 Google Ads</h2>'
    + '<div class="gcards">' + cells.map(function(c){
        return '<div class="gcard"><div class="k">' + c[0] + '</div><div class="v">' + c[1] + '</div></div>';
      }).join('') + '</div>'
    + (g.spendNote ? '<p class="gnote">' + esc(g.spendNote) + '</p>' : '');
  box.removeAttribute('hidden');
}
${ANCH}`);

    /* เรียกตอนวาดหน้า */
    const CALL = '  renderFunnel(d.funnel);   /* u360-thumbs-ui */';
    must(o.h.includes(CALL), 'ไม่เจอจุดเรียก renderFunnel');
    o.h = o.h.replace(CALL, CALL + '\n  renderGoogle(d.google);   /* u360-google-ui */');

    must(o.h.includes('</style>'), 'ไม่เจอ </style>');
    o.h = o.h.replace('</style>', `  /* ── u360-google-ui ── */
  .gsec { margin-top:22px; }
  .gh { font-size:1rem; margin-bottom:10px; }
  .gcards { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:10px; }
  .gcard { background:var(--paper); border:1px solid var(--hair); border-radius:12px; padding:12px 14px; }
  .gcard .k { font-size:.8rem; color:var(--muted); }
  .gcard .v { font-family:'Prompt'; font-weight:700; font-size:1.35rem; line-height:1.25; margin-top:2px; }
  .gcard .na { font-family:'Sarabun'; font-weight:400; font-size:.85rem; color:var(--muted); }
  .gnote { font-size:.82rem; color:var(--muted); margin-top:8px; }
</style>`);
    wr(H, o);
    console.log('  ✅ หน้าเว็บ: กล่อง Google Ads แยกจาก Meta + เขียนบอกว่าค่าใช้จ่ายยังดึงไม่ได้');
  }
}
console.log('\n✅ เสร็จ');

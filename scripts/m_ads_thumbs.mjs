/* หน้า /ads: ให้เห็น "รูปไหน" ไม่ใช่แค่ชื่อ d1 d4 d5 (นัทสั่งเอง 9 ก.ย. 2026 ผ่าน 06)

   นัทเปิดหน้าแล้วพูดตรงๆ: "d1 d4 d5 คืออะไรไม่รู้เรื่องเลย ว่าใช้รูปไหน อะไรยังไง"

   ทำ 4 อย่าง
   ① รูปครีเอทีฟจริงในแต่ละแถว — ดึง thumbnail จาก Meta
   ② บอกว่ายิงใส่ใคร — **ใช้ชื่อชุดโฆษณาที่ Meta ส่งมาเอง** ไม่ฝังคำแปลไว้ในโค้ด
      (เช่น "A · Lookalike ลูกค้าซื้อจริง" · "C · เคยซื้อคอร์สเจ (จากเบอร์)")
      ⚠️ 06 ส่งคำแปลมาให้ฝัง แต่ไม่ตรงกับที่ Meta ส่งจริง (เขาบอก a = คนที่เคยซื้อเรา
         แต่ของจริง A = Lookalike ส่วน C ต่างหากที่เคยซื้อ) → ฝังไว้จะผิดตั้งแต่วันแรก
         และพอ 06 เปลี่ยนชุดโฆษณา คำแปลในโค้ดจะเก่าทันทีโดยไม่มีใครรู้
   ③ แอดที่ปิด/ลบไปแล้ว ติดป้าย + ดันลงล่าง — ไม่งั้นนัทนึกว่ายังรันอยู่
   ④ แถวสรุปช่องทาง: คลิก → เข้าหน้าเจ → กดไป LINE → จองจริง (บอกว่ารั่วตรงไหน)

   รันซ้ำได้ */
import fs from 'fs';

const A = 'web/api/ads-insights.js';
const H = 'web/ads.html';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const rd = f => ({ crlf: fs.readFileSync(f, 'utf8').includes('\r\n'), h: fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n') });
const wr = (f, o) => fs.writeFileSync(f, o.crlf ? o.h.replace(/\n/g, '\r\n') : o.h);

/* ═══════════ ฝั่ง server ═══════════ */
{
  const o = rd(A);
  if (o.h.includes('u360-ads-thumbs')) { console.log('⏭️  server ทำแล้ว'); }
  else {
    /* ① ขอ ad_id มาด้วย จะได้ไปดึงรูปต่อได้ */
    const F1 = "+ '&fields=campaign_name,adset_name,ad_name,spend,impressions,reach,frequency,clicks,cpc,ctr'";
    must(o.h.includes(F1), 'ไม่เจอ fields ของ insights');
    o.h = o.h.replace(F1, "+ '&fields=campaign_name,adset_name,ad_name,ad_id,spend,impressions,reach,frequency,clicks,cpc,ctr'");

    /* เก็บ ad_id ตอนรวมรายวัน */
    const F2 = "      const a = byAd.get(k) || { ad: k, campaign: d.campaign_name || '', adset: d.adset_name || '',\n                                 spend: 0, impressions: 0, reach: 0, clicks: 0, freqSum: 0, n: 0 };";
    must(o.h.includes(F2), 'ไม่เจอจุดรวมรายวัน');
    o.h = o.h.replace(F2, "      const a = byAd.get(k) || { ad: k, id: d.ad_id || '', campaign: d.campaign_name || '', adset: d.adset_name || '',\n                                 spend: 0, impressions: 0, reach: 0, clicks: 0, freqSum: 0, n: 0 };");

    const F3 = "      ad: a.ad, campaign: a.campaign, adset: a.adset,";
    must(o.h.includes(F3), 'ไม่เจอจุดสร้างผลลัพธ์');
    o.h = o.h.replace(F3, "      ad: a.ad, id: a.id, campaign: a.campaign, adset: a.adset,");

    /* ② ดึงรูป + สถานะ แล้วแปะกลับเข้าแต่ละแถว */
    const F4 = "    const yest = th(new Date(Date.now() - 864e5));";
    must(o.h.includes(F4), 'ไม่เจอจุดคำนวณ totals');
    o.h = o.h.replace(F4, `    /* ═══ u360-ads-thumbs — ดึงรูปครีเอทีฟ + สถานะ มาแปะแต่ละแถว ═══
       นัทดูหน้านี้แล้วต้องรู้ว่า "d1 คือรูปไหน" ไม่ใช่จำรหัสเอง
       ขอทีเดียวทุก id (ids=) ไม่ยิงทีละใบ · ล้มก็ไม่เป็นไร ตัวเลขยังโชว์ได้ */
    try {
      const ids = out.ads.map(a => a.id).filter(Boolean);
      if (ids.length) {
        const cu = 'https://graph.facebook.com/v21.0/?ids=' + encodeURIComponent(ids.join(','))
                 + '&fields=effective_status,creative{thumbnail_url}'
                 + '&access_token=' + encodeURIComponent(T);
        const cr = await fetch(cu);
        const cj = await cr.json();
        if (!cj.error) {
          for (const a of out.ads) {
            const info = cj[a.id];
            if (!info) continue;
            a.thumb = (info.creative && info.creative.thumbnail_url) || null;
            a.status = info.effective_status || null;
            /* แอดที่ไม่ได้วิ่งแล้ว = ยอดเงินค้างในประวัติ ไม่ใช่ของที่กำลังใช้เงินอยู่ */
            a.live = a.status === 'ACTIVE';
          }
        }
      }
    } catch (e) { /* ไม่มีรูปก็ยังอ่านตัวเลขได้ ไม่ทำให้ทั้งหน้าล่ม */ }

    /* แอดที่ยังวิ่งอยู่ขึ้นก่อนเสมอ · ที่ปิดแล้วดันลงล่าง */
    out.ads.sort((x, y) => (y.live === true) - (x.live === true) || y.spend - x.spend);

    const yest = th(new Date(Date.now() - 864e5));`);
    wr(A, o);
    console.log('  ✅ server: ดึงรูปครีเอทีฟ + สถานะ + เรียงตัวที่ยังวิ่งขึ้นก่อน');
  }
}

/* ═══════════ ฝั่ง server — แถวสรุปช่องทาง ═══════════ */
{
  const o = rd(A);
  if (o.h.includes('u360-funnel')) { console.log('⏭️  แถวสรุปช่องทางทำแล้ว'); }
  else {
    const F = "  /* ── ③ ธงเตือน ── */";
    must(o.h.includes(F), 'ไม่เจอจุดใส่ธงเตือน');
    o.h = o.h.replace(F, `  /* ── u360-funnel — คลิก → เข้าหน้าเจ → กดไป LINE → จองจริง ──
     ตารางรายชิ้นงานบอกไม่ได้ว่า "รั่วตรงไหน" แถวนี้บอกได้ */
  try {
    const q = SB + '/rest/v1/web_events?select=event&page=eq.jay'
            + '&created_at=gte.' + since + 'T00:00:00&limit=5000';
    const r = await fetch(q, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    if (r.ok) {
      const rows = await r.json();
      out.funnel = {
        clicks:   out.totals ? out.totals.clicks : 0,
        visits:   rows.filter(x => x.event === 'pageview').length,
        toLine:   rows.filter(x => x.event === 'cta_click').length,
        orders:   out.orders ? out.orders.matched : 0
      };
    }
  } catch (e) { /* ไม่มีแถวสรุปก็ยังดูตารางได้ */ }

${F}`);
    wr(A, o);
    console.log('  ✅ server: แถวสรุปช่องทาง (คลิก → เข้าหน้า → กดไป LINE → จอง)');
  }
}

/* ═══════════ ฝั่งหน้าเว็บ ═══════════ */
{
  const o = rd(H);
  if (o.h.includes('u360-thumbs-ui')) { console.log('⏭️  หน้าเว็บทำแล้ว'); }
  else {
    /* แถวตาราง: เปลี่ยนเซลล์ชื่อให้มีรูป + ชื่อกลุ่ม + ป้ายปิดแล้ว
       เซลล์เดิมกินหลายบรรทัด ต้องแทนทั้งก้อน ไม่ใช่บรรทัดเดียว */
    const NAMECELL = `            + '<td>' + esc(a.ad)
              + (a.campaign ? '<div style="font-size:.82rem;color:var(--muted)">' + esc(a.campaign) + '</div>' : '')
              + (bad ? a.flags.map(function(f){return '<span class="flag">'+esc(f)+'</span>';}).join('') : '')
            + '</td>'`;
    must(o.h.includes(NAMECELL), 'ไม่เจอเซลล์ชื่อชิ้นงาน (โครงเปลี่ยนไปจากที่คาด)');
    o.h = o.h.replace(NAMECELL, `            + '<td class="adcell-wrap">' + adCell(a)   /* u360-thumbs-ui */
              + (bad ? a.flags.map(function(f){return '<span class="flag">'+esc(f)+'</span>';}).join('') : '')
            + '</td>'`);

    /* ฟังก์ชันสร้างเซลล์ + แถวสรุป */
    const ANCH = '\n</script>\n</body>';
    must(o.h.includes(ANCH), 'ไม่เจอท้ายสคริปต์');
    o.h = o.h.replace(ANCH, `
/* u360-thumbs-ui — เซลล์ชื่อชิ้นงาน: รูปจริง + ชื่อ + ยิงใส่ใคร + ป้ายถ้าปิดแล้ว
   ชื่อกลุ่มใช้ชื่อชุดโฆษณาที่ Meta ส่งมาเอง ไม่ฝังคำแปลไว้ในโค้ด
   (ฝังไว้ = พอ 06 เปลี่ยนชุด คำอธิบายจะเก่าโดยไม่มีใครรู้) */
/* ใช้ esc() ที่หน้านี้มีอยู่แล้ว ไม่ประกาศซ้ำ */
function adCell(a){
  var img = a.thumb
    ? '<img class="adthumb" src="' + esc(a.thumb) + '" alt="" loading="lazy">'
    : '<span class="adthumb none"></span>';
  var dead = (a.live === false) ? '<span class="dead">ปิดแล้ว</span>' : '';
  return '<span class="adcell">' + img + '<span class="adinfo"><b>' + esc(a.ad) + '</b>' + dead
       + '<em>' + esc(a.adset || '') + '</em></span></span>';
}
/* แถวสรุปช่องทาง — บอกว่าคนหายตรงไหน */
function renderFunnel(f){
  if (!f) return;
  var box = document.getElementById('funnel'); if (!box) return;
  var steps = [['กดจากแอด', f.clicks], ['เข้าหน้าเจ', f.visits], ['กดไป LINE', f.toLine], ['จองจริง', f.orders]];
  box.innerHTML = steps.map(function(s, i){
    var prev = i ? steps[i-1][1] : 0;
    var pct = (i && prev) ? Math.round(s[1] / prev * 100) + '%' : '';
    return (i ? '<span class="arw">' + pct + ' ›</span>' : '')
         + '<span class="fstep"><b>' + s[1].toLocaleString('th-TH') + '</b><em>' + s[0] + '</em></span>';
  }).join('');
  box.removeAttribute('hidden');
}
${ANCH}`);

    /* กล่องแถวสรุป */
    const CARDS = '  <div class="cards" id="cards"></div>';
    must(o.h.includes(CARDS), 'ไม่เจอกล่องการ์ด');
    o.h = o.h.replace(CARDS, CARDS + '\n  <div class="funnel" id="funnel" hidden></div>');

    /* CSS */
    must(o.h.includes('</style>'), 'ไม่เจอ </style>');
    o.h = o.h.replace('</style>', `  /* ── u360-thumbs-ui ── */
  .adcell-wrap { display:block; }
  .adcell { display:flex; align-items:center; gap:10px; min-width:190px; }
  .adthumb { width:44px; height:44px; border-radius:8px; object-fit:cover; flex-shrink:0;
             border:1px solid var(--line,#e5eae6); background:var(--soft,#f7f9f7); display:block; }
  .adthumb.none { display:block; }
  .adinfo { display:flex; flex-direction:column; line-height:1.35; min-width:0; }
  .adinfo b { font-weight:600; font-size:13px; }
  .adinfo em { font-style:normal; font-size:11px; opacity:.7; }
  .dead { display:inline-block; margin-left:6px; font-size:10px; font-weight:500;
          background:#EEE; color:#777; border-radius:5px; padding:1px 5px; vertical-align:1px; }
  .funnel { display:flex; align-items:center; flex-wrap:wrap; gap:6px 4px; margin:14px 0 4px;
            padding:14px 12px; border:1px solid var(--line,#e5eae6); border-radius:14px;
            background:var(--soft,#f7f9f7); }
  .fstep { display:flex; flex-direction:column; align-items:center; min-width:66px; }
  .fstep b { font-size:19px; font-weight:600; line-height:1.3; }
  .fstep em { font-style:normal; font-size:11px; opacity:.7; }
  .arw { font-size:11px; opacity:.55; padding:0 2px; }
</style>`);
    wr(H, o);
    console.log('  ✅ หน้าเว็บ: รูปครีเอทีฟ + ชื่อกลุ่มจริง + ป้ายปิดแล้ว + แถวสรุปช่องทาง');
  }
}
console.log('\n✅ เสร็จ');

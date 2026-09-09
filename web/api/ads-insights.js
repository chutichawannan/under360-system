/* ═══ ตัวเลขค่าโฆษณา Meta — ฝั่ง server เท่านั้น (m-track 2 ก.ย. 2026) ═══

   🔴 ข้อบังคับข้อเดียวจากบรีฟ 06 ที่ห้ามพลาด:
      **โทเค็น Meta ห้ามอยู่ในไฟล์ HTML เด็ดขาด**
      บ้านเราเขียน single-file แล้วใส่ anon key ในหน้าเว็บเป็นปกติ
      ถ้าเผลอทำแบบเดียวกันกับโทเค็นนี้ = ใครก็อ่านข้อมูลโฆษณาเราได้หมด
   → ไฟล์นี้อยู่ฝั่ง server · หน้าเว็บเรียกมาที่นี่ · ได้กลับไปแต่ "ตัวเลขที่คำนวณแล้ว"
     ไม่มีทางที่โทเค็นจะหลุดไปถึงเบราว์เซอร์

   ยอดออเดอร์ก็นับที่นี่เหมือนกัน — หน้าเว็บจะได้ไม่ต้องดึงแถวออเดอร์ลงเบราว์เซอร์
   (ตัวเลขโฆษณาเสี่ยงต่ำ แต่ข้อมูลออเดอร์เสี่ยงสูงกว่า ไม่ส่งลงไปเลยดีกว่า)

   ต้องมีใน Vercel env ของโปรเจค under360-web:
     META_TOKEN        โทเค็นระบบ (ไม่มีวันหมดอายุ) — 06 เป็นคนส่งให้
     META_AD_ACCOUNT   act_463330657546428
   ไม่มี env = ตอบ 200 พร้อมธงบอกว่ายังไม่ได้ตั้งค่า (ไม่ทำให้หน้าพัง) */

const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

/* เกณฑ์ธงเตือน — มาจากบรีฟ 06 (กฎปิดแอด) */
const FLAG_CPC   = 15;    /* ต่อคลิกเกินนี้ = แพงเกิน */
const FLAG_SPEND = 500;   /* ใช้เกินนี้แล้วยังไม่มีออเดอร์ = ควรปิด */

const th = d => new Date(d.getTime() + 7 * 3600000).toISOString().slice(0, 10);

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  /* หน้าหลังบ้าน ห้ามให้ Google เก็บผลลัพธ์ */
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  /* ═══ u360-ads-gate — ตรวจรหัสก่อนคืนข้อมูล (06 ขอ 8 ก.ย.) ═══
     รหัสอยู่ใน env ฝั่ง server เท่านั้น หน้าเว็บไม่เคยรู้ค่าจริง
     ADS_PIN ไม่ได้ตั้ง → ใช้รหัสประจำบ้านเดียวกับหน้า pwa เพื่อให้ใช้งานได้ทันที */
  const PIN = process.env.ADS_PIN || '0360';
  const given = (req.headers && (req.headers['x-ads-pin'] || req.headers['X-Ads-Pin'])) || '';
  if (String(given) !== String(PIN)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'locked', note: 'ต้องใส่รหัสก่อนดูข้อมูล' }));
  }

  const T   = process.env.META_TOKEN;
  const ACC = process.env.META_AD_ACCOUNT;
  const days = Math.min(90, Math.max(1, parseInt((req.query && req.query.days) || '7', 10) || 7));

  const until = th(new Date());
  const since = th(new Date(Date.now() - (days - 1) * 864e5));
  const out = { since, until, days, updatedAt: new Date().toISOString(), ads: [], totals: null, note: null };

  if (!T || !ACC) {
    out.setupNeeded = true;
    out.note = 'ยังไม่ได้ตั้ง META_TOKEN / META_AD_ACCOUNT ใน Vercel env ของโปรเจคเว็บ';
    res.end(JSON.stringify(out));
    return;
  }

  /* ── ① ตัวเลขจาก Meta ── */
  try {
    const url = 'https://graph.facebook.com/v21.0/' + encodeURIComponent(ACC) + '/insights?level=ad'
      + '&time_range=' + encodeURIComponent(JSON.stringify({ since, until }))
      + '&time_increment=1'
      + '&fields=campaign_name,adset_name,ad_name,ad_id,spend,impressions,reach,frequency,clicks,cpc,ctr'
      + '&limit=500&access_token=' + encodeURIComponent(T);
    const r = await fetch(url);
    const j = await r.json();
    if (j.error) {
      /* ⚠️ ห้ามส่งข้อความ error ดิบกลับไป — บางทีมีเศษโทเค็นติดมาด้วย */
      out.error = 'ดึงข้อมูลจาก Meta ไม่ได้ (' + (j.error.code || '?') + ')';
      res.end(JSON.stringify(out));
      return;
    }

    /* รวมรายวันให้เป็นรายชิ้นงาน + แยกยอดของวันนี้/เมื่อวานไว้เทียบ */
    const byAd = new Map();
    const spendByDay = {};
    for (const d of j.data || []) {
      const day = d.date_start;
      spendByDay[day] = (spendByDay[day] || 0) + (+d.spend || 0);
      const k = d.ad_name || '(ไม่มีชื่อ)';
      const a = byAd.get(k) || { ad: k, id: d.ad_id || '', campaign: d.campaign_name || '', adset: d.adset_name || '',
                                 spend: 0, impressions: 0, reach: 0, clicks: 0, freqSum: 0, n: 0 };
      a.spend += +d.spend || 0;
      a.impressions += +d.impressions || 0;
      a.reach += +d.reach || 0;      /* หมายเหตุ: reach รายวันบวกกันจะนับคนซ้ำ — ดูเป็นแนวโน้มพอ */
      a.clicks += +d.clicks || 0;
      a.freqSum += +d.frequency || 0; a.n++;
      byAd.set(k, a);
    }
    out.ads = [...byAd.values()].map(a => ({
      ad: a.ad, id: a.id, campaign: a.campaign, adset: a.adset,
      spend: +a.spend.toFixed(2), impressions: a.impressions, reach: a.reach, clicks: a.clicks,
      frequency: a.n ? +(a.freqSum / a.n).toFixed(2) : 0,
      cpc: a.clicks ? +(a.spend / a.clicks).toFixed(2) : 0,
      ctr: a.impressions ? +((a.clicks / a.impressions) * 100).toFixed(2) : 0
    })).sort((x, y) => y.spend - x.spend);

    /* ═══ u360-ads-thumbs — ดึงรูปครีเอทีฟ + สถานะ มาแปะแต่ละแถว ═══
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
        if (cj.error) {
          out.thumbNote = "meta creative error " + (cj.error.code || "?") + "/" + (cj.error.type || "?") + " sub" + (cj.error.error_subcode || "-");
        }
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
    } catch (e) { out.thumbNote = "creative fetch threw"; /* ไม่มีรูปก็ยังอ่านตัวเลขได้ */ }

    /* แอดที่ยังวิ่งอยู่ขึ้นก่อนเสมอ · ที่ปิดแล้วดันลงล่าง */
    out.ads.sort((x, y) => (y.live === true) - (x.live === true) || y.spend - x.spend);

    const yest = th(new Date(Date.now() - 864e5));
    out.totals = {
      spend: +out.ads.reduce((s, a) => s + a.spend, 0).toFixed(2),
      clicks: out.ads.reduce((s, a) => s + a.clicks, 0),
      today: +(spendByDay[until] || 0).toFixed(2),
      yesterday: +(spendByDay[yest] || 0).toFixed(2)
    };
  } catch (e) {
    out.error = 'ต่อ Meta ไม่ได้';
    res.end(JSON.stringify(out));
    return;
  }

  /* ── ② ออเดอร์จริงในช่วงเดียวกัน — นับที่ server ไม่ส่งแถวลงเบราว์เซอร์ ──
     🏆 นี่คือตัวชี้ขาดที่ Meta บอกเองไม่ได้ เพราะเราปิดการขายในไลน์ */
  try {
    /* u360-ads-only — นับเฉพาะออเดอร์ที่มาจากแอดที่เสียเงินจริง */
    const q = SB + '/rest/v1/orders?select=total,source_campaign,source_content'
            + '&created_at=gte.' + since + 'T00:00:00'
            + '&total=gt.0&limit=2000';
    const r = await fetch(q, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    if (r.ok) {
      const rows = await r.json();
      const byC = {};
      let matched = 0, revenue = 0;
      for (const o of rows) {
        const c = (o.source_campaign || '').trim();
        /* 🔴 ห้ามใช้ "มีที่มาอะไรก็ได้" เป็นเงื่อนไข — ig/social, web, broadcast เข้าหมด
           ของแอดที่เสียเงินจะขึ้นต้นด้วย fb/paid/ เสมอ (utm_source=fb + utm_medium=paid) */
        if (c.indexOf('fb/paid/') !== 0) continue;
        byC[c] = byC[c] || { orders: 0, revenue: 0 };
        byC[c].orders++; byC[c].revenue += +o.total || 0;
        matched++; revenue += +o.total || 0;
        /* เก็บรหัสชิ้นงานไว้จับคู่รายแถว — จาก source_content ถ้ามี ไม่มีก็ท้าย campaign */
        const code = (o.source_content || '').trim() || (c.split('/').pop().split('-').pop() || '');
        if (code) { byC['#' + code] = byC['#' + code] || { orders: 0, revenue: 0 };
                    byC['#' + code].orders++; byC['#' + code].revenue += +o.total || 0; }
      }
      out.orders = { matched, revenue: +revenue.toFixed(2), byCampaign: byC, scanned: rows.length };

      /* ผูกออเดอร์เข้ากับชิ้นงานด้วย "รหัสชิ้นงาน" ไม่ใช่ชื่อแคมเปญ
         ชื่อแอดคือ "b1 · green" → รหัสคือ b1 · ต้องตรงตัวเท่านั้น ไม่ใช้ includes */
      for (const a of out.ads) {
        const code = String(a.ad || '').trim().split(/[\s·]+/)[0].toLowerCase();
        const hit = code && byC['#' + code];
        a.orders = hit ? hit.orders : 0;
        a.revenue = hit ? +hit.revenue.toFixed(2) : 0;
        a.costPerOrder = a.orders ? +(a.spend / a.orders).toFixed(2) : null;
      }
    }
  } catch (e) { /* ไม่มีตัวเลขออเดอร์ก็ยังโชว์ตัวเลขแอดได้ — ไม่ทำให้ทั้งหน้าพัง */ }

  /* ── u360-funnel — คลิก → เข้าหน้าเจ → กดไป LINE → จองจริง ──
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

  /* ── ③ ธงเตือน ── */
  for (const a of out.ads) {
    a.flags = [];
    if (a.cpc > FLAG_CPC) a.flags.push('ต่อคลิกเกิน ฿' + FLAG_CPC);
    if (a.spend > FLAG_SPEND && !a.orders) a.flags.push('ใช้เกิน ฿' + FLAG_SPEND + ' แล้วยังไม่มีออเดอร์');
  }

  res.end(JSON.stringify(out));
};

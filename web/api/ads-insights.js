/* ═══ ตัวเลขค่าโฆษณา Meta — ฝั่ง server เท่านั้น (m-track 2 ก.ย. 2026 · รื้อ 11 ก.ย. ตามบรีฟ 06) ═══

   🔴 ข้อบังคับที่ห้ามพลาด:
      **โทเค็น Meta ห้ามอยู่ในไฟล์ HTML เด็ดขาด**
      ไฟล์นี้อยู่ฝั่ง server · หน้าเว็บเรียกมาที่นี่ · ได้กลับไปแต่ "ตัวเลขที่คำนวณแล้ว"

   🔴 ข้อบังคับข้อ 2 (06 ขอ 11 ก.ย. — บัญชีแอดโดน Meta ล็อก 2 รอบในวันเดียว "code 17")
      **ห้ามยิง Meta ทุกครั้งที่เปิดหน้า** → เก็บผลไว้ 15 นาทีต่อช่วงวัน
      ยิงเกินลิมิต = 06 แก้แอดไม่ได้ในวันที่มีปัญหา
      · เก็บในหน่วยความจำของ server (instance ที่ยังอุ่นอยู่ใช้ซ้ำ) — instance ใหม่ตื่นขึ้นมาจะดึงใหม่ 1 รอบ
      · ขอพร้อมกันหลายคน = รอผลก้อนเดียวกัน ไม่ยิงซ้ำ
      · Meta ติดลิมิต = โชว์ข้อมูลเก่าที่เก็บไว้ + บอกว่าเก่าแค่ไหน (ไม่ปล่อยหน้าโล่ง)
      · ด่านรหัส (?check=1) ไม่แตะ Meta เลย
      · ต่อ 1 รอบดึง = 3 คำขอ: insights ระดับแอด 1 · ยอดรายวันระดับบัญชี 1 · รูป+สถานะแอด 1 (ไม่ยิงทีละแอด)

   ต้องมีใน Vercel env ของโปรเจค under360-web:
     META_TOKEN        โทเค็นระบบ (ไม่มีวันหมดอายุ) — 06 เป็นคนส่งให้
     META_AD_ACCOUNT   act_463330657546428
   ไม่มี env = ตอบ 200 พร้อมธงบอกว่ายังไม่ได้ตั้งค่า (ไม่ทำให้หน้าพัง) */

const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const GRAPH = 'https://graph.facebook.com/v21.0/';

/* เกณฑ์ธงเตือน — มาจากบรีฟ 06 */
const FLAG_CPC   = 15;    /* ต่อคลิกเกินนี้ = แพงเกิน */
const FLAG_SPEND = 500;   /* ใช้เกินนี้แล้วยังไม่มีออเดอร์ = ควรปิด */
const FLAG_FREQ  = 3;     /* เห็นซ้ำเกินนี้ = วนคนเดิม (06 · 11 ก.ย.) */
const FREQ_MIN_IMP = 300; /* แอดที่เพิ่งขึ้น เห็น 5 ครั้งจากคน 1 คน = f5 หลอกตา → เตือนเมื่อแสดงผลถึงเกณฑ์นี้แล้ว (M ตั้งเอง) */

/* ชุดกลุ่มเป้าหมาย — 06 กำหนด 11 ก.ย.: A · D = คนใหม่ · B · C = คนเก่า
   ถ้า 06 เปลี่ยนความหมายชุด ต้องแก้ตรงนี้ที่เดียว */
const AUD = { a: 'new', d: 'new', b: 'old', c: 'old' };
const ROMAN = { 'น': 'n', 'พ': 'p', 'ส': 's' };

/* ประเภท action ของ Meta — ไล่ตามลำดับ เจอตัวแรกใช้ตัวนั้น (ไม่บวกกัน กันนับซ้ำ) */
const T_LEAD  = ['lead', 'offsite_conversion.fb_pixel_lead'];
const T_CHAT  = ['onsite_conversion.messaging_conversation_started_7d'];
const T_SAVE  = ['onsite_conversion.post_save'];
const T_SHARE = ['post'];
const T_BUY   = ['omni_purchase', 'purchase', 'offsite_conversion.fb_pixel_purchase'];

const TTL = 15 * 60 * 1000;
const CACHE = globalThis.__u360AdsCache || (globalThis.__u360AdsCache = new Map());
const INFLIGHT = globalThis.__u360AdsInflight || (globalThis.__u360AdsInflight = new Map());

const th = d => new Date(d.getTime() + 7 * 3600000).toISOString().slice(0, 10);
const pick = (arr, types) => {
  if (!Array.isArray(arr)) return 0;
  for (const t of types) { const x = arr.find(a => a.action_type === t); if (x) return +x.value || 0; }
  return 0;
};

/* อ่านชื่อแอด → ชุด · คอนเซปต์ · รูป · utm_content
   ชื่อใหม่ (11 ก.ย.): "a · น1 · ไหว้เสร็จแล้ว มีอะไรกิน (I034)"        → a_n1_i034
                      "d · พ1 · เจที่ไม่ต้องฝืนกิน (คาร์รูเซล 4 ใบ)"   → d_p1_carousel
                      "a · นอกชุด · เจปีนี้มีครบทุกมื้อ ไม่ต้องหาเอง (I060)" → a_x_i060
   ชื่อเก่า (ก่อน 11 ก.ย.): "a5 · 30 เมนู" → รหัส a5 (ตรงกับ source_content ของออเดอร์เก่า เช่น c2) */
function parseName(name) {
  const raw = String(name || '');
  const parts = raw.split(' · ').map(s => s.trim());
  const p0 = (parts[0] || '').toLowerCase();
  if (/^[a-d]$/.test(p0) && parts.length >= 3) {
    const code = parts[1];
    const rest = parts.slice(2).join(' · ');
    const m = rest.match(/\(([^()]*)\)\s*$/);
    const tag = m ? m[1].trim() : '';
    const title = m ? rest.slice(0, m.index).trim() : rest;
    const img = /^I\d+$/i.test(tag) ? tag.toUpperCase()
              : (tag.indexOf('คาร์รูเซล') === 0 || /carousel/i.test(tag)) ? 'carousel' : '';
    const codeKey = code === 'นอกชุด' ? 'x' : ((ROMAN[code.charAt(0)] || '') + code.slice(1)).toLowerCase();
    return { set: p0, aud: AUD[p0] || '', code, codeKey, concept: title, img,
             utm: img ? (p0 + '_' + codeKey + '_' + img).toLowerCase() : '', legacy: false };
  }
  const m = p0.match(/^([a-d])(\d+)$/);
  if (m) return { set: m[1], aud: AUD[m[1]] || '', code: p0, codeKey: p0,
                  concept: parts.slice(1).join(' · '), img: '', utm: p0, legacy: true };
  return { set: '', aud: '', code: '', codeKey: '', concept: raw, img: '', utm: '', legacy: true };
}

async function graphAll(url, maxPages) {
  let rows = [], next = url, pages = 0;
  while (next && pages < maxPages) {
    const r = await fetch(next);
    const j = await r.json();
    if (j.error) { const e = new Error('meta'); e.code = j.error.code; throw e; }
    rows = rows.concat(j.data || []);
    next = j.paging && j.paging.next;
    pages++;
  }
  return rows;
}

/* ── ส่วน Meta ทั้งก้อน (ตัวที่ต้องเก็บ 15 นาที) ── */
async function fetchMeta(T, ACC, since, until) {
  const tok = '&access_token=' + encodeURIComponent(T);

  /* ① ระดับแอด รวมทั้งช่วงในแถวเดียว (ไม่ใช่รายวัน) — ทำให้ "เห็นซ้ำ" ถูกต้อง
        เดิมดึงรายวันแล้วเอามาเฉลี่ย = ต่ำกว่าจริงเสมอ เตือนวนคนเดิมไม่มีวันขึ้น */
  const insUrl = GRAPH + encodeURIComponent(ACC) + '/insights?level=ad'
    + '&time_range=' + encodeURIComponent(JSON.stringify({ since, until }))
    + '&fields=campaign_name,adset_name,ad_name,ad_id,spend,impressions,reach,frequency,clicks,actions,action_values'
    + '&limit=500' + tok;
  const ins = await graphAll(insUrl, 4);

  /* ② ยอดใช้รายวันระดับบัญชี แค่เมื่อวาน-วันนี้ (แถวเดียวต่อวัน เบามาก) */
  const yest = th(new Date(Date.now() - 864e5));
  const dayUrl = GRAPH + encodeURIComponent(ACC) + '/insights?level=account&time_increment=1'
    + '&time_range=' + encodeURIComponent(JSON.stringify({ since: yest, until }))
    + '&fields=spend&limit=10' + tok;
  const days = await graphAll(dayUrl, 1);
  const spendByDay = {};
  for (const d of days) spendByDay[d.date_start] = +d.spend || 0;

  /* ③ รูปครีเอทีฟ + สถานะ — ขอทีเดียวทั้งบัญชี · ล้มก็ไม่เป็นไร ตัวเลขยังโชว์ได้ */
  let adsInfo = null, thumbNote = null;
  try {
    const au = GRAPH + encodeURIComponent(ACC) + '/ads'
      + '?fields=id,name,effective_status,creative{thumbnail_url}&limit=500' + tok;
    adsInfo = await graphAll(au, 3);
  } catch (e) { thumbNote = 'meta creative error ' + (e.code || '?'); }

  const byId = {};
  for (const x of adsInfo || []) byId[x.id] = x;

  /* แถวละ 1 แอด (ตาม ad_id) — เดิมรวมตามชื่อ ชื่อซ้ำกันคนละแอดจะถูกบวกรวมกันเงียบๆ */
  const ads = ins.map(d => {
    const n = parseName(d.ad_name);
    const spend = +d.spend || 0, clicks = +d.clicks || 0, imp = +d.impressions || 0;
    const leads = pick(d.actions, T_LEAD);
    const info = byId[d.ad_id];
    const status = adsInfo ? (info ? info.effective_status || null : 'DELETED') : null;
    return Object.assign({
      id: d.ad_id || '', ad: d.ad_name || '(ไม่มีชื่อ)', campaign: d.campaign_name || '', adset: d.adset_name || ''
    }, n, {
      spend: +spend.toFixed(2), impressions: imp, reach: +d.reach || 0, frequency: +(+d.frequency || 0).toFixed(2),
      clicks, cpc: clicks ? +(spend / clicks).toFixed(2) : 0, ctr: imp ? +((clicks / imp) * 100).toFixed(2) : 0,
      leads, costPerLead: leads ? +(spend / leads).toFixed(2) : null,
      chats: pick(d.actions, T_CHAT), saves: pick(d.actions, T_SAVE), shares: pick(d.actions, T_SHARE),
      /* ⚠️ Meta เคลม — นับคนที่แค่ "เห็น" แอดแล้วไปซื้อด้วย ไม่ใช่ยอดยืนยัน ห้ามรวมกับยอดใน DB */
      metaPurchases: pick(d.actions, T_BUY), metaRevenue: +pick(d.action_values, T_BUY).toFixed(2),
      thumb: (info && info.creative && info.creative.thumbnail_url) || null,
      status, live: status === 'ACTIVE'
    });
  });

  return { ads, spendByDay, thumbNote, fetchedAt: Date.now() };
}

async function getMeta(T, ACC, since, until) {
  const key = since + '|' + until;
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.fetchedAt < TTL) return { data: hit, cache: 'hit' };
  if (INFLIGHT.has(key)) return { data: await INFLIGHT.get(key), cache: 'shared' };
  const p = fetchMeta(T, ACC, since, until);
  INFLIGHT.set(key, p);
  try {
    const data = await p;
    CACHE.set(key, data);
    return { data, cache: 'miss' };
  } catch (e) {
    /* ติดลิมิต/ต่อไม่ได้ → ใช้ของเก่าที่เก็บไว้ ถ้ามี */
    if (hit) return { data: hit, cache: 'stale', errCode: e.code || '?' };
    throw e;
  } finally { INFLIGHT.delete(key); }
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  /* ═══ u360-ads-gate — ตรวจรหัสก่อนคืนข้อมูล (06 ขอ 8 ก.ย.) ═══ */
  const PIN = process.env.ADS_PIN || '0360';
  const given = (req.headers && (req.headers['x-ads-pin'] || req.headers['X-Ads-Pin'])) || '';
  if (String(given) !== String(PIN)) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: 'locked', note: 'ต้องใส่รหัสก่อนดูข้อมูล' }));
  }
  /* ด่านรหัสเช็คแค่นี้พอ — เดิมยิง Meta ทุกครั้งที่เปิดหน้าเพื่อเช็ครหัส (เปลืองลิมิต 06) */
  if (req.query && req.query.check) return res.end(JSON.stringify({ ok: true }));

  const T   = process.env.META_TOKEN;
  const ACC = process.env.META_AD_ACCOUNT;
  const days = Math.min(90, Math.max(1, parseInt((req.query && req.query.days) || '7', 10) || 7));

  const until = th(new Date());
  const since = th(new Date(Date.now() - (days - 1) * 864e5));
  const out = { since, until, days, updatedAt: new Date().toISOString(), ads: [], totals: null, note: null };

  if (!T || !ACC) {
    out.setupNeeded = true;
    out.note = 'ยังไม่ได้ตั้ง META_TOKEN / META_AD_ACCOUNT ใน Vercel env ของโปรเจคเว็บ';
    return res.end(JSON.stringify(out));
  }

  /* ── ① ตัวเลขจาก Meta (ผ่านที่เก็บ 15 นาที) ── */
  let meta;
  try {
    const g = await getMeta(T, ACC, since, until);
    meta = g.data;
    out.metaFetchedAt = new Date(meta.fetchedAt).toISOString();
    out.cache = g.cache;
    if (g.cache === 'stale') out.staleNote = 'Meta ไม่ตอบตอนนี้ (' + g.errCode + ') — โชว์ข้อมูลที่ดึงไว้ล่าสุดแทน';
  } catch (e) {
    /* ⚠️ ห้ามส่งข้อความ error ดิบกลับไป — บางทีมีเศษโทเค็นติดมาด้วย */
    out.error = (e.code === 17 || e.code === 4 || e.code === 32 || e.code === 613)
      ? 'บัญชีแอดติดลิมิตคำขอของ Meta อยู่ (' + e.code + ') — รอสักพักแล้วเปิดใหม่'
      : 'ดึงข้อมูลจาก Meta ไม่ได้ (' + (e.code || '?') + ')';
    return res.end(JSON.stringify(out));
  }

  /* สำเนาแถวแอดทุกครั้ง — ห้ามแก้ของที่อยู่ในที่เก็บตรงๆ (คำขอถัดไปจะได้เลขเพี้ยน) */
  out.ads = meta.ads.map(a => Object.assign({}, a));
  if (meta.thumbNote) out.thumbNote = meta.thumbNote;

  const yest = th(new Date(Date.now() - 864e5));
  out.totals = {
    spend: +out.ads.reduce((s, a) => s + a.spend, 0).toFixed(2),
    clicks: out.ads.reduce((s, a) => s + a.clicks, 0),
    leads: out.ads.reduce((s, a) => s + a.leads, 0),
    today: +(meta.spendByDay[until] || 0).toFixed(2),
    yesterday: +(meta.spendByDay[yest] || 0).toFixed(2)
  };

  /* ── ② ออเดอร์จริงในช่วงเดียวกัน — นับที่ server ไม่ส่งแถวลงเบราว์เซอร์ ──
     🏆 ตัวชี้ขาดที่ Meta บอกเองไม่ได้ เพราะเราปิดการขายในไลน์ · ตัวนี้เท่านั้นคือ "ยืนยันใน DB" */
  try {
    const q = SB + '/rest/v1/orders?select=total,source_campaign,source_content'
            + '&created_at=gte.' + since + 'T00:00:00'
            + '&total=gt.0&limit=2000';
    const r = await fetch(q, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    if (r.ok) {
      const rows = await r.json();
      const byUtm = {};
      let matched = 0, revenue = 0;
      for (const o of rows) {
        const c = (o.source_campaign || '').trim();
        /* 🔴 นับเฉพาะแอดที่เสียเงิน — ขึ้นต้น fb/paid/ เสมอ (ig/social, web, broadcast ไม่นับ) */
        if (c.indexOf('fb/paid/') !== 0) continue;
        matched++; revenue += +o.total || 0;
        /* utm_content ของออเดอร์ — จาก source_content ถ้ามี ไม่มีก็ท้าย campaign (jay2026-a_n1_i034) */
        const k = ((o.source_content || '').trim() || (c.split('/').pop().split('-').pop() || '')).toLowerCase();
        if (!k) continue;
        byUtm[k] = byUtm[k] || { orders: 0, revenue: 0 };
        byUtm[k].orders++; byUtm[k].revenue += +o.total || 0;
      }
      out.orders = { matched, revenue: +revenue.toFixed(2), byUtm, scanned: rows.length };

      /* ผูกออเดอร์เข้าแอดด้วย utm_content ตรงตัวเท่านั้น (ไม่ใช้ includes) */
      for (const a of out.ads) {
        const hit = a.utm && byUtm[a.utm];
        a.orders = hit ? hit.orders : 0;
        a.revenue = hit ? +hit.revenue.toFixed(2) : 0;
        a.costPerOrder = a.orders ? +(a.spend / a.orders).toFixed(2) : null;
      }
    }
  } catch (e) { /* ไม่มีตัวเลขออเดอร์ก็ยังโชว์ตัวเลขแอดได้ */ }

  /* ── u360-funnel — คลิก → เข้าหน้าเจ → กดไป LINE → จองจริง ── */
  try {
    const q = SB + '/rest/v1/web_events?select=event&page=eq.jay&utm_source=eq.fb'
            + '&created_at=gte.' + since + 'T00:00:00&limit=5000';
    const r = await fetch(q, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    if (r.ok) {
      const rows = await r.json();
      out.funnel = {
        clicks: out.totals.clicks,
        visits: rows.filter(x => x.event === 'pageview').length,
        toLine: rows.filter(x => x.event === 'cta_click').length,
        orders: out.orders ? out.orders.matched : 0
      };
    }
  } catch (e) { /* ไม่มีแถวสรุปก็ยังดูตารางได้ */ }

  /* ── u360-google — ฝั่ง Google Ads (ค่าใช้จ่ายยังดึงไม่ได้ รอ developer token) ── */
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
      spend:   null,
      spendNote: 'ยังต่อ Google Ads API ไม่ได้ (รอ developer token) — ดูค่าใช้จ่ายในคอนโซล Google ก่อน'
    };
  } catch (e) { /* ไม่มีฝั่ง Google ก็ยังดู Meta ได้ */ }

  /* ── ③ ธงเตือน ── */
  for (const a of out.ads) {
    a.flags = [];
    if (a.cpc > FLAG_CPC) a.flags.push('ต่อคลิกเกิน ฿' + FLAG_CPC);
    if (a.spend > FLAG_SPEND && !a.orders) a.flags.push('ใช้เกิน ฿' + FLAG_SPEND + ' แล้วยังไม่มีออเดอร์');
    if (a.frequency > FLAG_FREQ && a.impressions >= FREQ_MIN_IMP) a.flags.push('เห็นซ้ำเกิน ' + FLAG_FREQ + ' — วนคนเดิม');
  }

  res.end(JSON.stringify(out));
};

module.exports.parseName = parseName;   /* ให้สคริปต์ทดสอบเรียกได้ */

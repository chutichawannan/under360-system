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

/* ชุดกลุ่มเป้าหมาย — 06 กำหนด · แก้ 13 ก.ย.: A · D · E = คนใหม่ · B · C = คนเก่า (ปิดทั้ง 2 ชุดแล้ว 13 ก.ย.)
   E = Lookalike จากเบอร์ลูกค้าเจเก่า 361 เบอร์ · ถ้า 06 เปลี่ยนความหมายชุด ต้องแก้ตรงนี้ที่เดียว */
const AUD = { a: 'new', d: 'new', e: 'new', b: 'old', c: 'old' };
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

/* ═══ ชั้นเก็บของที่รอดตอนเครื่องเย็น (u360-ads-shelf) ═══
   แคชในหน่วยความจำข้างบนอยู่ได้เฉพาะตอน instance ยังอุ่น — Vercel ปลุกเครื่องใหม่เมื่อไหร่ก็หายหมด
   นัทเลยเจอ "กำลังโหลด..." ค้าง 12 วินาทีบ่อยกว่าที่ TTL 15 นาทีควรจะเป็น (06 วัดมา 15 ก.ย.)

   🔒 ทำไมต้องใช้กุญแจ service role ไม่ใช่กุญแจ anon ที่อยู่หัวไฟล์:
      ตัวเลขค่าโฆษณาถูกใส่ด่านรหัสไว้ตั้งใจ — ถ้าเก็บลงตารางที่กุญแจ anon (ซึ่งฝังอยู่ในทุกหน้าเว็บ) อ่านได้
      = เอาของหลังด่านไปวางหน้าด่านเอง · ตารางนี้จึงตั้ง RLS ปิดสนิท ไม่มี policy ให้ anon เลย
   ไม่มีกุญแจ / ยังไม่ได้สร้างตาราง = ข้ามชั้นนี้เงียบๆ หน้าเว็บทำงานเหมือนเดิมทุกอย่าง (แค่เครื่องเย็นจะช้า) */
const SHELF_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_KEY || '';
const shelfHead = () => ({ apikey: SHELF_KEY, Authorization: 'Bearer ' + SHELF_KEY, 'Content-Type': 'application/json' });

async function shelfGet(key) {
  if (!SHELF_KEY) return null;
  try {
    const r = await fetch(SB + '/rest/v1/ads_cache?select=payload,fetched_at&key=eq.' + encodeURIComponent(key) + '&limit=1',
      { headers: shelfHead() });
    if (!r.ok) return null;                       /* ยังไม่ได้สร้างตาราง = ไม่มีชั้นนี้ ไม่ใช่ข้อผิดพลาด */
    const rows = await r.json();
    const row = Array.isArray(rows) && rows[0];
    if (!row || !row.payload) return null;
    return { data: row.payload, fetchedAt: Date.parse(row.fetched_at) || 0 };
  } catch (e) { return null; }
}

async function shelfSet(key, data) {
  if (!SHELF_KEY) return;
  try {
    /* แถวเดียวต่อช่วงวัน เขียนทับ ไม่เก็บประวัติ — 06 เตือนเรื่องโควตา Supabase ไว้ */
    await fetch(SB + '/rest/v1/ads_cache?on_conflict=key', {
      method: 'POST',
      headers: Object.assign(shelfHead(), { Prefer: 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify({ key, payload: data, fetched_at: new Date().toISOString() })
    });
  } catch (e) { /* เก็บไม่ได้ก็แค่ช้าเท่าเดิม ห้ามทำให้คำขอพัง */ }
}

const th = d => new Date(d.getTime() + 7 * 3600000).toISOString().slice(0, 10);
const pick = (arr, types) => {
  if (!Array.isArray(arr)) return 0;
  for (const t of types) { const x = arr.find(a => a.action_type === t); if (x) return +x.value || 0; }
  return 0;
};
/* อ่านค่าตามหน้าต่าง attribution ที่ขอไว้ (7d_click / 1d_view)
   ไม่มีค่าของหน้าต่างนั้น = 0 · **ห้าม fallback ไปใช้ค่ารวม** เพราะค่ารวมคือ 2 ก้อนนี้บวกกัน จะนับซ้ำ */
const pickWin = (arr, types, win) => {
  if (!Array.isArray(arr)) return 0;
  for (const t of types) { const x = arr.find(a => a.action_type === t); if (x) return +x[win] || 0; }
  return 0;
};
/* มาร์จิ้นสำหรับช่อง "กำไรโดยประมาณ" — นัทเคยประมาณเร็วๆ ว่า 33%
   ⚠️ ยังไม่เคยยืนยันจากบัญชีจริง (f-track ยังไม่ได้ statement) → หน้าเว็บต้องติดป้ายว่าเป็นการประมาณเสมอ */
const MARGIN = 0.33;

const SBH = { apikey: KEY, Authorization: 'Bearer ' + KEY };
/* เมนูเจทุกปีขึ้นต้น J/j ตามด้วยเลข (J054 · j26 · j2025-1) — เช็คกับ order_items จริง 11 ก.ย. */
const JCODE = /^j\d/i;
const phone9 = p => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 9 ? d.slice(-9) : ''; };

/* PostgREST คืนสูงสุด 1,000 แถว/ครั้ง **แบบเงียบๆ ไม่มี error** → ไล่หน้าเสมอ
   (ของเดิมใส่ limit=2000 = ได้แค่ 1,000 จริง · ช่วง 30-90 วันออเดอร์เกินได้) */
async function sbAll(path, maxPages) {
  let rows = [];
  for (let p = 0; p < (maxPages || 20); p++) {
    const r = await fetch(SB + '/rest/v1/' + path + '&limit=1000&offset=' + (p * 1000), { headers: SBH });
    if (!r.ok) throw new Error('supabase ' + r.status);
    const page = await r.json();
    rows = rows.concat(page);
    if (page.length < 1000) break;
  }
  return rows;
}

/* ═══ u360-buyer-type — คนที่ซื้อจริงเป็นใคร (06 · นัทเคาะ 11 ก.ย.) ═══
   ดูจาก **ประวัติสั่งซื้อของคนซื้อใน DB** ไม่ใช่จากชุดแอดที่ยิง
   (เคสคุณสินัลรินีย์: ลูกค้าใหม่จริง แต่ Meta ให้เครดิตชุด C ที่ตั้งยิงคนเก่า)
     🥬 jay  = เคยมีออเดอร์ที่มีเมนูรหัส J มาก่อน — **นับใบ ฿0 ด้วย** เพราะใบแบ่งรอบคอร์สเจปีก่อนเป็น ฿0 (เคสคุณนรุตม์)
     🔁 old  = เคยมีออเดอร์จ่ายจริง (ยอด>0) แต่ไม่เคยมีเมนูเจ
     🆕 new  = ไม่มีทั้งสองอย่าง
   ตัวตนเดียวกัน = customer_id เดียวกัน หรือเบอร์ 9 หลักท้ายตรงกัน (ใบยอด>0 ที่ customer_id ว่างมี 47 ใบ)
   ไม่นับ: log แต้ม Hato (HS- · hato_loyalty_log — ไม่ใช่การขาย) · ใบแบ่งรอบของออเดอร์ใบนี้เอง (สร้างหลังใบหลัก ~1 วิ)
   ⚠️ ผลลัพธ์ห้ามมีเบอร์ · ที่อยู่ · LINE uid — ส่งกลับแค่ชื่อที่แสดง */
async function classifyAdOrders(adOrders) {
  const unknown = o => ({ order: o, type: 'unknown', repeat: 0, items: [] });
  const cids = [...new Set(adOrders.map(o => o.customer_id).filter(Boolean))];
  const phs = [...new Set(adOrders.map(o => phone9(o.customer_phone)).filter(Boolean))];
  if (!cids.length && !phs.length) return adOrders.map(unknown);

  const parts = [];
  if (cids.length) parts.push('customer_id.in.(' + cids.join(',') + ')');
  if (phs.length) parts.push('customer_phone.in.(' + phs.flatMap(p => ['0' + p, p, '66' + p, '+66' + p]).join(',') + ')');
  const hist = (await sbAll('orders?select=id,order_number,total,created_at,customer_id,customer_phone,source,notes,'
      + 'order_items(menu_code,menu_name,quantity,notes)'
      + '&or=' + encodeURIComponent('(' + parts.join(',') + ')') + '&order=created_at.asc,id.asc', 10))
    .filter(h => h.source !== 'hato_loyalty_log' && String(h.order_number || '').indexOf('HS-') !== 0);

  const pkgIds = new Set();
  hist.forEach(h => (h.order_items || []).forEach(i => { const m = /^pkg:([0-9a-f-]{36})/.exec(i.notes || ''); if (m) pkgIds.add(m[1]); }));
  const pkgName = {};
  if (pkgIds.size) {
    const pr = await fetch(SB + '/rest/v1/packages?select=id,name&id=in.(' + [...pkgIds].join(',') + ')', { headers: SBH });
    if (pr.ok) (await pr.json()).forEach(p => { pkgName[p.id] = p.name; });
  }

  const byId = {};
  hist.forEach(h => { byId[h.id] = h; });
  const same = (h, o) => (o.customer_id && h.customer_id === o.customer_id)
    || (phone9(o.customer_phone) && phone9(h.customer_phone) === phone9(o.customer_phone));

  return adOrders.map(o => {
    if (!o.customer_id && !phone9(o.customer_phone)) return unknown(o);
    const mine = hist.filter(h => same(h, o) && h.id !== o.id);
    const before = mine.filter(h => h.created_at < o.created_at && String(h.notes || '').indexOf(o.order_number) < 0);
    const hadJay = before.some(h => (h.order_items || []).some(i => JCODE.test(i.menu_code || '')));
    const hadPaid = before.some(h => +h.total > 0);
    const type = hadJay ? 'jay' : hadPaid ? 'old' : 'new';
    /* ซื้อซ้ำ = ออเดอร์จ่ายจริงหลังใบนี้ทั้งหมด ไม่ใช่แค่ที่มาจากแอด (06 ขอ — บอกว่าลูกค้าติดไหม) */
    const repeat = mine.filter(h => h.created_at > o.created_at && +h.total > 0).length;

    /* ซื้ออะไร: แพคเกจ → ชื่อแพคเกจ · ไม่ใช่แพคเกจ → ชื่อเมนู × จำนวน · ของแถม (gift:) ไม่นับ */
    const labels = {};
    ((byId[o.id] || o).order_items || []).forEach(i => {
      const n = String(i.notes || '');
      if (n.indexOf('gift:') === 0) return;
      const m = /^pkg:([0-9a-f-]{36})/.exec(n);
      const label = m ? (pkgName[m[1]] || 'แพคเกจ') : (i.menu_name || i.menu_code || '?');
      labels[label] = (labels[label] || 0) + (m ? 0 : (+i.quantity || 1));
    });
    const items = Object.keys(labels).map(k => labels[k] > 1 ? k + ' ×' + labels[k] : k);
    return { order: o, type, repeat, items };
  });
}

/* อ่านชื่อแอด → ชุด · คอนเซปต์ · รูป · utm_content
   ชื่อใหม่ (11 ก.ย.): "a · น1 · ไหว้เสร็จแล้ว มีอะไรกิน (I034)"        → a_n1_i034
                      "d · พ1 · เจที่ไม่ต้องฝืนกิน (คาร์รูเซล 4 ใบ)"   → d_p1_carousel
                      "a · นอกชุด · เจปีนี้มีครบทุกมื้อ ไม่ต้องหาเอง (I060)" → a_x_i060
   ชื่อเก่า (ก่อน 11 ก.ย.): "a5 · 30 เมนู" → รหัส a5 (ตรงกับ source_content ของออเดอร์เก่า เช่น c2) */
function parseName(name) {
  const raw = String(name || '');
  const parts = raw.split(' · ').map(s => s.trim());
  const p0 = (parts[0] || '').toLowerCase();
  if (/^[a-e]$/.test(p0) && parts.length >= 3) {
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
  const m = p0.match(/^([a-e])(\d+)$/);
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
  const insP = graphAll(insUrl, 4);

  /* ② ยอดใช้รายวันระดับบัญชี แค่เมื่อวาน-วันนี้ (แถวเดียวต่อวัน เบามาก) */
  const yest = th(new Date(Date.now() - 864e5));
  const dayUrl = GRAPH + encodeURIComponent(ACC) + '/insights?level=account&time_increment=1'
    + '&time_range=' + encodeURIComponent(JSON.stringify({ since: yest, until }))
    + '&fields=spend&limit=10' + tok;
  const daysP = graphAll(dayUrl, 1);

  /* ③ รูปครีเอทีฟ + สถานะ — ขอทีเดียวทั้งบัญชี · ล้มก็ไม่เป็นไร ตัวเลขยังโชว์ได้ */
  const adsInfoP = graphAll(GRAPH + encodeURIComponent(ACC) + '/ads'
    + '?fields=id,name,effective_status,creative{thumbnail_url}&limit=500' + tok, 3)
    .then(rows => ({ rows }), err => ({ rows: null, err }));

  /* ④ ระดับแคมเปญ — คำขอเตรียมไว้ตรงนี้ เพื่อให้ยิงพร้อมก้อนอื่น (ดูหมายเหตุที่จุดรวมพลด้านล่าง) */
  const cUrl = GRAPH + encodeURIComponent(ACC) + '/insights?level=campaign'
    + '&time_range=' + encodeURIComponent(JSON.stringify({ since, until }))
    + '&action_attribution_windows=' + encodeURIComponent(JSON.stringify(['7d_click', '1d_view']))
    + '&fields=campaign_id,campaign_name,spend,impressions,clicks,actions,action_values'
    + '&limit=200' + tok;
  const campP = graphAll(cUrl, 2).then(rows => ({ rows }), err => ({ rows: null, err }));
  const focusP = activeSpenders(T, ACC);

  /* ── จุดรวมพล ── เดิมยิง 5 ก้อนนี้เรียงกันทีละตัว รอ Meta ตัวละ 1.5-3 วิ = 12 วิตอนเครื่องเย็น
     (06 วัดมาเอง 15 ก.ย. หลังนัทบ่นว่า "มันช้าอะ") · ไม่มีก้อนไหนใช้ผลของอีกก้อน → รอพร้อมกันได้
     ⚠️ จำนวนคำขอที่ยิงไป Meta "เท่าเดิม" ไม่ได้เพิ่ม — แค่ไม่ต่อคิวกัน (ลิมิตแอดจึงไม่กระทบ) */
  const [ins, dayRows, adsRes, campRes, focus] = await Promise.all([insP, daysP, adsInfoP, campP, focusP]);

  const spendByDay = {};
  for (const d of dayRows) spendByDay[d.date_start] = +d.spend || 0;
  const adsInfo = adsRes.rows;
  const thumbNote = adsRes.err ? 'meta creative error ' + (adsRes.err.code || '?') : null;

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

  /* u360-not-started — แอดที่มีอยู่ใน Meta แต่ยังไม่เคยแสดงผลสักวัน (insights ไม่คืนแถวให้)
     06 ขอ 13 ก.ย.: ชุด E รอ Meta สร้างกลุ่มอยู่ → ต้องขึ้นว่า "ยังไม่เริ่ม" ไม่ใช่ ฿0 (ไม่งั้นอ่านเป็นแอดพัง) */
  const delivered = new Set(ads.map(a => a.id));
  const notStarted = (adsInfo || [])
    /* 06 ขอ 13 ก.ย.: นับเฉพาะที่เปิดอยู่จริง — แอดที่ถูกหยุดไว้จะไม่มีวันเริ่ม ไม่ควรขึ้นว่า 'ยังไม่เริ่ม'
       (แอดในชุดที่ยังไม่เปิด Meta คืนเป็น ADSET_PAUSED/CAMPAIGN_PAUSED → จะโผล่เองตอน 06 กดเปิดชุด) */
    .filter(x => !delivered.has(x.id) && x.effective_status === 'ACTIVE')
    .map(x => Object.assign({ id: x.id, ad: x.name || '', status: x.effective_status || null }, parseName(x.name)))
    .filter(x => !x.legacy)            /* เอาเฉพาะชื่อรูปแบบใหม่ ไม่งั้นแอดเก่าที่ปิดไปแล้วมาปน */
    .slice(0, 60);

  /* ④ ระดับแคมเปญ — "ลงทุนเท่าไหร่ ได้กลับเท่าไหร่" (นัทสั่งเอง 14 ก.ย. ผ่าน 06)
     ขอ 2 หน้าต่าง attribution แยกกัน: 7d_click = กดแอดแล้วซื้อ · 1d_view = แค่เห็นแอดแล้วซื้อ
     🔴 ห้ามรวมเป็นตัวเลขเดียว — ก้อน "แค่เห็น" มีลูกค้าเก่าที่จะซื้ออยู่แล้วปนอยู่ พิสูจน์ไม่ได้ว่าแอดทำให้ซื้อ
     ⚠️ ใช้ spend เท่านั้น ห้ามใช้ daily_budget — บัญชีมีแคมเปญค้างจากปี 2565 อีก 22 ตัว งบรวม ฿9,620/วัน แต่ไม่ได้ใช้เงินจริง */
  const campaignNote = campRes.err ? 'ดึงตัวเลขระดับแคมเปญไม่ได้ (' + (campRes.err.code || '?') + ')' : null;
  const campaigns = (campRes.rows || []).map(c => {
    const name = c.campaign_name || '(ไม่มีชื่อ)';
    return {
      id: c.campaign_id || '', name,
      /* ชื่อแคมเปญขึ้นต้นด้วยรหัสเดียวกับที่ติดไปกับลิงก์ เช่น "jay2026 · คอร์สเจ" → jay2026 */
      key: String(name).split(/[\s·]+/)[0].toLowerCase(),
      spend: +(+c.spend || 0).toFixed(2),
      clicks: +c.clicks || 0,
      impressions: +c.impressions || 0,
      leads: pick(c.actions, T_LEAD),
      buyClick: pickWin(c.actions, T_BUY, '7d_click'),
      buyView:  pickWin(c.actions, T_BUY, '1d_view'),
      valClick: +pickWin(c.action_values, T_BUY, '7d_click').toFixed(2),
      valView:  +pickWin(c.action_values, T_BUY, '1d_view').toFixed(2)
    };
  }).filter(c => c.spend > 0 || c.impressions > 0);

  /* ⑤ รายสัปดาห์ — นับจาก "วันเริ่มแคมเปญ" ไม่ใช่ย้อนหลัง 7 วัน (นัทเคาะเอง 15 ก.ย.)
     time_increment=7 แบ่งถังให้เองจากวันแรกของช่วงที่ขอ → ขอครั้งเดียวได้ทุกสัปดาห์ ไม่ต้องยิงทีละสัปดาห์
     06 ขึ้นงบเป็นขั้นบันไดรายสัปดาห์ → ต้องแบ่งให้ตรงกัน ถึงจะตอบได้ว่าเติมเงินแล้วดีขึ้นจริงไหม */
  /* focus (แคมเปญที่ยังใช้เงินอยู่จริง) ได้มาจากจุดรวมพลด้านบนแล้ว · starts อยู่ในแคชรอบเดียวกัน ไม่ยิงซ้ำ */
  const starts = await getStarts(T, ACC);
  const weekFrom = focus.length ? focus[0].start : '';
  let weeks = [], weekNote = null;
  /* ขอทีละแคมเปญที่โฟกัส เพราะขอบสัปดาห์ต้องเริ่มจากวันเริ่มของแคมเปญนั้นเอง (ไม่ใช่ของตัวที่เก่าที่สุด)
     จำกัดไม่เกิน 2 ตัว กันยิง Meta เกินจำเป็น · 2 ตัวนี้ไม่เกี่ยวกัน → ยิงพร้อมกัน ไม่ต่อคิว */
  const weekRes = await Promise.all(focus.slice(0, 2).map(async f => {
    try {
      const wUrl = GRAPH + encodeURIComponent(ACC) + '/insights?level=campaign&time_increment=7'
        + '&time_range=' + encodeURIComponent(JSON.stringify({ since: f.start, until }))
        + '&filtering=' + encodeURIComponent(JSON.stringify([{ field: 'campaign.id', operator: 'IN', value: [f.id] }]))
        + '&action_attribution_windows=' + encodeURIComponent(JSON.stringify(['7d_click', '1d_view']))
        + '&fields=campaign_id,campaign_name,spend,clicks,actions,action_values'
        + '&limit=200' + tok;
      return (await graphAll(wUrl, 3)).map(w => ({
        campId: w.campaign_id || f.id, name: w.campaign_name || f.name,
        key: String(w.campaign_name || f.name).split(/[\s·]+/)[0].toLowerCase(),
        from: w.date_start, to: w.date_stop,
        spend: +(+w.spend || 0).toFixed(2), clicks: +w.clicks || 0,
        leads: pick(w.actions, T_LEAD),
        buyClick: pickWin(w.actions, T_BUY, '7d_click'), buyView: pickWin(w.actions, T_BUY, '1d_view'),
        valClick: +pickWin(w.action_values, T_BUY, '7d_click').toFixed(2),
        valView: +pickWin(w.action_values, T_BUY, '1d_view').toFixed(2)
      }));
    } catch (e) { weekNote = 'ดึงตัวเลขรายสัปดาห์ไม่ได้ (' + (e.code || '?') + ')'; return []; }
  }));
  weekRes.forEach(rows => { weeks = weeks.concat(rows); });

  return { ads, notStarted, campaigns, campaignNote, weeks, weekNote, weekFrom, focus, starts, spendByDay, thumbNote, fetchedAt: Date.now() };
}

/* วันเริ่มแคมเปญ — ดึงจาก Meta เอง ไม่ฮาร์ดโค้ดวันที่ (06 ขอ) · เก็บแยกจากตัวเลข เพราะไม่ขึ้นกับช่วงที่เลือก */
async function getStarts(T, ACC) {
  const key = 'starts|' + ACC;
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.fetchedAt < TTL) return hit.data;
  try {
    const rows = await graphAll(GRAPH + encodeURIComponent(ACC) + '/campaigns'
      + '?fields=id,name,start_time,stop_time,effective_status&limit=300&access_token=' + encodeURIComponent(T), 3);
    const data = {};
    rows.forEach(c => {
      data[c.id] = { name: c.name || '', status: c.effective_status || '',
                     start: String(c.start_time || '').slice(0, 10), stop: String(c.stop_time || '').slice(0, 10) };
    });
    CACHE.set(key, { data, fetchedAt: Date.now() });
    return data;
  } catch (e) { return (hit && hit.data) || {}; }
}

/* แคมเปญที่ "ยังเปิดอยู่ และเพิ่งใช้เงินจริงใน 30 วันหลัง" — หัวใจของปุ่ม "ทั้งแคมเปญ"
   ⚠️ ห้ามใช้ "ทุกแคมเปญที่สถานะ ACTIVE" — ในบัญชีมีแคมเปญค้างจากหลายเดือนก่อนที่ยังขึ้น ACTIVE
   แต่เลิกใช้เงินไปแล้ว เอามานับด้วยช่วงจะลากย้อนไปหลายเดือน (เจอจริงบนเว็บ 15 ก.ย.: ลากถึง มี.ค.) */
async function activeSpenders(T, ACC) {
  const key = 'spenders|' + ACC;
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.fetchedAt < TTL) return hit.data;
  try {
    const url = GRAPH + encodeURIComponent(ACC) + '/insights?level=campaign'
      + '&time_range=' + encodeURIComponent(JSON.stringify({ since: th(new Date(Date.now() - 29 * 864e5)), until: th(new Date()) }))
      + '&fields=campaign_id,campaign_name,spend&limit=200&access_token=' + encodeURIComponent(T);
    /* 2 คำขอนี้ไม่ได้ใช้ผลของกันและกัน (วันเริ่มแคมเปญ กับ ยอดใช้ 30 วัน) → ถามพร้อมกัน */
    const [starts, rows] = await Promise.all([getStarts(T, ACC), graphAll(url, 3)]);
    const data = rows
      .map(r => ({ id: r.campaign_id, name: r.campaign_name || '', spend30: +r.spend || 0,
                   start: (starts[r.campaign_id] && starts[r.campaign_id].start) || '',
                   status: (starts[r.campaign_id] && starts[r.campaign_id].status) || '' }))
      .filter(c => c.spend30 > 0 && c.start && c.status === 'ACTIVE')
      .sort((x, y) => (x.start < y.start ? 1 : -1));   /* เริ่มล่าสุดก่อน */
    CACHE.set(key, { data, fetchedAt: Date.now() });
    return data;
  } catch (e) { return (hit && hit.data) || []; }
}

async function getMeta(T, ACC, since, until) {
  const key = since + '|' + until;
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.fetchedAt < TTL) return { data: hit, cache: 'hit' };
  if (INFLIGHT.has(key)) return { data: await INFLIGHT.get(key), cache: 'shared' };
  /* เครื่องเพิ่งตื่น = แรมว่าง แต่ของที่เครื่องก่อนหน้าดึงไว้ยังไม่หมดอายุ → ใช้ต่อได้เลย ไม่ต้องกวน Meta */
  const shelf = await shelfGet(key);
  if (shelf && Date.now() - shelf.fetchedAt < TTL) { CACHE.set(key, shelf.data); return { data: shelf.data, cache: 'shelf' }; }
  const p = fetchMeta(T, ACC, since, until);
  INFLIGHT.set(key, p);
  try {
    const data = await p;
    CACHE.set(key, data);
    await shelfSet(key, data);
    return { data, cache: 'miss' };
  } catch (e) {
    /* ติดลิมิต/ต่อไม่ได้ → ใช้ของเก่าที่เก็บไว้ ถ้ามี (แรมก่อน แล้วค่อยของบนชั้น แม้จะหมดอายุแล้ว) */
    if (hit) return { data: hit, cache: 'stale', errCode: e.code || '?' };
    if (shelf) return { data: shelf.data, cache: 'stale-shelf', errCode: e.code || '?' };
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
  let since = th(new Date(Date.now() - (days - 1) * 864e5));
  let rangeMode = 'days';

  /* ?range=campaign = "ทั้งแคมเปญ" — นับจากวันเริ่มแคมเปญถึงวันนี้ (นัทเคาะเอง 15 ก.ย.)
     ทำไมต้องมี: ค่าเริ่มต้นเดิมคือ 7 วันย้อนหลัง ตัวเลขเลยลดลงเองทุกวันที่กรอบเลื่อน
     นัทเจอเองว่า "เมื่อวานยังเห็น 15,000 วันนี้เหลือหมื่นเดียว" — เงินไม่ได้หาย แค่วันแรกตกออกจากกรอบ */
  if (req.query && req.query.range === 'campaign' && process.env.META_TOKEN && process.env.META_AD_ACCOUNT) {
    try {
      const sp = await activeSpenders(process.env.META_TOKEN, process.env.META_AD_ACCOUNT);
      /* ถอยไปถึงวันเริ่มของแคมเปญที่เริ่มก่อนสุด "ในกลุ่มที่ยังใช้เงินอยู่จริง" เท่านั้น
         (กันแคมเปญค้างจากหลายเดือนก่อนลากช่วงยาวเกิน) · เพดาน 180 วัน */
      let best = '';
      sp.forEach(c => { if (c.start && (!best || c.start < best)) best = c.start; });
      const floor = th(new Date(Date.now() - 180 * 864e5));
      if (best) { since = best < floor ? floor : best; rangeMode = 'campaign'; }
    } catch (e) { /* หาไม่ได้ก็ใช้ช่วงวันปกติ */ }
  }
  const out = { since, until, days, rangeMode, updatedAt: new Date().toISOString(), ads: [], totals: null, note: null };

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
  out.notStarted = (meta.notStarted || []).map(a => Object.assign({}, a));
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
    /* ดึงย้อนถึงวันเริ่มแคมเปญด้วย เพื่อให้ตารางรายสัปดาห์มีฝั่ง DB ครบ แม้ผู้ใช้เลือกช่วงสั้นกว่า
       ตัวเลขของ "ช่วงที่เลือก" ยังนับเฉพาะใบที่อยู่ในช่วงนั้นเหมือนเดิม */
    const qSince = (meta.weekFrom && meta.weekFrom < since) ? meta.weekFrom : since;
    const rows = await sbAll('orders?select=id,order_number,total,created_at,customer_id,customer_phone,customer_name,line_display_name,source,source_campaign,source_content'
      + '&created_at=gte.' + qSince + 'T00:00:00&total=gt.0&order=created_at.asc,id.asc', 10);
    const dayOf = o => String(o.created_at || '').slice(0, 10);
    const inRange = o => dayOf(o) >= since;
    const blank = () => ({ n: 0, rev: 0 });
    const byUtm = {}, adOrders = [];
    let matched = 0, revenue = 0;
    /* ── u360-untracked — ยอดที่ตามรอยไม่ได้ (พี่ปืนเคาะ 15 ก.ย.: ไม่รู้ ให้เขียนว่าไม่รู้ ห้ามเดาสัดส่วน) ──
       none  = ระบบรู้ว่าไม่มีที่มา (ลูกค้าเข้าเอง หรือมาจากลิงก์ที่ยังไม่ติดรหัส เช่นโพสต์ IG ของพลอย)
       blank = ไม่มีข้อมูลที่มาเลย (ออเดอร์ก่อนระบบจำที่มาเริ่มใช้ 11 ก.ย.)
       admin = แอดมินเปิดใบให้ลูกค้าเอง — ไม่เคยมีที่มาอยู่แล้ว */
    const untracked = { none: { n: 0, rev: 0 }, blank: { n: 0, rev: 0 }, admin: { n: 0, rev: 0 } };
    for (const o of rows) {
      const c = (o.source_campaign || '').trim();
      const t = +o.total || 0;
      const isAd = c.indexOf('fb/paid/') === 0;
      /* ยอดที่ตามรอยไม่ได้ นับเฉพาะใบในช่วงที่เลือก (ใบเก่ากว่านั้นดึงมาเพื่อทำตารางรายสัปดาห์เท่านั้น) */
      if (!isAd && inRange(o)) {
        const bucket = String(o.source || '') === 'admin_manual' ? 'admin' : (!c ? 'blank' : (c.indexOf('direct/none') === 0 ? 'none' : null));
        if (bucket) { untracked[bucket].n++; untracked[bucket].rev += t; }
      }
      /* 🔴 นับเฉพาะแอดที่เสียเงิน — ขึ้นต้น fb/paid/ เสมอ (ig/social, web, broadcast, direct/none ไม่นับ) */
      if (!isAd) continue;
      /* utm_content ของออเดอร์ — จาก source_content ถ้ามี ไม่มีก็ท้าย campaign (jay2026-a_n1_i034) */
      const k = ((o.source_content || '').trim() || (c.split('/').pop().split('-').pop() || '')).toLowerCase();
      /* รหัสแคมเปญ: fb/paid/jay2026-c2 → jay2026 (ตรงกับคำแรกของชื่อแคมเปญใน Meta) */
      const camp = c.slice('fb/paid/'.length).split('-')[0].toLowerCase();
      adOrders.push({ o, k, camp, day: dayOf(o), inRange: inRange(o) });
      if (!inRange(o)) continue;
      matched++; revenue += t;
      if (!k) continue;
      byUtm[k] = byUtm[k] || { orders: 0, revenue: 0, new: blank(), old: blank(), jay: blank(), unknown: blank() };
      byUtm[k].orders++; byUtm[k].revenue += t;
    }

    /* แยกคนซื้อ 🆕/🔁/🥬 — พังก็ยังโชว์ยอดรวมได้ */
    const totalsByType = { new: blank(), old: blank(), jay: blank(), unknown: blank() };
    const newList = [];
    let cls;
    try { cls = await classifyAdOrders(adOrders.map(x => x.o)); }
    catch (e) { cls = adOrders.map(x => ({ order: x.o, type: 'unknown', repeat: 0, items: [] })); out.buyerNote = 'แยกคนซื้อใหม่/เก่าไม่ได้ชั่วคราว'; }
    const adByUtm = {};
    for (const a of out.ads) if (a.utm && !adByUtm[a.utm]) adByUtm[a.utm] = a;
    const byCamp = {}, byWeekKey = {};
    cls.forEach((c, i) => {
      const o = c.order, k = adOrders[i].k, t = +o.total || 0;
      const cm = adOrders[i].camp;
      /* ฝั่ง DB ของตารางรายสัปดาห์ — เก็บทุกใบไม่ว่าจะอยู่ในช่วงที่เลือกหรือไม่ (แยกถังทีหลังตามวันที่) */
      if (cm) {
        const d = adOrders[i].day;
        (byWeekKey[cm] = byWeekKey[cm] || []).push({ day: d, total: t, isNew: c.type === 'new' });
      }
      if (!adOrders[i].inRange) return;      /* สถิติของ "ช่วงที่เลือก" นับเฉพาะใบในช่วงนั้น */
      totalsByType[c.type].n++; totalsByType[c.type].rev += t;
      if (k && byUtm[k]) { byUtm[k][c.type].n++; byUtm[k][c.type].rev += t; }
      /* สะสมรายแคมเปญ — ยอดที่ "ยืนยันใน DB" ได้จริง + นับหัวลูกค้าใหม่ */
      if (cm) {
        byCamp[cm] = byCamp[cm] || { orders: 0, revenue: 0, newBuyers: 0 };
        byCamp[cm].orders++; byCamp[cm].revenue += t;
        if (c.type === 'new') byCamp[cm].newBuyers++;
      }
      if (c.type === 'new') {
        const ad = adByUtm[k];
        newList.push({
          /* ชื่อที่แสดงเท่านั้น — ไม่มีชื่อ LINE ใช้แค่คำแรกของชื่อผู้รับ */
          name: o.line_display_name || String(o.customer_name || '').trim().split(/\s+/)[0] || 'ไม่มีชื่อ',
          at: o.created_at, total: t, utm: k || '', ad: ad ? ad.ad : '', code: ad && !ad.legacy ? ad.code : '',
          items: c.items, repeat: c.repeat
        });
      }
    });
    newList.sort((x, y) => (x.at < y.at ? 1 : -1));
    const round = x => { x.rev = +x.rev.toFixed(2); return x; };
    Object.values(totalsByType).forEach(round);
    Object.values(byUtm).forEach(b => { b.revenue = +b.revenue.toFixed(2); ['new', 'old', 'jay', 'unknown'].forEach(t => round(b[t])); });

    /* ── u360-campaign — สรุป "ลงทุนเท่าไหร่ ได้กลับเท่าไหร่" รายแคมเปญ ──
       กำไร = (ยอดที่ยืนยันใน DB × มาร์จิ้นประมาณการ) − เงินที่ใช้จริง · หน้าเว็บต้องติดป้ายว่าเป็นการประมาณ */
    out.campaigns = (meta.campaigns || []).map(c => {
      const db = byCamp[c.key] || { orders: 0, revenue: 0, newBuyers: 0 };
      return Object.assign({}, c, {
        dbOrders: db.orders, dbRevenue: +db.revenue.toFixed(2), newBuyers: db.newBuyers,
        estProfit: +(db.revenue * MARGIN - c.spend).toFixed(2), margin: MARGIN
      });
    }).sort((a, b) => b.spend - a.spend);
    if (meta.campaignNote) out.campaignNote = meta.campaignNote;

    /* ── u360-week — สัปดาห์ที่ 1/2/3 นับจากวันเริ่มแคมเปญ (นัทเคาะเอง 15 ก.ย.)
       06 ขึ้นงบเป็นขั้นบันไดรายสัปดาห์ → แบ่งตรงกันถึงจะตอบได้ว่าเติมเงินแล้วดีขึ้นจริงไหม
       สัปดาห์ที่ยังไม่จบต้องติดป้าย ไม่งั้นอ่านเหมือนสัปดาห์นั้นแย่ลง */
    const seen = {};
    out.weeks = (meta.weeks || [])
      .slice().sort((a, b) => (a.key === b.key ? (a.from < b.from ? -1 : 1) : (a.key < b.key ? -1 : 1)))
      .map(w => {
        const list = (byWeekKey[w.key] || []).filter(x => x.day >= w.from && x.day <= w.to);
        const rev = list.reduce((s, x) => s + x.total, 0);
        seen[w.key] = (seen[w.key] || 0) + 1;
        return Object.assign({}, w, {
          no: seen[w.key], dbOrders: list.length, dbRevenue: +rev.toFixed(2),
          newBuyers: list.filter(x => x.isNew).length,
          estProfit: +(rev * MARGIN - w.spend).toFixed(2), margin: MARGIN,
          running: w.to >= until          /* สัปดาห์นี้ยังไม่จบ */
        });
      });
    if (meta.weekNote) out.weekNote = meta.weekNote;
    out.campaignStart = meta.weekFrom || null;

    ['none', 'blank', 'admin'].forEach(k => { untracked[k].rev = +untracked[k].rev.toFixed(2); });
    out.untracked = untracked;

    out.orders = { matched, revenue: +revenue.toFixed(2), byUtm, scanned: rows.length };
    out.buyers = { totals: totalsByType, newList };

    /* ผูกออเดอร์เข้าแอดด้วย utm_content ตรงตัวเท่านั้น (ไม่ใช้ includes) */
    for (const a of out.ads) {
      const hit = a.utm && byUtm[a.utm];
      a.orders = hit ? hit.orders : 0;
      a.revenue = hit ? +hit.revenue.toFixed(2) : 0;
      a.costPerOrder = a.orders ? +(a.spend / a.orders).toFixed(2) : null;
    }
  } catch (e) { /* ไม่มีตัวเลขออเดอร์ก็ยังโชว์ตัวเลขแอดได้ */ }

  /* DB ล่มก็ยังต้องเห็นว่าแคมเปญไหนใช้เงินไปเท่าไหร่ — ช่องฝั่ง DB เป็น 0 พร้อมหมายเหตุ */
  if (!out.campaigns) {
    out.campaigns = (meta.campaigns || []).map(c => Object.assign({}, c,
      { dbOrders: 0, dbRevenue: 0, newBuyers: 0, estProfit: +(0 - c.spend).toFixed(2), margin: MARGIN }));
    if (meta.campaignNote) out.campaignNote = meta.campaignNote;
    out.campaignStart = meta.weekFrom || null;
    out.weeks = [];
    if (out.campaigns.length) out.campaignDbNote = 'อ่านออเดอร์จากฐานข้อมูลไม่ได้ตอนนี้ — ช่องยืนยันใน DB ยังไม่ใช่ของจริง';
  }

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
module.exports.classifyAdOrders = classifyAdOrders;

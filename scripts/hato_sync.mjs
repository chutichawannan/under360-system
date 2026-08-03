#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// hato_sync.mjs — ดึงออเดอร์ Hato ที่ยังไม่มีใน DB → insert (parallel sync)
// นัทเรียกงานนี้ว่า "sync"
//
// วิธีใช้:
//   1) เปิด Chrome ไปที่ portal.hatohub.com (ต้อง login ค้างไว้)
//   2) ดึง token (Claude ทำผ่าน browser ให้ หรือ DevTools):
//        indexedDB 'firebaseLocalStorageDb' → value.stsTokenManager.accessToken
//   3) node scripts/hato_sync.mjs <TOKEN> [ตั้งแต่วันที่ YYYY-MM-DD]
//
// ⚠️ กับดักที่เคยพลาด (จดไว้กันพลาดซ้ำ):
//   · o.number มี "HT-" นำหน้าอยู่แล้ว — ห้ามเติมซ้ำ
//   · placedAt = เวลาไทย (+07:00) ไม่ใช่ UTC
//   · filter orderFromDate ของ Hato ใช้ไม่ได้จริง → ต้องกรอง placedAt เองในโค้ด
//   · limit/offset เป็น Int! (required) ไม่ใช่ Int
//   · Supabase คืนแค่ 1000 แถวถ้าไม่ paginate ([[1000-cap]])
// ═══════════════════════════════════════════════════════════════

const TOKEN = process.argv[2];
const SINCE = process.argv[3] || new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
if (!TOKEN) { console.error('❌ ต้องส่ง token: node scripts/hato_sync.mjs <TOKEN> [YYYY-MM-DD]'); process.exit(1); }

const HATO = 'https://api.hatohub.com/admin/v2/graphql';
const VENDOR = 171, LOCATION = 2461;
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const SBH = { apikey: SK, Authorization: 'Bearer ' + SK, 'Content-Type': 'application/json' };

const Q = `query($vid:Int,$lid:Int,$limit:Int!,$offset:Int!,$filter:OrderListFilter){
  listOrdersWithPagination(vendorID:$vid,locationID:$lid,limit:$limit,offset:$offset,filter:$filter){
    orders{ number placedAt deliveryDate deliveryTimeslot status totalSatangs shippingTotalSatangs
      lineItemTotalSatangs deliveryDistanceM requestUtensils specialInstructions
      user{ name phone lineDisplayName }
      shippingAddress{ address detail latitude longitude phone name }
      lineItems{ quantity pricePerUnitSatangs totalSatangs customNotes product{ sku nameTh } } }
    pagination{ total } } }`;

const gql = async (variables) => {
  const r = await fetch(HATO, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + TOKEN },
    body: JSON.stringify({ query: Q, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 200));
  return j.data.listOrdersWithPagination;
};

const satang = (v) => (v == null ? null : v / 100);
const slotOf = (t) => { const m = (t || '').match(/(\d+):/); return (m ? +m[1] : 13) < 12 ? 'morning' : 'afternoon'; };
const stamp = () => new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });
const bkkToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());

(async () => {
  // 1) ดึงจาก Hato — 2 แกน เพราะแกนเดียวพลาดของจริงมาแล้ว (นัทจับได้ 3 ส.ค.: ขาด 2 ใบของวันที่ 4)
  //    แกน A "วันสั่ง" — ออเดอร์ที่เพิ่งเข้ามา
  //    แกน B "วันส่ง"  — ออเดอร์ล่วงหน้าที่สั่งไว้นานแล้วแต่ส่งวันข้างหน้า (แกน A มองไม่เห็นถ้า SINCE สั้น)
  console.log(`🔎 ดึงออเดอร์ Hato — วันสั่ง ≥ ${SINCE} + วันส่งล่วงหน้า 30 วัน ...`);
  let pool = [], offset = 0;
  for (let p = 0; p < 12; p++) {
    const d = await gql({ vid: VENDOR, lid: LOCATION, limit: 100, offset });
    const rows = d.orders || [];
    pool = pool.concat(rows);
    if (rows.length < 100) break;
    if (rows[rows.length - 1].placedAt < SINCE) break;
    offset += rows.length;
  }
  let recent = pool.filter((o) => o.placedAt >= SINCE);
  console.log(`   แกนวันสั่ง: ${recent.length} ใบ`);

  // แกน B — กรองที่ฝั่ง Hato ด้วย deliveryFromDate/ToDate (filter นี้ใช้ได้จริง ต่างจาก orderFromDate ที่เสีย)
  const today = bkkToday();
  const until = new Date(Date.parse(today + 'T00:00:00Z') + 30 * 864e5).toISOString().slice(0, 10);
  const seen = new Set(recent.map((o) => o.number));
  for (let p = 0; p < 6; p++) {
    const d = await gql({ vid: VENDOR, lid: LOCATION, limit: 100, offset: p * 100, filter: { deliveryFromDate: today, deliveryToDate: until } });
    const rows = d.orders || [];
    rows.forEach((o) => { if (!seen.has(o.number)) { seen.add(o.number); recent.push(o); } });
    if (rows.length < 100) break;
  }
  console.log(`   รวมทั้ง 2 แกน: ${recent.length} ใบ`);
  if (!recent.length) return console.log('✅ ไม่มีอะไรต้อง sync');

  // 2) เทียบกับ DB (chunk ละ 100 กัน URL ยาวเกิน)
  const have = new Set();
  for (let i = 0; i < recent.length; i += 100) {
    const chunk = recent.slice(i, i + 100).map((o) => o.number);
    const r = await fetch(`${SB}/orders?select=order_number&order_number=in.(${chunk.join(',')})`, { headers: { apikey: SK } });
    (await r.json()).forEach((x) => have.add(x.order_number));
  }
  const fresh = recent.filter((o) => !have.has(o.number));
  console.log(`   มีใน DB แล้ว ${have.size} · ต้อง insert ${fresh.length}`);
  if (!fresh.length) return console.log('✅ DB ทันปัจจุบันแล้ว');

  // 3) โหลด code เมนูจริง (ใช้แยกเมนูเดี่ยว vs เซ็ต)
  const codes = new Set((await (await fetch(`${SB}/menu_items?select=code&limit=2000`, { headers: { apikey: SK } })).json()).map((m) => m.code));

  // 4) insert ทีละใบ + order_items
  const ok = [], fail = [];
  for (const o of fresh) {
    const a = o.shippingAddress || {}, u = o.user || {};
    const sub = satang(o.lineItemTotalSatangs) || 0;
    const fee = satang(o.shippingTotalSatangs) || 0;
    const total = satang(o.totalSatangs) || 0;
    const row = {
      order_number: o.number,
      customer_name: u.name || a.name || null,
      customer_phone: u.phone || a.phone || null,
      line_display_name: u.lineDisplayName || null,
      source: 'hato',
      delivery_date: o.deliveryDate || null,
      time_slot: slotOf(o.deliveryTimeslot),
      time_slot_label: o.deliveryTimeslot || null,
      delivery_lat: a.latitude ?? null,
      delivery_lng: a.longitude ?? null,
      delivery_distance_km: o.deliveryDistanceM != null ? +(o.deliveryDistanceM / 1000).toFixed(1) : null,
      delivery_fee: fee,
      subtotal: sub,
      discount_amount: Math.max(0, +(sub + fee - total).toFixed(2)),
      total,
      payment_method: 'transfer',
      payment_status: total > 0 ? 'paid' : 'unpaid',
      status: /cancel/i.test(o.status || '') ? 'cancelled' : 'confirmed',
      admin_notes: `[HATO SYNC ${stamp()}]`,
      notes: o.specialInstructions || null,
      delivery_address: [a.address, a.detail].filter(Boolean).join(' ') || null,
      delivery_type: 'messenger',
      delivery_week: 'current',
      want_utensils: !!o.requestUtensils,
      created_at: o.placedAt,
    };
    const r = await fetch(`${SB}/orders`, { method: 'POST', headers: { ...SBH, Prefer: 'return=representation' }, body: JSON.stringify(row) });
    if (!r.ok) { fail.push(`${o.number} → ${r.status} ${(await r.text()).slice(0, 90)}`); continue; }
    const ins = (await r.json())[0];

    const items = (o.lineItems || []).map((li) => {
      const p = li.product || {}, sku = p.sku || null;
      return {
        order_id: ins.id, menu_code: sku, menu_name: p.nameTh || sku, quantity: li.quantity || 1,
        unit_price: satang(li.pricePerUnitSatangs) || 0, subtotal: satang(li.totalSatangs) || 0,
        notes: li.customNotes || (sku && !codes.has(sku) ? 'set:' + sku : null),
      };
    });
    if (items.length) {
      const ri = await fetch(`${SB}/order_items`, { method: 'POST', headers: { ...SBH, Prefer: 'return=minimal' }, body: JSON.stringify(items) });
      if (!ri.ok) { fail.push(`${o.number} items → ${ri.status}`); continue; }
    }
    ok.push({ no: o.number, total, items: items.length });
  }

  console.log(`\n✅ insert ${ok.length} ใบ · ฿${ok.reduce((s, x) => s + x.total, 0).toLocaleString()} · order_items ${ok.reduce((s, x) => s + x.items, 0)} รายการ`);
  if (fail.length) { console.log(`❌ ล้มเหลว ${fail.length}:`); fail.forEach((f) => console.log('   ' + f)); }
  ok.slice(0, 10).forEach((x) => console.log(`   ${x.no} · ฿${x.total} · ${x.items} รายการ`));
})().catch((e) => { console.error('💥 ' + e.message); process.exit(1); });

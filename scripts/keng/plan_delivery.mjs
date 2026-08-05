// 🛵 พี่เก่ง — เครื่องมือทำแพลนส่งรายวัน (รันจาก terminal ได้เลย ไม่ต้องเปิดหน้า OH)
//    node scripts/keng/plan_delivery.mjs 2026-08-07 [--json ไฟล์ที่จะเซฟ]
//
// ⚠️ ขอราคาอย่างเดียว — ไม่จองรถ ไม่มีการใช้เงิน (endpoint /api/lalamove-quote ทำได้แค่ quotation)
//
// ต่างจากปุ่มใน operation_hub.html ตรงไหน (ตั้งใจให้ต่าง — ยังไม่แก้ของ U):
//   1) จับกลุ่ม "ข้ามช่วงเวลา" ได้ถ้าลำดับแวะยังตรงกับที่รับปากลูกค้าทุกคน
//      (OH จับกลุ่มตาม label เป๊ะๆ → 12:00-13:00 กับ 13:00-14:00 ไม่มีวันรวมกัน ทั้งที่วิ่งต่อกันได้พอดี)
//   2) ไม่ใช้เพดาน "จุดห่างกัน ≤8 กม." มาตัดผู้สมัคร — เคสจริง 6 ส.ค. คู่ที่ห่าง 8.2 กม.
//      แต่อยู่ทางเดียวกัน รวมแล้วประหยัด ฿85 (37%) · ปล่อยให้ "ราคา" เป็นคนตัดสินแทนระยะ
//   ทั้ง 2 ข้อนี้ = ข้อเสนอ ยังไม่ได้แก้ไฟล์ของ U (กติกาห้อง: เจอของบ้านคนอื่น = ส่งให้เจ้าของ)
//
// กติกาที่ห้ามแตะ: เพดาน 3 งาน/รอบ (มาจากร่างกายคนขับ ไม่ใช่ราคา) · >60 กม. ไม่ใช่งานแมส
import fs from 'node:fs';

const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const QUOTE_URL = 'https://under360-system.vercel.app/api/lalamove-quote';

const KITCHEN   = { lat: 13.7179969, lng: 100.5010971, name: 'ครัว Under360' };
const MAX_STOPS   = 3;    // 🔴 ห้ามขึ้น — แมสบ่นหูชาตอนแบก 4 (นัทเคาะ 5 ส.ค. 2569)
const MAX_BIKE_KM = 60;   // เกินนี้ Lalamove ปฏิเสธ ERR_OUT_OF_SERVICE_AREA → เป็นงานขนส่ง
const MAX_SPAN_H  = 2;    // จุดในรอบเดียวกัน "เวลาเริ่ม" ห่างกันได้ไม่เกินนี้ — 3 จุดใช้เวลาวิ่งจริง ~1.5-2 ชม.
                          // (เคยตั้งเป็น "ต่อกันเป็นลูกโซ่" แล้วได้รอบที่กิน 8:00→13:00 = ไม่จริง)
const EST_BASE = 53, EST_PER_KM = 9.4;  // สูตรประเมิน R²=0.885 จาก 47 ตัวอย่างจริง — ใช้คัดผู้สมัครเท่านั้น ห้ามโชว์เป็นราคา

const date = process.argv[2];
if (!date) { console.error('ใส่วันที่ด้วย เช่น: node scripts/keng/plan_delivery.mjs 2026-08-07'); process.exit(1); }
const jsonOut = (() => { const i = process.argv.indexOf('--json'); return i > 0 ? process.argv[i + 1] : null; })();

const api = async (p) => {
  const r = await fetch(`${SB}/${p}`, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
};
const km = (a, b) => { const x = a.lat - b.lat, y = (a.lng - b.lng) * Math.cos(a.lat * Math.PI / 180); return Math.sqrt(x * x + y * y) * 111; };

// "14:00 - 15:00" / "12:00  -  13:00" / "8:00 - 9:00" / "afternoon" → {s,e} เป็นชั่วโมงทศนิยม
function parseWindow(label, slot) {
  const m = String(label || '').match(/(\d{1,2})[:.](\d{2})\s*-\s*(\d{1,2})[:.](\d{2})/);
  if (m) return { s: +m[1] + m[2] / 60, e: +m[3] + m[4] / 60, txt: `${m[1]}:${m[2]}-${m[3]}:${m[4]}` };
  if (slot === 'morning')   return { s: 8,  e: 12, txt: 'เช้า (8-12)' };
  if (slot === 'afternoon') return { s: 13, e: 17, txt: 'บ่าย (13-17)' };
  return { s: 8, e: 17, txt: 'ไม่ระบุ' };
}

// จัดลำดับแวะที่ระยะรวมสั้นสุด (≤3 จุด = ไล่ครบทุกแบบ ถูกมาก) — Lalamove คิดตามลำดับที่เราส่งไป
// ⛔ ลำดับต้องไม่ย้อนเวลา: คนที่รับปากไว้ 11:00 ต้องได้ก่อนคนที่รับปาก 12:00 เสมอ
//    (เดิมเลือกลำดับจาก "ระยะสั้นสุด" อย่างเดียว → ได้แผนที่แวะ 12:00 ก่อน 11:00 = ส่งไม่ทันจริง)
function bestOrder(g) {
  if (g.length < 2) return { order: g.slice(), dist: g.length ? km(KITCHEN, g[0]) : 0 };
  let best = null;
  (function perm(left, acc) {
    if (!left.length) {
      for (let i = 0; i + 1 < acc.length; i++) if (acc[i + 1].win.s < acc[i].win.s) return;  // ย้อนเวลา = ทิ้ง
      let d = 0, c = KITCHEN;
      for (const s of acc) { d += km(c, s); c = s; }
      if (!best || d < best.dist) best = { order: acc.slice(), dist: d };
      return;
    }
    for (let i = 0; i < left.length; i++) perm(left.slice(0, i).concat(left.slice(i + 1)), acc.concat([left[i]]));
  })(g, []);
  return best || { order: g.slice(), dist: Infinity };
}
const estimate = (g) => EST_BASE + EST_PER_KM * bestOrder(g).dist;

// รวมคันเดียวกันได้ไหม: เวลาเริ่มของทุกจุดต้องอยู่ในช่วง MAX_SPAN_H ชม.เดียวกัน
function timeFeasible(g) {
  const s = g.map(x => x.win.s);
  if (Math.max(...s) - Math.min(...s) > MAX_SPAN_H) return false;
  return bestOrder(g).dist !== Infinity;   // ต้องมีลำดับที่ไม่ย้อนเวลาอย่างน้อย 1 แบบ
}

const _cache = {};
async function quote(stops) {
  const key = stops.map(s => s.lat.toFixed(5) + ',' + s.lng.toFixed(5)).join('|');
  if (_cache[key] !== undefined) return _cache[key];
  let val = null;
  try {
    const r = await fetch(QUOTE_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'MOTORCYCLE', drops: stops.map(s => ({ lat: s.lat, lng: s.lng, addr: s.addr })) })
    });
    const j = await r.json().catch(() => ({}));
    if (j && j.ok && typeof j.price === 'number') val = { price: j.price, roadKm: j.raw?.data?.distance?.value ? +(j.raw.data.distance.value / 1000).toFixed(1) : null };
  } catch (e) { }
  _cache[key] = val;
  return val;
}

// DP บิตมาสก์ — เลือกชุดรอบที่ (ประเมินแล้ว) ถูกรวมสุด · ไม่ใช่หั่นตามลำดับ
function pickGroups(pts) {
  const N = pts.length; if (!N) return [];
  const FULL = (1 << N) - 1, cands = [];
  for (let m = 1; m <= FULL; m++) {
    const g = []; for (let i = 0; i < N; i++) if (m & (1 << i)) g.push(pts[i]);
    if (g.length > MAX_STOPS) continue;
    if (!timeFeasible(g)) continue;
    cands.push({ m, g, cost: estimate(g) });
  }
  const dp = new Array(FULL + 1).fill(Infinity), pick = new Array(FULL + 1).fill(null);
  dp[0] = 0;
  for (let s = 0; s <= FULL; s++) {
    if (dp[s] === Infinity) continue;
    const rest = FULL & ~s; if (!rest) continue;
    const low = rest & -rest;
    for (const q of cands) {
      if (q.m & s) continue; if (!(q.m & low)) continue;
      if (dp[s] + q.cost < dp[s | q.m]) { dp[s | q.m] = dp[s] + q.cost; pick[s | q.m] = { prev: s, g: q.g }; }
    }
  }
  const out = []; let cur = FULL;
  while (cur) { const p = pick[cur]; if (!p) break; out.push(p.g); cur = p.prev; }
  return out.reverse();
}

// ── 1) ดึงงานของวันนั้น ───────────────────────────────────────────
const orders = await api(`orders?select=order_number,customer_name,delivery_date,time_slot,time_slot_label,status,total,delivery_address,delivery_lat,delivery_lng,delivery_distance_km,notes&delivery_date=eq.${date}&order=order_number&limit=500`);
const live = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

const stops = [], outOfArea = [], noGeo = [];
for (const o of live) {
  if (o.delivery_lat == null || o.delivery_lng == null) { noGeo.push(o); continue; }
  const p = { lat: +o.delivery_lat, lng: +o.delivery_lng };
  const dist = o.delivery_distance_km != null ? +o.delivery_distance_km : km(KITCHEN, p);
  if (dist > MAX_BIKE_KM) { outOfArea.push({ ...o, dist }); continue; }
  // จุดเดียวกัน (ลูกค้าคนเดิม / ที่อยู่เดียวกัน) = 1 จุดแวะ ถือของหลายใบ
  const same = stops.find(s => km(s, p) < 0.05);
  if (same) { same.orders.push(o); continue; }
  stops.push({
    ...p, addr: (o.delivery_address || 'ปลายทาง').replace(/\s+/g, ' ').slice(0, 90),
    name: o.customer_name || 'ลูกค้า', orders: [o], straightKm: +km(KITCHEN, p).toFixed(1),
    win: parseWindow(o.time_slot_label, o.time_slot)
  });
}

// ── 2) จัดรอบ แล้วขอเรทจริง (ยิงติดกันในรอบเดียว เพราะเรทแกว่ง ±10%) ──
// ทุกลำดับแวะที่ "ไม่ย้อนเวลา" (≤3 จุด = ไม่เกิน 6 แบบ)
function feasibleOrders(g) {
  const out = [];
  (function perm(left, acc) {
    if (!left.length) {
      for (let i = 0; i + 1 < acc.length; i++) if (acc[i + 1].win.s < acc[i].win.s) return;
      out.push(acc.slice()); return;
    }
    for (let i = 0; i < left.length; i++) perm(left.slice(0, i).concat(left.slice(i + 1)), acc.concat([left[i]]));
  })(g, []);
  return out;
}

const groups = pickGroups(stops);
const trips = [];
for (const g of groups) {
  // ⚠️ เรียงลำดับด้วย "ระยะเส้นตรง" เลือกผิดจริง — เคสจริง 7 ส.ค. ลำดับที่สูตรเลือกแพงกว่าลำดับที่ถูกสุด ฿41 (13%)
  //    เพราะ Lalamove คิดตามระยะถนนจริง (ข้ามแม่น้ำ/ทางด่วน) → ให้ "ราคาจริง" เป็นคนเลือกลำดับ
  const orders = feasibleOrders(g);
  let bestQ = null;
  for (const o of orders) {
    const q = await quote(o);
    if (q && (!bestQ || q.price < bestQ.q.price)) bestQ = { o, q };
  }
  const order = bestQ ? bestQ.o : bestOrder(g).order;
  const t = { stops: order, straightKm: +bestOrder(g).dist.toFixed(1), ordersTried: orders.length };
  t.groupPrice = bestQ?.q.price ?? null; t.roadKm = bestQ?.q.roadKm ?? null;
  t.soloTotal = 0; t.soloOk = true;
  for (const s of order) { const v = await quote([s]); if (!v) t.soloOk = false; else { t.soloTotal += v.price; s.soloPrice = v.price; s.soloRoadKm = v.roadKm; } }
  t.merge = order.length > 1 && t.groupPrice != null && t.soloOk && t.groupPrice < t.soloTotal;
  t.cost = t.merge ? t.groupPrice : (t.soloOk ? t.soloTotal : t.groupPrice);
  t.save = (t.groupPrice != null && t.soloOk) ? Math.max(0, t.soloTotal - t.groupPrice) : 0;
  t.crossSlot = new Set(order.map(s => s.win.txt)).size > 1;
  trips.push(t);
}

const totalPlan = trips.reduce((a, t) => a + (t.cost || 0), 0);
const totalSolo = stops.reduce((a, s) => a + (s.soloPrice || 0), 0);

// ── 3) รายงาน ────────────────────────────────────────────────────
const money = n => '฿' + Number(n || 0).toLocaleString('th-TH');
console.log(`\n🛵 แพลนส่ง ${date} — ขอราคาอย่างเดียว ยังไม่จองรถ`);
console.log(`   งานทั้งหมด ${live.length} ใบ → จุดแวะแมส ${stops.length} จุด · นอกเขต(>${MAX_BIKE_KM}กม.) ${outOfArea.length} · ไม่มีพิกัด ${noGeo.length}\n`);
trips.forEach((t, i) => {
  const tag = t.merge ? (t.crossSlot ? 'รวมรอบ ⚠️ข้ามช่วงเวลา' : 'รวมรอบ') : 'วิ่งเดี่ยว';
  console.log(`รอบ ${i + 1} [${tag}] ${money(t.cost)}${t.save ? `  (แยกยิง ${money(t.soloTotal)} → ประหยัด ${money(t.save)})` : ''}`);
  t.stops.forEach((s, k) => console.log(`   ${k + 1}. ${s.win.txt.padEnd(12)} ${s.name}  · ${s.straightKm} กม. · ${s.orders.map(o => o.order_number).join('+')}`));
});
console.log(`\nรวมทั้งวัน ${money(totalPlan)}  ·  ถ้ายิงแยกทุกจุด ${money(totalSolo)}  ·  ประหยัด ${money(totalSolo - totalPlan)} (${totalSolo ? Math.round((1 - totalPlan / totalSolo) * 100) : 0}%)`);
if (outOfArea.length) { console.log(`\n🚚 ไม่ใช่งานแมส (>${MAX_BIKE_KM} กม. — ต้องส่งขนส่ง/NIM):`); outOfArea.forEach(o => console.log(`   · ${o.order_number} ${o.customer_name} — ${Math.round(o.dist)} กม.`)); }
if (noGeo.length) { console.log(`\n❌ ไม่มีพิกัด (วางแผนไม่ได้ ต้องให้แอดมินปักหมุด):`); noGeo.forEach(o => console.log(`   · ${o.order_number} ${o.customer_name}`)); }

if (jsonOut) {
  fs.writeFileSync(jsonOut, JSON.stringify({ date, kitchen: KITCHEN, trips, stops, outOfArea, noGeo, totalPlan, totalSolo, maxStops: MAX_STOPS }, null, 2));
  console.log(`\n💾 เซฟ JSON → ${jsonOut}`);
}

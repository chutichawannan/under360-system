#!/usr/bin/env node
/**
 * 🤖 น้องนิว v1 — เฝ้าเมนูพิเศษประจำสัปดาห์ "อย่าให้ทำเหลือ"
 * ------------------------------------------------------------------
 * งาน ก (ก่อนผลิต)     : ดูสถิติย้อนหลัง → แนะ "สัปดาห์หน้าควรผลิต ~N กล่อง"
 * งาน ข (ระหว่างสัปดาห์): ผลิต vs ขาย → ตัวไหนจะเหลือ = ยิงการ์ดเตือน
 *
 * โมเดลข้อมูล (verify กับ origin/main แล้ว 5 ส.ค. 2026):
 *   menu_items.actual_stock = "ผลิตได้จริง" ที่ครัวกรอกใน KQ   → ผลิต
 *   menu_items.stock_total  = เลขที่ขายได้ · RPC adjust_stock ตัดตอนลูกค้าสั่ง → เหลือ
 *   ⚠️ KQ ตั้ง stock_total ให้ "เฉพาะเมนูที่ stock_total ไม่ใช่ null" (kitchen_queue.html:582)
 *      → เมนูพิเศษที่เป็น null ต้องไปตั้งเลขในแท็บ "ตั้งสต็อค" ก่อน 1 ครั้ง ไม่งั้นวงจรไม่เดิน
 *
 * ⏰ ยึดเวลาไทย (Asia/Bangkok) เสมอ — นัทอยู่ PST คำนวณจากเครื่องจะเพี้ยน
 * 🔒 read-only ทั้งไฟล์ ไม่เขียน DB
 *
 * รัน: node scripts/niw/weekly_special_watch.mjs [--json]
 */

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

const HISTORY_WEEKS = 8;   // งาน ก: ย้อนหลังกี่สัปดาห์
const SAFETY = 1.10;       // เผื่อ 10% ตอนแนะจำนวนผลิต (ขาดดีกว่าเหลือ แต่ไม่ให้ขาดบ่อย)

/* ── เวลาไทย ───────────────────────────────────────────── */
const bkkNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** สัปดาห์ไทย จันทร์→อาทิตย์ */
function weekRange(ref) {
  const dow = ref.getDay();                 // 0=อา
  const back = dow === 0 ? 6 : dow - 1;     // ถอยไปวันจันทร์
  const mon = addDays(ref, -back);
  return { start: ymd(mon), end: ymd(addDays(mon, 6)), monday: mon };
}

/* ── Supabase (paginate เสมอ — บทเรียน 1000-cap) ─────────── */
async function sbGet(path, { pageSize = 1000 } = {}) {
  const out = [];
  for (let from = 0; ; from += pageSize) {
    const url = `${SB}/rest/v1/${path}`;
    const res = await fetch(url, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + pageSize - 1}` },
    });
    if (!res.ok) throw new Error(`${res.status} ${path}\n${(await res.text()).slice(0, 300)}`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

/** ดึงรายการขายดิบ (รายบรรทัด + วันส่ง) — ตัดออเดอร์ยกเลิก/เทส */
async function salesRows(codes, startDate, endDate) {
  if (!codes.length) return [];
  const inList = codes.map((c) => `"${c}"`).join(',');
  return sbGet(
    `order_items?select=menu_code,quantity,orders!inner(delivery_date,status,source)` +
    `&menu_code=in.(${inList})` +
    `&orders.delivery_date=gte.${startDate}&orders.delivery_date=lte.${endDate}` +
    `&orders.status=not.in.("cancelled","canceled")` +
    `&orders.source=not.in.("parallel_test")`
  );
}

/** รวมยอดรายเมนู */
function tallyByCode(rows) {
  const t = {};
  for (const r of rows) t[r.menu_code] = (t[r.menu_code] || 0) + (Number(r.quantity) || 0);
  return t;
}

/**
 * รวมยอดรายเมนู "แยกรายสัปดาห์"
 * ⚠️ เมนูพิเศษ = หมุนเวียน (ขายเฉพาะสัปดาห์ที่ถูกเลือกขึ้น)
 *    → ห้ามหารด้วยจำนวนสัปดาห์ทั้งหมด จะได้ค่าต่ำจนไร้ความหมาย
 *    → ต้องเฉลี่ยเฉพาะ "สัปดาห์ที่ขายจริง" เท่านั้น
 */
function tallyByCodeWeek(rows) {
  const t = {};   // code -> { 'YYYY-MM-DD(จันทร์)': qty }
  for (const r of rows) {
    const dd = r.orders?.delivery_date;
    if (!dd) continue;
    const [y, m, d] = dd.split('-').map(Number);
    const wkKey = weekRange(new Date(y, m - 1, d)).start;
    (t[r.menu_code] ||= {});
    t[r.menu_code][wkKey] = (t[r.menu_code][wkKey] || 0) + (Number(r.quantity) || 0);
  }
  return t;
}

/* ── main ──────────────────────────────────────────────── */
async function main() {
  const now = bkkNow();
  const wk = weekRange(now);
  const dayIdx = now.getDay() === 0 ? 7 : now.getDay();   // จ=1 .. อา=7
  const daysLeft = 7 - dayIdx;
  const pace = dayIdx / 7;                                 // เป้าที่ควรขายได้ ณ วันนี้

  // เมนูที่เฝ้า — ปกติ = เมนูพิเศษประจำสัปดาห์
  // --stocked = เฝ้าทุกเมนูที่ตั้งสต็อกไว้ (ใช้ตอน flag เมนูพิเศษยังไม่มีใคร maintain)
  const watchAllStocked = process.argv.includes('--stocked');
  const filter = watchAllStocked
    ? 'stock_total=not.is.null&is_available=eq.true'
    : 'is_weekly_special=eq.true';
  const specials = await sbGet(
    'menu_items?select=id,code,name,price,actual_stock,stock_total,is_available,is_weekly_special' +
    `&${filter}&order=code`
  );

  const codes = specials.map((m) => m.code);
  const soldThisWeek = tallyByCode(await salesRows(codes, wk.start, wk.end));

  // งาน ก — สถิติย้อนหลัง แยกรายสัปดาห์ (นับเฉพาะสัปดาห์ที่ขายจริง)
  const histStart = ymd(addDays(wk.monday, -7 * HISTORY_WEEKS));
  const histEnd = ymd(addDays(wk.monday, -1));
  const histByWeek = tallyByCodeWeek(await salesRows(codes, histStart, histEnd));

  const cards = [];
  const blockers = [];

  for (const m of specials) {
    const sold = soldThisWeek[m.code] || 0;
    const produced = m.actual_stock;      // ผลิต
    const left = m.stock_total;           // เหลือ (null = ไม่จำกัด = ไม่ track)

    // งาน ก — เฉลี่ยเฉพาะ "สัปดาห์ที่ขายจริง" (เมนูพิเศษหมุนเวียน ห้ามหารด้วย 8)
    const wkMap = histByWeek[m.code] || {};
    const activeWeeks = Object.entries(wkMap).sort(([a], [b]) => a < b ? -1 : 1);
    const qtys = activeWeeks.map(([, q]) => q);
    // ใช้ median ไม่ใช่ mean — กัน outlier (เช่น A2 มีสัปดาห์เดียวขาย 28 จากปกติ 2-8)
    // ดันค่าเฉลี่ยจนแนะให้ผลิตเกิน = ผิดเป้าหมาย "อย่าให้เหลือ"
    const sorted = [...qtys].sort((a, b) => a - b);
    const histAvg = sorted.length
      ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2]
         : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2))
      : 0;
    const lastWeekQty = qtys.length ? qtys[qtys.length - 1] : 0;
    // ฐานแนะนำ = median ของสัปดาห์ที่ขายจริง (ถ้าสัปดาห์ล่าสุดสูงกว่า ใช้ตัวกลางระหว่าง 2 ค่า)
    const base = lastWeekQty > histAvg ? Math.ceil((histAvg + lastWeekQty) / 2) : histAvg;
    const suggest = base > 0 ? Math.ceil(base * SAFETY) : null;
    const histNote = qtys.length
      ? `ขายจริง ${qtys.length} สัปดาห์ (จากย้อนหลัง ${HISTORY_WEEKS}) · ` +
        activeWeeks.map(([w, q]) => `${w.slice(5)}=${q}`).join(' · ')
      : `ไม่เคยขายเลยใน ${HISTORY_WEEKS} สัปดาห์ย้อนหลัง (เมนูใหม่?)`;

    // ⚠️ ข้อมูลขัดกันเอง: "เหลือ" มากกว่า "ผลิต" (actual_stock กับ stock_total ตั้งคนละที คนละเวลา)
    //    เกิดจริง เช่น A13 ผลิต 6 แต่ stock_total 9 → คำนวณ "ขาย" ติดลบ ใช้ไม่ได้
    const inconsistent = left !== null && produced != null && produced > 0 && left > produced;
    if (inconsistent) {
      blockers.push({
        code: m.code, name: m.name,
        reason: `ข้อมูลขัดกัน — เหลือ (stock_total=${left}) มากกว่าผลิต (actual_stock=${produced}) · ` +
                'ตั้งคนละที/คนละเวลา → ต้องกรอก "ผลิตได้จริง" รอบใหม่ให้ตรงกันก่อน',
        soldThisWeek: sold, histAvgPerWeek: histAvg, suggestNextWeek: suggest, histNote,
      });
      continue;
    }

    // ตรวจว่าข้อมูลพอเฝ้าไหม
    const trackable = left !== null && produced != null && produced > 0;
    if (!trackable) {
      blockers.push({
        code: m.code, name: m.name,
        reason: left === null
          ? 'stock_total = null (ไม่จำกัด) → ลูกค้าสั่งไม่ตัดสต็อก · ต้องตั้งเลขในแท็บ "ตั้งสต็อค" ของ KQ ก่อน 1 ครั้ง'
          : 'ยังไม่มีใครกรอก "ผลิตได้จริง" ใน KQ (actual_stock = ' + produced + ')',
        soldThisWeek: sold, histAvgPerWeek: histAvg, suggestNextWeek: suggest, histNote,
      });
      continue;
    }

    const sellThrough = produced > 0 ? sold / produced : 0;
    const expected = produced * pace;
    const behind = sold < expected;
    // คาดการณ์: ขายต่อวันเท่าที่ผ่านมา → จบสัปดาห์จะเหลือเท่าไหร่
    const perDay = sold / dayIdx;
    const projectedLeft = Math.max(0, Math.round(produced - perDay * 7));

    let level = 'ok';
    if (projectedLeft >= produced * 0.30) level = 'risk';       // จะเหลือ ≥30%
    else if (projectedLeft >= produced * 0.15) level = 'watch'; // เหลือ 15-30%

    cards.push({
      code: m.code, name: m.name, level,
      produced, sold, left, daysLeft,
      sellThroughPct: Math.round(sellThrough * 100),
      targetPct: Math.round(pace * 100),
      behind, projectedLeft,
      histAvgPerWeek: histAvg, suggestNextWeek: suggest, histNote,
      actions: level === 'ok' ? [] : ['ดันขึ้นหน้าแรก LIFF', 'แถมกับออเดอร์อื่น', 'ลดราคาเคลียร์'],
    });
  }

  const result = {
    generatedAt: now.toISOString(),
    weekThai: `${wk.start} → ${wk.end}`,
    dayOfWeek: dayIdx, daysLeft,
    specialsFound: specials.length,
    cards, blockers,
  };

  if (process.argv.includes('--json')) { console.log(JSON.stringify(result, null, 2)); return; }

  /* ── รายงานอ่านง่าย ── */
  const L = [];
  L.push('🤖 น้องนิว — เมนูพิเศษประจำสัปดาห์');
  L.push(`📅 สัปดาห์ ${wk.start} → ${wk.end} (เวลาไทย) · วันที่ ${dayIdx}/7 · เหลืออีก ${daysLeft} วัน`);
  L.push(`🔎 เจอเมนูพิเศษ ${specials.length} ตัว`);
  L.push('');

  if (cards.length) {
    L.push('── 📊 เฝ้าอยู่ ──');
    for (const c of cards) {
      const icon = c.level === 'risk' ? '🔴 เสี่ยงเหลือ' : c.level === 'watch' ? '🟡 จับตา' : '🟢 ปกติ';
      L.push(`${icon}  ${c.code} · ${c.name}`);
      L.push(`   ผลิต ${c.produced} · ขาย ${c.sold} · เหลือ ${c.left}  |  ขายไป ${c.sellThroughPct}% (เป้า ณ วันนี้ ${c.targetPct}%)`);
      L.push(`   คาดจบสัปดาห์เหลือ ~${c.projectedLeft} กล่อง`);
      if (c.actions.length) L.push(`   💡 ${c.actions.join(' · ')}`);
      L.push('');
    }
  }

  if (blockers.length) {
    L.push('── 🔴 ยังเฝ้าไม่ได้ (ข้อมูลไม่พร้อม) ──');
    for (const b of blockers) {
      L.push(`   ${b.code} · ${b.name}`);
      L.push(`   ↳ ${b.reason}`);
      L.push(`   ↳ สัปดาห์นี้ขายไปแล้ว ${b.soldThisWeek} กล่อง`);
      L.push(`   ↳ ประวัติ: ${b.histNote}`);
      if (b.suggestNextWeek) L.push(`   ↳ 📦 งาน ก: รอบหน้าควรผลิต ~${b.suggestNextWeek} กล่อง (ฐาน ${b.histAvgPerWeek}/สัปดาห์ที่ขายจริง +10%)`);
      else L.push(`   ↳ 📦 งาน ก: ยังแนะจำนวนไม่ได้ (ไม่มีประวัติขาย)`);
      L.push('');
    }
  }

  if (!cards.length && !blockers.length) L.push('(ไม่มีเมนูที่ติดธง "เมนูพิเศษประจำสัปดาห์")');
  console.log(L.join('\n'));
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });

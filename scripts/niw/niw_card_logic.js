/* ============================================================================
 * 🤖 น้องนิว — logic การ์ด "เมนูพิเศษอย่าให้ทำเหลือ"  (ฉบับ client-side)
 * ----------------------------------------------------------------------------
 * ส่งให้ CC แปะใน command_center.html · รับ supabase client → คืน {cards, blockers}
 *
 * ⚠️⚠️ สูตรนี้มี 2 ที่ — แก้ต้องแก้ทั้งคู่ ⚠️⚠️
 *     ตัวอ้างอิงจริง = scripts/niw/weekly_special_watch.mjs  (CLI · เจ้าของ = ห้องนิว)
 *     ตัวนี้         = สำเนาสำหรับหน้าเว็บ
 *     สเปคเต็ม       = scripts/niw/CARD_SPEC.md
 *
 * โมเดลข้อมูล (verify กับ origin/main แล้ว 5 ส.ค. 2026):
 *   menu_items.actual_stock = "ผลิตได้จริง" ครัวกรอกใน KQ  → ผลิต
 *   menu_items.stock_total  = เลขขายได้ · RPC adjust_stock ตัดตอนลูกค้าสั่ง → เหลือ
 *   ⚠️ kitchen_queue.html:582 ตั้ง stock_total ให้ "เฉพาะเมนูที่ไม่ใช่ null"
 *      → เมนูที่เป็น null ครัวกรอกไปก็ไม่มีผล ต้องตั้งเลขในแท็บ "ตั้งสต็อค" ก่อน 1 ครั้ง
 *
 * ⏰ ยึดเวลาไทยเสมอ (นัทอยู่ PST — คำนวณจากเครื่องจะเพี้ยน 1 วัน)
 * 🔒 read-only — ไม่เขียน DB
 * ==========================================================================*/

const NIW_HISTORY_WEEKS = 8;   // ย้อนหลังกี่สัปดาห์ (งาน ก)
const NIW_SAFETY = 1.10;       // เผื่อ 10% ตอนแนะจำนวนผลิต

/* ── เวลาไทย ─────────────────────────────────────────── */
function niwBkkNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
}
function niwYmd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function niwAddDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

/** สัปดาห์ไทย จันทร์→อาทิตย์ */
function niwWeekRange(ref) {
  const dow = ref.getDay();                  // 0=อาทิตย์
  const back = dow === 0 ? 6 : dow - 1;
  const mon = niwAddDays(ref, -back);
  return { start: niwYmd(mon), end: niwYmd(niwAddDays(mon, 6)), monday: mon };
}

/** ดึงรายการขาย (paginate เสมอ — บทเรียน 1000-cap) */
async function niwSalesRows(sb, codes, startDate, endDate) {
  if (!codes.length) return [];
  const out = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from('order_items')
      .select('menu_code,quantity,orders!inner(delivery_date,status,source)')
      .in('menu_code', codes)
      .gte('orders.delivery_date', startDate)
      .lte('orders.delivery_date', endDate)
      .not('orders.status', 'in', '("cancelled","canceled")')
      .not('orders.source', 'in', '("parallel_test")')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

function niwTally(rows) {
  const t = {};
  for (const r of rows) t[r.menu_code] = (t[r.menu_code] || 0) + (Number(r.quantity) || 0);
  return t;
}

/** รวมยอดแยกรายสัปดาห์ — เมนูพิเศษหมุนเวียน ห้ามหารด้วยจำนวนสัปดาห์ทั้งหมด */
function niwTallyByWeek(rows) {
  const t = {};
  for (const r of rows) {
    const dd = r.orders && r.orders.delivery_date;
    if (!dd) continue;
    const p = dd.split('-').map(Number);
    const wkKey = niwWeekRange(new Date(p[0], p[1] - 1, p[2])).start;
    if (!t[r.menu_code]) t[r.menu_code] = {};
    t[r.menu_code][wkKey] = (t[r.menu_code][wkKey] || 0) + (Number(r.quantity) || 0);
  }
  return t;
}

/**
 * 🤖 หลัก — เรียกตัวนี้ตัวเดียว
 * @param {object} sb       supabase client
 * @param {object} [opt]    { mode: 'special' | 'stocked' }
 *                          special = เฉพาะ is_weekly_special (ค่าเริ่มต้น)
 *                          stocked = ทุกเมนูที่ตั้งสต็อกไว้ (ใช้ตอน flag เมนูพิเศษยังไม่มีใคร maintain)
 * @returns {Promise<{weekThai,dayOfWeek,daysLeft,watchedCount,cards,blockers}>}
 */
async function niwWeeklySpecialWatch(sb, opt) {
  const mode = (opt && opt.mode) || 'special';
  const now = niwBkkNow();
  const wk = niwWeekRange(now);
  const dayIdx = now.getDay() === 0 ? 7 : now.getDay();   // จ=1 .. อา=7
  const daysLeft = 7 - dayIdx;
  const pace = dayIdx / 7;

  let q = sb.from('menu_items')
    .select('id,code,name,price,actual_stock,stock_total,is_available,is_weekly_special')
    .order('code');
  q = mode === 'stocked'
    ? q.not('stock_total', 'is', null).eq('is_available', true)
    : q.eq('is_weekly_special', true);
  const { data: menus, error } = await q;
  if (error) throw error;

  const list = menus || [];
  const codes = list.map(m => m.code);
  const soldThisWeek = niwTally(await niwSalesRows(sb, codes, wk.start, wk.end));

  const histStart = niwYmd(niwAddDays(wk.monday, -7 * NIW_HISTORY_WEEKS));
  const histEnd = niwYmd(niwAddDays(wk.monday, -1));
  const histByWeek = niwTallyByWeek(await niwSalesRows(sb, codes, histStart, histEnd));

  const cards = [], blockers = [];

  for (const m of list) {
    const sold = soldThisWeek[m.code] || 0;
    const produced = m.actual_stock;
    const left = m.stock_total;

    /* ── งาน ก: แนะจำนวนผลิตรอบหน้า ──
       median (ไม่ใช่ mean) เฉพาะสัปดาห์ที่ขายจริง
       เหตุผล: A2 มีสัปดาห์เดียวขาย 28 (ปกติ 2-8) → mean ดันให้แนะผลิตเกิน = ผิดเป้า "อย่าให้เหลือ" */
    const wkMap = histByWeek[m.code] || {};
    const activeWeeks = Object.keys(wkMap).sort().map(k => [k, wkMap[k]]);
    const qtys = activeWeeks.map(x => x[1]);
    const sorted = qtys.slice().sort((a, b) => a - b);
    const histAvg = sorted.length
      ? (sorted.length % 2
          ? sorted[(sorted.length - 1) / 2]
          : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2))
      : 0;
    const lastWeekQty = qtys.length ? qtys[qtys.length - 1] : 0;
    const base = lastWeekQty > histAvg ? Math.ceil((histAvg + lastWeekQty) / 2) : histAvg;
    const suggestNextWeek = base > 0 ? Math.ceil(base * NIW_SAFETY) : null;
    const histNote = qtys.length
      ? 'ขายจริง ' + qtys.length + ' สัปดาห์ (จากย้อนหลัง ' + NIW_HISTORY_WEEKS + ') · ' +
        activeWeeks.map(x => x[0].slice(5) + '=' + x[1]).join(' · ')
      : 'ไม่เคยขายเลยใน ' + NIW_HISTORY_WEEKS + ' สัปดาห์ย้อนหลัง (เมนูใหม่?)';

    const common = {
      code: m.code, name: m.name, soldThisWeek: sold,
      histAvgPerWeek: histAvg, suggestNextWeek, histNote,
    };

    // reason แบบ 1 — ตั้ง "ไม่จำกัด" → ลูกค้าสั่งไม่ตัดสต็อก
    if (left === null || left === undefined) {
      blockers.push(Object.assign({}, common, {
        reasonType: 'no_stock_number',
        reason: 'stock_total = null (ไม่จำกัด) → ลูกค้าสั่งไม่ตัดสต็อก',
        howToFix: 'ตั้งเลขในแท็บ "ตั้งสต็อค" ของ KQ ก่อน 1 ครั้ง (ถ้าไม่ตั้ง กรอก "ผลิตได้จริง" ไปก็ไม่มีผล)',
      }));
      continue;
    }
    // reason แบบ 3 — ข้อมูลขัดกัน (เหลือ > ผลิต) เช่น A13 ผลิต 6 · stock 9
    if (produced != null && produced > 0 && left > produced) {
      blockers.push(Object.assign({}, common, {
        reasonType: 'inconsistent',
        reason: 'ข้อมูลขัดกัน — เหลือ (' + left + ') มากกว่าผลิต (' + produced + ')',
        howToFix: 'กรอก "ผลิตได้จริง" รอบใหม่ให้ตรงกับของที่ทำจริง',
      }));
      continue;
    }
    // reason แบบ 2 — ยังไม่มีใครกรอกผลิต
    if (produced == null || produced <= 0) {
      blockers.push(Object.assign({}, common, {
        reasonType: 'no_production',
        reason: 'ยังไม่มีใครกรอก "ผลิตได้จริง" ใน KQ (actual_stock = ' + produced + ')',
        howToFix: 'ครัวกรอก "ผลิตได้จริง" ใน KQ',
      }));
      continue;
    }

    /* ── งาน ข: เฝ้าระหว่างสัปดาห์ ── */
    const perDay = sold / dayIdx;
    const projectedLeft = Math.max(0, Math.round(produced - perDay * 7));
    let level = 'ok';
    if (projectedLeft >= produced * 0.30) level = 'risk';
    else if (projectedLeft >= produced * 0.15) level = 'watch';

    cards.push(Object.assign({}, common, {
      level, produced, sold, left, daysLeft,
      sellThroughPct: Math.round((sold / produced) * 100),
      targetPct: Math.round(pace * 100),
      projectedLeft,
      actions: level === 'ok' ? [] : ['ดันขึ้นหน้าแรก LIFF', 'แถมกับออเดอร์อื่น', 'ลดราคาเคลียร์'],
    }));
  }

  // เรียง: เสี่ยงสุดขึ้นก่อน
  const rank = { risk: 0, watch: 1, ok: 2 };
  cards.sort((a, b) => (rank[a.level] - rank[b.level]) || (b.projectedLeft - a.projectedLeft));

  return {
    weekThai: wk.start + ' → ' + wk.end,
    dayOfWeek: dayIdx, daysLeft,
    watchedCount: list.length,
    cards, blockers,
  };
}

// ใช้ใน command_center.html:  const r = await niwWeeklySpecialWatch(sb, { mode: 'stocked' });

/**
 * f-track — ตัวกรองยอดขายกลาง (ใช้ซ้ำทุกที่ ห้ามคำนวณยอดขายด้วยมือเอง)
 *
 * ทำไมต้องมีไฟล์นี้: ตาราง orders มีของปนอยู่ 5 อย่างที่ทำให้ยอดผิดแบบเงียบๆ
 * ไม่มี error ไม่มีสัญญาณเตือน — ใครจำไม่ครบสักข้อ ตัวเลขก็เพี้ยนทันที
 *
 *   1. PostgREST คืนแค่ 1,000 แถว/ครั้ง  → orders มี 15,801+ แถว ต้อง paginate
 *   2. ออเดอร์เทส parallel (source='parallel_test')
 *   3. ออเดอร์เทสของทีม (created_by='[TEST-P] Claude' / ชื่อลูกค้าเป็น Nut/Test)
 *   4. ใบ "แยกวันส่ง" ยอด 0 = รอบส่งเพิ่ม ไม่ใช่ออเดอร์ (ต.ค.2025 = 39% ของใบทั้งหมด)
 *   5. HT- (LIFF) กับ HS- (Hato Store สาขากรุงธนบุรี) เป็นคนละช่อง ห้ามรวมเป็นตัวเดียว
 *
 * ⚠️ ณ 27 ก.ค. 2026 ยังไม่ยุติ: HS- ปี 2026 ขาด 6 เดือน (ต้นทางออกรายงานมาว่าง)
 *    และ HS- ซ้ำกับ HT- ~26% → ยังห้ามประกาศ store-total / %ยอดตก
 *    รอ (1) migrate ดึง HS- 2026 ครบ (2) cross-check กับ statement ธนาคาร
 *
 * ใช้:  node scripts/finance/orders.mjs 2026-02 2026-07
 */

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

/** ชื่อลูกค้าที่เป็นออเดอร์เทส (เจอจริงในระบบ 27 ก.ค. — เติมได้ถ้าเจอเพิ่ม) */
const TEST_NAMES = ['nut', 'test user', 'ทดลอบ 1', 'ploy ♡', 'schematest'];

/** ดึงทุกแถว ไม่ติดเพดาน 1,000 ของ PostgREST */
export async function fetchAll(path) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${SB}/${path}&limit=1000&offset=${offset}`, { headers: H });
    const rows = await res.json();
    if (!Array.isArray(rows)) throw new Error('Supabase: ' + JSON.stringify(rows));
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

/** ออเดอร์เทส — ต้องตัดออกก่อนคำนวณทุกครั้ง */
export function isTestOrder(o) {
  if (o.source === 'parallel_test') return true;
  if (o.created_by === '[TEST-P] Claude') return true;
  if ((o.notes || '').startsWith('[PARALLEL]')) return true;
  return TEST_NAMES.includes((o.customer_name || '').trim().toLowerCase());
}

/** ช่องทาง: liff = HT- (LIFF ลูกค้าสั่งเอง) · store = HS- (สาขากรุงธนบุรี) · own = U- (ระบบ 360) */
export function channelOf(o) {
  const n = o.order_number || '';
  if (n.startsWith('HT-')) return 'liff';
  if (n.startsWith('HS-')) return 'store';
  if (n.startsWith('U-')) return 'own';
  return 'other';
}

/**
 * ใบที่ไม่ใช่ "การขาย" — ยอด 0 ที่เป็นรอบส่งเพิ่ม/เครดิตลูกค้า
 * ยอด 0 มี 3 แบบ (ดู finance/HANDOFF.md): แยกวันส่ง · prepaid ทยอยส่ง · อาหารพนักงาน
 * ทั้ง 3 แบบ "ไม่ใช่ยอดขายของเดือนนั้น" → ตัดออกจากทั้งยอดเงินและ order count
 */
export const isSale = (o) => Number(o.total) > 0;

/** โหลดออเดอร์ในช่วง แล้วกรองของปนออกให้เรียบร้อย */
export async function loadOrders(fromISO, toISO) {
  const sel = 'select=order_number,total,created_at,source,created_by,customer_name,notes,status';
  const raw = await fetchAll(
    `orders?${sel}&created_at=gte.${fromISO}&created_at=lt.${toISO}&order=created_at.asc`
  );
  const tests = raw.filter(isTestOrder);
  const clean = raw.filter((o) => !isTestOrder(o));
  return { raw, clean, tests, sales: clean.filter(isSale) };
}

const monthKey = (o) => o.created_at.slice(0, 7);
const baht = (n) => Math.round(n).toLocaleString('en-US');
const sum = (rows) => rows.reduce((a, b) => a + (Number(b.total) || 0), 0);

async function main() {
  const [from = '2026-02', to = '2026-07'] = process.argv.slice(2);
  const end = new Date(to + '-01T00:00:00Z');
  end.setUTCMonth(end.getUTCMonth() + 1);
  const { raw, clean, tests, sales } = await loadOrders(from + '-01', end.toISOString().slice(0, 10));

  console.log(`\nช่วง ${from} → ${to}  (ดึงมา ${raw.length} แถว)`);
  console.log(`ตัดออเดอร์เทสออก ${tests.length} ใบ (฿${baht(sum(tests))})`);
  console.log(`ตัดใบยอด 0 ออก ${clean.length - sales.length} ใบ  ← แยกวันส่ง / prepaid / อาหารพนักงาน\n`);

  const months = [...new Set(sales.map(monthKey))].sort();
  console.log('เดือน   |   LIFF (HT-) ใบ |     ยอด | Store (HS-) ใบ |     ยอด');
  console.log('--------|----------------:|--------:|---------------:|--------:');
  for (const m of months) {
    const inM = sales.filter((o) => monthKey(o) === m);
    const l = inM.filter((o) => channelOf(o) === 'liff');
    const s = inM.filter((o) => channelOf(o) === 'store');
    console.log(
      `${m} | ${String(l.length).padStart(15)} | ${baht(sum(l)).padStart(7)} | ` +
        `${String(s.length).padStart(14)} | ${baht(sum(s)).padStart(7)}`
    );
  }

  console.log(
    '\n⚠️  ห้ามบวก 2 คอลัมน์เป็น "ยอดร้าน" — HS- ซ้ำกับ HT- ~26% และปี 2026 ขาดข้อมูล 6 เดือน'
  );
  console.log('    ดูเหตุผลเต็มใน finance/HANDOFF.md ก่อนใช้ตัวเลขนี้ตัดสินใจ');
}

import { pathToFileURL } from 'node:url';
if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();

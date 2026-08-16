/**
 * f-track — ใบเช็คยอดประจำวัน (นัทสั่งเอง 10 ส.ค. 2026)
 *
 *   "ทำรายการเช็คยอดประจำวันให้หน่อย แล้วลิสต์มาทุกครั้งเพื่อทวงให้แอดมินเช็คก่อนเบื้องต้น"
 *
 * ทำไมต้องมี: ระบบเรารับออเดอร์จริงตั้งแต่ 8 ส.ค. แต่ **ยอดค้างจ่ายโตเร็วกว่ายอดขาย**
 * (9 ส.ค. 3 ใบ ฿3,971 → 10 ส.ค. 12 ใบ ฿18,799) = "รับออเดอร์" ได้แล้ว แต่ "เก็บเงิน" ยังไม่มีใครถือ
 *
 * ⚠️ ใบนี้ = ของจริงของลูกค้าจริง — ตัวเลขผิด = แอดมินไปทวงคนที่จ่ายแล้ว = เสียลูกค้า
 * ⛔ f มีหน้าที่ "ออกใบ" ไม่ใช่ "ไปทวง" — ห้ามทักลูกค้าเอง ห้ามแก้ payment_status เอง
 *
 * ใช้:  node scripts/finance/daily_cash.mjs            (วันนี้)
 *       node scripts/finance/daily_cash.mjs 2026-08-10 (ย้อนวัน)
 */

import { fetchAll, isTestOrder } from './orders.mjs';

const TZ = 'Asia/Bangkok'; // นัทอาจอยู่คนละ timezone — ยึดเวลาไทยเสมอ
const baht = (n) => '฿' + Math.round(n).toLocaleString('en-US');
const sum = (rows) => rows.reduce((a, b) => a + (Number(b.total) || 0), 0);

/** วันที่แบบ YYYY-MM-DD ตามเวลาไทย (ห้ามใช้ toISOString ตรงๆ — จะเพี้ยนข้ามวัน) */
const thaiDate = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, dateStyle: 'short' }).format(d);

const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

/** ออเดอร์ที่ "นับเป็นการขายจริง" — ตัดของปนทุกชนิดออก */
function isRealSale(o) {
  if (isTestOrder(o)) return false;
  if (o.status === 'cancelled') return false;
  if ((o.created_by || '').includes('[TEST-')) return false;
  return Number(o.total) > 0; // ใบ ฿0 = รอบส่งเพิ่มของคอร์ส ไม่ใช่การขาย และไม่ใช่ยอดค้างจ่าย
}

async function main() {
  const today = process.argv[2] || thaiDate();
  const yest = addDays(today, -1);
  const monthStart = today.slice(0, 7) + '-01';

  const rows = await fetchAll(
    'orders?select=order_number,customer_name,customer_phone,total,delivery_fee,delivery_lat,' +
      'created_at,delivery_date,payment_status,status,slip_url,source,created_by,notes&' +
      `created_at=gte.${monthStart}&order=created_at.asc`
  );
  const sales = rows.filter(isRealSale);
  const day = (o) => (o.created_at || '').slice(0, 10);
  const chan = (o) => ((o.order_number || '').startsWith('HT-') ? 'Hato' : 'ระบบเรา');

  const bucket = (list) => {
    const own = list.filter((o) => chan(o) === 'ระบบเรา');
    const hato = list.filter((o) => chan(o) === 'Hato');
    return { n: list.length, total: sum(list), own: sum(own), hato: sum(hato), nHato: hato.length };
  };
  const t = bucket(sales.filter((o) => day(o) === today));
  const y = bucket(sales.filter((o) => day(o) === yest));
  const m = bucket(sales);

  // ── ② ค้างจ่าย รายใบ ────────────────────────────────────────────────
  const unpaid = sales
    .filter((o) => o.payment_status === 'unpaid')
    .map((o) => ({ ...o, age: daysBetween(day(o), today) }))
    .sort((a, b) => b.age - a.age);
  const due = unpaid.filter((o) => o.delivery_date && o.delivery_date <= today);

  // ── ③ สลิปรอตรวจ (ต้องมีรูปจริง) ────────────────────────────────────
  // ⚠️ ห้ามนับ pending_review เปล่าๆ — ใบรอบ 2-3 ของคอร์สรับสถานะต่อจากใบแม่โดยไม่มีสลิป
  const slips = sales.filter((o) => o.payment_status === 'pending_review' && o.slip_url);
  const slipNoFile = sales.filter((o) => o.payment_status === 'pending_review' && !o.slip_url);

  // ── ④ ค่าส่ง ฿0 ทั้งที่ควรมี (ลูกค้าไม่ปักหมุด → รายได้หายเงียบ) ──────
  const noFee = sales.filter(
    (o) => day(o) === today && !Number(o.delivery_fee) && !o.delivery_lat
  );

  // ── ⑤ สรุปบรรทัดเดียว ───────────────────────────────────────────────
  console.log(`\n${'═'.repeat(78)}`);
  console.log(
    `📋 ใบเช็คยอด ${today} · ขายวันนี้ ${baht(t.total)} (${t.n} ใบ) · ` +
      `🔴 ค้างจ่าย ${unpaid.length} ใบ ${baht(sum(unpaid))}` +
      (unpaid.length ? ` (เก่าสุด ${unpaid[0].age} วัน)` : '') +
      ` · 🧾 สลิปรอตรวจ ${slips.length}`
  );
  console.log('═'.repeat(78));

  console.log('\n① ยอดขาย');
  const line = (lbl, b) =>
    console.log(
      `   ${lbl.padEnd(14)} ${baht(b.total).padStart(10)}  (${String(b.n).padStart(3)} ใบ)` +
        (b.nHato ? `  — ระบบเรา ${baht(b.own)} · Hato ${baht(b.hato)}` : '')
    );
  line('วันนี้', t);
  line('เมื่อวาน', y);
  line('สะสมเดือนนี้', m);

  console.log(`\n② 🔴 ค้างจ่าย — ${unpaid.length} ใบ ${baht(sum(unpaid))}`);
  if (!unpaid.length) console.log('   ✅ ไม่มี');
  else {
    console.log(`   🚨 ในนั้น ${due.length} ใบ ${baht(sum(due))} = วันส่งถึงแล้วแต่ยังไม่จ่าย (ครัวทำไปแล้ว)\n`);
    console.log('   ก๊อปบรรทัดล่างส่งแอดมินทวงได้เลย:');
    for (const o of unpaid) {
      const flag = o.delivery_date && o.delivery_date <= today ? '🚨' : '  ';
      console.log(
        `   ${flag} ${o.order_number}  ${String(o.customer_name || '-').slice(0, 18).padEnd(18)} ` +
          `${(o.customer_phone || '-').padEnd(11)} ${baht(o.total).padStart(8)}  ` +
          `สั่ง ${day(o)} · ส่ง ${o.delivery_date || '-'} · ค้าง ${o.age} วัน`
      );
    }
  }

  // ── ②b ก่อนทวง: กันทวงคนที่จ่ายแล้ว ────────────────────────────────
  // ⚠️ ลูกค้าบางคน "สแกนจ่ายแล้วแต่ไม่มีที่แนบสลิป" (นัทแจ้ง 15 ส.ค.) → ขึ้นค้างจ่ายทั้งที่จ่ายแล้ว
  //    ใบพวกนี้แยกจากใบที่ไม่จ่ายจริง **ไม่ได้จากในระบบ** ต้องเช็คเงินเข้าจริงก่อนทัก
  const unpaidWithSlip = unpaid.filter((o) => o.slip_url);
  if (unpaidWithSlip.length) {
    console.log(`\n   🛑 ห้ามทวง ${unpaidWithSlip.length} ใบนี้ — มีสลิปแนบแล้วแต่สถานะยังไม่อัปเดต:`);
    for (const o of unpaidWithSlip)
      console.log(`      ${o.order_number}  ${o.customer_name || '-'}  ${baht(o.total)}`);
  } else if (unpaid.length) {
    console.log(
      '\n   ✅ ไม่มีใบไหนแนบสลิปมาแล้วแต่ยังขึ้นค้างจ่าย (ตรวจแล้ว = ปลอดภัยที่จะทัก)\n' +
        '   ⚠️ แต่ยังต้องเช็คเงินเข้าจริงก่อนทักอยู่ดี — ระบบยังไม่มีที่ให้ลูกค้าแนบสลิป\n' +
        '      "ไม่มีสลิป" จึงไม่ได้แปลว่า "ไม่ได้จ่าย"'
    );
  }

  console.log(`\n③ 🧾 สลิปรอตรวจ (มีรูปจริง) — ${slips.length} ใบ`);
  for (const o of slips)
    console.log(`      ${o.order_number}  ${o.customer_name || '-'}  ${baht(o.total)}`);
  if (slipNoFile.length)
    console.log(
      `   ⚠️ อีก ${slipNoFile.length} ใบขึ้น "รอตรวจสลิป" แต่ไม่มีไฟล์สลิป = ป้ายโกหก (บั๊กที่ u กำลังแก้) — ไม่นับรวม`
    );

  console.log(`\n④ ⚠️ ค่าส่ง ฿0 ทั้งที่น่าจะต้องมี (ไม่ปักหมุด) — วันนี้ ${noFee.length} ใบ`);
  for (const o of noFee)
    console.log(`      ${o.order_number}  ${o.customer_name || '-'}  ยอด ${baht(o.total)}`);
  if (!noFee.length) console.log('      ✅ ไม่มี');

  console.log(
    '\n' +
      '─'.repeat(78) +
      '\nกรองออกแล้ว: ออเดอร์เทส · ยกเลิก · ใบยอด ฿0 (รอบส่งเพิ่มของคอร์ส ไม่ใช่ค้างจ่าย)' +
      '\n⛔ f ออกใบเท่านั้น — คนทวงจริง = แอดมิน/นัท · ห้ามแก้ payment_status จากใบนี้\n'
  );
}

await main();

/**
 * f-track — งบกำไร-ขาดทุนเท่าที่ข้อมูลไปถึง (ก.พ.–ส.ค. 2026)
 *
 * ⚠️ นี่ไม่ใช่งบการเงิน — เป็น "เท่าที่หลักฐานมี" · ช่องที่ยังไม่รู้ประกาศไว้ชัดเจน
 * ⛔ ตัวเลขทุกตัวต้องผ่านคนทำบัญชีก่อนใช้จริง (กฎ CLAUDE.md หมวดบัญชี&ภาษี)
 *
 * แหล่งข้อมูล:
 *   รายได้   = orders (ตัดเทส/ยกเลิก/ใบยอด 0/loyalty log แล้ว)
 *   วัตถุดิบ + ค่าส่ง = statement บัตร UOB + กสิกร (ของจริง ไม่ใช่ประมาณ)
 *   ค่าแรง   = ชีทเงินเดือน (ยังไม่ cross-check กับบัญชีธนาคาร)
 */
import { fetchAll, isTestOrder, isSale } from './orders.mjs';
import fs from 'node:fs';

const b = (n) => Math.round(n).toLocaleString('en-US');
const FROM = '2026-02-01', TO = '2026-09-01', MONTHS = 7;

// ── รายได้ ─────────────────────────────────────────────────────────
const raw = await fetchAll(
  'orders?select=order_number,total,created_at,source,created_by,customer_name,customer_phone,notes,status&' +
    `created_at=gte.${FROM}&created_at=lt.${TO}`
);
// ⚠️ isSale ไม่ได้ตัดใบยกเลิก — ต้องตัดเองตรงนี้ (เคยพลาดมาแล้ว ยอดเกินจริง 2.9%)
const sales = raw.filter((o) => !isTestOrder(o) && isSale(o) && o.status !== 'cancelled');
const revenue = sales.reduce((a, o) => a + +o.total, 0);

// ── ต้นทุนจาก statement บัตร (ของจริง) ─────────────────────────────
const read = (f) => fs.readFileSync(f, 'utf8').replace(/^﻿/, '').split('\n').slice(1).filter(Boolean);
let food = 0, ship = 0, interest = 0;
const tally = (d, desc, amt) => {
  if (d < '2026-02' || d >= '2026-09') return;
  if (/freshket|wholesale|makro/i.test(desc)) food += amt;
  else if (/lalamove/i.test(desc)) ship += amt;
  else if (/interest/i.test(desc)) interest += amt;
};
for (const l of read('finance/out/uob_transactions.csv')) {
  const m = l.match(/^([\d-]+),"(.*)",([\d.]+),(\w+),/);
  if (m && m[4] === 'out') tally(m[1].slice(0, 7), m[2], +m[3]);
}
for (const l of read('finance/out/kbank_transactions.csv')) {
  const m = l.match(/^([\d-]+),"(.*)",(-?[\d.]+),/);
  if (m && +m[3] > 0) tally(m[1].slice(0, 7), m[2], +m[3]);
}

// ── ค่าใช้จ่ายคงที่ที่ยืนยันแล้ว (ต่อเดือน) ────────────────────────
const FIXED = { 'ค่าแรงพนักงาน': 114000, 'Hato Hub': 5000, 'LINE OA': 1370, FlowAccount: 250 };
const fixedTotal = Object.values(FIXED).reduce((a, x) => a + x, 0) * MONTHS;

const known = food + ship + interest + fixedTotal;
const left = revenue - known;

console.log(`\n📊 เท่าที่หลักฐานไปถึง · ก.พ.–ส.ค. 2026 (${MONTHS} เดือน)\n`);
const line = (k, v, note = '') => console.log(`  ${k.padEnd(26)} ${b(v).padStart(11)}  ${b(v / MONTHS).padStart(9)}/ด.  ${note}`);
console.log('  รายการ                          รวม 7 ด.     ต่อเดือน');
console.log('  ' + '-'.repeat(66));
line('รายได้', revenue, '✅ orders จริง');
console.log('  ' + '-'.repeat(66));
line('− วัตถุดิบ', -food, '✅ statement บัตร');
line('− ค่าขนส่ง (Lalamove)', -ship, '✅ statement บัตร');
line('− ค่าแรงพนักงาน', -FIXED['ค่าแรงพนักงาน'] * MONTHS, '⚠️ ชีทเงินเดือน ยังไม่ตรวจกับแบงก์');
line('− Hato + LINE OA + FlowAccount', -(FIXED['Hato Hub'] + FIXED['LINE OA'] + FIXED.FlowAccount) * MONTHS, '✅');
line('− ดอกเบี้ยบัตรเครดิต', -interest, '✅ statement บัตร');
console.log('  ' + '-'.repeat(66));
line('= เหลือ', left);
console.log(`\n  คิดเป็น ${(left / revenue * 100).toFixed(1)}% ของรายได้\n`);

console.log('🔴 ยังไม่ได้หัก — ทำให้ตัวเลข "เหลือ" ข้างบนสูงกว่าความจริง:');
for (const x of [
  'ค่าน้ำ · ค่าไฟ · ค่าแก๊ส  — ไม่มีข้อมูลเลย (อยู่ในบัญชีธนาคาร ซึ่งชื่อคู่ค้าไม่ extract ออกมา)',
  'กล่อง · ฝา · ถุง · ช้อนส้อม · สติกเกอร์ — ไม่เคยถูกนับที่ไหนเลย',
  'ค่าธรรมเนียมรับเงิน — ถ้า PromptPay วิ่งผ่าน Omise (1%+VAT) ≈ ฿2,200/ด. · ถ้าเข้าบัญชีตรง = ฿0',
  'ภาษีที่ดินฯ · ประกัน · ซ่อมบำรุง — รายปี มักหลุดจากงบรายเดือน',
  'ภาษีนิติบุคคล',
  'ของเสียหายระหว่างส่ง (ฟรีซแพ็คละลาย) — เริ่มนับ 16 ส.ค. ยังไม่มีตัวเลข',
]) console.log('   · ' + x);
console.log('\n⛔ ตัวเลขทั้งหมดต้องผ่านคนทำบัญชีก่อนใช้จริง\n');

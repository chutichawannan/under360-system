/**
 * f-track — สารบัญชื่อวัตถุดิบ (ingredient catalog)
 *
 * เป้าหมายที่นัทตั้งไว้ 16 ก.ย. 2026:
 *   "ทำสารบัญชื่อวัตถุดิบ ในกรณีที่พอมี buyer แล้วจะเสิชหาสินค้าจะได้กดถูกชื่อในเว็บที่ต่างกัน"
 *   "ราคาไม่ต้องรีบแมช ตั้งตุ๊กตาไว้ก่อนพอ เพราะจะทำเป็นตัวเช็คราคาในอนาคต แต่ต้องมี database ชื่อสินค้าก่อน"
 *
 * โครงสร้าง: 1 ชื่อที่เราใช้ → หลายชื่อร้าน มี **ลำดับความสำคัญ**
 *   ลำดับ 1 = ตัวหลัก (หาตัวนี้ก่อนเสมอ) · ลำดับ 2+ = ตัวรอง (ของเดียวกันคนละขนาด ใช้เมื่อตัวหลักไม่มี)
 *
 * ⚠️ ราคาในไฟล์นี้ = "ราคาตุ๊กตา" ไว้อ้างอิงเฉยๆ ไม่ใช่ราคาปัจจุบัน
 *    ตัวเช็คราคาจริงค่อยทำทีหลัง — ตอนนี้เป้าคือ **ชื่อให้ถูก**
 *
 * ทุกคู่ต้องมี `ยืนยันโดย` — ห้ามให้ AI เดาแล้วบันทึกเป็นของจริง (นัทยืนยันทีละ 10 ชื่อ)
 */
import fs from 'node:fs';

export const FILE = 'docs/INGREDIENT_CATALOG.json';

export const load = () => fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : { _note: 'สารบัญชื่อวัตถุดิบ · นัทยืนยันทีละชื่อ · ราคาเป็นตุ๊กตาอ้างอิง', items: {} };
export const save = (c) => fs.writeFileSync(FILE, JSON.stringify(c, null, 1), 'utf8');

/** ตัดสระ/วรรณยุกต์ออกก่อนเทียบ — ไฟล์ PDF ของ Freshket สระหายบ่อย (ปลาทูนึง / น้าเกลือ) */
export const key = (s) => String(s || '')
  .replace(/ตรา\S*|\(.*?\)/g, '')
  .replace(/[\d.,]+\s*(?:กก\.|กรัม|ก\.|ลิตร|ล\.|มล\.|ฟอง|ชิ้น|ชิน|ตัว|แพ็ค|ถุง|ลูก|กล่อง|ขวด|ก้อน|x)\S*/g, '')
  .replace(/[ัิ-ฺ็-๎ำ]/g, '')  // สระบน/ล่าง + วรรณยุกต์ + ำ
  .replace(/[^฀-๿a-zA-Z]/g, '')
  .trim();

export function similar(a, b) {
  const x = key(a), y = key(b);
  if (!x || !y) return 0;
  if (x === y) return 100;
  if (y.includes(x)) return 92 - Math.min(20, y.length - x.length);
  if (x.includes(y)) return 88 - Math.min(20, x.length - y.length);
  let hit = 0;
  for (let i = 0; i < x.length - 1; i++) if (y.includes(x.substr(i, 2))) hit++;
  return Math.round(hit / Math.max(1, x.length - 1) * 70);
}

export const splitCsv = (l) => {
  const c = []; let cur = '', q = false;
  for (const ch of l) { if (ch === '"') { q = !q; continue } if (ch === ',' && !q) { c.push(cur); cur = ''; continue } cur += ch }
  c.push(cur); return c;
};
export const readCsv = (f) => fs.readFileSync(f, 'utf8').replace(/^﻿/, '').trim().split('\n').slice(1).map(splitCsv);

export const FK = () => readCsv('finance/out/freshket_items_summary.csv')
  .map((c) => ({ id: c[0], n: c[1], pack: c[2] || c[3], cnt: +c[4], p: +c[6] }));
export const GO = () => readCsv('finance/out/go_items_summary.csv')
  .map((c) => ({ id: c[0], n: c[1], pack: c[2], cnt: +c[3], p: +c[5] }));

/** เขียน CSV ให้คนอ่าน/ให้ buyer ใช้ค้นหา */
export function exportCsv(cat) {
  const H = ['ชื่อที่เราใช้', 'หมวด', 'หน่วยนับ', 'ร้าน', 'ลำดับ', 'รหัสสินค้า', 'ชื่อในเว็บร้าน', 'ขนาดบรรจุ', 'ราคาตุ๊กตา', 'ยืนยันโดย'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [];
  for (const [name, it] of Object.entries(cat.items)) {
    for (const shop of ['freshket', 'go']) {
      for (const p of (it.ร้าน?.[shop] || [])) {
        rows.push([name, it.หมวด || '', it.หน่วยนับ || '', shop === 'go' ? 'GO' : 'Freshket',
          p.ลำดับ, p.รหัส || '', p.ชื่อ, p.ขนาด || '', p.ราคาตุ๊กตา ?? '', it.ยืนยันโดย || ''].map(esc).join(','));
      }
    }
  }
  fs.writeFileSync('docs/INGREDIENT_CATALOG.csv', '﻿' + [H.map(esc).join(',')].concat(rows).join('\n'), 'utf8');
  return rows.length;
}

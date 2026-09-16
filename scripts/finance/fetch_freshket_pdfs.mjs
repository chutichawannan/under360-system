/**
 * f-track — ดึงไฟล์ PDF ใบสั่งซื้อ Freshket ที่เบราว์เซอร์ push ขึ้น Supabase มาลงเครื่อง
 *
 * ทำไมต้องผ่าน Supabase: ลิงก์ PDF ของ Freshket มี token ผูกกับเซสชัน
 * เรียกจากเครื่องนี้ตรงๆ ไม่ได้ → ให้เบราว์เซอร์ที่ล็อกอินอยู่ fetch แล้วเก็บ base64 ไว้ใน
 * `kitchen_data` คีย์ `f_fkpdf_<เลขที่บิล>` แล้วสคริปต์นี้ดึงลงมาเขียนเป็นไฟล์
 */
import { fetchAll } from './orders.mjs';
import fs from 'node:fs';

const OUT = 'finance/raw/freshket_orders';
fs.mkdirSync(OUT, { recursive: true });

const rows = await fetchAll('kitchen_data?select=key,data&key=like.f_fkpdf_*');
let n = 0, bad = 0;
for (const r of rows) {
  const d = r.data;
  if (!d || !d.b64) { bad++; continue }
  const buf = Buffer.from(d.b64, 'base64');
  if (buf.slice(0, 4).toString() !== '%PDF') { bad++; continue }
  fs.writeFileSync(`${OUT}/${d.po}.pdf`, buf);
  n++;
}
console.log(`✅ เขียนไฟล์ ${n} ใบ · เสีย ${bad} · ที่ ${OUT}`);

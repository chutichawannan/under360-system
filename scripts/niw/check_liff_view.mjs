/**
 * 👁️ ตรวจ "หน้าลูกค้าจริง" ด้วยตัวเอง — ไม่ต้องรอใครส่งภาพหน้าจอ
 * เขียนหลัง 19 ก.ย. 2569: เปิดขายครบ 13/13 ใน DB แต่ลูกค้าเห็นแค่ 1 ตัว (หมวดผิด) และไม่มีใครจับได้
 *
 * วิธีทำงาน: โหลด liff_customer.html ตัวจริงจากเว็บ → ทำ "สำเนาในเครื่อง" ที่เปิด DEV_MODE (ข้ามล็อกอิน LINE)
 *            → ให้ Chrome เรนเดอร์จริง อ่านการ์ดเมนูที่ขึ้นจริงทั้งแท็บข้าวกล่องและแท็บแพคกับข้าว
 * ⚠️ แก้เฉพาะสำเนาในโฟลเดอร์ชั่วคราว — ไม่แตะไฟล์จริงบนเว็บเด็ดขาด
 *
 * รัน: node scripts/niw/check_liff_view.mjs 2026-09-21
 * exit 0 = ลูกค้าเห็นครบ · 1 = ไม่ครบ/ตรวจไม่ได้ (ถือว่าไม่ผ่าน ห้ามบอกว่าเสร็จ)
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: K, Authorization: 'Bearer ' + K };
const LIFF = 'https://under360-system.vercel.app/liff_customer.html';
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));
const SLOTS = ['S1','S2','S3','S4','S5','S6','S7','S8','D1','D2','D3','D4','D5'];
const W = process.argv[2];

async function main() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(W || '')) { console.log('ใส่วันจันทร์ เช่น 2026-09-21'); return 1; }
  if (!CHROME) { console.log('🔴 หา Chrome ไม่เจอ — ตรวจหน้าลูกค้าไม่ได้ = ยังไม่ผ่าน'); return 1; }

  const plan = ((await (await fetch(SB + '/rest/v1/kitchen_data?select=data&key=eq.weekly_subcode_plan', { headers: H })).json())[0].data)[W];
  if (!plan) { console.log('🔴 ไม่มีแผนช่องของสัปดาห์ ' + W); return 1; }
  const want = SLOTS.map(s => ({ slot: s, code: plan[s] }));

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'liffcheck-'));
  const src = await (await fetch(LIFF + '?v=' + Date.now())).text();
  if (!src.includes('DEV_MODE:      false,')) { console.log('🔴 หาสวิตช์ DEV_MODE ในหน้า LIFF ไม่เจอ (หน้าถูกแก้โครง?) — ตรวจไม่ได้ = ยังไม่ผ่าน'); return 1; }

  const render = (extra, file) => {
    fs.writeFileSync(path.join(dir, file), src.replace('DEV_MODE:      false,', 'DEV_MODE:      true,') + extra);
    return execFileSync(CHROME, ['--headless=new','--disable-gpu','--hide-scrollbars','--window-size=430,3000',
      '--virtual-time-budget=40000','--allow-file-access-from-files','--disable-web-security',
      '--user-data-dir=' + path.join(dir, 'prof'), '--dump-dom', 'file:///' + path.join(dir, file).replace(/\\/g, '/')],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore','pipe','ignore'] });
  };
  const codesIn = dom => [...dom.matchAll(/id="menu-item-([A-Z0-9-]+)"/g)].map(m => m[1]);

  const rice = codesIn(render('', 'rice.html'));                                                   // แท็บข้าวกล่อง (ค่าเริ่มต้น)
  const pack = codesIn(render('\n<script>setTimeout(()=>{try{jumpCat("pack_regular")}catch(e){}},9000);<\/script>', 'pack.html'));

  const seen = new Set([...rice, ...pack]);
  const miss = want.filter(x => !seen.has(x.code));
  const names = Object.fromEntries((await (await fetch(SB + '/rest/v1/menu_items?select=code,name&code=in.(' + want.map(x => x.code).join(',') + ')', { headers: H })).json()).map(m => [m.code, m.name]));

  console.log('หน้าลูกค้าจริง (สำเนา DEV_MODE) สัปดาห์ ' + W);
  console.log('  แท็บข้าวกล่อง เห็น ' + rice.length + ' การ์ด · แท็บแพคกับข้าว เห็น ' + pack.length + ' การ์ด');
  want.forEach(x => console.log('  ' + x.slot.padEnd(3) + x.code.padEnd(7) + (seen.has(x.code) ? '✅ ลูกค้าเห็น' : '🔴 ไม่ขึ้นหน้าลูกค้า') + '  ' + (names[x.code] || '')));
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}

  if (miss.length) { console.log('\n🔴 ลูกค้าไม่เห็น ' + miss.length + ' ตัว — ยังไม่ผ่าน ห้ามรายงานว่าเสร็จ'); return 1; }
  console.log('\n✅ ลูกค้าเห็นครบ 13/13 (ตรวจจากหน้าจริง ไม่ใช่จาก DB)');
  return 0;
}
main().then(c => { process.exitCode = c; }).catch(e => { console.error('🔴 ตรวจไม่สำเร็จ (นับว่าไม่ผ่าน):', e && e.message || e); process.exitCode = 1; });

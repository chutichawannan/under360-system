// ═══════════════════════════════════════════════════════════════
// 11 ส.ค. 2026 — ① ปิดเมนูสัปดาห์เก่าที่ไม่มีของแล้ว  ② ลงสต็อกตามที่ครัวนับเมื่อคืน
// ═══════════════════════════════════════════════════════════════
// ปัญหาที่เจอ: แอดมินกด "ปิดออนไลน์" ในหน้า DB แล้ว แต่ค่าไปอยู่แค่ใน kitchen_data.recipes
//              ไม่เคยถูกส่งต่อไป menu_items.is_available → หน้าลูกค้าเลยยังโชว์อยู่
// เกณฑ์ปิด: อยู่ในสัปดาห์เก่า (menu_special_weeks < 2026-08-10) และ "ครัวไม่ได้นับเมื่อคืน"
//           → ถ้าครัวยังนับอยู่ = ยังมีของจริง ห้ามปิด (เช่น XS3/XS8/XXS ของค้าง · A18 อยู่ในชุด A ประจำ)
// รัน:  node scripts/cc_stock_offline_0811.mjs            (ดูอย่างเดียว)
//       node scripts/cc_stock_offline_0811.mjs --apply    (เขียนจริง · สำรองก่อนเสมอ)
import fs from 'node:fs';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const APPLY = process.argv.includes('--apply');
const get = async (q) => (await fetch(B + q, { headers: H })).json();
const WEEK_NOW = '2026-08-10';

// ── ยอดที่ครัวนับเมื่อคืน 10 ส.ค. (กลุ่ม Under Crew) ──
const NO = { No1:2, No2:11, No3:14, No4:7, No5:4, No6:21, No7:11, No8:15, No9:15,
             No10:20, No11:3, No12:7, No13:15, No14:7, No15:0 };                       // อู 17:31
const A  = { A1:31, A2:14, A3:36, A4:13, A5:13, A6:21, A7:6, A8:37, A9:24, A10:4,
             A11:1, A12:19, A13:13, A14:17, A15:6, A16:19, A17:14, A18:7, A19:16, A20:11 }; // Wolin 17:55
const SUB_D = { D1:3, D2:3, D3:8, D4:5, D5:4 };                                        // Wolin 18:03
const SUB_S = { S1:1, S2:7, S3:8, S4:8, S5:9, S6:7, S7:6, S8:4 };                      // โม๋ข่อง 18:15
const X  = { S021:3, S205:2, S105:2 };            // XS3 กุ้งอบวุ้นเส้น · XS8 กิมจิ · XXS แซลมอนย่างเกลือ

const all  = await get('menu_items?select=id,code,subcode,name,is_available,stock_total&limit=1000');
const wkRow = await get('kitchen_data?select=data&key=eq.menu_special_weeks');
const WEEK = (wkRow[0] && wkRow[0].data) || {};
const byCode = new Map(all.map(m => [String(m.code).toLowerCase(), m]));
const bySub  = (s) => all.filter(m => String(m.subcode || '').toLowerCase() === s.toLowerCase());

// ── ① สต็อก ──
const stock = [], missS = [];
const push = (m, q, src) => { if (m) stock.push({ id:m.id, code:m.code, name:m.name, qty:q, was:(m.stock_total===null?'∞':m.stock_total), src }); };
for (const [c,q] of Object.entries({ ...NO, ...A, ...X })) {
  const m = byCode.get(c.toLowerCase()); m ? push(m,q,c) : missS.push(c);
}
for (const [s,q] of Object.entries({ ...SUB_D, ...SUB_S })) {
  const l = bySub(s); l.length===1 ? push(l[0],q,'ชื่อเล่น '+s) : missS.push(s+(l.length?' (ซ้ำ '+l.length+')':' (ไม่มี)'));
}

// ── ② ตัวที่ต้องปิด ──
const keep = new Set(stock.map(x => String(x.code).toLowerCase()));   // ครัวนับ = ยังมีของ ห้ามปิด
const off = all.filter(m => {
  if (!m.is_available) return false;                       // ปิดอยู่แล้ว
  const w = WEEK[m.code];
  if (!w || w >= WEEK_NOW) return false;                   // ไม่ใช่เมนูสัปดาห์ / เป็นของสัปดาห์นี้
  return !keep.has(String(m.code).toLowerCase());          // ครัวไม่ได้นับ = ไม่มีของแล้ว
});

console.log('\n══ ① ลงสต็อกตามที่ครัวนับเมื่อคืน (' + stock.length + ' เมนู) ══');
console.log('โค้ด   เมนู                            เดิม  →  ใหม่');
stock.forEach(p => console.log('  ' + String(p.code).padEnd(6) + String(p.name).slice(0,28).padEnd(30) +
  String(p.was).padStart(5) + '  →  ' + String(p.qty).padStart(4) + '   ' + p.src));
if (missS.length) console.log('  ⏭ ข้าม: ' + missS.join(' · '));

console.log('\n══ ② ปิดเมนูสัปดาห์เก่าที่ครัวไม่ได้นับ (' + off.length + ' เมนู) ══');
off.sort((a,b)=>String(WEEK[a.code]).localeCompare(String(WEEK[b.code])))
   .forEach(m => console.log('  ' + String(m.code).padEnd(6) + String(m.name).slice(0,34).padEnd(36) + 'สัปดาห์ ' + WEEK[m.code]));

console.log('\n── ยังเปิดต่อ (ครัวนับแล้วว่ามีของ) ──');
['S021','S205','S105','A18'].forEach(c=>{const m=byCode.get(c.toLowerCase());
  if(m) console.log('  ' + c.padEnd(6) + String(m.name).slice(0,32).padEnd(34) + 'สัปดาห์ ' + (WEEK[c]||'-'));});

if (!APPLY) { console.log('\n(ยังไม่เขียนอะไร — เติม --apply ถ้าจะลงจริง)'); process.exit(0); }

fs.mkdirSync('download', { recursive: true });
fs.writeFileSync('download/menu_backup_2026-08-11.json', JSON.stringify({
  stock: stock.map(p=>({code:p.code, stock_total_เดิม:p.was})),
  offline: off.map(m=>({code:m.code, is_available_เดิม:true}))
}, null, 1));
console.log('\n💾 สำรองค่าเดิม → download/menu_backup_2026-08-11.json');

let a=0,b=0;
for (const p of stock) {
  const r = await fetch(B+'menu_items?id=eq.'+p.id, { method:'PATCH', headers:H,
    body: JSON.stringify({ stock_total:p.qty, actual_stock:p.qty }) });
  r.ok ? a++ : console.log('  ❌ สต็อก '+p.code+' '+r.status);
}
for (const m of off) {
  const r = await fetch(B+'menu_items?id=eq.'+m.id, { method:'PATCH', headers:H,
    body: JSON.stringify({ is_available:false }) });
  r.ok ? b++ : console.log('  ❌ ปิด '+m.code+' '+r.status);
}
const after = await get('menu_items?select=code&is_available=eq.true&limit=1000');
console.log(`\n✅ ลงสต็อก ${a} เมนู · ปิด ${b} เมนู · ตอนนี้เปิดขายอยู่ ${after.length} เมนู`);

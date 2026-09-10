/**
 * 🔁 ตัวจับสต็อกเมนูสารทจีน — หมดเมื่อไหร่เติมทันทีทีละ 5
 * นัทสั่งเอง 23 ส.ค. 2026: "ตั้งตัวจับเลย ถ้าของหมดให้เติมทันที แล้วก็พิมพ์แจ้งมาที่ฉัน ไม่ลงบอร์ด เติมทีละ 5"
 *
 * เงื่อนไขที่ต้องครบถึงจะเติม (กันไปเติมของสัปดาห์อื่น):
 *   1. อยู่ในเซ็ตสารทจีน 13 ตัว
 *   2. ธงสัปดาห์ = 2026-08-24 (ถ้าธงเปลี่ยน = จบสัปดาห์แล้ว หยุดเติมเอง)
 *   3. เปิดขายอยู่
 *   4. stock_total = 0  (หมดจริง ไม่ใช่ null/ไม่จำกัด)
 *   5. วันนี้ยังไม่เกิน 2026-08-30
 *
 * รัน: node scripts/niw/refill_sartchin.mjs            (เติมจริง)
 *      node scripts/niw/refill_sartchin.mjs --dry      (ดูเฉยๆ)
 */
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const DRY = process.argv.includes('--dry');
const WEEK = '2026-08-24';
const LAST_DAY = '2026-08-30';
const ADD = 5;
const SET = ['S099','S159','S149','S071','S104','S133','S183','S051','D099','D159','D149','D071','D104'];

const bkk = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Bangkok'}));
const today = bkk.getFullYear()+'-'+String(bkk.getMonth()+1).padStart(2,'0')+'-'+String(bkk.getDate()).padStart(2,'0');
const stamp = today+' '+String(bkk.getHours()).padStart(2,'0')+':'+String(bkk.getMinutes()).padStart(2,'0');

if (today > LAST_DAY) { console.log('['+stamp+'] เลยสัปดาห์สารทจีนแล้ว — หยุดเติม'); process.exit(0); }

const g = async (u) => (await fetch(SB+u,{headers:{apikey:KEY}})).json();
const weeks = (await g('/rest/v1/kitchen_data?select=data&key=eq.menu_special_weeks'))[0].data || {};
const rows  = await g(`/rest/v1/menu_items?select=code,name,subcode,stock_total,actual_stock,is_available&code=in.(${SET.join(',')})`);

const need = rows.filter(m =>
  weeks[m.code] === WEEK &&        // ยังเป็นเมนูของสัปดาห์นี้
  m.is_available === true &&
  m.stock_total === 0              // ⚠️ ต้องเป็น 0 เป๊ะ — null = ไม่จำกัด ห้ามแตะ
);

if (!need.length) { console.log('['+stamp+'] ไม่มีเมนูไหนหมด — ไม่ต้องเติม'); process.exit(0); }

const done = [];
for (const m of need) {
  if (DRY) { done.push(m); continue; }
  const r = await fetch(`${SB}/rest/v1/menu_items?code=eq.${m.code}`,{method:'PATCH',
    headers:{apikey:KEY,'Content-Type':'application/json',Prefer:'return=representation'},
    body:JSON.stringify({stock_total:ADD})});
  const j = await r.json();
  if (r.ok && j.length) done.push(m); else console.log('❌ เติมไม่สำเร็จ '+m.code);
}
console.log('🔁 ['+stamp+'] เติมสต็อกสารทจีน '+done.length+' เมนู'+(DRY?' (ดูเฉยๆ ไม่ได้เขียน)':''));
done.forEach(m => console.log('   '+String(m.subcode||'-').padEnd(3)+m.code.padEnd(6)+'0 → '+ADD+'   '+m.name));

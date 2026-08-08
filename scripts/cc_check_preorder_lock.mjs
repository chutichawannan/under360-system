// เช็คระบบล็อกเมนูสัปดาห์หน้า (available_from) — มีของอยู่แล้วแต่ไม่เคยตั้งค่า?
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const get = async (q) => (await fetch(B + q, { headers: H })).json();

const all = await get('menu_items?select=code,subcode,name,category,available_from,is_weekly_special,created_at&is_available=eq.true&order=code&limit=400');
console.log('เมนูเปิดขาย        : ' + all.length);
console.log('ตั้ง available_from : ' + all.filter(m => m.available_from).length + '   ← 0 = ไม่เคยใช้ระบบล็อกเลย');
console.log('is_weekly_special   : ' + all.filter(m => m.is_weekly_special).length);
console.log('มี subcode          : ' + all.filter(m => m.subcode).length);

console.log('\n── เมนูสัปดาห์พิเศษ (is_weekly_special=true) ──');
all.filter(m => m.is_weekly_special).sort((a,b)=>String(a.subcode).localeCompare(String(b.subcode)))
  .forEach(m => console.log('  ' + String(m.subcode||'-').padEnd(5) + String(m.code).padEnd(6) + (m.name||'').slice(0,32).padEnd(34) + (m.category||'').padEnd(16) + 'from=' + (m.available_from||'(ว่าง)')));

console.log('\n── เมนูที่ลูกค้ากดสั่งในใบ U-0809-001 ──');
for (const sc of ['022','016','063','025','069','144','068','1','3','7','14','102']) {
  const m = all.find(x => String(x.subcode) === sc);
  console.log('  ' + sc.padEnd(4) + (m ? String(m.code).padEnd(6) + (m.name||'').slice(0,30).padEnd(32) + 'พิเศษ=' + (m.is_weekly_special?'ใช่':'ไม่') + '  from=' + (m.available_from||'(ว่าง)') : '⚠️ หา subcode นี้ไม่เจอ'));
}

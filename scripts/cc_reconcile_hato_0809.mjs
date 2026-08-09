// เทียบออเดอร์ที่ต้องส่ง 9-10 ส.ค. ระหว่างหน้าจอ Hato (นัทแคปมา) กับระบบเรา
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const get = async (q) => (await fetch(B + q, { headers: H })).json();

// จากหน้าจอ Hato ที่นัทแคปมา (9 ส.ค. 7:15-7:23 น. ไทย)
const HATO = {
  '2026-08-09': [
    ['HT-788028907', 'ป่าน', 1999, 'Ready To Cook', 'Paid'],
    ['HT-1821605687', 'กนกวรรณ', 3190, 'Ready To Cook', 'Paid'],
    ['HT-1170825489', 'จอย', 560, 'Ready To Cook', 'Paid'],
    ['HT-131832912', 'แพร', 565, 'Ready To Cook', 'Paid'],
    ['HT-96578984', 'คุณบี', 2810, 'Placed', 'Failed'],
    ['HT-1744046794', 'คุณบี', 1795, 'Ready To Cook', 'Paid'],
    ['HT-1667895113', 'ยุ่น', 1184, 'Ready To Cook', 'Paid'],
  ],
  '2026-08-10': [
    ['HT-653654246', 'มิ่น', 1078, 'Cancelled', 'Pending Payment'],
    ['HT-1790999183', 'มิ่น', 1088, 'Placed', 'Pending Verification'],
  ],
};

for (const [date, rows] of Object.entries(HATO)) {
  console.log('\n══════ วันส่ง ' + date + ' ══════');

  const ours = await get(`orders?select=order_number,customer_name,customer_phone,total,status,payment_status,delivery_address,delivery_date,time_slot_label&delivery_date=eq.${date}&order=order_number&limit=200`);
  const byNum = new Map(ours.map(o => [o.order_number, o]));

  console.log('\n— ใบ Hato ' + rows.length + ' ใบ : อยู่ในระบบเราไหม —');
  let missing = 0;
  for (const [num, name, total, st, pay] of rows) {
    const o = byNum.get(num);
    if (!o) { missing++; console.log(`  ❌ ขาด  ${num.padEnd(16)} ${name.padEnd(10)} ฿${String(total).padStart(5)}  (${st}/${pay})`); }
    else {
      const diff = Number(o.total) !== total ? `  ⚠️ ยอดไม่ตรง เรา ฿${o.total}` : '';
      const noAddr = !o.delivery_address ? '  ⚠️ ไม่มีที่อยู่' : '';
      console.log(`  ✅ มี    ${num.padEnd(16)} ${String(o.customer_name || '').slice(0, 10).padEnd(10)} ฿${String(o.total).padStart(5)}${diff}${noAddr}`);
    }
  }

  const hatoNums = new Set(rows.map(r => r[0]));
  const extra = ours.filter(o => !hatoNums.has(o.order_number));
  console.log('\n— ใบในระบบเราที่ไม่อยู่ในจอ Hato (' + extra.length + ' ใบ) —');
  extra.forEach(o => console.log(`  ${o.order_number.padEnd(16)} ${String(o.customer_name || '').slice(0, 14).padEnd(16)} ฿${String(o.total).padStart(5)}  ${o.status || ''}  ${o.time_slot_label || ''}`));

  console.log(`\nสรุป ${date}: Hato ${rows.length} ใบ · ระบบเรา ${ours.length} ใบ · **ขาดหาย ${missing} ใบ**`);
}

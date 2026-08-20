/* เฝ้าว่า "ที่มาของลูกค้า" ไปถึงใบสั่งซื้อจริงหรือยัง (m-track 20 ส.ค. 2026)
   รัน: node scripts/m_watch_attribution.mjs

   ทำไมต้องมีตัวนี้: เลขากำชับว่า **อย่าประกาศว่าจบจนกว่าจะเห็นแถวจริง**
   นัทเทสเปิดหน้าแล้ว (หน้าไม่พัง ✅) แต่ยังไม่ได้สั่งจริง → ยังไม่รู้ว่าค่าถูกเขียนลงใบสั่งซื้อไหม
   baseline ตอนตั้ง: orders ที่มี source_campaign = 0 ใบ */

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const q = async (path, extra = {}) =>
  fetch(`${SB}/${path}`, { headers: { ...H, ...extra } });

const rows = await (await q('orders?select=order_number,source,source_campaign,total,created_at&source_campaign=not.is.null&order=created_at.desc&limit=20')).json();

console.log('═══ ที่มาของลูกค้า → ใบสั่งซื้อ ═══\n');
if (!Array.isArray(rows) || !rows.length) {
  console.log('⏳ ยังไม่มีใบสั่งซื้อที่มี source_campaign สักใบ');
  console.log('   = ยังพิสูจน์ไม่ครบวงจร · ยังไม่ถือว่างานจบ\n');
  console.log('   สิ่งที่ยืนยันแล้ว: ลิงก์ที่มีพารามิเตอร์ยาวๆ ไม่ทำให้หน้าสั่งของพัง (นัทเทสเอง 20 ส.ค.)');
  console.log('   สิ่งที่ยังไม่ยืนยัน: ค่านั้นถูกเขียนลงใบสั่งซื้อจริง');
  console.log('\n   👉 ออเดอร์ใบแรกที่มาจากลิงก์ติดแท็ก (เช่นจากแอด FB) จะโผล่ตรงนี้');
} else {
  console.log(`🎉 พิสูจน์ครบวงจรแล้ว — เจอ ${rows.length} ใบ\n`);
  for (const r of rows) {
    const d = String(r.created_at || '').slice(0, 16).replace('T', ' ');
    console.log(`  ${r.order_number}  ${d}  ฿${r.total}`);
    console.log(`    source=${r.source || '-'}  ที่มา=${r.source_campaign}`);
  }
  console.log('\n  → แปลว่า แอด → เว็บ → หน้าสั่งของ → ใบสั่งซื้อ ต่อกันติดจริง');
  console.log('  → ต่อจากนี้ join กับยอดเงินได้เลยว่าแคมเปญไหนทำเงินกี่บาท');
}

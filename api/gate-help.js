// ════════════════════════════════════════════════════════════════════
//  "ขอรหัส" จากจอด่าน — ปุ่มเดียว ไม่ต้องอ่านอะไร ไม่ต้องพิมพ์อะไร
//
//  ทำไมมี: 8 ก.ย. 2569 ผมขึ้นด่านรหัสแล้วอูเข้าแอปไม่ได้
//  เธอเจอจอดำกับช่อง 4 ช่อง ไม่มีอะไรบอกว่าต้องถามใคร → เลยพิมพ์หานัทเอง
//  ปุ่มนี้คือทางออกที่ไม่ต้องวิ่งไปหานัท และไม่ต้องอ่านภาษาไทย
//
//  🔒 ปลอดภัยเพราะ: ข้อความเป็นข้อความตายตัว คนกดพิมพ์อะไรเข้ามาไม่ได้เลย
//     (รับแค่ "กดจากหน้าไหน" ซึ่งกรองด้วย allowlist) · ไม่มีกุญแจอะไรอยู่ฝั่งหน้าเว็บ
//     ต่อให้มีคนกดรัว ๆ ก็ได้แค่ข้อความเดิมซ้ำ ๆ และมีตัวหน่วงกันสแปมอยู่
//
//  ส่ง 2 ทาง เผื่อทางใดทางหนึ่งไม่ได้ตั้งค่าไว้:
//    1) กลุ่มไลน์ครัว (ถ้าตั้ง KITCHEN_GROUP_ID ไว้) — ครัวเห็นในที่ที่เขาอยู่แล้ว
//    2) บอร์ดห้องกะปัน — ทางนี้ใช้ได้เสมอ ไม่ต้องตั้งค่าอะไร
//  ทางไหนถึงก็ถือว่าสำเร็จ เพราะเป้าหมายคือ "มีคนรู้ว่าครัวติด" ไม่ใช่ "ส่งครบทุกทาง"
// ════════════════════════════════════════════════════════════════════

const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

/* หน้าที่อนุญาตให้บอกได้ว่า "กดมาจากตรงไหน" — กันคนยัดข้อความแปลกปลอมเข้ามา
   ไม่อยู่ในลิสต์ = ไม่เอ่ยชื่อหน้า ไม่ใช่ปฏิเสธ (คนขอความช่วยเหลือไม่ควรโดนปัด) */
const PAGES = {
  '/kq': 'คิวครัว', '/k': 'หน้ารวมครัว', '/o': 'ออเดอร์ล่วงหน้า',
  '/oh': 'หน้าแอดมิน', '/hq': 'โถงบ้าน', '/money': 'ยอดค้างจ่าย', '/db': 'ฐานข้อมูลเมนู',
  '/pwa/checklist.html': 'ใบงานรายวัน', '/pwa/stock_count.html': 'นับสต็อก',
  '/print_pickslip.html': 'ใบจัดของ', '/kitchen_queue.html': 'คิวครัว',
};

/* กันกดรัว — จำไว้ในหน่วยความจำของเครื่องที่รันอยู่
   ไม่ใช่ระบบกันสแปมจริงจัง แค่กันนิ้วลั่นกับกดเล่น */
let lastSent = 0;
const COOLDOWN_MS = 60 * 1000;

async function toKitchenGroup(text) {
  const group = process.env.KITCHEN_GROUP_ID || '';
  if (!group) return 'ไม่ได้ตั้งกลุ่มไลน์ครัวไว้';
  try {
    const mod = await import('./_line_token.js');
    const getToken = mod.default || mod;
    const token = await getToken();
    if (!token) return 'ไม่มีกุญแจไลน์';
    const r = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: group, messages: [{ type: 'text', text }] }),
    });
    return r.ok ? 'ส่งเข้ากลุ่มครัวแล้ว' : ('กลุ่มครัวไม่รับ: ' + r.status);
  } catch (e) { return 'ส่งกลุ่มครัวไม่ได้: ' + e.message; }
}

async function toKapanBoard(text) {
  try {
    const r = await fetch(SB + '/session_messages', {
      method: 'POST',
      headers: { apikey: ANON, Authorization: 'Bearer ' + ANON,
                 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ room: 'kapan', sender: 'ด่านรหัส', role: 'assistant', text }),
    });
    return r.ok ? 'ถึงห้องกะปันแล้ว' : ('บอร์ดไม่รับ: ' + r.status);
  } catch (e) { return 'ส่งบอร์ดไม่ได้: ' + e.message; }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (Date.now() - lastSent < COOLDOWN_MS) {
    /* บอกว่าสำเร็จ เพราะสำหรับคนกด "เพิ่งส่งไปเมื่อกี้" กับ "ส่งแล้ว" คือเรื่องเดียวกัน
       ถ้าขึ้นแดงว่าล้มเหลว เขาจะกดซ้ำหนักกว่าเดิม */
    return res.end(JSON.stringify({ ok: true, note: 'เพิ่งส่งไปเมื่อครู่' }));
  }
  lastSent = Date.now();

  let from = '';
  try {
    const u = new URL(req.url, 'http://x');
    from = PAGES[u.searchParams.get('p') || ''] || '';
  } catch (e) {}

  const t = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(11, 16); // เวลาไทย
  const text =
    '🙋 มีคนกดขอรหัสเข้าแอปที่จอล็อก' + (from ? ' (หน้า' + from + ')' : '') + ' เวลา ' + t + ' น.' +
    String.fromCharCode(10) + 'ช่วยบอกรหัสให้เขาในกลุ่มหน่อยครับ — เขาเข้างานไม่ได้อยู่';

  const [line, board] = await Promise.all([toKitchenGroup(text), toKapanBoard(text)]);
  /* ถึงสักทางถือว่าพอ — คนกดต้องการแค่ "มีคนรู้แล้ว" */
  const ok = /แล้ว$/.test(line) || /แล้ว$/.test(board);
  return res.end(JSON.stringify({ ok, line, board }));
};

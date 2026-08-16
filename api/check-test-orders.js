/* Under360 — ตัวตรวจ "ใบเทสที่หลุดเข้าคิวจริง" (16 ส.ค. 2026)
 *
 * 🩸 ทำไมต้องมี — เกิดจริงมาแล้ว 3 รอบ:
 *    ใบที่คนในทีมเปิดไว้ทดสอบ (ชื่อ "test" / "เทส" / "ทดลอบ") ไม่ได้ถูกปิดทิ้ง
 *    → ครัวทำอาหารจริง · แมสไปส่งที่อยู่ปลอม · หลุดเข้าใบทวงเงินจนแอดมินเกือบไปทวงลูกค้าที่ไม่มีตัวตน
 *    รอบล่าสุด 16 ส.ค. เจอ 2 ใบส่งพรุ่งนี้ (PM แจ้งมา 1 ใบ · CC สแกนเจอเพิ่มอีกใบ)
 *
 * 🎯 หลักคิด: **ตรวจก่อนครัวลงมือ ไม่ใช่ตามแก้ทีหลัง**
 *    ของแบบนี้ไม่มีวันหมดไป ตราบใดที่ยังต้องเทสด้วยออเดอร์จริง → ต้องมีคนเฝ้าให้อัตโนมัติ
 *
 * ⛔ ตั้งใจให้ "เตือนอย่างเดียว ไม่ยกเลิกให้เอง"
 *    ชื่อลูกค้าจริงอาจมีคำว่า test ปนได้ · ยกเลิกออเดอร์จริงเสียหายกว่าปล่อยให้คนมาตัดสิน
 *
 * เปิดดู:  /api/check-test-orders          → JSON
 *          /api/check-test-orders?days=14  → มองไกลกว่าปกติ (ค่าเริ่มต้น 7 วัน)
 */
const SB  = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H   = { apikey: KEY, Authorization: 'Bearer ' + KEY };

// เวลาไทยเสมอ — ครัวอยู่ไทย เจ้าของอาจเปิดจากอเมริกา
const bkkDate = (n = 0) => {
  const d = new Date(Date.now() + n * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(d);
};

// คำที่แปลว่า "ใบนี้ไม่ใช่ลูกค้าจริง" — เก็บรวมไว้ที่เดียว เจอคำใหม่มาเติมตรงนี้
const WORDS = ['test', 'เทส', 'ทดสอบ', 'ทดลอบ', 'ทดลอง', 'dummy', 'ตัวอย่าง', '[parallel]', 'schematest'];
const hit = (s) => { const t = String(s || '').toLowerCase(); return WORDS.filter(w => t.includes(w)); };

module.exports = async (req, res) => {
  const days = Math.min(parseInt((req.query && req.query.days) || '7', 10) || 7, 60);
  const from = bkkDate(0), to = bkkDate(days);

  try {
    const q = `${SB}/orders?select=order_number,customer_name,customer_phone,total,delivery_date,status,delivery_address,notes,created_by`
            + `&delivery_date=gte.${from}&delivery_date=lte.${to}&status=neq.cancelled&order=delivery_date&limit=500`;
    const rows = await (await fetch(q, { headers: H })).json();
    if (!Array.isArray(rows)) return res.status(500).json({ ok: false, rows });

    const found = [];
    for (const o of rows) {
      const words = [...new Set([
        ...hit(o.customer_name), ...hit(o.notes), ...hit(o.created_by), ...hit(o.delivery_address),
      ])];
      if (words.length) {
        found.push({
          เลขใบ: o.order_number, ชื่อ: o.customer_name, ยอด: o.total,
          วันส่ง: o.delivery_date, สถานะ: o.status,
          เจอคำว่า: words, ที่อยู่: String(o.delivery_address || '').slice(0, 60),
        });
      }
    }

    // ใบที่ส่งภายใน 2 วัน = ครัวกำลังจะลงมือ ต้องรีบที่สุด
    const urgent = found.filter(f => f.วันส่ง <= bkkDate(1));

    return res.status(200).json({
      ok: true,
      ช่วงที่ตรวจ: from + ' ถึง ' + to,
      ออเดอร์ที่ตรวจ: rows.length,
      พบใบน่าสงสัย: found.length,
      ด่วน_ส่งภายในพรุ่งนี้: urgent.length,
      สรุป: found.length === 0
        ? '✅ ไม่พบใบเทสค้างในคิว'
        : (urgent.length
            ? '🚨 มี ' + urgent.length + ' ใบที่ครัวกำลังจะทำ — เช็คแล้วยกเลิกที่หน้าออเดอร์ (OH) ถ้าไม่ใช่ลูกค้าจริง'
            : '⚠️ พบ ' + found.length + ' ใบน่าสงสัย ยังมีเวลาตรวจ'),
      รายการ: found,
      หมายเหตุ: 'ตัวนี้เตือนอย่างเดียว ไม่ยกเลิกให้เอง — ชื่อลูกค้าจริงอาจมีคำเหล่านี้ปนได้',
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message) });
  }
};

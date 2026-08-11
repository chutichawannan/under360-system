// 📍 เติมหมุดให้ออเดอร์ที่มีแต่ที่อยู่เป็นข้อความ (ลูกค้าไม่ได้ปักหมุด)
// ─────────────────────────────────────────────────────────────
// วิธีใช้ (ต้องรันในเบราว์เซอร์เท่านั้น — ดูเหตุผลข้างล่าง):
//   1. เปิด https://under360-system.vercel.app/operation_hub.html
//   2. กด F12 → แท็บ Console
//   3. ก๊อปไฟล์นี้ทั้งไฟล์ วางแล้ว Enter
//   4. รอจนขึ้นตาราง แล้วอ่านคอลัมน์ "ความแม่น" — ตัวที่ไม่ใช่ ROOFTOP ควรให้แอดมินยืนยันอีกที
//
// ⚠️ ทำไมรันจาก terminal ไม่ได้:
//    คีย์ Google ของเราถูกล็อกให้ใช้ได้เฉพาะจากเว็บของเรา (referer restriction)
//    → Geocoding REST API ปฏิเสธคีย์แบบนี้ตรงๆ ("API keys with referer restrictions cannot be used")
//    → ต้องใช้ google.maps.Geocoder ของ Maps JS ที่หน้า OH โหลดไว้อยู่แล้วแทน
//
// 🔒 กันพัง 3 ชั้น:
//    · เขียนเฉพาะแถวที่ delivery_lat ยังเป็น null (ใส่เงื่อนไขใน PATCH ไม่ใช่เช็คในโค้ด)
//      → หมุดที่ลูกค้าปักเองแม่นกว่าเสมอ ห้ามทับ
//    · ที่อยู่ว่าง = ข้าม ไม่เดา
//    · เว้นจังหวะ 180ms ต่อครั้ง กันโดน Google จำกัดอัตรา
//
// 🎯 ที่มา: 11 ส.ค. 2569 แอดมินเจอกล่องแดงในหน้าแมส "8 ใบต้องตามที่อยู่ก่อน"
//    ทั้ง 8 ใบมีที่อยู่ครบ ขาดแค่พิกัด → เสิร์ชเติมได้ ไม่ต้องไล่ทักลูกค้า
//    ⛳ ต้นเหตุจริงอยู่ที่ LIFF ไม่บังคับปักหมุด (N-19 · บ้าน U) — ตัวนี้เป็นที่ตักน้ำ ไม่ใช่ที่ปิดก๊อก

(async () => {
  const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
  const AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
  const H = { apikey: AK, Authorization: 'Bearer ' + AK };
  const KITCHEN = { lat: 13.7179969, lng: 100.5010971 };
  const FROM = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());  // วันนี้ (เวลาไทย) เป็นต้นไป

  if (typeof google === 'undefined' || !google.maps) { console.error('❌ หน้านี้ไม่ได้โหลด Google Maps — ต้องรันบนหน้า operation_hub.html'); return; }

  const km = (a, b) => { const x = a.lat - b.lat, y = (a.lng - b.lng) * Math.cos(a.lat * Math.PI / 180); return Math.sqrt(x * x + y * y) * 111; };
  const gc = new google.maps.Geocoder();
  const geo = (addr) => new Promise(ok => gc.geocode({ address: addr, region: 'th' }, (r, st) => ok({ st, r })));

  const rows = (await (await fetch(`${SB}/orders?select=id,order_number,customer_name,delivery_address,delivery_address_text,delivery_date,status&delivery_date=gte.${FROM}&delivery_lat=is.null&order=delivery_date&limit=200`, { headers: H })).json())
    .filter(o => o.status !== 'cancelled');

  if (!rows.length) { console.log('✅ ไม่มีใบไหนขาดหมุด — ไม่ต้องทำอะไร'); return; }
  console.log(`พบใบที่ยังไม่มีหมุด ${rows.length} ใบ (ตั้งแต่ ${FROM}) — กำลังเสิร์ชที่อยู่...`);

  const report = [];
  for (const o of rows) {
    const addr = (o.delivery_address || o.delivery_address_text || '').replace(/\s+/g, ' ').trim();
    if (!addr) { report.push({ ใบ: o.order_number, ผล: '⛔ ที่อยู่ว่างด้วย — ต้องทักลูกค้า', ความแม่น: '-' }); continue; }

    const { st, r } = await geo(addr);
    const g = r && r[0];
    if (st !== 'OK' || !g) { report.push({ ใบ: o.order_number, ผล: '❌ เสิร์ชไม่เจอ (' + st + ')', ความแม่น: '-' }); continue; }

    const loc = g.geometry.location.toJSON();
    const dist = +km(KITCHEN, loc).toFixed(1);
    // delivery_distance_km ต้องใส่ด้วย ไม่ใช่ใส่แค่พิกัด — msgZone ใช้ค่านี้คัด "นอกเขตแมส" (>60 กม.)
    // ถ้าเว้นไว้ ใบต่างจังหวัดจะไหลเข้าแผนแมสแล้วโดน Lalamove ปฏิเสธตอนจอง
    // ⚠️ ค่านี้เป็น "ระยะเส้นตรง" ไม่ใช่ระยะขับจริง — ใช้จัดกลุ่ม/คัดนอกเขตเท่านั้น ห้ามเอาไปคิดเงินลูกค้า
    const res = await fetch(`${SB}/orders?id=eq.${o.id}&delivery_lat=is.null`, {
      method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ delivery_lat: loc.lat, delivery_lng: loc.lng, delivery_distance_km: dist })
    });
    report.push({
      ใบ: o.order_number, ลูกค้า: (o.customer_name || '').slice(0, 20),
      ผล: res.status === 204 ? '✅ เติมแล้ว' : '❌ เขียนไม่ผ่าน ' + res.status,
      ความแม่น: g.geometry.location_type, ระยะ: dist + ' กม.',
      ที่เจอ: g.formatted_address.slice(0, 55)
    });
    await new Promise(r => setTimeout(r, 180));
  }

  console.table(report);
  const ต้องยืนยัน = report.filter(x => x.ความแม่น && !['ROOFTOP', '-'].includes(x.ความแม่น));
  if (ต้องยืนยัน.length) {
    console.warn(`⚠️ ${ต้องยืนยัน.length} ใบที่หมุดยังไม่แม่นระดับบ้านเลขที่ — ให้แอดมินยืนยันกับลูกค้าอีกที:`);
    console.table(ต้องยืนยัน);
  }
  console.log('เสร็จแล้ว — กดปุ่ม "💰 คำนวณค่าส่งถูกสุด" ใหม่เพื่อดูแผนที่อัปเดต');
})();

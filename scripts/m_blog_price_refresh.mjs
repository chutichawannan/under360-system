/* ปรับราคา/โปรในบทความให้ตรงของจริงวันนี้ (นัทเคาะผ่านเลขา 10 ก.ย. 2026)
   "ปรับราคาให้ตรงบริบทปัจจุบันแล้วไปต่อเลย"

   สแกนทั้ง 63 บทความแล้ว มีตัวเลขราคา/โปร 3 บทความเท่านั้น:
     1. how-much-water-to-drink-daily  — โปรเดือนเมษาที่ตายแล้ว (แจกกระติกน้ำ 350) ยังโฆษณาอยู่บนเว็บ
     2. frozen-clean-food-busy-life    — ราคา ฿1,400 ถูกแล้ว (Protein Pack S) แต่ขาด "ส่งฟรี" + เงื่อนไขส่วนลดสมาชิกใหม่ผิด + ปุ่มสั่งไม่มีลิงก์
     3. delivery-areas                 — "ค่าส่ง ตจว. ประมาณ 200" อ่านเป็นราคาปกติ ทั้งที่ 200 = เพดานสูงสุด (กฎ Delivery Reality)
   ราคาเมนู 70/70/70/70/75 ในบทความฟรีซ = ตรงกับ menu_items จริงทุกตัว (A2·A7·A9·A13·A20) ไม่แตะ

   ตรวจกับของจริงก่อนเขียนทุกตัว: mp_offer_sets · packages · menu_items · promo_codes · autoPromos() ใน liff_customer.html
   รันซ้ำได้ (เจอข้อความใหม่แล้วข้าม) */
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const LIFF = 'https://liff.line.me/2011148232-oul66cEs';

const EDITS = {
  'how-much-water-to-drink-daily': [
    ['สวัสดีเดือนเมษายนค่า เดือนนี้เรามีโปรโมชั่นดับร้อน ซื้ออาหารคลีน 2 คอร์ส รับฟรีไปเลย Infused water bottle มูลค่า 350 บาท!! (จะใช้ภายในอาทิตย์เดียวกัน หรือคนละอาทิตย์ก็ได้ หรือรับแบบแพคกับข้าวสูญญากาศไซส์ s ก็ได้เช่นกัน)\n\nวันนี้พลอยเลยมาเขียนบทความเกี่ยวกับการดื่มน้ำให้ทุกท่านอ่านกันค่ะ',
     'สวัสดีค่า วันนี้พลอยมาเขียนบทความเกี่ยวกับการดื่มน้ำให้ทุกท่านอ่านกันค่ะ'],
    ['ปล. กระติกน้ำแก้วที่ทางร้านแถม 1 ขวด = 300ml ค่ะ',
     'ปล. ขวดน้ำพกพาทั่วไป 1 ขวด ≈ 300 ml ค่ะ นับเป็นขวดจะง่ายกว่านับแก้ว'],
  ],
  'frozen-clean-food-busy-life': [
    ['ลองเริ่มง่ายๆ ด้วยการสั่งชุดอาหารทดลองของเรา 7 วัน 21 แพค 1400 บาท\n\n- คลิกสั่งซื้อเลย !\n- สมัครสมาชิกได้รับส่วนลด 50 บาท สำหรับลูกค้าใหม่ !',
     'ลองเริ่มง่ายๆ ด้วยแพคกับข้าวชุดทดลอง **Protein Pack S — 7 วัน 21 แพค 1,400 บาท ส่งฟรี**\n\n- [สั่งผ่าน LINE ได้เลย](' + LIFF + ')\n- ลูกค้าใหม่รับส่วนลด 50 บาทอัตโนมัติ เมื่อยอดสั่งครบ 500 บาท (ไม่ต้องกรอกโค้ด)'],
  ],
  'delivery-areas': [
    ['ส่วนต่างจังหวัดสั่งเป็นแพ็คฟรีซส่งทั่วไทย ค่าส่งประมาณ 200 บาท',
     'ส่วนต่างจังหวัดสั่งเป็นแพ็คฟรีซส่งทั่วไทย ค่าส่งคิดตามระยะทาง สูงสุดไม่เกินประมาณ 200 บาท เพราะร้านช่วยออกให้ส่วนหนึ่ง'],
    ['· ส่วนต่างจังหวัดเป็นแพ็คฟรีซ ค่าส่งประมาณ 200 บาท',
     '· ส่วนต่างจังหวัดเป็นแพ็คฟรีซ ค่าส่งตามระยะทาง สูงสุดไม่เกินประมาณ 200 บาท (ร้านช่วยออกให้ส่วนหนึ่ง)'],
  ],
};

let changed = 0, skipped = 0;
for (const [slug, pairs] of Object.entries(EDITS)) {
  const rows = await (await fetch(B + 'blog_posts?slug=eq.' + slug + '&select=id,slug,content_md,published', { headers: H })).json();
  if (rows.length !== 1) { console.error('❌ ' + slug + ' — เจอ ' + rows.length + ' แถว หยุด'); process.exit(1); }
  let md = rows[0].content_md, hit = 0;
  for (const [oldS, newS] of pairs) {
    if (md.includes(newS)) { hit++; continue; }               // แก้ไปแล้ว
    const n = md.split(oldS).length - 1;
    if (n !== 1) { console.error('❌ ' + slug + ' — หาข้อความเดิมเจอ ' + n + ' ครั้ง (ต้องเจอ 1) หยุด ไม่เดา\n   "' + oldS.slice(0, 60) + '…"'); process.exit(1); }
    md = md.split(oldS).join(newS); hit++;
  }
  if (md === rows[0].content_md) { console.log('⏭️  ' + slug + ' — แก้ไว้แล้ว'); skipped++; continue; }
  const r = await fetch(B + 'blog_posts?id=eq.' + rows[0].id, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=representation' },
    body: JSON.stringify({ content_md: md, published: true }),
  });
  const back = await r.json();
  if (!r.ok || !Array.isArray(back) || back.length !== 1) { console.error('❌ ' + slug + ' PATCH ' + r.status + ' ' + JSON.stringify(back).slice(0, 200)); process.exit(1); }
  if (back[0].content_md !== md) { console.error('❌ ' + slug + ' — เขียนแล้วอ่านกลับมาไม่ตรง (RLS บล็อกเงียบ?)'); process.exit(1); }
  console.log('✅ ' + slug + ' — แก้ ' + pairs.length + ' จุด · published=' + back[0].published);
  changed++;
}
console.log('\nสรุป: แก้ ' + changed + ' บทความ · ข้าม ' + skipped);

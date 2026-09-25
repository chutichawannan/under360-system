/* 💳 เช็คว่าระบบจ่ายบัตรพร้อมใช้หรือยัง — ใครก็รันได้ ไม่ต้องรู้เรื่องโค้ด
   node scripts/u/check_omise.mjs
   บอก 3 อย่าง: กุญแจใส่แล้วหรือยัง · เป็นกุญแจทดสอบหรือตัวจริง · ถ้ายังไม่พร้อมต้องทำอะไรต่อ
   ⛔ ไม่แตะกุญแจ ไม่พิมพ์กุญแจออกมา — อ่านแค่ว่า "มี/ไม่มี" จากปลายทางที่ระบบเปิดให้เช็ค */
const URLS = {
  prod: 'https://under360-system.vercel.app/api/omise-charge',
};
const line = (s) => console.log(s);

const r = await fetch(URLS.prod + '?t=' + Date.now(), { cache: 'no-store' }).catch(e => ({ ok: false, err: e }));
if (!r || !r.ok) { line('🔴 เรียกระบบจ่ายเงินไม่ได้เลย — เว็บล่มหรือยังไม่ได้ deploy'); process.exit(1); }
const j = await r.json().catch(() => null);
if (!j) { line('🔴 ระบบตอบกลับมาอ่านไม่ออก'); process.exit(1); }

line('');
if (!j.ok) {
  line('⏳ ยังจ่ายบัตรไม่ได้ — ' + (j.mode || 'ไม่พร้อม'));
  if (Array.isArray(j.missing) && j.missing.length) {
    line('   ขาด: ' + j.missing.join(' · '));
    line('');
    line('   ทำต่อที่ Vercel → โปรเจค under360-system → Settings → Environment Variables');
    line('   ใส่ค่าจากแดชบอร์ด Omise (คัดลอกมาวาง ไม่ต้องพิมพ์เอง) แล้วกด Redeploy 1 ครั้ง');
    line('   · OMISE_PUBLIC_KEY   ขึ้นต้น pkey_');
    line('   · OMISE_SECRET_KEY   ขึ้นต้น skey_');
    line('   แนะนำใส่ชุด test ก่อน (pkey_test / skey_test) ลองจ่าย 1 ใบให้ผ่าน แล้วค่อยสลับตัวจริง');
  }
  process.exit(2);
}

const pub = String(j.public_key || '');
const isTest = /_test_/.test(pub);
line('🟢 ระบบจ่ายบัตรพร้อมใช้งาน');
line('   โหมด: ' + (isTest ? '🧪 ทดสอบ (test) — เงินไม่ถูกตัดจริง' : '💳 ใช้งานจริง (live) — เงินถูกตัดจริง'));
line('   กุญแจสาธารณะ: ' + pub.slice(0, 12) + '…  (ตัวนี้เปิดเผยได้ ไม่ใช่ความลับ)');
line('');
line('ขั้นต่อไป: เปิดหน้าสั่งของ → ใส่ของที่รูดบัตรได้ (เซ็ต/คอร์ส/มีลแพลนไม่ใช่ชุดทดลอง หรือยอดถึง ฿1,500)');
line('           → ที่หน้าจ่ายเงินต้องเห็นปุ่มบัตร → จ่ายจริง 1 ใบ → เช็คว่าใบนั้นขึ้นสถานะจ่ายแล้ว');
if (isTest) line('           บัตรทดสอบของ Omise: 4242 4242 4242 4242 · วันหมดอายุอนาคต · CVV อะไรก็ได้');

/* 🔴 รูปทุกใบที่ผ่านตัวย่อของ Supabase ถูก "บีบแบน" มาตลอด (เจอ 8 ก.ย. 2026)

   อาการ: ส่งแค่ ?width=340 → Supabase ย่อความกว้างให้ **แต่คงความสูงเดิมไว้**
          J04 ต้นฉบับ 1536x1024 (สัดส่วน 1.50) → ได้ 340x1024 (สัดส่วน 0.33) = จานถูกบีบผอม
          ไม่มี error ไม่มีอะไรแดง · CSS object-fit ที่ครอบอยู่ช่วยกลบอาการจนดูเหมือนปกติ
          เพิ่งโผล่ตอนเอา object-fit ออกตามที่นัทสั่ง

   วิธีแก้: เติม resize=contain — พิสูจน์แล้วว่าคืนสัดส่วนถูกด้วยพารามิเตอร์เดียว
          ?width=340&resize=contain → 340x227 ✅ (ตรงสัดส่วนต้นฉบับ)

   ⚠️ แตะเฉพาะไฟล์ของห้อง M · liff_*.html (ห้อง u) กับ web/eath/ (ห้องเอิธ) ใส่ resize อยู่แล้ว ไม่ยุ่ง
   รันซ้ำได้ */
import fs from 'fs';

const FILES = ['web/jay.html', 'web/jay_v5.html', 'web/index.html', 'web/v03.html',
               'web/blog.html', 'web/pack.html', 'web/menu_card.html', 'web/menu_brochure.html'];

let total = 0;
for (const F of FILES) {
  if (!fs.existsSync(F)) { console.log('  ⏭️  ไม่มีไฟล์ ' + F); continue; }
  const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
  let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');

  const before = (h.match(/render\/image\/public/g) || []).length;
  if (!before) { console.log('  ⏭️  ' + F + ' ไม่มีตัวย่อรูป'); continue; }

  /* เติมต่อท้ายค่า width ทุกที่ที่ยังไม่มี resize=
     ทำเฉพาะ query string ที่อยู่หลัง render/image/public — ไม่ไปโดน width อื่นในหน้า */
  let n = 0;
  h = h.replace(/(render\/image\/public\/[^"'`\s)]*?\?[^"'`\s)]*?)\bwidth=([^&"'`\s)]+)/g,
    (all, pre, w) => {
      if (/resize=/.test(all)) return all;
      n++;
      return pre + 'width=' + w + '&resize=contain';
    });

  const after = (h.match(/render\/image\/public/g) || []).length;
  if (after !== before) { console.error('🔴 ' + F + ': จำนวน URL เปลี่ยน ' + before + '→' + after + ' — หยุด'); process.exit(1); }

  const left = (h.match(/render\/image\/public[^"'`\s)]*/g) || []).filter(u => /width=/.test(u) && !/resize=/.test(u));
  if (left.length) { console.error('🔴 ' + F + ': ยังเหลือที่ไม่ได้แก้ ' + left.length + ' เส้น\n   ' + left[0]); process.exit(1); }

  if (n) { fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h); total += n; }
  console.log('  ' + (n ? '✅' : '⏭️ ') + ' ' + F.padEnd(26) + ' แก้ ' + n + '/' + before + ' เส้น');
}
console.log('\n✅ แก้รวม ' + total + ' เส้น');

/* หน้า /prayer: ย้ายรูป 4 ใบไปเสิร์ฟผ่านตัวย่อของเรา (9 ก.ย. 2026)

   หลังย่อด้วย Chrome แล้วยังหนัก 5MB — Chrome บันทึก PNG โดยไม่บีบอัดให้
   หน้านี้จะถูกใช้ในแอด/ไลน์ = คนเปิดจากมือถือ 5MB คือคนกดออกก่อนเห็น

   ทางเดียวกับที่ใช้กับรูปเมนูหน้า /jay: อัปขึ้น Supabase Storage แล้วให้ตัวย่อทำ WebP
   ⚠️ ต้องใส่ resize=contain ด้วยเสมอ ไม่งั้นรูปถูกบีบแบน (บทเรียน 8 ก.ย. · แก้ไป 113 เส้น)

   ⚖️ บรีฟเขาเขียนว่า "ห้ามเปลี่ยนรูป" — ผมไม่ได้เปลี่ยนรูป
      ภาพเดิมทุกพิกเซล เปลี่ยนแค่ "เสิร์ฟจากที่ไหน" ซึ่งเป็นเรื่องความเร็ว ไม่ใช่ดีไซน์
   รันซ้ำได้ */
import fs from 'fs';
import path from 'path';

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const UP = 'https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/object/menu-images/prayer/';
const CDN = 'https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/render/image/public/menu-images/prayer/';
const DST = 'web/prayer';

const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };

/* ── อัปขึ้น Storage ── */
const IMGS = [
  ['altar.png', 1100],
  ['guide/step-1.png', 900],
  ['guide/step-2.png', 900],
  ['guide/step-3.png', 900],
];
const map = {};
for (const [rel, w] of IMGS) {
  const p = path.join(DST, rel);
  must(fs.existsSync(p), 'ไม่เจอ ' + rel);
  const buf = fs.readFileSync(p);
  must(buf[0] === 0x89 && buf[1] === 0x50, 'ไม่ใช่ PNG จริง: ' + rel);
  const name = rel.split('/').pop();
  const r = await fetch(UP + name + '?upsert=true', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEY, apikey: KEY, 'Content-Type': 'image/png' },
    body: buf,
  });
  must(r.ok, 'อัปไม่ขึ้น ' + rel + ' → ' + r.status + ' ' + (await r.text()).slice(0, 100));
  /* resize=contain = กันรูปถูกบีบแบน (Supabase ไม่รักษาสัดส่วนถ้าส่งแค่ความกว้าง) */
  const url = CDN + name + '?width=' + w + '&resize=contain&quality=78';
  const chk = await fetch(url, { headers: { Accept: 'image/webp,*/*' } });
  const kb = Math.round((await chk.arrayBuffer()).byteLength / 1024);
  map['/prayer/' + rel] = url;
  console.log('  ✅ ' + rel.padEnd(18) + Math.round(buf.length / 1024) + 'KB → ' + kb + 'KB ' + chk.headers.get('content-type'));
}

/* ── ชี้ HTML/JS ไปที่ตัวย่อ ── */
{
  const exts = ['.html', '.rsc', '.js'];
  let hits = 0, files = 0;
  for (const rel of fs.readdirSync(DST, { recursive: true })) {
    const p = path.join(DST, rel);
    if (!fs.statSync(p).isFile() || !exts.includes(path.extname(p))) continue;
    let t = fs.readFileSync(p, 'utf8'); const before = t;
    for (const [local, cdn] of Object.entries(map)) {
      const n = t.split(local).length - 1;
      if (n) { t = t.split(local).join(cdn); hits += n; }
    }
    if (t !== before) { fs.writeFileSync(p, t); files++; }
  }
  console.log('\n  ✅ ชี้ไปตัวย่อ ' + hits + ' จุด ใน ' + files + ' ไฟล์');
  must(hits >= 4, 'เปลี่ยนที่อยู่รูปได้แค่ ' + hits + ' จุด — น้อยผิดปกติ');
}

/* ── ลบไฟล์รูปหนักออกจาก repo ── */
for (const [rel] of IMGS) fs.rmSync(path.join(DST, rel), { force: true });
fs.rmSync(path.join(DST, 'guide'), { recursive: true, force: true });

const total = fs.readdirSync(DST, { recursive: true })
  .filter(f => fs.statSync(path.join(DST, f)).isFile())
  .reduce((s, f) => s + fs.statSync(path.join(DST, f)).size, 0);
console.log('\n✅ ' + DST + ' เหลือ ' + Math.round(total / 1024) + 'KB (จากเดิม 9,130KB)');

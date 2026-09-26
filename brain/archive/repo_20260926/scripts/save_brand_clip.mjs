/* เก็บคลิป/รีวิวที่พูดถึง Under360 ไว้ไม่ให้หาย (m-track 21 ส.ค. 2026)
   นัทสั่งเอง: *"เก็บด้านร้ายๆ น่ารำคาญกันมาพอแล้ว เก็บด้านดีของเราบ้าง ... ขอแค่ให้มีคลิปเก็บไว้
                เราอาจจะยังไม่ใช้หรอก แต่วันหนึ่งเราจะมี ... เก็บไว้เยอะๆ"*

   ใช้:  node scripts/save_brand_clip.mjs <ลิงก์> [<ลิงก์> ...]
        node scripts/save_brand_clip.mjs            ← ไม่ใส่ลิงก์ = สร้างสารบัญใหม่จากไฟล์ที่มี

   เก็บที่:  Desktop/UNDER360_BRAND_CLIPS/   (นอก repo — วิดีโอไม่ควรเข้า git)
   สารบัญ:  docs/BRAND_CLIPS.md              (อยู่ใน repo — ค้นได้ ไม่หายแม้ไฟล์หาย)

   ⚠️ เก็บไว้ = ได้ · **เอาไปยิงแอด/โพสต์ซ้ำ = ต้องขออนุญาตเจ้าของคลิปก่อนเสมอ**
      (กติกา Meta partnership ad — เอาคลิปคนอื่นมายิงเองเสี่ยงโดนปิดบัญชีโฆษณา
       ทางที่ถูก: ทาบให้เขาโพสต์เอง แล้วกดให้สิทธิ์เราบูสต์) */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const HOME = process.env.USERPROFILE || process.env.HOME;
const YTDLP = path.join(HOME, 'bin', 'yt-dlp.exe');
const OUT = path.join(HOME, 'Desktop', 'UNDER360_BRAND_CLIPS');
const INDEX = 'docs/BRAND_CLIPS.md';

fs.mkdirSync(OUT, { recursive: true });
const urls = process.argv.slice(2);

for (const url of urls) {
  console.log('\n⬇️  ' + url);
  if (!fs.existsSync(YTDLP)) { console.error('❌ ไม่เจอ yt-dlp ที่ ' + YTDLP); process.exit(1); }
  try {
    /* -i = โพสต์แบบหลายรูป (แคโรเซลล์) มีสไลด์ที่ไม่ใช่วิดีโอ ต้องข้ามไม่ใช่ล้มทั้งโพสต์ */
    execFileSync(YTDLP, ['--no-warnings', '--no-progress', '-i',
      '-o', path.join(OUT, '%(uploader_id)s_%(id)s.%(ext)s'),
      '--write-info-json', '--write-thumbnail', url], { stdio: 'inherit' });
  } catch (e) { console.log('   ⚠️ บางสไลด์โหลดไม่ได้ (ปกติของโพสต์หลายรูป) — ที่โหลดได้ถูกเก็บแล้ว'); }
}

/* ── สร้างสารบัญใหม่จากไฟล์จริงทุกครั้ง (ไม่เติมท้าย — กันซ้ำ/กันตกหล่น) ── */
const files = fs.readdirSync(OUT);
const seen = new Set();
const rows = [];
for (const jf of files.filter(f => f.endsWith('.info.json'))) {
  let j; try { j = JSON.parse(fs.readFileSync(path.join(OUT, jf), 'utf8')); } catch { continue; }
  const url = j.webpage_url || '';
  if (!url || seen.has(url)) continue;
  const base = jf.replace('.info.json', '');
  const vid = files.find(f => f.startsWith(base) && /\.(mp4|mkv|webm)$/.test(f));
  if (!vid) continue;                       /* ไม่มีไฟล์วิดีโอจริง = ไม่ลงสารบัญ */
  seen.add(url);
  const d = String(j.upload_date || '');
  rows.push({
    who: (j.uploader || j.channel || '(ไม่ทราบ)').trim(),
    handle: (j.uploader_url || '').replace(/.*instagram\.com\//, '@').replace(/\/$/, ''),
    date: d.length === 8 ? `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}` : '-',
    sortKey: d || '0',
    likes: j.like_count ?? '-', comments: j.comment_count ?? '-',
    cap: String(j.description || '').replace(/\s*\n+\s*/g, ' ').replace(/\|/g, '/').trim().slice(0, 80) || '-',
    file: vid, size: (fs.statSync(path.join(OUT, vid)).size / 1048576).toFixed(1) + ' MB', url,
  });
}
rows.sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey)));

const totalMB = rows.reduce((s, r) => s + parseFloat(r.size), 0).toFixed(1);
let md = `# 🎬 คลังคลิป/รีวิวที่พูดถึง Under360

> **นัทสั่งเอง 21 ส.ค. 2026:** *"เก็บด้านร้ายๆ น่ารำคาญกันมาพอแล้ว เก็บด้านดีของเราบ้าง … ขอแค่ให้มีคลิปเก็บไว้ เราอาจจะยังไม่ใช้หรอก แต่วันหนึ่งเราจะมี … เก็บไว้เยอะๆ"*

**ตอนนี้เก็บแล้ว ${rows.length} คลิป · รวม ${totalMB} MB**

- 📁 **ไฟล์จริง:** \`Desktop/UNDER360_BRAND_CLIPS/\` (นอก repo — วิดีโอไม่ควรเข้า git)
- ➕ **เพิ่มคลิปใหม่:** \`node scripts/save_brand_clip.mjs <ลิงก์>\` (ใส่หลายลิงก์พร้อมกันได้)
- 🔄 **สร้างสารบัญใหม่:** \`node scripts/save_brand_clip.mjs\` (ไม่ใส่ลิงก์)

## ⚠️ กฎการใช้งาน — อ่านก่อนหยิบไปใช้
| ทำได้ | ต้องขอก่อน |
|---|---|
| เก็บไว้ดู · ใช้เป็นตัวอย่างภายใน · ถอดว่าเขาเล่าเรื่องเรายังไง | **ยิงแอด · โพสต์ซ้ำบนเพจเรา · ตัดต่อไปใช้ต่อ** |

เอาคลิปคนอื่นมายิงเองโดยไม่ขอ **ผิดกติกา Meta — เสี่ยงโดนปิดบัญชีโฆษณา**
ทางที่ถูก: **ทาบให้เขาโพสต์จากบัญชีตัวเอง แล้วกดให้สิทธิ์เราบูสต์** (partnership ad)

| ใคร | วันโพสต์ | ไลก์ | คอมเมนต์ | แคปชั่น | ไฟล์ | ขนาด | ลิงก์ |
|---|---|---|---|---|---|---|---|
`;
for (const r of rows) md += `| **${r.who}** ${r.handle} | ${r.date} | ${r.likes} | ${r.comments} | ${r.cap} | \`${r.file}\` | ${r.size} | [เปิด](${r.url}) |\n`;

fs.writeFileSync(INDEX, md);
console.log(`\n📇 สารบัญ: ${rows.length} คลิป · ${totalMB} MB → ${INDEX}`);
for (const r of rows) console.log(`   • ${r.who} ${r.handle} (${r.date}) ${r.size}`);

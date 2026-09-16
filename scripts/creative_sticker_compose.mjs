// 🥟 ประกอบสติกเกอร์เจ — วาง QR + ข้อความไทยจริงลงบนภาพอาร์ตเวิร์ก แล้วเรนเดอร์เป็นไฟล์พิมพ์
//
// ทำไมต้องมีตัวนี้: ตัวหนังสือที่ AI เจนมาในภาพมักเป็นเส้นหยักอ่านไม่ออก (พิมพ์แล้วแก้ไม่ได้)
// → ตัวนี้เอา "ข้อความจริง" วางทับเป็นตัวอักษรของระบบ + วาง QR เวกเตอร์ให้ได้ขนาดจริงเป๊ะ
//
// ใช้:
//   node scripts/creative_sticker_compose.mjs --art=<ไฟล์อาร์ตเวิร์ก> [ตัวเลือก]
//
// ตัวเลือก (มีค่าตั้งต้นให้หมด):
//   --art=PATH        ภาพพื้นหลัง (png/jpg) — ไม่ใส่ = ใช้พื้นครีมเปล่าเพื่อเทสระบบ
//   --qr=PATH         ไฟล์ QR (ค่าตั้งต้น C:\Users\PP\Desktop\qr_jay\qr_jay_print.svg)
//   --size=WxH        ขนาดสติกเกอร์จริงเป็นมิลลิเมตร (ค่าตั้งต้น 70x70)
//   --qrmm=N          ความกว้าง QR เป็นมิลลิเมตร (ค่าตั้งต้น 25 — ห้ามต่ำกว่า 20)
//   --pos=CORNER      มุมที่วาง QR: br | bl | tr | tl (ค่าตั้งต้น br)
//   --line1=ข้อความ    บรรทัดใต้ QR (ค่าตั้งต้น "น้อมสักการะ กิ้วอ๊วงฮุกโจ้ว")
//   --line2=ข้อความ    บรรทัดเล็ก (ค่าตั้งต้น "สแกนเพื่อสักการะ")
//   --badge=ข้อความ    ป้ายมุมบน (ค่าตั้งต้น "เจ 2569 · 10–18 ต.ค.")
//   --nobadge         ไม่ต้องใส่ป้าย (ถ้าอาร์ตเวิร์กมีป้ายอยู่แล้ว)
//   --out=PATH        ไฟล์ออก .png (ค่าตั้งต้น scratchpad/sticker_out.png) — ได้ .pdf คู่กันเสมอ
//   --dpi=N           ความละเอียดงานพิมพ์ (ค่าตั้งต้น 300)
//
// ออกให้ 2 ไฟล์: PNG ตามขนาดจริง+DPI · PDF ขนาดเท่าของจริง (โรงพิมพ์ชอบแบบนี้)

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const argOf = (k, d) => {
  const hit = process.argv.find(a => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const has = k => process.argv.includes(`--${k}`);

const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe",
                "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find(existsSync);
if (!CHROME) { console.error("❌ ไม่เจอ Chrome — เรนเดอร์ไม่ได้"); process.exit(1); }

const art    = argOf("art", "");
const qrPath = argOf("qr", "C:/Users/PP/Desktop/qr_jay/qr_jay_print.svg");
const [wmm, hmm] = argOf("size", "70x70").split("x").map(Number);
const qrmm   = Number(argOf("qrmm", "25"));
const pos    = argOf("pos", "br");
const line1  = argOf("line1", "น้อมสักการะ กิ้วอ๊วงฮุกโจ้ว");
const line2  = argOf("line2", "สแกนเพื่อสักการะ");
const badge  = argOf("badge", "เจ 2569 · 10–18 ต.ค.");
const dpi    = Number(argOf("dpi", "300"));
const out    = resolve(argOf("out", "C:/Users/PP/AppData/Local/Temp/claude/C--Users-PP-Desktop-under360-system/807d7c9a-69e9-4aa5-9f1c-37cdbc3c66fa/scratchpad/sticker_out.png"));

if (!(wmm > 0 && hmm > 0)) { console.error("❌ --size ผิดรูปแบบ ใช้แบบ 70x70"); process.exit(1); }
if (qrmm < 20) { console.error(`❌ QR ${qrmm} มม. เล็กเกินไป — กล้องมือถือจับยาก ห้ามต่ำกว่า 20 มม.`); process.exit(1); }

const dataUri = (p) => {
  const b = readFileSync(p);
  const ext = p.toLowerCase().split(".").pop();
  const mime = ext === "svg" ? "image/svg+xml" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${b.toString("base64")}`;
};
if (!existsSync(qrPath)) { console.error(`❌ ไม่เจอไฟล์ QR: ${qrPath}`); process.exit(1); }
if (art && !existsSync(art)) { console.error(`❌ ไม่เจอไฟล์อาร์ตเวิร์ก: ${art}`); process.exit(1); }

const corner = { br: "bottom:6mm; right:6mm;", bl: "bottom:6mm; left:6mm;",
                 tr: "top:6mm; right:6mm;",   tl: "top:6mm; left:6mm;" }[pos] || "bottom:6mm; right:6mm;";

const html = `<!doctype html><meta charset="utf-8"><style>
  @page { size: ${wmm}mm ${hmm}mm; margin: 0; }
  * { box-sizing: border-box; }
  html,body { margin:0; padding:0; }
  body { width:${wmm}mm; height:${hmm}mm; position:relative; overflow:hidden;
         font-family:"Leelawadee UI","Noto Sans Thai",Tahoma,sans-serif;
         background:${art ? "#fff" : "#FBF6EC"}; }
  .art { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
  /* กล่อง QR — พื้นขาวรอบ QR คือ "เขตเงียบ" ที่กล้องต้องใช้จับภาพ ห้ามให้ลายไปทับ */
  .qrbox { position:absolute; ${corner} background:#fff; border-radius:2mm;
           padding:2.5mm 2.5mm 2mm; text-align:center;
           box-shadow:0 0.4mm 1.2mm rgba(0,0,0,.18); }
  .qrbox img { display:block; width:${qrmm}mm; height:${qrmm}mm; }
  .l1 { margin-top:1.4mm; font-size:${(qrmm * 0.145).toFixed(2)}mm; font-weight:700; color:#1B2A6B; line-height:1.25; letter-spacing:.01em; }
  .l2 { margin-top:.5mm; font-size:${(qrmm * 0.115).toFixed(2)}mm; color:#5a6a86; line-height:1.2; }
  .badge { position:absolute; top:6mm; left:6mm; background:#E8721E; color:#fff;
           font-weight:700; font-size:${(wmm * 0.045).toFixed(2)}mm; padding:1.6mm 3mm; border-radius:99mm;
           box-shadow:0 0.4mm 1mm rgba(0,0,0,.2); }
</style>
${art ? `<img class="art" src="${dataUri(art)}">` : ""}
${has("nobadge") || !badge ? "" : `<div class="badge">${badge}</div>`}
<div class="qrbox">
  <img src="${dataUri(qrPath)}">
  ${line1 ? `<div class="l1">${line1}</div>` : ""}
  ${line2 ? `<div class="l2">${line2}</div>` : ""}
</div>`;

mkdirSync(dirname(out), { recursive: true });
const htmlPath = out.replace(/\.png$/i, "") + ".html";
writeFileSync(htmlPath, html, "utf8");

// หน้าต่างต้องสั่งเป็น "CSS พิกเซล" (1 นิ้ว = 96) แล้วให้ตัวคูณความละเอียดขยายอีกที
// ไม่งั้นหน้าเว็บจะเล็กกว่ากรอบภาพ แล้วงานไปกองอยู่มุมซ้ายบน (เคยพลาดมาแล้ว)
const cssW = Math.round((wmm / 25.4) * 96);
const cssH = Math.round((hmm / 25.4) * 96);
const scale = dpi / 96;
const pxW = Math.round(cssW * scale);
const pxH = Math.round(cssH * scale);
const url = "file:///" + htmlPath.replace(/\\/g, "/");
const pdfOut = out.replace(/\.png$/i, "") + ".pdf";

execFileSync(CHROME, ["--headless=old", "--disable-gpu", "--hide-scrollbars",
  `--window-size=${cssW},${cssH}`, `--force-device-scale-factor=${scale.toFixed(4)}`,
  `--screenshot=${out}`, url], { stdio: "ignore" });
execFileSync(CHROME, ["--headless=old", "--disable-gpu", "--no-pdf-header-footer",
  `--print-to-pdf=${pdfOut}`, url], { stdio: "ignore" });

const size = p => existsSync(p) ? (readFileSync(p).length / 1024).toFixed(0) + " KB" : "ไม่ออก";
console.log(`✅ สติกเกอร์ ${wmm}×${hmm} มม. · QR ${qrmm} มม. (มุม ${pos}) · ${dpi} dpi`);
console.log(`   PNG ${pxW}×${pxH} px  ${out}  (${size(out)})`);
console.log(`   PDF ขนาดเท่าของจริง  ${pdfOut}  (${size(pdfOut)})`);
if (!art) console.log("   ⚠️ ยังไม่ได้ใส่ --art= จึงเป็นพื้นเปล่า (ใช้เทสระบบเท่านั้น)");

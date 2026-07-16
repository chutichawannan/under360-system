// สไลซ์ eath-sheet.png → frames/write_N.png + sleep_N.png
// ลบพื้นหลังไล่เฉดด้วย flood-fill จากขอบ (หยุดที่เส้นขอบตัวละคร) แล้วตัดเฟรมด้วยช่องโปร่งใส
// รัน: node slice.js
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const TOL = 26;   // ความต่างสีที่ยังถือว่า "พื้นเดียวกัน" (ไล่เฉด) — เจอ jump ใหญ่=เส้นขอบ→หยุด
const GAP = 5;    // คอลัมน์โปร่งใสติดกัน >= นี้ = ช่องว่างระหว่างเฟรม
const SRC = path.join(__dirname, 'eath-sheet.png');
const OUT = path.join(__dirname, 'frames');

const png = PNG.sync.read(fs.readFileSync(SRC));
const { width: W, height: H, data: D } = png;
const N = W * H;

// ---- flood-fill พื้นหลังจากขอบทั้ง 4 ด้าน ----
const bg = new Uint8Array(N);
const stack = [];
const diff = (p, q) => Math.abs(D[p*4]-D[q*4]) + Math.abs(D[p*4+1]-D[q*4+1]) + Math.abs(D[p*4+2]-D[q*4+2]);
function seed(x, y) { const p = y*W + x; if (!bg[p]) { bg[p] = 1; stack.push(p); } }
for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H-1); }
for (let y = 0; y < H; y++) { seed(0, y); seed(W-1, y); }
while (stack.length) {
  const p = stack.pop(), x = p % W, y = (p / W) | 0;
  if (x > 0)   { const q = p-1; if (!bg[q] && diff(p,q) < TOL) { bg[q]=1; stack.push(q); } }
  if (x < W-1) { const q = p+1; if (!bg[q] && diff(p,q) < TOL) { bg[q]=1; stack.push(q); } }
  if (y > 0)   { const q = p-W; if (!bg[q] && diff(p,q) < TOL) { bg[q]=1; stack.push(q); } }
  if (y < H-1) { const q = p+W; if (!bg[q] && diff(p,q) < TOL) { bg[q]=1; stack.push(q); } }
}
let removed = 0;
for (let p = 0; p < N; p++) if (bg[p]) { D[p*4+3] = 0; removed++; }
console.log(`flood-fill ลบพื้น ${(100*removed/N).toFixed(1)}% ของภาพ`);

// debug: พื้นที่ถูกลบ = ชมพู, ตัวละครที่เหลือ = ปกติ
const dbg = new PNG({ width: W, height: H });
for (let p = 0; p < N; p++) {
  if (D[p*4+3] === 0) { dbg.data[p*4]=255; dbg.data[p*4+1]=0; dbg.data[p*4+2]=255; dbg.data[p*4+3]=255; }
  else { dbg.data[p*4]=D[p*4]; dbg.data[p*4+1]=D[p*4+1]; dbg.data[p*4+2]=D[p*4+2]; dbg.data[p*4+3]=255; }
}
fs.writeFileSync(path.join(__dirname, '_debug_cutout.png'), PNG.sync.write(dbg));

const opaque = (x, y) => D[(y*W + x)*4 + 3] > 20;

// ---- หาแถบสไปรต์ (2 แถวสูงสุดที่มี pixel ทึบ) ----
const rowHas = [];
for (let y = 0; y < H; y++) { let h = false; for (let x = 0; x < W; x++) if (opaque(x,y)) { h = true; break; } rowHas.push(h); }
const runs = []; let s = -1;
for (let y = 0; y <= H; y++) { if (y < H && rowHas[y]) { if (s<0) s=y; } else { if (s>=0) { runs.push([s,y-1]); s=-1; } } }
runs.sort((a,b) => (b[1]-b[0]) - (a[1]-a[0]));
const bands = runs.slice(0,2).sort((a,b) => a[0]-b[0]);
console.log('runs:', runs.map(r=>`${r[0]}-${r[1]}(h${r[1]-r[0]})`).join(' '));
console.log('bands:', bands);

function frames(y0, y1, n) {
  const cnt = new Array(W).fill(0);
  let xMin = W, xMax = 0;
  for (let x = 0; x < W; x++) {
    let c = 0; for (let y = y0; y <= y1; y++) if (opaque(x, y)) c++;
    cnt[x] = c; if (c > 0) { if (x < xMin) xMin = x; if (x > xMax) xMax = x; }
  }
  const span = (xMax - xMin + 1) / n;
  const cuts = [xMin];
  for (let k = 1; k < n; k++) {
    const exp = Math.round(xMin + k * span), win = Math.round(span * 0.35);
    let bx = exp, bc = Infinity;
    for (let x = exp - win; x <= exp + win; x++) {
      if (x <= xMin || x >= xMax) continue;
      if (cnt[x] < bc) { bc = cnt[x]; bx = x; }   // จุด pixel บางสุด = รอยตัด
    }
    cuts.push(bx);
  }
  cuts.push(xMax + 1);
  console.log(`  band ${y0}-${y1}: x ${xMin}-${xMax}, รอยตัด`, cuts.join(','));
  const out = [];
  for (let k = 0; k < n; k++) {
    const x0 = cuts[k], x1 = cuts[k + 1] - 1;
    let ty0 = y1, ty1 = y0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (opaque(x, y)) { if (y < ty0) ty0 = y; if (y > ty1) ty1 = y; break; }
    out.push({ x0, x1, y0: ty0, y1: ty1, w: x1 - x0 + 1, h: ty1 - ty0 + 1 });
  }
  return out;
}
function save(b, file) {
  const out = new PNG({ width: b.w, height: b.h });
  for (let y=0;y<b.h;y++) for (let x=0;x<b.w;x++) {
    const si=((b.y0+y)*W + (b.x0+x))*4, di=(y*b.w + x)*4;
    out.data[di]=D[si]; out.data[di+1]=D[si+1]; out.data[di+2]=D[si+2]; out.data[di+3]=D[si+3];
  }
  fs.writeFileSync(path.join(OUT, file), PNG.sync.write(out));
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
fs.readdirSync(OUT).forEach(f => f.endsWith('.png') && fs.unlinkSync(path.join(OUT, f)));
const wF = frames(bands[0][0], bands[0][1], 7);
const sF = frames(bands[1][0], bands[1][1], 8);
console.log(`writing: ${wF.length} เฟรม`, wF.map(f=>`${f.w}x${f.h}`).join(' '));
console.log(`sleeping: ${sF.length} เฟรม`, sF.map(f=>`${f.w}x${f.h}`).join(' '));
wF.forEach((b,i)=>save(b,`write_${i}.png`));
sF.forEach((b,i)=>save(b,`sleep_${i}.png`));
console.log(`✅ เซฟ ${wF.length+sF.length} เฟรม`);

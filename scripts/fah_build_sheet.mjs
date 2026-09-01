#!/usr/bin/env node
/**
 * สร้างใบงานครัว + ใบจัดของ จากข้อมูลจริงใน DB — ไม่มีใครพิมพ์ตัวเลขเอง
 *
 *   node scripts/fah_build_sheet.mjs 2026-09-02
 *
 * ทำไมถึงมีไฟล์นี้ (นัทสั่งเอง 30-31 ส.ค. 2026):
 *   *"ผลลัพธ์ที่ฉันอยากได้จริงๆคือ ใบงานที่ครัวทำแล้วไม่ผิด รายการไม่ขาด เมนูไม่มั่ว"*
 *   เดิมคนหรือ AI นั่งพิมพ์ตัวเลขลงใบ → ผิดได้เสมอ และใบเก่าทันทีที่คิวขยับ
 *   26 ส.ค. ใบออก 18:25 · แอดมินยกเลิก 6 รอบตอน 18:51-19:01 · ไม่มีใครทำใบใหม่
 *   → ครัวทำ 91 กล่อง ทั้งที่ยอดจริง 49 = **เหลือ 42 กล่อง**
 *   ตัวนี้ตัดคนพิมพ์ออก: ตัวเลขในใบ = ออเดอร์จริง เพราะอ่านมาจากที่เดียวกัน
 *
 * ใช้ไฟล์ล่าสุดใน kitchen/ เป็นแม่แบบ (เปลือกหน้า/CSS/ปุ่ม 3 ภาษา) แล้วแทนเฉพาะส่วนข้อมูล
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const DATE = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE || '')) {
  console.error('ใช้: node scripts/fah_build_sheet.mjs YYYY-MM-DD');
  process.exit(2);
}
const U = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const K = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const q = async p => (await fetch(`${U}/rest/v1/${p}`, { headers: { apikey: K, Authorization: 'Bearer ' + K } })).json();

const DOW = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const d = new Date(DATE + 'T00:00:00');
const dateTH = `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- ข้อมูลจริง ----------
const raw = await q(`mp_deliveries?select=id,order_id,customer_name,customer_note,mp_type,round_no,total_rounds,box_count,status,menu_items&delivery_date=eq.${DATE}&limit=100`);
const rows = raw.filter(r => r.status !== 'cancelled' && r.status !== 'skip_requested');
if (!rows.length) { console.error(`❌ วันที่ ${DATE} ไม่มีรอบส่งเลย — ไม่สร้างใบ`); process.exit(1); }
const ids = [...new Set(rows.map(r => r.order_id).filter(Boolean))];
const ords = ids.length ? await q(`orders?select=id,order_number,delivery_date,customer_phone&id=in.(${ids.join(',')})&limit=100`) : [];
const om = Object.fromEntries(ords.map(o => [o.id, o]));
const codes = [...new Set(rows.flatMap(r => (r.menu_items || []).map(i => String(i.code))))];
const mi = codes.length ? await q(`menu_items?select=code,name&code=in.(${codes.join(',')})&limit=300`) : [];
const nameOf = Object.fromEntries(mi.map(x => [x.code, x.name]));

// โปรตีนหลักของแต่ละเมนู — เดาจากชื่อ (ใช้แสดงผล + คำนวณกิโล)
const protOf = n => {
  const s = String(n || '');
  if (/ทูน่า/.test(s)) return 'ทูน่า';
  if (/แซลมอน|ปลาแซลมอน/.test(s)) return 'แซลมอน';
  if (/กุ้ง/.test(s)) return 'กุ้ง';
  if (/ปลากระพง|ปลาทู|ปลาซาบะ|ปลา/.test(s)) return 'ปลา';
  if (/เนื้อ(?!อ่อน)/.test(s)) return 'เนื้อวัว';
  if (/หมู/.test(s)) return 'หมู';
  if (/ไก่/.test(s)) return 'อกไก่';
  if (/เต้าหู้/.test(s)) return 'เต้าหู้';
  if (/ไข่/.test(s)) return 'ไข่';
  return 'อื่นๆ';
};

// ---------- รวมยอด ----------
const cust = [], cnt = {};
for (const r of rows) {
  const o = om[r.order_id] || {};
  const g = r.mp_type === 'lc' ? 'lc' : 'hp';
  const flat = [], disp = [];
  for (const i of (r.menu_items || [])) {
    const c = String(i.code || '').replace(/^(LC|HP|HX)/, '');
    const n = Number(i.qty) || 1;
    for (let k = 0; k < n; k++) flat.push(c);
    disp.push(n > 1 ? `${c}×${n}` : c);
    const key = c;
    (cnt[key] = cnt[key] || { lc: 0, hp: 0, name: nameOf[String(i.code)] || i.name || key })[g] += n;
  }
  const num = o.order_number || '';
  const mm = num.match(/-(\d{2})(\d{2})-/);
  const same = mm && `${mm[1]}${mm[2]}` === DATE.slice(5, 7) + DATE.slice(8, 10);
  const label = num ? (same ? num : `${num} · ส่ง ${DATE.slice(5, 7)}/${DATE.slice(8, 10)}`) : '(ไม่มีใบ)';
  cust.push({
    g, n: r.customer_name, note: r.customer_note || '',
    line: `${label}${o.customer_phone ? ' · ' + o.customer_phone : ''}`,
    box: r.box_count || flat.length, items: flat, disp: disp.join(','),
    round: `${r.round_no}/${r.total_rounds}`, over: r.round_no > r.total_rounds,
  });
}
cust.sort((a, b) => a.g.localeCompare(b.g) || a.n.localeCompare(b.n));
const order = Object.keys(cnt).sort((a, b) => (cnt[b].lc + cnt[b].hp) - (cnt[a].lc + cnt[a].hp) || a.localeCompare(b));
const totalBoxes = cust.reduce((s, c) => s + c.box, 0);
const lcB = cust.filter(c => c.g === 'lc').reduce((s, c) => s + c.box, 0), hpB = totalBoxes - lcB;
const lcN = cust.filter(c => c.g === 'lc').length, hpN = cust.length - lcN;
const people = new Set(cust.map(c => c.n)).size;

// ---------- แม่แบบ = ใบล่าสุดที่มี ----------
const files = readdirSync('kitchen').filter(f => /^\d{4}-\d{2}-\d{2}\.html$/.test(f)).sort();
const base = files.filter(f => f.slice(0, 10) < DATE).pop() || files[files.length - 1];
if (!base) { console.error('❌ ไม่มีไฟล์แม่แบบใน kitchen/'); process.exit(1); }
let P = readFileSync(`kitchen/${base}`, 'utf8');
let C2 = readFileSync(`kitchen/${base.replace('.html', '_pack.html')}`, 'utf8');
console.log(`📄 ใช้แม่แบบ kitchen/${base}`);

// ---------- ข้อห้ามที่ต้อง honor ----------
const rules = cust.filter(c => c.note && /❌|แพ้|ไม่ทาน|ไม่กิน|ไม่เอา|ไม่รับ|ขอเป็น/.test(c.note))
  .map(c => `<li>${esc(c.n)} — ${esc(c.note.replace(/\s*\n\s*/g, ' · ').replace(/"/g, ''))}</li>`);
cust.filter(c => c.over).forEach(c => rules.push(`<li>${esc(c.n)} — คอร์สขึ้นรอบ ${c.round} (เกินจำนวนที่ซื้อ) · ยังใส่กล่องให้ตามปกติ ห้ามตัดออก รอแอดมินเคลียร์</li>`));
if (!rules.length) rules.push('<li>วันนี้ไม่มีข้อห้ามรายคนที่บันทึกไว้ในระบบ — ถ้าเจอโน้ตในกล่อง ให้หยุดถามก่อน</li>');

// ---------- การ์ดเมนู ----------
const cards = order.map(c => {
  const x = cnt[c], t = x.lc + x.hp, p = protOf(x.name);
  let s = `<div class="m">\n  <div class="mh"><div class="nm"><div class="t1">${c}. ${esc(x.name)}</div><div style="color:#6B7280;font-size:11.5px">${p}</div></div><span class="tot">${t}</span></div>\n`;
  if (x.lc) s += `  <div class="ln lc"><span class="tag">LC</span><div class="d"><b>${p} 120g</b></div><span class="q">${x.lc}</span></div>\n`;
  if (x.hp) s += `  <div class="ln hp"><span class="tag">HP</span><div class="d"><b>${p} 170g</b></div><span class="q">${x.hp}</span></div>\n`;
  return s + '</div>';
}).join('\n');

// ---------- วัตถุดิบ ----------
const NO_MARGIN = new Set(['อกไก่']);          // นัทสั่ง: ห้ามเผื่อ ส่งวันต่อวัน ไม่มีที่เก็บ
const MARGIN_30 = new Set(['หมู', 'ปลา']);       // เผื่อ 30% เฉพาะหมู/ปลา
const kg = {};
order.forEach(c => { const x = cnt[c], p = protOf(x.name); kg[p] = (kg[p] || 0) + (x.lc * 0.12 + x.hp * 0.17); });
const ingRows = Object.entries(kg).sort((a, b) => b[1] - a[1]).map(([p, v]) => {
  const net = v.toFixed(2);
  let right;
  if (NO_MARGIN.has(p)) right = `<b style="color:#B91C1C">${net} กก. — ห้ามเผื่อ (ส่งวันต่อวัน ไม่มีที่เก็บ)</b>`;
  else if (MARGIN_30.has(p)) right = `<b style="color:#0F766E">${(v * 1.3).toFixed(2)} กก.</b>`;
  else right = 'ไม่เผื่อ (ซื้อตามยอดจริง)';
  return `  <tr><td>${p}</td><td><b>${net} กก.</b></td><td>${right}</td></tr>`;
}).join('\n');

// ---------- ประกอบใบผลิต ----------
const cut = (s, a, b, rep) => { const i = s.indexOf(a), j = s.indexOf(b); return (i < 0 || j < 0) ? s : s.slice(0, i) + rep + s.slice(j); };
P = P.replace(/(<h1>[^<]*<span data-i="title">)[^<]*(<\/span>)/, `$1ใบงานครัว — ${dateTH}$2`);
P = P.replace(/<div class="sub" data-i="sub">[^<]*<\/div>/, `<div class="sub" data-i="sub">${order.length} เมนู · ${totalBoxes} กล่อง — LC ${lcB} (${lcN} ใบ) · HP ${hpB} (${hpN} ใบ) — ${cust.length} ใบ / ${people} คน</div>`);
P = cut(P, '<ul>', '</ul>', '<ul>\n    ' + rules.join('\n    ') + '\n  ');
P = cut(P, '<div class="sec" data-i="secA">', '<div class="sec" data-i="secD">',
  `<div class="sec" data-i="secA">■ ${order.length} เมนูวันนี้ — ทุกคนได้จากชุดนี้เท่านั้น</div>\n\n${cards}\n\n`);
const trs = cust.map(c => `<tr class="g-${c.g}"><td class="who">${esc(c.n)}</td><td>${c.g.toUpperCase()}</td><td class="mn">${c.disp}</td><td>${c.box}</td></tr>`).join('\n');
P = cut(P, '<div class="sec" data-i="secD">', '<div class="foot">',
  `<div class="sec" data-i="secD">■ สรุป — ใครได้เมนูอะไรบ้าง (${totalBoxes} กล่อง — ${people} คน / ${cust.length} ใบ)</div>\n<div class="tw">\n<table>\n  <tr><th data-i="th1">ลูกค้า</th><th data-i="th2">แผน</th><th data-i="th3">เมนูที่ได้</th><th data-i="th4">กล่อง</th></tr>\n${trs}\n</table>\n</div>\n\n`);
P = P.replace(/<b data-i="f1">[^<]*<\/b>/, `<b data-i="f1">รวมทำสด ${totalBoxes} กล่อง</b>`);
P = P.replace(/<span data-i="f1b">[^<]*<\/span>/, `<span data-i="f1b"> — LC ${lcB} · HP ${hpB} — ${people} คน / ${cust.length} ใบ</span>`);
P = P.replace(/<span data-i="f3">[^<]*<\/span>/, `<span data-i="f3">ยอดนี้สร้างจากออเดอร์จริงโดยตรง ไม่มีใครพิมพ์ตัวเลขเอง</span>`);
P = P.replace(/<span data-i="f4">[^<]*<\/span>/, `<span data-i="f4">สร้างอัตโนมัติ ${new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ')} (เวลาไทย)</span>`);
P = P.replace(/data-i="secE">🥬[^<]*</, `data-i="secE">🥬 ยอดวัตถุดิบสั่งของ (Meal Plan ${totalBoxes} กล่อง — ไม่รวมสต็อค)<`);
{ const i = P.indexOf('data-i="secE"'); const a = P.indexOf('<tr><th>', i); const b = P.indexOf('</table>', i);
  if (a > 0 && b > a) P = P.slice(0, a) + `<tr><th>โปรตีนดิบ</th><th>สุทธิ</th><th>เผื่อ</th></tr>\n${ingRows}\n` + P.slice(b); }
// ตารางแปล — ตัวเลขไม่แปล (กฎครัว)
const setT = (k, th) => { P = P.replace(new RegExp(`(\\n\\s*${k}:\\{th:')[^']*(')`), `$1${th.replace(/'/g, '')}$2`); };
setT('title', `ใบงานครัว — ${dateTH}`);
setT('sub', `${order.length} เมนู · ${totalBoxes} กล่อง — LC ${lcB} · HP ${hpB} — ${cust.length} ใบ`);
setT('secA', `■ ${order.length} เมนูวันนี้`);
setT('secD', `■ สรุป — ใครได้เมนูอะไรบ้าง (${totalBoxes} กล่อง)`);
setT('secE', `🥬 ยอดวัตถุดิบสั่งของ (${totalBoxes} กล่อง)`);
setT('f1', `รวมทำสด ${totalBoxes} กล่อง`);
setT('f1b', ` — LC ${lcB} · HP ${hpB} — ${cust.length} ใบ`);
setT('f3', `ยอดนี้สร้างจากออเดอร์จริงโดยตรง`);
setT('f4', `สร้างอัตโนมัติจากระบบ`);
P = P.replace(/<div class="sec" data-i="secB">[\s\S]*?(?=<div class="sec" data-i="secD">)/, '');
writeFileSync(`kitchen/${DATE}.html`, P);

// ---------- ใบจัดของ ----------
const arr = 'var C = [\n' + cust.map(c => ` {g:'${c.g}', n:${JSON.stringify(c.n)}, line:${JSON.stringify(c.line)}, box:${c.box}, items:${JSON.stringify(c.items)}${c.note ? `, note:${JSON.stringify(c.note.replace(/\s*\n\s*/g, ' · '))}` : ''}}`).join(',\n') + '\n];';
C2 = C2.replace(/var C\s*=\s*\[[\s\S]*?\n\];/, arr);
C2 = C2.replace(/(<h1>[^<]*<span data-i="title">)[^<]*(<\/span>)/, `$1ใบจัดของ — ${dateTH}$2`);
C2 = C2.replace(/<div class="sub" data-i="sub">[^<]*<\/div>/, `<div class="sub" data-i="sub">${cust.length} ใบ · ${totalBoxes} กล่อง — Meal Plan ทำสด เท่านั้น — แตะติ๊กเมื่อจัดเสร็จ</div>`);
C2 = C2.replace(/<b data-i="f1">[^<]*<\/b>/, `<b data-i="f1">รวม ${totalBoxes} กล่อง — Meal Plan ทำสด เท่านั้น (LC ${lcB} · HP ${hpB})</b>`);
C2 = cut(C2, '<ul>', '</ul>', '<ul>\n    ' + rules.join('\n    ') + '\n  ');
C2 = C2.replace(/(KEY\s*=\s*')[^']*(')/, `$1pack${DATE.replace(/-/g, '')}$2`);
const setT2 = (k, th) => { C2 = C2.replace(new RegExp(`(\\n\\s*${k}:\\{th:')[^']*(')`), `$1${th.replace(/'/g, '')}$2`); };
setT2('title', `ใบจัดของ — ${dateTH}`);
setT2('sub', `${cust.length} ใบ · ${totalBoxes} กล่อง`);
writeFileSync(`kitchen/${DATE}_pack.html`, C2);

console.log(`\n✅ สร้างใบ ${DATE} (${dateTH})`);
console.log(`   ${cust.length} ใบ · ${people} คน · ${totalBoxes} กล่อง (LC ${lcB} · HP ${hpB}) · ${order.length} เมนู`);
console.log('   ' + order.map(c => `${c}:${cnt[c].lc + cnt[c].hp}`).join(' · '));
console.log(`   → kitchen/${DATE}.html · kitchen/${DATE}_pack.html\n`);

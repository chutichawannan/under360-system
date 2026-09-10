/**
 * รายชื่อคู่ S/D ที่ไม่ตรงกัน — ดึงสดจาก DB (ไม่ใช้เอกสารเก่า)
 * ตรวจอย่างเดียว ไม่แก้อะไร
 *
 * ที่มา: docs/WORKSHEET_SD_PAIRING.md + docs/AUDIT_SD_CODE_MISMATCH.md (ห้อง 05 ทำไว้ 16 ส.ค.)
 * รอบนี้ดึงใหม่เพราะ D131/D030 เพิ่งถูกแก้ไป 17 ส.ค.
 *
 * รัน: node scripts/niw/sd_pair_list.mjs
 */
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';

// ตัดคำนำหน้าที่บอกว่าเป็นข้าวกล่อง เพื่อเทียบ "ตัวจาน" กัน
const core = (s) => String(s || '')
  .replace(/^(ข้าว|ช้าว)/, '')
  .replace(/แบบกับข้าว/g, '')
  .replace(/[+\s\-·]/g, '')
  .toLowerCase();

/** คะแนนความเหมือน = สัดส่วนตัวอักษรร่วม (แบบหยาบแต่พอใช้กับชื่อไทย) */
function sim(a, b) {
  a = core(a); b = core(b);
  if (!a || !b) return 0;
  const short = a.length < b.length ? a : b;
  const long = a.length < b.length ? b : a;
  let hit = 0;
  for (let i = 0; i < short.length - 1; i++) if (long.includes(short.substr(i, 2))) hit++;
  return hit / Math.max(1, short.length - 1);
}

async function all() {
  const out = [];
  for (let f = 0; ; f += 1000) {
    const r = await fetch(SB + '/rest/v1/menu_items?select=code,name,price,is_available,subcode&order=code',
      { headers: { apikey: KEY, Range: f + '-' + (f + 999) } });
    const d = await r.json();
    if (!Array.isArray(d)) throw new Error(JSON.stringify(d).slice(0, 200));
    out.push(...d); if (d.length < 1000) break;
  }
  return out;
}

async function main() {
  const rows = await all();
  const S = rows.filter(x => /^S\d+$/.test(x.code));
  const D = rows.filter(x => /^D\d+$/.test(x.code));
  const dByNum = new Map(D.map(d => [d.code.slice(1), d]));

  const mismatch = [];
  for (const s of S) {
    const num = s.code.slice(1);
    const d = dByNum.get(num);
    const score = d ? sim(s.name, d.name) : 0;
    if (d && score >= 0.55) continue;                 // ตรงกันแล้ว ข้าม
    // หา D ที่ชื่อใกล้เคียงที่สุดในระบบ
    const best = D.map(x => ({ x, sc: sim(s.name, x.name) })).sort((a, b) => b.sc - a.sc)[0];
    mismatch.push({
      s, d, score,
      suggest: best && best.sc >= 0.6 ? best.x : null,
      suggestScore: best ? best.sc : 0,
      urgent: !!(s.is_available || (d && d.is_available)),
    });
  }

  const urgent = mismatch.filter(m => m.urgent);
  const later = mismatch.filter(m => !m.urgent);
  console.log('=== คู่ S/D ที่ไม่ตรงกัน (ดึงสด ' + new Date().toISOString().slice(0, 10) + ') ===');
  console.log('S ทั้งหมด ' + S.length + ' · D ทั้งหมด ' + D.length);
  console.log('ไม่ตรง/ไม่มีคู่ รวม ' + mismatch.length + ' → 🔴 มีฝั่งเปิดขาย ' + urgent.length + ' · ⚪ ปิดทั้งคู่ ' + later.length + '\n');

  const line = (m) => {
    const sOpen = m.s.is_available ? '🟢' : '  ';
    const dTxt = m.d ? (m.d.is_available ? '🟢' : '  ') + m.d.code + ' ' + String(m.d.name).slice(0, 26) : '   — ไม่มี D เลขนี้';
    const sug = m.suggest ? m.suggest.code + ' ' + String(m.suggest.name).slice(0, 26) + (m.suggest.is_available ? ' 🟢' : '') : '❌ ไม่มีในระบบ → ต้องสร้าง';
    console.log(sOpen + m.s.code.padEnd(6) + String(m.s.name).slice(0, 30).padEnd(32) + '│ ' + dTxt.padEnd(36) + '│ ' + sug);
  };

  console.log('🔴 ทำก่อน — มีฝั่งใดฝั่งหนึ่งเปิดขายอยู่ (' + urgent.length + ')');
  console.log('  S                                  │ D เลขเดียวกันตอนนี้                 │ คู่ที่ควรเป็น');
  console.log('  ' + '─'.repeat(105));
  urgent.forEach(line);

  console.log('\n⚪ ปิดขายทั้งคู่ — ทำทีหลัง (' + later.length + ' รายการ · ไม่พิมพ์ทั้งหมด แสดง 15 แรก)');
  later.slice(0, 15).forEach(line);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

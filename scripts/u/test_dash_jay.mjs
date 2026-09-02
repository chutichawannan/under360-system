/* เทสการ์ดคอร์สเจบนแดชบอร์ด — ดึง cardJay จริงจากไฟล์มารัน */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../command_center.html', import.meta.url), 'utf8');
const grab = (n) => {
  const i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; st = true; }
    else if (src[j] === '}') { d--; if (st && d === 0) return src.slice(i, j + 1); }
  }
};
let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};
const mk = (jayData) => new Function('jayData','BASE','baht',
  grab('cardJay') + '\n; return cardJay();')(jayData, 'https://x', n => '฿' + (n||0).toLocaleString());

const EB = { id:'eb', size:'JAY-EB', name:'Early Bird' };
const course = (num, total, pay, rounds) => ({
  head:{ id:'o'+num, order_number:num, total, payment_status:pay, created_at:'2026-09-0'+num[0] },
  pkg:EB, totalRounds:3,
  rounds: rounds.map((r,i)=>({no:i+1, date:r.d, boxes:r.b}))
});
const R3 = [{d:'2026-10-08',b:9},{d:'2026-10-11',b:12},{d:'2026-10-15',b:9}];

console.log('\n① ยังไม่เปิดขาย / ยังไม่มีคนจอง');
t('ไม่มีแพคเปิด = ไม่โชว์การ์ด', mk(null), '');
{
  const h = mk({ pkgs:[EB], courses:[], quota:{} });
  t('เปิดแล้วแต่ยังไม่มีใครจอง', /ยังไม่มีใครจอง/.test(h), true);
  t('มีลิงก์ใบสรุปเต็ม', /jay_orders\.html/.test(h), true);
}

console.log('\n② มีคนจองแล้ว');
{
  const cs = [ course('U-1008-001',4190,'paid',R3), course('U-1008-002',4490,'unpaid',R3) ];
  const h = mk({ pkgs:[EB], courses:cs, quota:{ eb:{limit:50,label:'Early Bird 50 คนแรก'} } });
  t('นับ 2 คอร์ส', /2 คอร์ส/.test(h), true);
  t('รวมเงิน 8,680', /฿8,680/.test(h), true);
  t('จ่ายแล้ว 1', /จ่ายแล้ว 1/.test(h), true);
  t('ค้าง 1 เป็นสีแดง', h.includes('ยังไม่ได้เงิน <b style="color:var(--r)">1</b>'), true);
  t('Early Bird เหลือ 48', />48<\/b> จาก 50/.test(h), true);
  t('รอบ 1 · 2 ใบ 18 กล่อง', /รอบ 1<\/b> 2026-10-08 — 2 ใบ · 18 กล่อง/.test(h), true);
  t('ครบทุกรอบ = ไม่มีคำว่าขาด', /ขาด \d+ ใบ/.test(h), false);
}

console.log('\n③ ใบรอบหาย — ต้องขึ้นแดง ไม่ใช่เงียบ');
{
  const cs = [ course('U-1008-001',4190,'paid',R3),
               course('U-1008-002',4490,'paid',[{d:'2026-10-08',b:9},{d:'2026-10-11',b:12}]) ];  // ขาดรอบ 3
  const h = mk({ pkgs:[EB], courses:cs, quota:{} });
  t('บอกว่ารอบ 3 ขาด 1 ใบ', h.includes('รอบ 3</b> 2026-10-15 — 1 ใบ · 9 กล่อง <b style="color:var(--r)">ขาด 1 ใบ</b>'), true);
}

console.log('\n④ โควตาเต็ม');
{
  const cs = Array.from({length:50},(_,i)=>course('U-1008-'+String(i+1).padStart(3,'0'),4190,'paid',R3));
  const h = mk({ pkgs:[EB], courses:cs, quota:{ eb:{limit:50,label:'Early Bird'} } });
  t('เหลือ 0 สิทธิ์', />0<\/b> จาก 50/.test(h), true);
}

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

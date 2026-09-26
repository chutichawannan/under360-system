/* เทสหน้าสรุปคอร์สเจ — ดึง build() จริงจากไฟล์มารัน (ห้ามเขียน logic ใหม่มาเทส) */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../pwa/jay_orders.html', import.meta.url), 'utf8');
const grab = (name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + name);
  let d = 0, started = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; started = true; }
    else if (src[j] === '}') { d--; if (started && d === 0) return src.slice(i, j + 1); }
  }
  throw new Error('อ่าน ' + name + ' ไม่จบ');
};
const build = new Function(grab('build') + '\n; return build;')();

let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); }
  else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};

const EB = 'aaaaaaaa-0000-0000-0000-000000000001';
const FU = 'bbbbbbbb-0000-0000-0000-000000000002';
const pkgs = [{ id: EB, size:'JAY-EB', name:'Early Bird' }, { id: FU, size:'JAY-FULL', name:'ราคาปกติ' }];

/* คอร์ส 1 (นก · EB) 3 ใบ · คอร์ส 2 (ต้น · ปกติ) 3 ใบ · +1 ใบรอบ 2 ที่หาต้นทางไม่เจอ */
const orders = [
  { id:'o1', order_number:'U-1008-001', customer_name:'นก', total:4190, payment_status:'paid',
    delivery_date:'2026-10-08', created_at:'2026-09-02T03:00:00Z', notes:'' },
  { id:'o2', order_number:'U-1011-001', customer_name:'นก', total:0, payment_status:'paid',
    delivery_date:'2026-10-11', created_at:'2026-09-02T03:00:01Z', notes:'คอร์ส Early Bird รอบ 2/3 — จ่ายรวมกับออเดอร์ U-1008-001' },
  { id:'o3', order_number:'U-1015-001', customer_name:'นก', total:0, payment_status:'paid',
    delivery_date:'2026-10-15', created_at:'2026-09-02T03:00:02Z', notes:'คอร์ส Early Bird รอบ 3/3 — จ่ายรวมกับออเดอร์ U-1008-001' },
  { id:'o4', order_number:'U-1008-002', customer_name:'ต้น', total:4490, payment_status:'unpaid',
    delivery_date:'2026-10-08', created_at:'2026-09-02T05:00:00Z', notes:'' },
  { id:'o5', order_number:'U-1011-002', customer_name:'ต้น', total:0, payment_status:'unpaid',
    delivery_date:'2026-10-11', created_at:'2026-09-02T05:00:01Z', notes:'คอร์ส ราคาปกติ รอบ 2/3 — จ่ายรวมกับออเดอร์ U-1008-002' },
  { id:'o6', order_number:'U-1015-002', customer_name:'ต้น', total:0, payment_status:'unpaid',
    delivery_date:'2026-10-15', created_at:'2026-09-02T05:00:02Z', notes:'คอร์ส ราคาปกติ รอบ 3/3 — จ่ายรวมกับออเดอร์ U-1008-002' },
  { id:'o9', order_number:'U-1011-099', customer_name:'ผี', total:0, payment_status:'unpaid',
    delivery_date:'2026-10-11', created_at:'2026-09-02T06:00:00Z', notes:'คอร์ส รอบ 2/3 — จ่ายรวมกับออเดอร์ U-9999-999' },
];
const mk = (oid, pkg, round, from, to) => {
  const a = [];
  for (let i = from; i <= to; i++)
    a.push({ order_id:oid, menu_code:'J'+String(i).padStart(2,'0'), menu_name:'เมนู '+i, quantity:1,
             notes:'pkg:'+pkg+':course:'+round+'/3' });
  return a;
};
const items = [].concat(
  mk('o1',EB,1,1,9), mk('o2',EB,2,10,21), mk('o3',EB,3,22,30),
  mk('o4',FU,1,1,9), mk('o5',FU,2,10,21), mk('o6',FU,3,22,30),
  mk('o9',FU,2,10,21),
);

console.log('\n① จับคู่ใบเป็นคอร์ส');
const d = build(pkgs, items, orders);
t('ได้ 2 คอร์ส', d.courses.length, 2);
t('ใบที่หาต้นทางไม่เจอ = 1', d.orphan.length, 1);
t('คอร์สแรก = นก (จองก่อน)', d.courses[0].head.customer_name, 'นก');
t('ลำดับจอง 1,2', d.courses.map(c=>c.seq), [1,2]);
t('นกได้ 3 รอบ', d.courses[0].rounds.map(r=>r.no), [1,2,3]);
t('นก 30 กล่อง', d.courses[0].boxes, 30);
t('รอบ 2 = 12 กล่อง', d.courses[0].rounds[1].items.length, 12);
t('รอบ 2 เมนูขึ้นต้น J10', d.courses[0].rounds[1].items[0].code, 'J10');
t('นก = Early Bird', d.courses[0].pkg.size, 'JAY-EB');
t('ต้น = ราคาปกติ', d.courses[1].pkg.size, 'JAY-FULL');
t('ยอดเงินอยู่ใบหลัก', d.courses.map(c=>c.head.total), [4190,4490]);

console.log('\n② คนเดียวจอง 2 คอร์ส ต้องแยกกัน (จับด้วยเลขใบหลัก ไม่ใช่ชื่อ)');
{
  const o2 = orders.map(o => ({...o, customer_name:'นก'}));
  const d2 = build(pkgs, items, o2);
  t('ยังได้ 2 คอร์ส', d2.courses.length, 2);
  t('คอร์ส 1 ใบหลัก U-1008-001', d2.courses[0].head.order_number, 'U-1008-001');
  t('คอร์ส 2 ใบหลัก U-1008-002', d2.courses[1].head.order_number, 'U-1008-002');
}

console.log('\n③ ใบรอบหาย = ต้องเห็น ไม่ใช่เงียบ');
{
  const d3 = build(pkgs, items.filter(x => x.order_id !== 'o3'), orders.filter(o => o.id !== 'o3'));
  t('นกเหลือ 2 รอบ', d3.courses[0].rounds.length, 2);
  t('แต่ยังรู้ว่าควรมี 3', d3.courses[0].totalRounds, 3);
}

console.log('\n④ ยังไม่มีใครจอง');
{
  const d4 = build(pkgs, [], []);
  t('0 คอร์ส ไม่พัง', d4.courses.length, 0);
}

console.log(`\n${fail? '❌':'✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail?1:0);

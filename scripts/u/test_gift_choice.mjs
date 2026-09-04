/* เทสของแถมแบบเลือกรสได้ — ดึงฟังก์ชันจริงจากไฟล์มารัน
   กฎที่สำคัญที่สุด: ลูกค้าไม่กดเลือก ต้องยังได้ของ ไม่ตกหล่นเงียบ */
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');
const grab = (n) => {
  const i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; st = true; }
    else if (src[j] === '}') { d--; if (st && d === 0) return src.slice(i, j + 1); }
  }
};
const body = ['giftSlotKey','orderGiftRules','giftResolve','orderGiftsEarned','orderGiftNext'].map(grab).join('\n');
let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, '\n     ได้ ', g, '\n     ควร ', w); }
};
const env = (total, gifts, picks) => new Function('cartTotal','orderGifts','localYMD','giftPick',
  body + '\n; return {orderGiftRules,giftResolve,orderGiftsEarned,orderGiftNext};')(
  () => total, gifts, () => '2026-09-04', picks || {});

/* โปรจริง 9.9 — นัทเคาะให้เลือกรสได้ */
const BB = { bb99: { label:'ซื้อครบ ฿1,999 รับฟรี BoneBroth', min_order:1999, expires_at:'2026-09-09',
  items:[{ name:'BoneBroth', qty:1, default:'BB01',
           choices:[{code:'BB01',name:'โบนบรอธไก่'},{code:'BB02',name:'โบนบรอธหมู'}] }] } };

console.log('\n① ลูกค้าไม่กดเลือก — ต้องได้ของ ไม่ตกหล่น');
{
  const e = env(2000, BB);
  const got = e.orderGiftsEarned();
  t('ได้ของแถม 1 ชิ้น', got.length, 1);
  t('ได้ตัว default (ไก่)', got[0].code, 'BB01');
  t('ชื่อไปกับรหัสที่เลือก', got[0].name, 'โบนบรอธไก่');
  t('ติดรหัสโปร', got[0].rule, 'bb99');
}

console.log('\n② ลูกค้าเลือกหมู');
{
  const e = env(2000, BB, { 'bb99:0': 'BB02' });
  const got = e.orderGiftsEarned();
  t('ได้หมูตามที่เลือก', got[0].code, 'BB02');
  t('ชื่อในใบครัวเปลี่ยนตาม', got[0].name, 'โบนบรอธหมู');
}
{
  const e = env(2000, BB, { 'bb99:0': 'BB99-ไม่มีจริง' });
  t('เลือกของที่ไม่มีในตัวเลือก = ถอยไป default', e.orderGiftsEarned()[0].code, 'BB01');
}
{
  const bad = { bb99: Object.assign({}, BB.bb99, { items:[Object.assign({}, BB.bb99.items[0], { default:'ไม่มีรหัสนี้' })] }) };
  t('default ตั้งผิด = เอาตัวแรก', env(2000, bad).orderGiftsEarned()[0].code, 'BB01');
}

console.log('\n③ ยอดยังไม่ถึง');
{
  const e = env(1500, BB);
  t('ยังไม่ได้ของ', e.orderGiftsEarned().length, 0);
  t('บอกว่าขาดอีก 499', e.orderGiftNext().need, 499);
  t('ข้อความชวนใช้ชื่อรสได้ ไม่ใช่ค่าว่าง', e.orderGiftNext().rule.items.map(e.giftResolve)[0].name, 'โบนบรอธไก่');
}

console.log('\n④ แบบเดิม (ระบุตัวเดียว ไม่มีตัวเลือก) ต้องไม่พัง');
{
  const one = { x: { min_order:1000, items:[{ code:'BB01', name:'โบนบรอธไก่', qty:2 }] } };
  const got = env(1200, one).orderGiftsEarned();
  t('ยังได้ของเหมือนเดิม', [got[0].code, got[0].qty], ['BB01', 2]);
  t('ไม่มีตัวเลือกให้กด', env(1200, one).orderGiftRules()[0].items[0].choices, undefined);
}

console.log('\n⑤ ตั้งค่าพัง — ห้ามแถมมั่ว ห้ามล้มหน้าร้าน');
t('choices ว่าง + ไม่มี code = ตัดทิ้ง', env(5000, { x:{ min_order:100, items:[{ qty:1, choices:[] }] } }).orderGiftsEarned(), []);
t('choices มี code ว่าง = ตัดตัวนั้น', env(5000, { x:{ min_order:100, items:[{ qty:1, choices:[{code:'',name:'ว่าง'},{code:'BB02',name:'หมู'}] }] } }).orderGiftsEarned()[0].code, 'BB02');
t('ไม่ได้ตั้งโปรเลย', env(5000, {}).orderGiftsEarned(), []);

console.log('\n⑥ หน้าจอ');
t('มีปุ่มให้กดเลือกรส', src.includes('onclick="pickGift('), true);
t('ปุ่มที่กำลังจะได้ติ๊กไว้', src.includes("const on = c.code === got.code;"), true);
t('บอกว่าไม่กดก็ได้', src.includes('ใส่ให้อัตโนมัติ ไม่ต้องกดอะไรก็ได้'), true);
t('ของแถมยังเขียนลงใบจริง', src.includes("notes: 'gift:order:' + g.rule"), true);

console.log(`\n${fail ? '❌' : '✅'} ผ่าน ${ok} · ตก ${fail}`);
process.exit(fail ? 1 : 0);

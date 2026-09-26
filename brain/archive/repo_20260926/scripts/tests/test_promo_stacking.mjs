import fs from 'fs';
// ดึงเฉพาะฟังก์ชันที่เกี่ยวกับการคิดเงินมาทดสอบตรรกะ (ไม่ต้องเปิดเบราว์เซอร์)
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url),'utf8');
function grab(name){
  const i = src.indexOf('function '+name+'(');
  if(i<0) throw new Error('ไม่เจอ '+name);
  let d=0, started=false;
  for(let j=i;j<src.length;j++){
    if(src[j]==='{'){d++;started=true;}
    else if(src[j]==='}'){d--; if(started&&d===0) return src.slice(i,j+1);}
  }
}
const code = [grab('isNewMemberCustomer'), grab('autoPromos'), grab('computeOrder')].join('\n');

const ctx = {
  customer:null, customerOrderCount:null, appliedPromos:[], SUB:0,
  cartTotal(){ return ctx.SUB; },
  deliveryFeeKnown(){ return true; },
  calcDeliveryFee(){ return 40; },
  distKm:5, selSlot:'',
  cartMatchesPromoScope(){ return true; },
  cartHasFreeShipping(){ return false; },
  refreshCouponUI(){},
};
const fn = new Function('ctx', `
  let {customer, customerOrderCount, appliedPromos, distKm, selSlot} = ctx;
  const cartTotal=ctx.cartTotal, deliveryFeeKnown=ctx.deliveryFeeKnown, calcDeliveryFee=ctx.calcDeliveryFee,
        cartMatchesPromoScope=ctx.cartMatchesPromoScope, cartHasFreeShipping=ctx.cartHasFreeShipping,
        refreshCouponUI=ctx.refreshCouponUI;
  ${code}
  return computeOrder();
`);

function run(label, sub, promos, cust, ordCount){
  ctx.SUB=sub; ctx.appliedPromos=promos; ctx.customer=cust; ctx.customerOrderCount=ordCount;
  const o=fn(ctx);
  console.log(label);
  console.log('   ยอดสินค้า', o.sub, '· โค้ดกรอกเอง -'+o.itemDisc, '· อัตโนมัติ -'+o.autoDisc,
    '· พักไว้:', (o.autoBlocked||[]).map(a=>a.code).join(',')||'-', '· เพราะโค้ด', o.autoBlockedBy||'-');
  console.log('   ค่าส่ง', o.feeAfter, '· ส่วนลดรวม', o.discount, '· ยอดจ่าย', o.total);
  return o;
}
const NEW  = {source_first:'line', tier:'', admin_notes:''};
const WW   = {source_first:'line', tier:'Wellness Warriors', admin_notes:''};
const BDAY = [{code:'BDAY08',discount_type:'fixed',discount_value:120,min_order:890,stackable:false,scope_type:'all'}];
const STACK= [{code:'STACKME',discount_type:'fixed',discount_value:20,min_order:0,stackable:true,scope_type:'all'}];

console.log('=== ลูกค้าใหม่ (WELCOME50 เข้าเงื่อนไข) ยอด 890 ===');
const a=run('1) ไม่ใส่โค้ด            ', 890, [],    NEW, 0);
const b=run('2) ใส่ BDAY08 (ห้ามซ้อน) ', 890, BDAY, NEW, 0);
const c=run('3) ใส่โค้ดที่ซ้อนได้      ', 890, STACK,NEW, 0);
console.log('\n=== ลูกค้า Wellness Warriors (WW5 5%) ยอด 890 ===');
const d=run('4) ไม่ใส่โค้ด            ', 890, [],    WW,  3);
const e=run('5) ใส่ BDAY08 (ห้ามซ้อน) ', 890, BDAY, WW,  3);

console.log('\n=== ตรวจผล ===');
const ok=[];
ok.push(['โปรอัตโนมัติยังทำงานเมื่อไม่มีโค้ด', a.autoDisc===50]);
ok.push(['BDAY08 ลด 120 เป๊ะ ไม่มีโปรทับ', b.itemDisc===120 && b.autoDisc===0 && b.discount===120]);
ok.push(['บอกลูกค้าว่าโปรถูกพักเพราะโค้ดไหน', b.autoBlockedBy==='BDAY08' && b.autoBlocked.length===1]);
ok.push(['โค้ดที่ซ้อนได้ ยังได้โปรอัตโนมัติ', c.itemDisc===20 && c.autoDisc===50]);
ok.push(['WW5 ทำงานปกติเมื่อไม่มีโค้ด', d.autoDisc===45]);
ok.push(['WW5 ถูกพักเมื่อใช้ BDAY08', e.autoDisc===0 && e.discount===120]);
ok.push(['ส่วนลดไม่กินค่าส่ง (ค่าส่ง 40 เต็ม)', b.feeAfter===40 && b.total===890-120+40]);
ok.forEach(([n,p])=>console.log((p?'  ✅ ':'  ❌ ')+n));
console.log(ok.every(x=>x[1]) ? '\nผ่านทั้งหมด' : '\nมีข้อที่ไม่ผ่าน');

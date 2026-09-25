import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root = new URL('../../', import.meta.url);
const html = fs.readFileSync(new URL('liff_customer.html',root),'utf8');
for(const file of ['liff_customer.html','operation_hub.html']) {
 const source=fs.readFileSync(new URL(file,root),'utf8');
 for(const m of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if(/\bsrc=|application\/ld\+json/i.test(m[1])) continue;
  new vm.Script(m[2],{filename:file});
 }
}
function fn(name){
 const start=html.indexOf('function '+name+'('); assert.ok(start>=0,name);
 const next=html.indexOf('\n}',start); return html.slice(start,next+2);
}
const context=vm.createContext({cart:[],appliedPromos:[],distKm:1,selSlot:null,
 cartTotal(){return context.cart.reduce((n,c)=>n+Number(c.price)*Number(c.qty),0)},
 deliveryFeeKnown:()=>true,calcDeliveryFee:()=>60,refreshCouponUI:()=>{},
 autoPromos:()=>[{type:'fixed',value:50}],packShipTarget:()=>null,isVipFriend:()=>false,giftCodeOn:()=>true});
vm.runInContext(['mpScopeHit','cartMatchesPromoScope','computeOrder','giftRuleMet','orderGiftNext'].map(fn).join('\n'),context);
const p={code:'COMEBACK100',scope_type:'a_la_carte',scope_mode:'include',scope_value:[],stackable:false,min_order:1000,discount_type:'fixed',discount_value:100};
const food=(price=1000)=>({code:'S106',price,qty:1});
function allowed(cart,promo=p){context.cart=cart;return context.cartMatchesPromoScope(promo)}
assert.equal(allowed([food()]),true);
assert.equal(allowed([food(999)]),false);
assert.equal(allowed([]),false);
for(const type of ['package','meal_plan','future_set']) {
 assert.equal(allowed([{...food(),type}]),false,type);
 assert.equal(allowed([food(),{...food(),type}]),false,'mixed '+type);
}
for(const extra of [{package_id:'set-new'},{mp_set:'S'},{code:null},{qty:0},{price:'bad'}]) assert.equal(allowed([{...food(),...extra}]),false);
assert.equal(allowed([food()],{...p,discount_value:151}),false);
assert.equal(allowed([food()],{...p,discount_value:150}),true);
assert.equal(allowed([food()],{...p,stackable:true}),false);
assert.equal(allowed([food()],{...p,discount_type:'free_shipping'}),false);
context.cart=[food()];context.appliedPromos=[p];
assert.equal(context.computeOrder().itemDisc,100);
assert.equal(context.computeOrder().autoDisc,0);
assert.equal(context.computeOrder().total,960);
assert.equal(context.giftRuleMet({min:500,codes:[]}),false);
assert.equal(context.orderGiftNext(),null);
context.cart.push({...food(),type:'package',package_id:'new-set'});
assert.equal(context.computeOrder().itemDisc,0);
assert.equal(context.appliedPromos.length,0);
context.cart=[food()];context.appliedPromos=[];
assert.equal(context.giftRuleMet({min:500,codes:[]}),true);
const legacy={scope_type:'package',scope_mode:'exclude',scope_value:['jay10']};
assert.equal(allowed([food()],legacy),true);
assert.equal(allowed([food(),{...food(),type:'package',package_id:'jay10'}],legacy),false);
assert.equal(allowed([{...food(),type:'package',package_id:'other'}],legacy),true);
console.log('PASS: inline syntax, food-only eligibility, mixed/new sets, minimum, 15% cap, no stacking/gifts, cart mutation and legacy exclusions');

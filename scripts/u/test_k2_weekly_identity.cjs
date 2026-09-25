const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(process.argv[2] || 'pwa/k2.html','utf8');
for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
function fn(name){const start=html.indexOf('function '+name+'(');assert(start>=0,name);let pos=html.indexOf('{',start),depth=1,end=pos+1;while(depth&&end<html.length){if(html[end]==='{')depth++;if(html[end]==='}')depth--;end++;}return html.slice(start,end);}
const old={id:'old',code:'S023',subcode:'S1',name:'ไก่ย่างตะไคร้',is_available:true,actual_stock:6,stock_total:4,category:'rice'};
const next={id:'next',code:'S106',subcode:'S1',name:'ปลาเพสโต้',is_available:true,actual_stock:0,stock_total:18,category:'rice'};
const c={thaiClock:()=>"",MENUS:[next,old],HIST:[{detail:{menu_id:'old',code:'S023'},summary:'S1 ไก่ย่าง'}],MENU_WEEKS:{S023:'2026-09-21',S106:'2026-09-28'},DAY:'2026-09-25',COUNT_SMART:false,COUNT_CAT:'all',COUNT_FOLD:{},bookedOpen:()=>({}),bookedOn:()=>({}),dPlus:()=>'',needCountToday:()=>false,catKey:()=> 'rice',catLabel:()=> 'ข้าวกล่อง',incOf:()=>null,esc:s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')};
vm.createContext(c);vm.runInContext(['shortCode','countGroups','countedMenu','countMenuLabel','countWeekLabel','viewCount'].map(fn).join('\n'),c);
assert.equal(c.countedMenu(old),true);assert.equal(c.countedMenu(next),false);
let out=c.viewCount();
for(const m of [old,next]){let row=out.split('data-menu-id="'+m.id+'"')[1].split('<div class="crow"')[0];assert(row.includes(m.code));assert(row.includes(m.name));assert(row.includes("saveCount('"+m.id+"'"));assert(row.includes('value="'+m.actual_stock+'"'));}
assert(out.includes('2026-09-21 – 2026-09-27'));assert(out.includes('2026-09-28 – 2026-10-04'));
assert(!html.includes('MENUS.find(m=>shortCode(m)===code)'));
assert.equal(old.actual_stock,6);assert.equal(next.actual_stock,0);
console.log('PASS: scripts parse; duplicate S1 preserves names, IDs, stock values, week labels and separate count history');

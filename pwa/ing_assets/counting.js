// Pure counting rules shared by the page and regression checks.
export function latestCounts(rounds) {
 const result=new Map();
 for(const r of [...rounds].sort((a,b)=>b.at.localeCompare(a.at)))
  for(const i of r.items)if(!result.has(i.key))result.set(i.key,{...i,at:r.at,by:r.by});
 return result;
}
export function ordered(items,latest,order='stock') {
 const rank=i=>!latest.has(i.key)?1:latest.get(i.key).qty>0?0:2;
 return [...items].sort((a,b)=>order==='name'?a.name.localeCompare(b.name,'th'):rank(a)-rank(b));
}
export function countItems(scope,values,complete) {
 if(new Set(scope.map(i=>i.key)).size!==scope.length)throw Error('Duplicate scope');
 return scope.filter(i=>complete||Object.hasOwn(values,i.key)).map(i=>{
  const qty=Object.hasOwn(values,i.key)?values[i.key]:0;
  if(typeof qty!=='number'||!Number.isFinite(qty)||qty<0)throw Error('Invalid count');
  return {key:i.key,name:i.name,unit:i.unit,qty};
 });
}
export function validateAssignments(staff,items) {
 const keys=staff.flatMap(s=>s.item_keys);
 if(new Set(staff.map(s=>s.id)).size!==staff.length||keys.length!==items.length||new Set(keys).size!==items.length||items.some(i=>!keys.includes(i.key)))throw Error('Incomplete assignment');
}

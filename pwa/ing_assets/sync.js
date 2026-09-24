// Each round has its own immutable identity: retries never create duplicate rounds.
const endpoint='https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1/kitchen_data';
const key='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
const prefix='ing_count_v1_';
async function request(query,options={}){
 const response=await fetch(endpoint+query,{...options,headers:{...headers,...options.headers},cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Stock sync HTTP '+response.status);
 return response.status===204?null:response.json();
}
function clean(r){
 if(!r||typeof r.id!=='string'||!/^[a-f0-9-]{36}$/.test(r.id)||!Number.isFinite(Date.parse(r.at))||typeof r.by!=='string'||!Array.isArray(r.items)||!r.items.length)throw new Error('Invalid round');
 const items=r.items.map(i=>{if(typeof i.key!=='string'||typeof i.name!=='string'||typeof i.unit!=='string'||typeof i.qty!=='number'||!Number.isFinite(i.qty)||i.qty<0)throw new Error('Invalid count');return {key:i.key,name:i.name,unit:i.unit,qty:i.qty};});
 const result={id:r.id,at:r.at,by:r.by,note:String(r.note||''),dataset:String(r.dataset||'phase2-239'),items};
 if(r.counting){
  const c=r.counting,strings=a=>Array.isArray(a)&&a.every(k=>typeof k==='string')&&new Set(a).size===a.length;
  if(typeof c.staffId!=='string'||typeof c.assignmentVersion!=='string'||typeof c.complete!=='boolean'||!strings(c.scopeKeys)||!strings(c.enteredKeys)||!Number.isFinite(Date.parse(c.startedAt))||!Number.isInteger(c.activeSeconds)||c.activeSeconds<0||new Set(items.map(i=>i.key)).size!==items.length||items.some(i=>!c.scopeKeys.includes(i.key))||c.enteredKeys.some(k=>!items.some(i=>i.key===k))||c.complete&&items.length!==c.scopeKeys.length||!c.complete&&items.length!==c.enteredKeys.length||items.some(i=>!c.enteredKeys.includes(i.key)&&i.qty!==0))throw new Error('Invalid counting metadata');
  result.counting={staffId:c.staffId,assignmentVersion:c.assignmentVersion,scopeKeys:c.scopeKeys,complete:c.complete,enteredKeys:c.enteredKeys,startedAt:c.startedAt,activeSeconds:c.activeSeconds};
 }
 return result;
}
export async function saveRound(round){
 const data=clean(round),rowKey=prefix+data.id;
 await request('?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify({key:rowKey,data,updated_at:new Date().toISOString()})});
 const saved=await request('?select=data&key=eq.'+encodeURIComponent(rowKey));
 if(saved?.length!==1||JSON.stringify(clean(saved[0].data))!==JSON.stringify(data))throw new Error('Round readback mismatch');
}
export async function loadRounds(){
 const rounds=[];
 for(let offset=0;;offset+=500){
  const rows=await request('?select=data&key=like.ing%5Fcount%5Fv1%5F*&order=key.asc&limit=500&offset='+offset);
  if(!Array.isArray(rows))throw new Error('Invalid history response');
  rounds.push(...rows.map(row=>clean(row.data)));
  if(rows.length<500)return rounds;
 }
}

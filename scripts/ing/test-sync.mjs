import assert from 'node:assert/strict';
import {saveRound,loadRounds} from '../../pwa/ing_assets/sync.js';
const round={id:'12345678-1234-1234-1234-123456789abc',at:new Date().toISOString(),by:'ทดสอบ',note:'',dataset:'phase2-239',items:[{key:'one',name:'น้ำมันงา',unit:'g',qty:0}]};
let rows=[],offline=false,drop=false;
globalThis.fetch=async(url,opts)=>{
 if(offline)throw new Error('offline');
 if(opts.method==='POST'){if(!drop&&!rows.length)rows.push({data:structuredClone(JSON.parse(opts.body).data)});return new Response(JSON.stringify(rows));}
 return new Response(JSON.stringify(rows));
};
await saveRound(round);await saveRound(round);assert.equal(rows.length,1);assert.equal((await loadRounds())[0].items[0].qty,0);
offline=true;await assert.rejects(saveRound(round));offline=false;
rows=[];drop=true;await assert.rejects(saveRound(round),/readback/);
await assert.rejects(saveRound({...round,items:[{...round.items[0],qty:-1}]}),/Invalid count/);
rows=[{data:{...round,items:[{...round.items[0],qty:10}]}}];await assert.rejects(saveRound(round),/mismatch/);
console.log('PASS: roundtrip, retry deduplication, zero, offline, rejected write, invalid quantity, conflicting ID');

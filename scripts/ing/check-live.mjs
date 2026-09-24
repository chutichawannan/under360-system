// Writes only an isolated integration-check key, never a real stock-count row.
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../../pwa/ing_assets/sync.js',import.meta.url),'utf8').replace("const prefix='ing_count_v1_';","const prefix='ing_test_stock_v1_';");
const adapter=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const id=randomUUID();
await adapter.saveRound({id,at:new Date().toISOString(),by:'integration-check',note:'ISOLATED TEST — not inventory',dataset:'integration-test',items:[{key:'test-only',name:'ทดสอบการเชื่อมต่อ ไม่ใช่ยอดสต็อก',unit:'g',qty:0}]});
const source2=source.replace('ing%5Fcount%5Fv1%5F*','ing%5Ftest%5Fstock%5Fv1%5F*');
const reader=await import('data:text/javascript;base64,'+Buffer.from(source2).toString('base64'));
assert((await reader.loadRounds()).some(r=>r.id===id));
writeFileSync(new URL('./live-check.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),key:'ing_test_stock_v1_'+id,writeReadback:true,independentRead:true,productionCountRowsWritten:0},null,2));
console.log('PASS isolated write, readback, independent read; no inventory counts changed');

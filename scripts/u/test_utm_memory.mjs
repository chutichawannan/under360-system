/* 🧪 test_utm_memory — ที่มาของออเดอร์ "จำไว้กับตัวลูกค้า" (06 Ads → u · นัทเคาะ 11 ก.ย. 2569)
 *
 * เคสที่ต้องรอด: ลูกค้ากดแอด → เปิด LIFF → ปิด → วันหลังกลับมาทางริชเมนู (URL ไม่มี utm) → สั่ง
 *               → ออเดอร์ต้องยังรู้ว่ามาจากแอดไหน ถ้ายังไม่เกิน 7 วัน
 * กติกาเหล็ก: ไม่มี utm ต้องสั่งได้เหมือนเดิม · utm สดชนะของที่จำไว้ · ไม่มีเลย = "ไม่ทราบที่มา" ไม่ใช่ว่าง
 *
 * วิธี: ดึงฟังก์ชันจริงออกมาจาก liff_customer.html แล้วรันกับฐานข้อมูลปลอมในหน่วยความจำ (ไม่แตะของจริง)
 * รัน: node scripts/u/test_utm_memory.mjs
 */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');

let pass = 0, fail = 0;
const ok = (n, c, extra) => { if (c) { pass++; console.log('  ✅ ' + n); } else { fail++; console.log('  ❌ ' + n + (extra ? '  → ' + extra : '')); } };

function grab(name) {
  const sig = src.indexOf('async function ' + name + '(') >= 0 ? 'async function ' + name + '(' : 'function ' + name + '(';
  const i = src.indexOf(sig);
  if (i < 0) return null;
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; st = true; }
    else if (src[j] === '}') { d--; if (st && d === 0) return src.slice(i, j + 1); }
  }
  return null;
}
const constLine = (name) => (src.match(new RegExp('^const ' + name + ' = [^;]+;', 'm')) || [null])[0];

const names = ['utmRead', 'utmTag', 'utmContent', 'utmMemTag', 'utmRemember', 'utmMemWait'];
const bodies = names.map(grab);
const consts = ['UTM_MAX_AGE_DAYS', 'UTM_MEM_PREFIX', 'UTM_UNKNOWN_TAG'].map(constLine);

console.log(NL + '0) ดึงของจริงจากไฟล์');
names.forEach((n, i) => ok('เจอฟังก์ชัน ' + n, !!bodies[i]));
consts.forEach((c, i) => ok('เจอค่าคงที่ ' + ['UTM_MAX_AGE_DAYS', 'UTM_MEM_PREFIX', 'UTM_UNKNOWN_TAG'][i], !!c));
if (bodies.some(b => !b) || consts.some(c => !c)) { console.log(NL + '❌ ดึงไม่ครบ หยุดเทส'); process.exit(1); }

const DAY = 86400000;
/* ฐานข้อมูลปลอม — จำลอง sb.from('kitchen_data') เฉพาะที่ฟังก์ชันใช้ */
function makeDb(opts = {}) {
  const rows = {};
  const writes = [];
  const sb = {
    from(table) {
      if (opts.throws) throw new Error('db ล่ม');
      const q = {
        _key: null,
        upsert(row) { writes.push(row); rows[row.key] = row.data; return Promise.resolve({ error: null }); },
        select() { return q; },
        eq(col, v) { q._key = v; return q; },
        maybeSingle() { return Promise.resolve({ data: q._key in rows ? { data: rows[q._key] } : null, error: null }); },
      };
      if (table !== 'kitchen_data') throw new Error('ไม่ควรแตะตาราง ' + table);
      return q;
    },
  };
  return { sb, rows, writes };
}
/* เปิด LIFF 1 รอบ = โหลดฟังก์ชันใหม่ (ตัวแปร utmMem เริ่มว่างเหมือนเปิดแอปใหม่จริง) */
function openLiff({ search = '', uid = 'U1', db, stored = null }) {
  const store = { u360_utm: stored ? JSON.stringify(stored) : null };
  const ctx = {
    location: { search },
    localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    URLSearchParams,
    lineProfile: uid ? { userId: uid } : null,
    sb: db ? db.sb : undefined,
  };
  const code = consts.join(NL) + NL + 'let utmMem = null; let utmMemReady = null;' + NL + bodies.join(NL) + NL
    + 'return { utmTag, utmContent, utmMemTag, utmRemember, utmMemWait, UTM_UNKNOWN_TAG, UTM_MAX_AGE_DAYS,'
    + '  setReady: p => { utmMemReady = p; }, mem: () => utmMem };';
  return new Function(...Object.keys(ctx), code)(...Object.values(ctx));
}
/* จำลองตอนกดสั่ง — ตรรกะเดียวกับบล็อกใน submit (เทสข้อ 6 ยืนยันว่าไฟล์จริงเขียนแบบนี้) */
async function submitTag(app) {
  await app.utmMemWait();
  const fresh = app.utmTag();
  if (fresh) return { source_campaign: fresh, source_content: app.utmContent() };
  const mem = app.utmMemTag();
  return mem ? { source_campaign: mem.tag, source_content: mem.content } : { source_campaign: app.UTM_UNKNOWN_TAG };
}

console.log(NL + '1) เคสจริงที่ 06 ยก — กดแอดวันแรก กลับมาทางริชเมนูวันหลัง');
{
  const db = makeDb();
  const day1 = openLiff({ search: '?utm_source=fb&utm_medium=paid&utm_campaign=jay2026-d6&utm_content=d6', db });
  await day1.utmRemember();
  ok('วันแรก: จำลง kitchen_data คีย์ utm:U1 ทันทีที่เปิด (ยังไม่ต้องสั่ง)', db.rows['utm:U1'] && db.rows['utm:U1'].campaign === 'jay2026-d6');
  const day3 = openLiff({ search: '', db });           // เปิดแอปใหม่ ไม่มี utm · localStorage ว่าง
  await day3.utmRemember();
  const o = await submitTag(day3);
  ok('วันที่ 3: สั่งผ่านริชเมนู → ยังติดที่มาแอด', o.source_campaign === 'fb/paid/jay2026-d6', JSON.stringify(o));
  ok('วันที่ 3: ชิ้นงานโฆษณาติดมาด้วย (d6)', o.source_content === 'd6', JSON.stringify(o));
}

console.log(NL + '2) หน้าต่าง 7 วัน');
{
  const app = openLiff({ search: '' });
  ok('ค่าคงที่หน้าต่าง = 7 วัน', app.UTM_MAX_AGE_DAYS === 7, String(app.UTM_MAX_AGE_DAYS));
  const db6 = makeDb(); db6.rows['utm:U1'] = { source: 'fb', medium: 'paid', campaign: 'c', ts: Date.now() - 6 * DAY };
  const a6 = openLiff({ db: db6 }); await a6.utmRemember();
  ok('จำไว้ 6 วัน → ยังนับ', (await submitTag(a6)).source_campaign === 'fb/paid/c');
  const db8 = makeDb(); db8.rows['utm:U1'] = { source: 'fb', medium: 'paid', campaign: 'c', ts: Date.now() - 8 * DAY };
  const a8 = openLiff({ db: db8 }); await a8.utmRemember();
  ok('จำไว้ 8 วัน → ไม่นับ → "ไม่ทราบที่มา"', (await submitTag(a8)).source_campaign === 'direct/none');
  const dbNoTs = makeDb(); dbNoTs.rows['utm:U1'] = { source: 'fb', campaign: 'c' };
  const an = openLiff({ db: dbNoTs }); await an.utmRemember();
  ok('ของที่จำไว้ไม่มีเวลา → ไม่นับ (กันข้อมูลพังเคลมยอด)', (await submitTag(an)).source_campaign === 'direct/none');
}

console.log(NL + '3) utm สดชนะของที่จำไว้เสมอ (last-touch)');
{
  const db = makeDb(); db.rows['utm:U1'] = { source: 'fb', medium: 'paid', campaign: 'old', ts: Date.now() - 1 * DAY };
  const app = openLiff({ search: '?utm_source=google&utm_medium=cpc&utm_campaign=jay2026-g1', db });
  await app.utmRemember();
  ok('จำทับด้วยของใหม่', db.rows['utm:U1'].campaign === 'jay2026-g1');
  ok('ใบนี้ติดที่มาใหม่ ไม่ใช่ของเก่า', (await submitTag(app)).source_campaign === 'google/cpc/jay2026-g1');
  const bc = openLiff({ search: '?utm_source=line&utm_medium=broadcast&utm_campaign=jay2026-bc1', db: makeDb() });
  await bc.utmRemember();
  ok('ลิงก์บรอดแคสต์ของ 05 ใช้กลไกเดียวกัน', (await submitTag(bc)).source_campaign === 'line/broadcast/jay2026-bc1');
}

console.log(NL + '4) ไม่มีที่มาเลย = บันทึกชัด ไม่ใช่ปล่อยว่าง');
{
  const app = openLiff({ db: makeDb() }); await app.utmRemember();
  const o = await submitTag(app);
  ok('ลูกค้าเข้าเอง → direct/none', o.source_campaign === 'direct/none', JSON.stringify(o));
  ok('"ไม่ทราบที่มา" ไม่ถูกหน้า /ads นับเป็นแอด (ไม่ขึ้นต้น fb/paid/)', o.source_campaign.indexOf('fb/paid/') !== 0);
  ok('ไม่ถูกนับเป็น Google (ไม่ขึ้นต้น google/)', o.source_campaign.indexOf('google/') !== 0);
  ok('ไม่ถูกนับเป็น KOL (ไม่ขึ้นต้น kol/)', o.source_campaign.indexOf('kol/') !== 0);
  const db = makeDb();
  const liffInternal = openLiff({ search: '?utm_source=liff&utm_medium=app&utm_campaign=order', db });
  await liffInternal.utmRemember();
  ok("แท็กภายใน utm_source=liff ไม่ถูกจำเป็นที่มา", !('utm:U1' in db.rows));
}

console.log(NL + '5) พังตรงไหน = แค่ไม่รู้ที่มา ห้ามทำให้สั่งไม่ได้');
{
  const noUid = openLiff({ uid: null, search: '?utm_source=fb', db: makeDb() });
  let threw = false; try { await noUid.utmRemember(); } catch (e) { threw = true; }
  ok('ไม่มี line_uid → ไม่พัง', !threw);
  const noSb = openLiff({ search: '?utm_source=fb' });
  threw = false; try { await noSb.utmRemember(); } catch (e) { threw = true; }
  ok('ไม่มี supabase → ไม่พัง', !threw);
  const dead = openLiff({ search: '', db: makeDb({ throws: true }) });
  threw = false; try { await dead.utmRemember(); } catch (e) { threw = true; }
  ok('ฐานข้อมูลล่ม → ไม่พัง และสั่งต่อได้เป็น "ไม่ทราบที่มา"', !threw && (await submitTag(dead)).source_campaign === 'direct/none');
  const slow = openLiff({ search: '' });
  slow.setReady(new Promise(() => {}));                 // โหลดค้างไม่มีวันเสร็จ
  const t0 = Date.now(); await slow.utmMemWait(); const waited = Date.now() - t0;
  ok('ฐานข้อมูลช้า → ลูกค้ารอไม่เกิน ~1.5 วิ แล้วสั่งต่อได้', waited >= 1400 && waited < 2500, waited + ' ms');
  const never = openLiff({ search: '' });
  const t1 = Date.now(); await never.utmMemWait();
  ok('ยังไม่เคยเรียกจำที่มา → ไม่ต้องรอเลย', Date.now() - t1 < 50);
}

console.log(NL + '6) ไฟล์จริงเขียนตามนี้ และไม่ไปทำของเดิมพัง');
ok('เรียกจำที่มาตอนเปิดแอป หลังรู้ตัวลูกค้า และไม่ await (ไม่ทำให้หน้าเปิดช้า)',
   /hasSourceContentColumn = !val\(scR\)\.error;[^\n]*\n\s*try\{ utmRemember\(\); \}catch\(e\)\{\}/.test(src));
ok('รอของที่จำไว้ก่อนสร้างที่มาในใบ', /try\{ await utmMemWait\(\); \}catch\(e\)\{\}[^\n]*\n\s*try\{\n\s*const _utm = utmTag\(\);/.test(src));
ok('บรรทัดเดิมที่เทสเก่าล็อกไว้ยังอยู่ครบ', src.includes('if(_utm) orderPayload.source_campaign = _utm;'));
ok('ไม่มีที่มาสด → ใช้ที่จำไว้ → ไม่มีเลย = UTM_UNKNOWN_TAG',
   /if\(!_utm\)\{\s*\n\s*const _mem = utmMemTag\(\);\s*\n\s*orderPayload\.source_campaign = _mem \? _mem\.tag : UTM_UNKNOWN_TAG;/.test(src));
ok('ชิ้นงานจากที่จำไว้ใส่เฉพาะตอนมีคอลัมน์ source_content', /_mem && _mem\.content && hasSourceContentColumn/.test(src));
ok('ไม่แตะ orders.source (finance/orders.mjs ใช้กรองยอดขาย)', !/orderPayload\.source\s*=/.test(src));
ok('ไม่แตะ customers.source_campaign (เก็บที่มาเดิมของลูกค้าเก่า)', !/from\('customers'\)[^\n]*source_campaign/.test(src));
ok('เก็บที่ kitchen_data เท่านั้น ไม่ต้องรัน SQL', /from\('kitchen_data'\)\.upsert\(\{ key: UTM_MEM_PREFIX \+ uid/.test(src));

console.log(NL + '────────────────────────────');
console.log(fail ? '❌ ตก ' + fail + ' ข้อ · ผ่าน ' + pass : '✅ ผ่านทั้งหมด ' + pass + ' ข้อ');
if (fail) process.exitCode = 1;

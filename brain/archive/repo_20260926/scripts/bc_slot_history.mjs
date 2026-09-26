/* ประวัติช่องเมนูรายสัปดาห์ S1–S8 / D1–D5 — สะสม ไม่ทับของเก่า (ห้อง 05 · 11 ก.ย. 2569)
 *
 *   node scripts/bc_slot_history.mjs snapshot 2026-09-14 [map.json]   บันทึกว่าสัปดาห์นี้ช่องไหน = เมนูอะไร
 *   node scripts/bc_slot_history.mjs sold                              เติมยอดขาย 7 วันให้สัปดาห์ที่จบแล้ว
 *   node scripts/bc_slot_history.mjs show                              ดูประวัติทั้งหมด
 *
 * ทำไมต้องมี — เจอจริง 10 ก.ย.:
 *   คิดสต็อคครัวรายช่องไม่ได้ เพราะ weekly_subcode_plan เก็บแค่ 3 สัปดาห์ และถูกเขียนทับได้
 *   05 เคยอ้าง "สถิติรายช่อง 30 สัปดาห์" ที่ทำซ้ำไม่ได้ = อ้างตัวเลขที่ไม่มีใครตรวจสอบได้
 *   -> คีย์นี้ "เพิ่มอย่างเดียว" · สัปดาห์ที่มียอดขายแล้วห้ามแก้ช่อง (ยกเว้นสั่ง --force)
 *
 * ที่เก็บ: kitchen_data คีย์ 'weekly_slot_history'
 *   { "2026-09-14": { "at": ISO, "slots": { "S1": {code,name,price}, ... }, "sold7d": { "S1": 5, ... } | null } }
 *
 * ⚠️ exit code: ไม่ใช้ process.exit() ตรงๆ — บน Windows แครช UV_HANDLE_CLOSING คืน 127 (เจอจริง 11 ก.ย.)
 */
import fs from 'fs';

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY = (fs.readFileSync('CLAUDE.md', 'utf8').match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[A-Za-z0-9._-]+/) || [])[0];
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };
const HIST = 'weekly_slot_history';
const SLOTS = ['S1','S2','S3','S4','S5','S6','S7','S8','D1','D2','D3','D4','D5'];

async function all(path) {
  let out = [], from = 0;
  for (;;) {
    const r = await fetch(SB + '/rest/v1/' + path + '&limit=1000&offset=' + from, { headers: H });
    const j = await r.json().catch(() => null);
    if (!Array.isArray(j)) { console.error('query ไม่สำเร็จ:', JSON.stringify(j).slice(0, 160)); return out; }
    out = out.concat(j);
    if (j.length < 1000) break;
    from += 1000;
  }
  return out;
}
async function load() {
  const r = await fetch(SB + `/rest/v1/kitchen_data?select=data&key=eq.${HIST}`, { headers: H });
  const j = await r.json().catch(() => []);
  return (Array.isArray(j) && j[0] && j[0].data) || {};
}
async function save(data) {
  const r = await fetch(SB + '/rest/v1/kitchen_data', {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ key: HIST, data }),
  });
  if (!r.ok) { console.error('บันทึกไม่สำเร็จ', r.status, await r.text()); return null; }
  return await load(); // อ่านกลับยืนยัน — กันเคส "ได้ 2xx แต่ไม่ได้เขียนจริง" (เคยเจอกับ RLS)
}

async function main() {
  const [cmd, week, mapPath] = process.argv.slice(2);
  const force = process.argv.includes('--force');

  if (cmd === 'snapshot') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week || '')) { console.error('ใช้: snapshot 2026-09-14 [map.json]'); return 1; }
    const hist = await load();
    if (hist[week] && hist[week].sold7d && !force) {
      console.error(`🔴 สัปดาห์ ${week} มีบันทึกพร้อมยอดขายแล้ว ห้ามทับ (ประวัติต้องเพิ่มอย่างเดียว)`); return 1;
    }
    let map = {};
    if (mapPath) map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    else {
      const rows = await all(`menu_items?select=code,subcode&available_from=eq.${week}&subcode=not.is.null`);
      rows.forEach(r => { map[r.subcode] = r.code; });
    }
    const codes = SLOTS.map(s => map[s]).filter(Boolean);
    if (!codes.length) { console.error('🔴 ไม่มีข้อมูลช่องเลย (subcode ว่าง และไม่ได้ส่งไฟล์แผน)'); return 1; }
    const menus = await all(`menu_items?select=code,name,price&code=in.(${codes.join(',')})`);
    const slots = {};
    SLOTS.forEach(s => { const c = map[s]; if (!c) return; const m = menus.find(x => x.code === c) || {};
      slots[s] = { code: c, name: m.name || null, price: m.price ?? null }; });
    const prev = hist[week];
    hist[week] = { at: new Date().toISOString(), slots, sold7d: null, source: mapPath ? 'map-file' : 'subcode' };
    const back = await save(hist);
    const ok = !!(back && back[week] && Object.keys(back[week].slots).length === Object.keys(slots).length);
    console.log((ok ? '✅' : '🔴') + ` บันทึกสัปดาห์ ${week} · ${Object.keys(slots).length} ช่อง` + (prev ? ' (แทนบันทึกเดิมที่ยังไม่มียอดขาย)' : ''));
    return ok ? 0 : 1;
  }

  if (cmd === 'sold') {
    const hist = await load();
    const now = Date.now();
    const todo = Object.keys(hist).filter(w => !hist[w].sold7d && new Date(w + 'T00:00:00Z').getTime() + 7 * 864e5 <= now);
    if (!todo.length) { console.log('ไม่มีสัปดาห์ที่จบแล้วและยังไม่มียอดขาย'); return 0; }
    const since = todo.sort()[0];
    const ord = await all(`orders?select=id,created_at,total&created_at=gte.${since}`);
    const om = new Map(ord.filter(o => Number(o.total) > 0).map(o => [o.id, String(o.created_at).slice(0, 10)]));
    for (const w of todo) {
      const start = new Date(w + 'T00:00:00Z'), end = new Date(start.getTime() + 7 * 864e5);
      const codes = Object.values(hist[w].slots).map(x => x.code);
      const items = await all(`order_items?select=order_id,menu_code,quantity&menu_code=in.(${codes.join(',')})`);
      const sold = {};
      Object.entries(hist[w].slots).forEach(([s, v]) => {
        sold[s] = items.filter(x => x.menu_code === v.code && om.has(x.order_id))
          .filter(x => { const d = new Date(om.get(x.order_id) + 'T00:00:00Z'); return d >= start && d < end; })
          .reduce((a, x) => a + (Number(x.quantity) || 1), 0);
      });
      hist[w].sold7d = sold;
      console.log(`สัปดาห์ ${w}: ` + Object.entries(sold).map(([s, n]) => `${s}=${n}`).join(' '));
    }
    const back = await save(hist);
    const ok = !!(back && todo.every(w => back[w] && back[w].sold7d));
    console.log(ok ? '✅ เติมยอดขายแล้ว' : '🔴 อ่านกลับแล้วไม่พบยอดขาย — บันทึกไม่ติด');
    return ok ? 0 : 1;
  }

  if (cmd === 'show') {
    const hist = await load();
    const ws = Object.keys(hist).sort();
    console.log(`ประวัติช่อง ${ws.length} สัปดาห์`);
    ws.forEach(w => {
      const h = hist[w];
      console.log(`\n${w}  (${h.source}${h.sold7d ? ' · มียอดขาย' : ' · ยังไม่มียอดขาย'})`);
      SLOTS.forEach(s => { const v = h.slots[s]; if (!v) return;
        console.log(`  ${s.padEnd(3)} ${v.code.padEnd(5)} ${String(v.name || '').slice(0, 30).padEnd(30)} ${h.sold7d ? 'ขาย ' + h.sold7d[s] : ''}`); });
    });
    return 0;
  }

  console.error('ใช้: snapshot <วันจันทร์> [map.json] · sold · show');
  return 1;
}

main().then(code => { process.exitCode = code; })
      .catch(e => { console.error('🔴 พัง:', e && e.message || e); process.exitCode = 2; });

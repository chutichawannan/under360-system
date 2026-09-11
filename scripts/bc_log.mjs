/* Under360 — สมุดบันทึกแคมเปญ LINE (event log)
 *
 * ทำไมต้องมี: รอบ 19 ส.ค. ยิงไป 4 ใบแล้ว "วัดไม่ได้จริง"
 *   เพราะโค้ด THANKS200 ถูกใช้โดยคนที่ไม่ได้อยู่ในกลุ่มที่เรายิงให้สักคน
 *   → ถ้าไม่จำว่า "ยิงให้ใครบ้าง" ก็แยกไม่ออกว่าเงินมาจากแคมเปญ หรือมาเอง
 *
 * เก็บที่: kitchen_data คีย์ bc:<รหัสใบ>  (ไม่ต้องสร้างตารางใหม่ ไม่ต้องรอใครรัน SQL)
 * รูปแบบ: { id, name, code, audienceGroupId, uids:[...], events:[{ts,type,...}] }
 * ชนิด event: prepared · fired · failed · measured
 */
import fs from 'fs';

const KEY = (fs.readFileSync('CLAUDE.md', 'utf8').match(/eyJ[A-Za-z0-9._-]{60,}/) || [])[0];
const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

export const now = () => new Date().toISOString();

export async function read(id) {
  const r = await fetch(`${SB}/kitchen_data?select=data&key=eq.bc:${id}`, { headers: H });
  const j = await r.json();
  return Array.isArray(j) && j[0] ? j[0].data : null;
}

export async function write(id, data) {
  const r = await fetch(`${SB}/kitchen_data`, {
    method: 'POST',
    headers: { ...H, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ key: 'bc:' + id, data }),
  });
  if (!r.ok) throw new Error('เขียนสมุดไม่สำเร็จ: HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return true;
}

/** เพิ่ม 1 บรรทัดลงสมุด — ไม่เคยลบของเก่า */
export async function log(id, type, extra = {}) {
  const d = (await read(id)) || { id, events: [] };
  d.events = d.events || [];
  d.events.push({ ts: now(), type, ...extra });
  await write(id, d);
  return d;
}

/** บันทึกว่าใบนี้ "ยิงให้ใครบ้าง" — หัวใจของการวัดผล */
export async function recordSend(id, { name, code, audienceGroupId, uids, sentAt, via }) {
  const d = (await read(id)) || { id, events: [] };
  Object.assign(d, { id, name, code, audienceGroupId, uids, sentAt: sentAt || now() });
  d.events = d.events || [];
  d.events.push({ ts: now(), type: 'fired', via: via || 'script', n: uids.length, code });
  await write(id, d);
  return d;
}

export async function list() {
  const r = await fetch(`${SB}/kitchen_data?select=key,data&key=like.bc:*`, { headers: H });
  const j = await r.json();
  return (Array.isArray(j) ? j : []).map((x) => x.data).filter(Boolean);
}

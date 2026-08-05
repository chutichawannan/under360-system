// จับคู่สมาชิก Hato (member.csv จากรายงานรอบสุดท้าย) เข้ากับตาราง customers ของเรา
// output: download/hato_final/member_matched.csv (พร้อมเอาไปอัปเดต birthday/points/tier)
// รัน: "C:\Program Files\nodejs\node.exe" scripts/cc_member_match.mjs
import fs from 'node:fs';

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const BASE = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const DIR = 'download/hato_final';

const normPhone = (p) => {
  let x = String(p || '').replace(/[^0-9]/g, '');
  if (x.startsWith('66') && x.length >= 11) x = '0' + x.slice(2);
  if (x.length === 9) x = '0' + x;
  return x.length >= 9 ? x : '';
};

// --- CSV parser (รองรับ quote + คอมมาในค่า) ---
function parseCsv(text) {
  const rows = [];
  let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  const hdr = rows.shift();
  return rows.filter(r => r.length === hdr.length).map(r => Object.fromEntries(hdr.map((h, i) => [h.replace(/^\uFEFF/, ''), r[i]])));
}

// --- 1) ดึง customers ทั้งตาราง (paginate — 1000-cap) ---
const customers = [];
for (let off = 0; off < 20000; off += 1000) {
  const r = await fetch(`${BASE}/customers?select=id,line_uid,phone&limit=1000&offset=${off}&order=id`, { headers: H });
  const j = await r.json();
  if (!Array.isArray(j) || j.length === 0) break;
  customers.push(...j);
  if (j.length < 1000) break;
}
console.log('customers ใน DB:', customers.length);

const byUid = new Map(), byPhone = new Map();
for (const c of customers) {
  if (c.line_uid) byUid.set(c.line_uid, c.id);
  const p = normPhone(c.phone);
  if (p && !byPhone.has(p)) byPhone.set(p, c.id);
}
console.log(`  มี line_uid ${byUid.size} · เบอร์ไม่ซ้ำ ${byPhone.size}`);

// --- 2) อ่านสมาชิก Hato ---
const members = parseCsv(fs.readFileSync(`${DIR}/member.csv`, 'utf8'));
console.log('สมาชิก Hato:', members.length);

let hitU = 0, hitP = 0, miss = 0;
const out = [];
for (const m of members) {
  let cid = null, how = '';
  if (m.line_uid && byUid.has(m.line_uid)) { cid = byUid.get(m.line_uid); how = 'uid'; hitU++; }
  else {
    const p = normPhone(m.phone);
    if (p && byPhone.has(p)) { cid = byPhone.get(p); how = 'phone'; hitP++; }
    else miss++;
  }
  if (cid) out.push({
    customer_id: cid, matched_by: how,
    birthday: m.date_of_birth || '', points: m.total_points || '0',
    tier: (m.member_tier || '').replace(/&amp;/g, '&'),
    hato_member_id: m.member_id || '', line_uid: m.line_uid || '',
    registered_at: m.registered_at_date || '', phone: m.phone || '',
  });
}
console.log(`จับคู่ได้: line_uid ${hitU} · เบอร์ ${hitP} · ไม่เจอ ${miss}`);

const cols = Object.keys(out[0] || { customer_id: '' });
const csv = [cols.join(','), ...out.map(o => cols.map(c => `"${String(o[c]).replace(/"/g, '""')}"`).join(','))].join('\n');
fs.writeFileSync(`${DIR}/member_matched.csv`, '\uFEFF' + csv, 'utf8');
console.log(`-> ${DIR}/member_matched.csv (${out.length} แถว)`);

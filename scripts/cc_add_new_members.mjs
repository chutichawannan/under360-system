// เพิ่มสมาชิก Hato ที่สมัครหลังรอบ migrate แต่ยังไม่มีใน customers
// (23 คน · สมัคร 25 มิ.ย.–4 ส.ค. 2026 · มี line_uid ครบ = ยิง LINE ถึง)
// รัน dry-run: node scripts/cc_add_new_members.mjs   |   จริง: --apply
import fs from 'node:fs';

const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const B = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
const APPLY = process.argv.includes('--apply');

function parseCsv(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  const h = rows.shift();
  return rows.filter(r => r.length === h.length).map(r => Object.fromEntries(h.map((x, i) => [x.replace(/^﻿/, ''), r[i]])));
}
const np = p => { let x = String(p || '').replace(/[^0-9]/g, ''); if (x.startsWith('66') && x.length >= 11) x = '0' + x.slice(2); if (x.length === 9) x = '0' + x; return x.length >= 9 ? x : ''; };

const cust = [];
for (let off = 0; off < 20000; off += 1000) {
  const r = await fetch(`${B}/customers?select=id,line_uid,phone&limit=1000&offset=${off}&order=id`, { headers: H });
  const j = await r.json(); if (!j.length) break; cust.push(...j); if (j.length < 1000) break;
}
const uid = new Set(cust.filter(c => c.line_uid).map(c => c.line_uid));
const ph = new Set(cust.map(c => np(c.phone)).filter(Boolean));

const members = parseCsv(fs.readFileSync('download/hato_final/member.csv', 'utf8'));
const miss = members.filter(r => !(r.line_uid && uid.has(r.line_uid)) && !ph.has(np(r.phone)));

const payload = miss.map(r => ({
  phone: np(r.phone),
  line_uid: r.line_uid || null,
  display_name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || null,
  email: r.email || null,
  date_of_birth: r.date_of_birth || null,
  gender: (r.gender && r.gender !== 'Unknown') ? r.gender : null,
  member_id: r.member_id || null,
  tier: (r.member_tier || '').replace(/&amp;/g, '&') || null,
  loyalty_points: Number(r.total_points || 0),
  source_first: 'hato',
  admin_notes: `[HATO FINAL PULL 5ส.ค.2026] สมาชิกสมัคร ${r.registered_at_date} หลังรอบ migrate — ยังไม่เคยสั่งในระบบเรา`,
}));

console.log(`จะเพิ่ม ${payload.length} คน`);
console.log(payload.slice(0, 3).map(p => ` ${p.display_name} | ${p.phone} | เกิด ${p.date_of_birth}`).join('\n'));
if (!APPLY) { console.log('\n[DRY RUN] ใส่ --apply เพื่อเขียนจริง'); process.exit(0); }

let ok = 0, fail = 0;
for (const p of payload) {
  const r = await fetch(`${B}/customers`, { method: 'POST', headers: H, body: JSON.stringify(p) });
  if (r.ok) ok++; else { fail++; if (fail <= 3) console.log(' fail', p.phone, r.status, (await r.text()).slice(0, 160)); }
}
console.log(`เพิ่มสำเร็จ ${ok} · ล้มเหลว ${fail}`);

import getKapanToken from "./_kapan_token.js";
// ============================================================
//  กะปันพูด — ให้ห้อง PM/เลขา ส่งข้อความกลับเข้าไลน์นัทได้
//  POST /api/kapan-say  { "key": "...", "text": "..." }
//  ใช้ตอนนัทสั่งงานผ่านไลน์แล้วเลขาทำเสร็จ ต้องรายงานกลับ
//  🔒 ส่งได้เฉพาะหา OWNER (นัท) เท่านั้น — ส่งหาคนอื่นไม่ได้เลย
// ============================================================
const OWNER = process.env.OWNER_LINE_USER_ID || 'Ucc982b971a6676e02ecac6d668723003';
const KEY   = process.env.KAPAN_SAY_KEY || 'kapan-pm-2026';
const SB    = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const SRV   = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// 🛡️ ส่งเข้ากลุ่มได้เฉพาะกลุ่มที่กะปัน 'อยู่จริง' เท่านั้น
//    เช็คจากตาราง line_group_messages (ถ้าไม่เคยมีข้อความจากกลุ่มนี้ = กะปันไม่ได้อยู่ = ไม่ส่ง)
//    กันเคสพิมพ์ groupId ผิดแล้วข้อความไปโผล่ผิดกลุ่ม
async function knownGroup(gid) {
  if (!SRV || !gid) return false;
  try {
    const r = await fetch(SB + '/line_group_messages?select=group_id&group_id=eq.' + encodeURIComponent(gid) + '&limit=1',
      { headers: { apikey: SRV, Authorization: 'Bearer ' + SRV } });
    const j = await r.json();
    return Array.isArray(j) && j.length > 0;
  } catch { return false; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('ok');

  let body = '';
  await new Promise(r => { req.on('data', c => body += c); req.on('end', r); });

  let j; try { j = JSON.parse(body || '{}'); } catch { return res.status(400).json({ ok: false }); }
  if (j.key !== KEY) return res.status(401).json({ ok: false });

  // ยาวเกิน = ตัดเป็นชุดๆ ส่งต่อกัน ไม่ใช่ตัดทิ้ง (นัทสั่ง 16 ส.ค.: "ถ้ามันยาวเกิน ต่อ 2 ชุดสิ")
  //    เดิมตัดที่ 700 ตัวอักษร -> ข้อความในกลุ่มแอดมินขาดกลางคัน เหลือ 3 ข้อจาก 4
  const toGroup = String(j.group || "").trim();
  const CHUNK = toGroup ? 1800 : 900;
  const MAXPARTS = 5;
  const full = String(j.text || "").trim();
  if (!full) return res.status(400).json({ ok: false, why: "ไม่มีข้อความ" });

  const parts = [];
  let cur = "";
  for (const line of full.split("\n")) {
    if ((cur + "\n" + line).length > CHUNK && cur) { parts.push(cur); cur = line; }
    else cur = cur ? cur + "\n" + line : line;
  }
  if (cur) parts.push(cur);
  const use = parts.slice(0, MAXPARTS);
  if (parts.length > MAXPARTS) use[MAXPARTS - 1] += "\n\n(ยังมีต่ออีก " + (parts.length - MAXPARTS) + " ชุด)";
  const msgs = use.map((t, n) => ({ type: "text",
    text: use.length > 1 ? t + "\n\n— (" + (n + 1) + "/" + use.length + ")" : t }));

  let target = OWNER;
  if (toGroup) {
    if (!(await knownGroup(toGroup)))
      return res.status(400).json({ ok: false, why: "กะปันไม่ได้อยู่ในกลุ่มนี้ — ต้องเชิญเข้ากลุ่มก่อน" });
    target = toGroup;
  }

  const token = await getKapanToken();
  if (!token) return res.status(500).json({ ok: false, why: "ยังไม่ได้ตั้ง token" });

  try {
    const r = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ to: target, messages: msgs }),
    });
    return res.status(200).json({ ok: r.ok, status: r.status, ชุด: msgs.length, ปลายทาง: toGroup ? 'กลุ่ม' : 'นัท' });
  } catch (e) {
    return res.status(500).json({ ok: false, why: String(e) });
  }
}

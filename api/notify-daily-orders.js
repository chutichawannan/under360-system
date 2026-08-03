/* Under360 — สรุปออเดอร์พรุ่งนี้ ส่งเข้า LINE (Messaging API ของ OA ร้าน)

   ⏸️ ปิดไว้ตามที่นัทสั่ง 28 ก.ค. 2026: "ไม่ต้องการให้เด้ง — ที่ต้องการคือเข้าถึงข้อมูลสะดวก"
      → เอา cron ออกจาก vercel.json แล้ว (โค้ดยังอยู่ · เปิดคืนได้ทันทีด้วยการเติมบรรทัดเดียว)
      { "path": "/api/notify-daily-orders", "schedule": "0 14 * * *" }   // 14:00 UTC = 21:00 น. ไทย
   เรียกมือ/ทดสอบได้ตลอด: /api/notify-daily-orders?dry=1
   ⚠️ LINE Notify ปิดบริการแล้ว (2025) — ใช้ push ของ Messaging API เท่านั้น

   ENV ที่ต้องมี:
   - LINE_CHANNEL_ACCESS_TOKEN  = token ของ Messaging API channel (OA ร้าน)
   - ORDERS_NOTIFY_TO           = ปลายทาง คั่นด้วย , (userId ของนัท และ/หรือ groupId ของกลุ่มทีม)
   ทดสอบ: เปิด /api/notify-daily-orders?dry=1 → เห็นข้อความที่จะส่ง โดยยังไม่ส่งจริง */

const SUPABASE_URL = "https://zdartbvhbvqlwzwyyiia.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8";
const PWA_URL = "https://under360-system.vercel.app/pwa/orders_upcoming.html";

const TH_DAY = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];
const TH_MON = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

// วันที่ตามเวลาไทยเสมอ (Vercel cron รันเป็น UTC)
function bkkDate(offsetDays) {
  const now = new Date(Date.now() + (offsetDays || 0) * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}
function fmtThai(iso) {
  const d = new Date(iso + "T00:00:00Z");
  return `${TH_DAY[d.getUTCDay()]} ${d.getUTCDate()} ${TH_MON[d.getUTCMonth()]}`;
}

function sbGet(path) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
  });
}
function pushLine(token, to, text) {
  return fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ to, messages: [{ type: "text", text }] }),
  });
}

// Meal Plan = code ขึ้นต้น HP/LC หรือ notes 'meal_plan:' · เซ็ต/แพค = notes 'pkg:'
function classify(items) {
  let boxes = 0, hp = false, lc = false, pkg = false;
  for (const it of items) {
    boxes += it.quantity || 1;
    const code = (it.menu_code || "").toUpperCase();
    const nt = it.notes || "";
    if (/^HP/.test(code) || /^meal_plan:hp/i.test(nt)) hp = true;
    if (/^LC/.test(code) || /^meal_plan:lc/i.test(nt)) lc = true;
    if (/^pkg:/i.test(nt)) pkg = true;
  }
  return { boxes, hp, lc, pkg, isMP: hp || lc };
}

async function buildMessage(dateIso) {
  const oResp = await sbGet(
    `orders?delivery_date=eq.${dateIso}` +
    `&select=id,order_number,customer_name,line_display_name,delivery_date,time_slot_label,status,payment_status,total`
  );
  if (!oResp.ok) throw new Error(`orders fetch ${oResp.status}`);
  const orders = (await oResp.json()).filter((o) => (o.status || "") !== "cancelled");

  const itemsBy = {};
  const ids = orders.map((o) => o.id);
  for (let s = 0; s < ids.length; s += 120) {
    const part = ids.slice(s, s + 120);
    const iResp = await sbGet(
      `order_items?order_id=in.(${part.join(",")})&select=order_id,menu_code,quantity,notes&limit=4000`
    );
    if (!iResp.ok) throw new Error(`order_items fetch ${iResp.status}`);
    for (const it of await iResp.json()) (itemsBy[it.order_id] = itemsBy[it.order_id] || []).push(it);
  }

  const head = `สรุปออเดอร์ ${fmtThai(dateIso)} (พรุ่งนี้)`;
  if (!orders.length) return `${head}\n\nยังไม่มีออเดอร์\n\n${PWA_URL}`;

  let boxAll = 0, hpN = 0, lcN = 0, stN = 0, unpaid = 0;
  const mpLines = [], stLines = [];
  for (const o of orders) {
    const c = classify(itemsBy[o.id] || []);
    boxAll += c.boxes;
    if (o.payment_status !== "paid") unpaid++;
    const name = o.customer_name || o.line_display_name || "(ไม่ระบุชื่อ)";
    const slot = o.time_slot_label ? ` ${o.time_slot_label}` : "";
    const line = `• ${name} — ${c.boxes} กล่อง${slot}`;
    if (c.isMP) {
      if (c.hp) hpN++;
      if (c.lc) lcN++;
      mpLines.push(`${line}${c.hp ? " [HP]" : ""}${c.lc ? " [LC]" : ""}`);
    } else {
      stN++;
      stLines.push(`${line}${c.pkg ? " [เซ็ต/แพค]" : ""}`);
    }
  }

  let msg = `${head}\n\nรวม ${orders.length} ออเดอร์ · ${boxAll} กล่อง`;
  msg += hpN || lcN ? `\nMeal Plan: HP ${hpN} / LC ${lcN} · สต็อค-เซ็ต ${stN}` : `\n(ไม่มี Meal Plan · สต็อค-เซ็ต ${stN})`;
  if (unpaid) msg += `\nรอโอน ${unpaid} ออเดอร์`;
  if (mpLines.length) msg += `\n\n[Meal Plan ทำสด]\n${mpLines.join("\n")}`;
  if (stLines.length) msg += `\n\n[สต็อค / เซ็ต-แพคเกจ]\n${stLines.join("\n")}`;
  msg += `\n\nดูเต็ม: ${PWA_URL}`;
  return msg;
}


// 🔒 กันคนนอกยิง endpoint นี้ (เดิมใครรู้ URL ก็เรียกได้ = สั่ง push LINE / เผาโควตาได้ไม่จำกัด) — เพิ่ม 3 ส.ค. 2026
// Vercel Cron ส่ง Authorization: Bearer <CRON_SECRET> มาให้อัตโนมัติเมื่อตั้ง env CRON_SECRET ไว้
function requireAuth(req, res) {
  const need = process.env.CRON_SECRET;
  if (!need) return true;                     // ยังไม่ได้ตั้ง env = ทำงานเหมือนเดิม (ไม่ล็อกตัวเองออก)
  const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (got === need) return true;
  res.status(401).json({ ok: false, error: 'unauthorized' });
  return false;
}
module.exports = async (req, res) => {
  if (!requireAuth(req, res)) return;
  try {
    const dry = req && req.query && (req.query.dry === "1" || req.query.dry === "true");
    const dateIso = (req && req.query && req.query.date) || bkkDate(1); // default = พรุ่งนี้ (เวลาไทย)
    // ตรวจรูปแบบวันที่ — ค่าที่มี & จะกลายเป็น query param ของ PostgREST (แก้ filter/select ได้) · เพิ่ม 3 ส.ค. 2026
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateIso))) return res.status(400).json({ ok:false, error:"bad date" });
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const to = (process.env.ORDERS_NOTIFY_TO || "").split(",").map((s) => s.trim()).filter(Boolean);

    const message = await buildMessage(dateIso);
    if (dry) return res.status(200).json({ dry_run: true, date: dateIso, recipients: to.length, message });
    if (!token) return res.status(200).json({ sent: 0, date: dateIso, message, errors: ["LINE_CHANNEL_ACCESS_TOKEN missing"] });
    if (!to.length) return res.status(200).json({ sent: 0, date: dateIso, message, errors: ["ORDERS_NOTIFY_TO missing"] });

    const errors = [];
    let sent = 0;
    for (const target of to) {
      try {
        const r = await pushLine(token, target, message);
        if (r.ok) sent++;
        else errors.push(`push ${target.slice(0, 6)}… failed: ${r.status} ${await r.text().catch(() => "")}`);
      } catch (e) {
        errors.push(`push threw: ${(e && e.message) || String(e)}`);
      }
    }
    return res.status(200).json({ sent, date: dateIso, errors });
  } catch (e) {
    return res.status(200).json({ errors: ["unhandled: " + ((e && e.message) || String(e))] });
  }
};

/* Under360 — ส่งใบยืนยันออเดอร์เข้าแชท LINE ของลูกค้า (นัทสั่ง 8 ส.ค. 2026)

   ที่มา: นัทส่งภาพที่ Hato เคยทำให้ดู — ลูกค้าสั่งเสร็จแล้วเด้งใบเสร็จ + เลขออเดอร์ + สถานะ
          "อยากได้แบบนี้เพื่อความสบายใจ"

   ออกแบบให้ "ไม่ต้องแตะ liff_customer.html" (ห้อง U ถือไฟล์อยู่):
   → เป็นตัวสแกนออเดอร์ใหม่แล้วส่งเอง = ได้ผลกับออเดอร์ทุกทาง (LIFF · แอดมินสั่งแทน · sync)
   → กันส่งซ้ำด้วยรายชื่อใน kitchen_data key 'order_notified' (ไม่ต้องรัน SQL ใหม่)

   💰 ค่าใช้จ่าย: push = 1 ข้อความ/ลูกค้า 1 คน · แพ็กเกจ Basic ที่ร้านใช้อยู่ = 15,000 ข้อความ/เดือน
      ออเดอร์ ~600/เดือน = ใช้ 4% ของโควต้า → ไม่มีค่าใช้จ่ายเพิ่ม

   เรียกใช้:
     /api/notify-order-confirm?dry=1          → ดูว่าจะส่งอะไรบ้าง ไม่ส่งจริง (ปลอดภัย)
     /api/notify-order-confirm                → ส่งจริง
     /api/notify-order-confirm?order=U-0808-001  → ส่งเฉพาะใบนั้น (ส่งซ้ำได้ ใช้ตอนเทส)

   ENV ที่ต้องมี: LINE_CHANNEL_ACCESS_TOKEN  (ยังไม่ได้ตั้ง = จะขึ้นเตือน ไม่พัง)
*/

const SUPABASE_URL = "https://zdartbvhbvqlwzwyyiia.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8";

const SHOP_NAME  = "Under 360";
const SHOP_BR    = "สาขา กรุงธนบุรี";
const SHOP_TEL   = "0641736519";                 // เบอร์ปัจจุบัน (ของเก่า 092-756-8826 เลิกใช้แล้ว)
const PROMPTPAY  = "0846556601";
const LIFF_URL   = "https://liff.line.me/2010442513-NI3JGTkb";
const NOTIFY_KEY = "order_notified";             // kitchen_data key เก็บเลขใบที่ส่งแล้ว
const LOOKBACK_MIN = 180;                        // มองย้อนหลังกี่นาที (กันใบตกหล่นตอนระบบล่ม)

const TH_DAY = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์"];
const TH_MON = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];

const sb = (path, init) => fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
  ...(init || {}),
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: "Bearer " + SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    ...((init || {}).headers || {}),
  },
});

const baht = (n) => "฿" + Number(n || 0).toLocaleString("en-US");
function fmtThaiDate(ymd) {
  if (!ymd) return "-";
  const d = new Date(ymd + "T00:00:00Z");
  return `${TH_DAY[d.getUTCDay()]} ${d.getUTCDate()} ${TH_MON[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
}

// รวมเมนูซ้ำเป็นบรรทัดเดียว (บทเรียน N-06/N-40 — เซ็ต 18 กล่องเคยขึ้น 18 บรรทัด)
function rollup(items) {
  const m = new Map();
  for (const i of items || []) {
    const key = [i.menu_name, i.unit_price].join("|");
    const hit = m.get(key);
    if (hit) hit.quantity += Number(i.quantity) || 0;
    else m.set(key, { name: i.menu_name, price: Number(i.unit_price) || 0, quantity: Number(i.quantity) || 0 });
  }
  return [...m.values()];
}

// ช่อง payment_account เก็บเป็นรหัสบัญชี (เช่น gsb_01) — ลูกค้าอ่านไม่รู้เรื่อง ต้องแปลงก่อนโชว์
function payLabel(acc) {
  const a = String(acc || "").toLowerCase();
  if (!a) return "โอนเงิน / พร้อมเพย์";
  if (a.includes("gsb")) return "โอนเงิน (ธ.ออมสิน)";
  if (a.includes("qr") || a.includes("promptpay")) return "พร้อมเพย์ / QR";
  if (a.includes("cash") || a.includes("cod")) return "เงินสดปลายทาง";
  if (a.includes("card") || a.includes("omise")) return "บัตรเครดิต";
  return "โอนเงิน";
}

const row = (label, value, opt = {}) => ({
  type: "box", layout: "horizontal", contents: [
    { type: "text", text: label, size: "sm", color: opt.dim ? "#9AA894" : "#6B7280", flex: 5, wrap: true },
    { type: "text", text: value, size: "sm", color: opt.strong ? "#1A1A1A" : "#4A5A52",
      weight: opt.strong ? "bold" : "regular", align: "end", flex: 3 },
  ],
});

function buildFlex(o, items) {
  const lines = rollup(items);
  const itemRows = lines.slice(0, 12).map((it) => ({
    type: "box", layout: "horizontal", spacing: "sm", contents: [
      { type: "text", text: "x" + it.quantity, size: "sm", color: "#3C7A5C", weight: "bold", flex: 1 },
      { type: "text", text: it.name || "-", size: "sm", color: "#1A1A1A", flex: 6, wrap: true },
      { type: "text", text: baht(it.price * it.quantity), size: "sm", color: "#4A5A52", align: "end", flex: 3 },
    ],
  }));
  if (lines.length > 12) {
    itemRows.push({ type: "text", text: `และอีก ${lines.length - 12} รายการ`, size: "xs", color: "#9AA894" });
  }

  const paid = o.payment_status === "paid";
  const addr = (o.delivery_address || "-").slice(0, 90);
  const slot = o.time_slot_label || o.time_slot || "-";

  // ── ใบที่ 1: ใบเสร็จ ──
  const receipt = {
    type: "bubble",
    header: {
      type: "box", layout: "vertical", spacing: "xs", paddingAll: "16px", backgroundColor: "#3C7A5C",
      contents: [
        { type: "text", text: SHOP_NAME, color: "#FFFFFF", size: "lg", weight: "bold" },
        { type: "text", text: SHOP_BR, color: "#D7E8DE", size: "xs" },
        { type: "text", text: "#" + (o.order_number || "-"), color: "#FFFFFF", size: "xl", weight: "bold", margin: "md" },
      ],
    },
    body: {
      type: "box", layout: "vertical", spacing: "md", paddingAll: "16px",
      contents: [
        { type: "text", text: "ข้อมูลจัดส่ง", weight: "bold", size: "sm", color: "#1A1A1A" },
        { type: "box", layout: "vertical", spacing: "xs", contents: [
          { type: "text", text: `${o.customer_name || "-"} (${o.customer_phone || "-"})`, size: "sm", color: "#4A5A52", wrap: true },
          { type: "text", text: addr, size: "sm", color: "#4A5A52", wrap: true },
          { type: "text", text: `${fmtThaiDate(o.delivery_date)} · ${slot}`, size: "sm", color: "#1A1A1A", weight: "bold", wrap: true },
          { type: "text", text: o.want_utensils ? "รับช้อนส้อม" : "ไม่รับช้อนส้อม", size: "xs", color: "#9AA894" },
        ] },
        { type: "separator", margin: "md" },
        { type: "text", text: "รายการสินค้า", weight: "bold", size: "sm", color: "#1A1A1A" },
        { type: "box", layout: "vertical", spacing: "sm", contents: itemRows },
        { type: "separator", margin: "md" },
        { type: "box", layout: "vertical", spacing: "xs", contents: [
          row("ยอดรวมสินค้า", baht(o.subtotal != null ? o.subtotal : o.total)),
          ...(Number(o.discount_amount) > 0 ? [row("ส่วนลด", "-" + baht(o.discount_amount), { dim: true })] : []),
          row("ค่าจัดส่ง", Number(o.delivery_fee) > 0 ? baht(o.delivery_fee) : "ฟรี"),
        ] },
        { type: "separator", margin: "md" },
        { type: "box", layout: "horizontal", contents: [
          { type: "text", text: "ยอดชำระทั้งสิ้น", size: "md", weight: "bold", color: "#1A1A1A", flex: 5 },
          { type: "text", text: baht(o.total), size: "lg", weight: "bold", color: "#3C7A5C", align: "end", flex: 4 },
        ] },
      ],
    },
  };

  // ── ใบที่ 2: สถานะ + สิ่งที่ต้องทำต่อ ──
  const status = {
    type: "bubble",
    body: {
      type: "box", layout: "vertical", spacing: "md", paddingAll: "16px",
      contents: [
        { type: "text", text: "สถานะออร์เดอร์", size: "xs", color: "#3C7A5C", weight: "bold" },
        { type: "text", text: "เราได้รับออร์เดอร์แล้ว", size: "xl", weight: "bold", color: "#1A1A1A", wrap: true },
        { type: "text", text: "ทางร้านจะเตรียมอาหารตามรายการของคุณ และแจ้งเตือนอีกครั้งเมื่อจัดส่ง",
          size: "sm", color: "#6B7280", wrap: true },
        { type: "separator", margin: "lg" },
        { type: "box", layout: "vertical", spacing: "xs", margin: "lg", contents: [
          row("วิธีชำระเงิน", payLabel(o.payment_account)),
          row("สถานะชำระเงิน", paid ? "ได้รับแล้ว" : "รอชำระเงิน", { strong: true }),
          row("ยอดชำระทั้งสิ้น", baht(o.total), { strong: true }),
        ] },
        ...(paid ? [] : [{
          type: "box", layout: "vertical", margin: "lg", paddingAll: "12px",
          backgroundColor: "#FDF3E3", cornerRadius: "8px",
          contents: [
            { type: "text", text: "กรุณาโอนเงินแล้วแนบสลิป", size: "sm", weight: "bold", color: "#8F5606", wrap: true },
            { type: "text", text: `พร้อมเพย์ ${PROMPTPAY} (ธ.ออมสิน)`, size: "sm", color: "#8F5606", margin: "sm", wrap: true },
            { type: "text", text: "แนบสลิปได้ที่หน้าออเดอร์ของคุณ — ทางร้านจะเริ่มทำอาหารหลังได้รับเงิน",
              size: "xs", color: "#8F5606", margin: "sm", wrap: true },
          ],
        }]),
      ],
    },
    footer: {
      type: "box", layout: "vertical", spacing: "sm", paddingAll: "12px",
      contents: [
        { type: "button", style: "primary", color: "#3C7A5C", height: "sm",
          action: { type: "uri", label: "ดูออเดอร์ของฉัน", uri: LIFF_URL } },
        { type: "button", style: "secondary", height: "sm",
          action: { type: "uri", label: "โทรหาร้าน", uri: "tel:" + SHOP_TEL } },
      ],
    },
  };

  return {
    type: "flex",
    altText: `รับออร์เดอร์แล้ว #${o.order_number} · ${baht(o.total)}`,
    contents: { type: "carousel", contents: [receipt, status] },
  };
}

// ── หา token ให้ได้ ──────────────────────────────────────────────
// 2 ทาง (เอาทางไหนก็ได้ที่นัทตั้งไว้):
//   1. LINE_CHANNEL_ACCESS_TOKEN — วางตรงๆ · อายุ 30 วัน ต้องมาต่อเอง
//   2. LINE_CHANNEL_SECRET (+ LINE_CHANNEL_ID) — ระบบขอ token เองทุกครั้ง
//      → ไม่มีวันหมดอายุ ไม่ต้องกลับมาแตะอีกเลย  ✅ แนะนำทางนี้
let cachedToken = null, cachedUntil = 0;
async function getToken() {
  const direct = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (direct) return direct;

  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return null;
  if (cachedToken && Date.now() < cachedUntil) return cachedToken;

  const r = await fetch("https://api.line.me/v2/oauth/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.LINE_CHANNEL_ID || "2005639534",
      client_secret: secret,
    }),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) return null;
  cachedToken = j.access_token;
  cachedUntil = Date.now() + 6 * 3600 * 1000; // ใช้ซ้ำ 6 ชม. แล้วค่อยขอใหม่
  return cachedToken;
}

export default async function handler(req, res) {
  /* เปิดให้หน้าลูกค้า (LIFF) เรียกได้ทันทีที่กดสั่งเสร็จ — ลูกค้าได้ใบยืนยันใน 2-3 วินาที
     ไม่ต้องรอรอบ cron · ตัว cron ยังทำงานเป็นตาข่ายกันตกเหมือนเดิม (ใบที่แอดมินสั่งแทน/ยิงพลาด)
     ปลอดภัย: เอนด์พอยต์นี้ "ส่งใบยืนยันให้เจ้าของออเดอร์" เท่านั้น ไม่รับข้อความจากภายนอก
     และมีรายชื่อกันส่งซ้ำอยู่แล้ว เรียกกี่รอบก็ส่งครั้งเดียว */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  const dry = String(req.query?.dry || "") === "1";
  const only = String(req.query?.order || "").trim();
  const token = dry ? null : await getToken();

  try {
    // 1) ใบที่ส่งไปแล้ว (กันส่งซ้ำ)
    let sent = [];
    const nr = await sb(`kitchen_data?select=data&key=eq.${NOTIFY_KEY}`);
    if (nr.ok) { const j = await nr.json(); sent = (j[0]?.data?.orders) || []; }
    const sentSet = new Set(sent);

    // 2) หาออเดอร์ที่ควรส่ง
    const since = new Date(Date.now() - LOOKBACK_MIN * 60000).toISOString();
    const filter = only
      ? `order_number=eq.${encodeURIComponent(only)}`
      : `created_at=gte.${since}&status=neq.cancelled`;
    const oResp = await sb(`orders?select=id,order_number,line_uid,customer_name,customer_phone,delivery_address,delivery_date,time_slot,time_slot_label,total,subtotal,delivery_fee,discount_amount,payment_status,payment_account,want_utensils,status,created_at,order_items(menu_name,quantity,unit_price)&${filter}&order=created_at.desc&limit=50`);
    if (!oResp.ok) throw new Error("โหลดออเดอร์ไม่ได้: " + (await oResp.text()).slice(0, 200));
    const orders = await oResp.json();

    const skipTest = (o) => /test|เทส|ODTEST/i.test((o.customer_name || "") + (o.order_number || ""));
    const todo = orders.filter((o) =>
      o.line_uid && (only || (!sentSet.has(o.order_number) && !skipTest(o))));

    const report = [];
    let ok = 0;

    for (const o of todo) {
      const msg = buildFlex(o, o.order_items || []);
      if (dry) { report.push({ order: o.order_number, to: o.line_uid.slice(0, 10) + "…", total: o.total, altText: msg.altText }); continue; }
      if (!token) { report.push({ order: o.order_number, error: "ยังไม่ได้ตั้ง LINE_CHANNEL_SECRET หรือ LINE_CHANNEL_ACCESS_TOKEN ใน Vercel" }); continue; }

      const r = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ to: o.line_uid, messages: [msg] }),
      });
      if (r.ok) { ok++; sentSet.add(o.order_number); report.push({ order: o.order_number, sent: true }); }
      else report.push({ order: o.order_number, error: (await r.text()).slice(0, 160) });
    }

    // 3) จำว่าส่งใบไหนไปแล้ว (เก็บ 500 ใบล่าสุดพอ)
    if (!dry && ok > 0) {
      await sb("kitchen_data", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ key: NOTIFY_KEY, data: { orders: [...sentSet].slice(-500), updated_at: new Date().toISOString() } }),
      });
    }

    res.status(200).json({
      mode: dry ? "ทดสอบ (ไม่ส่งจริง)" : "ส่งจริง",
      tokenReady: !!token,
      found: todo.length,
      sent: ok,
      detail: report,
    });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
}

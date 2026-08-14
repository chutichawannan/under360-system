/* ── /api/mp-sync — ทำให้ "แผนเมนู" กับ "ของที่ครัวเห็น" ตรงกันเสมอ ─────────
 *
 * ปัญหาที่แก้ (ห้องฟ้ารายงาน 14 ส.ค. 2569 · เคส Milk MP-0814-027):
 *   เมนูของลูกค้า Meal Plan ถูกเก็บ 2 ที่ที่ไม่คุยกัน
 *     · mp_deliveries.menu_items  ← หน้าแพลนเมนู / ฟ้า เขียน
 *     · order_items               ← หน้าครัว · หน้าแมส · หน้าออเดอร์ · รายงาน อ่าน
 *   หน้าแพลนเมนูมีตัว sync อยู่แล้ว (syncPlanToOrderItems) **แต่มันอยู่ในเบราว์เซอร์**
 *   → ใครก็ตามที่เขียน mp_deliveries ตรงๆ (สคริปต์ · ฟ้า · งานซ่อมข้อมูล) ตัว sync ไม่ทำงานเลย
 *   → ครัวเห็นเมนูไม่ครบ/ไม่เห็นเลย โดยไม่มีอะไรแดงเตือน
 *
 * วิธีแก้: ย้ายการ sync ออกจากเบราว์เซอร์มาไว้ฝั่ง server แล้วให้ cron เดินเอง
 *   ไม่ว่าใครจะเขียนแผนด้วยวิธีไหน ภายในไม่กี่นาที order_items จะตรงกับแผนเสมอ
 *
 * ใช้งาน:
 *   /api/mp-sync            → ตรวจ + แก้ให้ตรง (cron เรียกเอง)
 *   /api/mp-sync?dry=1      → ดูอย่างเดียว ไม่แก้อะไร
 *   /api/mp-sync?days=7     → มองไปข้างหน้ากี่วัน (default 3)
 *
 * 🛑 สิ่งที่ตัวนี้ "ไม่แตะ" เด็ดขาด:
 *   · บรรทัดราคา (notes ขึ้นต้น meal_plan: / pkg:) = บรรทัดถือเงิน ลบแล้วยอดขายเพี้ยน
 *   · ช้อนส้อม/แยกวันส่ง (menu_code 1/0/000)
 *   · เมนูสต็อค (S/D/No/A) ที่ลูกค้าสั่งเอง
 *   · ใบที่แผนกับของในใบ "ขัดกัน" (ยุคชีทเก่า) → รายงานให้คนตรวจ ห้ามเดาแล้วทับ
 */

const SB = process.env.SUPABASE_URL || "https://zdartbvhbvqlwzwyyiia.supabase.co";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8";

const MPBOX_TAG = "meal_plan:box";
const CTRL = { "1": 1, "0": 1, "000": 1 };

function hdr() {
  return { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
}
async function rest(path, opts) {
  const r = await fetch(SB + "/rest/v1/" + path, Object.assign({ headers: hdr() }, opts || {}));
  if (!r.ok) throw new Error(path.split("?")[0] + " " + r.status + " " + (await r.text()).slice(0, 200));
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}
// วันไทยเสมอ — เซิร์ฟเวอร์ Vercel เป็น UTC ถ้าใช้วันของเครื่องจะเพี้ยนไป 1 วัน
function thaiDate(offsetDays) {
  return new Date(Date.now() + 7 * 3600e3 + (offsetDays || 0) * 86400e3).toISOString().slice(0, 10);
}

/* หาว่ารอบนี้ต้องเขียนลง "ใบไหน" — รอบ 2-3 มีใบของตัวเอง คนละใบกับรอบ 1
   ⚠️ จับคู่ด้วย line_uid / customer_id เท่านั้น ห้ามจับด้วยชื่อ (ชื่อลูกค้าซ้ำกันได้ = ครัวทำผิดคน)
   ⚠️ ไม่มีใบของ "วันนั้น" จริงๆ → คืนว่าง ห้ามยัดลงใบแม่
      (ถ้ายอมให้ตกลงใบแม่ รอบ 3 จะไปลงใบของรอบ 1 = ครัวทำเมนูผิดวันให้ลูกค้าจริง) */
function pickOrder(r, ordersOfDay, byId) {
  if (r.order_id) {
    const p = byId[r.order_id];
    if (p && p.delivery_date === r.delivery_date && p.status !== "cancelled") return p;
  }
  return (ordersOfDay[r.delivery_date] || []).find(function (o) {
    return (r.line_uid && o.line_uid === r.line_uid) || (r.customer_id && o.customer_id === r.customer_id);
  }) || null;
}

export default async function handler(req, res) {
  const q = (req && req.query) || {};
  const dry = q.dry === "1" || q.dry === "true";
  const days = Math.min(Math.max(parseInt(q.days || "3", 10) || 3, 1), 30);
  const from = thaiDate(-1), to = thaiDate(days);
  const out = {
    ok: true, dry, window: from + " → " + to,
    checked: 0, skipped_unplanned: 0,
    fixed: [], flags: [], errors: []
  };

  try {
    // 1) รอบ Meal Plan ในช่วงเวลาที่สนใจ
    const mp = await rest("mp_deliveries?select=id,order_id,customer_name,line_uid,customer_id," +
      "delivery_date,round_no,total_rounds,box_count,menu_items,status" +
      "&delivery_date=gte." + from + "&delivery_date=lte." + to +
      "&status=neq.cancelled&order=delivery_date&limit=500");

    // แผนว่าง = ยังไม่ถึงคิวแอดมินจ่ายเมนู ไม่ใช่ความผิดพลาด → ข้าม
    const rows = mp.filter(function (r) {
      return (r.menu_items || []).some(function (e) { return e && e.code; });
    });
    out.checked = rows.length;
    out.skipped_unplanned = mp.length - rows.length;
    if (!rows.length) return res.status(200).json(out);

    // 2) ใบออเดอร์ของวันเหล่านั้น (ดึงทีเดียว ไม่ยิงรายใบ)
    const ords = await rest("orders?select=id,order_number,delivery_date,line_uid,customer_id,status" +
      "&delivery_date=gte." + from + "&delivery_date=lte." + to +
      "&status=neq.cancelled&limit=1000");
    const byId = {}, ordersOfDay = {};
    ords.forEach(function (o) {
      byId[o.id] = o;
      (ordersOfDay[o.delivery_date] = ordersOfDay[o.delivery_date] || []).push(o);
    });

    // 3) order_items ของใบเหล่านั้น (ทีละก้อน กัน URL ยาวเกิน + กัน cap 1000 แถว)
    const oids = Object.keys(byId);
    let items = [];
    for (let i = 0; i < oids.length; i += 40) {
      items = items.concat(await rest("order_items?select=id,order_id,menu_code,quantity,notes" +
        "&order_id=in.(" + oids.slice(i, i + 40).join(",") + ")&limit=2000"));
    }
    const byOrder = {};
    items.forEach(function (i) { (byOrder[i.order_id] = byOrder[i.order_id] || []).push(i); });

    // 4) เทียบทีละรอบ
    for (const r of rows) {
      const who = (r.customer_name || "?") + " " + r.delivery_date + " r" + (r.round_no || 1);
      const tgt = pickOrder(r, ordersOfDay, byId);
      if (!tgt) {
        // ไม่มีใบของวันนั้น = แมส/ครัวไม่มีทางรู้ว่าต้องส่งใคร → ต้องมีคนเปิดใบให้
        out.flags.push({ who: who, issue: "ไม่มีใบออเดอร์ของวันส่งนี้ — ครัว/แมสจะไม่เห็นรอบนี้เลย" });
        continue;
      }

      const plan = (r.menu_items || []).filter(function (e) {
        return e && e.code && /^[A-Za-z]+\d+$/.test(String(e.code));
      });
      const badCodes = (r.menu_items || [])
        .filter(function (e) { return e && e.code && !/^[A-Za-z]+\d+$/.test(String(e.code)); })
        .map(function (e) { return e.code; });
      if (badCodes.length) out.flags.push({ who: who, issue: "โค้ดเมนูเพี้ยน: " + badCodes.join(",") });
      if (!plan.length) continue;

      const tag = MPBOX_TAG + ":r" + (r.round_no || 1) + "/" + (r.total_rounds || 1);
      const existing = byOrder[tgt.id] || [];
      const mine = [], fromSheet = [];
      existing.forEach(function (i) {
        const n = String(i.notes || "").trim();
        if (n.indexOf(MPBOX_TAG) === 0) { mine.push(i); return; }
        if (CTRL[i.menu_code]) return;                                    // ช้อนส้อม/แยกวันส่ง
        if (n.indexOf("meal_plan:") === 0 || n.indexOf("pkg:") === 0) return; // บรรทัดราคา/เซ็ต
        if (!/^(HP|LC|HX)\d/i.test(String(i.menu_code || ""))) return;    // เมนูสต็อคที่ลูกค้าสั่งเอง
        fromSheet.push(i);                                                // เมนู MP ยุคชีท (ไม่มีป้าย)
      });

      // ใบยุคชีทมีเมนูของตัวเองอยู่แล้ว — ถ้าไม่ตรงกับแผน ยังไม่รู้ว่าฝั่งไหนถูก
      // ทับผิดข้าง = ครัวทำอาหารผิดประเภทให้ลูกค้าจริงพรุ่งนี้ → ให้คนเคาะ
      if (fromSheet.length) {
        const a = plan.map(function (e) { return e.code; }).sort().join(",");
        const b = fromSheet.map(function (i) { return i.menu_code; }).sort().join(",");
        if (a !== b) {
          out.flags.push({ who: who, order: tgt.order_number, issue: "แผนกับเมนูเดิมในใบขัดกัน — ต้องให้คนตรวจ", plan: a, inOrder: b });
          continue;
        }
      }

      // เทียบว่าตรงอยู่แล้วไหม (โค้ด+จำนวน+ป้ายรอบ) — ตรงแล้วไม่ต้องแตะ
      const want = {};
      plan.forEach(function (e) { want[e.code] = (want[e.code] || 0) + (e.qty || 1); });
      const have = {};
      mine.forEach(function (i) {
        if (String(i.notes || "").indexOf(tag) !== 0) return;
        have[i.menu_code] = (have[i.menu_code] || 0) + (i.quantity || 1);
      });
      const sameRound = mine.filter(function (i) { return String(i.notes || "").indexOf(tag) === 0; });
      const inSync = Object.keys(want).length === Object.keys(have).length &&
        Object.keys(want).every(function (c) { return have[c] === want[c]; }) &&
        sameRound.length === mine.length &&
        sameRound.length === plan.length;   // แถวเกิน = เคยเขียนซ้อน ต้องกวาด

      // box_count ต้องผูกกับความจริง — ไม่ตรงคือแอดมิน/ครัวจะนับกล่องผิด
      const planQty = plan.reduce(function (s, e) { return s + (e.qty || 1); }, 0);
      if (r.box_count && planQty !== r.box_count) {
        out.flags.push({ who: who, order: tgt.order_number, issue: "จำนวนกล่องไม่ตรงแผน", box_count: r.box_count, plan: planQty });
      }

      if (inSync) continue;

      const detail = { who: who, order: tgt.order_number, was: mine.length, now: plan.length };
      if (dry) { out.fixed.push(Object.assign({ dry: true }, detail)); continue; }

      // ลบของเก่าที่ระบบนี้เขียนเอง (ทุกป้ายรอบ กันซาก) แล้วเขียนใหม่ให้ตรงแผน
      for (const i of mine.concat(fromSheet)) {
        await rest("order_items?id=eq." + i.id, { method: "DELETE" });
      }
      const payload = plan.map(function (e) {
        const nt = e.note ? " | 📌 " + String(e.note) : "";
        return {
          order_id: tgt.id, menu_code: e.code, menu_name: e.name || e.code,
          quantity: e.qty || 1, unit_price: 0, subtotal: 0, notes: tag + nt
        };
      });
      await rest("order_items", { method: "POST", body: JSON.stringify(payload) });
      out.fixed.push(detail);
    }

    return res.status(200).json(out);
  } catch (e) {
    out.ok = false;
    out.errors.push(String((e && e.message) || e));
    return res.status(500).json(out);
  }
}

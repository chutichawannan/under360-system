/* 🔴 /ads เคลมออเดอร์ที่ไม่ได้มาจากแอด (06 จับได้ 8 ก.ย. 2026)

   อาการ: การ์ดสรุปขึ้น "5 ออเดอร์ · ฿4,035 · ต่อออเดอร์ ฿49"
          แต่แถวชิ้นงานทุกใบขึ้น 0 — ขัดกันเองในหน้าเดียว

   ต้นเหตุ 2 จุด
   ① ตัวนับใช้เงื่อนไข "source_campaign ไม่ว่าง" → กวาดออเดอร์จาก IG ปกติ (ig/social)
      ที่ลูกค้าสั่งเองเข้ามาด้วย แล้วเอาค่าแอดไปหาร = ต้นทุนต่อออเดอร์สวยเกินจริงร้อยเท่า
   ② การจับคู่ชิ้นงานเทียบ "ชื่อแคมเปญ" กับค่าที่เก็บจริง ซึ่งคนละรูปแบบกัน
      a.campaign = "jay2026 · คอร์สเจ"  vs  source_campaign = "fb/paid/jay2026-a1"
      includes() ไม่มีทางตรง → ทุกแถวเลยได้ 0

   ทำไมอันตราย: นัทเห็นแล้วเชื่อว่าแอดขายได้ ถ้าปล่อยไว้จะเร่งงบบนตัวเลขที่โกหก
   = เผาเงินแบบเดียวกับรอบ ส.ค.
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/api/ads-insights.js';
const must = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } };
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('u360-ads-only')) { console.log('⏭️  แก้แล้ว'); process.exit(0); }

const OLD_START = "    const q = SB + '/rest/v1/orders?select=total,source_campaign'";
const OLD_END = "      }";
const s = h.indexOf(OLD_START);
must(s > 0, 'ไม่เจอบล็อกนับออเดอร์');
const e = h.indexOf('      out.orders = {', s);
must(e > s, 'ไม่เจอจุดจบบล็อก');
const e2 = h.indexOf('\n', h.indexOf('a.costPerOrder', e));
must(e2 > e, 'ไม่เจอท้ายบล็อกผูกชิ้นงาน');

const NEW = `    /* u360-ads-only — นับเฉพาะออเดอร์ที่มาจากแอดที่เสียเงินจริง */
    const q = SB + '/rest/v1/orders?select=total,source_campaign,source_content'
            + '&created_at=gte.' + since + 'T00:00:00'
            + '&total=gt.0&limit=2000';
    const r = await fetch(q, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    if (r.ok) {
      const rows = await r.json();
      const byC = {};
      let matched = 0, revenue = 0;
      for (const o of rows) {
        const c = (o.source_campaign || '').trim();
        /* 🔴 ห้ามใช้ "มีที่มาอะไรก็ได้" เป็นเงื่อนไข — ig/social, web, broadcast เข้าหมด
           ของแอดที่เสียเงินจะขึ้นต้นด้วย fb/paid/ เสมอ (utm_source=fb + utm_medium=paid) */
        if (!/^fb\/paid\//.test(c)) continue;
        byC[c] = byC[c] || { orders: 0, revenue: 0 };
        byC[c].orders++; byC[c].revenue += +o.total || 0;
        matched++; revenue += +o.total || 0;
        /* เก็บรหัสชิ้นงานไว้จับคู่รายแถว — จาก source_content ถ้ามี ไม่มีก็ท้าย campaign */
        const code = (o.source_content || '').trim() || (c.split('/').pop().split('-').pop() || '');
        if (code) { byC['#' + code] = byC['#' + code] || { orders: 0, revenue: 0 };
                    byC['#' + code].orders++; byC['#' + code].revenue += +o.total || 0; }
      }
      out.orders = { matched, revenue: +revenue.toFixed(2), byCampaign: byC, scanned: rows.length };

      /* ผูกออเดอร์เข้ากับชิ้นงานด้วย "รหัสชิ้นงาน" ไม่ใช่ชื่อแคมเปญ
         ชื่อแอดคือ "b1 · green" → รหัสคือ b1 · ต้องตรงตัวเท่านั้น ไม่ใช้ includes */
      for (const a of out.ads) {
        const code = String(a.ad || '').trim().split(/[\s·]+/)[0].toLowerCase();
        const hit = code && byC['#' + code];
        a.orders = hit ? hit.orders : 0;
        a.revenue = hit ? +hit.revenue.toFixed(2) : 0;
        a.costPerOrder = a.orders ? +(a.spend / a.orders).toFixed(2) : null;
      }`;

h = h.slice(0, s) + NEW + h.slice(e2);
fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('✅ นับเฉพาะออเดอร์ที่ขึ้นต้นด้วย fb/paid/ · จับคู่ชิ้นงานด้วยรหัสตรงตัว');

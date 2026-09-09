// ยามเฝ้าแอด — รันโดย Windows Task Scheduler 08:00 / 20:00 (ไม่ใช้สมอง ไม่เปลือง token)
// ดึงตัวเลขจาก Meta + นับคนเข้า /jay + ออเดอร์จาก DB → ตัดสินว่าปกติหรือ 🔴 → โพสต์ลงบอร์ด room=06
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');

const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.ads'), 'utf8')
  .split(/\r?\n/).filter(Boolean).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; }));
const T = env.META_TOKEN, ACC = env.META_AD_ACCOUNT;

const SB = 'https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

const thai = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
// วันเริ่มยิงจริง — แก้บรรทัดเดียวเมื่อเลื่อน ประตูทุกบานขยับตามเอง
// (ตอนนี้ยังไม่เริ่ม เพราะติดยืนยันตัวตนผู้ลงโฆษณาที่ facebook.com/id/hub)
const START = '2026-09-07';
const NAME_MATCH = /jay2026/i;

// ประตูตรวจ — นับเป็น "วันที่ N นับจากวันเริ่ม" ตามที่พี่ปืนสั่ง: เลื่อนวันเริ่ม ไม่เทงบชดเชย
const dayAfterStart = (n) =>
  new Date(new Date(START + 'T00:00:00Z').getTime() + n * 864e5).toISOString().slice(0, 10);

const GATES = [
  { day: 8,  need: 'คนเข้าหน้าคอร์สเจ ≥100', check: d => d.visits >= 100 },
  { day: 15, need: 'คนกดไป LINE ≥30',        check: d => d.leads >= 30 },
  { day: 21, need: 'จองจริง ≥2 คอร์ส',        check: d => d.orders >= 2 },
  { day: 26, need: 'จองจริง ≥6 คอร์ส',        check: d => d.orders >= 6 },
].map(g => ({ ...g, date: dayAfterStart(g.day) }));
const count = async (q) => {
  const r = await fetch(`${SB}/${q}`, { headers: { ...H, Prefer: 'count=exact', Range: '0-0' } });
  return +((r.headers.get('content-range') || '0-0/0').split('/')[1] || 0);
};

const post = (text) => fetch(`${SB}/session_messages`, {
  method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({ room: '06', sender: 'ยามเฝ้าแอด', role: 'assistant', text }),
});

try {
  const today = thai();
  // ── Meta: ยอดใช้จ่ายรายชิ้นงาน ตั้งแต่เริ่มแคมเปญ
  const url = `https://graph.facebook.com/v21.0/${ACC}/insights?level=ad`
    + `&time_range=${encodeURIComponent(JSON.stringify({ since: START, until: today }))}`
    + `&fields=campaign_name,ad_name,spend,impressions,reach,frequency,clicks,cpc,ctr,inline_link_clicks`
    + `&limit=100&access_token=${T}`;
  const meta = await fetch(url).then(r => r.json());
  if (meta.error) throw new Error('Meta: ' + meta.error.message);
  const ads = (meta.data || []).filter(a => NAME_MATCH.test(a.campaign_name || ''));
  const spend = ads.reduce((s, a) => s + (+a.spend || 0), 0);
  const clicks = ads.reduce((s, a) => s + (+a.clicks || 0), 0);
  const cpc = clicks ? spend / clicks : 0;
  // คลิกที่ "ไปเว็บจริง" ตามที่ Meta นับ — ใช้เป็นตัวสอบทานตัวนับฝั่งเรา
  const metaLinkClicks = ads.reduce((s, a) => s + (+a.inline_link_clicks || 0), 0);

  // ── DB: คนเข้าหน้า /jay · คนกดไป LINE · ออเดอร์จากแอด
  const visits = await count(`web_events?select=id&page=like.*jay*&utm_campaign=not.like.*selftest*&created_at=gte.${START}`);
  const leads = await count(`web_events?select=id&page=like.*jay*&event=eq.cta_click&utm_campaign=not.like.*selftest*&created_at=gte.${START}`);
  const orders = await count(`orders?select=id&source_campaign=like.*jay*&total=gt.0`);

  // ── ชุด D (Lookalike คนใหม่) มีเกณฑ์ปิดของตัวเอง — ตกลงกับนัท 8 ก.ย.
  const D_START = '2026-09-08';
  const dAds = ads.filter(a => (a.ad_name || '').startsWith('d'));
  const dSpend = dAds.reduce((t, a) => t + (+a.spend || 0), 0);
  const dClicks = dAds.reduce((t, a) => t + (+a.clicks || 0), 0);
  const dCpc = dClicks ? dSpend / dClicks : 0;
  const dVisits = await count(`web_events?select=id&utm_campaign=like.jay2026-d*&created_at=gte.${D_START}`);
  const dOrders = await count(`orders?select=id&source_campaign=like.jay2026-d*&total=gt.0`);
  const dDay = Math.floor((Date.parse(today) - Date.parse(D_START)) / 864e5) + 1;
  const d = { spend, clicks, cpc, visits, leads, orders, metaLinkClicks };

  // ── ตัดสิน
  const flags = [];
  // 🔑 แยก "แอดไม่มีคน" ออกจาก "ตัวนับพัง" — 8 ก.ย. ตัวนับหน้า /jay หายไป 4.5 ชม. โดยไม่มีอะไรแดง
  if (metaLinkClicks >= 10 && visits === 0)
    flags.push(`Meta บอกมีคนกดไปเว็บ ${metaLinkClicks} ครั้ง แต่ตัวนับเราได้ 0 → **ตัวนับหน้า /jay น่าจะพัง ไม่ใช่แอดไม่มีคน** (แจ้งห้อง M)`);
  else if (metaLinkClicks >= 20 && visits < metaLinkClicks * 0.3)
    flags.push(`คนกดไปเว็บ ${metaLinkClicks} แต่ตัวนับเราได้แค่ ${visits} — ห่างเกินปกติ เช็คว่าตัวนับครบไหม`);
  // เกณฑ์ปิดชุด D — ตกลงกับนัทไว้ 8 ก.ย. (ห้ามปิดด้วยความรู้สึก ต้องชนเกณฑ์)
  if (dDay >= 3 && dVisits < 30)
    flags.push(`ชุด D ครบ ${dDay} วัน ใช้ ฿${dSpend.toFixed(0)} แต่คนเข้าเว็บแค่ ${dVisits} (เกณฑ์ ≥30) → **เสนอปิด D**`);
  if (dDay >= 3 && dClicks >= 10 && dCpc > 15)
    flags.push(`ชุด D ต่อคลิก ฿${dCpc.toFixed(2)} เกินเพดาน ฿15 → **เสนอปิด D**`);
  if (dDay >= 7 && dOrders === 0)
    flags.push(`ชุด D ครบ 7 วัน ใช้ ฿${dSpend.toFixed(0)} **ยังไม่มีออเดอร์เลย** → เสนอปิด D · แปลว่าคนแปลกหน้ายังไม่ซื้อ ให้ทุ่มไปทางลิสต์เก่า/LINE แทน`);
  if (spend > 500 && metaLinkClicks === 0) flags.push(`ใช้เงินไป ฿${spend.toFixed(0)} แต่ยังไม่มีใครกดไปเว็บเลยสักคน`);
  if (clicks >= 30 && cpc > 15) flags.push(`ค่าคลิกแพงผิดปกติ ฿${cpc.toFixed(2)} (เพดาน ฿15)`);
  for (const g of GATES) if (today >= g.date && !g.check(d)) flags.push(`ไม่ผ่านประตู ${g.date}: ต้องได้ ${g.need}`);

  const body = [
    `${flags.length ? '🔴' : '✅'} [ยามเฝ้าแอด · ${today}] แคมเปญเจ jay2026`,
    '',
    `ใช้เงินสะสม **฿${spend.toFixed(2)}** · คลิก ${clicks} · ต่อคลิก ฿${cpc.toFixed(2)}`,
    `— ชุด D (วันที่ ${dDay}) ฿${dSpend.toFixed(0)} · เข้าเว็บ ${dVisits} · ออเดอร์ ${dOrders} · ต่อคลิก ฿${dCpc.toFixed(2)}`,
    `คนกดไปเว็บ (Meta นับ) **${metaLinkClicks}** · คนเข้า /jay (เรานับ) **${visits}** · กดไป LINE **${leads}** · **จองจริง ${orders}**`,
    ads.length ? '' : '_(ยังไม่มีชิ้นงานที่วิ่งอยู่ในแคมเปญนี้)_',
    ...ads.map(a => `· ${a.ad_name} | ฿${a.spend} | เห็น ${a.reach} | ซ้ำ ${(+a.frequency).toFixed(2)} | คลิก ${a.clicks} | CTR ${(+a.ctr).toFixed(2)}%`),
    ...(flags.length ? ['', '## 🔴 ชนกฎ — ห้อง 06 ต้องตัดสินใจ', ...flags.map(f => `- ${f}`),
      '', '**กติกา:** ปิดแล้วหยุด รายงานนัท ขออนุญาตก่อนเปิดใหม่ (ads-close-then-stop)'] : []),
  ].filter(l => l !== '').join('\n');

  const r = await post(body);
  console.log((flags.length ? 'FLAG' : 'OK') + ' posted ' + r.status + ' | spend=' + spend.toFixed(2) + ' visits=' + visits + ' orders=' + orders);
} catch (e) {
  await post(`🔴 [ยามเฝ้าแอด · ${thai()}] **ตัวเฝ้าแอดรันไม่ผ่าน** — ${e.message}\n\nแปลว่า**ตอนนี้ไม่มีใครเฝ้าแอดอยู่** ห้อง 06 ต้องเช็คมือ`);
  console.error('ERR', e.message);
  process.exit(1);
}

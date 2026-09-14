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
  const visits = await count(`web_events?select=id&page=like.*jay*&utm_source=eq.fb&created_at=gte.${START}`);
  const leads = await count(`web_events?select=id&page=like.*jay*&event=eq.cta_click&utm_source=eq.fb&created_at=gte.${START}`);
  const orders = await count(`orders?select=id&source_campaign=like.*jay*&total=gt.0`);

  // ── เฝ้าชุดที่ยังวิ่งจริง (14 ก.ย. 2569 — ยุบ A/B/D/E เหลือ N คนใหม่ + C คนเก่า)
  //    ห้ามฮาร์ดโค้ดชื่อชุดอีก: โครงเปลี่ยนเมื่อไหร่ ยามจะรายงานชุดที่ตายไปแล้ว (เคยเกิด 13-14 ก.ย.)
  const setUrl = `https://graph.facebook.com/v21.0/${ACC}/insights?level=adset`
    + `&time_range=${encodeURIComponent(JSON.stringify({ since: START, until: today }))}`
    + `&fields=campaign_name,adset_id,adset_name,spend,clicks,inline_link_clicks,actions`
    + `&limit=50&access_token=${T}`;
  const setRes = await fetch(setUrl).then(r => r.json());
  const liveSets = [];
  for (const st of (setRes.data || []).filter(a => NAME_MATCH.test(a.campaign_name || ''))) {
    const info = await fetch(`https://graph.facebook.com/v21.0/${st.adset_id}?fields=status,daily_budget,learning_stage_info&access_token=${T}`).then(r => r.json());
    if (info.status !== 'ACTIVE') continue;
    const lead = +((st.actions || []).find(x => x.action_type === 'lead') || {}).value || 0;
    liveSets.push({
      name: st.adset_name, spend: +st.spend || 0, lead,
      budget: (+info.daily_budget || 0) / 100,
      cpl: lead ? (+st.spend || 0) / lead : null,
      learned: info.learning_stage_info ? info.learning_stage_info.conversions : null,
    });
  }

  const d = { spend, clicks, cpc, visits, leads, orders, metaLinkClicks };

  // ── ตัดสิน
  // ── คลังคนสำหรับ "ตามหลอน" (คนเข้าหน้าเจแล้วยังไม่จอง) — เปิดได้เมื่อคนพอ
  const RETARGET_AUD = '120253219106970111';
  let retargetReady = null;
  try {
    const ra = await fetch(`https://graph.facebook.com/v21.0/${RETARGET_AUD}?fields=approximate_count_lower_bound,delivery_status&access_token=${T}`).then(r => r.json());
    retargetReady = ra.delivery_status && ra.delivery_status.code === 200;
  } catch (e) { /* ไม่สำคัญพอจะทำให้รายงานล้ม */ }

  const flags = [];
  if (retargetReady) flags.push('**คลังคนสำหรับชุดตามหลอนโตพอแล้ว** — เปิดชุด E (คนเข้าหน้าเจแล้วยังไม่จอง) ได้ · รายงานนัทก่อนเปิด');
  // 🔑 แยก "แอดไม่มีคน" ออกจาก "ตัวนับพัง" — 8 ก.ย. ตัวนับหน้า /jay หายไป 4.5 ชม. โดยไม่มีอะไรแดง
  if (metaLinkClicks >= 10 && visits === 0)
    flags.push(`Meta บอกมีคนกดไปเว็บ ${metaLinkClicks} ครั้ง แต่ตัวนับเราได้ 0 → **ตัวนับหน้า /jay น่าจะพัง ไม่ใช่แอดไม่มีคน** (แจ้งห้อง M)`);
  else if (metaLinkClicks >= 20 && visits < metaLinkClicks * 0.3)
    flags.push(`คนกดไปเว็บ ${metaLinkClicks} แต่ตัวนับเราได้แค่ ${visits} — ห่างเกินปกติ เช็คว่าตัวนับครบไหม`);
  // ── ด่านหยุด (ตกลงกับนัท 13 ก.ย. · ห้ามปิดด้วยความรู้สึก ต้องชนเกณฑ์)
  for (const st of liveSets) {
    if (st.spend > 250 && st.lead === 0)
      flags.push(`${st.name} ใช้ ฿${st.spend.toFixed(0)} แต่ **ยังไม่มีคนกดจองเลยสักคน** (เกณฑ์ ฿250) → ปิดชุดนี้`);
    if (st.cpl && st.cpl > 80)
      flags.push(`${st.name} ต่อคนกดจอง ฿${st.cpl.toFixed(0)} เกินเพดาน ฿80 → ถ้าเป็นวันที่ 2 ติดกัน ลดงบครึ่งหนึ่ง`);
  }
  if (spend > 5000) flags.push(`แคมเปญใช้ทะลุ ฿5,000 แล้ว (฿${spend.toFixed(0)}) → **ลดทุกชุดครึ่งหนึ่ง** ตามที่ตกลงกับนัท`);
  // 🔑 ปุ่มจองตายเงียบ — 9 ก.ย. M ใช้ line://app/{liffId} ซึ่ง LINE ประกาศเลิกใช้ตั้งแต่ 2020
  //    ยังทำงานอยู่ แต่ไม่มีวันปิดที่ประกาศไว้ → ถ้าวันไหน LINE ปิดเงียบ จะไม่มี error ให้เห็น
  //    อาการที่จะเห็นคือ "คนเข้าเว็บเยอะแต่ไม่มีใครกดปุ่มจองเลย"
  if (visits >= 30 && leads === 0)
    flags.push(`คนจากแอดเข้าหน้าเจ ${visits} คน แต่ **ไม่มีใครกดปุ่มจองเลยสักคน** → สงสัยปุ่มจองพัง (เช็ค line:// ที่ LINE เลิกใช้แล้ว) แจ้ง M ทันที`);
  if (spend > 500 && metaLinkClicks === 0) flags.push(`ใช้เงินไป ฿${spend.toFixed(0)} แต่ยังไม่มีใครกดไปเว็บเลยสักคน`);
  if (clicks >= 30 && cpc > 15) flags.push(`ค่าคลิกแพงผิดปกติ ฿${cpc.toFixed(2)} (เพดาน ฿15)`);
  for (const g of GATES) if (today >= g.date && !g.check(d)) flags.push(`ไม่ผ่านประตู ${g.date}: ต้องได้ ${g.need}`);

  const body = [
    `${flags.length ? '🔴' : '✅'} [ยามเฝ้าแอด · ${today}] แคมเปญเจ jay2026`,
    '',
    `ใช้เงินสะสม **฿${spend.toFixed(2)}** · คลิก ${clicks} · ต่อคลิก ฿${cpc.toFixed(2)}`,
    ...liveSets.map(st => `— ${st.name} · ฿${st.budget}/วัน · ใช้ไป ฿${st.spend.toFixed(0)} · กดจอง ${st.lead}${st.cpl ? ' (฿' + st.cpl.toFixed(0) + '/คน)' : ''} · เรียนรู้สะสม ${st.learned}/50`),
    `คนกดไปเว็บ (Meta นับ) **${metaLinkClicks}** · คนเข้า /jay (เรานับ) **${visits}** · กดไป LINE **${leads}** · **จองจริง ${orders}**`,
    ads.length ? '' : '_(ยังไม่มีชิ้นงานที่วิ่งอยู่ในแคมเปญนี้)_',
    ...ads.filter(a => +a.spend > 0).sort((x, y) => y.spend - x.spend).slice(0, 15).map(a => `· ${a.ad_name} | ฿${a.spend} | เห็น ${a.reach} | ซ้ำ ${(+a.frequency).toFixed(2)} | คลิก ${a.clicks} | CTR ${(+a.ctr).toFixed(2)}%`),
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

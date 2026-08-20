/* เพิ่มส่วน "แอดตัวไหนทำเงิน" ใน web/web_dashboard.html (m-track 20 ส.ค. 2026)
   นัทถามเอง: "หน้าจอวัดผลเราจะดูจากในไหน"

   🔴 ตัวเลขมาจาก **ฐานข้อมูลเราเท่านั้น** — ห้ามดึงจาก Meta Ads API มาโชว์เป็น ROAS
      เพราะเราปิดการขายใน LINE · Meta เห็นแค่ "คนทัก" ไม่เห็นยอดซื้อ (จดไว้ใน CLAUDE.md แล้ว)

   ⛔ ตัวกรองต้องตรงกับ scripts/finance/orders.mjs เป๊ะ ไม่งั้นตัวเลขโป่งแล้วนัทตัดสินใจผิด:
      ตัดใบยอด ฿0 · ตัดออเดอร์เทส · ตัด hato_loyalty_log (HS-)
   ⚠️ แถว "ไม่รู้ที่มา" ต้องโชว์เสมอ ห้ามซ่อน — ถ้าก้อนนี้ใหญ่ผิดปกติ = ป้ายหลุดที่ไหนสักแห่ง
   รันซ้ำได้ */
import fs from 'fs';

const F = 'web/web_dashboard.html';
const crlf = fs.readFileSync(F, 'utf8').includes('\r\n');
let h = fs.readFileSync(F, 'utf8').replace(/\r\n/g, '\n');
if (h.includes('adRevCard')) { console.log('⏭️  มีแล้ว'); process.exit(0); }

/* ── การ์ดใหม่ วางก่อนการ์ด "หน้าไหนคนดูเยอะ" ── */
const ANCHOR = '    <h2>หน้าไหนคนดูเยอะ</h2>';
if (!h.includes(ANCHOR)) { console.error('❌ ไม่เจอจุดวาง'); process.exit(1); }

const CARD = `  <div class="card" id="adRevCard">
    <h2>💰 แอดตัวไหนทำเงิน</h2>
    <div class="hint" style="margin:0 0 10px">
      นับจาก<b>ใบสั่งซื้อจริงในระบบเรา</b> — ไม่ได้เอาตัวเลขจาก Facebook มาโชว์
      (Meta เห็นแค่คนทัก ไม่เห็นยอดซื้อ เพราะเราปิดการขายใน LINE)
    </div>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      <button class="rngBtn on" data-days="7">7 วัน</button>
      <button class="rngBtn" data-days="30">30 วัน</button>
      <button class="rngBtn" data-days="month">เดือนนี้</button>
    </div>
    <table><thead><tr>
      <th>แคมเปญ</th><th style="text-align:right">ออเดอร์</th>
      <th style="text-align:right">ยอดเงิน</th><th style="text-align:right">ลูกค้าใหม่</th>
    </tr></thead>
    <tbody id="tbAdRev"><tr><td colspan="4" class="empty">กำลังโหลด…</td></tr></tbody></table>
    <div class="hint" id="adRevNote" style="margin-top:10px"></div>
  </div>

  <div class="card">
${ANCHOR}`;
h = h.replace('  <div class="card">\n' + ANCHOR, CARD);
if (!h.includes('adRevCard')) { console.error('❌ แทรกการ์ดไม่สำเร็จ'); process.exit(1); }

/* ── สคริปต์ ── */
const JS = `
/* ═══ แอดตัวไหนทำเงิน — อ่านจาก orders เท่านั้น (m-track 20 ส.ค. 2026) ═══ */
const AD_TEST_NAMES = ['nut','test user','ทดลอบ 1','ploy ♡','schematest'];
function adIsTest(o){
  if(o.source === 'parallel_test') return true;
  if(o.created_by === '[TEST-P] Claude') return true;
  if(String(o.notes||'').startsWith('[PARALLEL]')) return true;
  return AD_TEST_NAMES.indexOf(String(o.customer_name||'').trim().toLowerCase()) >= 0;
}
function adIsLoyalty(o){
  return o.source === 'hato_loyalty_log' || String(o.order_number||'').startsWith('HS-');
}
/* ดึงครบทุกแถว — PostgREST คืนทีละ 1000 (บทเรียน 1000-cap) */
async function adFetchAll(path){
  const out = [];
  for(let off = 0; ; off += 1000){
    const r = await fetch(SB_URL + '/rest/v1/' + path + '&limit=1000&offset=' + off,
      { headers:{ apikey:SB_KEY, Authorization:'Bearer ' + SB_KEY } });
    const rows = await r.json();
    if(!Array.isArray(rows)) throw new Error('supabase');
    out.push.apply(out, rows);
    if(rows.length < 1000) return out;
  }
}
async function loadAdRevenue(days){
  const tb = document.getElementById('tbAdRev');
  const note = document.getElementById('adRevNote');
  try{
    let from;
    if(days === 'month'){ const n = new Date(); from = new Date(n.getFullYear(), n.getMonth(), 1); }
    else { from = new Date(Date.now() - Number(days)*86400000); }
    const iso = from.toISOString();

    const orders = await adFetchAll(
      'orders?select=order_number,total,source,source_campaign,customer_id,customer_name,created_by,notes,created_at' +
      '&created_at=gte.' + iso + '&order=created_at.desc');

    /* ตัวกรองเดียวกับ finance/orders.mjs — ห้ามต่างกัน */
    const clean = orders.filter(function(o){
      return Number(o.total) > 0 && !adIsTest(o) && !adIsLoyalty(o);
    });

    if(!clean.length){
      tb.innerHTML = '<tr><td colspan="4" class="empty">ยังไม่มีออเดอร์ในช่วงนี้</td></tr>';
      note.textContent = '';
      return;
    }

    /* ลูกค้าใหม่ = ลูกค้าที่เพิ่งถูกสร้างในช่วงเวลาเดียวกัน */
    const ids = Array.from(new Set(clean.map(function(o){ return o.customer_id; }).filter(Boolean)));
    const newIds = new Set();
    for(let i = 0; i < ids.length; i += 100){
      const chunk = ids.slice(i, i+100);
      try{
        const r = await fetch(SB_URL + '/rest/v1/customers?select=id,created_at&id=in.(' + chunk.join(',') + ')&limit=200',
          { headers:{ apikey:SB_KEY, Authorization:'Bearer ' + SB_KEY } });
        const cs = await r.json();
        if(Array.isArray(cs)) cs.forEach(function(c){ if(c.created_at && c.created_at >= iso) newIds.add(c.id); });
      }catch(e){}
    }

    const g = {};
    clean.forEach(function(o){
      /* ไม่มีป้าย = "ไม่รู้ที่มา" — ต้องโชว์ ห้ามซ่อน */
      const k = o.source_campaign || '(ไม่รู้ที่มา)';
      if(!g[k]) g[k] = { n:0, sum:0, cust:new Set(), fresh:new Set() };
      g[k].n++; g[k].sum += Number(o.total) || 0;
      if(o.customer_id){ g[k].cust.add(o.customer_id); if(newIds.has(o.customer_id)) g[k].fresh.add(o.customer_id); }
    });

    const rows = Object.keys(g).map(function(k){ return { k:k, v:g[k] }; })
      .sort(function(a,b){ return b.v.sum - a.v.sum; });
    const baht = function(n){ return '฿' + Math.round(n).toLocaleString('th-TH'); };

    tb.innerHTML = rows.map(function(r){
      const unknown = r.k === '(ไม่รู้ที่มา)';
      return '<tr' + (unknown ? ' style="opacity:.72"' : '') + '>' +
        '<td>' + (unknown ? '<b>' + r.k + '</b>' : r.k) + '</td>' +
        '<td style="text-align:right">' + r.v.n + '</td>' +
        '<td style="text-align:right"><b>' + baht(r.v.sum) + '</b></td>' +
        '<td style="text-align:right">' + r.v.fresh.size + '</td></tr>';
    }).join('');

    const tagged = rows.filter(function(r){ return r.k !== '(ไม่รู้ที่มา)'; })
                       .reduce(function(s,r){ return s + r.v.sum; }, 0);
    const all = rows.reduce(function(s,r){ return s + r.v.sum; }, 0);
    const pct = all ? Math.round(tagged*100/all) : 0;
    note.innerHTML = 'ยอดที่รู้ที่มา <b>' + baht(tagged) + '</b> จากทั้งหมด ' + baht(all) +
      ' (<b>' + pct + '%</b>) · ตัดใบยอด ฿0 · ออเดอร์เทส · log แต้ม ออกแล้ว' +
      (pct < 50 ? '<br>⚠️ ก้อน "ไม่รู้ที่มา" ยังใหญ่ — ปกติช่วงแรกที่เพิ่งติดป้าย ถ้าไม่ลดลงเมื่อเริ่มยิงแอด แปลว่าป้ายหลุดที่ไหนสักแห่ง' : '');
  }catch(e){
    tb.innerHTML = '<tr><td colspan="4" class="empty">โหลดไม่สำเร็จ</td></tr>';
    note.textContent = '';
  }
}
document.querySelectorAll('.rngBtn').forEach(function(b){
  b.addEventListener('click', function(){
    document.querySelectorAll('.rngBtn').forEach(function(x){ x.classList.remove('on'); });
    b.classList.add('on');
    loadAdRevenue(b.dataset.days);
  });
});
loadAdRevenue(7);
`;

/* วางท้ายสคริปต์สุดท้าย */
const last = h.lastIndexOf('</script>');
if (last < 0) { console.error('❌ ไม่เจอ </script>'); process.exit(1); }
h = h.slice(0, last) + JS + '\n' + h.slice(last);

/* ปุ่มช่วงเวลา */
const CSS = `.rngBtn{font-family:inherit;font-size:.88rem;padding:7px 16px;border-radius:999px;border:1px solid #d8d8d2;background:#fff;color:#666;cursor:pointer}
.rngBtn.on{background:#14171A;color:#fff;border-color:#14171A}
`;
h = h.replace('</style>', CSS + '</style>');

fs.writeFileSync(F, crlf ? h.replace(/\n/g, '\r\n') : h);
console.log('✅ เพิ่มส่วน "แอดตัวไหนทำเงิน" ใน web/web_dashboard.html');

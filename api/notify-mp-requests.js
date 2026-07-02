const SUPABASE_URL = "https://zdartbvhbvqlwzwyyiia.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8";
const LIFF_URL = "https://liff.line.me/2010442513-NI3JGTkb?screen=mp-manage";

function fetchMpDeliveries(query) {
  return fetch(`${SUPABASE_URL}/rest/v1/mp_deliveries?${query}&select=*`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
  });
}

function patchMpDelivery(id, body) {
  return fetch(`${SUPABASE_URL}/rest/v1/mp_deliveries?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
}

function pushLine(token, lineUid, text) {
  return fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ to: lineUid, messages: [{ type: 'text', text }] }),
  });
}

function openMsg(row) {
  const typeLabel = (row.mp_type || '').toUpperCase();
  return `📋 แจ้งเตือน Meal Plan\n\nรอบที่ ${row.round_no}/${row.total_rounds} ของแผน ${typeLabel} ${row.mp_set} ของคุณ\nตอนนี้เปิดให้เลือกเมนูสำหรับรอบนี้แล้ว!\n\nกดลิงก์เพื่อเลือกเมนู:\n${LIFF_URL}`;
}
function dayBeforeMsg(row) {
  const typeLabel = (row.mp_type || '').toUpperCase();
  return `🥗 แจ้งเตือน Meal Plan\n\nพรุ่งนี้มีรอบส่ง Meal Plan ของคุณ (รอบที่ ${row.round_no}/${row.total_rounds}, ${typeLabel} ${row.mp_set}) นะครับ\nเตรียมรับได้เลย!`;
}

async function runOpenRequestWindows(token, hasToken, today) {
  const out = { checked: 0, notified: 0, skipped_no_token: 0, errors: [] };
  let rows = [];
  try {
    const resp = await fetchMpDeliveries(`status=eq.scheduled&notified_at=is.null&request_opens_at=lte.${today}`);
    if (!resp.ok) out.errors.push(`fetch(open) failed: ${resp.status} ${await resp.text().catch(()=>'')}`);
    else rows = await resp.json();
  } catch (e) { out.errors.push('fetch(open) threw: ' + (e && e.message ? e.message : String(e))); }
  out.checked = Array.isArray(rows) ? rows.length : 0;

  for (const row of rows) {
    try {
      if (!row.line_uid) continue;
      if (!hasToken) { out.skipped_no_token++; continue; }
      const pushResp = await pushLine(token, row.line_uid, openMsg(row));
      if (pushResp.ok) {
        const patchResp = await patchMpDelivery(row.id, { status: 'request_open', notified_at: new Date().toISOString() });
        if (patchResp.ok) out.notified++;
        else out.errors.push(`patch(open) failed for row ${row.id}: ${patchResp.status} ${await patchResp.text().catch(()=>'')}`);
      } else {
        out.errors.push(`line push(open) failed for row ${row.id}: ${pushResp.status} ${await pushResp.text().catch(()=>'')}`);
      }
    } catch (e) { out.errors.push(`row ${row && row.id} (open) threw: ` + (e && e.message ? e.message : String(e))); }
  }
  if (!hasToken && out.checked) out.errors.push('LINE_CHANNEL_ACCESS_TOKEN missing — open-window pushes skipped, rows left un-notified for retry');
  return out;
}

// ครบ request_deadline แล้วลูกค้ายังไม่ตอบ (status ยังเป็น request_open) → ปิดอัตโนมัติเป็น "ไม่เปลี่ยนแปลงเมนู"
// ไม่ push LINE ตรงนี้ — ลูกค้าเห็นเวลาถอยหลัง + ข้อความอธิบายอยู่แล้วในหน้า LIFF ตอนกดเข้ามาดู (กันสแปม)
async function runAutoCloseExpired(today) {
  const out = { checked: 0, closed: 0, errors: [] };
  let rows = [];
  try {
    const resp = await fetchMpDeliveries(`status=eq.request_open&request_deadline=lt.${today}`);
    if (!resp.ok) out.errors.push(`fetch(expire) failed: ${resp.status} ${await resp.text().catch(()=>'')}`);
    else rows = await resp.json();
  } catch (e) { out.errors.push('fetch(expire) threw: ' + (e && e.message ? e.message : String(e))); }
  out.checked = Array.isArray(rows) ? rows.length : 0;

  for (const row of rows) {
    try {
      const patchResp = await patchMpDelivery(row.id, { status: 'no_change' });
      if (!patchResp.ok) { out.errors.push(`patch(expire) failed for row ${row.id}: ${patchResp.status} ${await patchResp.text().catch(()=>'')}`); continue; }
      out.closed++;
    } catch (e) { out.errors.push(`row ${row && row.id} (expire) threw: ` + (e && e.message ? e.message : String(e))); }
  }
  return out;
}

async function runDayBeforeReminder(token, hasToken, tomorrow) {
  const out = { checked: 0, notified: 0, skipped_no_token: 0, errors: [] };
  let rows = [];
  try {
    const resp = await fetchMpDeliveries(`delivery_date=eq.${tomorrow}&day_before_notified_at=is.null&status=not.in.(skipped,cancelled)`);
    if (!resp.ok) out.errors.push(`fetch(day-before) failed: ${resp.status} ${await resp.text().catch(()=>'')}`);
    else rows = await resp.json();
  } catch (e) { out.errors.push('fetch(day-before) threw: ' + (e && e.message ? e.message : String(e))); }
  out.checked = Array.isArray(rows) ? rows.length : 0;

  for (const row of rows) {
    try {
      if (!row.line_uid) continue;
      if (!hasToken) { out.skipped_no_token++; continue; }
      const pushResp = await pushLine(token, row.line_uid, dayBeforeMsg(row));
      if (pushResp.ok) {
        const patchResp = await patchMpDelivery(row.id, { day_before_notified_at: new Date().toISOString() });
        if (patchResp.ok) out.notified++;
        else out.errors.push(`patch(day-before) failed for row ${row.id}: ${patchResp.status} ${await patchResp.text().catch(()=>'')}`);
      } else {
        out.errors.push(`line push(day-before) failed for row ${row.id}: ${pushResp.status} ${await pushResp.text().catch(()=>'')}`);
      }
    } catch (e) { out.errors.push(`row ${row && row.id} (day-before) threw: ` + (e && e.message ? e.message : String(e))); }
  }
  if (!hasToken && out.checked) out.errors.push('LINE_CHANNEL_ACCESS_TOKEN missing — day-before pushes skipped, rows left un-notified for retry');
  return out;
}

module.exports = async (req, res) => {
  try {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const hasToken = !!token;
    const today = new Date().toISOString().slice(0, 10);
    const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().slice(0, 10);

    const openWindows = await runOpenRequestWindows(token, hasToken, today);
    const autoClose = await runAutoCloseExpired(today);
    const dayBefore = await runDayBeforeReminder(token, hasToken, tomorrow);

    return res.status(200).json({ open_windows: openWindows, auto_close_expired: autoClose, day_before_reminder: dayBefore });
  } catch (outerErr) {
    return res.status(200).json({ errors: ['unhandled error: ' + (outerErr && outerErr.message ? outerErr.message : String(outerErr))] });
  }
};

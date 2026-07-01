const SUPABASE_URL = "https://zdartbvhbvqlwzwyyiia.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8";

function buildMessage(row) {
  const typeLabel = (row.mp_type || '').toUpperCase();
  return `📋 แจ้งเตือน Meal Plan\n\nรอบที่ ${row.round_no}/${row.total_rounds} ของแผน ${typeLabel} ${row.mp_set} ของคุณ\nตอนนี้เปิดให้เลือกเมนูสำหรับรอบนี้แล้ว!\n\nกดลิงก์เพื่อเลือกเมนู:\nhttps://liff.line.me/2010442513-NI3JGTkb?screen=mp-manage`;
}

module.exports = async (req, res) => {
  try {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const hasToken = !!token;

    const today = new Date().toISOString().slice(0, 10);

    const errors = [];
    let checked = 0;
    let notified = 0;
    let skippedNoToken = 0;

    let rows = [];
    try {
      const url = `${SUPABASE_URL}/rest/v1/mp_deliveries?status=eq.scheduled&notified_at=is.null&request_opens_at=lte.${today}&select=*`;
      const listResp = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
        },
      });
      if (!listResp.ok) {
        const text = await listResp.text().catch(() => '');
        errors.push(`fetch mp_deliveries failed: ${listResp.status} ${text}`);
      } else {
        rows = await listResp.json();
      }
    } catch (e) {
      errors.push('fetch mp_deliveries threw: ' + (e && e.message ? e.message : String(e)));
    }

    checked = Array.isArray(rows) ? rows.length : 0;

    for (const row of rows) {
      try {
        if (!row.line_uid) continue;

        if (!hasToken) {
          skippedNoToken++;
          continue;
        }

        const pushResp = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify({
            to: row.line_uid,
            messages: [{ type: 'text', text: buildMessage(row) }],
          }),
        });

        if (pushResp.ok) {
          const patchResp = await fetch(`${SUPABASE_URL}/rest/v1/mp_deliveries?id=eq.${row.id}`, {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              status: 'request_open',
              notified_at: new Date().toISOString(),
            }),
          });

          if (patchResp.ok) {
            notified++;
          } else {
            const text = await patchResp.text().catch(() => '');
            errors.push(`patch failed for row ${row.id}: ${patchResp.status} ${text}`);
          }
        } else {
          const text = await pushResp.text().catch(() => '');
          errors.push(`line push failed for row ${row.id}: ${pushResp.status} ${text}`);
        }
      } catch (rowErr) {
        errors.push(`row ${row && row.id} threw: ` + (rowErr && rowErr.message ? rowErr.message : String(rowErr)));
      }
    }

    if (!hasToken) {
      errors.push('LINE_CHANNEL_ACCESS_TOKEN missing — pushes skipped, rows left un-notified for retry');
    }

    return res.status(200).json({
      checked,
      notified,
      skipped_no_token: skippedNoToken,
      errors,
    });
  } catch (outerErr) {
    return res.status(200).json({
      checked: 0,
      notified: 0,
      skipped_no_token: 0,
      errors: ['unhandled error: ' + (outerErr && outerErr.message ? outerErr.message : String(outerErr))],
    });
  }
};

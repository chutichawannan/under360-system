/* เทสเก็บ utm_content — ห้อง M แจ้ง 8 ก.ย.
   หัวใจ: ยังไม่รัน SQL ก็ต้องสั่งของได้ตามปกติ · ไม่ทับ source_campaign เดิม */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const src = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8')
  .split(String.fromCharCode(13)).join('');
const grab = (n) => {
  let i = src.indexOf('function ' + n + '(');
  if (i < 0) throw new Error('ไม่เจอ ' + n);
  let d = 0, st = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') { d++; st = true; }
    else if (src[j] === '}') { d--; if (st && d === 0) return src.slice(i, j + 1); }
  }
};
let ok = 0, fail = 0;
const t = (n, got, want) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL + '     ได้  ' + g + NL + '     ควร  ' + w); }
};
const body = [grab('utmRead'), grab('utmContent'), grab('utmTag')].join(NL);
const run = (search, stored) => {
  const store = { u360_utm: stored ? JSON.stringify(stored) : null };
  const ctx = {
    location: { search },
    localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
    URLSearchParams,
    UTM_MAX_AGE_DAYS: 30,
  };
  return new Function(...Object.keys(ctx), body + NL + '; return {tag:utmTag(), content:utmContent(), raw:utmRead()};')(...Object.values(ctx));
};

console.log(NL + '① แอดเจ 6 ชิ้นงาน — ต้องแยกออกจากกัน');
{
  const a1 = run('?utm_source=fb&utm_medium=paid&utm_campaign=jay2026&utm_content=a1');
  const b3 = run('?utm_source=fb&utm_medium=paid&utm_campaign=jay2026&utm_content=b3');
  t('ชิ้นงาน a1', a1.content, 'a1');
  t('ชิ้นงาน b3', b3.content, 'b3');
  t('campaign ยังเหมือนเดิมทั้งคู่', [a1.tag, b3.tag], ['fb/paid/jay2026', 'fb/paid/jay2026']);
  t('content ไม่ไปปนใน campaign', a1.tag.includes('a1'), false);
}

console.log(NL + '② ไม่มี content = ของเดิมทำงานเหมือนเดิม');
{
  const r = run('?utm_source=fb&utm_medium=paid&utm_campaign=jay2026');
  t('campaign ปกติ', r.tag, 'fb/paid/jay2026');
  t('content เป็น null', r.content, null);
}
t('ไม่มี utm เลย = null ทั้งคู่', [run('').tag, run('').content], [null, null]);

console.log(NL + '③ อ่านจากที่เว็บฝากไว้ (localStorage)');
{
  const r = run('', { source: 'fb', medium: 'paid', campaign: 'jay2026', content: 'a2', ts: Date.now() });
  t('ได้ content จาก localStorage', r.content, 'a2');
  t('ของเก่าที่ไม่มี content ก็ไม่พัง',
    run('', { source: 'ig', medium: 'paid', campaign: 'old', ts: Date.now() }).content, null);
}
t('utm เก่าเกิน 30 วัน = ไม่นับ',
  run('', { source: 'fb', campaign: 'old', content: 'z9', ts: Date.now() - 40 * 86400000 }).content, null);

console.log(NL + '④ ค่าแปลก ๆ ในลิงก์');
t('อักขระพิเศษถูกกรอง', run('?utm_source=fb&utm_content=a1<script>').content, 'a1script');
t('ยาวเกิน 40 ตัวถูกตัด', run('?utm_source=fb&utm_content=' + 'x'.repeat(60)).content.length, 40);
t('content ว่าง = null', run('?utm_source=fb&utm_content=').content, null);
t('มีแต่อักขระต้องห้าม = null', run('?utm_source=fb&utm_content=%23%24%25').content, null);

console.log(NL + '⑤ ปลอดภัยตอนยังไม่ได้รัน SQL');
t('เช็คคอลัมน์ก่อนใส่ payload', src.includes('if(_con && hasSourceContentColumn) orderPayload.source_content = _con;'), true);
t('มีตัวเช็ค capability ตอนเปิดแอป', src.includes("sb.from('orders').select('source_content').limit(1)"), true);
t('ตั้งค่าจากผลจริง', src.includes('hasSourceContentColumn = !val(scR).error;'), true);
t('ค่าเริ่มต้นเป็น false (ปลอดภัยไว้ก่อน)', src.includes('let hasSourceContentColumn = false;'), true);
t('ไม่ต่อท้าย source_campaign ตามที่ M เตือน', /source_campaign = _utm \+ /.test(src), false);

console.log(NL + (fail ? '❌' : '✅') + ' ผ่าน ' + ok + ' · ตก ' + fail);
process.exit(fail ? 1 : 0);

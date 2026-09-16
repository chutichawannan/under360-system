/* เทสด่านกัน "โค้ดระเบิดเวลา" + ประวัติการแก้โปรโมชั่น
   (เลขาเสนอ · พี่ปืนตั้งข้อสังเกต · 16 ก.ย. 2569)

   ที่มา: วันเดียวเจอ 2 ตัวแพทเทิร์นเดียวกัน — UNDER50 (จ่ายออกไปแล้ว 45 ใบใน 1 เดือน)
          กับ DISCOUNT10 (เจอก่อนมีคนใช้) ทั้งคู่ไม่มีใครจำได้ว่าใครสร้าง
          เพราะการแก้โปรโมชั่นไม่เคยถูกจดไว้ที่ไหนเลย ทั้งที่เป็นเรื่องเงินตรง ๆ */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const OH = fs.readFileSync(new URL('../../operation_hub.html', import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL+'     ได้  '+g+NL+'     ควร  '+w); } };
const has = (x) => OH.indexOf(x) >= 0;

console.log(NL + '① ด่านเตือนโค้ดที่เปิดกว้างทุกทาง');
/* อันตรายเมื่อครบ 4 ข้อ: ทุกอย่าง + ไม่มีวันหมดอายุ + ไม่จำกัดครั้ง + ไม่มีขั้นต่ำ */
t('เช็คครบทั้ง 4 เงื่อนไข',
  has('(row.scope_type||"all")==="all" && !row.expires_at && !row.usage_limit && !row.min_order'), true);
t('บอกด้วยว่าอันตรายยังไง ไม่ใช่เตือนลอย ๆ', has('ส่วนลดถาวรที่ไม่มีอะไรหยุดมันเอง'), true);
t('ยกเคสจริงให้เห็นภาพ', has('UNDER50 จ่ายออกไป 45 ใบในเดือนเดียว'), true);
t('บอกทางแก้ให้ด้วย', has('แนะนำให้ใส่อย่างน้อย 1 อย่าง'), true);
/* ⚠️ เตือน ไม่ใช่ห้าม — บางแคมเปญตั้งใจจริง ห้ามเลยจะขวางงานแอดมิน */
t('กดยืนยันแล้วยังบันทึกได้ (เตือน ไม่ใช่ห้าม)', has('if(!confirm(_warn)) return;'), true);
t('ถ้าโชว์ให้ลูกค้าเห็นเองด้วย ยิ่งต้องบอก', has('โชว์ให้ลูกค้าทุกคนเห็นเองที่หน้าจ่ายเงิน'), true);

console.log(NL + '② จดประวัติทุกทางที่แก้โปรฯ ได้');
t('มีตัวจดกลาง', has('function logPromo(what, code, detail)'), true);
t('สร้าง/แก้', has('editingPromoId ? "แก้ไขโค้ด" : "สร้างโค้ดใหม่"'), true);
t('เปิด/ปิด', has('logPromo(active?"เปิดโค้ด":"ปิดโค้ด"'), true);
t('ลบทิ้ง', has('logPromo("ลบโค้ดทิ้ง", code'), true);
t('จดชื่อโค้ด ไม่ใช่ id ที่อ่านไม่รู้เรื่อง', has('(_p&&_p.code)||id'), true);
t('อ่านรายการจากตัวแปรที่มีอยู่จริง', has('_loadedPromos!=="undefined"&&_loadedPromos'), true);

console.log(NL + '③ จดอะไรบ้าง — ต้องพอให้สืบย้อนได้');
['ขั้นต่ำ ', 'จำกัด ', 'หมดอายุ ', 'ผูกกับ ', 'โชว์ให้ลูกค้าเห็นเอง', 'ซ้อนโค้ดอื่นได้']
  .forEach(k => t('บันทึก "' + k.trim() + '"', has(k), true));
t('รู้ว่าใครทำ', has('var who=(typeof currentUser!=="undefined" && currentUser)'), true);

console.log(NL + '④ การจดประวัติต้องไม่ทำให้งานหลักพัง');
t('พังก็เงียบ ไม่ขวางการบันทึกโปรฯ', has('}).then(function(){},function(){});') && has('}catch(e){}'), true);
t('ใช้ action_type ที่แถบประวัติเดิมอ่านได้อยู่แล้ว', has('action_type:"kq_status", actor:who, source:"oh"'), true);

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + ok) : ('✅ ผ่านทั้งหมด ' + ok + ' ข้อ'));
process.exitCode = fail ? 1 : 0;

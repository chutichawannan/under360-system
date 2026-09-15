/* เทสกฎจัดถุง — นัทเคาะเอง 15 ก.ย. 2569 หลังไล่เคส S4 จนถึงต้นตอ

   ต้นตอที่เจอ: ยอดของวันพรุ่งนี้ปิด 6 โมงเย็นวันนี้ · แต่ครัวจัดของตอน 9 โมงเช้าวันก่อน
   = จัดก่อนยอดปิด 9 ชั่วโมง → ใบที่มาทีหลังตกหล่นทุกวัน → สต็อกเพี้ยนตาม

   นัทสั่งว่าห้ามแก้ด้วยการบอกกฎให้ครัวจำ ("ครัวมันงงกับระบบ ถ้าไม่ไปจี้ มันก็จะทำแบบเดิม")
   → หน้าจอต้องไม่ยอมให้ทำผิดจังหวะ */
import fs from 'node:fs';
const NL = String.fromCharCode(10);
const K = fs.readFileSync(new URL('../../pwa/k2.html', import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
const L = fs.readFileSync(new URL('../../liff_customer.html', import.meta.url), 'utf8').split(String.fromCharCode(13)).join('');
let ok = 0, fail = 0;
const t = (n, got, want) => { const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) { ok++; console.log('  ✅', n); } else { fail++; console.log('  ❌', n, NL+'     ได้  '+g+NL+'     ควร  '+w); } };
const hasK = (x) => K.indexOf(x) >= 0;

console.log(NL + '① จัดถุงได้เฉพาะวันส่ง — วันข้างหน้าต้องกดไม่ได้');
t('มีตัวตัดสิน canPack', hasK('function canPack(ymd){ return String(ymd) <= thaiToday(); }'), true);
{
  /* ดึงตัวตัดสินจริงมารัน ไม่ใช่เขียนตรรกะใหม่มาเทส */
  const f = new Function('thaiToday', K.slice(K.indexOf('function canPack('), K.indexOf('function packLockMsg(')) + '; return canPack;')(() => '2026-09-15');
  t('พรุ่งนี้ = จัดไม่ได้', f('2026-09-16'), false);
  t('วันนี้ = จัดได้', f('2026-09-15'), true);
  t('เมื่อวาน = จัดได้ (ไว้เคลียร์ของค้าง)', f('2026-09-14'), true);
}
t('ปุ่มจัดกล่องเสร็จเปลี่ยนเป็นล็อกเมื่อยังไม่ถึงวัน', hasK('🔒 ยังจัดไม่ได้'), true);
t('แถวติ๊กรายกล่องก็กดไม่ลงด้วย', hasK("(canPack(DAY)?'':' lockrow')"), true);
/* ล็อกแล้วต้องบอกเหตุผล ไม่ใช่เงียบ — ครัวอ่านไทยออก 2 ใน 6 คน ห้ามปล่อยให้เดา */
t('แตะแล้วเด้งข้อความบอกเหตุผล', hasK('function packLocked()') && hasK('ห้ามจัดล่วงหน้า'), true);
t('หัวจอบอกด้วยว่าล็อกอยู่', hasK("canPack(DAY)?'':'<div class=\"bar-txt\""), true);

console.log(NL + '② กันอีกชั้นที่ใบปริ้น (นัทสั่งเพิ่มเอง)');
t('กดปริ้นใบวันข้างหน้า = เตือนก่อน', hasK('ใบนี้เป็นของวันข้างหน้า ยอดยังไม่ปิด'), true);

console.log(NL + '③ ปุ่มติ๊กทั้งวัน — เฉพาะวันที่เลยมาแล้ว');
t('ปุ่มโผล่เฉพาะวันที่เลยแล้วและยังมีใบค้าง', hasK("if(DAY < thaiToday() && done < bills){"), true);
t('กันกดผิดวัน', hasK('if(DAY >= thaiToday()){ toast("ใช้ได้เฉพาะวันที่เลยมาแล้ว"); return; }'), true);
/* ถ้าจริง ๆ ยังไม่ได้จัด เลขในตู้จะเกิน — ต้องเตือนก่อน ไม่ใช่กดปุ๊บทำเลย */
t('ถามยืนยันก่อน พร้อมบอกผลที่ตามมา', hasK('เลขในตู้จะเกิน ต้องให้ครัวนับใหม่'), true);

console.log(NL + '④ ของหมดไม่โชว์ในหน้าเลือกแพค (นัทสั่ง พร้อมรูปหน้าจอ)');
t('กรองของหมดออกจากลิสต์', L.indexOf('return _s.unlimited || _s.stock>0;') >= 0, true);
/* ที่เลือกไว้แล้วต้องไม่หายไปต่อหน้า */
t('ที่ลูกค้าเลือกไว้แล้วยังโชว์ต่อ', L.indexOf('if((sel[mi.code]||0)>0) return true;') >= 0, true);

console.log(NL + '⑤ ของเดิมต้องไม่พัง');
t('ยอดจองยังตัดใบที่จัดครบแล้วเหมือนเดิม', hasK('if(packDoneOf(o)) return;'), true);
t('นับของยังคิดยอดขายได้แบบเดิม', hasK('const sellable=(n==null)?null:Math.max(0,n-booked);'), true);

console.log(NL + '────────────────────────────');
console.log(fail ? ('❌ ตก ' + fail + ' ข้อ · ผ่าน ' + ok) : ('✅ ผ่านทั้งหมด ' + ok + ' ข้อ'));
process.exitCode = fail ? 1 : 0;

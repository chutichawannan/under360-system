/**
 * ตัวตัดสิน "เปิดขายได้ไหม" — ฟังก์ชันล้วน ไม่แตะ DB (ทดสอบด้วยข้อมูลจำลองได้)
 * ใช้โดย go_live_week_stock.mjs · ทดสอบโดย test_go_live_stops.mjs
 * นัทสั่ง 11 ก.ย. (ผ่านห้อง u): นิวเปิดขายเอง ต้องพิสูจน์ว่าหยุดจริง 4 เคส
 *   เมนูไม่พร้อม · เมนูบ้ง · ซ้ำภายใน 3 เดือน · S กับ D ไม่ตรงจาน
 * 2 เคสหลังตรวจโดยด่าน check_weekly_menu.mjs (05) → ตัวนี้บังคับ ด่านผ่าน + ดูรูปแล้ว + ลายนิ้วมือตรง + ไม่เก่าเกิน 7 วัน
 */
import crypto from 'crypto';
export const SLOTS=['S1','S2','S3','S4','S5','S6','S7','S8','D1','D2','D3','D4','D5'];
const fileOf=m=>String((m.image_urls||[])[0]||'').split('/').pop().split('?')[0];
// ต้องเหมือน check_weekly_menu.mjs ทุกช่อง ไม่งั้นลายนิ้วมือไม่ตรงกันเอง
export function fingerprint(menus){
  const rows=menus.map(m=>[m.code,m.subcode,m.name,m.price,m.kcal,m.protein,m.carb,m.fat,fileOf(m)].join('|')).sort();
  return crypto.createHash('sha1').update(rows.join('\n')).digest('hex').slice(0,16);
}
const has=v=>v!=null&&v!==''&&Number(v)>=0;
/** ด่านความพร้อม (ไม่พร้อม / บ้ง) · requireLabels=true ตอนจะเปิดขาย */
export function readiness({week,plan,stock,rows,requireLabels=false}){
  const r=[];
  if(!plan) r.push('ไม่มีแผนป้ายช่องของสัปดาห์นี้');
  if(!stock) r.push('ไม่มีแผนสต็อกของสัปดาห์นี้');
  if(!plan||!stock) return r;
  const codes=SLOTS.map(s=>plan[s]).filter(Boolean);
  if(new Set(codes).size!==codes.length) r.push('รหัสซ้ำในแผน');
  const by=new Map((rows||[]).map(m=>[m.code,m]));
  for(const s of SLOTS){
    const c=plan[s];
    if(!c){r.push(s+' ไม่มีเมนูในแผน');continue;}
    if(c[0]!==s[0]) r.push(s+' ใส่รหัสผิดฝั่ง '+c);
    if(!(Number(stock[s])>0)) r.push(s+' ไม่มีตัวเลขสต็อก');
    const m=by.get(c);
    if(!m){r.push(s+' '+c+' ไม่มีในตาราง');continue;}
    if(m.available_from!==week) r.push(s+' '+c+' available_from='+m.available_from);
    if(m.category!==(s[0]==='S'?'no_special':'pack_regular')) r.push(s+' '+c+' หมวด='+m.category);
    if(!(m.image_urls||[]).length) r.push(s+' '+c+' ไม่มีรูป');
    if(!(Number(m.kcal)>0&&Number(m.protein)>0&&has(m.carb)&&has(m.fat))) r.push(s+' '+c+' โภชนาการไม่ครบ');
    if(!(Number(m.price)>=(s[0]==='S'?125:80))) r.push(s+' '+c+' ราคา '+m.price+' ต่ำกว่าเกณฑ์');
    if(requireLabels&&m.subcode!==s) r.push(s+' '+c+' ป้าย='+m.subcode+' ไม่ตรงช่อง');
    if(requireLabels&&m.stock_total==null) r.push(s+' '+c+' stock_total ว่าง (= ขายไม่จำกัด)');
  }
  return r;
}
/** ด่านผลตรวจ 05 (ซ้ำ 3 เดือน / S-D ไม่ตรงจาน / รูป) */
export function gateCheck({gateRec,fp,planCodes,now=Date.now()}){
  if(!gateRec) return ['ไม่มีผลด่านตรวจ (weekly_gate) ของสัปดาห์นี้'];
  const r=[];
  if(gateRec.pass!==true) r.push('ด่านตรวจไม่ผ่าน: '+((gateRec.fails||[]).slice(0,5).join(' · ')||'ไม่ระบุ'));
  if(gateRec.visual_ok!==true) r.push('ยังไม่มีคนเปิดดูรูปทุกตัว (visual_ok)');
  if(gateRec.fingerprint!==fp) r.push('ลายนิ้วมือไม่ตรง (ด่าน '+gateRec.fingerprint+' · ตอนนี้ '+fp+') = ชุดถูกแก้หลังผ่านด่าน');
  const age=gateRec.at?(now-new Date(gateRec.at).getTime())/864e5:Infinity;
  if(!(age<=7)) r.push('ผลด่านเก่าเกิน 7 วัน ('+(isFinite(age)?age.toFixed(1):'ไม่มีเวลา')+' วัน)');
  const gc=(gateRec.codes||[]).slice().sort().join(','), pc=(planCodes||[]).slice().sort().join(',');
  if(gc!==pc) r.push('รหัสที่ด่านตรวจ ไม่ตรงกับแผนป้ายช่อง');
  return r;
}
/** ยืนยันก่อนเขียน (pm 11 ก.ย.): ต้องมี --confirm <สัปดาห์> ตรงกับสัปดาห์ที่จะเขียน */
export function confirmCheck({args,week}){
  const i=(args||[]).indexOf('--confirm');
  if(i<0) return ['ต้องใส่ --confirm '+week+' เพื่อยืนยันว่าจะเขียนของจริงสัปดาห์นี้'];
  const v=(args||[])[i+1];
  if(v!==week) return ['--confirm '+(v||'(ว่าง)')+' ไม่ตรงกับสัปดาห์ '+week];
  return [];
}

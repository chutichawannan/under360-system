// ด่านตรวจความสมเหตุสมผลของสูตร — จับสูตรที่ "มีอยู่ในระบบ แต่เชื่อไม่ได้"
// ที่มา: f-track เสนอ 15 ก.ย. 2026 หลังเจอว่า 4 ใน 15 เมนูที่ "มีสูตรครบ" ข้อมูลผิดจนคิดต้นทุนไม่ได้ (A3 · D178 · D159 · S145)
// รัน: node scripts/niw/recipe_sanity.mjs [--all]
const SB='https://zdartbvhbvqlwzwyyiia.supabase.co';
const K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H={apikey:K,Authorization:'Bearer '+K};
const g=async u=>(await fetch(SB+'/rest/v1/'+u,{headers:H})).json();

const MEAT=/^โปรตีน|อกไก่|สะโพกไก่|ไก่สับ|เนื้อไก่|^ไก่|^หมู|กุ้ง(?!แห้ง)|กระพง|แซลมอน|ปลาทู|ทูน่า|ปลาดอรี|ปลานิล|เนื้อวัว/;
const SEASON=/ซีอิ|น้ำปลา|น้ำตาล|เกลือ|น้ำมัน|ซอส|พริกไทย|แม็คกี้|มิริน|โชยุ|กะปิ|เต้าเจี้ยว|โคชูจัง|น้ำส้มสายชู|น้ำมะนาว/;
const STARCH=/^ข้าว(?!โพด)|^เส้น|^บะหมี่|^สปาเก็ต|^พาสต้า|^วุ้นเส้น|^มักกะโรนี|^โจ๊ก/;

const L=r=>(r.parts||[]).reduce((a,p)=>a+((p.lines||[]).filter(l=>l&&String(l.name||l.label||'').trim()).length),0);
const ln=r=>(r.parts||[]).flatMap(p=>(p.lines||[]).map(l=>({n:String(l.name||l.label||'').trim(),q:Number(l.qty||l.amount||0)}))).filter(x=>x.n);

function check(r){
  const it=ln(r), tot=it.reduce((a,x)=>a+x.q,0), f=[];
  const meat=it.filter(x=>MEAT.test(x.n)), mt=meat.reduce((a,x)=>a+x.q,0);
  if(tot>600) f.push(`สูตร batch? รวม ${tot.toFixed(0)}g`);
  else if(tot<150) f.push(`เบาผิดปกติ รวม ${tot.toFixed(0)}g`);
  if(meat.length&&mt<120) f.push(`เนื้อ ${mt.toFixed(0)}g < 120g`);
  // HP/LC เป็นแม่แบบ Meal Plan (โปรตีนระบุชนิดทีหลัง) ไม่ใช่สูตรกล่องเดี่ยว — ไม่ตรวจชื่อ/ผักเกิน
  if(!meat.length&&tot<=600) f.push('ไม่มีเนื้อสัตว์ในสูตร');
  for(const x of it){
    if(SEASON.test(x.n)&&x.q>15) f.push(`${x.n} ${x.q}g เครื่องปรุงเกิน 15g`);
    else if(!MEAT.test(x.n)&&!STARCH.test(x.n)&&x.q>150) f.push(`${x.n} ${x.q}g ผักเกิน 150g`);
  }
  const nm=String(r.name||'');
  if(/^(HP|LC)/.test(String(r.code||''))) return {tot,flags:f.filter(x=>/batch|เบาผิดปกติ/.test(x))};
  for(const [re,lab] of [[/^ข้าว(?!โพด)/,'ข้าว'],[/วุ้นเส้น/,'วุ้นเส้น'],[/ไข่เค็ม/,'ไข่เค็ม'],[/สาหร่าย/,'สาหร่าย'],[/เห็ดหอม/,'เห็ดหอม']])
    if(re.test(nm)&&!it.some(x=>re.test(x.n))) f.push(`ชื่อมี "${lab}" แต่ไม่มีในสูตร`);
  return {tot,flags:f};
}

const rec=(await g('kitchen_data?select=data&key=eq.recipes'))[0].data;
const real=rec.filter(r=>r&&L(r)>0);
const bad=[];
for(const r of real){const c=check(r); if(c.flags.length) bad.push({code:r.code||'(ไร้บ้าน)',name:r.name,...c});}
bad.sort((a,b)=>b.flags.length-a.flags.length);
console.log(`ตรวจสูตรที่มีบรรทัดจริง ${real.length} ตัว → 🔴 น่าสงสัย ${bad.length} (${(bad.length/real.length*100).toFixed(0)}%) · สะอาด ${real.length-bad.length}`);
const cnt={};
bad.forEach(b=>b.flags.forEach(f=>{const k=f.replace(/^.+? [\d.]+g /,'').replace(/^เนื้อ.*$/,'เนื้อ < 120g').replace(/^สูตร batch.*/,'สูตร batch (รวม >600g)').replace(/^เบาผิดปกติ.*/,'เบาผิดปกติ (รวม <150g)');cnt[k]=(cnt[k]||0)+1;}));
console.log('\nสรุปตามชนิดปัญหา:');
Object.entries(cnt).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${String(v).padStart(4)}  ${k}`));
const n=process.argv.includes('--all')?bad.length:30;
console.log(`\nน่าสงสัยที่สุด ${Math.min(n,bad.length)} ตัว:`);
bad.slice(0,n).forEach(b=>console.log(`  ${b.code.padEnd(9)} ${b.name.slice(0,28).padEnd(29)} ${b.tot.toFixed(0).padStart(5)}g | ${b.flags.join(' · ')}`));

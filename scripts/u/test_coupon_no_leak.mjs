/* 🔒 เทสสำคัญสุด: ลูกค้าจริงต้องไม่เห็นอะไรเลยจากของที่ยังทดสอบอยู่
   ดึงไฟล์จาก production จริงมาตรวจ ไม่ใช่ไฟล์ในเครื่อง */
const src = await (await fetch('https://under360-system.vercel.app/liff_customer.html')).text();
const need = [
  ['กระเป๋าคูปอง deploy แล้ว',           /const CW_KEY = 'coupon_wallet_beta'/],
  ['ประตูโหมดทดสอบคุมการโหลด',           /if \(betaOn\('coupon_wallet'\)\)/],
  ['แถบชวนเก็บคุมด้วยประตู',             /betaOn\('coupon_wallet'\) \? cwUncollected\(\)\.length : 0/],
  ['ช่องเลือกคูปองหน้าจ่ายคุมด้วยประตู',  /if\(!betaOn\('coupon_wallet'\)\)\{ wrap\.style\.display='none'/],
  ['กันโค้ด BETA หลุดชิปแนะนำ',          /\/\^BETA\/i\.test\(p\.code\|\|''\) && !betaOn\('coupon_wallet'\)/],
];
let bad=0;
need.forEach(([why,re])=>{ const ok=re.test(src); if(!ok)bad++; console.log(ok?'✅':'🔴', why); });
const betaOn = () => false;   // จำลองลูกค้าทั่วไป
const promos = ['FREESHIP','BETA200','BETA10','BETASHIP'].map(c=>({code:c}));
const seen = promos.filter(p => !(/^BETA/i.test(p.code||'') && !betaOn()));
console.log('\nลูกค้าทั่วไปจะเห็นชิปแนะนำ:', seen.map(p=>p.code).join(', ') || '(ไม่มี)');
const leak = seen.filter(p=>/^BETA/i.test(p.code));
if(leak.length){ bad++; console.log('🔴 หลุด!', leak.map(p=>p.code).join(', ')); }
else console.log('✅ ไม่มีโค้ดทดสอบหลุดไปหาลูกค้า');
console.log('\n'+(bad?('🔴 มีปัญหา '+bad+' จุด'):'✅ ผ่านทุกข้อ'));

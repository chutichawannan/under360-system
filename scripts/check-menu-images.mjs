const SB="https://zdartbvhbvqlwzwyyiia.supabase.co/rest/v1";
const KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8";
const H={apikey:KEY,Authorization:"Bearer "+KEY};
const r=await fetch(`${SB}/menu_items?select=code,name,is_available,image_urls&image_urls=not.is.null&limit=2000`,{headers:H});
const rows=(await r.json()).filter(x=>Array.isArray(x.image_urls)&&x.image_urls[0]);
console.log("เมนูที่มีรูป:",rows.length);
const bad=[],ok=[],err=[];
let i=0;
for(const m of rows){
  i++;
  const url=m.image_urls[0];
  try{
    // ดึงแค่ 8 ไบต์ท้ายไฟล์ (เร็ว) เช็ค marker ปิดไฟล์
    const res=await fetch(url,{headers:{Range:"bytes=-8"}});
    const buf=Buffer.from(await res.arrayBuffer());
    const hex=buf.toString("hex").toUpperCase();
    const isJpg=/\.jpe?g$/i.test(url), isPng=/\.png$/i.test(url);
    let good=false;
    if(isJpg) good=hex.endsWith("FFD9");
    else if(isPng) good=hex.includes("49454E44AE426082");
    else good=true;
    (good?ok:bad).push({code:m.code,name:m.name,avail:m.is_available,url});
  }catch(e){ err.push(m.code); }
  if(i%50===0) console.log("  ...ตรวจแล้ว",i);
}
console.log("\n✅ รูปสมบูรณ์:",ok.length);
console.log("❌ รูปเสีย/ตัดกลางคัน:",bad.length);
console.log("⚠️ ตรวจไม่ได้:",err.length);
console.log("\n— เมนูที่รูปเสีย (ที่เปิดขายอยู่ = ลูกค้าเห็น) —");
bad.filter(b=>b.avail).forEach(b=>console.log("  ",b.code,b.name));
const badHidden=bad.filter(b=>!b.avail);
if(badHidden.length) console.log("\n(ปิดขายอยู่ ไม่กระทบลูกค้า):",badHidden.map(b=>b.code).join(", "));

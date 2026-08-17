// ฟ้า — แก้ TooN (17 ส.ค. 2026): เปลี่ยนจากชุด Trial เฉพาะตัว → ชุดแกนของวัน (HP09,10,15,17,23,25,29)
const URL='https://zdartbvhbvqlwzwyyiia.supabase.co';
const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8';
const H = {apikey:KEY, Authorization:`Bearer ${KEY}`, 'Content-Type':'application/json'};

const map = [
  {id:'82e63510-436d-4771-ae9d-7238ada88439', code:'HP09', name:'หมูสันในหวานไร้มัน + ไข่ฝอย'},
  {id:'dceda4cc-e9f6-4e5e-8dc7-3e3c64c66be8', code:'HP10', name:'ยำไข่มะตูม'},
  {id:'6e2343e1-a185-49e8-98a8-116083ff0b7a', code:'HP15', name:'กุ้งผัดซอสกระเทียมพริกไทยดำ ควินัว สลัดผัก'},
  {id:'36f10db9-4986-4257-8581-727a9308ca2e', code:'HP17', name:'หมูผัดพริกหวานควินัว เห็ดย่าง'},
  {id:'d9b33c2c-a40d-4c2d-9c35-c5e27f46ff85', code:'HP25', name:'สเต็กปลากระพงเพสโต้ ผักย่าง บร้อคโครี่'},
];
// HP07 row (had "2 กล่อง" stray note) -> HP29
const hp07row = {id:'7297c9a9-d2ee-4069-a50d-07a0d5cea7b7', code:'HP29', name:'ซุปกิมจิหมูไข่ทานกับเส้นบุก'};
// HP23 row stays as-is (already in new core set) — no change needed

async function patch(id, body){
  const r = await fetch(`${URL}/rest/v1/order_items?id=eq.${id}`, {method:'PATCH', headers:{...H, Prefer:'return=representation'}, body: JSON.stringify(body)});
  const j = await r.json();
  console.log(id, r.status, JSON.stringify(j));
}

for(const m of map){
  await patch(m.id, {menu_name: m.name, menu_code: m.code, notes:'meal_plan:box:r1/1'});
}
await patch(hp07row.id, {menu_name: hp07row.name, menu_code: hp07row.code, notes:'meal_plan:box:r1/1'});

// mp_deliveries.menu_items — new full array (7 items, core set)
const newMenuItems = [
  {qty:1, code:'HP09', name:'หมูสันในหวานไร้มัน + ไข่ฝอย', note:''},
  {qty:1, code:'HP10', name:'ยำไข่มะตูม', note:''},
  {qty:1, code:'HP15', name:'กุ้งผัดซอสกระเทียมพริกไทยดำ ควินัว สลัดผัก', note:''},
  {qty:1, code:'HP17', name:'หมูผัดพริกหวานควินัว เห็ดย่าง', note:''},
  {qty:1, code:'HP23', name:'ปลาซาบะย่างซีอิ๊ว สลัดแตงกวาญี่ปุ่น', note:''},
  {qty:1, code:'HP25', name:'สเต็กปลากระพงเพสโต้ ผักย่าง บร้อคโครี่', note:''},
  {qty:1, code:'HP29', name:'ซุปกิมจิหมูไข่ทานกับเส้นบุก', note:''},
];
const r2 = await fetch(`${URL}/rest/v1/mp_deliveries?id=eq.d2e50a36-5827-4997-a061-28472e1600fb`, {
  method:'PATCH', headers:{...H, Prefer:'return=representation'},
  body: JSON.stringify({
    menu_items: newMenuItems,
    admin_notes: '🤖 ฟ้าเปลี่ยนเป็นชุดเมนูของวันที่ส่งจริง [17 ส.ค.] — เดิมเป็นชุดของ 12 ส.ค. ที่ติดมาตอนเลื่อนวัน · นัทสั่งเอง'
  })
});
console.log('mp_deliveries', r2.status, JSON.stringify(await r2.json()));

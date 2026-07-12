---
name: under360-supabase
description: โครงสร้างฐานข้อมูล + query pattern + วิธีส่ง SQL ให้นัทรันของ Under360. ใช้ทุกครั้งที่จะเขียน query, สร้าง/แก้ตาราง, เจอ error 42501 (RLS), ต่อหน้าใหม่เข้า Supabase, หรือเมื่อพูดถึง orders/menu_items/customers/promo_codes/mp_deliveries. Claude แก้ Supabase เองไม่ได้ — ต้องออก SQL ให้นัทวางเสมอ ห้ามบอกว่าทำให้แล้ว.
---

# Under360 — Supabase

```
URL: https://zdartbvhbvqlwzwyyiia.supabase.co   (anon key อยู่ใน CLAUDE.md)
```

## กฎเหล็ก
1. **Claude เข้า Supabase ตรงไม่ได้** → ทุกการเปลี่ยน schema = **ออก SQL block พร้อมวาง** ใน Supabase SQL Editor แล้วบอกนัทว่า "รันอันนี้ก่อน"
2. โค้ดทุกจุดที่พึ่งตารางใหม่ ต้อง **catch error** ให้หน้าไม่พังถ้ายังไม่ได้รัน SQL
3. ตารางใหม่ทุกตัวต้องมี **RLS policy** (ไม่งั้น anon เขียนไม่ได้ → error `42501`)
4. query > 1000 rows ต้องใส่ `.limit(N)`

## ตารางที่มีแล้ว
`orders` · `order_items` · `menu_items` · `customers` · `home_layout` · `kitchen_data` ·
`daily_menu_assignments` · `bot_sessions` · `promo_codes` · `packages` · `package_items` ·
`mp_deliveries` · `activity_log` · `mp_offer_sets`

Storage: `menu-images` (public) · `card-images` (public)

## Pattern มาตรฐาน
```javascript
// ดึงเมนู
const { data: items } = await sb.from('menu_items').select('*');

// order + items
const { data: order } = await sb.from('orders')
  .select('*, order_items(*)').eq('id', orderId).single();

// activity log (ทุก action ของ admin/kitchen ต้อง log)
await sb.from('activity_log').insert({
  source: 'db|he|kq', action_type: 'stock|category|package|he_layout',
  user_name: state.currentUser, details: {...},
  timestamp: new Date().toISOString()
});
```

## เทมเพลตสร้างตารางใหม่ (ต้องมี RLS ทุกครั้ง)
```sql
create table if not exists <table_name> (
  id uuid primary key default gen_random_uuid(),
  ...
  created_at timestamptz default now()
);
alter table <table_name> enable row level security;
create policy "<table_name>_all_anon" on <table_name>
  for all using (true) with check (true);
```

## เวลาสร้าง SQL ให้นัท — ส่งแบบนี้เสมอ
1. บอกว่า **ทำอะไร** (1 บรรทัด)
2. SQL block เดียว copy-paste ได้ทันที
3. บอกว่า **ถ้าไม่รัน จะเกิดอะไร**
4. รอนัทยืนยันว่ารันแล้ว ค่อยไปต่อ

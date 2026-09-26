-- ═══ OH set/course builder — ขยาย packages ให้รองรับ เซ็ต/คอร์ส/บันเดิล ═══
-- วางใน Supabase SQL Editor แล้วรันได้เลย (idempotent — รันซ้ำไม่พัง)
-- ของเดิม (Package S/M/L) ไม่กระทบ: default = พฤติกรรมเดิมเป๊ะ

alter table packages add column if not exists set_kind text not null default 'pick';
alter table packages add column if not exists delivery_rounds int not null default 1;
alter table packages add column if not exists flexible_delivery boolean not null default false;
-- groups = โครงกลุ่มการเลือก (JSON): [{label, kind:'category'|'list', category, skus:[], count}]
alter table packages add column if not exists groups jsonb not null default '[]'::jsonb;
-- qty = จำนวนต่อ SKU (สำหรับบันเดิลตายตัวในอนาคต) — ปัจจุบัน builder ใช้ groups เป็นหลัก
alter table package_items add column if not exists qty int not null default 1;

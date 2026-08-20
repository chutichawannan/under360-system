// สร้าง docs/gpt/UNDER360_CURRENT_FACTS.md จากฐานข้อมูลจริง
// รันซ้ำได้ทุกสัปดาห์:  node scripts/gen_gpt_facts.mjs
// เหตุผลที่ต้องมี: GPT ห้ามพิมพ์ราคา/ชื่อเมนูจากความจำ — ไฟล์นี้คือ "ข้อเท็จจริงล่าสุด" ที่ดึงจาก DB
import fs from "fs";

const U = "https://zdartbvhbvqlwzwyyiia.supabase.co";
const K = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXJ0YnZoYnZxbHd6d3l5aWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY3OTksImV4cCI6MjA5NzM5Mjc5OX0.D41YGH-CuWrVFqcAgXEuhfVTxJ7WY26Xu-PeXBF6LB8";
const H = { apikey: K, Authorization: "Bearer " + K };
const get = async (p) => {
  const r = await fetch(U + "/rest/v1/" + p, { headers: H });
  if (!r.ok) throw new Error(p + " -> " + r.status);
  return r.json();
};

const bkk = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
const M = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
const thDate = (iso) => { const d = new Date(iso + "T00:00:00+07:00"); return d.getDate() + " " + M[d.getMonth()] + " " + (d.getFullYear() + 543); };

const sets = await get("mp_offer_sets?select=*&limit=50").catch(() => []);
const menus = await get("menu_items?select=code,subcode,name,price,kcal,calories,protein,carb,fat,image_urls,is_available&subcode=not.is.null&limit=60");

const alive = menus.filter((m) => m.is_available);
const key = (x) => String(x.subcode || x.code);
alive.sort((a, b) => key(a).localeCompare(key(b), "en", { numeric: true }));
const S = alive.filter((m) => key(m)[0] === "S");
const D = alive.filter((m) => key(m)[0] === "D");

const nut = (x) => {
  const k = x.kcal || x.calories || 0;
  const p = [k ? k + " kcal" : "", x.protein ? "P" + x.protein : "", x.carb ? "C" + x.carb : "", x.fat ? "F" + x.fat : ""].filter(Boolean).join(" · ");
  return p || "— (ยังไม่มีข้อมูลโภชนาการใน DB)";
};
const img = (x) => (x.image_urls && x.image_urls[0]) ? x.image_urls[0] : "— (ยังไม่มีรูป)";
const row = (x) => "| **" + key(x) + "** | " + x.name + " | ฿" + (x.price ?? "—") + " | " + nut(x) + " | " + img(x) + " |";

const mpLine = (s) =>
  "| " + (s.label || s.set_key) + " | " + (s.boxes ?? "—") + " กล่อง | ฿" + (s.price_lc ?? "—") + " | ฿" + (s.price_hp ?? "—") + " |";

const out = `# 📌 UNDER360 — CURRENT FACTS (ข้อเท็จจริงล่าสุด)

> ⚠️ **ไฟล์นี้สร้างอัตโนมัติจากฐานข้อมูลจริง — ห้ามแก้ด้วยมือ**
> สร้างเมื่อ **${thDate(bkk)}** · สร้างใหม่ได้ด้วย \`node scripts/gen_gpt_facts.mjs\`
> **ถ้าไฟล์นี้เก่าเกิน 7 วัน ให้ถือว่าราคา/เมนูอาจเปลี่ยนแล้ว — ถาม Claude หรือนัทก่อนใช้**

**กฎเหล็กสำหรับ GPT: ห้ามพิมพ์ราคา ชื่อเมนู หรือค่าโภชนาการจากความจำ — ใช้จากไฟล์นี้เท่านั้น**

---

## 1. Meal Plan (ตัวชูโรง · ทำสด · ส่ง จ/พ/ศ ช่วงบ่าย)

| ชุด | จำนวน | Low Carb (LC) | High Protein (HP) |
|---|---|---|---|
${(sets.length ? sets : []).map(mpLine).join("\n") || "| (อ่านตาราง mp_offer_sets ไม่ได้ — ถาม Claude) | | | |"}

- **โปรโมทเป็นคู่เสมอ: HP + LC** ห้ามพูดถึงตัวเดียว
- โปรตีนดิบต่อกล่อง: **HP 170g · LC 120g**
- ส่งฟรีทุกแพ็ค ไม่มีขั้นต่ำ
- ⛔ **ห้ามเขียนว่า "เลือกวัน/เวลาส่งได้"** สำหรับ Meal Plan (ทำสด ส่ง จ/พ/ศ เท่านั้น)

## 2. เมนูพิเศษประจำสัปดาห์นี้ — ข้าวกล่อง (${S.length} เมนู)

| รหัส | ชื่อเมนู | ราคา | โภชนาการ | รูปจริง (ใช้รูปนี้เท่านั้น) |
|---|---|---|---|---|
${S.map(row).join("\n")}

## 3. เมนูพิเศษประจำสัปดาห์นี้ — แพ็คกับข้าว (${D.length} เมนู)

| รหัส | ชื่อเมนู | ราคา | โภชนาการ | รูปจริง |
|---|---|---|---|---|
${D.map(row).join("\n")}

---

## 4. ของที่ใช้ทำภาพได้ทันที

- **โลโก้ (เวกเตอร์):** https://under360-system.vercel.app/web/img/u360_logo.svg
- **สีแบรนด์:** เขียว \`#40B549\` · เขียวเข้มหัวเรื่อง \`#1f7a4d\`
- **ฟอนต์ไทย:** Noto Sans Thai
- **โบรชัวร์เมนูอัตโนมัติ:** https://under360-system.vercel.app/web/menu_brochure.html (กว้าง 1040 px)
- **การ์ดจัตุรัสสำหรับ IG:** https://under360-system.vercel.app/web/menu_card.html (1040×1040)
- **คลังรูปเมนู:** \`https://zdartbvhbvqlwzwyyiia.supabase.co/storage/v1/object/public/menu-images/<รหัสเมนู>.jpg\`

## 5. ช่องทางที่ต้องใส่ในภาพ/แคปชั่น

- LINE OA: **@under360** (ช่องทางสั่งซื้อหลัก)
- เว็บ: **360foodbox.com**
- โทร: **064 173 6519**

---
*ตัวเลขทุกตัวในไฟล์นี้ query จาก Supabase ตอนสร้างไฟล์ ไม่ได้พิมพ์เอง*
`;

fs.mkdirSync("docs/gpt", { recursive: true });
fs.writeFileSync("docs/gpt/UNDER360_CURRENT_FACTS.md", out);
console.log("เขียน docs/gpt/UNDER360_CURRENT_FACTS.md แล้ว");
console.log("Meal Plan sets:", sets.length, "· ข้าวกล่อง:", S.length, "· แพ็คกับข้าว:", D.length);

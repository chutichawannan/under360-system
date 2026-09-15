# 🔌 วิธีดึงยอดซื้อวัตถุดิบจาก Freshket + GO Wholesale (ทำซ้ำได้)

> ดึงโดยห้อง **f** 16 ก.ย. 2026 · นัท login ค้างไว้ให้ใน Chrome เครื่อง "Claude pc"
> **ของเดิมใน `docs/FRESHKET_BILLS_3M.md` ดึงด้วยการอ่าน DOM + คลิกเมาส์จริง = ช้าและพลาดง่าย**
> รอบนี้เจอ **API ตรง** ทั้ง 2 เจ้า → ดึงครบทั้งเดือนได้ในคำสั่งเดียว ไม่ต้องคลิกเปลี่ยนหน้า

## 🥬 Freshket — API ตรง (ดีที่สุด)

เปิด `freshket.co/Admin/Restaurant/Mybilling` (ต้อง login) แล้วยิงจาก console:

```js
const get = async (mm, yyyy, page) => (await fetch('/Admin/Restaurant/GetInbox_PO_INV', {
  method: 'POST',
  headers: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},
  body: `filter=${mm}%2F${yyyy}&currentPage=${page}`
})).json();
```

- คืน **JSON สะอาด** ไม่ต้อง parse HTML: `po_receiving_date_local_date_string` · `grand_total` · `item_count` · `po_running_number` · `status` · **`guid`**
- **10 รายการ/หน้า** → วนจนได้น้อยกว่า 10 = หมด
- 🔴 **ต้องกรอง `status === 'CANCELLED'` ออก** — ก.ค. 2026 มีใบยกเลิก ฿1,648 ปนอยู่
- 💡 `guid` = กุญแจไปหน้ารายสินค้า (ยังไม่ได้ดึง — คือก้าวถัดไปที่จะได้ **ราคาต่อหน่วยจริง**)

## 🛒 GO Wholesale — ต้องผ่าน DOM แต่แบ่งหน้าด้วยลิงก์ได้

`gowholesale.store/th/my-account/orders`

1. **ต้องคลิกแท็บ "คำสั่งซื้อของฉัน" ก่อน** — เปิดหน้ามาเฉยๆ รายการไม่ render (ตรงนี้คือจุดที่เคยดึงไม่ได้)
2. แบ่งหน้าเป็น `<a class="... h-9 w-9 ...">` เลขหน้า → **`.click()` ได้ปกติ** (ไม่ต้องเมาส์จริงเหมือน Freshket) · 10 ใบ/หน้า
3. แกะจาก `document.body.innerText`:
   ```js
   /(XB\d+)\s*\((\d+) รายการ\)\s*วันที่สั่งซื้อสินค้า: (\d+) (\S+) (\d{4})[^฿]*฿([\d,]+\.?\d*)/g
   ```
4. ⚠️ **ปีเป็น พ.ศ.** (2569) · เดือนเป็นตัวย่อไทย (`ก.ค.`) → ต้องแปลงเอง
5. ⚠️ วนหลายหน้าใน `javascript_tool` ครั้งเดียว **จะ timeout ที่ 45 วิ** → สั่งแบบ async เก็บลง `window.__go` แล้วค่อยกลับมาอ่านผล

## 🔴 บทเรียน: "ยอดบัตรเครดิต" ใช้แทนยอดซื้อไม่ได้

| | ก.ค. 2026 | ส.ค. 2026 |
|---|---:|---:|
| Freshket — บิลจริง | 15,592 | 32,299 |
| Freshket — ที่เห็นในบัตร | **0** | 27,635 |
| GO — บิลจริง | 51,782 | 61,115 |
| GO — ที่เห็นในบัตร | 36,985 | 57,365 |

บัตรตัดเป็นก้อน ข้ามเดือน และไม่ครบ (บางใบจ่ายทางอื่น) → **ยึดบิลจากเจ้าของสินค้าเสมอ**

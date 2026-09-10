# 📸 เครื่องมือ 03 — Prompt แปลงรูปอาหารให้เป็นสไตล์ตากล้องร้าน

> **โจทย์จากนัท (20 ส.ค. 2026):** *"ฉันมีภาพอาหารของฉันอยู่ ที่ไม่ได้จ้างตากล้องถ่าย (ฉันถ่ายเอง) แล้วมันไม่สวย คือจะนำภาพอาหารที่ฉันมี จัดแสงและเปลี่ยนมาอยู่ในรูปแบบตากล้องถ่าย"*
>
> **เตียงทำอะไรได้ / ไม่ได้ — พูดตรงๆ ก่อน**
> ❌ ผมสร้างภาพถ่ายขึ้นมาใหม่ไม่ได้ · ❌ ผมรีทัชรูปไม่ได้
> ✅ **ผมเขียน prompt ให้ AI สร้างภาพตัวอื่นไปทำแทนได้** (คือเอกสารนี้)
> ⚠️ **ผมทดสอบผลลัพธ์ของ AI ตัวนั้นเองไม่ได้** — นัทหรือคนที่รันต้องเป็นคนดูผลแล้วบอกกลับมา ผมจะปรับ prompt ให้

---

## 🎯 กฎเหล็กข้อเดียวที่ห้ามข้าม — อาหารต้องเป็นของจริง

**เป้าหมายคือ "จัดแสงใหม่" ไม่ใช่ "สร้างอาหารใหม่"**
ห้ามให้ AI เปลี่ยนหน้าตาอาหาร เพิ่มกุ้ง เปลี่ยนสี เติมท็อปปิ้ง หรือทำให้ดูเยอะกว่าของจริง
เพราะลูกค้าสั่งมาแล้วต้องได้ของที่หน้าตาใกล้เคียงรูป — ไม่งั้นคือหลอกลูกค้า และขัดกับกฎแบรนด์ที่ใช้ **"รูปอาหารจริงจากกล่องจริง"** มาตลอด

→ ทุก prompt ในเอกสารนี้จึงเป็นแบบ **img2img (แก้จากรูปเดิม)** ไม่ใช่ text2img (วาดใหม่ทั้งใบ)

---

## 🔬 สเปกสไตล์ร้าน — ถอดจากรูปตากล้อง 5 ใบที่นัทจ้างถ่าย

วิเคราะห์: อกไก่ซอส+บะหมี่เพสโต้ · สลัดอกไก่ย่าง · สปาเกตตี้โบโลเนส · ลาบไก่ · กุ้งอบวุ้นเส้น

| องค์ประกอบ | สิ่งที่เหมือนกันทั้ง 5 ใบ = ลายเซ็นร้าน |
|---|---|
| **พื้นหลัง** | ขาว/เทาอ่อนสะอาด ไม่มีลาย ไม่มีของรก · โทน high-key สว่าง |
| **แสง** | **แสงธรรมชาตินุ่ม กระจายกว้าง มาจากบน-ซ้าย** · เงาอ่อนมีทิศทาง ไม่ดำทึบ ไม่มีเงาแข็ง · ไม่มีแฟลชตรงหน้า |
| **มุมกล้อง** | **เฉียง 40–60°** (สามส่วนสี่) — **ไม่มีใบไหนถ่ายจากด้านบนตรงๆ และไม่มีใบไหนถ่ายระดับสายตา** |
| **เลนส์/ระยะชัด** | เหมือนเลนส์เทเลสั้น 50–85mm · **หน้าชัดหลังละลาย** (ราว f/2.8–4) ของหลังเบลอนุ่ม |
| **จัดวาง** | อาหารพระเอกอยู่หน้า-ล่าง-กลาง · มีของประกอบ 1 ชิ้นอยู่หลัง (ชาม/แก้วน้ำ) · props อยู่ขอบเฟรม · เหลือพื้นที่ว่างเยอะ |
| **ของประกอบประจำ** | เขียงไม้/แผ่นไม้ธรรมชาติ · ภาชนะเซรามิกขาว · ตะเกียบไม้/ช้อนส้อมทองแดง · ผ้าลายตาราง/ริ้ว · ต้นไม้เล็กเบลอมุมบน · เครื่องเทศโรยบนโต๊ะ |
| **สี** | สว่าง สะอาด อมอุ่นนิดๆ · สีอาหารสดแต่ไม่จัดจ้านเกินจริง · ขาวต้องขาวจริง ไม่อมเหลือง/ฟ้า |
| **สัดส่วนภาพ** | แนวตั้ง 2:3 เป็นหลัก |

---

## ✍️ Prompt หลัก (img2img) — ก๊อปไปวางได้เลย

> ใส่รูปของนัทเป็น input image · ตั้ง **denoise / image strength ต่ำ ๆ 0.25–0.40** (ยิ่งต่ำยิ่งรักษาหน้าตาอาหารเดิม)

```
Relight and restyle this existing food photograph into a professional
restaurant menu photograph. Keep the dish EXACTLY as it is.

DO NOT CHANGE: the food itself, its ingredients, portion size, colour,
garnish, plating, or the shape/type of the plate or bowl. Do not add or
remove any food item. This is a relighting and restyling task only.

LIGHTING: soft diffused natural window light coming from the upper left,
large soft source, gentle directional shadows falling to the lower right,
no harsh shadows, no direct flash, bright high-key exposure, clean white
balance with a slightly warm tone.

CAMERA: three-quarter angle about 45 degrees above the table, short
telephoto look (equivalent 50-85mm), shallow depth of field around f/3,
the dish tack sharp, background softly blurred.

SET: clean pure white or very light neutral table surface, uncluttered.
Optional simple props far in the background, softly out of focus: a
natural wood serving board, plain white ceramic, wooden chopsticks or
copper cutlery, a folded blue-check or green-striped cloth, a small
green plant. Props must never overlap or cover the dish.

STYLE: professional food photography for a healthy meal-delivery brand,
appetising but honest, clean and airy, generous negative space,
natural food colours, crisp texture detail on the food surface.

FORMAT: vertical 2:3.

NEGATIVE: no text, no watermark, no logo, no hands, no people, no extra
food, no cartoon or illustration look, no HDR halo, no oversaturation,
no plastic or glossy CGI texture, no dark moody background, no messy
table, no duplicated utensils, no distorted plate rim.
```

---

## 🎛️ ตัวปรับ 3 แบบ (เลือกตามชนิดอาหาร — สังเกตจากรูปตากล้องจริง)

**1. อาหารไทย/จานรสจัด** (แบบรูปลาบไก่)
เพิ่มท้าย SET:
```
Thai rustic styling: enamel bowl with a blue rim, a banana leaf under the
bowl, a woven bamboo basket softly blurred in the background.
```

**2. อาหารฝรั่ง/พาสต้า-สลัด** (แบบสปาเกตตี้ · สลัด)
เพิ่มท้าย SET:
```
Modern cafe styling: wide-rim matte white plate, light wooden board,
a small glass of juice or a dressing jug blurred in the background.
```

**3. ซุป/หม้ออบ/เมนูมีน้ำ** (แบบกุ้งอบวุ้นเส้น)
เพิ่มท้าย SET:
```
White ceramic pot with side handles on a matching saucer, a few whole
peppercorns and a small bundle of dried herbs scattered on the table.
```

---

## 🧪 วิธีใช้ + วิธีตรวจว่าใช้ได้จริง

1. เอารูปที่นัทถ่ายเอง เข้า AI แบบ **img2img** (ไม่ใช่ text2img)
2. **strength 0.25–0.40** → ถ้าอาหารเริ่มเพี้ยน **ลดลง** · ถ้าแสงไม่เปลี่ยนเลย **เพิ่มทีละ 0.05**
3. สร้าง 4 ใบต่อครั้ง แล้วเลือก

**เกณฑ์ตรวจก่อนเอาไปใช้ — ตกข้อไหนคือทิ้ง:**
- [ ] **อาหารยังเป็นจานเดิม** — นับชิ้นเนื้อ/กุ้ง/ไข่ เทียบกับรูปต้นฉบับ ต้องเท่ากัน
- [ ] ไม่มีของงอกเพิ่ม (ผักโรย ซอส ท็อปปิ้งที่ของจริงไม่มี)
- [ ] ขอบจาน/ชามไม่บิดเบี้ยว · ตะเกียบไม่งอกเป็น 3 อัน
- [ ] ไม่มีตัวหนังสือ/ลายน้ำแปลกปลอมโผล่มา
- [ ] สีอาหารยังเป็นสีจริง ไม่ถูกดันจนแสบตา

> ⚠️ **ถ้า AI เปลี่ยนหน้าตาอาหาร = ใช้ไม่ได้ ต่อให้สวยแค่ไหน** — กลับไปลด strength

---

## 🔁 ถัดไป (รอนัทลองก่อนค่อยทำ)
- นัทลองรัน 1-2 รูป แล้วส่งผลกลับมา → ผมปรับถ้อยคำ prompt ให้ตรงขึ้น
- ถ้าใช้ได้ดี → ทำ prompt แยกตามหมวดสินค้า (ข้าวกล่อง / แพ็คกับข้าว / Meal Plan / อาหารเด็ก)
- รูปที่ผ่านเกณฑ์ → อัปเข้า `menu-images` แทนรูปเดิม แล้วโบรชัวร์กับโพสต์โซเชียลจะสวยขึ้นทั้งระบบทันที (ทุกเครื่องมือดึงจากที่เดียวกัน)

---

# 🍽️ ภาคผนวก A — เลือกภาชนะตามชนิดอาหาร (นัทสอน 20 ส.ค.)

> **นัทชี้เอง:** *"มันควรจะแต่งเป็นจานที่แบนกว่านี้หละมั้ง"* (เคสลาบไก่ที่ AI ใส่ชามลึก)
> **บทเรียน:** ภาชนะผิดประเภท = อาหารดูจม/ดูน้อย/ดูไม่น่ากิน ต่อให้แสงสวยแค่ไหน · **ต้องระบุภาชนะใน prompt ทุกครั้ง อย่าปล่อยให้ AI เลือกเอง**

| ชนิดอาหาร | ภาชนะที่ถูก | เขียนใน prompt ว่า |
|---|---|---|
| **ของแห้ง/ยำ/ลาบ/ผัด** (ลาบไก่ · ยำ · ไก่ผัดกระเทียม) | **จานแบน หรือชามตื้นปากกว้าง** — ให้เห็นหน้าอาหารกระจายเต็ม | `a shallow wide flat white ceramic plate, low rim, food spread out to show its texture` |
| **ข้าว + กับข้าว** | จานแบนกลม ขอบเรียบ | `a flat round matte white plate with a plain rim` |
| **แกง/ต้ม/มีน้ำ** (ต้มยำ · แกงส้ม) | **ชามลึกปากกว้าง** — ต้องเห็นเนื้อโผล่พ้นน้ำ | `a wide deep white ceramic bowl, the solid ingredients visibly rising above the broth` |
| **เส้น/พาสต้า** | ชามตื้นปากกว้าง | `a wide shallow pasta bowl in matte white` |
| **ของทานเล่น/ขนม** | จานเล็กแบน | `a small flat white plate` |

⚠️ **ถ้าอาหารดูน้อยในภาชนะ ห้ามแก้ด้วยการเพิ่มอาหาร** — ให้**ลดขนาดภาชนะ**แทน (`use a smaller bowl so the same portion fills it naturally`) เพราะเพิ่มอาหาร = โกหกลูกค้า

---

# 📱 ภาคผนวก B — โหมด C: กู้รูปถ่ายมือถือจากครัว (โหมดยากสุด)

**ใช้เมื่อ:** รูปที่พนักงานครัวถ่ายด้วยมือถือ — แสงไฟบ้านอมเหลือง / แฟลชแข็ง / โต๊ะรก / มุมเอียง / ภาชนะไม่เข้าแบรนด์

**ปัญหาที่ต้องแก้พร้อมกันหลายชั้น (ต่างจากโหมด A/B ที่แก้อย่างเดียว):**
1. แสงไฟหลอดอมเหลือง หรือแฟลชแข็งเงาดำคม → ต้องเปลี่ยนเป็นแสงหน้าต่างนุ่ม
2. พื้นโต๊ะไม้เก่า/พลาสติกลอน/มีคราบน้ำ → ต้องเปลี่ยนเป็นพื้นสะอาด
3. ภาชนะจานขอบทอง/ถ้วยตราร้าน → เปลี่ยนตามตารางภาคผนวก A
4. มุมเกือบ top-down เอียงๆ → ปรับเป็นเฉียง 45–55°

## Prompt โหมด C (ก๊อปทั้งบล็อก)

```
Relight and restage this amateur phone photo of a real dish into a
professional restaurant menu photograph.

KEEP EXACTLY — this is the whole point: every piece of food, its amount,
its colour, its cut, and its garnish must stay identical to the source.
Do not add, remove, enlarge or beautify any ingredient. The portion must
look the same size or slightly smaller, never more generous.

FIX THE LIGHTING: remove the yellow indoor tungsten cast and any hard
flash shadow. Replace with soft diffused natural window light from the
upper left, large soft source, gentle shadow falling lower right, bright
high-key exposure, neutral-to-slightly-warm white balance, clean whites.

FIX THE SURFACE: remove the old wooden table / textured plastic mat /
water stains / clutter. Replace with a clean, plain, light neutral table
surface, uncluttered and bright.

FIX THE VESSEL: <<< ใส่บรรทัดภาชนะจากตารางภาคผนวก A ตรงนี้ >>>
Plain, unbranded, no gold rim, no printed pattern, no text.

FIX THE ANGLE: three-quarter view about 50 degrees above the table, not
top-down, not tilted. The vessel must be perfectly symmetrical and level,
its rim a clean even ellipse.

CAMERA: 50-85mm equivalent, shallow depth of field around f/3, food tack
sharp, background softly blurred.

SET: optional blurred props far behind only — light wood board, small
green plant, folded plain cloth. Never overlapping the dish.

FRAMING: the dish occupies about 62% of frame width, even space on all
sides, never crop the rim.

FORMAT: vertical 2:3.

NEGATIVE: no text, no logo, no watermark, no hands, no extra food, no
added garnish that is not in the source, no cartoon, no HDR halo, no
oversaturation, no plastic CGI look, no dark moody background, no messy
table, no gold-rimmed plate, no warped rim.
```

**strength ที่แนะนำ:** 0.5–0.65 (สูงกว่าโหมด A/B เพราะต้องแก้หลายชั้น) → **ยิ่งสูงยิ่งต้องตรวจอาหารหนัก**

## 🚧 ข้อจำกัดที่ต้องซื่อสัตย์ — เคสที่โหมด C อาจเอาไม่อยู่
**อาหารน้ำขุ่นในถ้วยลึก** (แกงส้ม ต้มยำ ที่ถ่ายจากบนลงมา เห็นแต่ผิวน้ำ)
= AI แทบไม่มีข้อมูลรูปทรงเนื้อให้ยึด → มันจะ "เดา" เนื้อขึ้นมาใหม่ = **สร้างอาหารปลอม ผิดกฎข้อ 1**
**ทางแก้ที่ได้ผลกว่า AI: ถ่ายใหม่ 1 รูป** โดยตักให้เนื้อโผล่พ้นน้ำ + ถ่ายเฉียง 45° ริมหน้าต่าง — เร็วกว่าและซื่อสัตย์กว่า
> **เกณฑ์ตัดสิน: ถ้าในรูปต้นฉบับมองไม่ออกว่าเนื้อคืออะไร AI ก็มองไม่ออกเหมือนกัน — อย่าใช้ AI กับรูปแบบนั้น**

---

# ✅ ผลทดสอบจริงกับนัท 20 ส.ค. 2026 — ผ่าน 5/5 ทุกระดับความยาก

| # | โจทย์ | ยากตรงไหน | ผล |
|---|---|---|---|
| 1 | ไก่ผัดกะเพรา+ข้าวไรซ์เบอร์รี่ (นัทถ่ายเอง ฉากไม้) | พื้นไม้ แสงแข็ง มุมสูงเกิน | ✅ |
| 2 | ไก่สับผงกะหรี่ (ถ้วยลายการ์ตูน มีตัวหนังสือ) | ต้องเปลี่ยนภาชนะ | ✅ |
| 3 | ลาบไก่ | AI ใส่ชามลึก ควรเป็นจานแบน | ✅ หลังเพิ่มกฎภาชนะ |
| 4 | ไก่ผัดกระเทียม (มือถือครัว โต๊ะไม้เก่า จานขอบทอง) | แสงไฟบ้าน + คราบน้ำ + จานไม่เข้าแบรนด์ | ✅ |
| 5 | แกงปลาน้ำขุ่น (มือถือครัว แฟลชแข็ง) | เนื้อจมน้ำ AI ไม่มีข้อมูล | ✅ **เพราะไม่หมุนมุม** |
| 6 | **กล่องเบนโตะ 3 ช่อง** (มือถือครัว) | AI ชอบรวมช่อง/ย้ายอาหารลงจาน | ✅ **ยากสุด ผ่าน** |

## 🔑 บทเรียนใหญ่ที่สุดจากรอบทดสอบนี้

**1. อย่าหมุนมุมกล้อง ถ้าต้นฉบับถ่ายจากบน**
AI ต้องจินตนาการด้านข้างที่ไม่มีในรูป → มันจะแต่งอาหารขึ้นใหม่
**คงมุมเดิม แล้วแก้แค่แสง/พื้น/ภาชนะ** = ปลอดภัยกว่ามาก และผลยังสวย

**2. props ต้องเปลี่ยนตามมุมกล้อง**
มุมเฉียง → ต้นไม้กระถาง แก้วน้ำ ตั้งได้
มุมบน → ต้องเป็นของ**วางแบน**เท่านั้น (ผ้าพับ ใบไม้ พริก ช้อนไม้ แผ่นไม้) ไม่งั้นเห็นแต่ฝากระถาง

**3. กล่องอาหารจริง = อย่าเปลี่ยนเป็นจาน**
กฎแบรนด์เขียนไว้เองว่า *"รูปอาหารจริงจากกล่องจริง"* + *"ให้เห็นปริมาณ"*
เปลี่ยนเป็นจานสวย = ลูกค้าเห็นจานแต่ได้กล่อง = สร้างความคาดหวังผิด
**ทำให้กล่องจริงดูดี ไม่ใช่ซ่อนกล่อง** · ต้องสั่งชัดว่า `keep all compartments and dividers, never merge`

**4. strength ตามความยาก** — ยิ่งต้องแก้โครงสร้างมาก ยิ่งต้องใช้ต่ำ (สวนสัญชาตญาณ)

| งาน | strength |
|---|---|
| แค่จัดแสง ภาชนะเดิม | 0.25–0.40 |
| แกงน้ำ/มุมบน (ไม่หมุนมุม) | 0.45 |
| **กล่องหลายช่อง** | **0.40 หรือต่ำกว่า** — โครงสร้างช่องพังง่ายสุด |
| เปลี่ยนภาชนะ + หมุนมุม | 0.50–0.65 (ตรวจหนัก) |

**5. ให้ prompt เต็มใบ อย่าให้นัทประกอบเอง**
รอบนี้ผมส่ง patch ทีละชิ้น 4 รอบจนนัทถาม *"เอาประโยคไหนไปเติมประโยคไหน"* — **ผิดที่ผม**
→ ต่อจากนี้: ดูรูป → ส่ง prompt เต็ม 1 ก้อน ก๊อปวางจบ · สิ่งที่ต่างกันแต่ละรูปมีแค่ 2 บรรทัด (`KEEP EXACTLY` = ชื่อวัตถุดิบ · `FIX THE VESSEL` = ชนิดภาชนะ)

---

# 🧭 วิธีเลือกโหมด (ดูรูปแล้วเลือก ไม่ต้องคิดเยอะ)

| รูปต้นฉบับเป็นแบบไหน | ใช้โหมด | แก้อะไร |
|---|---|---|
| ภาชนะสวยอยู่แล้ว แค่แสงไม่ดี | **A** | แสง + พื้น + ล็อกภาชนะเดิม |
| ภาชนะไม่เข้าแบรนด์ (ลาย/ตัวหนังสือ/ขอบทอง) | **B** | แสง + พื้น + **เปลี่ยนภาชนะ** ตามตารางภาคผนวก A |
| รูปมือถือครัว (ไฟบ้าน/แฟลช/โต๊ะรก) | **C** | แก้ 4 ชั้นพร้อมกัน · strength สูงขึ้น |
| **ถ่ายจากบนตรงๆ** (โดยเฉพาะอาหารน้ำ) | **C แบบล็อกมุม** | เพิ่ม `KEEP THE CAMERA ANGLE` · **ห้ามหมุนมุม** |
| **กล่องอาหารหลายช่อง** | **D** | ล็อกกล่อง+ผนังกั้น · ห้ามย้ายลงจาน · strength ต่ำ |

---

# 📱 SOP ถ่ายรูปให้ครัว (เสนอไว้ รอนัทเคาะ)
ถ้าครัวถ่าย **3 มุมต่อเมนู** AI แทบไม่ต้องเดาเลย: ① มุมบนตรง ② เฉียง 45° ③ ใกล้เห็นพื้นผิว
**เงื่อนไขเดียว: ปิดแฟลช ถ่ายริมหน้าต่างกลางวัน**
⚠️ ครัวอ่านไทยได้ 2/6 คน → ใบนี้ต้องทำ **ไทย+พม่า + มีรูปตัวอย่างกำกับ** ถึงจะใช้ได้จริง

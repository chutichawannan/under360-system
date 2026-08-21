# 📚 สารบัญเอกสารทั้งหมด — ไล่เช็คครบทุกไฟล์

> ไล่เปิดอ่านหัวไฟล์ **ทุกตัว 126 ไฟล์** เมื่อ 15 ส.ค. 2026 (นัทสั่ง: *"120 ไฟล์ไล่เช็คให้หมดได้ไหม"*)
> **ไม่ได้สุ่ม ไม่ได้เดาจากชื่อไฟล์** — เปิดอ่านของจริงทีละตัว
> 🔑 คอลัมน์ **ตัดสิน** = ข้อเสนอของ pm · **ยังไม่ได้ทำอะไรเพิ่มนอกจากที่ย้ายไปแล้ว**

---

## 🚨 5 เรื่องที่เจอ และสำคัญกว่าการจัดระเบียบ

### ① มีไฟล์ 2 ตัวอ้างว่าตัวเองเป็น "ความจริงเดียว" พร้อมกัน 🔴
| ไฟล์ | เขียนว่า | อายุ |
|---|---|---|
| `CLAUDE.md` | *"อ่านไฟล์นี้ก่อนทำงานทุกครั้ง — Single source of truth"* | สด |
| `docs/UNDER360_MASTERNOTE_v6_7.md` (93 KB) | *"**Single source of truth** — อ่านไฟล์นี้ก่อนทำงานทุกครั้ง"* | **11 ก.ค. = เก่า 5 สัปดาห์** |

→ ห้องไหนเผลอเปิด MASTERNOTE จะได้ข้อมูลยุค **v0.4.22** (ก่อน cutover · ก่อน beta · ก่อนทุกอย่าง)
**เสนอ:** เติมหัวไฟล์ MASTERNOTE ว่า *"เอกสารประวัติศาสตร์ · ความจริงปัจจุบันอยู่ที่ CLAUDE.md"* แล้วย้ายเข้า archive

### ② `docs/KITCHEN.md` ค้างคำสั่งที่ไม่มีใครทำ
หัวไฟล์เขียนเอง: *"ส่งให้ cc ผนวกเข้า CLAUDE.md section ครัว (นัทสั่ง 5 ส.ค.) — ⏳ **ยังไม่ merge**"*
→ **นัทสั่งไว้ 10 วันแล้ว ยังไม่มีใครทำ** · ความรู้ครัว 22 KB ยังไม่เข้า master

### ③ ความรู้ถาวรติดอยู่ในไฟล์ที่มีวันที่ (เรื่องที่นัทสะกิดเมื่อกี้)
| ความรู้ | ติดอยู่ใน | ควรไปอยู่ที่ |
|---|---|---|
| 🔴 **`order_items` มีบั๊กแทรกซ้ำ/ขาดหายกับ Meal Plan → `mp_deliveries.menu_items` คือของจริงที่ KQ ใช้** | `archive/kitchen_daily/FAH_20260810_today` | **`CLAUDE.md`** (กระทบทุกห้องที่ query) |
| สาเหตุที่คอร์สบางใบไม่เข้าระบบ (พิสูจน์แล้ว) | `archive/kitchen_daily/FAH_20260811_final` | `docs/KITCHEN.md` |
| วิธีเทียบชีทแอดมิน vs Supabase ว่าใครถูก | `archive/kitchen_daily/FAH_20260811_compare` | `docs/BRIEF_FAH_KITCHEN.md` |
| **Hato เก็บเมนูจริงไว้ใน "ชุดตัวเลือก" — sync มาไม่ครบ (บั๊กเก่า)** | `docs/ASK_ADMIN_MODIFIER` | เช็คก่อนว่าแก้ไปหรือยัง |

### ④ เรื่องเดียวถูกเขียนซ้ำ 2-3 ชั้น (ไม่ผิด แต่ทำให้ไม่รู้ว่าอ่านอันไหน)
- **LINE OA:** `line_oa_analysis` (first-pass) → `line_oa_deep_dive` (ของจริง) → `line_oa_playbook` (สรุป) — **อ่าน playbook พอ**
- **Wave 2:** `broadcast_wave2` → `broadcast_wave2_FINAL` — **ใช้ FINAL**
- **อินฟลู Hyrox:** `influencer_hyrox_shortlist` → `influencer_hyrox_final` — **ใช้ final**

### ⑤ `docs/SECRETARY.md` เป็นแค่ป้ายบอกทาง 1.3 KB
เนื้อในเขียนว่า *"ไฟล์จริงย้ายไป `~/.claude/SECRETARY.md` แล้ว"* → **เก็บไว้ได้ ไม่เสียหาย** แต่อย่าหลงคิดว่ามีเนื้อหา

---

## 📋 ไล่ทีละไฟล์ — 126 ไฟล์

### 🟢 ชั้น 1 · อ่านก่อนทำงานเสมอ (5)
| ไฟล์ | ทำอะไร | ตัดสิน |
|---|---|---|
| `CLAUDE.md` (250 KB) | กฎถาวร · 7 เสาหลัก · credentials · ประวัติทุกเวอร์ชัน | **เก็บ** แต่ควรลดขนาด (footer ประวัติกินครึ่งไฟล์) |
| `TODO.md` (170 KB) | งานค้างกลางทุกห้อง | **เก็บ** · ควรตัดของที่ปิดแล้วออกเป็นระยะ |
| `docs/OPEN_LOOPS.md` | ทะเบียนเรื่องค้าง แยกตามคนที่ต้องทำ | **เก็บ** — *"ที่ที่ของไม่หาย"* |
| `docs/BRANCH_RULES.md` | กฎ git ห้ามแก้ main ตรง | **เก็บ** |
| `PRD.md` | สเปคงานที่ทำอยู่แผ่นเดียว | **เก็บ** |

### 🧭 ชั้น 2 · ทิศทางและภาพใหญ่ (7)
| ไฟล์ | ทำอะไร | ตัดสิน |
|---|---|---|
| `docs/PM_BOARD.md` | 4 เฟส · JD ห้อง pm · ที่ pm พลาด | เก็บ |
| `docs/ROADMAP_PRINT.md` | 6 ชุดงาน แบ่งตาม 5 ชั้นกิจการ | เก็บ |
| `docs/VISION_FULL_LOOP.md` | ภาพปลายทางที่นัทเล่าเอง | เก็บ — **เปิดตอนหลงทาง** |
| `docs/PORTFOLIO_MAP.md` | พอร์ตสินค้าทั้งหมด + Kidneycare | เก็บ |
| `docs/ROOMS_MAP.md` | ห้องไหนทำอะไร + กติกาสลับห้อง | เก็บ |
| `docs/WORKING_WITH_NUT.md` | วิธีทำงานกับนัท | เก็บ — ปรับเรื่อยๆ |
| `docs/DOC_INDEX.md` | ไฟล์นี้ | เก็บ |

### 🏢 ชั้น 3 · ความรู้ประจำแผนก (17)
| ไฟล์ | ทำอะไร | ตัดสิน |
|---|---|---|
| `docs/KITCHEN.md` | ความรู้ครัว — ทีม 6 คน · ภาษา · กำลังผลิต | เก็บ 🔴 **ค้าง merge เข้า CLAUDE.md** |
| `docs/BRIEF_FAH_KITCHEN.md` (36 KB) | คู่มือฟ้า — ฟ้าอ่านทุกครั้งก่อนทำงาน | เก็บ |
| `docs/BRIEF_KENG_DELIVERY.md` | คู่มือพี่เก่ง | เก็บ · ⚠️ ตัวเลขข้างในเป็น snapshot 5 ส.ค. |
| `docs/BRIEF_K_TRACK.md` | บรีฟห้องครัว | เก็บ |
| `docs/BRIEF_KAPAN_ROOM.md` · `docs/KAPAN.md` | บรีฟ + สเปกกะปัน | เก็บทั้งคู่ (คนละหน้าที่) |
| `docs/KENG_LOG.md` | บันทึกพี่เก่ง เฉพาะของที่วัดมาแล้ว | เก็บ |
| `docs/KITCHEN_ANNOUNCE_BOT.md` | ประกาศแจ้งครัวก่อนเชิญบอท (ไทย+พม่า) | เก็บ — **ยังไม่ได้ใช้ รอเชิญบอท** |
| `docs/VENDOR_REFERENCE.md` | คลังเจ้า/ผู้ให้บริการที่นัทเก็บ | เก็บ |
| `docs/mp_request_log.md` | เมนูรีเควส MP รายสัปดาห์ | เก็บ |
| `docs/SECRETARY.md` | ป้ายบอกทาง 1.3 KB | เก็บ (ไม่มีเนื้อหา) |
| `AGENTS_SPEC.md` (28 KB) | JD agent ทั้งหมด | เก็บ · ควรย้ายเข้า `docs/` |
| `finance/HANDOFF.md` (46 KB) | บริบทการเงินทั้งหมด | เก็บ |
| `finance/ASK_NID.md` · `GET_STATEMENTS.md` | ชีทถามคนออกบิล · checklist statement | เก็บ — **ยังรอของอยู่** |
| `finance/PAYABLES.md` | รายการต้องจ่าย + เตือนก่อนถึงกำหนด | เก็บ |
| `scripts/menu/README.md` | วิธีดึงแท็กสัปดาห์จากชีทนัท | เก็บ |
| `scripts/niw/CARD_SPEC.md` | สเปคการ์ดเมนูเสี่ยงเหลือ | เก็บ |
| `.claude/agents/*.md` (3) · `.claude/skills/*/SKILL.md` (11) | subagent จริง + skill | เก็บ — ของทำงานจริง |

### 📕 ชั้น 4 · บทเรียนจากเหตุการณ์จริง (5)
| ไฟล์ | ทำอะไร | ตัดสิน |
|---|---|---|
| `docs/CASE_01_wrong_box_count.md` | ส่งของเกิน 2 กล่อง — 7 ปัจจัยเชิงระบบ | เก็บถาวร |
| `docs/CASE_02_supplier_short_delivery.md` | ซัพส่งของขาด | เก็บ ⚠️ **ยังเป็นหัวข้อ รอนัทเล่าต่อ** |
| `docs/CASE_03_frozen_pack_melted_nim.md` | ฟรีซแพ็คละลาย ลูกค้าร้องเรียนเอง | เก็บถาวร |
| `docs/FINDINGS_NUT_BETA_TEST.md` (26 KB) | รอบเทสใหญ่ N-01→N-33 | เก็บ |
| `docs/AUDIT_PRE_CUTOVER.md` (22 KB) | audit 24 จุดก่อน cutover | เก็บ |

### 🔬 ชั้น 5 · R&D และไอเดียที่ยังไม่ลงมือ (5)
| ไฟล์ | ตัดสิน |
|---|---|
| `docs/rnd/RND_01_hyrox_brief.md` · `RND_hyrox_pool.md` · `HYROX_MENU_DEDUP.md` | เก็บ — Hyrox 14 ส.ค. เพิ่งผ่าน **ควรสรุปผลแล้วปิด** |
| `docs/IDEA_STOCK_ORDER_BOARD.md` | เก็บ 🔴 **ไอเดียนัทที่ยังไม่มอบให้ห้องไหน** |
| `docs/ASK_ADMIN_MODIFIER.md` | เก็บ ⚠️ **มีบั๊กเก่าซ่อนอยู่ ต้องเช็คว่าแก้แล้วยัง** |

### 📢 ชั้น 6 · งานมาเก็ตติ้งของเอิธ (28)
**คลังวิจัยใช้อ้างอิงยาว (เก็บ):** `line_oa_playbook` · `line_oa_deep_dive` · `fb_ads_ploy_history` · `fb_ads_audit` · `competitor_ad_benchmark` · `competitor_passionfood_course_pivot` · `delivery_fee_benchmark` · `influencer_hyrox_final` · `follow_check_result` · `kpi_roas_framework` · `utm_taxonomy` · `verify_A_socialblade` · `marketplace_dig_notes` · `ad_plan_v1`
**ของยิงไปแล้ว/ใช้ครั้งเดียว (เข้า archive ได้):** `broadcast_wave2` · `broadcast_wave2_FINAL` · `broadcast_05_mealplan` · `broadcast_birthday` · `admin_script_salmon` · `admin_create_codes_wave2` · `ad_ready_to_publish` · `ad_sheet_fb_stock_round1` · `ad_images_brief_fb_round1` · `hato_admin_usage_questions` · `influencer_hyrox_shortlist` · `line_oa_analysis` · `line_chat_mining`
**เปล่า รอข้อมูล:** `weekly_ad_digest_template` — *"สถานะ: เปล่า รอ UTM auto-track"*

### 📅 ชั้น 7 · ย้ายเข้า archive ไปแล้ว (18)
`archive/kitchen_daily/` 5 · `archive/handoff/` 8 · `archive/migration/` 4 · `archive/social/` 1
→ รายละเอียด + วิธีถอยกลับ: `docs/archive/README.md`

### 🕸 ชั้น 8 · เอกสารผี — ไม่ควรมีใครเปิด (16)
| ไฟล์ | ปัญหา |
|---|---|
| `.claude/worktrees/infallible-chatelet-*/` (11 ไฟล์ รวม CLAUDE.md 108 KB) | **สำเนาเก่า 2 สัปดาห์ · ชี้ path เครื่องเก่า `C:/Users/360 User1/`** |
| `.claude/worktrees/priceless-chatelet-*/CLAUDE.md` (65 KB) | สำเนาเก่าอีกฉบับ |
| `docs/UNDER360_MASTERNOTE_v6_7.md` (93 KB) | **อ้างตัวเป็น single source of truth ทั้งที่เก่า 5 สัปดาห์** |
| `download/JD_nong_niw_DRAFT.md` · `ptrack_hato_category_STATUS.md` | checkpoint กลางงานที่จบไปแล้ว |
| `web/_redirects_plan.md` | *"แผน/prep เท่านั้น"* — **DNS ย้ายเสร็จแล้ว 12 ส.ค.** |
| `web/posts/_MANIFEST.md` | migration blog เสร็จแล้ว (61/61 published) |

### 📄 อื่นๆ (3)
`download/hato_final/lineitem_summary.md` — สรุปยอดขายรายสินค้าจาก Hato (22,179 บรรทัด ฿6.04M) **มีค่าเชิงข้อมูล เก็บ**
`web/tiang/backlog.md` · `image_index.md` — เตียงใช้จริงทุกสัปดาห์ **เก็บ**

---

## 💡 ขั้นถัดไปที่ pm เสนอ (เรียงตามผลกระทบ)

| # | ทำอะไร | ทำไม | แรง |
|---|---|---|---|
| 1 | **ยกความรู้ 4 ชิ้นออกจากไฟล์ที่มีวันที่** ไปไว้ที่ถาวร | ของมีค่าติดอยู่ในไฟล์ที่ไม่มีใครเปิด | เล็ก |
| 2 | **ปิดปาก MASTERNOTE_v6_7** เติมหัวว่าเป็นเอกสารประวัติศาสตร์ | กันห้องอื่นอ่านข้อมูลเก่า 5 สัปดาห์ | จิ๋ว |
| 3 | **merge `KITCHEN.md` เข้า CLAUDE.md** ตามที่นัทสั่งไว้ 5 ส.ค. | ค้างมา 10 วัน | กลาง |
| 4 | ย้าย eath ที่ยิงไปแล้ว 13 ไฟล์ เข้า archive | `web/eath/` เหลือแต่คลังวิจัยที่ใช้จริง | เล็ก |
| 5 | ลบ worktree ผี 2 ตัว (`.claude/worktrees/`) | เอกสารเก่าที่หลอกคนอ่านได้ | เล็ก แต่ต้องเช็คก่อน |
| 6 | ตัด footer ประวัติใน `CLAUDE.md` → `UNDER360_HISTORY.md` | ทุกห้องเปิดเร็วขึ้น | กลาง · ต้องระวังชน |

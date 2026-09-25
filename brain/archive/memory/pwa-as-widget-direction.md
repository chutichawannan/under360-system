---
name: pwa-as-widget-direction
description: "นัทถือว่า PWA = \"widget\" ของเขาแล้ว — เครื่องมือมือถือต่อจากนี้ให้ทำเป็น PWA หน้าเดียวแบบ orders_upcoming ไม่ต้องไล่ทำ native widget/APK/Play Store"
metadata: 
  node_type: memory
  type: project
  originSessionId: 23c601c2-d5a2-46c2-881d-9a013cffc365
  modified: 2026-07-31T03:40:28.267Z
---

นัทเคาะ 28 ก.ค. 2026: **"PWA ฉันเข้าใจว่ามันเป็น widget ละกัน ถือซะว่าเป้าหมายระยะยาว ฉันอยากได้แบบนี้"**
= เลิกไล่ล่า native home-screen widget (KWGT+Tasker / APK / Play Store) — **PWA คือคำตอบระยะยาวสำหรับเครื่องมือมือถือทุกตัวของ Under360**

**Why:** นัททำงานผ่านมือถือเป็นหลักและอยู่คนละโซนเวลากับร้าน · native widget ต้องเขียนแอปจริง (iOS WidgetKit / Android AppWidget) เว็บทำไม่ได้ · ส่วน Play Store = $25 + บัญชีส่วนบุคคลต้องเทส 12 คน 14 วัน = ไม่คุ้มกับเครื่องมือใช้ในร้าน · Chrome บน Android กด "ติดตั้งแอป" สร้าง WebAPK ให้เองอยู่แล้ว = ได้ผลเท่าที่นัทต้องการโดยไม่ต้องแจกไฟล์

**How to apply:** เครื่องมือมือถือชิ้นใหม่ → ทำเป็น **PWA หน้าเดียวใน `pwa/`** ตามแม่แบบ `pwa/orders_upcoming.html` (u0.4.40): อ่านอย่างเดียวถ้าเป็นของดู · ยึด `Asia/Bangkok` เสมอ · sequential reads · SW scope แค่ `/pwa/` (ห้าม root กันไปคุม LIFF ลูกค้า) · cache เฉพาะเปลือกหน้า ห้าม cache ข้อมูล · การ์ดพับ-แตะกาง · ล็อกด้วย PIN ก่อน แล้วค่อยอัปเป็น Google login + allowlist อีเมลใน OH เมื่อข้อมูลสำคัญขึ้น
ถ้ามีคน (หรือ agent) เสนอทำ widget/APK/native อีก → ตอบว่านัทเคาะแล้วว่าใช้ PWA เว้นแต่นัทสั่งใหม่เอง
เกี่ยวข้อง: [[orders-plan-dataflow-vision]] · [[eath-desktop-widget]] · [[response-style-concise]]

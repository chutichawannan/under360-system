@echo off
rem ===== ตัวรันอัตโนมัติของห้องฟ้า — ใบงานครัว Meal Plan =====
rem ตั้งผ่าน Windows Task Scheduler (ไม่พึ่งตัวตั้งเวลาฝั่ง Claude)
rem ทำ: จ่ายเมนู -> บังคับจำนวนเมนู/วัน -> sync ครัว -> ทำใบ -> ตรวจ -> push
rem ตรวจไม่ผ่าน = ไม่ push (ใบเก่ายังอยู่)
cd /d "C:\Users\PP\Desktop\under360-system"
"C:\Program Files\nodejs\node.exe" scripts\fah_auto.mjs >> "C:\Users\PP\Desktop\under360-system\kitchen\_auto_log.txt" 2>&1

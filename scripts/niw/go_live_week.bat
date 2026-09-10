@echo off
REM เปิดเมนูสัปดาห์ใหม่ + สลับชื่อเล่น — เรียกจาก Windows Task Scheduler แบบตั้งครั้งเดียว
REM ใช้: go_live_week.bat 2026-09-07
cd /d "C:\Users\PP\Desktop\under360-system"
"C:\Program Files\nodejs\node.exe" scripts\niw\go_live_week.mjs %1 --apply >> "C:\Users\PP\Desktop\under360-system\scripts\niw\go_live.log" 2>&1

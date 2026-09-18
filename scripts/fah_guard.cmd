@echo off
rem ===== Fah room: hourly safety net =====
rem 18 Sep 2026: morning run is at 06:30 but Nut asked at 08:11 and there was no sheet.
rem This runs every hour 06:00-12:00 and builds the sheet ONLY if today has none.
rem ASCII ONLY in this file.
cd /d "C:\Users\PP\Desktop\under360-system"
"C:\Program Files\nodejs\node.exe" scripts\fah_guard.mjs >> "C:\Users\PP\Desktop\under360-system\kitchen\_guard_log.txt" 2>&1

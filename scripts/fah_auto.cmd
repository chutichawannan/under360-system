@echo off
rem ===== Fah room: kitchen sheet automation (Meal Plan) =====
rem 22 Sep 2026: the line that runs fah_auto.mjs had been DROPPED since 16 Sep.
rem   Every scheduled run only restored files and exited 0 = no sheet, no error.
rem   Nut had to chase every time. BOTH node lines below are required.
rem ASCII ONLY in this file (cmd reads .cmd with the system codepage).
cd /d "C:\Users\PP\Desktop\under360-system"
"C:\Program Files\nodejs\node.exe" scripts\restore_fah_files.mjs >> "C:\Users\PP\Desktop\under360-system\kitchen\_auto_log.txt" 2>&1
"C:\Program Files\nodejs\node.exe" scripts\fah_auto.mjs >> "C:\Users\PP\Desktop\under360-system\kitchen\_auto_log.txt" 2>&1

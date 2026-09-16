@echo off
rem ===== Fah room: kitchen sheet automation (Meal Plan) =====
rem 16 Sep 2026: 11 fah scripts vanished from the working folder (another room reset the tree)
rem   -> the scheduled run died silently, kitchen had no sheet until Nut asked. Restore first.
rem ASCII ONLY in this file (cmd reads .cmd with the system codepage).
cd /d "C:\Users\PP\Desktop\under360-system"
"C:\Program Files\nodejs\node.exe" scripts\restore_fah_files.mjs >> "C:\Users\PP\Desktop\under360-system\kitchen\_auto_log.txt" 2>&1
rem Thai text in rem gets split into fragments cmd tries to run. Thai notes live in fah_auto.mjs

@echo off
rem ===== Fah room: kitchen sheet automation (Meal Plan) =====
rem Run by Windows Task Scheduler (does not depend on Claude scheduler)
rem Steps: assign menus -> sync -> build sheet -> check -> push
rem Check fails = no push (old sheet stays safe)
rem ASCII ONLY in this file: cmd reads .cmd with the system codepage.
rem Thai text in rem gets split into fragments cmd tries to run. Thai notes live in fah_auto.mjs
cd /d "C:\Users\PP\Desktop\under360-system"
"C:\Program Files\nodejs\node.exe" scripts\fah_auto.mjs >> "C:\Users\PP\Desktop\under360-system\kitchen\_auto_log.txt" 2>&1

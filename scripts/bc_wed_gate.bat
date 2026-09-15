@echo off
rem Room 05 Wednesday menu gate - Windows Task Scheduler, every Wednesday 13:00
rem ASCII ONLY (cmd reads .bat in OEM codepage; Thai comments get split into commands)
cd /d "C:\Users\PP\Desktop\under360-system"
echo ===== %DATE% %TIME% ===== >> "%TEMP%\bc_wed_gate.log"
"C:\Program Files\nodejs\node.exe" scripts\bc_wed_gate.mjs %* >> "%TEMP%\bc_wed_gate.log" 2>&1
exit /b %ERRORLEVEL%

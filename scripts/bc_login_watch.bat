@echo off
rem Room 05 LINE OA login watch - Windows Task Scheduler, every day 08:00
rem ASCII ONLY (see bc_wed_gate.bat)
cd /d "C:\Users\PP\Desktop\under360-system"
echo ===== %DATE% %TIME% ===== >> "%TEMP%\bc_login_watch.log"
"C:\Program Files\nodejs\node.exe" scripts\bc_login_watch.mjs %* >> "%TEMP%\bc_login_watch.log" 2>&1
exit /b %ERRORLEVEL%

@echo off
rem Room 05 weekly broadcast kick - run by Windows Task Scheduler every Friday 13:00
rem ASCII ONLY in this file: cmd reads .bat in the OEM codepage, Thai text gets split
rem into fragments that cmd tries to run as commands (found 11 Sep 2026).
rem Explanation in Thai lives in scripts\bc_weekly_kick.mjs header.
rem Usage:  bc_weekly_kick.bat --dry     (test, no post)
rem Check:  node scripts\bc_weekly_kick.mjs --check
cd /d "C:\Users\PP\Desktop\under360-system"
echo ===== %DATE% %TIME% ===== >> "%TEMP%\bc_weekly_kick.log"
"C:\Program Files\nodejs\node.exe" scripts\bc_weekly_kick.mjs %* >> "%TEMP%\bc_weekly_kick.log" 2>&1
exit /b %ERRORLEVEL%

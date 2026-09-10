@echo off
cd /d C:\Users\PP\Desktop\under360-system
node scripts\niw\refill_weekly_set.mjs >> "%TEMP%\niw_refill.log" 2>&1

@echo off
cd /d C:\Users\PP\Desktop\under360-system
node scripts\niw\morning_stock_alert.mjs >> "%TEMP%\niw_morning.log" 2>&1

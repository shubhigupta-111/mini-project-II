@echo off
title Student Study Planner & Progress Tracker
echo ========================================================
echo  Starting Student Study Planner Server...
echo ========================================================
cd /d "%~dp0backend"
echo.
echo Website URL: http://localhost:5000
echo Demo Email:  alex.student@college.edu
echo Password:    password123
echo.
start http://localhost:5000
node server.js
pause

@echo off
title SkillGapAI Backend (Flask :5000)
cd /d "%~dp0"
echo Starting SkillGap AI Flask server...
echo Frontend: http://localhost:5000
echo API:      http://localhost:5000/api/
echo.
"C:\Users\bakke\AppData\Local\Programs\Python\Python311\python.exe" app.py
pause

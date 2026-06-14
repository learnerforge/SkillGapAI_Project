@echo off
title SkillGapAI Frontend Dev (Vite :8501)
cd /d "%~dp0frontend"
echo Starting Vite dev server...
echo Open: http://localhost:8501
echo.
echo IMPORTANT: Start start_backend.bat in another window first.
echo The Vite proxy forwards /api to Flask on port 5000.
echo.
npm run dev
pause

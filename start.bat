@echo off
title Web-Based Gaming Library
color 0b
echo.
echo  ==========================================
echo    WEB-BASED GAMING LIBRARY  v2.0
echo  ==========================================
echo.
echo  Baslatiyor... (Ctrl+C ile kapat)
echo.

:: Root package.json üzerinden başlat
call npm run dev

echo.
echo  Sistem kapatildi.
pause > nul

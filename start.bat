@echo off
title Web-Based Gaming Library
color 0b
echo.
echo  ==========================================
echo    WEB-BASED GAMING LIBRARY  v2.0
echo  ==========================================
echo.

:: Install dependencies if node_modules missing
if not exist "backend\node_modules" (
    echo  Bagimliliklari yukluyor (backend)...
    call npm install --prefix backend
)
if not exist "frontend\node_modules" (
    echo  Bagimliliklari yukluyor (frontend)...
    call npm install --prefix frontend
)

echo.
echo  Baslatiyor... (bu pencereyi kapatmak icin Ctrl+C)
echo.

call npm run dev

echo.
echo  Sistem kapatildi.
pause > nul

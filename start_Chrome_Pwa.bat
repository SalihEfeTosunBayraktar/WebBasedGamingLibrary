@echo off
title WebGamingLibrary Server
cd /d "%~dp0"

echo ========================================================
echo Web-Based Gaming Library Baslatiliyor...
echo Bu siyah pencere sunucudur, kapattiginizda uygulama durur.
echo ========================================================
echo.

:: Arka planda 2 saniye bekleyip Chrome'u uygulama modunda acacak komut
start /B cmd /c "timeout /t 2 /nobreak >nul & start chrome --app=http://localhost:3001"

:: Sunucuyu baslat (Pencereyi acik tutar, kapaninca node durur)
node backend/index.js

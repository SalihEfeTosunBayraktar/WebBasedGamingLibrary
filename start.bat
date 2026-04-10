@echo off
title WBGL
color 0b
echo =========================================
echo    WebBasedGamingLibrary Baslatiliyor
echo =========================================
echo.
echo Sunucular baslatiliyor...

:: Launch both Node and Vite together
echo =========================================
echo    Web Sunucusu Suan Calisiyor verilen Adrese Giderek Oyunlarini Yonetebilirsin.
echo =========================================
call npx -y concurrently --kill-others --names "BACKEND,FRONTEND" -c "blue,magenta" "cd backend && node index.js" "cd frontend && npm run dev"

echo Sistem basariyla kapatildi.



pause > nul

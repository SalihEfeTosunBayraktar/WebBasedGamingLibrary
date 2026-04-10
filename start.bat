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
echo    Web Sunucusu Şuan Çalışıyor verilen Adrese Giderek Oyunlarını Yönetebilirsin.
echo =========================================
call npx -y concurrently --kill-others --names "BACKEND,FRONTEND" -c "blue,magenta" "cd backend && node index.js" "cd frontend && npm run dev"

echo Sistem basariyla kapatildi.



pause > nul

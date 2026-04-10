@echo off
title NexPlay Launcher
color 0b
echo =========================================
echo    NexPlay Gaming Library Baslatiliyor
echo =========================================
echo.
echo Sunucular tek bir pencerede baslatiliyor...

:: Wait a few seconds to let servers start, then open the browser
start /b cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:5173"

:: Launch both Node and Vite together
call npx -y concurrently --kill-others --names "BACKEND,FRONTEND" -c "blue,magenta" "cd backend && node index.js" "cd frontend && npm run dev"

echo Sistem basariyla kapatildi.
pause > nul

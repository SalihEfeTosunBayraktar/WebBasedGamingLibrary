@echo off
title Web-Based Gaming Library
color 0b
echo.
echo  ==========================================
echo    WEB-BASED GAMING LIBRARY  v2.0.0.2
echo  ==========================================

echo Welcome This Apppy Thing Created By Legendnoobe
echo.

:: Install dependencies if node_modules missing
if not exist "node_modules" (
    echo.
    echo [WARNING] Root dependencies ^(concurrently^) are missing!
    set /p "reqRoot=Download now? (Y/N): "
    if /i "%reqRoot%"=="Y" (
        echo Installing root dependencies...
        call npm install
    )
)

if not exist "backend\node_modules" (
    echo.
    echo [WARNING] Backend dependencies ^(node_modules^) are missing!
    set /p "reqBack=Download now? (Y/N): "
    if /i "%reqBack%"=="Y" (
        echo Installing backend dependencies...
        call npm install --prefix backend
    )
)

if not exist "frontend\node_modules" (
    echo.
    echo [WARNING] Frontend dependencies ^(node_modules^) are missing!
    set /p "reqFront=Download now? (Y/N): "
    if /i "%reqFront%"=="Y" (
        echo Installing frontend dependencies...
        call npm install --prefix frontend
    )
)

echo.
echo  Starting... (For Close This Window Press Ctrl+C)
echo.

call npm run dev

echo.
echo  Created By Legendnoobe GoodBye!!!
echo  System Closed.
pause > nul

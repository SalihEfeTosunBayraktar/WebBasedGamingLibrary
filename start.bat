@echo off
setlocal EnableDelayedExpansion
title Web-Based Gaming Library
color 0b

echo Welcome To Web Based Gaming Library
echo.
if exist ".lang_pref" (
    set /p LANG_SEL=<.lang_pref
) else (
    echo Select Language / Dil Secimi:
    echo [1] English
    echo [2] Turkce
    set /p "LANG_SEL=Select / Sec (1/2): "
    if "!LANG_SEL!"=="" set LANG_SEL=1
    echo !LANG_SEL!>.lang_pref
)

echo  ==========================================
echo    WEB-BASED GAMING LIBRARY  v2.0.0.19
echo  ==========================================

if "%LANG_SEL%"=="2" (
    echo Bu Program Legendnoobe Tarafindan Yapilmistir
    echo.
    echo  Ipucu : Oyunu Baslatmak Icin Space/Gamepad A Tusuna Basili Tutun...
) else (
    echo -Welcome This Apppy Thing Created By Legendnoobe
    echo.
    echo -Hint : Long Press Space/Gamepad A For Launch Games...
)

:: Install dependencies if node_modules missing
if not exist "node_modules" (
    echo.
    if "%LANG_SEL%"=="2" (
        echo [UYARI] Root gereksinimleri ^(concurrently^) eksik!
        set /p "reqRoot=Hemen indirilsin mi? (E/H): "
        if /i "!reqRoot!"=="E" (
            echo Root bagimliliklari yukluyor...
            call npm install
        )
    ) else (
        echo [WARNING] Root dependencies ^(concurrently^) are missing!
        set /p "reqRoot=Download now? (Y/N): "
        if /i "!reqRoot!"=="Y" (
            echo Installing root dependencies...
            call npm install
        )
    )
)

if not exist "backend\node_modules" (
    echo.
    if "%LANG_SEL%"=="2" (
        echo [UYARI] Backend gereksinimleri ^(node_modules^) eksik!
        set /p "reqBack=Hemen indirilsin mi? (E/H): "
        if /i "!reqBack!"=="E" (
            echo Backend bagimliliklari yukluyor...
            call npm install --prefix backend
        )
    ) else (
        echo [WARNING] Backend dependencies ^(node_modules^) are missing!
        set /p "reqBack=Download now? (Y/N): "
        if /i "!reqBack!"=="Y" (
            echo Installing backend dependencies...
            call npm install --prefix backend
        )
    )
)

if not exist "frontend\node_modules" (
    echo.
    if "%LANG_SEL%"=="2" (
        echo [UYARI] Frontend gereksinimleri ^(node_modules^) eksik!
        set /p "reqFront=Hemen indirilsin mi? (E/H): "
        if /i "!reqFront!"=="E" (
            echo Frontend bagimliliklari yukluyor...
            call npm install --prefix frontend
        )
    ) else (
        echo [WARNING] Frontend dependencies ^(node_modules^) are missing!
        set /p "reqFront=Download now? (Y/N): "
        if /i "!reqFront!"=="Y" (
            echo Installing frontend dependencies...
            call npm install --prefix frontend
        )
    )
)

echo.
if "%LANG_SEL%"=="2" (
    echo  Baslatiliyor... ^(Bu pencereyi kapatmak icin Ctrl+C^)
) else (
    echo  Starting... ^(For Close This Window Press Ctrl+C^)
)
echo.

call npm run dev

echo.
if "%LANG_SEL%"=="2" (
    echo  Sistem Kapatildi. Gorusmek Uzere^^!^^!^^!
) else (
    echo  Created By Legendnoobe GoodBye^^!^^!^^!
    echo  System Closed.
)
pause > nul

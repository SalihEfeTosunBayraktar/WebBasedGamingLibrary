@echo off
setlocal EnableDelayedExpansion
title Web-Based Gaming Library - Updater
color 0a

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

echo.
echo  ==========================================
echo    WEB-BASED GAMING LIBRARY UPDATER
echo  ==========================================
echo.

:: Git kontrolü
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    if "%LANG_SEL%"=="2" (
        echo [UYARI] Git bulunamadi! Guncelleme yapilabilmesi icin sisteminizde Git yuklu olmalidir.
        set /p "reqGit=Microsoft Winget ile otomatik olarak indirip kurayim mi? (Y/N): "
    ) else (
        echo [WARNING] Git not found! Git must be installed to perform updates.
        set /p "reqGit=Automatically download and install it via Microsoft Winget? (Y/N): "
    )
    
    if /i "!reqGit!"=="Y" (
        echo.
        if "%LANG_SEL%"=="2" echo Git kuruluyor, lutfen Windows uyarisina "Evet" deyin. Islem bikac dakika surebilir...
        if "%LANG_SEL%"=="1" echo Installing Git, please press "Yes" on the Windows prompt. This may take a few minutes...
        
        winget install --id Git.Git -e --source winget
        
        echo.
        if "%LANG_SEL%"=="2" (
            echo [ONEMLI] Kurulum denemesi tamamlandi.
            echo Yeni komutlarin PC'de aktiflesmesi icin bu terminali simdi kapatin ve "update.bat" dosyasini YENIDEN YONETICI OLARAK calistirin.
        ) else (
            echo [IMPORTANT] Installation attempt completed.
            echo Please CLOSE this terminal now and run "update.bat" AGAIN (as Administrator) to apply new PATH variables.
        )
        pause
        exit /b
    ) else (
        echo.
        if "%LANG_SEL%"=="2" echo [HATA] Guncelleme iptal edildi. Git yuklu olmadan devam edilemez.
        if "%LANG_SEL%"=="1" echo [ERROR] Update canceled. Cannot continue without Git.
        pause
        exit /b
    )
)

if "%LANG_SEL%"=="2" (
    echo [1/3] En son guncellemeler indiriliyor ^(Git Pull^)...
) else (
    echo [1/3] Downloading latest updates ^(Git Pull^)...
)
call git pull origin main

if %errorlevel% neq 0 (
    echo.
    if "%LANG_SEL%"=="2" (
        echo [HATA] Guncelleme sirasinda bir hata olustu. 
        echo Yerel olarak degistirdiginiz dosyalar cakismis olabilir.
        echo Cozmek icin su anki degisikliklerinizi stashlemeniz veya silmeniz gerekebilir.
    ) else (
        echo [ERROR] An error occurred during the update.
        echo Locally modified files may have conflicted.
        echo You may need to stash or discard changes to resolve this.
    )
    pause
    exit /b
)

echo.
if "%LANG_SEL%"=="2" (
    echo [2/3] Sahsi oyun veritabaniniz ^(db.json^) ve ayarlariniz guvende tutuluyor!
) else (
    echo [2/3] Your personal game database ^(db.json^) and settings are kept safe!
)
echo.

if "%LANG_SEL%"=="2" (
    echo [3/3] Gerekli yeni paketler ^(varsa^) kuruluyor...
) else (
    echo [3/3] Installing required new packages ^(if any^)...
)
call npm install
call npm run install:all

echo.
if "%LANG_SEL%"=="2" (
    echo [BASARILI] Guncelleme tamamlandi! Uygulamayi eski haliyle sorunsuz baslatabilirsiniz.
) else (
    echo [SUCCESS] Update complete! You can start the application normally.
)
pause

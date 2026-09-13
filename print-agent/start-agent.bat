@echo off
title PrintSaaS Agent v2
color 0A

:: Automatically switch working directory to the script's folder
cd /d "%~dp0"

echo ===================================================
echo              PrintSaaS Agent v2 Launcher           
echo ===================================================
echo.
if not exist node_modules (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
)
echo [INFO] Starting PrintSaaS Agent...
echo.
call npm start
pause

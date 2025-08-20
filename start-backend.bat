@echo off
echo Starting MamaCare Backend Server...
cd /d "c:\Users\Takunda Mundwa\Desktop\MamaCare\backend"

REM Check if MongoDB is running
echo Checking MongoDB status...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo MongoDB is running.
) else (
    echo MongoDB is not running. Please start MongoDB first.
    echo You can start MongoDB by running: net start MongoDB
    echo Or if you have MongoDB installed locally: mongod
    pause
    exit /b 1
)

echo Starting backend server...
npm run dev

pause

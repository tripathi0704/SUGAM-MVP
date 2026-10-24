@echo off
setlocal enabledelayedexpansion

:: 1. Navigate to script directory
cd /d "%~dp0"

title S.U.G.A.M. 2.0 - SIH 2026 AICTE Complaint Portal
color 0B

echo ===============================================================================
echo            S.U.G.A.M. 2.0 -- SIH 2026 Problem Statement 26264
echo   Integrated Dashboard for Monitoring and Tracking Cases Across AICTE Bureaus
echo ===============================================================================
echo.

REM 2. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM 2.5 Ensure port 3000 is clean (kills any previous stuck zombie process)
for /f "tokens=5" %%p in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo [INFO] Freeing port 3000 from stale process PID %%p
    taskkill /f /pid %%p >nul 2>nul
)

REM 3. Install dependencies only if node_modules is missing
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
)

REM 4. Initialize database only if db\custom.db is missing
if not exist "db\custom.db" (
    echo [INFO] Initializing SQLite database...
    call npx prisma db push --accept-data-loss
)

echo.
echo ===============================================================================
echo   DEMO CREDENTIALS FOR SIH PRESENTATION - Password: demo123
echo ===============================================================================
echo   - Citizen / Student      : student@sugam.demo   [Aarav Sharma, Complainant]
echo   - Regulation Bureau [RB] : rb@sugam.demo        [Dr. V. K. Saxena, Director]
echo   - PGRC Officer           : pgrc@sugam.demo      [Suresh Verma, Cell Officer]
echo   - Reviewing Officer      : reviewer@sugam.demo  [Dr. S. Nair, Joint Coord]
echo   - College Nodal Officer  : college@sugam.demo   [Prof. Anil Deshmukh]
echo   - Platform Admin         : admin@sugam.demo     [System Administrator]
echo ===============================================================================
echo.

REM 5. Launch browser automatically as soon as server is ready
start "" /b node scripts/open-browser.mjs

echo [INFO] Starting Next.js development server on http://localhost:3000...
echo [INFO] Your default browser will automatically open http://localhost:3000 once ready.
echo Press Ctrl+C at any time to stop the server.
echo.

call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] The server stopped with error code %errorlevel%.
    pause
)

@echo off
REM AutoHeal Parallel Tests - Quick Run Script for Windows
REM This script helps you quickly run different parallel test scenarios

echo ========================================
echo   AutoHeal Parallel Tests Runner
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo WARNING: .env file not found
    echo Please create a .env file with your GEMINI_API_KEY
    echo.
    set /p continue="Do you want to continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
)

echo Select test scenario:
echo.
echo 1) Run all tests (3 workers in parallel)
echo 2) Run isolated instance tests only
echo 3) Run shared cache tests only
echo 4) Run performance comparison tests
echo 5) Run all tests sequentially (1 worker)
echo 6) Run all tests with 5 workers (stress test)
echo 7) Run with debugging (headed mode)
echo 8) Generate HTML report from last run
echo.

set /p choice="Enter choice (1-8): "

if "%choice%"=="1" (
    echo Running all parallel tests with 3 workers...
    npx playwright test tests/playwright-parallel.spec.ts --workers=3
)

if "%choice%"=="2" (
    echo Running isolated instance tests...
    npx playwright test tests/playwright-parallel.spec.ts -g "Isolated Instances" --workers=3
)

if "%choice%"=="3" (
    echo Running shared cache tests...
    npx playwright test tests/playwright-parallel.spec.ts -g "Shared File Cache" --workers=3
)

if "%choice%"=="4" (
    echo Running performance comparison tests...
    npx playwright test tests/playwright-parallel.spec.ts -g "Performance Tests" --workers=1
)

if "%choice%"=="5" (
    echo Running all tests sequentially (no parallelism)...
    npx playwright test tests/playwright-parallel.spec.ts --workers=1
)

if "%choice%"=="6" (
    echo Running stress test with 5 workers...
    echo WARNING: This may hit API rate limits!
    npx playwright test tests/playwright-parallel.spec.ts --workers=5
)

if "%choice%"=="7" (
    echo Running with debugging (headed mode)...
    npx playwright test tests/playwright-parallel.spec.ts --headed --workers=1
)

if "%choice%"=="8" (
    echo Opening HTML report...
    npx playwright show-report
)

echo.
echo ========================================
echo   Test execution completed!
echo ========================================
echo.
echo Next steps:
echo - View HTML report: npx playwright show-report
echo - Check cache directory: dir autoheal-cache-parallel-test
echo - View AutoHeal reports: dir autoheal-reports
echo.
pause

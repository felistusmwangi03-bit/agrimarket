@echo off
REM AgriMarket - upload this project to GitHub (double-click this file).
REM Needs Git for Windows: https://git-scm.com/download/win
cd /d "%~dp0"
echo.
echo Checking Git...
git --version >nul 2>&1
if errorlevel 1 (
  echo Git is not installed. Install it from https://git-scm.com/download/win and run this file again.
  pause
  exit /b 1
)
set REPO=https://github.com/felistusmwangi03-bit/agrimarket.git
git remote remove origin >nul 2>&1
git remote add origin %REPO%
git branch -M main
echo.
echo Commits that will be uploaded:
git log --oneline
echo.
echo Uploading to %REPO%
echo (A sign-in window may open. Sign in to GitHub and allow access.)
git push -u origin main
echo.
if errorlevel 1 (
  echo PUSH FAILED. Take a screenshot of this window and check the message above.
) else (
  echo DONE. Open %REPO% in your browser and press F5.
)
pause

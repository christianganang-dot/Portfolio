@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    set "PORTFOLIO_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  ) else (
    echo Install Node.js 22 or newer, then run this file again.
    pause
    exit /b 1
  )
) else (
  set "PORTFOLIO_NODE=node"
)
echo Open http://127.0.0.1:3000 in your browser.
echo Keep this window open while using the website.
"%PORTFOLIO_NODE%" server.mjs
pause

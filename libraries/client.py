@echo off
setlocal
cd /d "%~dp0"

rem ====== FIXED HOST SETTINGS ======
set HOST_IP=192.168.100.27
set HOST_PORT=8000
set ENTRY=pages\RPPL_LocalVisualizerCORS.html
rem Local helper for username:
set LOCAL_PORT=9000
rem =================================

set "PYEXE="
for %%P in (py python) do (
  where %%P >nul 2>&1 && (set "PYEXE=%%P")
  if defined PYEXE goto :found
)
echo [ERROR] Python not found. Install Python 3.
pause & exit /b 1

:found
rem Free :9000 (client helper)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%LOCAL_PORT% .*LISTENING"') do (
  echo [INFO] Killing PID %%p using port %LOCAL_PORT%...
  taskkill /F /PID %%p >nul 2>&1
)

echo [INFO] Starting username helper on :%LOCAL_PORT%
start "Username helper" /min "%PYEXE%" -u "server.py"

timeout /t 2 >nul

rem Open the host’s site (ALWAYS the fixed IP)
start "" "http://%HOST_IP%:%HOST_PORT%/%ENTRY%"
exit /b 0

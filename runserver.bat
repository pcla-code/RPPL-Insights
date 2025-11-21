@echo off
cd /d %~dp0

REM Start the Python HTTP server
start python libraries\server.py

REM Give the server a moment to boot
timeout /t 2 >nul

REM Open your new index.html in browser
start msedge http://localhost:8000/index.html
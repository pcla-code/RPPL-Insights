@echo off
set HOST=localhost
set PORT=8000
set PAGE=index.html

rem Default browser:
start msedge http://%HOST%:%PORT%/%PAGE%

@echo off
setlocal

REM ============================================================
REM  AITAES one-click startup
REM
REM  1) init database  -> schema + seed data + single-course migration (CS05102)
REM  2) start backend  -> Spring Boot  (http://127.0.0.1:8080)
REM  3) start frontend -> Vite dev     (http://127.0.0.1:5173)
REM
REM  Prerequisites:
REM   - MySQL running on localhost:3306 (root/1234, see application-mysql.yml)
REM   - Node.js + npm installed
REM ============================================================

set "ROOT=%~dp0"

echo ============================================================
echo   AITAES one-click startup
echo ============================================================
echo.

echo [1/3] Initializing database (schema + seed + migrate to single course CS05102) ...
call "%ROOT%init-db.bat" nopause

echo.
echo [2/3] Starting backend ...
start "AITAES Backend" /D "%ROOT%" cmd /k "mvnw.cmd spring-boot:run"

echo [3/3] Starting frontend ...
start "AITAES Frontend" /D "%ROOT%frontend" cmd /k "npm run dev -- --host 127.0.0.1"

echo.
echo ============================================================
echo   Started. Wait about 30 seconds, then open:
echo     Frontend : http://127.0.0.1:5173
echo     Backend  : http://127.0.0.1:8080
echo ============================================================

:end
echo.
pause
endlocal

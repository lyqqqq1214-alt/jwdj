@echo off
setlocal
set "ROOT=%~dp0"

echo [1/2] Building backend (Maven, skipping tests, may take a few minutes)...
call "%ROOT%mvnw.cmd" clean package -DskipTests
if errorlevel 1 (
    echo.
    echo [ERROR] Backend build failed. Check the messages above.
    goto :end
)

echo.
echo [2/2] Building frontend (npm)...
pushd "%ROOT%frontend"
call npm install
if errorlevel 1 goto :npmfail
call npm run build
if errorlevel 1 goto :npmfail
popd

echo.
echo ============================================================
echo   BUILD OK!
echo   Backend jar : %ROOT%target\AITAES-0.0.1-SNAPSHOT.jar
echo   Frontend    : %ROOT%frontend\dist
echo.
echo   Next: copy these 2 things to the server (see docs\deploy-simple.md)
echo ============================================================
goto :end

:npmfail
popd
echo.
echo [ERROR] Frontend build failed. Check the messages above.

:end
echo.
pause
endlocal

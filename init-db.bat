@echo off
chcp 936 >nul
setlocal

REM ============================================================
REM  AITAES 数据库一键初始化脚本
REM  依次执行：建库 -> init.sql -> simulated_data.sql -> question_bank_seed.sql -> enrich_data.sql -> rich_data.sql
REM  双击本文件即可运行；也可在 Git Bash 中执行 ./init-db.bat
REM ============================================================

REM ---------- 可配置项（与 application-mysql.yml 保持一致） ----------
set "DB_HOST=localhost"
set "DB_PORT=3306"
set "DB_USER=root"
set "DB_PASS=1234"
set "DB_NAME=aitaes_db"

REM 脚本所在目录（结尾自带反斜杠），据此定位 SQL 文件，双击/任意目录运行均可
set "ROOT=%~dp0"

set "MYSQL=mysql --host=%DB_HOST% --port=%DB_PORT% -u%DB_USER% -p%DB_PASS% --default-character-set=utf8mb4"

echo ============================================================
echo   AITAES 数据库一键初始化
echo   目标: %DB_NAME% @ %DB_HOST%:%DB_PORT%
echo ============================================================
echo.

REM 检查 mysql 命令是否可用
where mysql >nul 2>nul
if errorlevel 1 (
    echo [错误] 未找到 mysql 命令，请确认 MySQL 已安装并加入 PATH。
    goto :end
)

echo [1/6] 创建数据库 %DB_NAME%（如不存在）...
%MYSQL% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 goto :fail

echo [2/6] 执行 init.sql —— 建表 + 预置账号...
%MYSQL% %DB_NAME% < "%ROOT%src\main\resources\db\init.sql"
if errorlevel 1 goto :fail

echo [3/6] 执行 simulated_data.sql —— 模拟业务数据...
%MYSQL% %DB_NAME% < "%ROOT%test-data\simulated_data.sql"
if errorlevel 1 goto :fail

echo [4/6] 执行 question_bank_seed.sql —— 题库种子数据...
%MYSQL% %DB_NAME% < "%ROOT%test-data\question_bank_seed.sql"
if errorlevel 1 goto :fail

echo [5/6] 执行 enrich_data.sql —— 数据补充（各表补足10条以上）...
%MYSQL% %DB_NAME% < "%ROOT%test-data\enrich_data.sql"
if errorlevel 1 goto :fail

echo [6/6] 执行 rich_data.sql —— 富数据（3课程×2班×20学生，作业/测验/考勤/实验等）...
%MYSQL% %DB_NAME% < "%ROOT%test-data\rich_data.sql"
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo   初始化完成！可执行  ./mvnw spring-boot:run  启动后端
echo ============================================================
goto :end

:fail
echo.
echo [错误] 上一步执行失败，请检查报错信息。常见原因：
echo    - 账号/密码与 application-mysql.yml 不一致
echo    - MySQL 服务未启动或端口 %DB_PORT% 未监听
echo    - SQL 文件路径错误

:end
echo.
pause
endlocal

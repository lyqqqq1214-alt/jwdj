# ============================================================
#  AITAES one-click server deploy (simple version, no CI/CD)
#
#  Before running, do these 4 things (see docs\deploy-simple.md):
#    1) Install JRE/JDK 21, MySQL 8, Nginx, Ollama, WinSW
#    2) Put the built jar at  d:\lyq\backend\AITAES-0.0.1-SNAPSHOT.jar
#    3) Put the frontend dist at d:\lyq\frontend\dist\
#    4) Copy the whole "deploy" folder to d:\lyq\deploy\
#
#  Usage (admin PowerShell):
#    powershell -ExecutionPolicy Bypass -File d:\lyq\deploy\setup-server.ps1 -DbPassword 'your-db-password'
#
#  Re-run after fixing something?  Add -SkipDb so the DB is left alone
#  (setup-db.ps1 drops and recreates every table, which wipes existing data):
#    powershell -ExecutionPolicy Bypass -File d:\lyq\deploy\setup-server.ps1 -SkipDb
#
#  This script: inits DB -> configures Nginx -> registers AITAES + nginx
#  Windows services (auto-start on boot).
#  Afterwards run once:  ollama pull qwen2.5:7b
# ============================================================
param(
    [string]$AppDir       = 'd:\lyq',
    [string]$DbPassword   = '',
    [string]$RootPassword = '1234',
    [string]$DbName       = 'aitaes_db',
    [string]$DbUser       = 'aitaes',
    [string]$JarName      = 'AITAES-0.0.1-SNAPSHOT.jar',
    [string]$NginxDir     = 'd:\lyq\nginx',
    [string]$WinSwDir     = 'd:\lyq\winsw',
    [string]$JdkDir       = 'd:\lyq\jdk',
    [switch]$SkipDb
)

$ErrorActionPreference = 'Stop'

function Fail([string]$msg) { Write-Host "`n[ERROR] $msg" -ForegroundColor Red; exit 1 }

# ---------- 0) collect info ----------
if (-not $DbPassword) { $DbPassword = Read-Host 'Enter the database password for user "aitaes"' }
$deployDir   = $PSScriptRoot
$backendDir  = Join-Path $AppDir 'backend'
$frontendDir = Join-Path $AppDir 'frontend'
$jarPath     = Join-Path $backendDir $JarName

# ---------- 1) checks ----------
if (-not (Test-Path $jarPath)) { Fail "backend jar not found: $jarPath`nPut the built jar into $backendDir first." }
if (-not (Test-Path (Join-Path $frontendDir 'dist\index.html'))) { Fail "frontend not found: $frontendDir\dist\index.html`nPut the dist folder into $frontendDir first." }

# java 选取：优先 $JdkDir（文档约定的安装位置），其次 PATH。
# 顺序很关键：PATH 上常见的旧版 JDK 1.8 会让服务装上却起不来
# （本项目 java.version=21，class 文件版本 65，Java 8 读不了）。
function Get-JavaMajorVersion([string]$Exe) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName               = $Exe
    $psi.Arguments              = '-version'
    $psi.UseShellExecute        = $false
    $psi.RedirectStandardError  = $true
    $psi.RedirectStandardOutput = $true
    $proc = [System.Diagnostics.Process]::Start($psi)
    $text = $proc.StandardError.ReadToEnd() + $proc.StandardOutput.ReadToEnd()
    $proc.WaitForExit()
    # Java 8 输出 "1.8.0_202"，Java 9+ 输出 "21.0.5"
    if ($text -match '"(\d+)(?:\.(\d+))?') {
        $major = [int]$Matches[1]
        if ($major -eq 1 -and $Matches[2]) { return [int]$Matches[2] }
        return $major
    }
    return 0
}

$javaExe = $null
$bundledJava = Join-Path $JdkDir 'bin\java.exe'
if (Test-Path $bundledJava) {
    $javaExe = $bundledJava
} else {
    $javaExe = (Get-Command java -ErrorAction SilentlyContinue).Source
}
if (-not $javaExe) {
    Fail "java not found.`nInstall JDK 21 (Temurin 21 zip) and put it at $JdkDir so that $JdkDir\bin\java.exe exists."
}

$javaMajor = Get-JavaMajorVersion $javaExe
if ($javaMajor -lt 21) {
    Fail "the java found is Java $javaMajor ($javaExe), but this app needs Java 21+ (pom.xml java.version=21).`nIt would install a service that dies with UnsupportedClassVersionError on startup.`nFix: install JDK 21 (Temurin 21 zip) and put it at $JdkDir so that $JdkDir\bin\java.exe exists.`nCheck what is on PATH with:  where java ; java -version"
}
if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) { Fail 'mysql command not found. Make sure MySQL bin dir is on PATH.' }
$nginxExe = Join-Path $NginxDir 'nginx.exe'
if (-not (Test-Path $nginxExe)) { Fail "nginx not found: $nginxExe" }
$winSw = Join-Path $WinSwDir 'WinSW-x64.exe'
if (-not (Test-Path $winSw))    { Fail "WinSW not found: $winSw`nDownload WinSW-x64.exe and put it into $WinSwDir." }

Write-Host '== checks passed =='
Write-Host "  jar    : $jarPath"
Write-Host "  java   : $javaExe (Java $javaMajor)"
Write-Host "  nginx  : $nginxExe"

# ---------- 2) init database ----------
# setup-db.ps1 会 DROP + 重建全部表再导入演示数据，重跑会清空现有数据。
# 只是重新注册服务（改了端口/密码/Java 路径）时加 -SkipDb 跳过这一步。
if ($SkipDb) {
    Write-Host "`n== init database (skipped: -SkipDb) =="
} else {
    Write-Host "`n== init database =="
    & (Join-Path $deployDir 'setup-db.ps1') -DbPassword $DbPassword -RootPassword $RootPassword
}

# ---------- 3) configure Nginx ----------
Write-Host "`n== configure nginx =="
$nginxConf = Join-Path $NginxDir 'conf\nginx.conf'
if (Test-Path $nginxConf) {
    Copy-Item -Force $nginxConf "$nginxConf.bak"
    Write-Host '  backed up original to nginx.conf.bak'
}
Copy-Item -Force (Join-Path $deployDir 'nginx\nginx.conf') $nginxConf
Write-Host '  wrote new config (listen on 5150)'

# ---------- 4) register services (auto-start) ----------
Write-Host "`n== register Windows services =="

# WinSW 按「可执行文件名」找同名配置（AITAES.exe -> AITAES.xml），
# 在 WinSW v2 / v3 上都可靠；直接传 XML 全路径作参数在 v2 上不可靠。
function Register-WinSwService {
    param([string]$Exe, [string]$ServiceName, [string]$Label)
    if (-not (Test-Path $Exe)) { Fail "$Label service exe not found: $Exe" }

    # 每次都卸载重装，而不是 restart：WinSW 在 install 时把 <env> 固化进服务
    # 定义，只 restart 不会重新读取改过的 XML —— 改端口/密码后必须重装才生效。
    $existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existing) {
        if ($existing.Status -ne 'Stopped') {
            Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        }
        & $Exe uninstall
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [warn] $Label uninstall returned $LASTEXITCODE, continuing" -ForegroundColor Yellow
        }
        # 等 SCM 真正删掉服务，避免紧接着的 install 撞名
        for ($i = 0; $i -lt 20 -and (Get-Service -Name $ServiceName -ErrorAction SilentlyContinue); $i++) {
            Start-Sleep -Milliseconds 500
        }
    }

    & $Exe install
    if ($LASTEXITCODE -ne 0) { Fail "$Label service install failed (exit $LASTEXITCODE)" }
    & $Exe start
    if ($LASTEXITCODE -ne 0) { Fail "$Label service start failed (exit $LASTEXITCODE)" }
    Write-Host "  $Label service registered and started"
}

# 4.1 backend AITAES service
$aitaesExe = Join-Path $WinSwDir 'AITAES.exe'
$aitaesXml = Join-Path $WinSwDir 'AITAES.xml'
@"
<service>
  <id>AITAES</id>
  <name>AITAES Backend</name>
  <description>AITAES Spring Boot backend</description>
  <executable>$javaExe</executable>
  <arguments>-jar $jarPath</arguments>
  <env name="AI_BASE_URL" value="http://127.0.0.1:32767/v1"/>
  <env name="AI_MODEL" value="qwen2.5:7b"/>
  <env name="AI_API_KEY" value="ollama"/>
  <env name="SPRING_DATASOURCE_USERNAME" value="$DbUser"/>
  <env name="SPRING_DATASOURCE_PASSWORD" value="$DbPassword"/>
  <logmode>rotate</logmode>
  <onfailure action="restart" delay="10 sec"/>
</service>
"@ | Set-Content -Path $aitaesXml -Encoding UTF8

Copy-Item -Force $winSw $aitaesExe
Register-WinSwService -Exe $aitaesExe -ServiceName 'AITAES' -Label 'AITAES'

# 4.2 nginx service
$nginxSvcExe = Join-Path $WinSwDir 'nginx-svc.exe'
$nginxXml    = Join-Path $WinSwDir 'nginx-svc.xml'
@"
<service>
  <id>nginx</id>
  <name>Nginx</name>
  <description>Nginx web server</description>
  <executable>$nginxExe</executable>
  <arguments>-p $NginxDir</arguments>
  <stopexecutable>$nginxExe</stopexecutable>
  <stoparguments>-p $NginxDir -s stop</stoparguments>
  <logmode>rotate</logmode>
</service>
"@ | Set-Content -Path $nginxXml -Encoding UTF8

Copy-Item -Force $winSw $nginxSvcExe
Register-WinSwService -Exe $nginxSvcExe -ServiceName 'nginx' -Label 'nginx'

# ---------- 5) done ----------
Write-Host "`n=============================================="
Write-Host ' DEPLOY DONE!'
Write-Host '  Local : http://127.0.0.1:5150'
Write-Host '  Public: http://125.221.160.17:5150'
Write-Host ''
Write-Host ' One last step - pull the AI model (once):'
Write-Host '   ollama pull qwen2.5:7b'
Write-Host ''
Write-Host ' Verify:'
Write-Host '   curl http://127.0.0.1:32767/v1/models'
Write-Host '   Get-Service AITAES, ollama, nginx'
Write-Host '=============================================='

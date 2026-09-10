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
    [string]$JdkDir       = 'd:\lyq\jdk'
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

$javaExe = (Get-Command java -ErrorAction SilentlyContinue).Source
if (-not $javaExe) {
    $candidate = Join-Path $JdkDir 'bin\java.exe'
    if (Test-Path $candidate) { $javaExe = $candidate }
}
if (-not $javaExe) { Fail 'java not found. Install JRE/JDK 21 (or put it under d:\lyq\jdk) and add to PATH.' }
if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) { Fail 'mysql command not found. Make sure MySQL bin dir is on PATH.' }
$nginxExe = Join-Path $NginxDir 'nginx.exe'
if (-not (Test-Path $nginxExe)) { Fail "nginx not found: $nginxExe" }
$winSw = Join-Path $WinSwDir 'WinSW-x64.exe'
if (-not (Test-Path $winSw))    { Fail "WinSW not found: $winSw`nDownload WinSW-x64.exe and put it into $WinSwDir." }

Write-Host '== checks passed =='
Write-Host "  jar    : $jarPath"
Write-Host "  java   : $javaExe"
Write-Host "  nginx  : $nginxExe"

# ---------- 2) init database ----------
Write-Host "`n== init database =="
& (Join-Path $deployDir 'setup-db.ps1') -DbPassword $DbPassword -RootPassword $RootPassword

# ---------- 3) configure Nginx ----------
Write-Host "`n== configure nginx =="
$nginxConf = Join-Path $NginxDir 'conf\nginx.conf'
if (Test-Path $nginxConf) {
    Copy-Item -Force $nginxConf "$nginxConf.bak"
    Write-Host '  backed up original to nginx.conf.bak'
}
Copy-Item -Force (Join-Path $deployDir 'nginx\nginx.conf') $nginxConf
Write-Host '  wrote new config (listen on 3000)'

# ---------- 4) register services (auto-start) ----------
Write-Host "`n== register Windows services =="

# 4.1 backend AITAES service
$aitaesXml = Join-Path $WinSwDir 'AITAES-service.xml'
@"
<service>
  <id>AITAES</id>
  <name>AITAES Backend</name>
  <description>AITAES Spring Boot backend</description>
  <executable>$javaExe</executable>
  <arguments>-jar $jarPath</arguments>
  <env name="AI_BASE_URL" value="http://127.0.0.1:11434/v1"/>
  <env name="AI_MODEL" value="qwen2.5:7b"/>
  <env name="AI_API_KEY" value="ollama"/>
  <env name="SPRING_DATASOURCE_USERNAME" value="$DbUser"/>
  <env name="SPRING_DATASOURCE_PASSWORD" value="$DbPassword"/>
  <logmode>rotate</logmode>
  <onfailure action="restart" delay="10 sec"/>
</service>
"@ | Set-Content -Path $aitaesXml -Encoding UTF8

if (Get-Service -Name AITAES -ErrorAction SilentlyContinue) {
    & $winSw restart $aitaesXml
    Write-Host '  AITAES service already exists, restarted'
} else {
    & $winSw install $aitaesXml
    & $winSw start $aitaesXml
    Write-Host '  AITAES service installed and started'
}

# 4.2 nginx service
$nginxXml = Join-Path $WinSwDir 'nginx-service.xml'
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

if (Get-Service -Name nginx -ErrorAction SilentlyContinue) {
    & $winSw restart $nginxXml
    Write-Host '  nginx service already exists, restarted'
} else {
    & $winSw install $nginxXml
    & $winSw start $nginxXml
    Write-Host '  nginx service installed and started'
}

# ---------- 5) done ----------
Write-Host "`n=============================================="
Write-Host ' DEPLOY DONE!'
Write-Host '  Local : http://127.0.0.1:3000'
Write-Host '  Public: http://125.221.160.8:3000'
Write-Host ''
Write-Host ' One last step - pull the AI model (once):'
Write-Host '   ollama pull qwen2.5:7b'
Write-Host ''
Write-Host ' Verify:'
Write-Host '   curl http://127.0.0.1:11434/v1/models'
Write-Host '   Get-Service AITAES, ollama, nginx'
Write-Host '=============================================="

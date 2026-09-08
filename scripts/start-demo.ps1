$ErrorActionPreference = "Stop"

# 第四周答辩环境一键启动：先启动 Ollama，再分别启动后端和前端。
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not (Get-NetTCPConnection -LocalPort 11434 -State Listen -ErrorAction SilentlyContinue)) {
    Start-Process powershell -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $PSScriptRoot 'start-ollama.ps1') -WindowStyle Hidden
    Start-Sleep -Seconds 2
}

if (-not (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue)) {
    Start-Process powershell -ArgumentList '-NoProfile', '-Command', "Set-Location '$projectRoot'; `$env:SPRING_DATASOURCE_PASSWORD='123456'; .\mvnw.cmd spring-boot:run" -WindowStyle Hidden
}

if (-not (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)) {
    Start-Process powershell -ArgumentList '-NoProfile', '-Command', "Set-Location '$projectRoot\frontend'; npm run dev -- --host 127.0.0.1" -WindowStyle Hidden
}

Write-Host '启动请求已发送：Ollama 11434，后端 8080，前端 5173。请等待约 30 秒后打开 http://127.0.0.1:5173。'

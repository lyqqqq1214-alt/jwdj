$ErrorActionPreference = "Stop"

$runtime = Join-Path $PSScriptRoot "..\.ollama-runtime"
$env:OLLAMA_MODELS = Join-Path $runtime "models"
$env:OLLAMA_HOST = "127.0.0.1:11434"
$env:HOME = Join-Path $runtime "home"
$env:USERPROFILE = $env:HOME

New-Item -ItemType Directory -Force -Path $env:OLLAMA_MODELS, $env:HOME | Out-Null
& (Join-Path $runtime "app\ollama.exe") serve

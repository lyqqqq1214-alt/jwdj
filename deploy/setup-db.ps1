# ============================================================
#  AITAES DB init (run on the server in an admin PowerShell)
#  Creates DB + dedicated user + tables + demo data.
#  Requires MySQL's bin dir on PATH; SQL files live in .\db
#
#  Usage:  .\setup-db.ps1 -DbPassword 'your-db-password'
#          (root password defaults to 1234; override with -RootPassword)
# ============================================================
param(
    [string]$RootUser     = 'root',
    [string]$RootPassword = '1234',
    [string]$DbHost         = 'localhost',
    [int]   $Port         = 3306,
    [string]$DbName       = 'aitaes_db',
    [string]$DbUser       = 'aitaes',
    [string]$DbPassword   = 'Aitaes@2026'
)

$ErrorActionPreference = 'Stop'
$dbDir = Join-Path $PSScriptRoot 'db'

# run a single SQL statement (via mysql -e)
function Invoke-MySql {
    param([string]$Sql)
    & mysql --host=$DbHost --port=$Port -u$RootUser -p$RootPassword --default-character-set=utf8mb4 -e $Sql
    if ($LASTEXITCODE -ne 0) { throw "mysql failed: $Sql" }
}

# import a SQL file (via cmd redirection, bytes passed through unchanged)
function Invoke-SqlFile {
    param([string]$FileName)
    $file = Join-Path $dbDir $FileName
    $cmd  = "mysql --host=$DbHost --port=$Port -u$RootUser -p$RootPassword --default-character-set=utf8mb4 $DbName < `"$file`""
    Write-Host "  [import] $FileName"
    cmd /c $cmd
    if ($LASTEXITCODE -ne 0) { throw "import failed: $FileName" }
}

Write-Host '== 1/5 create database =='
Invoke-MySql "CREATE DATABASE IF NOT EXISTS $DbName DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

Write-Host '== 2/5 create dedicated user (only aitaes_db privileges) =='
Invoke-MySql "CREATE USER IF NOT EXISTS '$DbUser'@'localhost' IDENTIFIED BY '$DbPassword'; GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX,DROP ON $DbName.* TO '$DbUser'@'localhost'; FLUSH PRIVILEGES;"

Write-Host '== 3/5 import schema =='
Invoke-SqlFile 'init.sql'

Write-Host '== 4/5 import demo data =='
Invoke-SqlFile 'simulated_data.sql'
Invoke-SqlFile 'question_bank_seed.sql'
Invoke-SqlFile 'enrich_data.sql'
Invoke-SqlFile 'rich_data.sql'

Write-Host ''
Write-Host '== DONE =='
Write-Host "Database : $DbName"
Write-Host "User     : $DbUser@localhost    Password: $DbPassword"

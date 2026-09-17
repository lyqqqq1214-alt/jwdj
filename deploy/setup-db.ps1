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

if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) { throw 'mysql command not found. Add MySQL bin dir to PATH (see docs/deploy-simple.md 4.3).' }

# run a single SQL statement (via mysql -e)
function Invoke-MySql {
    param([string]$Sql)
    & mysql --host=$DbHost --port=$Port --user=$RootUser --password=$RootPassword --default-character-set=utf8mb4 -e $Sql
    if ($LASTEXITCODE -ne 0) { throw "mysql failed: $Sql" }
}

# import a SQL file by piping its raw bytes into mysql's stdin
# (avoids cmd quoting/redirection issues and any encoding conversion)
function Invoke-SqlFile {
    param([string]$FileName)
    $file = Join-Path $dbDir $FileName
    Write-Host "  [import] $FileName"

    $mysql = (Get-Command mysql -ErrorAction Stop).Source
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName  = $mysql
    $psi.Arguments = "--host=$DbHost --port=$Port --user=$RootUser --password=$RootPassword --default-character-set=utf8mb4 $DbName"
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true

    $proc = [System.Diagnostics.Process]::Start($psi)
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $proc.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
    $proc.StandardInput.Close()
    $proc.WaitForExit()

    if ($proc.ExitCode -ne 0) { throw "import failed: $FileName (exit $($proc.ExitCode))" }
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

Write-Host '== 4.5/5 collapse to single course + complete student scores =='
Invoke-SqlFile 'migrate-to-single-course.sql'
Invoke-SqlFile 'complete_student_scores.sql'

Write-Host ''
Write-Host '== DONE =='
Write-Host "Database : $DbName"
Write-Host "User     : $DbUser@localhost    Password: $DbPassword"

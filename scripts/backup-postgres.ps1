param(
  [string]$OutDir = ".\backups"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outFile = Join-Path $OutDir "rh_platform-$stamp.sql"

docker compose exec -T postgres pg_dump -U rh_user -d rh_platform --no-owner --format=plain |
  Set-Content -Path $outFile -Encoding utf8

Write-Host "Backup written to $outFile"
Write-Host "Copy this file to S3/R2 and keep a 30-day retention window."

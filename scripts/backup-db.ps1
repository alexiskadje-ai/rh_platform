# Sauvegarde locale de Postgres (docker compose). Conserver hors de la machine en production.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$dest = Join-Path $root "backups"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$stamp = Get-Date -Format "yyyy-MM-dd-HHmm"
$file = Join-Path $dest "rh_platform-$stamp.dump"
docker compose exec -T postgres pg_dump -U rh_user -d rh_platform -Fc -f /tmp/rh_platform.dump
docker compose cp postgres:/tmp/rh_platform.dump $file
docker compose exec -T postgres rm -f /tmp/rh_platform.dump
Get-ChildItem $dest -Filter "rh_platform-*.dump" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } |
  Remove-Item -Force
Write-Output "Sauvegarde : $file"

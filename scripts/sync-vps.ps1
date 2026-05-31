param(
  [switch]$Full
)

$ErrorActionPreference = "Stop"

$vpsUser = $env:VPS_USER
$vpsHost = $env:VPS_HOST

if ([string]::IsNullOrWhiteSpace($vpsUser) -or [string]::IsNullOrWhiteSpace($vpsHost)) {
  throw "Configure VPS_USER e VPS_HOST no terminal antes de executar npm run sync."
}

$archiveName = "vincere-sync-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds()).tar.gz"
$archivePath = Join-Path $env:TEMP $archiveName
$remoteArchive = "/tmp/$archiveName"
$remoteDir = "/home/$vpsUser/vincere"
$remote = "$vpsUser@$vpsHost"

try {
  tar `
    --exclude="./node_modules" `
    --exclude="./.git" `
    --exclude="./clips" `
    --exclude="./data.db*" `
    --exclude="./.env" `
    --exclude="./.env.example" `
    --exclude="./README.md" `
    --exclude="./dist" `
    -czf $archivePath `
    .

  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao criar pacote de sincronizacao."
  }

  scp $archivePath "${remote}:$remoteArchive"
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao enviar pacote para a VPS."
  }

  ssh $remote "mkdir -p '$remoteDir' && tar -xzf '$remoteArchive' -C '$remoteDir' && rm -f '$remoteArchive'"
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao extrair pacote na VPS."
  }

  Write-Host "OK Codigo sincronizado em ${remote}:$remoteDir"

  if ($Full) {
    ssh $remote "cd '$remoteDir' && npm install && pm2 restart all"
    if ($LASTEXITCODE -ne 0) {
      throw "Falha ao instalar dependencias ou reiniciar a VPS."
    }

    Write-Host "OK Dependencias instaladas e processos reiniciados"
  }
} finally {
  if (Test-Path $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }
}

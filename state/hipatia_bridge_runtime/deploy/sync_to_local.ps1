[CmdletBinding()]
param(
    [Parameter()]
    [string]$RuntimeRoot = 'D:\Biblioteca de Hipatia\_bitacora',

    [Parameter()]
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'
$projectionRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $PSScriptRoot 'runtime-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$resolvedRuntime = [System.IO.Path]::GetFullPath($RuntimeRoot)

if (-not (Test-Path -LiteralPath $resolvedRuntime -PathType Container)) {
    throw "RuntimeRoot no existe: $resolvedRuntime"
}
if ([System.IO.Path]::GetPathRoot($resolvedRuntime) -eq $resolvedRuntime) {
    throw 'RuntimeRoot no puede ser la raíz de una unidad.'
}

$comparisons = foreach ($file in $manifest.files) {
    $source = Join-Path $projectionRoot ($file.projection -replace '/', '\')
    $destination = Join-Path $resolvedRuntime ($file.runtime -replace '/', '\')
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
        throw "Falta archivo proyectado: $($file.projection)"
    }

    $sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($sourceHash -ne $file.sha256) {
        throw "Hash proyectado inesperado: $($file.projection)"
    }

    $destinationHash = if (Test-Path -LiteralPath $destination -PathType Leaf) {
        (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()
    } else {
        $null
    }

    [pscustomobject]@{
        Runtime = $file.runtime
        Projection = $file.projection
        ExpectedSha256 = $file.sha256
        RuntimeSha256 = $destinationHash
        Match = $destinationHash -eq $file.sha256
        Source = $source
        Destination = $destination
    }
}

$comparisons |
    Select-Object Runtime, Projection, Match, RuntimeSha256 |
    Format-Table -AutoSize

if (-not $Apply) {
    $drift = @($comparisons | Where-Object { -not $_.Match }).Count
    Write-Output "Inspección terminada. Archivos con deriva: $drift. No se escribió nada."
    return
}

$listener = Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    throw 'Despliegue bloqueado: el puerto 8765 está escuchando. Detén el runtime mediante su procedimiento gobernado y vuelve a ejecutar.'
}

$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$backupRoot = Join-Path $resolvedRuntime "operations\backups\source-sync-$stamp"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

foreach ($item in $comparisons) {
    if ($item.Match) {
        continue
    }

    if (Test-Path -LiteralPath $item.Destination -PathType Leaf) {
        $backup = Join-Path $backupRoot ($item.Runtime -replace '/', '\')
        New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
        Copy-Item -LiteralPath $item.Destination -Destination $backup
    }

    New-Item -ItemType Directory -Path (Split-Path -Parent $item.Destination) -Force | Out-Null
    Copy-Item -LiteralPath $item.Source -Destination $item.Destination
    $deployedHash = (Get-FileHash -LiteralPath $item.Destination -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($deployedHash -ne $item.ExpectedSha256) {
        throw "Verificación posterior falló: $($item.Runtime)"
    }
}

Write-Output "Sincronización de código verificada. Backup gestionado: $backupRoot"
Write-Output 'El script no inició el runtime ni modificó datos soberanos.'

[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$runtimeRoot = Split-Path -Parent $PSScriptRoot
$server = Join-Path $runtimeRoot 'server'
$previousPythonPath = $env:PYTHONPATH

try {
    $env:PYTHONPATH = $server

    & py -3 -X utf8 (Join-Path $PSScriptRoot 'test_bitacora_v1_1.py')
    if ($LASTEXITCODE -ne 0) {
        throw "test_bitacora_v1_1.py falló con código $LASTEXITCODE"
    }

    & py -3 -X utf8 -m unittest `
        (Join-Path $PSScriptRoot 'test_projection_manifest.py') `
        -v
    if ($LASTEXITCODE -ne 0) {
        throw "test_projection_manifest.py falló con código $LASTEXITCODE"
    }
} finally {
    $env:PYTHONPATH = $previousPythonPath
}

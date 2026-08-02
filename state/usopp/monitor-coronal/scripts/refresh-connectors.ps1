$ErrorActionPreference = 'Stop'
$outputPath = Join-Path $PSScriptRoot '..\app\data\local-snapshot.json'
$excluded = @('NEM', 'CLI', '.git', 'node_modules')

function Get-TreeMetadata([string]$Root) {
  $files = Get-ChildItem -LiteralPath $Root -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object {
      $segments = $_.FullName.Substring($Root.Length).Split([IO.Path]::DirectorySeparatorChar, [System.StringSplitOptions]::RemoveEmptyEntries)
      -not ($segments | Where-Object { $excluded -contains $_ })
    }
  $measure = $files | Measure-Object -Property Length -Sum
  $newest = $files | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  $totalBytes = if ($null -eq $measure.Sum) { 0 } else { $measure.Sum }
  [ordered]@{ files = $measure.Count; bytes = [long]$totalBytes; newest = if ($newest) { $newest.LastWriteTime.ToString('o') } else { $null } }
}

$repo = 'C:\Users\usuario\OneDrive\Documentos\GitHub\ThousandSunny'
Push-Location -LiteralPath $repo
try {
  $branch = (git branch --show-current).Trim()
  $commit = (git rev-parse --short HEAD).Trim()
  $changed = @(git status --porcelain).Count
  $divergence = @(git rev-list --left-right --count 'HEAD...@{u}' 2>$null)
  $behind = 0; $ahead = 0
  if ($LASTEXITCODE -eq 0 -and $divergence.Count) {
    $parts = ($divergence[0] -split '\s+')
    $ahead = [int]$parts[0]; $behind = [int]$parts[1]
  }
} finally { Pop-Location }

$obsidianMetadata = Get-TreeMetadata 'D:\La maceta de Groot\40_Biblioteca_Hipatia'
$obsidianMetadata['vaultDetected'] = Test-Path -LiteralPath 'D:\La maceta de Groot\.obsidian'
$snapshot = [ordered]@{
  generatedAt = (Get-Date).ToString('o')
  physical = Get-TreeMetadata 'D:\Biblioteca de Hipatia'
  obsidian = $obsidianMetadata
  groot = Get-TreeMetadata 'C:\La maceta de Groot'
  github = [ordered]@{ branch = $branch; commit = $commit; changed = $changed; behind = $behind; ahead = $ahead }
  rocket = [ordered]@{ observer = 'windows-standard'; vmDetected = $false; status = 'unknown' }
}

$snapshot | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $outputPath -Encoding utf8
Write-Output "Read-only snapshot refreshed: $outputPath"

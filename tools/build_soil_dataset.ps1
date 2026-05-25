# Build data/soil_profiles.json from the 318 CSVs in data/soil_profiles/.
# Each profile is reduced to its essential geotechnical columns and the
# empirically computed Vs30 (NEHRP formula). The result is bundled into
# a single JSON so compare.html can load it in one request.
#
# Run:  pwsh tools/build_soil_dataset.ps1

$ErrorActionPreference = 'Stop'
$root  = Split-Path -Parent $PSScriptRoot
$srcDir = Join-Path $root 'data\soil_profiles'
$outFile = Join-Path $root 'data\soil_profiles.json'

$profiles = [ordered]@{}
$files = Get-ChildItem -Path $srcDir -Filter *.csv | Sort-Object Name

foreach ($f in $files) {
    $name = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
    $rows = Import-Csv -Path $f.FullName

    $layers = @()
    foreach ($r in $rows) {
        $h  = [double]$r.thickness
        $rho = [double]$r.mass_density
        $vs = [double]$r.Vs
        $st = ($r.soil_type ?? '').Trim().ToLower()
        if ($h -le 0 -or $vs -le 0) { continue }
        $layers += [pscustomobject]@{
            h    = [math]::Round($h, 3)
            rho  = [math]::Round($rho, 1)
            vs   = [math]::Round($vs, 2)
            st   = $st
        }
    }

    if ($layers.Count -eq 0) { continue }

    # Compute Vs30 via the NEHRP formula on the top 30 m only.
    $remaining = 30.0
    $denom = 0.0
    foreach ($l in $layers) {
        if ($remaining -le 0) { break }
        $take = [math]::Min($l.h, $remaining)
        $denom += $take / $l.vs
        $remaining -= $take
    }
    $depthInstrumented = ($layers | Measure-Object -Property h -Sum).Sum
    $vs30 = $null
    if ($denom -gt 0) {
        $usedDepth = [math]::Min(30.0, $depthInstrumented)
        $vs30 = [math]::Round($usedDepth / $denom, 2)
    }

    $profiles[$name] = [ordered]@{
        layers            = $layers
        vs30              = $vs30
        depth_instrumented = [math]::Round($depthInstrumented, 2)
        full30            = ($depthInstrumented -ge 30.0)
    }
}

$json = $profiles | ConvertTo-Json -Depth 6 -Compress
Set-Content -Path $outFile -Value $json -Encoding utf8
Write-Host "Wrote $($profiles.Count) profiles to $outFile ($([math]::Round((Get-Item $outFile).Length/1024,1)) KB)"

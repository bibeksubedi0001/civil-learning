#requires -version 5.1
# Generates the bundled CE x AI sample datasets:
#   data/concrete/concrete_strength.csv  (UCI-like, ~600 rows)
#   data/soil/soil_samples.csv           (flattened from soil_profiles.json)
#   data/traffic/traffic_flow.csv        (hourly synthetic, 30 days)
# Idempotent + deterministic via a seeded RNG.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$data = Join-Path $root 'data'

New-Item -ItemType Directory -Force -Path (Join-Path $data 'concrete') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $data 'soil')     | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $data 'traffic')  | Out-Null

# --- Seeded LCG (so file content is stable across runs) ----------------------
$script:_seed = 1337
function Rand {
    $script:_seed = (1103515245 * $script:_seed + 12345) -band 0x7FFFFFFF
    return $script:_seed / 2147483647.0
}
function RandRange($lo, $hi) { return $lo + (Rand) * ($hi - $lo) }
function RandNorm {
    # Box-Muller
    $u1 = [Math]::Max(1e-9, (Rand))
    $u2 = (Rand)
    return [Math]::Sqrt(-2 * [Math]::Log($u1)) * [Math]::Cos(2 * [Math]::PI * $u2)
}

# ============================================================================
# 1) CONCRETE  --- inspired by UCI Concrete Compressive Strength (Yeh, 1998)
# ============================================================================
$concrete = New-Object System.Text.StringBuilder
[void]$concrete.AppendLine('cement_kg_m3,blast_slag_kg_m3,fly_ash_kg_m3,water_kg_m3,superplasticizer_kg_m3,coarse_agg_kg_m3,fine_agg_kg_m3,age_days,strength_mpa')

$ages = 1,3,7,14,28,28,28,28,56,90,180,365
for ($i = 0; $i -lt 600; $i++) {
    $cement = [Math]::Round((RandRange 140 540), 1)
    $slag   = if ((Rand) -lt 0.55) { [Math]::Round((RandRange 0 200), 1) } else { 0.0 }
    $fly    = if ((Rand) -lt 0.45) { [Math]::Round((RandRange 0 200), 1) } else { 0.0 }
    $water  = [Math]::Round((RandRange 130 240), 1)
    $sp     = [Math]::Round((RandRange 0 32), 2)
    $coarse = [Math]::Round((RandRange 800 1140), 1)
    $fine   = [Math]::Round((RandRange 590 990), 1)
    $age    = $ages[[int]((Rand) * $ages.Length) % $ages.Length]

    # Toy mechanistic model: Abrams-style w/c effect + SCM substitution + age + noise
    $binder = $cement + 0.7 * $slag + 0.8 * $fly
    $wcr    = $water / [Math]::Max(1, $binder)
    $base   = 110.0 * [Math]::Exp(-1.85 * $wcr)                 # Abrams shape
    $age_f  = 0.45 + 0.55 * [Math]::Min(1.4, [Math]::Log10($age + 1))
    $sp_f   = 1.0 + 0.012 * $sp
    $agg_f  = 1.0 + 0.0002 * ($coarse + $fine - 1600)
    $strength = $base * $age_f * $sp_f * $agg_f + (RandNorm) * 3.5
    $strength = [Math]::Max(3.0, [Math]::Min(95.0, $strength))
    [void]$concrete.AppendLine(("{0},{1},{2},{3},{4},{5},{6},{7},{8}" -f $cement,$slag,$fly,$water,$sp,$coarse,$fine,$age,([Math]::Round($strength,2))))
}
Set-Content -Path (Join-Path $data 'concrete/concrete_strength.csv') -Value $concrete.ToString() -NoNewline -Encoding UTF8
Write-Host "wrote concrete_strength.csv (600 rows)"

# ============================================================================
# 2) SOIL  --- flattened summary, one row per Kathmandu-valley borehole
# ============================================================================
$soilJsonPath = Join-Path $data 'soil_profiles.json'
$soil = New-Object System.Text.StringBuilder
[void]$soil.AppendLine('borehole_id,site,total_depth_m,n_layers,top3m_avg_density_kg_m3,top3m_avg_vs_m_s,vs30_m_s,nehrp_class,clay_frac,sand_frac,gravel_frac,silt_frac')

if (Test-Path $soilJsonPath) {
    $raw = Get-Content -Raw -LiteralPath $soilJsonPath
    $j   = $raw | ConvertFrom-Json
    $count = 0
    foreach ($prop in $j.PSObject.Properties) {
        $id  = $prop.Name
        $p   = $prop.Value
        $layers = $p.layers
        if (-not $layers -or $layers.Count -eq 0) { continue }

        # Derive site name from id prefix (everything up to '_BH' or similar)
        $site = if ($id -match '^([A-Za-z]+(?:_[A-Za-z]+)*?)_[A-Z]*BH') { $matches[1] } else { ($id -split '_')[0] }

        $td = 0.0
        foreach ($l in $layers) { $td += [double]$l.h }
        $nl = $layers.Count

        # Top-3m weighted averages
        $rem = 3.0; $wsumRho = 0.0; $wsumVs = 0.0; $w = 0.0
        foreach ($l in $layers) {
            if ($rem -le 0) { break }
            $take = [Math]::Min([double]$l.h, $rem)
            $wsumRho += [double]$l.rho * $take
            $wsumVs  += [double]$l.vs  * $take
            $w       += $take
            $rem     -= $take
        }
        $rho3 = if ($w -gt 0) { [Math]::Round($wsumRho / $w, 1) } else { 0 }
        $vs3  = if ($w -gt 0) { [Math]::Round($wsumVs  / $w, 1) } else { 0 }

        # NEHRP Vs30 = harmonic mean over 30 m (prefer the stored value if present)
        if ($p.PSObject.Properties.Name -contains 'vs30' -and $p.vs30) {
            $vs30 = [Math]::Round([double]$p.vs30, 1)
        } else {
            $rem30 = 30.0; $sumTV = 0.0; $cov = 0.0
            foreach ($l in $layers) {
                if ($rem30 -le 0) { break }
                $take = [Math]::Min([double]$l.h, $rem30)
                $vs   = [double]$l.vs
                if ($vs -gt 0) { $sumTV += $take / $vs }
                $cov  += $take
                $rem30 -= $take
            }
            if ($cov -lt 30 -and $cov -gt 0) {
                $vsLast = [double]$layers[-1].vs
                if ($vsLast -le 0) { $vsLast = 360 }
                $sumTV  += (30 - $cov) / $vsLast
            }
            $vs30 = if ($sumTV -gt 0) { [Math]::Round(30.0 / $sumTV, 1) } else { 0 }
        }
        $nehrp = if     ($vs30 -ge 1500) { 'A' }
                 elseif ($vs30 -ge 760)  { 'B' }
                 elseif ($vs30 -ge 360)  { 'C' }
                 elseif ($vs30 -ge 180)  { 'D' }
                 else                    { 'E' }

        # Coarse soil-type fractions across full profile (by thickness)
        $clay = 0.0; $sand = 0.0; $gravel = 0.0; $silt = 0.0; $total = 0.0
        foreach ($l in $layers) {
            $t  = [double]$l.h
            $st = ("$($l.st)").ToLower()
            $total += $t
            if     ($st -match 'clay')   { $clay   += $t }
            elseif ($st -match 'gravel') { $gravel += $t }
            elseif ($st -match 'silt')   { $silt   += $t }
            else                         { $sand   += $t }
        }
        if ($total -le 0) { continue }
        $cf = [Math]::Round($clay/$total, 3)
        $sf = [Math]::Round($sand/$total, 3)
        $gf = [Math]::Round($gravel/$total, 3)
        $sif= [Math]::Round($silt/$total, 3)

        [void]$soil.AppendLine(("{0},{1},{2},{3},{4},{5},{6},{7},{8},{9},{10},{11}" -f $id,$site,([Math]::Round($td,2)),$nl,$rho3,$vs3,$vs30,$nehrp,$cf,$sf,$gf,$sif))
        $count++
    }
    Write-Host "wrote soil_samples.csv ($count boreholes)"
} else {
    Write-Warning "soil_profiles.json not found, generating synthetic soil rows"
    for ($i=0; $i -lt 200; $i++) {
        $vs30 = [Math]::Round((RandRange 140 520), 1)
        $nehrp = if ($vs30 -ge 360) { 'C' } elseif ($vs30 -ge 180) { 'D' } else { 'E' }
        $cf = [Math]::Round((Rand), 3); $sf = [Math]::Round((Rand), 3)
        $gf = [Math]::Round((Rand) * 0.3, 3); $sif = [Math]::Max(0, 1 - $cf - $sf - $gf)
        [void]$soil.AppendLine("BH$i,Synthetic,30.0,8,$((RandRange 1700 2000) -as [int]),$((RandRange 150 320) -as [int]),$vs30,$nehrp,$cf,$sf,$gf,$([Math]::Round($sif,3))")
    }
}
Set-Content -Path (Join-Path $data 'soil/soil_samples.csv') -Value $soil.ToString() -NoNewline -Encoding UTF8

# ============================================================================
# 3) TRAFFIC  --- hourly flow at one synthetic urban corridor, 30 days
# ============================================================================
$traffic = New-Object System.Text.StringBuilder
[void]$traffic.AppendLine('timestamp,day_of_week,hour,flow_veh_h,occupancy_pct,avg_speed_kmh,weather,incident')

$start = [DateTime]::Parse('2025-09-01T00:00:00')
$capacity = 2200.0   # veh/h per lane near saturation
$weatherStates = @('clear','clear','clear','clear','rain','rain','fog')
for ($h = 0; $h -lt 24*30; $h++) {
    $t = $start.AddHours($h)
    $dow = [int]$t.DayOfWeek          # 0=Sun ... 6=Sat
    $hr  = $t.Hour
    $weekendFactor = if ($dow -eq 0 -or $dow -eq 6) { 0.6 } else { 1.0 }
    # AM + PM peaks (gaussians) + small mid-day bump + overnight floor
    $am = 0.85 * [Math]::Exp(-[Math]::Pow($hr-8.5, 2) / (2*1.4*1.4))
    $pm = 0.95 * [Math]::Exp(-[Math]::Pow($hr-18,  2) / (2*1.6*1.6))
    $mid= 0.30 * [Math]::Exp(-[Math]::Pow($hr-13,  2) / (2*2.2*2.2))
    $base = 0.07 + ($am + $pm + $mid) * $weekendFactor
    $weather = $weatherStates[[int]((Rand) * $weatherStates.Length) % $weatherStates.Length]
    $wfactor = switch ($weather) { 'rain' { 0.85 } 'fog' { 0.78 } default { 1.0 } }
    $incident = if ((Rand) -lt 0.012) { 1 } else { 0 }
    $ifactor = if ($incident) { 0.45 } else { 1.0 }
    $flow = $capacity * $base * $wfactor * $ifactor * (1 + 0.06 * (RandNorm))
    $flow = [Math]::Max(0, [Math]::Round($flow, 0))

    $occ = [Math]::Min(95, [Math]::Round($flow / $capacity * 100 * (1 + 0.08*(RandNorm)), 1))
    $occ = [Math]::Max(0, $occ)
    $freeSpeed = 65.0
    $speed = $freeSpeed * (1 - 0.7 * ($occ / 100))
    if ($incident) { $speed *= 0.5 }
    $speed = [Math]::Round([Math]::Max(5, $speed + (RandNorm)*1.5), 1)

    [void]$traffic.AppendLine(("{0},{1},{2},{3},{4},{5},{6},{7}" -f $t.ToString('yyyy-MM-ddTHH:mm:ss'),$dow,$hr,$flow,$occ,$speed,$weather,$incident))
}
Set-Content -Path (Join-Path $data 'traffic/traffic_flow.csv') -Value $traffic.ToString() -NoNewline -Encoding UTF8
Write-Host "wrote traffic_flow.csv (720 rows)"

Write-Host "done."

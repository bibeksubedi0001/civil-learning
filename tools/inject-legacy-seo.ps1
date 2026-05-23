# Adds SEO meta + enhancements.css to the legacy root-level chapter*.html pages
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$origin = 'https://civil-learning.bibeksubedi0001.com.np'
$ogImg  = "$origin/assets/og-image.png"

$pages = Get-ChildItem -Path $root -Filter 'chapter*.html' -File | Where-Object { $_.Name -match '^chapter\d+\.html$' }

foreach ($p in $pages) {
    $content = Get-Content $p.FullName -Raw
    if ($content -notmatch 'og:image') {
        $title = ''; if ($content -match '<title>(.*?)</title>') { $title = $Matches[1] }
        $titleA = $title -replace '"','&quot;'
        $canon = "$origin/$($p.Name)"
        $insert = @"

    <meta name="description" content="$titleA">
    <link rel="canonical" href="$canon">
    <meta name="theme-color" content="#0a0a0f" media="(prefers-color-scheme: dark)">
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
    <link rel="manifest" href="/manifest.webmanifest">
    <meta property="og:type" content="article">
    <meta property="og:title" content="$titleA">
    <meta property="og:url" content="$canon">
    <meta property="og:image" content="$ogImg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="$titleA">
    <meta name="twitter:image" content="$ogImg">
"@
        $content = $content -replace '(?s)(</title>)', "`$1$insert"
    }

    # Also inject enhancements.css link if absent
    if ($content -notmatch 'css/enhancements\.css') {
        $replacement = '$1' + "`r`n    " + '<link rel="stylesheet" href="css/enhancements.css">'
        $content = $content -replace '(<link rel="stylesheet" href="css/theme\.css">)', $replacement
    }

    Set-Content -Path $p.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host ("Enhanced: " + $p.Name)
}

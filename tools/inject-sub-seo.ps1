# Injects og:image, twitter:card image, theme-color, manifest, and canonical
# into every chapter*/sub*.html that doesn't already have them.
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$pages = Get-ChildItem -Path $root -Recurse -Include 'sub*.html' -File
$origin = 'https://civil-learning.bibeksubedi0001.com.np'
$ogImg  = "$origin/assets/og-image.png"

foreach ($p in $pages) {
    $content = Get-Content $p.FullName -Raw
    if ($content -match 'og:image') { continue }

    # Compute canonical from path
    $rel = $p.FullName.Substring($root.Path.Length).Replace('\','/').TrimStart('/')
    $canon = "$origin/$rel"

    # Extract title for og:title
    $title = ''
    if ($content -match '<title>(.*?)</title>') { $title = $Matches[1] }
    # Extract description if present
    $desc = $title
    if ($content -match '<meta name="description" content="(.*?)"') { $desc = $Matches[1] }

    # Escape for HTML attribute (basic)
    $titleA = $title -replace '"','&quot;'
    $descA  = $desc  -replace '"','&quot;'

    $insert = @"

    <link rel="canonical" href="$canon">
    <meta name="theme-color" content="#0a0a0f" media="(prefers-color-scheme: dark)">
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
    <link rel="manifest" href="/manifest.webmanifest">
    <meta property="og:type" content="article">
    <meta property="og:title" content="$titleA">
    <meta property="og:description" content="$descA">
    <meta property="og:url" content="$canon">
    <meta property="og:site_name" content="Civil Engineer's Guide to AI">
    <meta property="og:image" content="$ogImg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="$titleA">
    <meta name="twitter:description" content="$descA">
    <meta name="twitter:image" content="$ogImg">
"@

    # Prefer to insert after the description meta if present, else after </title>
    if ($content -match '(?s)(<meta name="description"[^>]*>)') {
        $new = $content -replace '(?s)(<meta name="description"[^>]*>)', "`$1$insert"
    } else {
        $new = $content -replace '(?s)(</title>)', "`$1$insert"
    }

    Set-Content -Path $p.FullName -Value $new -Encoding UTF8 -NoNewline
    Write-Host ("Enhanced: " + $rel)
}

Write-Host ("Total sub-pages scanned: " + $pages.Count)

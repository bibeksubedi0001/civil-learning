# Injects SEO/OG/theme-color meta tags into each chapter*/index.html
$titles = @{
    'chapter1' = @{ title='AI vs Machine Learning'; desc='Understand the difference between traditional programming and machine learning. AI taxonomy, types of learning, and where civil engineering intersects with intelligent systems.' }
    'chapter2' = @{ title='Supervised Learning'; desc='Learn from labeled examples and predict outcomes. Regression, classification, overfitting, the bias-variance tradeoff, and site response analysis case studies.' }
    'chapter3' = @{ title='Unsupervised Learning'; desc='Discover hidden structure in raw data without labels. K-Means, DBSCAN, PCA, anomaly detection, and GIS clustering for civil engineering.' }
    'chapter4' = @{ title='Convolutional Neural Networks'; desc='Hierarchical visual processing for civil engineering. Kernels, feature maps, pooling, ResNet/VGG, and crack detection case studies.' }
    'chapter5' = @{ title='Large Language Models'; desc='Context windows, attention, the Transformer architecture, prompting, and RAG - applied to civil engineering workflows.' }
    'chapter6' = @{ title='Neural Networks & Deep Learning'; desc='Perceptrons, MLPs, activations, loss, gradient descent, backpropagation, regularization, and a concrete-strength prediction case study.' }
}

foreach ($k in $titles.Keys) {
    $file = Join-Path $PSScriptRoot "..\$k\index.html"
    $file = (Resolve-Path $file -ErrorAction SilentlyContinue).Path
    if (-not $file -or -not (Test-Path $file)) { Write-Host "MISS: $k"; continue }
    $content = Get-Content $file -Raw
    if ($content -match 'og:image') { Write-Host "Already enhanced: $k"; continue }

    $t = $titles[$k].title
    $d = $titles[$k].desc
    $num = $k -replace 'chapter',''

    $sb = [System.Text.StringBuilder]::new()
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine("    <meta name=`"description`" content=`"$d`">")
    [void]$sb.AppendLine("    <link rel=`"canonical`" href=`"https://civil-learning.bibeksubedi0001.com.np/$k/`">")
    [void]$sb.AppendLine('    <meta name="theme-color" content="#0a0a0f" media="(prefers-color-scheme: dark)">')
    [void]$sb.AppendLine('    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">')
    [void]$sb.AppendLine('    <link rel="manifest" href="/manifest.webmanifest">')
    [void]$sb.AppendLine('    <!-- Open Graph -->')
    [void]$sb.AppendLine('    <meta property="og:type" content="article">')
    [void]$sb.AppendLine("    <meta property=`"og:title`" content=`"Chapter ${num}: $t`">")
    [void]$sb.AppendLine("    <meta property=`"og:description`" content=`"$d`">")
    [void]$sb.AppendLine("    <meta property=`"og:url`" content=`"https://civil-learning.bibeksubedi0001.com.np/$k/`">")
    [void]$sb.AppendLine('    <meta property="og:site_name" content="Civil Engineer''s Guide to AI">')
    [void]$sb.AppendLine('    <meta property="og:image" content="https://civil-learning.bibeksubedi0001.com.np/assets/og-image.png">')
    [void]$sb.AppendLine('    <meta name="twitter:card" content="summary_large_image">')
    [void]$sb.AppendLine("    <meta name=`"twitter:title`" content=`"Chapter ${num}: $t`">")
    [void]$sb.AppendLine("    <meta name=`"twitter:description`" content=`"$d`">")
    [void]$sb.AppendLine('    <meta name="twitter:image" content="https://civil-learning.bibeksubedi0001.com.np/assets/og-image.png">')
    [void]$sb.Append('    <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>')

    $insert = $sb.ToString()
    $new = $content -replace '(</title>)', "`$1$insert"
    Set-Content -Path $file -Value $new -Encoding UTF8 -NoNewline
    Write-Host "Enhanced: $k"
}

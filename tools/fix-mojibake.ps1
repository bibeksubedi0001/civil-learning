# Repairs visible mojibake in HTML files. The files already store mojibake as
# valid UTF-8 text (e.g. U+00C3 followed by U+2014 instead of U+00D7), so we
# simply do plain string replacements on the decoded text, then write back as
# UTF-8 without a BOM.

param(
    [string]$Pattern = 'chapter*.html'
)

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

# Each entry: literal mojibake string -> correct character.
$rep = @(
    @{ from = ([string][char]0x00C3 + [string][char]0x2014);                               to = [string][char]0x00D7 } # x
    @{ from = ([string][char]0x00E2 + [string][char]0x2020 + [string][char]0x2019);        to = [string][char]0x2192 } # right arrow
    @{ from = ([string][char]0x00E2 + [string][char]0x2020 + [string][char]0x2018);        to = [string][char]0x2190 } # left arrow
    @{ from = ([string][char]0x00E2 + [string][char]0x20AC + [string][char]0x2122);        to = [string][char]0x2019 } # right single quote
    @{ from = ([string][char]0x00E2 + [string][char]0x20AC + [string][char]0x02DC);        to = [string][char]0x2018 } # left single quote
    @{ from = ([string][char]0x00E2 + [string][char]0x20AC + [string][char]0x0153);        to = [string][char]0x201C } # left double quote
    @{ from = ([string][char]0x00E2 + [string][char]0x20AC + [string][char]0x201D);        to = [string][char]0x2014 } # em dash
    @{ from = ([string][char]0x00E2 + [string][char]0x20AC + [string][char]0x201C);        to = [string][char]0x2013 } # en dash
    @{ from = ([string][char]0x00E2 + [string][char]0x20AC + [string][char]0x00A6);        to = [string][char]0x2026 } # ellipsis
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$pages = Get-ChildItem -Path $root -Filter $Pattern -File -Recurse |
    Where-Object { $_.FullName -notmatch '\\tools\\' -and $_.FullName -notmatch '\.bak$' }

$fixed = 0
foreach ($p in $pages) {
    $bytes = [System.IO.File]::ReadAllBytes($p.FullName)
    $hadBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
    $text = [System.Text.Encoding]::UTF8.GetString($bytes).TrimStart([char]0xFEFF)

    $orig = $text
    foreach ($entry in $rep) {
        $text = $text.Replace($entry.from, $entry.to)
    }
    # Generic: drop spurious U+00C2 ("Â") before any Latin-1 supplement char.
    # This handles patterns like "Â²", "Â°", "Â±", "Â¼", "Â½", "Â¾", "Â§", "Â©" etc.
    $text = [regex]::Replace($text, "\u00C2([\u0080-\u00BF])", '$1')

    if ($text -ne $orig -or $hadBom) {
        [System.IO.File]::WriteAllText($p.FullName, $text, $utf8NoBom)
        $tag = if ($text -ne $orig -and $hadBom) { 'mojibake+BOM' } elseif ($text -ne $orig) { 'mojibake' } else { 'BOM' }
        $rel = $p.FullName.Substring($root.Length).TrimStart('\')
        Write-Host "Fixed [$tag]: $rel"
        $fixed++
    }
}

Write-Host ""
Write-Host "Files repaired: $fixed"

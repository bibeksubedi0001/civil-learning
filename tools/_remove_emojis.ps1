# Remove all emoji characters from HTML and JS files
$emojiRegex = '[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0E}-\u{FE0F}\u{200D}\u{25B6}\u{25C0}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{23E9}-\u{23FA}\u{231A}\u{231B}\u{2934}\u{2935}\u{203C}\u{2049}\u{2122}\u{2139}\u{2194}-\u{21AA}]+'
$files = Get-ChildItem "D:\AIML" -Include "*.html","*.js" -Recurse
$totalFiles = 0
$totalMatches = 0
foreach ($f in $files) {
    $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $m = [regex]::Matches($c, $emojiRegex)
    if ($m.Count -gt 0) {
        $totalFiles++
        $totalMatches += $m.Count
        # Remove emojis and clean up extra spaces
        $newContent = [regex]::Replace($c, $emojiRegex, '')
        # Clean up double spaces left behind
        $newContent = [regex]::Replace($newContent, '  +', ' ')
        # Clean up empty tags like <span class="gradient-text"> </span>
        $newContent = [regex]::Replace($newContent, '<span class="gradient-text">\s*</span>', '')
        # Clean up empty analogy-icon divs
        $newContent = [regex]::Replace($newContent, '<div class="analogy-icon">\s*</div>', '')
        [System.IO.File]::WriteAllText($f.FullName, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "$($f.Name): removed $($m.Count) emoji(s)"
    }
}
Write-Host "`nDone: Removed $totalMatches emojis from $totalFiles files"

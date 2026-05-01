$files = 'chapter1\sub1.html','chapter1\sub2.html','chapter1\index.html','chapter2\sub1.html','chapter3\sub1.html','chapter4\sub1.html','chapter5\sub1.html','chapter5\sub5.html','chapter5\sub10.html'
$set = @{}
$styleInfo = @()
foreach ($f in $files) {
    $t = Get-Content $f -Raw
    foreach ($m in [regex]::Matches($t,'class="([^"]+)"')) {
        foreach ($n in ($m.Groups[1].Value -split '\s+')) {
            if ($n) { $set[$n] = 1 }
        }
    }
    $sc = ([regex]::Matches($t,'<style[^>]*>')).Count
    $styleInfo += "$f : style blocks = $sc"
}
"=== STYLE BLOCKS ==="
$styleInfo
""
"=== UNIQUE CLASSES ==="
$set.Keys | Sort-Object

Add-Type -AssemblyName System.Drawing
$file = 'C:\Users\HomePC\.gemini\antigravity\brain\3a3c0da7-e871-406f-a5bc-09f170edf09e\.user_uploaded\media_1793618398738_330492d8.png'
$img = [System.Drawing.Bitmap]::FromFile($file)
$h = $img.Height
$w = $img.Width
$p1 = $img.GetPixel(100, [int]($h * 0.75))
$p2 = $img.GetPixel([int]($w - 100), [int]($h * 0.75))
$p3 = $img.GetPixel([int]($w * 0.5), [int]($h * 0.85))
$img.Dispose()
Write-Output ("Image size: ${w}x${h}")
Write-Output ("Left Green: R=$($p1.R) G=$($p1.G) B=$($p1.B) Hex=#$($p1.R.ToString('X2'))$($p1.G.ToString('X2'))$($p1.B.ToString('X2'))")
Write-Output ("Right Green: R=$($p2.R) G=$($p2.G) B=$($p2.B) Hex=#$($p2.R.ToString('X2'))$($p2.G.ToString('X2'))$($p2.B.ToString('X2'))")
Write-Output ("Center Desk: R=$($p3.R) G=$($p3.G) B=$($p3.B) Hex=#$($p3.R.ToString('X2'))$($p3.G.ToString('X2'))$($p3.B.ToString('X2'))")

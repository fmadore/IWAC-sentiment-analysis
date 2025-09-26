# PowerShell script to generate PWA icons from favicon.png
# Requires ImageMagick to be installed: https://imagemagick.org/script/download.php#windows

param(
    [string]$SourceImage = "../favicon.png"
)

$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

Write-Host "Generating PWA icons from $SourceImage..."

# Check if ImageMagick is available
try {
    magick -version | Out-Null
    $hasImageMagick = $true
} catch {
    $hasImageMagick = $false
}

if (-not $hasImageMagick) {
    Write-Warning "ImageMagick not found. Please install ImageMagick or use an online tool to generate icons."
    Write-Host "Install ImageMagick from: https://imagemagick.org/script/download.php#windows"
    Write-Host "Or use online tools like:"
    Write-Host "- https://www.pwabuilder.com/imageGenerator"
    Write-Host "- https://realfavicongenerator.net/"
    exit 1
}

foreach ($size in $sizes) {
    $outputFile = "icon-${size}x${size}.png"
    Write-Host "Generating $outputFile..."
    
    try {
        magick $SourceImage -resize "${size}x${size}" $outputFile
        Write-Host "✓ Created $outputFile"
    } catch {
        Write-Error "Failed to create $outputFile: $_"
    }
}

Write-Host "✓ Icon generation complete!"
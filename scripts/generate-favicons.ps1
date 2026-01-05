#!/usr/bin/env pwsh

Write-Host "🎨 Generating favicons from logo..." -ForegroundColor Cyan

# Check if ImageMagick is installed
if (!(Get-Command "magick" -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  ImageMagick not found. Attempting to install..." -ForegroundColor Yellow
    
    # Check if Chocolatey is installed
    $chocoCmd = Get-Command choco -ErrorAction SilentlyContinue
    
    if ($chocoCmd) {
        Write-Host "📦 Installing ImageMagick via Chocolatey..." -ForegroundColor Cyan
        choco install imagemagick -y
    } else {
        # Check if winget is available
        $wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
        
        if ($wingetCmd) {
            Write-Host "📦 Installing ImageMagick via winget..." -ForegroundColor Cyan
            winget install --id ImageMagick.ImageMagick -e --silent
        } else {
            Write-Host "❌ No package manager found. Please install ImageMagick manually:" -ForegroundColor Red
            Write-Host "   Download from: https://imagemagick.org/script/download.php#windows"
            Write-Host "   Or install Chocolatey: https://chocolatey.org/install"
            exit 1
        }
    }
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Verify installation
    if (!(Get-Command "magick" -ErrorAction SilentlyContinue)) {
        Write-Host "❌ ImageMagick installation failed. You may need to restart your terminal." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ ImageMagick installed successfully" -ForegroundColor Green
}

$sourceImage = "client\public\favicon.png"
$outputDir = "client\public"

if (!(Test-Path $sourceImage)) {
    Write-Host "❌ Source image not found: $sourceImage" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Generating favicon sizes..." -ForegroundColor Green

# Generate various sizes
$sizes = @(16, 32, 48, 192, 180)

foreach ($size in $sizes) {
    if ($size -eq 180) {
        $output = Join-Path $outputDir "apple-touch-icon.png"
        Write-Host "  Creating $size x $size -> apple-touch-icon.png"
    } else {
        $output = Join-Path $outputDir "favicon-$size`x$size.png"
        Write-Host "  Creating $size x $size -> favicon-$size`x$size.png"
    }
    
    magick convert "$sourceImage" -resize "$size`x$size" -background transparent -gravity center -extent "$size`x$size" "$output"
}

# Generate .ico file (multi-resolution)
Write-Host "  Creating favicon.ico (16, 32, 48)"
$icoOutput = Join-Path $outputDir "favicon.ico"
& magick convert "$sourceImage" -resize 16x16 -background transparent -gravity center -extent 16x16 "$sourceImage" -resize 32x32 -background transparent -gravity center -extent 32x32 "$sourceImage" -resize 48x48 -background transparent -gravity center -extent 48x48 "$icoOutput"

Write-Host ""
Write-Host "✅ Favicons generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Generated files:" -ForegroundColor Cyan
Write-Host "   favicon-16x16.png"
Write-Host "   favicon-32x32.png"
Write-Host "   favicon-48x48.png"
Write-Host "   favicon-192x192.png"
Write-Host "   apple-touch-icon.png"
Write-Host "   favicon.ico"
Write-Host ""
Write-Host "🔄 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Commit the generated favicons"
Write-Host "   2. Deploy to production"
Write-Host "   3. Request re-crawl in Google Search Console"
Write-Host "   4. Clear cache: https://search.google.com/search-console"

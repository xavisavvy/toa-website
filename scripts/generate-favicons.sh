#!/bin/bash

echo "🎨 Generating favicons from logo..."

# Check if ImageMagick is installed
MAGICK_CMD=""
if command -v magick &> /dev/null; then
    MAGICK_CMD="magick"
elif command -v convert &> /dev/null; then
    MAGICK_CMD="convert"
else
    echo "⚠️  ImageMagick not found. Attempting to install..."
    
    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "📦 Installing ImageMagick via Homebrew..."
            brew install imagemagick
        else
            echo "❌ Homebrew not found. Please install Homebrew first:"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            echo "📦 Installing ImageMagick via apt-get..."
            sudo apt-get update && sudo apt-get install -y imagemagick
        elif command -v yum &> /dev/null; then
            echo "📦 Installing ImageMagick via yum..."
            sudo yum install -y ImageMagick
        else
            echo "❌ Package manager not found. Please install ImageMagick manually."
            exit 1
        fi
    else
        echo "❌ Unsupported OS. Please install ImageMagick manually:"
        echo "   macOS: brew install imagemagick"
        echo "   Linux: sudo apt-get install imagemagick"
        exit 1
    fi
    
    # Verify installation
    if command -v magick &> /dev/null; then
        MAGICK_CMD="magick"
    elif command -v convert &> /dev/null; then
        MAGICK_CMD="convert"
    else
        echo "❌ ImageMagick installation failed"
        exit 1
    fi
    
    echo "✅ ImageMagick installed successfully"
fi

SOURCE_IMAGE="client/public/favicon.png"
OUTPUT_DIR="client/public"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "❌ Source image not found: $SOURCE_IMAGE"
    exit 1
fi

echo "📦 Generating favicon sizes..."

# Generate various sizes
SIZES=(16 32 48 192 180)

for size in "${SIZES[@]}"; do
    if [ "$size" -eq 180 ]; then
        output="$OUTPUT_DIR/apple-touch-icon.png"
        echo "  Creating ${size}x${size} -> apple-touch-icon.png"
    else
        output="$OUTPUT_DIR/favicon-${size}x${size}.png"
        echo "  Creating ${size}x${size} -> favicon-${size}x${size}.png"
    fi
    
    $MAGICK_CMD "$SOURCE_IMAGE" -resize "${size}x${size}" -background transparent -gravity center -extent "${size}x${size}" "$output"
done

# Generate .ico file (multi-resolution)
echo "  Creating favicon.ico (16, 32, 48)"
$MAGICK_CMD "$SOURCE_IMAGE" -resize 16x16 -background transparent -gravity center -extent 16x16 \
    \( "$SOURCE_IMAGE" -resize 32x32 -background transparent -gravity center -extent 32x32 \) \
    \( "$SOURCE_IMAGE" -resize 48x48 -background transparent -gravity center -extent 48x48 \) \
    "$OUTPUT_DIR/favicon.ico"

echo ""
echo "✅ Favicons generated successfully!"
echo ""
echo "📋 Generated files:"
echo "   favicon-16x16.png"
echo "   favicon-32x32.png"
echo "   favicon-48x48.png"
echo "   favicon-192x192.png"
echo "   apple-touch-icon.png"
echo "   favicon.ico"
echo ""
echo "🔄 Next steps:"
echo "   1. Commit the generated favicons"
echo "   2. Deploy to production"
echo "   3. Request re-crawl in Google Search Console"
echo "   4. Clear cache: https://search.google.com/search-console"

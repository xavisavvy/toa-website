#!/bin/bash

set -e

# Parse arguments
TARGET=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --target)
            TARGET="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [[ ! "$TARGET" =~ ^(blue|green)$ ]]; then
    echo "Error: --target must be 'blue' or 'green'"
    echo "Usage: $0 --target <blue|green>"
    exit 1
fi

echo "🔄 Switching production traffic to: $TARGET"
echo ""

# Get current version
CURRENT_VERSION=$(kubectl get service toa-website -n toa-production -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "none")

if [ "$CURRENT_VERSION" = "$TARGET" ]; then
    echo "ℹ️  Traffic is already pointing to $TARGET"
    exit 0
fi

echo "📊 Current version: $CURRENT_VERSION"
echo "📊 Target version: $TARGET"
echo ""

# Confirm switch
read -p "Are you sure you want to switch production traffic? (yes/no): " confirmation
if [ "$confirmation" != "yes" ]; then
    echo "❌ Cancelled"
    exit 1
fi

# Patch the service selector
echo "🔧 Updating service selector..."
if ! kubectl patch service toa-website -n toa-production -p "{\"spec\":{\"selector\":{\"version\":\"$TARGET\"}}}"; then
    echo "❌ Failed to switch traffic!"
    exit 1
fi

echo "✅ Traffic switched to $TARGET!"
echo ""

# Verify
NEW_VERSION=$(kubectl get service toa-website -n toa-production -o jsonpath='{.spec.selector.version}')
echo "📊 Verified: Traffic is now on $NEW_VERSION"
echo ""

echo "🎯 Next steps:"
echo "   1. Monitor application metrics and logs"
echo "   2. If issues occur, switch back:"
echo "      ./.kubernetes/production/switch-traffic.sh --target $CURRENT_VERSION"
echo "   3. When stable, scale down old version:"
echo "      kubectl scale deployment/toa-website-$CURRENT_VERSION --replicas=0 -n toa-production"

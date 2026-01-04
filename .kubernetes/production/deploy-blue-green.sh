#!/bin/bash

set -e

# Parse arguments
TARGET=""
IMAGE_TAG="latest"

while [[ $# -gt 0 ]]; do
    case $1 in
        --target)
            TARGET="$2"
            shift 2
            ;;
        --image-tag)
            IMAGE_TAG="$2"
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
    echo "Usage: $0 --target <blue|green> [--image-tag <tag>]"
    exit 1
fi

echo "🚀 Blue-Green Deployment to Production"
echo "   Target: $TARGET"
echo "   Image: toa-website:$IMAGE_TAG"
echo ""

# Get current active version
CURRENT_SERVICE=$(kubectl get service toa-website -n toa-production -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "none")
echo "📊 Current active version: $CURRENT_SERVICE"

# Update image tag in deployment
echo "🔧 Updating $TARGET deployment with image tag: $IMAGE_TAG"
kubectl set image deployment/toa-website-$TARGET toa-website=toa-website:$IMAGE_TAG -n toa-production

# Wait for rollout
echo "⏳ Waiting for $TARGET deployment to be ready..."
if ! kubectl rollout status deployment/toa-website-$TARGET -n toa-production --timeout=5m; then
    echo "❌ Deployment failed! Rolling back..."
    kubectl rollout undo deployment/toa-website-$TARGET -n toa-production
    exit 1
fi

echo "✅ $TARGET deployment is ready!"
echo ""

# Run health checks
echo "🏥 Running health checks on $TARGET..."
BLUE_GREEN_POD=$(kubectl get pod -n toa-production -l "app=toa-website,version=$TARGET" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -n "$BLUE_GREEN_POD" ]; then
    if kubectl exec -n toa-production $BLUE_GREEN_POD -- wget -q -O- http://localhost:5000/api/alive >/dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed!"
        exit 1
    fi
else
    echo "⚠️  Could not find pod for health check"
fi

echo ""
echo "🔄 Ready to switch traffic to $TARGET"
echo ""
echo "To complete the deployment, run:"
echo "   ./.kubernetes/production/switch-traffic.sh --target $TARGET"
echo ""
echo "Or to rollback:"
echo "   kubectl rollout undo deployment/toa-website-$TARGET -n toa-production"

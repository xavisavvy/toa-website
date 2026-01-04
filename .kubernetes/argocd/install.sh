#!/bin/bash
# ArgoCD Installation Script for Mac/Linux
# Installs and configures ArgoCD for local Kubernetes development

set -e

echo "🚀 Installing ArgoCD..."

# Create ArgoCD namespace
echo ""
echo "📦 Creating ArgoCD namespace..."
if kubectl create namespace argocd 2>/dev/null; then
    echo "   ✓ Namespace created"
else
    echo "   ✓ Namespace already exists"
fi

# Install ArgoCD
echo ""
echo "📥 Installing ArgoCD components..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
echo "   ✓ ArgoCD installed"

# Wait for ArgoCD to be ready
echo ""
echo "⏳ Waiting for ArgoCD to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s
echo "   ✓ ArgoCD is ready"

# Get initial admin password
echo ""
echo "🔑 Retrieving admin password..."
PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

# Start port forwarding in background
echo ""
echo "🌐 Starting port forwarding..."
kubectl port-forward svc/argocd-server -n argocd 8080:443 > /dev/null 2>&1 &
PORT_FORWARD_PID=$!
sleep 3
echo "   ✓ Port forwarding started (PID: $PORT_FORWARD_PID)"

# Display access information
echo ""
echo "✅ ArgoCD Installation Complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 ArgoCD Access Information"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 UI URL:      https://localhost:8080"
echo "👤 Username:    admin"
echo "🔐 Password:    $PASSWORD"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo "   1. Open https://localhost:8080 in your browser"
echo "   2. Login with credentials above"
echo "   3. Deploy ToA app:"
echo "      kubectl apply -f .kubernetes/argocd/application.yaml"
echo ""
echo "   Or manually via UI/CLI (see README.md)"
echo ""
echo "⚠️  Note: Port forwarding is running in background"
echo "   Stop with: kill $PORT_FORWARD_PID"
echo ""

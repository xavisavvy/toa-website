#!/bin/bash
# Teardown Kubernetes Local Environment
# Usage: ./.kubernetes/local/teardown.sh

echo "🧹 Tearing down Kubernetes environment..."

# Delete all resources in namespace
echo ""
echo "📦 Deleting all resources in toa-local namespace..."
kubectl delete all --all -n toa-local 2>/dev/null

# Delete ConfigMaps and Secrets
echo "🔧 Deleting ConfigMaps and Secrets..."
kubectl delete configmap --all -n toa-local 2>/dev/null
kubectl delete secret --all -n toa-local 2>/dev/null

# Delete PersistentVolumeClaims (this will delete data!)
echo "💾 Deleting PersistentVolumeClaims (data will be lost)..."
kubectl delete pvc --all -n toa-local 2>/dev/null

# Delete namespace
echo "🗑️  Deleting namespace..."
kubectl delete namespace toa-local 2>/dev/null

echo ""
echo "✅ Teardown complete!"
echo "ℹ️  Run setup.sh to recreate the environment"

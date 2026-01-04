#!/bin/bash
# Start Tales of Aneria Kubernetes environment
# Use this for daily development after initial setup

echo "🚀 Starting Tales of Aneria Kubernetes environment..."

# Apply namespace first
kubectl apply -f .kubernetes/local/namespace.yaml

# Wait a moment for namespace to be fully ready
sleep 2

# Apply remaining resources
kubectl apply -f .kubernetes/local/postgres-deployment.yaml
kubectl apply -f .kubernetes/local/redis-deployment.yaml
kubectl apply -f .kubernetes/local/app-config.yaml
kubectl apply -f .kubernetes/local/app-deployment.yaml

echo ""
echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n toa-local --timeout=60s
kubectl wait --for=condition=ready pod -l app=redis -n toa-local --timeout=60s
kubectl wait --for=condition=ready pod -l app=toa-website -n toa-local --timeout=120s

echo ""
echo "✅ Environment started successfully!"
echo ""
echo "🌐 Access the application:"
echo "   NodePort: http://localhost:30000"
echo "   Port Forward: kubectl port-forward -n toa-local svc/toa-website 5000:80"
echo ""
echo "📝 View logs:"
echo "   kubectl logs -n toa-local -l app=toa-website -f"

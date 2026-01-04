#!/bin/bash
# Start Tales of Aneria Kubernetes environment
# Use this for daily development after initial setup

echo "🚀 Starting Tales of Aneria Kubernetes environment..."

# Check if namespace exists
if kubectl get namespace toa-local &> /dev/null; then
    echo "   Namespace exists, scaling up deployments..."
    # Scale deployments back up
    kubectl scale deployment postgres -n toa-local --replicas=1
    kubectl scale deployment redis -n toa-local --replicas=1
    kubectl scale deployment toa-website -n toa-local --replicas=1
else
    echo "   Creating new environment..."
    # Apply namespace first
    kubectl apply -f .kubernetes/local/namespace.yaml
    
    # Wait for namespace to be ready
    sleep 3
    
    # Apply infrastructure
    kubectl apply -f .kubernetes/local/postgres.yaml
    kubectl apply -f .kubernetes/local/redis.yaml
    
    # Wait a moment before app deployment
    sleep 2
    
    kubectl apply -f .kubernetes/local/app-config.yaml
    
    # Prepare app deployment with volume mounts
    CURRENT_PATH=$(pwd)
    cat .kubernetes/local/app-deployment.yaml | sed "s|\${PWD}|${CURRENT_PATH}|g" | kubectl apply -f -
fi

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

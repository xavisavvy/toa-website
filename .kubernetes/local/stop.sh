#!/bin/bash
# Stop Tales of Aneria Kubernetes environment
# This preserves data in PersistentVolumes by scaling down instead of deleting

echo "🛑 Stopping Tales of Aneria Kubernetes environment..."
echo "   (Data will be preserved)"

# Scale down deployments to 0 replicas instead of deleting namespace
kubectl scale deployment -n toa-local --all --replicas=0

echo ""
echo "✅ Environment stopped"
echo "   All pods stopped, data preserved in PersistentVolumes"
echo ""
echo "   To start again: ./start.sh"
echo "   For fresh start: ./teardown.sh then ./setup.sh"

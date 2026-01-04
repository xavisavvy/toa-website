#!/bin/bash
# Stop Tales of Aneria Kubernetes environment
# This preserves data in PersistentVolumes

echo "🛑 Stopping Tales of Aneria Kubernetes environment..."
echo "   (Data will be preserved)"

kubectl delete namespace toa-local

echo ""
echo "✅ Environment stopped"
echo "   Data is preserved in PersistentVolumes"
echo ""
echo "   To start again: ./start.sh"
echo "   For fresh start: ./teardown.sh then ./setup.sh"

#!/bin/bash

set -e

echo "🌱 Seeding Kubernetes database..."
echo ""

# Apply the seed job
echo "📦 Running seed job in Kubernetes..."
kubectl delete job toa-seed -n toa-local 2>/dev/null || true
kubectl apply -f .kubernetes/local/seed-job.yaml

echo ""
echo "⏳ Waiting for seed job to complete..."
if kubectl wait --for=condition=complete --timeout=60s job/toa-seed -n toa-local 2>/dev/null; then
    echo ""
    echo "📋 Seed job logs:"
    kubectl logs -n toa-local job/toa-seed
    echo ""
    echo "✅ Database seeding complete!"
else
    echo ""
    echo "⚠️  Seed job still running or failed. Check logs with:"
    echo "   kubectl logs -n toa-local job/toa-seed -f"
fi

echo ""
echo "📋 Test credentials:"
echo "   Admin Email: admin@talesofaneria.com"
echo "   Admin Password: (check ADMIN_PASSWORD in secrets)"
echo "   Admin Login: http://localhost:5000/admin/login"
echo "   Test Order: test-order-12345678"
echo "   Track Order: http://localhost:5000/track-order"
echo ""
echo "🧹 Cleanup: The seed job will auto-delete after 5 minutes"
echo ""

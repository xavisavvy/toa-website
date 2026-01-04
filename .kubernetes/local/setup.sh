#!/bin/bash
# Quick setup script for local Kubernetes development

echo "🚀 Setting up Tales of Aneria on local Kubernetes..."

# 1. Build the Docker image
echo "📦 Building Docker image..."
docker build -t toa-website:local -f Dockerfile.dev .

# 2. Deploy to Kubernetes
echo "☸️  Deploying to Kubernetes..."

# Create namespace first
kubectl apply -f .kubernetes/local/namespace.yaml

# Wait for namespace to be ready
echo "⏳ Waiting for namespace to be ready..."
sleep 3

# Apply database and cache
kubectl apply -f .kubernetes/local/postgres.yaml
kubectl apply -f .kubernetes/local/redis.yaml
kubectl apply -f .kubernetes/local/seed-job.yaml

# Wait another moment
sleep 2

# Apply app config
kubectl apply -f .kubernetes/local/app-config.yaml

# Prepare app deployment with volume mounts
CURRENT_PATH=$(pwd)
cat .kubernetes/local/app-deployment.yaml | sed "s|\${PWD}|${CURRENT_PATH}|g" | kubectl apply -f -

# 3. Wait for pods
echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n toa-local --timeout=60s
kubectl wait --for=condition=ready pod -l app=redis -n toa-local --timeout=60s

# 4. Push database schema
echo "🗄️  Pushing database schema..."
kubectl port-forward -n toa-local svc/postgres 5432:5432 &
PF_PID=$!
sleep 10

# Test database connection with retries
echo "🔍 Testing database connection..."
retries=0
maxRetries=5
while [ $retries -lt $maxRetries ]; do
    if DATABASE_URL="postgresql://postgres:devpassword123@localhost:5432/toa_dev" npm run db:push; then
        echo "✅ Database schema pushed successfully!"
        break
    else
        echo "⚠️  Database not ready, retrying... ($retries/$maxRetries)"
        retries=$((retries+1))
        sleep 5
    fi
done

if [ $retries -eq $maxRetries ]; then
    echo "❌ Failed to push database schema after $maxRetries attempts"
    kill $PF_PID
    exit 1
fi

kill $PF_PID

# 5. Create admin user
echo "👤 Creating admin user..."
kubectl port-forward -n toa-local svc/postgres 5432:5432 &
PF_PID=$!
sleep 10

# Check if admin already exists, if not create it
echo "🔍 Checking for existing admin user..."
if DATABASE_URL="postgresql://postgres:devpassword123@localhost:5432/toa_dev" npx tsx scripts/create-admin-direct.ts; then
    echo "✅ Admin user ready!"
else
    echo "⚠️  Admin user creation failed (may already exist)"
fi

kill $PF_PID

# 6. Wait for app to be ready
echo "⏳ Waiting for application to be ready..."
if kubectl wait --for=condition=ready pod -l app=toa-website -n toa-local --timeout=120s 2>/dev/null; then
    echo "✅ Application is ready!"
else
    echo "⚠️  Application pod not ready yet, checking status..."
    kubectl get pods -n toa-local -l app=toa-website
fi

# 7. Run database seeding
echo ""
echo "🌱 Seeding database..."
echo ""
bash "$(dirname "$0")/seed.sh"

# 8. Show status
echo ""
echo "✅ Setup complete!"
echo ""
echo "📊 Status:"
kubectl get all -n toa-local
echo ""
echo "🌐 Access the application at:"
echo "   http://localhost:30000"
echo ""
echo "Or use port forwarding:"
echo "   kubectl port-forward -n toa-local svc/toa-website 5000:80"
echo "   http://localhost:5000"
echo ""
echo "📝 View logs:"
echo "   kubectl logs -n toa-local -l app=toa-website -f"

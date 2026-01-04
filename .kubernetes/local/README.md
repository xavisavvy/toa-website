# Local Kubernetes Development with Rancher Desktop

This setup runs the entire Tales of Aneria stack on your local Kubernetes cluster.

## 🚀 Quick Start

### 1. Build Docker Image
```bash
# Build for local Kubernetes (Rancher Desktop uses containerd)
docker build -t toa-website:local -f Dockerfile.dev .
```

### 2. Deploy to Kubernetes
```bash
# Create namespace and deploy everything
kubectl apply -f .kubernetes/local/

# Or step by step:
kubectl apply -f .kubernetes/local/namespace.yaml
kubectl apply -f .kubernetes/local/postgres.yaml
kubectl apply -f .kubernetes/local/redis.yaml
kubectl apply -f .kubernetes/local/app-config.yaml
kubectl apply -f .kubernetes/local/app-deployment.yaml
```

### 3. Wait for Pods to be Ready
```bash
# Watch pods starting up
kubectl get pods -n toa-local -w

# Check all services
kubectl get all -n toa-local
```

### 4. Push Database Schema
```bash
# Port forward to PostgreSQL
kubectl port-forward -n toa-local svc/postgres 5432:5432

# In another terminal, update DATABASE_URL and push
DATABASE_URL="postgresql://postgres:devpassword123@localhost:5432/toa_dev" npm run db:push
```

### 5. Create Admin User
```bash
# With postgres port-forwarded
DATABASE_URL="postgresql://postgres:devpassword123@localhost:5432/toa_dev" npx tsx scripts/create-admin-direct.ts
```

### 6. Access Application
```bash
# Option A: NodePort (already exposed at port 30000)
http://localhost:30000

# Option B: Port Forward (recommended for consistent port)
kubectl port-forward -n toa-local svc/toa-website 5000:80
# Then access: http://localhost:5000
```

## 📊 Useful Commands

### View Logs
```bash
# Application logs
kubectl logs -n toa-local -l app=toa-website -f

# PostgreSQL logs
kubectl logs -n toa-local -l app=postgres -f

# Redis logs
kubectl logs -n toa-local -l app=redis -f
```

### Execute Commands in Pods
```bash
# Shell into app
kubectl exec -n toa-local -it deployment/toa-website -- sh

# Check PostgreSQL
kubectl exec -n toa-local -it deployment/postgres -- psql -U postgres -d toa_dev
```

### Update Configuration
```bash
# Edit secrets
kubectl edit secret -n toa-local toa-secrets

# Edit config
kubectl edit configmap -n toa-local toa-config

# Restart app to pick up changes
kubectl rollout restart -n toa-local deployment/toa-website
```

### Rebuild and Redeploy
```bash
# 1. Rebuild image
docker build -t toa-website:local -f Dockerfile.dev .

# 2. Restart deployment (forces new image pull)
kubectl rollout restart -n toa-local deployment/toa-website

# 3. Watch rollout
kubectl rollout status -n toa-local deployment/toa-website
```

### Clean Up
```bash
# Delete everything in namespace
kubectl delete namespace toa-local

# Or delete specific resources
kubectl delete -f .kubernetes/local/
```

## 🔧 Troubleshooting

### Pods Not Starting
```bash
# Describe pod to see events
kubectl describe pod -n toa-local <pod-name>

# Check logs
kubectl logs -n toa-local <pod-name>
```

### Image Not Found
Ensure you built the image with Rancher Desktop's Docker:
```bash
# Check images
docker images | grep toa-website

# Rebuild if needed
docker build -t toa-website:local -f Dockerfile.dev .
```

### Database Connection Issues
```bash
# Check postgres is running
kubectl get pods -n toa-local -l app=postgres

# Test connection
kubectl run -n toa-local psql-test --rm -it --image=postgres:15-alpine -- psql postgresql://postgres:devpassword123@postgres:5432/toa_dev
```

### Resource Issues
If pods are pending or evicted:
```bash
# Check node resources
kubectl top nodes
kubectl top pods -n toa-local

# Reduce resource requests in deployments if needed
```

## 🆚 vs Docker Compose

**Advantages of Kubernetes:**
- ✅ Production parity
- ✅ Auto-restart on failure
- ✅ Health checks
- ✅ Resource limits
- ✅ Service discovery
- ✅ Rolling updates

**When to use Docker Compose:**
- Simpler local dev
- Faster startup
- Easier volume mounting for live reload

**Recommendation:** Use Kubernetes for testing prod-like deployments, Docker Compose for rapid iteration.

## 🔐 Security Notes

⚠️ **This is for LOCAL DEVELOPMENT ONLY**
- Uses weak passwords
- No TLS
- Permissive network policies
- NodePort exposure

**Never use these configs in production!**

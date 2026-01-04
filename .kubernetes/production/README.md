# Production Kubernetes - Blue-Green Deployment

This directory contains Kubernetes manifests and scripts for production deployments using a blue-green deployment strategy.

## 🎯 Blue-Green Deployment Strategy

Blue-green deployment allows zero-downtime deployments by maintaining two identical production environments (blue and green). Traffic is routed to one environment while the other is updated, then switched atomically.

### Architecture

- **Blue Environment**: `toa-website-blue` deployment + service
- **Green Environment**: `toa-website-green` deployment + service
- **Production Service**: `toa-website` service routes traffic to active environment
- **Auto-scaling**: HPA configured for both environments (3-10 replicas)

## 📋 Prerequisites

- Kubernetes cluster (1.19+)
- kubectl configured for production cluster
- Metrics server installed (for HPA)
- Production secrets configured

## 🚀 Deployment Process

### 1. Initial Setup

Deploy both blue and green environments:

```bash
# Create namespace and configurations
kubectl apply -f namespace.yaml
kubectl apply -f app-config.yaml  # Create this with production values
kubectl apply -f app-secret.yaml  # Create this with production secrets

# Deploy both environments
kubectl apply -f app-deployment-blue.yaml
kubectl apply -f app-deployment-green.yaml
kubectl apply -f app-service.yaml
kubectl apply -f hpa.yaml

# Initial traffic goes to blue (default in app-service.yaml)
```

### 2. Deploy New Version

**Windows (PowerShell):**
```powershell
# Deploy to inactive environment (e.g., green)
.\.kubernetes\production\deploy-blue-green.ps1 -Target green -ImageTag v1.2.0
```

**Mac/Linux:**
```bash
# Deploy to inactive environment (e.g., green)
./.kubernetes/production/deploy-blue-green.sh --target green --image-tag v1.2.0
```

This script will:
- Update the target deployment with new image
- Wait for rollout to complete
- Run health checks
- Report status

### 3. Switch Traffic

After verifying the new deployment:

**Windows (PowerShell):**
```powershell
.\.kubernetes\production\switch-traffic.ps1 -Target green
```

**Mac/Linux:**
```bash
./.kubernetes/production/switch-traffic.sh --target green
```

This will:
- Show current and target versions
- Ask for confirmation
- Switch the production service selector
- Verify the switch

### 4. Rollback (if needed)

If issues are detected, immediately switch back:

**Windows (PowerShell):**
```powershell
.\.kubernetes\production\switch-traffic.ps1 -Target blue
```

**Mac/Linux:**
```bash
./.kubernetes/production/switch-traffic.sh --target blue
```

### 5. Clean Up Old Environment

Once new version is stable, scale down the old environment:

```bash
kubectl scale deployment/toa-website-blue --replicas=0 -n toa-production
```

## 🔍 Monitoring

### Check Active Version
```bash
kubectl get service toa-website -n toa-production -o jsonpath='{.spec.selector.version}'
```

### View Deployment Status
```bash
kubectl get deployments -n toa-production
kubectl get pods -n toa-production -l app=toa-website
```

### Check HPA Status
```bash
kubectl get hpa -n toa-production
```

### View Logs
```bash
# Blue environment
kubectl logs -n toa-production -l app=toa-website,version=blue -f

# Green environment
kubectl logs -n toa-production -l app=toa-website,version=green -f
```

## 📊 Auto-Scaling Configuration

Both blue and green deployments have identical HPA configurations:

- **Min Replicas**: 3
- **Max Replicas**: 10
- **CPU Target**: 70%
- **Memory Target**: 80%
- **Scale Up**: Aggressive (100% increase or +4 pods every 15s)
- **Scale Down**: Conservative (50% decrease over 60s, with 5min stabilization)

## 🔐 Security Notes

- Secrets are managed via Kubernetes secrets (not committed to repo)
- TLS termination should be handled by ingress/load balancer
- Network policies should restrict pod-to-pod communication
- RBAC should limit deployment permissions

## 🎯 Best Practices

1. **Always deploy to inactive environment first**
2. **Run comprehensive tests before switching traffic**
3. **Monitor metrics during and after traffic switch**
4. **Keep old environment running for quick rollback**
5. **Use semantic versioning for image tags**
6. **Document deployment changes**

## 📝 Example Workflow

```bash
# 1. Deploy new version to green (inactive)
./deploy-blue-green.sh --target green --image-tag v1.3.0

# 2. Run smoke tests against green service
kubectl port-forward -n toa-production svc/toa-website-green 8080:80
# Test http://localhost:8080

# 3. Switch traffic
./switch-traffic.sh --target green

# 4. Monitor for 30 minutes
kubectl get hpa -n toa-production -w

# 5. If stable, scale down blue
kubectl scale deployment/toa-website-blue --replicas=0 -n toa-production

# 6. Next deployment goes to blue
./deploy-blue-green.sh --target blue --image-tag v1.4.0
```

## 🆘 Troubleshooting

### Deployment Fails
```bash
# Check pod status
kubectl describe pod <pod-name> -n toa-production

# Check logs
kubectl logs <pod-name> -n toa-production

# Rollback deployment
kubectl rollout undo deployment/toa-website-<blue|green> -n toa-production
```

### Health Checks Failing
```bash
# Exec into pod
kubectl exec -it <pod-name> -n toa-production -- sh

# Test endpoints
wget -O- http://localhost:5000/api/alive
wget -O- http://localhost:5000/api/ready
```

### Traffic Not Switching
```bash
# Verify service selector
kubectl describe service toa-website -n toa-production

# Manually patch if needed
kubectl patch service toa-website -n toa-production -p '{"spec":{"selector":{"version":"green"}}}'
```

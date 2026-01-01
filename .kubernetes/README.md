# Kubernetes Deployment Guide

This directory contains production-ready Kubernetes manifests for Tales of Aneria.

## 📁 Files

- `deployment.yaml` - Main application deployment with 3 replicas
- `service.yaml` - ClusterIP service exposing the app
- `hpa.yaml` - Horizontal Pod Autoscaler (2-10 pods based on CPU/Memory)
- `configmap.yaml` - Non-sensitive configuration
- `secret.yaml.example` - Template for secrets (DO NOT COMMIT ACTUAL SECRETS)
- `pdb.yaml` - Pod Disruption Budget for high availability
- `networkpolicy.yaml` - Network security policies

## 🚀 Quick Deploy

### 1. Create Namespace (Optional)
```bash
kubectl create namespace toa-production
kubectl config set-context --current --namespace=toa-production
```

### 2. Create Secrets
```bash
# Create from environment variables
kubectl create secret generic toa-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=SESSION_SECRET="your-secret" \
  --from-literal=ALLOWED_ORIGINS="https://your-domain.com"
```

### 3. Deploy Application
```bash
# Apply all manifests
kubectl apply -f .kubernetes/

# Or apply individually
kubectl apply -f .kubernetes/configmap.yaml
kubectl apply -f .kubernetes/deployment.yaml
kubectl apply -f .kubernetes/service.yaml
kubectl apply -f .kubernetes/hpa.yaml
kubectl apply -f .kubernetes/pdb.yaml
kubectl apply -f .kubernetes/networkpolicy.yaml
```

### 4. Verify Deployment
```bash
# Check pods
kubectl get pods -l app=toa-website

# Check deployment status
kubectl rollout status deployment/toa-website

# Check health
kubectl get pods -l app=toa-website -o jsonpath='{.items[*].status.containerStatuses[*].ready}'
```

## 🔧 Configuration

### Environment Variables

**ConfigMap (Non-Sensitive):**
- `NODE_ENV` - Always "production"
- `PORT` - Container port (5000)
- `VITE_*` - Public frontend configuration

**Secrets (Sensitive):**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `ALLOWED_ORIGINS` - CORS allowed origins
- `YOUTUBE_API_KEY` - YouTube API key (optional)
- `ETSY_API_KEY` - Etsy API key (optional)

### Resource Limits

**Requests (Guaranteed):**
- CPU: 250m (0.25 cores)
- Memory: 256Mi

**Limits (Maximum):**
- CPU: 1000m (1 core)
- Memory: 512Mi

## 📊 Monitoring & Health Checks

### Health Endpoints

- `/api/startup` - Startup probe (60s timeout)
- `/api/alive` - Liveness probe (restart if failing)
- `/api/ready` - Readiness probe (remove from LB if failing)
- `/api/health` - Full health status (for monitoring)

### Prometheus Metrics

The deployment includes Prometheus annotations for automatic scraping:
```yaml
prometheus.io/scrape: "true"
prometheus.io/port: "5000"
prometheus.io/path: "/api/health"
```

## 🔄 Autoscaling

**Horizontal Pod Autoscaler (HPA):**
- Min Replicas: 2
- Max Replicas: 10
- CPU Target: 70%
- Memory Target: 80%
- Scale Up: Max 100% or 2 pods per minute
- Scale Down: Max 50% per minute (after 5min stabilization)

### Manual Scaling
```bash
# Scale to specific replicas
kubectl scale deployment toa-website --replicas=5

# Disable autoscaling temporarily
kubectl delete hpa toa-website
```

## 🔒 Security Features

### Pod Security
- ✅ Non-root user (UID 1001)
- ✅ Read-only root filesystem (where possible)
- ✅ Drop all capabilities
- ✅ No privilege escalation
- ✅ Seccomp profile enabled

### Network Security
- ✅ Network policies restrict traffic
- ✅ Only allow ingress from ingress controller
- ✅ Only allow egress to DNS, database, and external APIs

### Resource Security
- ✅ Resource limits prevent resource exhaustion
- ✅ Pod Disruption Budget ensures availability
- ✅ Anti-affinity spreads pods across nodes

## 🚦 Rollout Strategies

### Rolling Update (Default)
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1          # 1 extra pod during update
    maxUnavailable: 0     # No downtime
```

### Rollback
```bash
# View rollout history
kubectl rollout history deployment/toa-website

# Rollback to previous version
kubectl rollout undo deployment/toa-website

# Rollback to specific revision
kubectl rollout undo deployment/toa-website --to-revision=2
```

## 📋 Common Operations

### View Logs
```bash
# All pods
kubectl logs -l app=toa-website --tail=100 -f

# Specific pod
kubectl logs <pod-name> -f

# Previous crashed pod
kubectl logs <pod-name> --previous
```

### Execute Commands
```bash
# Shell into pod
kubectl exec -it <pod-name> -- sh

# Run one-off command
kubectl exec <pod-name> -- node --version
```

### Update Configuration
```bash
# Update ConfigMap
kubectl edit configmap toa-config

# Update Secret
kubectl delete secret toa-secrets
kubectl create secret generic toa-secrets --from-literal=...

# Restart deployment (to pick up changes)
kubectl rollout restart deployment/toa-website
```

### Debug Issues
```bash
# Describe pod (see events)
kubectl describe pod <pod-name>

# Check resource usage
kubectl top pods -l app=toa-website

# Port forward for local testing
kubectl port-forward deployment/toa-website 5000:5000
```

## 🌐 Ingress Setup

Create an Ingress resource for external access:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: toa-website
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - talesofaneria.com
    secretName: toa-tls
  rules:
  - host: talesofaneria.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: toa-website
            port:
              number: 80
```

## 📈 Production Checklist

Before deploying to production:

- [ ] Secrets created in Kubernetes
- [ ] ConfigMap values updated for production
- [ ] Resource limits tuned for workload
- [ ] Ingress configured with TLS
- [ ] Monitoring/alerting configured
- [ ] Backup strategy for database
- [ ] Rollback plan documented
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Health checks verified

## 🆘 Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

Common causes:
- Missing secrets
- Invalid image
- Resource limits too low
- Health check failures

### Pods Restarting
```bash
kubectl logs <pod-name> --previous
```

Common causes:
- Memory limit exceeded (OOMKilled)
- Failed liveness probe
- Application crash

### Service Not Accessible
```bash
kubectl get endpoints toa-website
```

Common causes:
- Pods not ready (check readiness probe)
- Network policy blocking traffic
- Ingress misconfigured

## 📚 Additional Resources

- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Production Checklist](https://kubernetes.io/docs/setup/best-practices/cluster-large/)
- [Security Hardening](https://kubernetes.io/docs/concepts/security/pod-security-standards/)

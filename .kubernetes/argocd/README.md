# ArgoCD Setup for Tales of Aneria

## Overview
ArgoCD provides GitOps continuous delivery for Kubernetes, automatically syncing your cluster state with Git repository definitions.

## Installation

### 1. Install ArgoCD in Kubernetes

```powershell
# Create ArgoCD namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s
```

### 2. Access ArgoCD UI

```powershell
# Port forward ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }
```

Access UI at: https://localhost:8080
- Username: `admin`
- Password: (from command above)

### 3. Install ArgoCD CLI (Optional)

**Windows (using Chocolatey):**
```powershell
choco install argocd-cli
```

**Or download directly:**
https://github.com/argoproj/argo-cd/releases/latest

### 4. Login via CLI

```powershell
# Port forward if not already running
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Login
argocd login localhost:8080 --username admin --insecure
```

## Configure Tales of Aneria Application

### Option A: Using ArgoCD UI

1. Navigate to https://localhost:8080
2. Click "New App"
3. Fill in:
   - **Application Name:** `toa-website`
   - **Project:** `default`
   - **Sync Policy:** `Automatic`
   - **Repository URL:** Your Git repo URL
   - **Path:** `.kubernetes/local`
   - **Cluster:** `https://kubernetes.default.svc`
   - **Namespace:** `toa-local`
4. Click "Create"

### Option B: Using ArgoCD CLI

```powershell
argocd app create toa-website `
  --repo https://github.com/YOUR_USERNAME/toa-website.git `
  --path .kubernetes/local `
  --dest-server https://kubernetes.default.svc `
  --dest-namespace toa-local `
  --sync-policy automated `
  --auto-prune `
  --self-heal
```

### Option C: Using Declarative YAML

Apply the Application manifest:

```powershell
kubectl apply -f .kubernetes/argocd/application.yaml
```

## ArgoCD Application Configuration

The application is configured with:
- **Auto-sync:** Automatically deploys changes from Git
- **Auto-prune:** Removes resources deleted from Git
- **Self-heal:** Reverts manual changes to match Git state
- **Sync waves:** Ensures proper deployment order (DB → App)

## Common Commands

```powershell
# View application status
argocd app list
argocd app get toa-website

# Sync application manually
argocd app sync toa-website

# View sync history
argocd app history toa-website

# Rollback to previous version
argocd app rollback toa-website

# Delete application (preserves resources)
argocd app delete toa-website --cascade=false

# Delete application and resources
argocd app delete toa-website
```

## Monitoring

```powershell
# Watch sync status
argocd app watch toa-website

# View application logs
kubectl logs -n toa-local -l app=toa-website -f

# View ArgoCD logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server -f
```

## GitOps Workflow

1. **Make changes** to Kubernetes manifests in `.kubernetes/local/`
2. **Commit and push** to Git repository
3. **ArgoCD detects** changes automatically
4. **Auto-sync** deploys to cluster (if enabled)
5. **Monitor** via ArgoCD UI or CLI

## Sync Waves

Our manifests use sync waves to control deployment order:

- **Wave 0:** Namespace, ConfigMaps, Secrets
- **Wave 1:** Database (PostgreSQL), Redis
- **Wave 2:** Application deployment
- **Wave 3:** Services
- **Wave 4:** Seed jobs

## Best Practices

### For Development
- Use manual sync for local development
- Enable auto-prune with caution
- Use `--cascade=false` when deleting apps during development

### For Production
- Enable auto-sync with auto-prune and self-heal
- Use sync windows for controlled deployments
- Enable notifications (Slack, email, etc.)
- Implement RBAC for team access

## Troubleshooting

### Application OutOfSync
```powershell
# View differences
argocd app diff toa-website

# Force sync
argocd app sync toa-website --force
```

### Sync Fails
```powershell
# View sync logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-application-controller

# Check resource status
kubectl get all -n toa-local
```

### Reset ArgoCD Admin Password
```powershell
# Generate new password
kubectl -n argocd patch secret argocd-secret -p '{"stringData": {"admin.password": "'$(htpasswd -bnBC 10 "" YOUR_NEW_PASSWORD | tr -d ':\n')'"}}'
```

## Cleanup

```powershell
# Delete application
argocd app delete toa-website

# Uninstall ArgoCD
kubectl delete namespace argocd
```

## Resources

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [GitOps Principles](https://opengitops.dev/)
- [ArgoCD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/)

# 🐳 Docker Deployment Guide

This guide covers containerized deployment of the Tales of Aneria website using Docker.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- PostgreSQL database (or use included docker-compose database)

### Local Development with Docker

1. **Clone and setup environment**
```bash
git clone <repository>
cd toa-website
cp .env.docker .env
```

2. **Configure environment variables**
Edit `.env` with your actual values:
- Database credentials
- API keys (YouTube, etc.)
- Session secret

3. **Start with docker-compose**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

4. **Access the application**
- Website: http://localhost:5000
- Health check: http://localhost:5000/api/health

## 🏭 Production Deployment

### Build Production Image

```bash
# Build the image
docker build -t toa-website:latest .

# Tag for registry
docker tag toa-website:latest your-registry/toa-website:latest

# Push to registry
docker push your-registry/toa-website:latest
```

### Run Production Container

```bash
docker run -d \
  --name toa-website \
  --restart unless-stopped \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e SESSION_SECRET=your-secret \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  -e YOUTUBE_API_KEY=your-key \
  -e VITE_YOUTUBE_PLAYLIST_ID=your-playlist-id \
  -e VITE_PODCAST_FEED_URL=your-rss-url \
  -v /app/cache:/app/server/cache \
  toa-website:latest
```

### Using External Database

For production, use a managed PostgreSQL service:

**Option 1: Neon (Serverless)**
```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
```

**Option 2: Supabase**
```bash
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
```

**Option 3: Railway**
```bash
DATABASE_URL=postgresql://postgres:pass@containers-us-west-xxx.railway.app:5432/railway
```

## ⚙️ Configuration

### Environment Variables

All environment variables can be passed via:

1. **Docker CLI** (`-e` flag)
2. **Docker Compose** (`.env` file)
3. **Kubernetes** (ConfigMaps/Secrets)
4. **Cloud platforms** (AWS ECS Task Definitions, etc.)

See `.env.example` for full list of variables.

### Required Variables

```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=random-secret
ALLOWED_ORIGINS=https://yourdomain.com
YOUTUBE_API_KEY=your-key
VITE_YOUTUBE_PLAYLIST_ID=your-playlist-id
VITE_PODCAST_FEED_URL=your-rss-url
```

### Volume Mounts

The application uses a persistent volume for caching:

```bash
# Named volume (recommended)
docker run -v cache-data:/app/server/cache ...

# Host directory
docker run -v /path/on/host:/app/server/cache ...
```

## 🔒 Security Features

### Multi-stage Build
- Minimal production image size
- No dev dependencies in production
- Reduced attack surface

### Non-root User
- Runs as `expressjs` user (UID 1001)
- No root privileges in container

### Security Hardening
- Alpine Linux base (minimal OS)
- Regular security updates
- dumb-init for proper signal handling
- Health checks for container orchestration

### Network Security
- CORS protection configured
- Helmet.js security headers
- Rate limiting enabled
- Session security

## 🏥 Health Checks

The container includes built-in health checks:

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' toa-website

# View health logs
docker inspect --format='{{json .State.Health}}' toa-website | jq
```

Health endpoint: `http://localhost:5000/api/health`

## 🐛 Troubleshooting

### Container won't start

1. **Check logs**
```bash
docker logs toa-website
```

2. **Verify environment variables**
```bash
docker exec toa-website env
```

3. **Test database connection**
```bash
docker exec toa-website node -e "console.log(process.env.DATABASE_URL)"
```

### Permission issues

If you see permission errors with cache directory:

```bash
# Fix permissions on host
chmod -R 755 /path/to/cache

# Or use named volume instead
docker volume create cache-data
```

### Build failures

1. **Clean build cache**
```bash
docker build --no-cache -t toa-website:latest .
```

2. **Check Node.js version**
Ensure you're using Node 20+

3. **Verify package.json**
```bash
npm install
npm run build
```

### Database connection issues

1. **Test connection**
```bash
docker exec -it toa-website sh
apk add postgresql-client
psql $DATABASE_URL
```

2. **Check network**
```bash
docker network inspect app-network
```

3. **Verify DATABASE_URL format**
```
postgresql://user:password@host:port/database?sslmode=require
```

## 📦 Deployment Platforms

### AWS ECS/Fargate

```json
{
  "containerDefinitions": [{
    "name": "toa-website",
    "image": "your-registry/toa-website:latest",
    "portMappings": [{
      "containerPort": 5000,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "NODE_ENV", "value": "production"}
    ],
    "secrets": [
      {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
      {"name": "SESSION_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
    ],
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"]
    }
  }]
}
```

### Google Cloud Run

```bash
gcloud run deploy toa-website \
  --image gcr.io/your-project/toa-website:latest \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=database-url:latest \
  --set-secrets SESSION_SECRET=session-secret:latest
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: toa-website
spec:
  replicas: 3
  selector:
    matchLabels:
      app: toa-website
  template:
    metadata:
      labels:
        app: toa-website
    spec:
      containers:
      - name: toa-website
        image: your-registry/toa-website:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        envFrom:
        - secretRef:
            name: toa-secrets
        volumeMounts:
        - name: cache
          mountPath: /app/server/cache
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 10
      volumes:
      - name: cache
        persistentVolumeClaim:
          claimName: toa-cache
```

### Railway

1. Create new project
2. Add PostgreSQL service
3. Deploy from GitHub
4. Set environment variables
5. Railway auto-detects Dockerfile

### Render

1. Create new Web Service
2. Connect repository
3. Use Docker runtime
4. Set environment variables
5. Deploy

## 🔧 Advanced Configuration

### Custom Build Args

```dockerfile
# Build with custom Node version
docker build --build-arg NODE_VERSION=20.10.0 -t toa-website:latest .
```

### Multi-architecture Builds

```bash
# Build for ARM and AMD64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t toa-website:latest \
  --push .
```

### Resource Limits

```bash
docker run -d \
  --memory="512m" \
  --cpus="1.0" \
  toa-website:latest
```

## 📊 Monitoring

### Container Metrics

```bash
# Real-time stats
docker stats toa-website

# Detailed info
docker inspect toa-website
```

### Application Logs

```bash
# Follow logs
docker logs -f toa-website

# Last 100 lines
docker logs --tail 100 toa-website

# With timestamps
docker logs -t toa-website
```

## 🔄 Updates and Rollbacks

### Rolling Update

```bash
# Pull new image
docker pull your-registry/toa-website:latest

# Stop old container
docker stop toa-website

# Remove old container
docker rm toa-website

# Start new container
docker run -d --name toa-website ...
```

### With docker-compose

```bash
# Pull and restart
docker-compose pull
docker-compose up -d

# Specific service
docker-compose up -d --no-deps app
```

## 🎯 Best Practices

1. **Use specific image tags** (not `latest` in production)
2. **Implement health checks** for all deployments
3. **Use secrets management** for sensitive data
4. **Set resource limits** to prevent resource exhaustion
5. **Monitor logs and metrics** continuously
6. **Keep base images updated** for security patches
7. **Use multi-stage builds** to minimize image size
8. **Run as non-root user** always
9. **Scan images for vulnerabilities** regularly
10. **Implement backup strategy** for persistent data

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Best Practices for Node.js in Docker](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [OWASP Docker Security](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

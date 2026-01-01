# ============================================
# Multi-stage Dockerfile for Tales of Aneria
# Production-ready with enterprise security hardening
# ============================================

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Add metadata labels
LABEL org.opencontainers.image.source="https://github.com/your-org/toa-website"
LABEL org.opencontainers.image.description="Tales of Aneria - TTRPG Website"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="Tales of Aneria"
LABEL maintainer="talesofaneria@example.com"

# Install security updates and required packages
RUN apk upgrade --no-cache && \
    apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with clean slate
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

# Enable BuildKit caching
ENV BUILDKIT_INLINE_CACHE=1

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Use --prefer-offline for faster installs
RUN npm ci --ignore-scripts --prefer-offline

# Copy source code
COPY . .

# Build the application with optimizations
# Frontend (Vite) and Backend (esbuild)
ENV NODE_ENV=production
ENV VITE_BUILD_CACHE=true
RUN npm run build

# ============================================
# Stage 3: SBOM Generation (Software Bill of Materials)
# ============================================
FROM builder AS sbom

# Install CycloneDX for SBOM generation
RUN npm install -g @cyclonedx/cyclonedx-npm

# Generate SBOM in both JSON and XML formats
RUN cyclonedx-npm --output-file /app/sbom.json && \
    cyclonedx-npm --output-format XML --output-file /app/sbom.xml

# ============================================
# Stage 4: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

# Add metadata
LABEL org.opencontainers.image.source="https://github.com/your-org/toa-website"
LABEL org.opencontainers.image.description="Tales of Aneria - Production Runtime"
LABEL org.opencontainers.image.licenses="MIT"

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Install security updates and production dependencies only
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    dumb-init \
    curl && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# Set to production with optimized Node.js flags
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512 --max-http-header-size=16384" \
    PORT=5000 \
    # Security hardening
    NODE_DISABLE_COLORS=1 \
    NPM_CONFIG_LOGLEVEL=error

# Copy production dependencies
COPY --from=deps --chown=expressjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=expressjs:nodejs /app/dist ./dist
COPY --from=builder --chown=expressjs:nodejs /app/package*.json ./

# Copy SBOM files
COPY --from=sbom --chown=expressjs:nodejs /app/sbom.json ./sbom.json
COPY --from=sbom --chown=expressjs:nodejs /app/sbom.xml ./sbom.xml

# Copy necessary config files
COPY --from=builder --chown=expressjs:nodejs /app/drizzle.config.ts ./

# Create cache directory with proper permissions
RUN mkdir -p /app/server/cache /tmp/app && \
    chown -R expressjs:nodejs /app/server/cache /tmp/app && \
    chmod 755 /app/server/cache && \
    chmod 1777 /tmp/app

# Remove unnecessary files for security
RUN rm -rf /tmp/* /var/tmp/* /root/.npm

# Security: Set file permissions to read-only where possible
RUN chmod -R 555 /app/node_modules /app/dist && \
    chmod 444 /app/package*.json /app/drizzle.config.ts /app/sbom.* && \
    chmod 755 /app

# Switch to non-root user
USER expressjs

# Expose port
EXPOSE 5000

# Health check with updated endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/alive || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application with production optimizations
CMD ["node", "--enable-source-maps", "dist/index.js"]

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
# Use --prefer-offline for faster installs with build cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --prefer-offline

# Copy only necessary source files for build
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY index.ts ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY drizzle.config.ts ./

# Build the application with optimizations
# Frontend (Vite) and Backend (esbuild)
ENV NODE_ENV=production
ENV VITE_BUILD_CACHE=true
RUN --mount=type=cache,target=/app/.vite \
    npm run build && \
    # Remove source maps from production build
    find dist -name "*.map" -type f -delete && \
    # Remove TypeScript files
    find dist -name "*.ts" -type f -delete

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
# Stage 4: Production Dependencies Pruning
# ============================================
FROM node:20-alpine AS prod-deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies with optimizations
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts --prefer-offline && \
    npm cache clean --force && \
    # Remove unnecessary files from node_modules
    find node_modules -name "*.md" -delete && \
    find node_modules -name "*.ts" -not -name "*.d.ts" -delete && \
    find node_modules -name "LICENSE*" -delete && \
    find node_modules -name "CHANGELOG*" -delete && \
    find node_modules -name "*.map" -delete && \
    find node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true && \
    find node_modules -name "*.test.js" -delete && \
    find node_modules -name "*.spec.js" -delete

# ============================================
# Stage 5: Runner (Production) - Distroless-inspired minimal image
# ============================================
FROM node:20-alpine AS runner

# Add metadata
LABEL org.opencontainers.image.source="https://github.com/your-org/toa-website"
LABEL org.opencontainers.image.description="Tales of Aneria - Production Runtime"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.vendor="Tales of Aneria"

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Install ONLY critical runtime dependencies
# Minimize attack surface by installing minimal packages
RUN apk upgrade --no-cache && \
    apk add --no-cache \
    dumb-init=1.2.5-r3 \
    curl=8.11.1-r0 \
    ca-certificates && \
    # Remove package manager to prevent runtime modifications
    apk del apk-tools && \
    rm -rf /var/cache/apk/* /tmp/* /var/tmp/* /root/.npm

WORKDIR /app

# Set to production with optimized Node.js flags
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512 --max-http-header-size=16384 --no-warnings" \
    PORT=5000 \
    # Security hardening
    NODE_DISABLE_COLORS=1 \
    NPM_CONFIG_LOGLEVEL=error \
    # Disable DNS caching issues
    UV_USE_IO_URING=0

# Copy pruned production dependencies
COPY --from=prod-deps --chown=expressjs:nodejs /app/node_modules ./node_modules

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

# Security: Set file permissions to read-only where possible
RUN chmod -R 555 /app/node_modules /app/dist && \
    chmod 444 /app/package*.json /app/drizzle.config.ts /app/sbom.* && \
    chmod 755 /app

# Switch to non-root user
USER expressjs

# Expose port
EXPOSE 5000

# Health check with comprehensive monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application with production optimizations
CMD ["node", "--enable-source-maps", "dist/index.js"]

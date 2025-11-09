# ==========================================
# Election Management System - Backend
# Multi-stage Docker Build
# ==========================================

# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:18-alpine AS dependencies

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files explicitly (ensures lockfile is present)
COPY backend/package.json ./package.json
COPY backend/package-lock.json ./package-lock.json
COPY backend/prisma ./prisma/

# Install all dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copy source code
COPY backend/. .

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# ==========================================
# Stage 3: Production
# ==========================================
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install runtime dependencies and build tools for native modules
# openssl-dev provides libssl.so.3; install OpenSSL 1.1 compatibility libraries from Alpine 3.18 (community repo)
RUN apk add --no-cache dumb-init curl python3 make g++ openssl-dev && \
    apk add --no-cache \
      --repository=https://dl-cdn.alpinelinux.org/alpine/v3.18/main \
      --repository=https://dl-cdn.alpinelinux.org/alpine/v3.18/community \
      openssl1.1-compat

# Copy package files first
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Install production dependencies (this will rebuild native modules for the correct arch)
# Use --ignore-scripts to skip prepare/husky hooks, then rebuild native modules
RUN npm ci --only=production --ignore-scripts && \
    npm install --no-save prisma && \
    npm rebuild bcrypt --build-from-source && \
    npm rebuild sharp --build-from-source && \
    npm cache clean --force

# Copy prisma and generate client
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
# Generate Prisma client for linux-musl-arm64-openssl-3.0.x (Alpine Linux with OpenSSL 3)
ENV PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x
RUN npx prisma generate

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Remove build tools to reduce image size (keep openssl-dev for Prisma runtime)
RUN apk del python3 make g++

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run migrations, seed (first deploy), then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run prisma:seed && node dist/server.js"]

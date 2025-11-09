# ==========================================
# Election Management System - Frontend
# Multi-stage Docker Build
# ==========================================

# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:20-alpine AS dependencies

ARG APP_DIR=frontend

WORKDIR /app

# Copy package files
COPY ${APP_DIR}/package.json ./package.json
COPY ${APP_DIR}/package-lock.json ./package-lock.json

# Install dependencies
RUN npm ci

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:20-alpine AS builder

ARG APP_DIR=frontend

WORKDIR /app

# Build argument for API URL
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY ${APP_DIR}/ .

# Build application
RUN npm run build

# ==========================================
# Stage 3: Production
# ==========================================
FROM nginx:alpine AS production

ARG APP_DIR=frontend

# Copy custom nginx config
COPY ${APP_DIR}/deployment/nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Ensure proper permissions (master runs as root, workers drop to nginx user)
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

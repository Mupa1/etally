# ==========================================
# Election Management System - Frontend
# Multi-stage Docker Build
# ==========================================

# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY ./package*.json ./

# Install dependencies
RUN npm ci

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Build argument for API URL
ARG VITE_API_URL=http://localhost:3000/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build application
RUN npm run build

# ==========================================
# Stage 3: Production
# ==========================================
FROM nginx:alpine AS production

# Copy custom nginx config
COPY ./deployment/nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Set permissions for existing nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

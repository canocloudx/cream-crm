# ============================================
# C.R.E.A.M. CRM - Production Dockerfile
# Multi-stage build for minimal image size
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder (for any build steps)
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# If you add TypeScript later:
# RUN npm run build

# Stage 3: Production Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Install runtime dependencies only
RUN apk add --no-cache tini curl

# Copy application files
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs server.js ./
COPY --chown=nodejs:nodejs wallet-*.js ./
COPY --chown=nodejs:nodejs apns-push.js ./
COPY --chown=nodejs:nodejs api.js ./
COPY --chown=nodejs:nodejs database ./database
COPY --chown=nodejs:nodejs certs ./certs
COPY --chown=nodejs:nodejs pass-template ./pass-template

# Create necessary directories
RUN mkdir -p logs && chown nodejs:nodejs logs

# Security: Run as non-root
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/stats || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "server.js"]

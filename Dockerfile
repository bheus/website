# Multi-stage build for Gatsby site optimized for Raspberry Pi (ARM architecture)

# Stage 1: Build the Gatsby site
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm install && \
    npm cache clean --force

# Copy source files
COPY . .

# Disable Gatsby telemetry
ENV GATSBY_TELEMETRY_DISABLED=1

# Increase Node.js memory limit for build (important for Gatsby)
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build the Gatsby site
RUN npm run build

# Stage 2: Serve static files and relay contact messages
FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev && npm cache clean --force
COPY server/index.js ./server/index.js
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1

USER node
CMD ["node", "server/index.js"]

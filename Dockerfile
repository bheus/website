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

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built site from builder stage
COPY --from=builder /app/public /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]


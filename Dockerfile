# Multi-stage build for the static site, targeting arm64 (Raspberry Pi)

# Stage 1: Build the static site
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci && npm cache clean --force

COPY . .

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

# Angular Stack Dockerfile
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build for production
RUN bun run build

# Production stage with nginx
FROM nginx:alpine

# Copy built assets to nginx
COPY --from=builder /app/dist/social-audit-angular/browser /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4200/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
